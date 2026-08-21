import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Send, CheckCircle2 } from 'lucide-react';

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendBroadcast: (message: string, severity: 'info' | 'important' | 'correction') => void;
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({
  isOpen,
  onClose,
  onSendBroadcast,
}) => {
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<'info' | 'important' | 'correction'>('important');
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    onSendBroadcast(message, severity);
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      onClose();
      setMessage('');
    }, 1000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Live Candidate Broadcast Dispatcher"
      subtitle="Push an instant pop-up announcement to all active exam screens"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {sentSuccess ? (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500 text-emerald-300 text-center font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Announcement successfully dispatched to all active exam players!
          </div>
        ) : (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Announcement Classification
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['info', 'important', 'correction'] as const).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverity(sev)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold capitalize border transition-all ${
                      severity === sev
                        ? 'bg-chem-500/20 text-chem-300 border-chem-400 shadow-sm'
                        : 'bg-surface-200 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Broadcast Announcement Message
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Notice: In Question 4, the temperature is 298.15 K under standard 1 atm state..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3 rounded-xl bg-surface-200 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-chem-400"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" size="sm" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="glow"
                size="sm"
                type="submit"
                leftIcon={<Send className="w-4 h-4" />}
              >
                Dispatch Broadcast
              </Button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
};
