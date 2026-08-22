// src/pages/teacher/TeacherStudentsPage.tsx
// Teacher Student Management with dynamic name editing and cohort controls
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserProfile } from '../../types/auth';
import { getStudents, updateUserName, createUser, deleteUser } from '../../lib/userService';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Search, ShieldCheck, Edit3, UserPlus, CheckCircle2, Trash2, Users } from 'lucide-react';

export const TeacherStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Edit Student Name Modal State
  const [editingStudent, setEditingStudent] = useState<UserProfile | null>(null);
  const [editNameInput, setEditNameInput] = useState('');

  // Add Student Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadStudents = () => {
    const list = getStudents();
    setStudents(list);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleOpenEdit = (stu: UserProfile) => {
    setEditingStudent(stu);
    setEditNameInput(stu.full_name);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !editNameInput.trim()) return;

    updateUserName(editingStudent.id, editNameInput.trim());
    loadStudents();
    setEditingStudent(null);
    setSuccessMessage(`Updated student name to "${editNameInput.trim()}".`);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addEmail.trim()) return;

    createUser(addEmail.trim(), addName.trim(), 'student');
    loadStudents();
    setIsAddModalOpen(false);
    setAddName('');
    setAddEmail('');
    setSuccessMessage(`Enrolled student: ${addName.trim()}.`);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleRemoveStudent = (stu: UserProfile) => {
    if (window.confirm(`Remove student ${stu.full_name} (${stu.email}) from class?`)) {
      deleteUser(stu.id);
      loadStudents();
      setSuccessMessage(`Removed student: ${stu.full_name}.`);
      setTimeout(() => setSuccessMessage(null), 3500);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Assigned Students
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Students enrolled in your chemistry cohorts. Edit student names and inspect proctoring evidence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Enroll Student
          </Button>
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="rounded-2xl bg-white border border-slate-200 shadow-card overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No students enrolled yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Students will automatically appear here once they register or when you enroll them.
            </p>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<UserPlus className="w-4 h-4" />}
              onClick={() => setIsAddModalOpen(true)}
            >
              Enroll Student
            </Button>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Academic Email</th>
                <th className="py-3.5 px-4">Enrolled Date</th>
                <th className="py-3.5 px-4">Integrity Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredStudents.map((stu) => (
                <tr key={stu.id} className="hover:bg-slate-50">
                  <td className="py-4 px-4 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <span>{stu.full_name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-mono text-slate-500">{stu.email}</td>
                  <td className="py-4 px-4 text-slate-400 font-mono">
                    {new Date(stu.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Verified Active
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(stu)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition flex items-center gap-1"
                        title="Edit Student Name"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Name</span>
                      </button>

                      <Link to="/teacher/evidence-review">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-xs py-1 px-3"
                          leftIcon={<ShieldCheck className="w-3.5 h-3.5 text-blue-600" />}
                        >
                          Evidence
                        </Button>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleRemoveStudent(stu)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Remove Student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Student Name Modal */}
      {editingStudent && (
        <Modal
          isOpen={Boolean(editingStudent)}
          onClose={() => setEditingStudent(null)}
          title="Edit Student Name"
          subtitle={`Account: ${editingStudent.email}`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Student Full Name
              </label>
              <input
                type="text"
                required
                value={editNameInput}
                onChange={(e) => setEditNameInput(e.target.value)}
                placeholder="Enter new student name"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setEditingStudent(null)}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Save Name
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Enroll New Student"
          subtitle="Add a student candidate to your chemistry class cohort"
          maxWidth="md"
        >
          <form onSubmit={handleAddStudent} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Student Full Name
              </label>
              <input
                type="text"
                required
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="e.g. Alex Chen"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Academic Email
              </label>
              <input
                type="email"
                required
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="student@university.edu"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Enroll Student
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
