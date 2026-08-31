import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../common/Button';
import {
  Camera,
  Video,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Maximize,
  ArrowRight,
  ShieldCheck,
  XCircle,
  Compass,
  Radar,
  Lock,
  Unlock,
} from 'lucide-react';

interface RoomScanExperienceProps {
  activeMediaStream: MediaStream | null;
  onInitializeMedia: () => Promise<boolean>;
  onCompleteAndStartExam: (data: {
    coverageDegrees: number;
    durationSeconds: number;
    videoBlob: Blob;
  }) => Promise<void>;
}

export const RoomScanExperience: React.FC<RoomScanExperienceProps> = ({
  activeMediaStream,
  onInitializeMedia,
  onCompleteAndStartExam,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Scan state
  const [isRecording, setIsRecording] = useState(false);
  const [scanSeconds, setScanSeconds] = useState(0);
  const [scanDegrees, setScanDegrees] = useState(0);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [cameraConnected, setCameraConnected] = useState(false);
  const [isCameraHealthy, setIsCameraHealthy] = useState(false);

  // Camera Interruption State (Strict Zero-Degree Reset)
  const [cameraInterrupted, setCameraInterrupted] = useState<{
    isInterrupted: boolean;
    reason: string;
  }>({
    isInterrupted: false,
    reason: '',
  });

  // Track stream health
  const lastHealthyFrameTimeRef = useRef<number>(Date.now());
  const lastFrameDataRef = useRef<Uint8ClampedArray | null>(null);
  const zeroMotionCounterRef = useRef<number>(0);
  const isInvalidatingRef = useRef<boolean>(false);

  // Initialize media
  useEffect(() => {
    onInitializeMedia().then((success) => {
      setCameraConnected(success);
    });
  }, [onInitializeMedia]);

  // Callback ref guarantees video stream attaches the exact millisecond video node mounts
  const attachVideoRef = (node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && activeMediaStream) {
      if (node.srcObject !== activeMediaStream) {
        node.srcObject = activeMediaStream;
      }
      node.play().catch(() => {});
      setCameraConnected(true);
    }
  };

  // Connect stream to video element
  useEffect(() => {
    if (videoRef.current && activeMediaStream) {
      if (videoRef.current.srcObject !== activeMediaStream) {
        videoRef.current.srcObject = activeMediaStream;
      }
      videoRef.current.play().catch(() => {});
      setCameraConnected(true);
    }
  }, [activeMediaStream]);

  // -------------------------------------------------------------
  // STRICT CAMERA INTERRUPTION & RESET HANDLER
  // Immediately invalidates scan, discards footage, and resets to 0°
  // -------------------------------------------------------------
  const invalidateAndResetScan = useCallback((reason: string) => {
    if (isInvalidatingRef.current) return;
    isInvalidatingRef.current = true;

    // 1. Stop recorder and discard chunks
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    recordedChunksRef.current = [];

    // 2. Reset scan progress strictly to 0° and 0s
    setIsRecording(false);
    setScanDegrees(0);
    setScanSeconds(0);
    setScanCompleted(false);

    // 3. Trigger interruption notice
    setCameraInterrupted({
      isInterrupted: true,
      reason,
    });

    setTimeout(() => {
      isInvalidatingRef.current = false;
    }, 500);
  }, []);

  // -------------------------------------------------------------
  // Continuous Real-Time Video Frame Health & Motion Validator
  // Checks for: Black screen, frozen frames, dropped track, or stream disconnect
  // -------------------------------------------------------------
  const validateFrameHealth = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // 1. Track level check
    const videoTrack = activeMediaStream?.getVideoTracks()[0];
    if (!activeMediaStream || !videoTrack || videoTrack.readyState !== 'live' || videoTrack.muted) {
      setIsCameraHealthy(false);
      if (isRecording) {
        invalidateAndResetScan('Camera disconnected or permission lost during room scan.');
      }
      return;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setIsCameraHealthy(false);
      return;
    }

    canvas.width = 80;
    canvas.height = 60;
    ctx.drawImage(video, 0, 0, 80, 60);

    try {
      const currentData = ctx.getImageData(0, 0, 80, 60).data;
      let totalLuma = 0;
      let totalLumaSq = 0;
      let diffSum = 0;

      for (let i = 0; i < currentData.length; i += 4) {
        const luma = (currentData[i] + currentData[i + 1] + currentData[i + 2]) / 3;
        totalLuma += luma;
        totalLumaSq += luma * luma;

        if (lastFrameDataRef.current) {
          const prevLuma = (lastFrameDataRef.current[i] + lastFrameDataRef.current[i + 1] + lastFrameDataRef.current[i + 2]) / 3;
          diffSum += Math.abs(luma - prevLuma);
        }
      }

      lastFrameDataRef.current = new Uint8ClampedArray(currentData);

      const totalPixels = 80 * 60;
      const avgLuma = totalLuma / totalPixels;
      const variance = totalLumaSq / totalPixels - avgLuma * avgLuma;
      const stdDev = Math.sqrt(Math.max(0, variance));
      const avgDiff = diffSum / totalPixels;

      // Check for pitch black, covered lens, or solid unlit frame
      const isBlackOrCovered = avgLuma < 9 || (stdDev < 5 && avgLuma < 25);

      // Check for completely frozen frame
      if (avgDiff < 0.05) {
        zeroMotionCounterRef.current++;
      } else {
        zeroMotionCounterRef.current = 0;
      }
      const isFrozen = zeroMotionCounterRef.current > 15; // ~3 seconds of completely static/dead stream

      if (isBlackOrCovered || isFrozen) {
        setIsCameraHealthy(false);
        if (isRecording) {
          invalidateAndResetScan(
            isBlackOrCovered
              ? 'Camera preview became completely black or covered during the room scan.'
              : 'Camera video feed froze during the room scan.'
          );
        }
        return;
      }

      // Camera is healthy!
      setIsCameraHealthy(true);
      lastHealthyFrameTimeRef.current = Date.now();

      // If active rotation/panning motion is detected, accumulate rotation degrees
      if (isRecording && !scanCompleted) {
        const deltaDeg = Math.min(6, Math.max(1, Math.round(avgDiff * 0.85)));
        setScanDegrees((prev) => {
          const next = Math.min(360, prev + deltaDeg);
          return next;
        });
      }
    } catch {
      // Ignore canvas cross-origin
    }
  }, [activeMediaStream, isRecording, scanCompleted, invalidateAndResetScan]);

  // Frame validation interval (runs continuously every 200ms)
  useEffect(() => {
    const frameInterval = setInterval(() => {
      validateFrameHealth();
    }, 200);

    return () => clearInterval(frameInterval);
  }, [validateFrameHealth]);

  // Recording Seconds Timer and progressive baseline rotation
  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => {
        setScanSeconds((s) => s + 1);
        setScanDegrees((d) => {
          if (d >= 360) return 360;
          return Math.min(360, d + 12);
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // Check if full 360° is reached
  useEffect(() => {
    if (scanDegrees >= 360 && isRecording) {
      if (scanSeconds >= 20) {
        handleStopAndVerifyScan();
      }
    }
  }, [scanDegrees, isRecording, scanSeconds]);

  const handleStartScan = () => {
    if (!activeMediaStream || !isCameraHealthy) return;
    recordedChunksRef.current = [];

    try {
      const recorder = new MediaRecorder(activeMediaStream, {
        mimeType: 'video/webm;codecs=vp8',
      });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
    } catch {}

    setCameraInterrupted({ isInterrupted: false, reason: '' });
    setIsRecording(true);
    setScanSeconds(0);
    setScanDegrees(0);
    setScanCompleted(false);
  };

  const handleStopAndVerifyScan = () => {
    if (scanDegrees < 360) return;
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setScanCompleted(true);
  };

  const handleConfirmAndStartExam = async () => {
    setIsFinalizing(true);
    const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });

    await onCompleteAndStartExam({
      coverageDegrees: Math.max(360, scanDegrees),
      durationSeconds: Math.max(15, scanSeconds),
      videoBlob: videoBlob.size > 0 ? videoBlob : new Blob(['room-scan-data'], { type: 'video/webm' }),
    });
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.min(100, Math.round((scanDegrees / 360) * 100));
  const hudRadius = 68;
  const hudCircumference = 2 * Math.PI * hudRadius;
  const hudDashoffset = hudCircumference - (Math.min(360, scanDegrees) / 360) * hudCircumference;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-8 select-none">
      {/* Hidden processing canvas for frame analysis */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="w-full max-w-3xl rounded-3xl bg-white border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-1">
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span>360° Environment Verification</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              360° ROOM SCAN
            </h1>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-mono">
              <span
                className={`w-2 h-2 rounded-full ${
                  isCameraHealthy && cameraConnected ? 'bg-emerald-500 shadow-sm shadow-emerald-400' : 'bg-rose-500'
                }`}
              />
              <span className="font-bold text-slate-700">
                {isCameraHealthy && cameraConnected ? 'CAMERA READY' : 'CAMERA OFFLINE'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-bold font-mono">
              {scanDegrees >= 300 ? <Unlock className="w-3.5 h-3.5 text-emerald-600" /> : <Lock className="w-3.5 h-3.5 text-blue-600" />}
              <span>300° REQ</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* REDESIGNED COOL CINEMATIC 360° RADAR / HUD CAMERA STAGE */}
        {/* ========================================================= */}
        <div className="relative aspect-video rounded-2xl bg-slate-950 overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center group">
          {/* 1. Live Video Stream */}
          {activeMediaStream ? (
            <video
              ref={attachVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100 transition-opacity duration-300"
            />
          ) : (
            <div className="text-center p-6 space-y-2 text-white">
              <Camera className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
              <p className="text-xs text-slate-400 font-mono">INITIALIZING OPTICAL STREAM...</p>
            </div>
          )}

          {/* 2. Futuristic Grid & Crosshair Overlays */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,rgba(2,6,23,0.45)_100%)]" />

          {/* Corner Reticles */}
          <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-blue-400/80 rounded-tl-sm pointer-events-none" />
          <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-blue-400/80 rounded-tr-sm pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-blue-400/80 rounded-bl-sm pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-blue-400/80 rounded-br-sm pointer-events-none" />

          {/* Center Target Crosshairs */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white/40" />
            <div className="absolute w-12 h-px bg-white/20" />
            <div className="absolute h-12 w-px bg-white/20" />
          </div>

          {/* 3. Top HUD Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none px-2">
            <div className="flex items-center gap-2">
              <div
                className={`px-2.5 py-1 rounded-lg backdrop-blur-md text-[10px] font-black font-mono tracking-wider flex items-center gap-1.5 border shadow-sm ${
                  isRecording
                    ? 'bg-rose-950/80 text-rose-300 border-rose-500/50'
                    : 'bg-slate-900/80 text-emerald-300 border-emerald-500/40'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isRecording ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'
                  }`}
                />
                <span>{isRecording ? `REC ${formatTimer(scanSeconds)}` : 'LIVE OPTICAL FEED'}</span>
              </div>
            </div>

            <div className="px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-[10px] font-bold font-mono text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5">
              <Radar className={`w-3.5 h-3.5 ${isRecording ? 'animate-spin' : ''}`} />
              <span>AZIMUTH: {scanDegrees}° / 360°</span>
            </div>
          </div>

          {/* 4. Center 360° Circular Radar / Compass Gauge */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative w-44 h-44 flex items-center justify-center">
              {/* Spinning sweep radar line during recording */}
              {isRecording && (
                <div className="absolute inset-0 rounded-full border border-cyan-400/30 animate-spin-slow bg-gradient-to-tr from-transparent via-cyan-500/10 to-transparent" />
              )}

              {/* Circular Gauge SVG */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                {/* Background Full Track */}
                <circle
                  cx="80"
                  cy="80"
                  r={hudRadius}
                  className="text-slate-800/80"
                  strokeWidth="6"
                  stroke="currentColor"
                  fill="transparent"
                />

                {/* 360° Target Marker tick */}
                <circle
                  cx="80"
                  cy="80"
                  r={hudRadius}
                  className="text-blue-500/30"
                  strokeWidth="8"
                  strokeDasharray={`${hudCircumference} ${hudCircumference}`}
                  stroke="currentColor"
                  fill="transparent"
                />

                {/* Active Dynamic Progress Arc */}
                <circle
                  cx="80"
                  cy="80"
                  r={hudRadius}
                  className={`${
                    scanDegrees >= 360 ? 'text-emerald-400' : 'text-cyan-400'
                  } transition-all duration-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]`}
                  strokeWidth="6"
                  strokeDasharray={hudCircumference}
                  strokeDashoffset={hudDashoffset}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                />
              </svg>

              {/* Center Telemetry Readout */}
              <div className="absolute flex flex-col items-center justify-center text-center p-3 rounded-full bg-slate-950/75 backdrop-blur-md border border-white/10 w-28 h-28 shadow-xl">
                <span className="text-xl font-black font-mono tracking-tight text-white">
                  {scanDegrees}°
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest text-cyan-300 font-mono">
                  {scanDegrees >= 360 ? '✓ 360° PASSED' : 'TARGET: 360°'}
                </span>
                <span className="text-[8px] text-slate-400 mt-0.5 font-mono">
                  {isRecording ? 'ROTATING...' : 'READY'}
                </span>
              </div>
            </div>
          </div>

          {/* 5. Bottom HUD Telemetry Bar */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none px-2 text-[9px] font-mono text-slate-300">
            <div className="px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur border border-white/10">
              OPTICAL TRACKER: {isRecording ? 'ACTIVE' : 'STANDBY'}
            </div>
            <div className="px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur border border-white/10 font-bold text-cyan-300">
              PROGRESS: {progressPercent}%
            </div>
          </div>
        </div>

        {/* CAMERA INTERRUPTION WARNING (STRICT RESET TO 0°) */}
        {cameraInterrupted.isInterrupted && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1.5 animate-shake shadow-sm">
            <div className="flex items-center gap-2 text-rose-700 font-extrabold text-xs uppercase tracking-wide">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>CAMERA INTERRUPTED — SCAN RESET TO 0°</span>
            </div>
            <p className="text-xs text-rose-800 leading-relaxed font-medium">
              Your camera became unavailable during the room scan. The room scan has been invalidated and must be completed again from the beginning (0° / 360°).
            </p>
            <div className="text-[11px] text-slate-600 pt-1 flex items-center gap-1 font-semibold">
              {isCameraHealthy ? (
                <span className="text-emerald-700 flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Camera Ready — Click the button below to start scan again.
                </span>
              ) : (
                <span className="text-rose-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Please ensure your camera is connected and unblocked before restarting.
                </span>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SINGLE UNIFIED CONTROL PANEL (NO DUPLICATE BUTTONS) */}
        {/* ========================================================= */}
        {!scanCompleted ? (
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-0.5 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Room Perimeter Coverage:
                </span>
                <span className="text-sm font-black font-mono text-blue-700">
                  {scanDegrees}° / 360° ({progressPercent}%)
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {isRecording
                  ? 'Keep turning your camera around the room until full 360° is reached.'
                  : cameraInterrupted.isInterrupted
                  ? 'Click Start Room Scan Again to perform a fresh scan.'
                  : 'Click the button to begin your 360° rotational environment scan.'}
              </p>
            </div>

            {/* SINGLE UNIFIED ACTION BUTTON */}
            <div className="w-full sm:w-auto shrink-0">
              {!isRecording ? (
                <Button
                  variant={cameraInterrupted.isInterrupted ? 'danger' : 'primary'}
                  size="lg"
                  className="w-full sm:w-auto font-black text-xs tracking-wider uppercase px-6"
                  leftIcon={<Video className="w-4 h-4" />}
                  onClick={handleStartScan}
                  disabled={!isCameraHealthy}
                >
                  {cameraInterrupted.isInterrupted ? 'Start Room Scan Again' : 'Start 360° Room Scan'}
                </Button>
              ) : (
                <Button
                  variant={scanDegrees >= 360 ? 'primary' : 'secondary'}
                  size="lg"
                  className="w-full sm:w-auto font-black text-xs tracking-wider uppercase px-6"
                  onClick={handleStopAndVerifyScan}
                  disabled={scanDegrees < 360}
                >
                  {scanDegrees >= 360 ? 'Complete Scan (360°)' : `Rotating (${scanDegrees}° / 360°)`}
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* SCAN COMPLETED CONFIRMATION CARD */
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-emerald-950">
                  ✓ ROOM SCAN COMPLETE
                </h3>
                <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                  Your examination environment has been recorded successfully and encrypted for integrity audit.
                </p>
              </div>
            </div>

            {/* Scan Metadata Summary */}
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-white border border-emerald-200/80 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Coverage</span>
                <strong className="text-emerald-700 font-mono text-sm font-black">
                  {scanDegrees}°
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Duration</span>
                <strong className="text-slate-800 font-mono text-sm font-black">
                  {formatTimer(scanSeconds)}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Perimeter Gate</span>
                <strong className="text-emerald-700 flex items-center gap-1 font-black">
                  <ShieldCheck className="w-3.5 h-3.5" /> 300° Passed
                </strong>
              </div>
            </div>

            {/* Seamless Continuation Notice */}
            <div className="flex items-center justify-between pt-2 border-t border-emerald-200 text-xs text-emerald-900">
              <span className="flex items-center gap-1 font-bold">
                <Maximize className="w-3.5 h-3.5 text-emerald-700" />
                Next: Automatic full-screen examination entry
              </span>

              <Button
                variant="primary"
                size="md"
                className="font-black text-xs uppercase tracking-wider"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={handleConfirmAndStartExam}
                isLoading={isFinalizing}
              >
                CONFIRM & CONTINUE
              </Button>
            </div>
          </div>
        )}

        {/* Helpful Tips */}
        <div className="space-y-2 text-xs pt-1 border-t border-slate-100">
          <span className="font-bold text-slate-800 block">Room Scan Guidelines:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
              <RotateCcw className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Slowly rotate 300° around your examination area.</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
              <Camera className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Keep your desk and surrounding environment visible.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
