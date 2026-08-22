// src/pages/admin/AdminTeachersPage.tsx
// Teacher Authorization Keys Management Desk for Institutional Administrator
import React, { useState, useEffect } from 'react';
import {
  getStoredTeacherCodes,
  generateTeacherCode,
  deleteTeacherCode,
  TeacherVerificationCode,
} from '../../lib/teacherCodeService';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Plus, CheckCircle2, Copy, Check, Trash2, KeyRound } from 'lucide-react';

export const AdminTeachersPage: React.FC = () => {
  const [verificationCodes, setVerificationCodes] = useState<TeacherVerificationCode[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFacultyEmail, setNewFacultyEmail] = useState('');
  const [newCodeSuccess, setNewCodeSuccess] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadCodes = () => {
    setVerificationCodes(getStoredTeacherCodes());
  };

  useEffect(() => {
    loadCodes();
  }, []);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const newCode = generateTeacherCode(newFacultyEmail);
    loadCodes();
    setNewCodeSuccess(newCode.code);
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string, code: string) => {
    if (window.confirm(`Are you sure you want to revoke teacher authorization code "${code}"?`)) {
      deleteTeacherCode(id);
      loadCodes();
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-1">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Faculty Verification Authority</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Teacher Authorization Keys
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Teachers cannot register without a mandatory verification code. Generate and issue keys below.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setNewCodeSuccess(null);
            setNewFacultyEmail('');
            setIsModalOpen(true);
          }}
        >
          Generate Faculty Key
        </Button>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-card overflow-hidden">
        {verificationCodes.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <KeyRound className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">No verification keys generated yet.</p>
            <p>Click 'Generate Faculty Key' to authorize an educator.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Verification Key</th>
                <th className="py-3.5 px-4">Recipient / Notes</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Expires</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {verificationCodes.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                    <div className="flex items-center gap-2">
                      <span>{c.code}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(c.code, c.id)}
                        className="p-1 text-slate-400 hover:text-blue-600 transition"
                        title="Copy Key"
                      >
                        {copiedId === c.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div>
                      <span className="block font-semibold text-slate-800">{c.issuedTo}</span>
                      {c.usedByEmail && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          Claimed by: {c.usedByEmail} ({c.usedByName})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {c.isUsed ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        Claimed / Used
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Available / Active
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{c.expiresAt}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{c.createdAt}</td>
                  <td className="py-3.5 px-4 text-right">
                    {!c.isUsed && (
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id, c.code)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Revoke Key"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Generate Key Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Generate Faculty Authorization Key"
          subtitle="Authorize an educator to create exams and access evidence review"
          maxWidth="md"
        >
          {newCodeSuccess ? (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Faculty Token Generated</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Give this mandatory verification code to the teacher to allow them to register.
                </p>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-base text-blue-700 font-extrabold tracking-wider mt-3 flex items-center justify-between">
                  <span>{newCodeSuccess}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(newCodeSuccess, 'new')}
                    className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                    title="Copy"
                  >
                    {copiedId === 'new' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button variant="secondary" size="sm" className="w-full" onClick={() => setIsModalOpen(false)}>
                Done
              </Button>
            </div>
          ) : (
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Instructor Name or Email (Optional Note)
                </label>
                <input
                  type="text"
                  value={newFacultyEmail}
                  onChange={(e) => setNewFacultyEmail(e.target.value)}
                  placeholder="e.g. Prof. Raman (Organic Chemistry)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Generate Key
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
};
