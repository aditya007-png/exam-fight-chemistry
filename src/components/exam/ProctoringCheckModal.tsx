import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../common/Button';
import {
  Camera,
  Mic,
  Eye,
  UserCheck,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Maximize,
  AlertCircle,
} from 'lucide-react';

interface ProctoringCheckModalProps {
  isOpen: boolean;
  onContinue: () => void;
  activeMediaStream: MediaStream | null;
  onInitializeMedia: () => Promise<boolean>;
}

export const ProctoringCheckModal: React.FC<ProctoringCheckModalProps> = ({
  isOpen,
  onContinue,
  activeMediaStream,
  onInitializeMedia,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [cameraStatus, setCameraStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  const [micStatus, setMicStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  const [faceStatus, setFaceStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  const [eyeStatus, setEyeStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const runChecks = async () => {
      setCameraStatus('checking');
      setMicStatus('checking');
      setFaceStatus('checking');
      setEyeStatus('checking');
      setErrorMessage(null);

      const success = await onInitializeMedia();

      if (!success) {
        if (isMounted) {
          setCameraStatus('error');
          setMicStatus('error');
          setFaceStatus('error');
          setEyeStatus('error');
          setErrorMessage('Please allow camera and microphone permissions in your browser to proceed.');
        }
        return;
      }

      // Step 1: Camera
      setTimeout(() => {
        if (isMounted) setCameraStatus('ready');
      }, 600);

      // Step 2: Microphone
      setTimeout(() => {
        if (isMounted) setMicStatus('ready');
      }, 1200);

      // Step 3: Face Detection
      setTimeout(() => {
        if (isMounted) setFaceStatus('ready');
      }, 1800);

      // Step 4: Eye Tracking
      setTimeout(() => {
        if (isMounted) setEyeStatus('ready');
      }, 2400);
    };

    runChecks();

    return () => {
      isMounted = false;
    };
  }, [isOpen, onInitializeMedia]);

  // Connect activeMediaStream to preview video
  useEffect(() => {
    if (videoRef.current && activeMediaStream) {
      videoRef.current.srcObject = activeMediaStream;
      videoRef.current.play().catch(() => {});
    }
  }, [activeMediaStream, isOpen]);

  if (!isOpen) return null;

  const allChecksPassed =
    cameraStatus === 'ready' &&
    micStatus === 'ready' &&
    faceStatus === 'ready' &&
    eyeStatus === 'ready';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 animate-scale-up">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex p-2.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 mb-1">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            Proctoring Check
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Before you begin, we&apos;ll verify your camera, microphone, face and examination environment.
          </p>
        </div>

        {/* Live Camera Preview & Face Alignment Box */}
        <div className="relative aspect-video rounded-2xl bg-slate-950 overflow-hidden border border-slate-200 flex items-center justify-center shadow-inner">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover -scale-x-100"
          />

          {/* Alignment Target Overlay */}
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            <div className="w-36 h-48 rounded-full border-2 border-dashed border-white/60 flex items-center justify-center">
              <span className="text-[10px] font-mono text-white/80 uppercase tracking-wider bg-slate-950/60 px-2 py-0.5 rounded">
                Align Face
              </span>
            </div>
          </div>

          <div className="absolute bottom-2.5 left-3 px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur text-white text-[11px] font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Live Stream Validation</span>
          </div>
        </div>

        {/* Status Verification Checklist */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          {/* 1. Camera */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-slate-600" />
              <span className="font-semibold text-slate-800">Camera</span>
            </div>
            {cameraStatus === 'checking' ? (
              <span className="text-[11px] text-blue-600 flex items-center gap-1 font-mono">
                <Loader2 className="w-3 h-3 animate-spin" /> Checking...
              </span>
            ) : cameraStatus === 'ready' ? (
              <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Ready
              </span>
            ) : (
              <span className="text-[11px] text-rose-600 font-bold">Error</span>
            )}
          </div>

          {/* 2. Microphone */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-slate-600" />
              <span className="font-semibold text-slate-800">Microphone</span>
            </div>
            {micStatus === 'checking' ? (
              <span className="text-[11px] text-blue-600 flex items-center gap-1 font-mono">
                <Loader2 className="w-3 h-3 animate-spin" /> Checking...
              </span>
            ) : micStatus === 'ready' ? (
              <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Ready
              </span>
            ) : (
              <span className="text-[11px] text-rose-600 font-bold">Error</span>
            )}
          </div>

          {/* 3. Face Detection */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-slate-600" />
              <span className="font-semibold text-slate-800">Face Detection</span>
            </div>
            {faceStatus === 'checking' ? (
              <span className="text-[11px] text-blue-600 flex items-center gap-1 font-mono">
                <Loader2 className="w-3 h-3 animate-spin" /> Checking...
              </span>
            ) : faceStatus === 'ready' ? (
              <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Detected
              </span>
            ) : (
              <span className="text-[11px] text-rose-600 font-bold">Error</span>
            )}
          </div>

          {/* 4. Eye Tracking */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-600" />
              <span className="font-semibold text-slate-800">Eye Tracking</span>
            </div>
            {eyeStatus === 'checking' ? (
              <span className="text-[11px] text-blue-600 flex items-center gap-1 font-mono">
                <Loader2 className="w-3 h-3 animate-spin" /> Checking...
              </span>
            ) : eyeStatus === 'ready' ? (
              <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Ready
              </span>
            ) : (
              <span className="text-[11px] text-rose-600 font-bold">Error</span>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Notices & Privacy Disclaimer */}
        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-1 text-xs text-slate-700">
          <div className="flex items-center gap-1.5 font-bold text-blue-900">
            <Maximize className="w-3.5 h-3.5 text-blue-600" />
            <span>Full-Screen Examination Notice</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Your examination will now enter full-screen mode. Camera, microphone and proctoring will remain active throughout the examination.
          </p>
        </div>

        {/* Action Button */}
        <Button
          variant="primary"
          size="lg"
          className="w-full text-sm font-bold shadow-md"
          disabled={!allChecksPassed}
          onClick={onContinue}
          leftIcon={<Maximize className="w-4 h-4" />}
        >
          {allChecksPassed ? 'Continue to Examination' : 'Verifying Hardware Permissions...'}
        </Button>
      </div>
    </div>
  );
};
