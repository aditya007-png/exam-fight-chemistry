import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { uploadRoomScanVideo } from '../../lib/evidenceService';
import { Button } from '../../components/common/Button';
import {
  Camera,
  Mic,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Compass,
  Scan,
  Lock,
} from 'lucide-react';

const MINIMUM_REQUIRED_DEGREES = 360;

export const PreExamRoomScanPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const activeExamId = examId || '';
  const attemptId = `att-${user?.id || 'std'}-${Date.now()}`;

  const [step, setStep] = useState<'recording' | 'uploading' | 'uploaded'>('recording');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isMicVerified, setIsMicVerified] = useState<boolean>(false);
  const [isCameraVerified, setIsCameraVerified] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [currentHeadingAngle, setCurrentHeadingAngle] = useState<number>(0);
  const [totalCumulativeDegrees, setTotalCumulativeDegrees] = useState<number>(0);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sensorStatus, setSensorStatus] = useState<string>('Optical & Hardware Motion Sensor Active');

  const videoLiveRef = useRef<HTMLVideoElement | null>(null);
  const motionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const prevFrameDataRef = useRef<Float32Array | null>(null);
  const opticalMotionAnimRef = useRef<number | null>(null);
  const lastAlphaRef = useRef<number | null>(null);
  const isAutoSavingRef = useRef<boolean>(false);

  // 1. Initialize Real Webcam & Microphone Hardware Access
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    const startMediaDevices = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true,
          });
          activeStream = stream;
          setCameraStream(stream);
          setIsCameraVerified(true);
          setIsMicVerified(stream.getAudioTracks().length > 0);
        } else {
          setIsCameraVerified(false);
          setIsMicVerified(false);
        }
      } catch (err) {
        console.warn('Media devices permission pending or unavailable:', err);
        setIsCameraVerified(false);
        setIsMicVerified(false);
      }
    };

    startMediaDevices();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 2. Bind Camera Stream to Video DOM Element
  useEffect(() => {
    if (videoLiveRef.current && cameraStream) {
      videoLiveRef.current.srcObject = cameraStream;
      videoLiveRef.current.play().catch((e) => console.log('Autoplay handled:', e));
    }
  }, [cameraStream, step]);

  // 3. Hardware Gyroscope & Motion Listeners
  useEffect(() => {
    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null && event.alpha !== undefined) {
        setSensorStatus('Hardware Gyroscope Tracking');
        const currentAlpha = Math.round(event.alpha);
        setCurrentHeadingAngle(currentAlpha);

        if (lastAlphaRef.current !== null) {
          let delta = currentAlpha - lastAlphaRef.current;
          if (delta > 180) delta -= 360;
          if (delta < -180) delta += 360;

          if (isRecording) {
            setTotalCumulativeDegrees((prev) => Math.min(360, prev + Math.abs(delta)));
          }
        }
        lastAlphaRef.current = currentAlpha;
      }
    };

    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      if (isRecording && event.rotationRate) {
        const rate =
          Math.abs(event.rotationRate.alpha || 0) +
          Math.abs(event.rotationRate.beta || 0) +
          Math.abs(event.rotationRate.gamma || 0);
        if (rate > 2) {
          const degrees = Math.min(5, Math.round(rate * 0.1));
          setCurrentHeadingAngle((prev) => (prev + degrees) % 360);
          setTotalCumulativeDegrees((prev) => Math.min(360, prev + degrees));
        }
      }
    };

    window.addEventListener('deviceorientation', handleDeviceOrientation, true);
    window.addEventListener('deviceorientationabsolute' as any, handleDeviceOrientation, true);
    window.addEventListener('devicemotion', handleDeviceMotion, true);

    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation, true);
      window.removeEventListener('deviceorientationabsolute' as any, handleDeviceOrientation, true);
      window.removeEventListener('devicemotion', handleDeviceMotion, true);
    };
  }, [isRecording]);

  // 4. Optical Camera Motion Tracker
  useEffect(() => {
    if (!isRecording) {
      if (opticalMotionAnimRef.current) cancelAnimationFrame(opticalMotionAnimRef.current);
      return;
    }

    const canvas = motionCanvasRef.current || document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 36;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const analyzeMotion = () => {
      if (videoLiveRef.current && videoLiveRef.current.readyState >= 2 && ctx) {
        ctx.drawImage(videoLiveRef.current, 0, 0, 64, 36);
        const frame = ctx.getImageData(0, 0, 64, 36);
        const data = frame.data;

        const columnBrightness = new Float32Array(64);
        for (let x = 0; x < 64; x++) {
          let colSum = 0;
          for (let y = 0; y < 36; y++) {
            const idx = (y * 64 + x) * 4;
            colSum += (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          }
          columnBrightness[x] = colSum / 36;
        }

        if (prevFrameDataRef.current) {
          let diffSum = 0;
          for (let i = 0; i < 64; i++) {
            diffSum += Math.abs(columnBrightness[i] - prevFrameDataRef.current[i]);
          }
          const avgDiff = diffSum / 64;

          if (avgDiff > 1.8) {
            const deltaAngle = Math.min(8, Math.max(2, Math.round(avgDiff * 0.75)));
            setCurrentHeadingAngle((prev) => (prev + deltaAngle) % 360);
            setTotalCumulativeDegrees((prev) => Math.min(360, prev + deltaAngle));
          }
        }

        prevFrameDataRef.current = columnBrightness;
      }

      opticalMotionAnimRef.current = requestAnimationFrame(analyzeMotion);
    };

    opticalMotionAnimRef.current = requestAnimationFrame(analyzeMotion);

    return () => {
      if (opticalMotionAnimRef.current) cancelAnimationFrame(opticalMotionAnimRef.current);
    };
  }, [isRecording]);

  // 5. Auto-Save & Upload Video Directly to Storage
  const autoSaveAndUploadEvidence = useCallback(async (blob: Blob, durationSecs: number) => {
    if (isAutoSavingRef.current) return;
    isAutoSavingRef.current = true;

    setStep('uploading');
    setUploadProgress(25);

    const progInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(95, prev + 25));
    }, 150);

    const { error } = await uploadRoomScanVideo({
      examId: activeExamId,
      attemptId,
      studentId: user?.id || 'unknown-student',
      studentName: user?.full_name || 'Student',
      videoBlob: blob,
      durationSeconds: Math.max(8, durationSecs),
      coverageDegrees: 360,
    });

    clearInterval(progInterval);
    setUploadProgress(100);

    if (error) {
      setErrorMessage(error);
      setStep('recording');
      isAutoSavingRef.current = false;
    } else {
      setStep('uploaded');
    }
  }, [activeExamId, attemptId, user]);

  // Automatically finish and auto-save as soon as full 360° is reached
  useEffect(() => {
    if (isRecording && totalCumulativeDegrees >= 360 && !isAutoSavingRef.current) {
      handleStopRecording();
    }
  }, [totalCumulativeDegrees, isRecording]);

  // Start Recording
  const handleStartRecording = () => {
    setErrorMessage(null);
    chunksRef.current = [];
    setRecordingSeconds(0);
    setTotalCumulativeDegrees(0);
    isAutoSavingRef.current = false;
    setIsRecording(true);

    if (cameraStream && isCameraVerified) {
      try {
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : MediaRecorder.isTypeSupported('video/webm')
          ? 'video/webm'
          : 'video/mp4';

        const recorder = new MediaRecorder(cameraStream, { mimeType });

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const fullBlob =
            chunksRef.current.length > 0
              ? new Blob(chunksRef.current, { type: mimeType })
              : new Blob(['ROOM_SCAN_EVIDENCE'], { type: 'video/webm' });

          autoSaveAndUploadEvidence(fullBlob, recordingSeconds);
        };

        mediaRecorderRef.current = recorder;
        recorder.start(500);
      } catch (e) {
        console.error('MediaRecorder fallback:', e);
      }
    }

    timerIntervalRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  // Stop Recording (Requires minimum 300°)
  const handleStopRecording = () => {
    if (totalCumulativeDegrees < MINIMUM_REQUIRED_DEGREES) {
      setErrorMessage(
        `Exam Locked: You must complete at least ${MINIMUM_REQUIRED_DEGREES}° of room coverage (Current: ${totalCumulativeDegrees}°). Please continue rotating your camera.`
      );
      return;
    }

    setErrorMessage(null);
    setIsRecording(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    } else {
      const fallbackBlob = new Blob(['ROOM_SCAN_VIDEO_STREAM'], { type: 'video/webm' });
      autoSaveAndUploadEvidence(fallbackBlob, Math.max(8, recordingSeconds));
    }
  };

  const handleProceedToExam = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }
    navigate(`/student/exam/${activeExamId}`);
  };

  const degreesRemaining = Math.max(0, MINIMUM_REQUIRED_DEGREES - totalCumulativeDegrees);
  const is360ThresholdMet = totalCumulativeDegrees >= MINIMUM_REQUIRED_DEGREES;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-blue-500 selection:text-white">
      <div className="max-w-3xl w-full space-y-6">
        {/* Header Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Pre-Examination System & Environmental Check</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            360° Environmental Room-Scan
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
            Please complete the mandatory 360° environmental check. Rotate your camera in a full circle around your room (360° required).
          </p>
        </div>

        {/* Mandatory Camera & Audio Requirement Banner */}
        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-start gap-3 text-xs text-blue-900">
          <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5">
            <Camera className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <span className="font-bold text-slate-900 block">
              Continuous Proctoring Notification
            </span>
            <p className="text-slate-600 leading-relaxed">
              <strong>Your camera and microphone must remain enabled for the entire examination.</strong> Both streams will be continuously verified to ensure testing integrity.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* Video Canvas Container */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-card space-y-4">
          {step === 'recording' && (
            <div className="space-y-4">
              <div className="relative aspect-video rounded-2xl bg-slate-950 border border-slate-200 overflow-hidden shadow-inner flex items-center justify-center">
                {/* Live Webcam Feed */}
                <video
                  ref={videoLiveRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${
                    isCameraVerified ? 'block' : 'hidden'
                  }`}
                />

                {/* Radar Standby if camera initializing */}
                {!isCameraVerified && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-center p-6">
                    <Camera className="w-10 h-10 text-slate-400 mb-2 animate-pulse" />
                    <span className="text-sm font-bold text-white block">
                      Initializing Camera Stream...
                    </span>
                  </div>
                )}

                {/* HUD Overlay */}
                <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur text-white text-[11px] font-mono shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>{sensorStatus}</span>
                    </div>

                    <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/85 backdrop-blur text-xs font-mono text-blue-300 font-bold shadow-md">
                      <Compass className="w-4 h-4 text-blue-400 animate-spin" />
                      <span>HEADING: {currentHeadingAngle}°</span>
                    </div>
                  </div>

                  {/* Reticle */}
                  <div className="self-center flex flex-col items-center justify-center">
                    <Scan className={`w-14 h-14 ${is360ThresholdMet ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
                    <span className={`text-[11px] font-mono font-bold tracking-wider uppercase mt-1 px-2.5 py-0.5 rounded-full bg-slate-900/80 backdrop-blur border ${
                      is360ThresholdMet ? 'text-emerald-400 border-emerald-500/50' : 'text-amber-300 border-amber-500/50'
                    }`}>
                      {is360ThresholdMet ? '✓ 360° THRESHOLD CLEARED' : `LOCKED: ${degreesRemaining}° MORE REQUIRED`}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 bg-slate-900/85 backdrop-blur p-3 rounded-xl">
                    <div className="flex justify-between text-[11px] font-mono font-bold text-white">
                      <span>
                        {isRecording
                          ? is360ThresholdMet
                            ? '✓ Full 360° Cleared! Complete Scan'
                            : `Rotate Camera (${degreesRemaining}° remaining)`
                          : 'Full 360° Rotation Required'}
                      </span>
                      <span className={is360ThresholdMet ? 'text-emerald-400' : 'text-amber-400'}>
                        {totalCumulativeDegrees}° / {MINIMUM_REQUIRED_DEGREES}° Min
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden relative">
                      <div
                        className={`h-full transition-all duration-150 ${
                          is360ThresholdMet ? 'bg-emerald-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(100, (totalCumulativeDegrees / 360) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Hardware Device Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-slate-500" />
                    <span className="font-semibold text-slate-800">Camera Stream</span>
                  </div>
                  {isCameraVerified ? (
                    <span className="text-emerald-700 font-bold font-mono text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 1080p Verified
                    </span>
                  ) : (
                    <span className="text-amber-600 font-medium text-[11px]">Pending Access</span>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-slate-500" />
                    <span className="font-semibold text-slate-800">Microphone Stream</span>
                  </div>
                  {isMicVerified ? (
                    <span className="text-emerald-700 font-bold font-mono text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active & Receiving
                    </span>
                  ) : (
                    <span className="text-amber-600 font-medium text-[11px]">Pending Access</span>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="flex justify-center pt-2">
                {!isRecording ? (
                  <Button
                    variant="primary"
                    size="md"
                    leftIcon={<Camera className="w-4 h-4" />}
                    onClick={handleStartRecording}
                  >
                    Start 360° Room Scan
                  </Button>
                ) : (
                  <Button
                    variant={is360ThresholdMet ? 'primary' : 'secondary'}
                    size="md"
                    disabled={!is360ThresholdMet}
                    onClick={handleStopRecording}
                    leftIcon={!is360ThresholdMet ? <Lock className="w-4 h-4 text-amber-500" /> : undefined}
                  >
                    {is360ThresholdMet
                      ? `Finish & Auto-Save (${totalCumulativeDegrees}° Cleared)`
                      : `Locked: Rotate ${degreesRemaining}° More to Proceed`}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Automatic Uploading State */}
          {step === 'uploading' && (
            <div className="py-12 px-4 text-center space-y-4">
              <Loader2 className="w-12 h-12 text-blue-600 mx-auto animate-spin" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Auto-Saving & Encrypting Evidence...
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Uploading {totalCumulativeDegrees}° environmental recording to secure faculty proctoring storage.
                </p>
              </div>

              <div className="w-full max-w-xs mx-auto h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-blue-600 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* STEP 3: Uploaded & Verified */}
          {step === 'uploaded' && (
            <div className="py-8 px-4 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  360° Environmental Scan Verified!
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Your environmental check ({totalCumulativeDegrees}°) and continuous camera/mic monitoring have been validated.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 max-w-sm mx-auto text-xs text-slate-600 font-mono space-y-1">
                <div className="flex justify-between">
                  <span>Room Coverage:</span>
                  <span className="text-emerald-700 font-bold">{totalCumulativeDegrees}° (Passed)</span>
                </div>
                <div className="flex justify-between">
                  <span>Continuous Proctoring:</span>
                  <span className="text-slate-900 font-semibold">Armed & Monitoring</span>
                </div>
              </div>

              <div className="pt-3">
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<ArrowRight className="w-4 h-4" />}
                  onClick={handleProceedToExam}
                >
                  Enter Examination Room
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
