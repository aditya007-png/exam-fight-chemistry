import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ProctoringEventType,
  ProctoringLogEntry,
  EventSeverity,
  CameraStatus,
  FaceDetectionStatus,
  GazeStatus,
  EyeTrackingStatus,
  UnifiedProctoringState,
} from '../types/proctoring';
import { analyzeVideoFrame, FaceLandmarkResult } from '../lib/visionEngine';

interface UseProctoringOptions {
  enabled: boolean;
  maxStrikes?: number;
  criticalTimeoutSeconds?: number;
  eyesClosedThresholdMs?: number;
  lookingAwayThresholdMs?: number;
  onExamTerminated?: (reason: string, violationType: string) => void;
  onMaxStrikesReached?: () => void;
}

export const useProctoring = ({
  enabled = true,
  maxStrikes: _maxStrikes = 3,
  criticalTimeoutSeconds = 15,
  eyesClosedThresholdMs = 2800,
  lookingAwayThresholdMs = 3500,
  onExamTerminated,
  onMaxStrikesReached: _onMaxStrikesReached,
}: UseProctoringOptions) => {
  // -------------------------------------------------------------
  // Centralized Global Proctoring State
  // -------------------------------------------------------------
  const [proctoringState, setProctoringState] = useState<UnifiedProctoringState>({
    status: 'normal',
    cameraStatus: 'offline',
    microphoneStatus: 'offline',
    faceStatus: 'detected',
    eyeStatus: 'open',
    gazeStatus: 'forward',
    headPose: { yaw: 0, pitch: 0 },
    faceCount: 1,
    glassesDetected: false,
    confidence: 0.95,
    activeViolation: null,
    violationStartedAt: null,
    remainingSeconds: criticalTimeoutSeconds,
    elapsedSeconds: 0,
    strikeCount: 0,
  });

  const [activeMediaStream, setActiveMediaStream] = useState<MediaStream | null>(null);
  const [events, setEvents] = useState<ProctoringLogEntry[]>([]);
  const [overrideScenario, setOverrideScenario] = useState<string | null>(null);

  // Internal references
  const activeMediaStreamRef = useRef<MediaStream | null>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement | null>(null);
  const isTerminatedRef = useRef<boolean>(false);
  const unifiedTimerStartRef = useRef<number | null>(null);
  const eyesClosedStartRef = useRef<number | null>(null);
  const lookingAwayStartRef = useRef<number | null>(null);
  const isFullscreenRef = useRef<boolean>(false);
  const isDocumentHiddenRef = useRef<boolean>(false);

  const logEvent = useCallback(
    (
      eventType: ProctoringEventType,
      severity: EventSeverity,
      description: string,
      durationSeconds?: number,
      metadata?: Record<string, any>
    ) => {
      const now = new Date();
      const newEntry: ProctoringLogEntry = {
        id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: now.toISOString(),
        relativeTimeFormatted: now.toLocaleTimeString(),
        eventType,
        severity,
        description,
        durationSeconds,
        metadata,
      };

      setEvents((prev) => [...prev, newEntry]);
    },
    []
  );

  // Trigger Automatic 15-Second Examination Termination
  const triggerTermination = useCallback(
    (reason: string, violationType: string) => {
      if (isTerminatedRef.current) return;
      isTerminatedRef.current = true;

      logEvent(
        'EXAM_TERMINATED',
        'critical',
        `Exam Automatically Terminated: ${reason} (Exceeded 15.0s continuous threshold).`,
        15
      );

      setProctoringState((prev) => ({
        ...prev,
        status: 'terminated',
      }));

      if (onExamTerminated) {
        onExamTerminated(reason, violationType);
      }
    },
    [logEvent, onExamTerminated]
  );

  // -------------------------------------------------------------
  // ONE Unified Centralized 15-Second Timer Controller
  // Evaluates priority of violations without creating duplicate timers
  // -------------------------------------------------------------
  const updateUnifiedViolationState = useCallback(
    (params: {
      cameraStatus: CameraStatus;
      micActive: boolean;
      faceStatus: FaceDetectionStatus;
      eyeStatus: EyeTrackingStatus;
      gazeStatus: GazeStatus;
      headPose: { yaw: number; pitch: number };
      faceCount: number;
      glassesDetected: boolean;
      confidence: number;
      isFullscreen: boolean;
      isTabVisible: boolean;
    }) => {
      if (isTerminatedRef.current || !enabled) return;

      const now = Date.now();

      // Determine highest-priority critical violation (if any)
      let criticalViolation: {
        type: 'camera_disconnected' | 'face_not_detected' | 'multiple_faces' | 'fullscreen_exit' | 'mic_disconnected' | 'window_inactive';
        title: string;
        description: string;
      } | null = null;

      // 1. Camera Unavailable
      if (params.cameraStatus !== 'active') {
        criticalViolation = {
          type: 'camera_disconnected',
          title: 'Camera Disconnected',
          description: 'Please reconnect your camera to continue examination.',
        };
      }
      // 2. Face Completely Missing
      else if (params.faceStatus === 'not_detected') {
        criticalViolation = {
          type: 'face_not_detected',
          title: 'Face Not Detected',
          description: 'Please position your face clearly in front of the camera.',
        };
      }
      // 3. Multiple Faces
      else if (params.faceStatus === 'multiple_faces' || params.faceCount > 1) {
        criticalViolation = {
          type: 'multiple_faces',
          title: 'Multiple Faces Detected',
          description: 'Only the examinee should be visible in the camera frame.',
        };
      }
      // 4. Fullscreen Exited
      else if (!params.isFullscreen) {
        criticalViolation = {
          type: 'fullscreen_exit',
          title: 'Full-Screen Mode Required',
          description: 'Return to full-screen mode to continue your examination.',
        };
      }
      // 5. Window Inactive / Tab Switch
      else if (!params.isTabVisible) {
        criticalViolation = {
          type: 'window_inactive',
          title: 'Examination Window Inactive',
          description: 'Return to the examination window immediately.',
        };
      }
      // 6. Microphone Unavailable
      else if (!params.micActive) {
        criticalViolation = {
          type: 'mic_disconnected',
          title: 'Microphone Disconnected',
          description: 'Please restore microphone connection.',
        };
      }

      if (criticalViolation) {
        // Start or continue the SINGLE UNIFIED 15-SECOND TIMER
        if (!unifiedTimerStartRef.current) {
          unifiedTimerStartRef.current = now;
        }

        const elapsedMs = now - unifiedTimerStartRef.current;
        const elapsedSec = Math.floor(elapsedMs / 1000);
        const remainingSec = Math.max(0, criticalTimeoutSeconds - elapsedSec);

        setProctoringState((prev) => ({
          ...prev,
          status: 'critical',
          cameraStatus: params.cameraStatus,
          microphoneStatus: params.micActive ? 'active' : 'offline',
          faceStatus: params.faceStatus,
          eyeStatus: params.eyeStatus,
          gazeStatus: params.gazeStatus,
          headPose: params.headPose,
          faceCount: params.faceCount,
          glassesDetected: params.glassesDetected,
          confidence: params.confidence,
          activeViolation: {
            ...criticalViolation!,
            isCritical: true,
          },
          violationStartedAt: unifiedTimerStartRef.current,
          remainingSeconds: remainingSec,
          elapsedSeconds: elapsedSec,
        }));

        // If continuous duration reaches 15.0 seconds -> TERMINATE EXAMINATION
        if (elapsedSec >= criticalTimeoutSeconds) {
          triggerTermination(criticalViolation.title, criticalViolation.type);
        }
      } else {
        // All critical conditions normal -> RESET TIMER IMMEDIATELY TO 0
        if (unifiedTimerStartRef.current) {
          const duration = Math.round((now - unifiedTimerStartRef.current) / 1000);
          logEvent(
            'FACE_DETECTED',
            'success',
            `Proctoring condition restored after ${duration}s. Unified timer reset to 0.`,
            duration
          );
        }
        unifiedTimerStartRef.current = null;

        const isWarning = params.gazeStatus === 'looking_away' || params.eyeStatus === 'closed' || params.eyeStatus === 'unclear';

        setProctoringState((prev) => ({
          ...prev,
          status: isWarning ? 'warning' : 'normal',
          cameraStatus: params.cameraStatus,
          microphoneStatus: params.micActive ? 'active' : 'offline',
          faceStatus: params.faceStatus,
          eyeStatus: params.eyeStatus,
          gazeStatus: params.gazeStatus,
          headPose: params.headPose,
          faceCount: params.faceCount,
          glassesDetected: params.glassesDetected,
          confidence: params.confidence,
          activeViolation: null,
          violationStartedAt: null,
          remainingSeconds: criticalTimeoutSeconds,
          elapsedSeconds: 0,
        }));
      }
    },
    [enabled, criticalTimeoutSeconds, triggerTermination, logEvent]
  );

  // Initialize Continuous Camera & Microphone Stream
  const startContinuousProctoringMedia = useCallback(async (): Promise<boolean> => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } },
          audio: true,
        });

        activeMediaStreamRef.current = stream;
        setActiveMediaStream(stream);

        if (!hiddenVideoRef.current) {
          const v = document.createElement('video');
          v.autoplay = true;
          v.playsInline = true;
          v.muted = true;
          hiddenVideoRef.current = v;
        }
        hiddenVideoRef.current.srcObject = stream;
        hiddenVideoRef.current.play().catch(() => {});

        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];

        if (videoTrack) {
          videoTrack.onended = () => {
            logEvent('CAMERA_DISCONNECTED', 'critical', 'Candidate webcam stream was disconnected.');
          };
        }

        if (audioTrack) {
          audioTrack.onended = () => {
            logEvent('MICROPHONE_DISCONNECTED', 'critical', 'Candidate microphone stream was disconnected.');
          };
        }

        return true;
      }
      return false;
    } catch (err: any) {
      console.warn('Proctoring getUserMedia error:', err);
      return false;
    }
  }, [logEvent]);

  // Request Fullscreen
  const enterFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        isFullscreenRef.current = true;
        logEvent('FULLSCREEN_ENTER', 'info', 'Candidate entered fullscreen examination environment.');
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  }, [logEvent]);

  // Clean Hardware Stream Teardown
  const cleanupProctoringMedia = useCallback(() => {
    if (activeMediaStreamRef.current) {
      activeMediaStreamRef.current.getTracks().forEach((t) => t.stop());
      activeMediaStreamRef.current = null;
    }
    if (hiddenVideoRef.current) {
      hiddenVideoRef.current.srcObject = null;
    }
    setActiveMediaStream(null);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // -------------------------------------------------------------
  // Continuous Real-Time Vision & Landmark Processing Loop
  // -------------------------------------------------------------
  useEffect(() => {
    if (!enabled || isTerminatedRef.current) return;

    const interval = setInterval(async () => {
      // If manual test scenario override is active (Tests 1 - 12)
      if (overrideScenario) {
        dispatchTestScenario(overrideScenario);
        return;
      }

      const hasActiveStream = !!activeMediaStreamRef.current && activeMediaStreamRef.current.active;
      const cameraStatus: CameraStatus = hasActiveStream ? 'active' : 'offline';
      const micActive = hasActiveStream && activeMediaStreamRef.current!.getAudioTracks().some((t) => t.readyState === 'live');
      const isFullscreen = !!document.fullscreenElement;
      const isTabVisible = !document.hidden;

      isFullscreenRef.current = isFullscreen;
      isDocumentHiddenRef.current = document.hidden;

      if (!hasActiveStream || cameraStatus !== 'active') {
        updateUnifiedViolationState({
          cameraStatus: 'offline',
          micActive,
          faceStatus: 'not_detected',
          eyeStatus: 'closed',
          gazeStatus: 'forward',
          headPose: { yaw: 0, pitch: 0 },
          faceCount: 0,
          glassesDetected: false,
          confidence: 0,
          isFullscreen,
          isTabVisible,
        });
        return;
      }

      if (!hiddenVideoRef.current) return;

      const result: FaceLandmarkResult = await analyzeVideoFrame(hiddenVideoRef.current);
      const now = Date.now();

      // Head Pose / Looking Away Logic (Tolerant of small movements)
      let gazeStatus: GazeStatus = 'forward';
      if (result.headPose.isLookingAway) {
        if (!lookingAwayStartRef.current) lookingAwayStartRef.current = now;
        const awayDuration = now - lookingAwayStartRef.current;
        if (awayDuration >= lookingAwayThresholdMs) {
          gazeStatus = 'looking_away';
          const dur = Math.round(awayDuration / 1000);
          logEvent('LOOKING_AWAY', 'warning', `Candidate looking significantly away (${dur}s).`, dur);
        }
      } else {
        if (lookingAwayStartRef.current) {
          logEvent('LOOKING_FORWARD', 'info', 'Candidate looking forward at examination screen.');
        }
        lookingAwayStartRef.current = null;
        gazeStatus = 'forward';
      }

      // Eye Openness / Glasses Glare Logic
      let eyeStatus: EyeTrackingStatus = 'open';
      if (result.eyes.isUnclear) {
        eyeStatus = 'unclear';
      } else if (!result.eyes.eyesOpen) {
        if (!eyesClosedStartRef.current) eyesClosedStartRef.current = now;
        const closedDuration = now - eyesClosedStartRef.current;
        if (closedDuration >= eyesClosedThresholdMs) {
          eyeStatus = 'closed';
          const dur = Math.round(closedDuration / 1000);
          logEvent('EYES_CLOSED', 'warning', `Sustained eye closure detected (${dur}s).`, dur);
        }
      } else {
        eyesClosedStartRef.current = null;
        eyeStatus = 'open';
      }

      const faceStatus: FaceDetectionStatus = !result.faceDetected
        ? 'not_detected'
        : result.faceCount > 1
        ? 'multiple_faces'
        : 'detected';

      updateUnifiedViolationState({
        cameraStatus: 'active',
        micActive,
        faceStatus,
        eyeStatus,
        gazeStatus,
        headPose: { yaw: result.headPose.yaw, pitch: result.headPose.pitch },
        faceCount: result.faceCount,
        glassesDetected: result.glassesDetected,
        confidence: result.confidence,
        isFullscreen,
        isTabVisible,
      });
    }, 250);

    return () => clearInterval(interval);
  }, [
    enabled,
    overrideScenario,
    eyesClosedThresholdMs,
    lookingAwayThresholdMs,
    updateUnifiedViolationState,
    logEvent,
  ]);

  // -------------------------------------------------------------
  // Test Scenario Dispatcher (For Scenarios 1 through 12)
  // -------------------------------------------------------------
  const dispatchTestScenario = (sc: string) => {
    switch (sc) {
      case 'TEST_1': // Normal face -> 🟢 Face, 🟢 Looking Forward
        updateUnifiedViolationState({
          cameraStatus: 'active',
          micActive: true,
          faceStatus: 'detected',
          eyeStatus: 'open',
          gazeStatus: 'forward',
          headPose: { yaw: 0, pitch: 0 },
          faceCount: 1,
          glassesDetected: false,
          confidence: 0.98,
          isFullscreen: true,
          isTabVisible: true,
        });
        break;

      case 'TEST_2': // Student leaves frame -> 🔴 Face Not Detected -> 15s timer
      case 'TEST_4':
      case 'TEST_11': // Blank wall
        updateUnifiedViolationState({
          cameraStatus: 'active',
          micActive: true,
          faceStatus: 'not_detected',
          eyeStatus: 'closed',
          gazeStatus: 'forward',
          headPose: { yaw: 0, pitch: 0 },
          faceCount: 0,
          glassesDetected: false,
          confidence: 0.1,
          isFullscreen: true,
          isTabVisible: true,
        });
        break;

      case 'TEST_3': // Student returns -> 🟢 Face Detected -> Reset timer to 0
      case 'TEST_6': // Looks back at screen -> 🟢 Looking Forward
        updateUnifiedViolationState({
          cameraStatus: 'active',
          micActive: true,
          faceStatus: 'detected',
          eyeStatus: 'open',
          gazeStatus: 'forward',
          headPose: { yaw: 0, pitch: 0 },
          faceCount: 1,
          glassesDetected: false,
          confidence: 0.96,
          isFullscreen: true,
          isTabVisible: true,
        });
        break;

      case 'TEST_5': // Student looks left/right sustained -> 🟠 Looking Away (Warning only)
        updateUnifiedViolationState({
          cameraStatus: 'active',
          micActive: true,
          faceStatus: 'detected',
          eyeStatus: 'open',
          gazeStatus: 'looking_away',
          headPose: { yaw: 34, pitch: 5 },
          faceCount: 1,
          glassesDetected: false,
          confidence: 0.94,
          isFullscreen: true,
          isTabVisible: true,
        });
        break;

      case 'TEST_7': // Student blinks -> No violation
        updateUnifiedViolationState({
          cameraStatus: 'active',
          micActive: true,
          faceStatus: 'detected',
          eyeStatus: 'open',
          gazeStatus: 'forward',
          headPose: { yaw: 0, pitch: 0 },
          faceCount: 1,
          glassesDetected: false,
          confidence: 0.95,
          isFullscreen: true,
          isTabVisible: true,
        });
        break;

      case 'TEST_8': // Student closes eyes extended period -> 🟠 Eyes Closed (Warning only)
        updateUnifiedViolationState({
          cameraStatus: 'active',
          micActive: true,
          faceStatus: 'detected',
          eyeStatus: 'closed',
          gazeStatus: 'forward',
          headPose: { yaw: 0, pitch: 0 },
          faceCount: 1,
          glassesDetected: false,
          confidence: 0.93,
          isFullscreen: true,
          isTabVisible: true,
        });
        break;

      case 'TEST_9': // Student wears glasses -> Face & Eyes detected, Glasses: true
        updateUnifiedViolationState({
          cameraStatus: 'active',
          micActive: true,
          faceStatus: 'detected',
          eyeStatus: 'open',
          gazeStatus: 'forward',
          headPose: { yaw: 0, pitch: 0 },
          faceCount: 1,
          glassesDetected: true,
          confidence: 0.97,
          isFullscreen: true,
          isTabVisible: true,
        });
        break;

      case 'TEST_10': // 2 people appear -> 🔴 Multiple Faces -> 15s timer
        updateUnifiedViolationState({
          cameraStatus: 'active',
          micActive: true,
          faceStatus: 'multiple_faces',
          eyeStatus: 'open',
          gazeStatus: 'forward',
          headPose: { yaw: 0, pitch: 0 },
          faceCount: 2,
          glassesDetected: false,
          confidence: 0.95,
          isFullscreen: true,
          isTabVisible: true,
        });
        break;

      case 'TEST_12': // Camera disconnected -> 🔴 Camera Offline -> 15s timer
        updateUnifiedViolationState({
          cameraStatus: 'offline',
          micActive: true,
          faceStatus: 'not_detected',
          eyeStatus: 'closed',
          gazeStatus: 'forward',
          headPose: { yaw: 0, pitch: 0 },
          faceCount: 0,
          glassesDetected: false,
          confidence: 0,
          isFullscreen: true,
          isTabVisible: true,
        });
        break;

      default:
        break;
    }
  };

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      isFullscreenRef.current = isCurrentlyFullscreen;

      if (!isCurrentlyFullscreen && enabled) {
        logEvent('FULLSCREEN_EXIT', 'critical', 'Candidate exited full-screen mode.');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [enabled, logEvent]);

  // Tab switch & visibility listener (Immediate Submission / Termination)
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        logEvent('TAB_SWITCH', 'critical', 'Candidate switched tabs during active examination.');
        triggerTermination(
          'Tab Switch Detected — Examination Locked & Submitted. Instructor permission required to restart.',
          'tab_switch'
        );
      }
    };

    const handleWindowBlur = () => {
      // Optional subtle blur check if document loses focus
      if (document.hidden) {
        handleVisibilityChange();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [enabled, logEvent, triggerTermination]);

  return {
    proctoringState,
    activeMediaStream,
    events,
    overrideScenario,
    setOverrideScenario,
    startContinuousProctoringMedia,
    enterFullscreen,
    cleanupProctoringMedia,
    logEvent,
  };
};
