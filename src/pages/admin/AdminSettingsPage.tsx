import React, { useState } from 'react';
import { Button } from '../../components/common/Button';
import { CheckCircle2, ShieldCheck, Lock } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const [requireRoomScan, setRequireRoomScan] = useState(true);
  const [maxStrikes, setMaxStrikes] = useState(3);
  const [retentionDays, setRetentionDays] = useState(30);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Platform proctoring configuration updated successfully.');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Platform Configuration
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Global proctoring policies and security configurations.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-card space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Integrity & Proctoring Defaults
          </h2>

          <div className="space-y-3 text-xs">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={requireRoomScan}
                onChange={(e) => setRequireRoomScan(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600"
              />
              <div>
                <strong className="text-slate-900 block">Mandatory 360° Environmental Room Scan</strong>
                <span className="text-slate-500">Require students to complete a 360° room scan before starting any examination.</span>
              </div>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-semibold text-slate-700 block">Max Warning Strikes</span>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={maxStrikes}
                  onChange={(e) => setMaxStrikes(parseInt(e.target.value) || 3)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-semibold text-slate-700 block">Evidence Video Retention (Days)</span>
                <input
                  type="number"
                  min={7}
                  max={180}
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(parseInt(e.target.value) || 30)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-card space-y-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-700 font-bold">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Database Security (PostgreSQL Row Level Security)</span>
          </div>
          <p className="text-slate-500 leading-relaxed">
            All evidence files and student examination attempts are isolated under Row Level Security. Teachers can only access attempts for their assigned examinations.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="text-xs font-bold"
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Save Configuration
          </Button>
        </div>
      </form>
    </div>
  );
};
