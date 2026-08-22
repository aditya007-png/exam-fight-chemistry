// src/pages/admin/AdminTeachersPage.tsx
// Comprehensive Faculty Management Desk for Institutional Administrator
// Displays both Registered Faculty Members (with name editing) and Authorization Keys
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types/auth';
import { getTeachers, updateUserName, deleteUser, fetchProfilesFromDB } from '../../lib/userService';
import { getStoredClasses, fetchClassesFromDB } from '../../lib/classService';
import {
  getStoredTeacherCodes,
  fetchTeacherCodesFromDB,
  generateTeacherCode,
  deleteTeacherCode,
  TeacherVerificationCode,
} from '../../lib/teacherCodeService';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import {
  Plus,
  CheckCircle2,
  Copy,
  Check,
  Trash2,
  KeyRound,
  GraduationCap,
  Edit3,
  Search,
} from 'lucide-react';

export const AdminTeachersPage: React.FC = () => {
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [verificationCodes, setVerificationCodes] = useState<TeacherVerificationCode[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFacultyEmail, setNewFacultyEmail] = useState('');
  const [newCodeSuccess, setNewCodeSuccess] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit Teacher Name Modal
  const [editingTeacher, setEditingTeacher] = useState<UserProfile | null>(null);
  const [editNameInput, setEditNameInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = async () => {
    await fetchProfilesFromDB();
    await fetchTeacherCodesFromDB();
    await fetchClassesFromDB();
    setTeachers(getTeachers());
    setVerificationCodes(getStoredTeacherCodes());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const newCode = await generateTeacherCode(newFacultyEmail);
    await loadData();
    setNewCodeSuccess(newCode.code);
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteCode = async (id: string, code: string) => {
    if (window.confirm(`Are you sure you want to revoke teacher authorization code "${code}"?`)) {
      await deleteTeacherCode(id);
      await loadData();
    }
  };

  const handleOpenEdit = (t: UserProfile) => {
    setEditingTeacher(t);
    setEditNameInput(t.full_name);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher || !editNameInput.trim()) return;

    await updateUserName(editingTeacher.id, editNameInput.trim());
    await loadData();
    setEditingTeacher(null);
    setSuccessMessage(`Successfully updated faculty name to "${editNameInput.trim()}".`);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleDeleteTeacher = async (t: UserProfile) => {
    if (window.confirm(`Are you sure you want to remove teacher ${t.full_name} (${t.email}) from the platform?`)) {
      await deleteUser(t.id);
      await loadData();
      setSuccessMessage(`Removed teacher: ${t.full_name}.`);
      setTimeout(() => setSuccessMessage(null), 3500);
    }
  };

  const filteredTeachers = teachers.filter(
    (t) =>
      t.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-1">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Faculty Administration & Governance</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Teachers & Faculty Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View joined teachers, edit instructor profiles, and generate mandatory faculty authorization keys.
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

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ── SECTION 1: Registered Teachers Directory ── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Registered Faculty Members ({teachers.length})
            </h2>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search faculty by name/email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 shadow-card overflow-hidden">
          {filteredTeachers.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500 space-y-2">
              <GraduationCap className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700">No teachers registered yet.</p>
              <p>Teachers who join the website with an authorization key will appear here automatically.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Instructor Name</th>
                  <th className="py-3 px-4">Academic Email</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4">Classes</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTeachers.map((t) => {
                  const teacherClasses = getStoredClasses(t.id);

                  return (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                            {t.full_name ? t.full_name[0].toUpperCase() : 'T'}
                          </div>
                          <span>{t.full_name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{t.email}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {t.created_at ? new Date(t.created_at).toLocaleDateString() : 'Active'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-800">
                          {teacherClasses.length} {teacherClasses.length === 1 ? 'Class' : 'Classes'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Verified Faculty
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(t)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition flex items-center gap-1"
                            title="Edit Name"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Name</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTeacher(t)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Remove Teacher"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── SECTION 2: Faculty Verification Keys ── */}
      <div className="space-y-3 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              Teacher Verification Keys ({verificationCodes.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Mandatory tokens required during teacher registration
          </span>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 shadow-card overflow-hidden">
          {verificationCodes.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500 space-y-2">
              <KeyRound className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700">No verification keys generated yet.</p>
              <p>Click 'Generate Faculty Key' above to authorize an educator.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Verification Key</th>
                  <th className="py-3 px-4">Recipient / Notes</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Expires</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
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
                          onClick={() => handleDeleteCode(c.id, c.code)}
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
      </div>

      {/* Edit Teacher Name Modal */}
      {editingTeacher && (
        <Modal
          isOpen={!!editingTeacher}
          onClose={() => setEditingTeacher(null)}
          title="Edit Teacher Name"
          subtitle={`Modify display name for ${editingTeacher.email}`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Instructor Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editNameInput}
                onChange={(e) => setEditNameInput(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="secondary" size="sm" type="button" onClick={() => setEditingTeacher(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

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
