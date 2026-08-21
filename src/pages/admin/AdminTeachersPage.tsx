import React, { useState } from 'react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Plus, CheckCircle2 } from 'lucide-react';

export const AdminTeachersPage: React.FC = () => {
  const [verificationCodes, setVerificationCodes] = useState([
    {
      id: 'code-1',
      code: 'CHEM-FACULTY-2026-XP9R',
      issuedTo: 'Dr. Evelyn Vance (evelyn.vance@university.edu)',
      isUsed: true,
      expiresAt: '2026-06-30',
      createdAt: '2026-01-15',
    },
    {
      id: 'code-2',
      code: 'CHEM-FACULTY-2026-LM42',
      issuedTo: 'Prof. Aditya Kumar (aditya.kumar@university.edu)',
      isUsed: true,
      expiresAt: '2026-06-30',
      createdAt: '2026-02-01',
    },
    {
      id: 'code-3',
      code: 'CHEM-FACULTY-2026-Z7KQ',
      issuedTo: 'General Department Token',
      isUsed: false,
      expiresAt: '2026-09-30',
      createdAt: '2026-08-20',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFacultyEmail, setNewFacultyEmail] = useState('');
  const [newCodeSuccess, setNewCodeSuccess] = useState<string | null>(null);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `CHEM-FACULTY-2026-${suffix}`;

    setVerificationCodes([
      {
        id: `code-${Date.now()}`,
        code,
        issuedTo: newFacultyEmail || 'General Faculty Token',
        isUsed: false,
        expiresAt: '2026-12-31',
        createdAt: new Date().toISOString().split('T')[0],
      },
      ...verificationCodes,
    ]);

    setNewCodeSuccess(code);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Teacher Authorization Keys
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Issue and manage registration access tokens for authorized faculty members.
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
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-4">Verification Key</th>
              <th className="py-3.5 px-4">Issued Recipient</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Expires</th>
              <th className="py-3.5 px-4 text-right">Created Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {verificationCodes.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="py-3.5 px-4 font-mono font-bold text-blue-700">{c.code}</td>
                <td className="py-3.5 px-4">{c.issuedTo}</td>
                <td className="py-3.5 px-4">
                  {c.isUsed ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      Claimed / Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Available / Unused
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 font-mono text-slate-500">{c.expiresAt}</td>
                <td className="py-3.5 px-4 font-mono text-slate-500 text-right">{c.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Generate Key Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Generate Faculty Authorization Key"
          subtitle="Authorize an educator to access exam creation and evidence review"
          maxWidth="md"
        >
          {newCodeSuccess ? (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Faculty Token Generated</h4>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-sm text-blue-700 font-bold tracking-wider mt-2">
                  {newCodeSuccess}
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
                  Instructor Email (Optional)
                </label>
                <input
                  type="email"
                  value={newFacultyEmail}
                  onChange={(e) => setNewFacultyEmail(e.target.value)}
                  placeholder="professor@university.edu"
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
