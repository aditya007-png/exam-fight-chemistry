import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { LiveCandidateSession } from '../../types/liveExam';
import { Clock, CheckCircle2 } from 'lucide-react';

interface TimeExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: LiveCandidateSession | null;
  onGrantTime: (studentId: string, additionalMinutes: number) => void;
}

export const TimeExtensionModal: React.FC<TimeExtensionModalProps> = ({
  isOpen,
  onClose,
  candidate,
  onGrantTime,
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState(5);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!candidate) return null;

  const handleConfirm = () => {
    onGrantTime(candidate.studentId, selectedMinutes);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Grant Exam Time Extension"
      subtitle={`Extend active examination window for ${candidate.studentName}`}
      maxWidth="sm"
    >
      {isSuccess ? (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500 text-emerald-300 text-center font-bold flex items-center justify-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          +{selectedMinutes} Minutes added to {candidate.studentName}'s exam session!
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Select the additional time duration to grant to candidate{' '}
            <strong className="text-white">{candidate.studentName}</strong>:
          </p>

          <div className="grid grid-cols-4 gap-2">
            {[5, 10, 15, 30].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setSelectedMinutes(mins)}
                className={`py-3 rounded-xl border text-xs font-mono font-bold transition-all ${
                  selectedMinutes === mins
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                    : 'bg-surface-200 border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                +{mins}m
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="glow"
              size="sm"
              leftIcon={<Clock className="w-4 h-4" />}
              onClick={handleConfirm}
            >
              Confirm +{selectedMinutes} Mins
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
