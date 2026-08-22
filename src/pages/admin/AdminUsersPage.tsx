// src/pages/admin/AdminUsersPage.tsx
// Complete User Directory Management for Admin (Edit names of teachers and students, remove users, add users)
import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../../types/auth';
import { getStoredUsers, updateUserName, deleteUser, createUser, fetchProfilesFromDB } from '../../lib/userService';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Search, Edit3, Trash2, UserPlus, CheckCircle2, Shield } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');

  // Edit Name Modal State
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editNameInput, setEditNameInput] = useState('');

  // Add User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState<UserRole>('student');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load users from persistent storage & PostgreSQL DB
  const loadUsers = async () => {
    await fetchProfilesFromDB();
    setUsers(getStoredUsers());
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenEdit = (user: UserProfile) => {
    setEditingUser(user);
    setEditNameInput(user.full_name);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editNameInput.trim()) return;

    await updateUserName(editingUser.id, editNameInput.trim());
    await loadUsers();
    setEditingUser(null);
    setSuccessMessage(`Updated name for ${editingUser.email} to "${editNameInput.trim()}".`);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleDelete = async (user: UserProfile) => {
    if (user.role === 'admin' && users.filter((u) => u.role === 'admin').length <= 1) {
      alert('Cannot delete the primary Administrator account.');
      return;
    }

    if (window.confirm(`Are you sure you want to remove ${user.full_name} (${user.email})?`)) {
      await deleteUser(user.id);
      await loadUsers();
      setSuccessMessage(`Removed user: ${user.full_name}.`);
      setTimeout(() => setSuccessMessage(null), 3500);
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addEmail.trim() || !addName.trim()) return;

    createUser(addEmail.trim(), addName.trim(), addRole);
    loadUsers();
    setIsAddModalOpen(false);
    setAddName('');
    setAddEmail('');
    setSuccessMessage(`Successfully registered ${addRole}: ${addName.trim()}.`);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            User Directory & Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin directory: edit names, manage roles, and provision teacher or student accounts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-44 sm:w-56"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
          >
            <option value="all">All Roles ({users.length})</option>
            <option value="student">Students ({users.filter((u) => u.role === 'student').length})</option>
            <option value="teacher">Teachers ({users.filter((u) => u.role === 'teacher').length})</option>
            <option value="admin">Admins ({users.filter((u) => u.role === 'admin').length})</option>
          </select>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add User
          </Button>
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No users found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {roleFilter !== 'all'
                ? `No ${roleFilter} accounts registered yet.`
                : 'No users match your search query.'}
            </p>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<UserPlus className="w-4 h-4" />}
              onClick={() => setIsAddModalOpen(true)}
            >
              Add New User
            </Button>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Full Name</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{u.email}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`capitalize font-bold text-[10px] px-2 py-0.5 rounded border ${
                        u.role === 'admin'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : u.role === 'teacher'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(u)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition flex items-center gap-1"
                        title="Edit Name"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Name</span>
                      </button>

                      {u.role !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => handleDelete(u)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Name Modal */}
      {editingUser && (
        <Modal
          isOpen={Boolean(editingUser)}
          onClose={() => setEditingUser(null)}
          title={`Edit ${editingUser.role === 'teacher' ? 'Teacher' : editingUser.role === 'student' ? 'Student' : 'Admin'} Name`}
          subtitle={`Account: ${editingUser.email}`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={editNameInput}
                onChange={(e) => setEditNameInput(e.target.value)}
                placeholder="Enter new full name"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setEditingUser(null)}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add User Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Provision New User"
          subtitle="Add a new candidate or faculty member to the platform directory"
          maxWidth="md"
        >
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAddRole('student')}
                  className={`py-2 rounded-xl border text-xs font-bold transition ${
                    addRole === 'student'
                      ? 'bg-blue-50 border-blue-500 text-blue-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setAddRole('teacher')}
                  className={`py-2 rounded-xl border text-xs font-bold transition ${
                    addRole === 'teacher'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  Teacher
                </button>
                <button
                  type="button"
                  onClick={() => setAddRole('admin')}
                  className={`py-2 rounded-xl border text-xs font-bold transition ${
                    addRole === 'admin'
                      ? 'bg-amber-50 border-amber-500 text-amber-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="e.g. Dr. Jane Doe or John Smith"
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
                placeholder="name@university.edu"
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
                Create User
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
