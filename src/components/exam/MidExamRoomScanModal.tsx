import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import {
  Camera,
  CheckCircle2,
  Compass,
} from 'lucide-react';

interface MidExamRoomScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteScan: () => void;
}

export const MidExamRoomScanModal: React.FC<MidExamRoomScanModalProps> = ({
  isOpen,
  onCompleteScan,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [cumulativeDegrees, setCumulativeDegrees] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const angleIntervalRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      setIsRecording(false);
      setSeconds(0);
      setCumulativeDegrees(0);
      setIsDone(false);
    }
  }, [isOpen]);

  const handleStart = () => {
    setIsRecording(true);
    setSeconds(0);
    setCumulativeDegrees(0);

    timerRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    angleIntervalRef.current = setInterval(() => {
      setCumulativeDegrees((prev) => (prev >= 360 ? 360 : prev + 24));
    }, 400);
  };

  const handleStop = () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (angleIntervalRef.current) clearInterval(angleIntervalRef.current);

    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setIsDone(true);
    }, 1200);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title="Security Check: Mid-Exam 360° Room Re-Scan"
      subtitle="Your instructor has requested a mandatory mid-exam environmental re-verification"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {isDone ? (
          <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-base font-bold text-white">
              Mid-Exam 360° Re-Scan Verified!
            </h3>
            <p className="text-xs text-slate-300">
              The environmental recording has been encrypted and synced with your proctoring logs. You may now resume your examination.
            </p>
            <div className="pt-2">
              <Button variant="glow" size="sm" onClick={onCompleteScan}>
                Resume Assessment
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="relative aspect-video rounded-2xl bg-slate-950 border border-slate-700 overflow-hidden flex items-center justify-center">
              {/* Simulated camera feed with radar */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-surface-200 to-slate-950 p-6 text-center">
                <div className="relative w-20 h-20 mb-2 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-rose-500/30 animate-ping" />
                  <div className="absolute inset-0 rounded-full border-t-2 border-chem-400 animate-spin" />
                  <Camera className="w-8 h-8 text-chem-300 relative z-10" />
                </div>
                <span className="text-xs font-bold text-white block">
                  Live 360° Mid-Exam Environmental Scanner
                </span>
              </div>

              {/* HUD Overlays */}
              <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-rose-950/80 backdrop-blur border border-rose-500 text-rose-300 text-[10px] font-mono font-bold">
                    SECURITY RE-SCAN ACTIVE
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur border border-slate-700 text-chem-300 text-[10px] font-mono font-bold flex items-center gap-1">
                    <Compass className="w-3 h-3 text-chem-400" />
                    <span>{cumulativeDegrees}° / 360°</span>
                  </span>
                </div>

                <div className="space-y-1 bg-slate-900/85 backdrop-blur p-2 rounded-xl border border-slate-700/80">
                  <div className="flex justify-between text-[10px] font-mono font-bold text-slate-300">
                    <span>{isRecording ? `REC: ${seconds}s • Pan 360°` : 'Stand by'}</span>
                    <span>{Math.round((cumulativeDegrees / 360) * 100)}% Coverage</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-chem-500 to-indigo-500 transition-all duration-200"
                      style={{ width: `${Math.min(100, (cumulativeDegrees / 360) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-2">
              {!isRecording ? (
                <Button
                  variant="glow"
                  size="md"
                  leftIcon={<Camera className="w-4 h-4" />}
                  onClick={handleStart}
                  disabled={isUploading}
                >
                  Start Mid-Exam 360° Re-Scan
                </Button>
              ) : (
                <Button
                  variant="danger"
                  size="md"
                  onClick={handleStop}
                  disabled={isUploading}
                >
                  {isUploading ? 'Encrypting Re-Scan...' : `Finish Re-Scan (${cumulativeDegrees}°)`}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
