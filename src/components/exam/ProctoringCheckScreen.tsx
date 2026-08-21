import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../common/Button';
import {
  Camera,
  Mic,
  User,
  Eye,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { analyzeVideoFrame } from '../../lib/visionEngine';

interface ProctoringCheckScreenProps {
  activeMediaStream: MediaStream | null;
  onInitializeMedia: () => Promise<boolean>;
  onContinueToRoomScan: () => void;
}

export const ProctoringCheckScreen: React.FC<ProctoringCheckScreenProps> = ({
  activeMediaStream,
  onInitializeMedia,
  onContinueToRoomScan,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [camStatus, setCamStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  const [micStatus, setMicStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  const [faceStatus, setFaceStatus] = useState<'checking' | 'detected' | 'not_detected'>('checking');
  const [eyeStatus, setEyeStatus] = useState<'checking' | 'detected' | 'unclear'>('checking');
  const [camQuality, setCamQuality] = useState<'checking' | 'optimal' | 'poor'>('checking');

  useEffect(() => {
    onInitializeMedia().then((success) => {
      if (success) {
        setCamStatus('ready');
        setMicStatus('ready');
      } else {
        setCamStatus('error');
        setMicStatus('error');
      }
    });
  }, [onInitializeMedia]);

  // Callback ref guarantees stream attaches immediately upon mounting
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
  }, [activeMediaStream]);

  // Frame-by-frame live detection loop
  useEffect(() => {
    if (!videoRef.current || camStatus !== 'ready') return;

    const interval = setInterval(async () => {
      if (!videoRef.current) return;
      const res = await analyzeVideoFrame(videoRef.current);

      if (res.faceDetected) {
        setFaceStatus('detected');
        setEyeStatus(res.eyes.eyesOpen ? 'detected' : res.eyes.isUnclear ? 'unclear' : 'detected');
        setCamQuality(res.confidence > 0.8 ? 'optimal' : 'poor');
      } else {
        setFaceStatus('not_detected');
        setEyeStatus('checking');
        setCamQuality('poor');
      }
    }, 400);

    return () => clearInterval(interval);
  }, [camStatus]);

  const allChecksPassed =
    camStatus === 'ready' &&
    micStatus === 'ready' &&
    faceStatus === 'detected';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-card p-6 sm:p-8 space-y-6">
        {/* Title */}
        <div className="text-center space-y-1.5 border-b border-slate-100 pb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Hardware & Environment Check</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            PROCTORING CHECK
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Before you begin, we'll verify your camera, microphone, face and examination environment.
          </p>
        </div>

        {/* Live Camera Preview */}
        <div className="relative aspect-video rounded-2xl bg-slate-950 overflow-hidden border border-slate-200 shadow-inner flex items-center justify-center">
          {activeMediaStream ? (
            <video
              ref={attachVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
            />
          ) : (
            <div className="text-center p-6 space-y-2 text-white">
              <Camera className="w-10 h-10 text-slate-500 mx-auto animate-pulse" />
              <p className="text-xs text-slate-400">
                {camStatus === 'error' ? 'Camera Permission Required' : 'Initializing MediaStream...'}
              </p>
            </div>
          )}

          {/* Overlay Status Pill */}
          <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-slate-950/80 backdrop-blur text-white text-xs font-mono flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${camStatus === 'ready' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            <span>{camStatus === 'ready' ? 'LIVE MEDIASTREAM' : 'CONNECTING...'}</span>
          </div>
        </div>

        {/* 5 Real Hardware Status Checks */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
          {/* 1. Camera */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-1 text-slate-500 font-medium text-[11px]">
              <Camera className="w-3.5 h-3.5 text-blue-600" />
              <span>Camera</span>
            </div>
            {camStatus === 'checking' ? (
              <span className="text-[10px] text-blue-600 font-mono flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Checking...
              </span>
            ) : camStatus === 'ready' ? (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ready
              </span>
            ) : (
              <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
                <XCircle className="w-3 h-3 text-rose-600" /> Required
              </span>
            )}
          </div>

          {/* 2. Microphone */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-1 text-slate-500 font-medium text-[11px]">
              <Mic className="w-3.5 h-3.5 text-indigo-600" />
              <span>Microphone</span>
            </div>
            {micStatus === 'checking' ? (
              <span className="text-[10px] text-blue-600 font-mono flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Checking...
              </span>
            ) : micStatus === 'ready' ? (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ready
              </span>
            ) : (
              <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
                <XCircle className="w-3 h-3 text-rose-600" /> Required
              </span>
            )}
          </div>

          {/* 3. Face Detection */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-1 text-slate-500 font-medium text-[11px]">
              <User className="w-3.5 h-3.5 text-purple-600" />
              <span>Face</span>
            </div>
            {faceStatus === 'checking' ? (
              <span className="text-[10px] text-blue-600 font-mono flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Scanning...
              </span>
            ) : faceStatus === 'detected' ? (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Detected
              </span>
            ) : (
              <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
                <XCircle className="w-3 h-3 text-rose-600" /> Missing
              </span>
            )}
          </div>

          {/* 4. Eye Tracking */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-1 text-slate-500 font-medium text-[11px]">
              <Eye className="w-3.5 h-3.5 text-teal-600" />
              <span>Eyes</span>
            </div>
            {eyeStatus === 'checking' ? (
              <span className="text-[10px] text-blue-600 font-mono flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Tracking...
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Detected
              </span>
            )}
          </div>

          {/* 5. Image Quality */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-1 text-slate-500 font-medium text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Quality</span>
            </div>
            {camQuality === 'checking' ? (
              <span className="text-[10px] text-blue-600 font-mono flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Testing...
              </span>
            ) : camQuality === 'optimal' ? (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Clear
              </span>
            ) : (
              <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-amber-600" /> Passable
              </span>
            )}
          </div>
        </div>

        {/* Validation Advice Note */}
        {!allChecksPassed ? (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {camStatus === 'error'
                ? 'Please allow camera & microphone permissions in your browser.'
                : 'Please position your face clearly in the camera frame to proceed.'}
            </span>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>All proctoring checks passed successfully. Hardware is verified and ready.</span>
          </div>
        )}

        {/* Action Button */}
        <div>
          <Button
            variant="primary"
            size="lg"
            className="w-full font-bold text-sm"
            disabled={!allChecksPassed}
            onClick={onContinueToRoomScan}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {allChecksPassed ? 'Continue to 360° Room Scan' : 'Verifying Hardware & Face...'}
          </Button>
        </div>
      </div>
    </div>
  );
};
