import React, { useRef, useEffect, useState } from 'react';
import { UnifiedProctoringState } from '../../types/proctoring';
import {
  Camera,
  Maximize2,
  Minimize2,
  AlertTriangle,
  Glasses,
  CheckCircle2,
  Maximize,
  RotateCcw,
} from 'lucide-react';

interface ProctoringCornerWidgetProps {
  activeMediaStream: MediaStream | null;
  proctoringState: UnifiedProctoringState;
  onEnterFullscreen?: () => void;
  onRetryHardware?: () => void;
}

export const ProctoringCornerWidget: React.FC<ProctoringCornerWidgetProps> = ({
  activeMediaStream,
  proctoringState,
  onEnterFullscreen,
  onRetryHardware,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  // Callback ref guarantees video stream attaches the exact millisecond video DOM node mounts
  const attachVideoRef = (node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && activeMediaStream) {
      if (node.srcObject !== activeMediaStream) {
        node.srcObject = activeMediaStream;
      }
      node.play().catch(() => {});
    }
  };

  useEffect(() => {
    if (videoRef.current && activeMediaStream) {
      if (videoRef.current.srcObject !== activeMediaStream) {
        videoRef.current.srcObject = activeMediaStream;
      }
      videoRef.current.play().catch(() => {});
    }
  }, [activeMediaStream, isMinimized]);

  const {
    cameraStatus,
    microphoneStatus,
    faceStatus,
    eyeStatus,
    gazeStatus,
    glassesDetected,
    activeViolation,
    remainingSeconds,
    status,
  } = proctoringState;

  // 1. Camera Badge
  const getCameraBadge = () => {
    if (cameraStatus === 'permission_required') {
      return { label: 'Perm Req', dot: 'bg-rose-500', color: 'text-rose-700 font-bold' };
    }
    if (cameraStatus === 'offline') {
      return { label: 'Offline', dot: 'bg-rose-500', color: 'text-rose-700 font-bold' };
    }
    return { label: 'Active', dot: 'bg-emerald-500', color: 'text-emerald-700' };
  };

  // 2. Microphone Badge
  const getMicBadge = () => {
    if (microphoneStatus === 'offline') {
      return { label: 'Offline', dot: 'bg-rose-500', color: 'text-rose-700 font-bold' };
    }
    return { label: 'Active', dot: 'bg-emerald-500', color: 'text-emerald-700' };
  };

  // 3. Face Badge
  const getFaceBadge = () => {
    if (cameraStatus !== 'active') {
      return { label: 'Standby', dot: 'bg-slate-400', color: 'text-slate-500' };
    }
    switch (faceStatus) {
      case 'not_detected':
        return { label: 'Missing', dot: 'bg-rose-500', color: 'text-rose-700 font-bold' };
      case 'multiple_faces':
        return { label: 'Multiple', dot: 'bg-rose-500', color: 'text-rose-700 font-bold' };
      case 'detected':
      default:
        return { label: 'Detected', dot: 'bg-emerald-500', color: 'text-emerald-700' };
    }
  };

  // 4. Eyes Badge
  const getEyeBadge = () => {
    if (cameraStatus !== 'active' || faceStatus === 'not_detected') {
      return { label: 'Standby', dot: 'bg-slate-400', color: 'text-slate-500' };
    }
    switch (eyeStatus) {
      case 'closed':
        return { label: 'Closed', dot: 'bg-amber-500', color: 'text-amber-700 font-bold' };
      case 'unclear':
        return { label: 'Unclear', dot: 'bg-amber-500', color: 'text-amber-700' };
      case 'open':
      default:
        return {
          label: glassesDetected ? 'Glasses' : 'Detected',
          dot: 'bg-emerald-500',
          color: 'text-emerald-700',
        };
    }
  };

  // 5. Gaze Badge
  const getGazeBadge = () => {
    if (cameraStatus !== 'active' || faceStatus === 'not_detected') {
      return { label: 'Standby', dot: 'bg-slate-400', color: 'text-slate-500' };
    }
    if (gazeStatus === 'looking_away') {
      return { label: 'Away', dot: 'bg-amber-500', color: 'text-amber-700 font-bold' };
    }
    return { label: 'Forward', dot: 'bg-emerald-500', color: 'text-emerald-700' };
  };

  const camBadge = getCameraBadge();
  const micBadge = getMicBadge();
  const faceBadge = getFaceBadge();
  const eyeBadge = getEyeBadge();
  const gazeBadge = getGazeBadge();

  const isCritical = status === 'critical' && activeViolation && remainingSeconds <= 15;

  return (
    <div className="fixed bottom-4 right-4 z-40 select-none animate-fade-in pointer-events-auto flex flex-col items-end gap-2">
      {/* 1. ONE UNIFIED 15-SECOND PROCTORING WARNING CARD */}
      {isCritical && (
        <div className="w-52 sm:w-56 rounded-xl bg-rose-600 text-white p-3 shadow-xl animate-slide-down border border-rose-400 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-white animate-bounce" />
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-100">
                ⚠ WARNING
              </span>
            </div>
            <span className="font-mono text-[11px] font-black bg-rose-900/80 px-1.5 py-0.5 rounded text-white border border-rose-400/40">
              {remainingSeconds}s
            </span>
          </div>

          <div>
            <h4 className="text-[11px] font-extrabold text-white leading-tight">
              {activeViolation.title}
            </h4>
            <p className="text-[9px] text-rose-100 mt-0.5 leading-tight">
              {activeViolation.description}
            </p>
          </div>

          <div className="p-1.5 rounded-lg bg-black/30 border border-white/20 flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase text-rose-200">
              Resolve in:
            </span>
            <span className="font-mono text-sm font-black text-white">
              {remainingSeconds}s
            </span>
          </div>

          {activeViolation.type === 'fullscreen_exit' && onEnterFullscreen && (
            <button
              type="button"
              onClick={onEnterFullscreen}
              className="w-full py-1 rounded-lg bg-white text-rose-700 font-extrabold text-[10px] hover:bg-rose-50 transition-colors flex items-center justify-center gap-1 shadow-xs"
            >
              <Maximize className="w-3 h-3" />
              Return Full-Screen
            </button>
          )}

          {(activeViolation.type === 'camera_disconnected' || activeViolation.type === 'mic_disconnected') && onRetryHardware && (
            <button
              type="button"
              onClick={onRetryHardware}
              className="w-full py-1 rounded-lg bg-white text-rose-700 font-extrabold text-[10px] hover:bg-rose-50 transition-colors flex items-center justify-center gap-1 shadow-xs"
            >
              <RotateCcw className="w-3 h-3" />
              Reconnect Device
            </button>
          )}
        </div>
      )}

      {/* 2. COMPACT FLOATING LIVE WEBCAM & PROCTORING CONTROLLER (SMALL SIZE) */}
      <div
        className={`w-52 sm:w-56 rounded-xl bg-white/95 backdrop-blur-md border shadow-lg overflow-hidden transition-all duration-300 ${
          isCritical
            ? 'border-rose-400 ring-2 ring-rose-400/40'
            : status === 'warning'
            ? 'border-amber-300'
            : 'border-slate-200'
        }`}
      >
        {/* Header */}
        <div
          className={`px-2.5 py-1.5 border-b flex items-center justify-between transition-colors ${
            isCritical
              ? 'bg-rose-50 border-rose-200'
              : status === 'warning'
              ? 'bg-amber-50 border-amber-200'
              : 'bg-slate-50 border-slate-100'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isCritical
                  ? 'bg-rose-600 animate-ping'
                  : status === 'warning'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
            />
            <span
              className={`text-[10px] font-extrabold uppercase tracking-wider ${
                isCritical ? 'text-rose-900' : 'text-slate-800'
              }`}
            >
              PROCTORING <span className="text-[9px] font-bold text-slate-400">● LIVE</span>
            </span>
          </div>

          <div className="flex items-center gap-0.5">
            {glassesDetected && (
              <span title="Glasses Detected" className="text-slate-500">
                <Glasses className="w-3 h-3" />
              </span>
            )}



            <button
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Live Camera Preview (Compact 16:10 Aspect Ratio) */}
        {!isMinimized && (
          <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden border-b border-slate-100 flex items-center justify-center">
            {activeMediaStream ? (
              <video
                ref={attachVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
            ) : (
              <div className="p-3 text-center space-y-1">
                <Camera className="w-5 h-5 text-slate-600 mx-auto animate-pulse" />
                <span className="text-[9px] text-slate-400 block font-mono">
                  {cameraStatus === 'permission_required' ? 'Perm Required' : 'Connecting...'}
                </span>
              </div>
            )}

            {/* Face Status Pill */}
            <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-slate-950/80 backdrop-blur text-[8px] font-mono text-white flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${faceBadge.dot}`} />
              <span>{faceBadge.label}</span>
            </div>

            {/* Gaze Direction Pill */}
            <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-slate-950/80 backdrop-blur text-[8px] font-mono text-white flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${gazeBadge.dot}`} />
              <span>{gazeStatus === 'looking_away' ? 'Away' : 'Forward'}</span>
            </div>
          </div>
        )}

        {/* Compact Status Rows */}
        <div className="p-2 space-y-1 text-[10px] font-medium">
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            {/* Camera */}
            <div className="flex items-center justify-between py-0.5 px-1.5 rounded bg-slate-50">
              <span className="text-slate-500 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${camBadge.dot}`} /> Cam
              </span>
              <span className="font-mono text-[9px] text-slate-700 font-bold">{camBadge.label}</span>
            </div>

            {/* Microphone */}
            <div className="flex items-center justify-between py-0.5 px-1.5 rounded bg-slate-50">
              <span className="text-slate-500 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${micBadge.dot}`} /> Mic
              </span>
              <span className="font-mono text-[9px] text-slate-700 font-bold">{micBadge.label}</span>
            </div>

            {/* Face */}
            <div className="flex items-center justify-between py-0.5 px-1.5 rounded bg-slate-50">
              <span className="text-slate-500 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${faceBadge.dot}`} /> Face
              </span>
              <span className={`font-mono text-[9px] ${faceBadge.color}`}>{faceBadge.label}</span>
            </div>

            {/* Eyes */}
            <div className="flex items-center justify-between py-0.5 px-1.5 rounded bg-slate-50">
              <span className="text-slate-500 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${eyeBadge.dot}`} /> Eyes
              </span>
              <span className={`font-mono text-[9px] ${eyeBadge.color}`}>{eyeBadge.label}</span>
            </div>
          </div>

          {/* Gaze Full Row */}
          <div className="flex items-center justify-between py-0.5 px-1.5 rounded bg-slate-50">
            <span className="text-slate-500 flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${gazeBadge.dot}`} /> Gaze Direction
            </span>
            <span className={`font-mono text-[9px] ${gazeBadge.color}`}>{gazeBadge.label}</span>
          </div>

          {/* Warning banner for non-terminating events */}
          {!isCritical && (gazeStatus === 'looking_away' || eyeStatus === 'closed' || eyeStatus === 'unclear') && (
            <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[9px] font-semibold flex items-center gap-1 mt-0.5">
              <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
              <span className="truncate">
                {gazeStatus === 'looking_away'
                  ? 'Please look at screen.'
                  : eyeStatus === 'unclear'
                  ? 'Eye detection unclear (glare).'
                  : 'Please keep eyes open.'}
              </span>
            </div>
          )}


        </div>
      </div>

      {/* Restored notice */}
      {!isCritical && status === 'normal' && proctoringState.elapsedSeconds === 0 && (
        <div className="w-52 sm:w-56 rounded-lg bg-emerald-50 border border-emerald-200 p-1.5 text-emerald-800 text-[9px] font-bold flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Proctoring Active & Verified
          </span>
        </div>
      )}
    </div>
  );
};
