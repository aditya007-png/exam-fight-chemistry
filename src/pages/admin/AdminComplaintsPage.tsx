// src/pages/admin/AdminComplaintsPage.tsx
// Admin Support & Complaints Resolution Workspace
import React, { useState, useEffect } from 'react';
import {
  getStoredComplaints,
  updateComplaintStatus,
  deleteComplaint,
  SupportComplaint,
} from '../../lib/supportService';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import {
  LifeBuoy,
  Search,
  CheckCircle2,
  Trash2,
  Eye,
  Check,
  ExternalLink,
} from 'lucide-react';

export const AdminComplaintsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<SupportComplaint[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Open' | 'In Progress' | 'Resolved'>('all');

  // Inspect / Resolve Modal State
  const [selectedTicket, setSelectedTicket] = useState<SupportComplaint | null>(null);
  const [statusInput, setStatusInput] = useState<'Open' | 'In Progress' | 'Resolved'>('Open');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadComplaints = () => {
    setComplaints(getStoredComplaints());
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const handleOpenInspect = (ticket: SupportComplaint) => {
    setSelectedTicket(ticket);
    setStatusInput(ticket.status);
    setResolutionNotes(ticket.resolutionNotes || '');
  };

  const handleSaveResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    updateComplaintStatus(selectedTicket.id, statusInput, resolutionNotes.trim());
    loadComplaints();
    setSelectedTicket(null);
    setSuccessMessage(`Ticket ${selectedTicket.ticketNumber} updated to "${statusInput}".`);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleDelete = (ticket: SupportComplaint) => {
    if (window.confirm(`Delete ticket ${ticket.ticketNumber}?`)) {
      deleteComplaint(ticket.id);
      loadComplaints();
      setSuccessMessage(`Ticket ${ticket.ticketNumber} removed.`);
      setTimeout(() => setSuccessMessage(null), 3500);
    }
  };

  const filtered = complaints.filter((c) => {
    const matchesSearch =
      c.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openCount = complaints.filter((c) => c.status === 'Open').length;
  const inProgressCount = complaints.filter((c) => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Support Tickets & Complaints
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review, inspect screenshots, and resolve complaints submitted by students and faculty.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ticket, name, issue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-2xl border text-left transition ${
            statusFilter === 'all'
              ? 'bg-blue-50 border-blue-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-semibold text-slate-500">Total Tickets</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{complaints.length}</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Open')}
          className={`p-4 rounded-2xl border text-left transition ${
            statusFilter === 'Open'
              ? 'bg-rose-50 border-rose-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-semibold text-rose-700">Open Complaints</div>
          <div className="text-2xl font-extrabold text-rose-800 mt-1">{openCount}</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('In Progress')}
          className={`p-4 rounded-2xl border text-left transition ${
            statusFilter === 'In Progress'
              ? 'bg-amber-50 border-amber-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-semibold text-amber-700">In Progress</div>
          <div className="text-2xl font-extrabold text-amber-800 mt-1">{inProgressCount}</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Resolved')}
          className={`p-4 rounded-2xl border text-left transition ${
            statusFilter === 'Resolved'
              ? 'bg-emerald-50 border-emerald-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-semibold text-emerald-700">Resolved</div>
          <div className="text-2xl font-extrabold text-emerald-800 mt-1">{resolvedCount}</div>
        </button>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Complaints Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No complaints reported</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Any support inquiries or proctoring complaints submitted by users will appear here for admin review.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Ticket</th>
                <th className="py-3.5 px-4">Submitted By</th>
                <th className="py-3.5 px-4">Category & Subject</th>
                <th className="py-3.5 px-4">Screenshot</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                    {ticket.ticketNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{ticket.userName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {ticket.userEmail} • <span className="capitalize font-bold text-slate-600">{ticket.userRole}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs">
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 block w-fit mb-0.5">
                      {ticket.category}
                    </span>
                    <span className="font-semibold text-slate-900 truncate block">
                      {ticket.subject}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {ticket.screenshotUrl ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        Image Attached
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        ticket.status === 'Resolved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : ticket.status === 'In Progress'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-xs py-1 px-3"
                        leftIcon={<Eye className="w-3.5 h-3.5 text-blue-600" />}
                        onClick={() => handleOpenInspect(ticket)}
                      >
                        Inspect & Resolve
                      </Button>
                      <button
                        type="button"
                        onClick={() => handleDelete(ticket)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete Ticket"
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

      {/* Inspect & Resolve Ticket Modal */}
      {selectedTicket && (
        <Modal
          isOpen={Boolean(selectedTicket)}
          onClose={() => setSelectedTicket(null)}
          title={`Ticket ${selectedTicket.ticketNumber} — ${selectedTicket.category}`}
          subtitle={`Reported by ${selectedTicket.userName} (${selectedTicket.userRole})`}
          maxWidth="lg"
        >
          <form onSubmit={handleSaveResolution} className="space-y-4">
            {/* User Metadata */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">User Name & Role</span>
                <span className="font-bold text-slate-900">{selectedTicket.userName}</span>
                <span className="text-[11px] text-blue-700 capitalize font-semibold ml-1">
                  ({selectedTicket.userRole})
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Email & User ID</span>
                <span className="font-mono text-slate-800">{selectedTicket.userEmail}</span>
                <span className="text-[10px] text-slate-400 block truncate">{selectedTicket.userId}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Reported Timestamp</span>
                <span className="font-mono text-slate-700">
                  {new Date(selectedTicket.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Subject & Description */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Subject: {selectedTicket.subject}
              </h4>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                {selectedTicket.description}
              </div>
            </div>

            {/* Attached Screenshot (if any) */}
            {selectedTicket.screenshotUrl && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700">Attached Screenshot:</span>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <a
                    href={selectedTicket.screenshotUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative block overflow-hidden rounded-lg"
                  >
                    <img
                      src={selectedTicket.screenshotUrl}
                      alt="User Attachment"
                      className="max-h-56 w-full object-contain bg-white rounded-lg border border-slate-200"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                      <ExternalLink className="w-4 h-4" /> Click to view full image
                    </div>
                  </a>
                </div>
              </div>
            )}

            {/* Status Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Update Ticket Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setStatusInput('Open')}
                  className={`py-2 rounded-xl border text-xs font-bold transition ${
                    statusInput === 'Open'
                      ? 'bg-rose-50 border-rose-500 text-rose-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  Open
                </button>
                <button
                  type="button"
                  onClick={() => setStatusInput('In Progress')}
                  className={`py-2 rounded-xl border text-xs font-bold transition ${
                    statusInput === 'In Progress'
                      ? 'bg-amber-50 border-amber-500 text-amber-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  In Progress
                </button>
                <button
                  type="button"
                  onClick={() => setStatusInput('Resolved')}
                  className={`py-2 rounded-xl border text-xs font-bold transition ${
                    statusInput === 'Resolved'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  Resolved
                </button>
              </div>
            </div>

            {/* Admin Resolution Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Admin Resolution Notes / Corrective Actions Taken
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Exam attempt reset granted for student; camera bandwidth drop verified in logs."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setSelectedTicket(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                leftIcon={<Check className="w-4 h-4" />}
              >
                Save & Update Resolution
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
