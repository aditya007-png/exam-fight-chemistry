// src/components/common/ContactSupportModal.tsx
// Interactive Contact Support / Complaint submission modal with auto-populated user info & screenshot attachment
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from './Modal';
import { Button } from './Button';
import { submitComplaint, SupportComplaint } from '../../lib/supportService';
import {
  LifeBuoy,
  Upload,
  CheckCircle2,
  X,
  User,
  Mail,
  Shield,
} from 'lucide-react';

interface ContactSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactSupportModal: React.FC<ContactSupportModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  // Auto-filled info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [userRole, setUserRole] = useState<'student' | 'teacher' | 'admin' | 'guest'>('student');

  // Form State
  const [category, setCategory] = useState<SupportComplaint['category']>('Proctoring / Camera Issue');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.full_name || '');
      setEmail(user.email || '');
      setUserId(user.id || `usr-${Date.now()}`);
      setUserRole(user.role || 'student');
    } else {
      setName('Guest User');
      setEmail('');
      setUserId(`guest-${Date.now()}`);
      setUserRole('guest');
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit. Please attach a smaller screenshot.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveScreenshot = () => {
    setScreenshotPreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setIsSubmitting(true);
    const complaint = submitComplaint({
      userId: userId || `id-${Date.now()}`,
      userName: name || 'Anonymous',
      userEmail: email || 'user@chem.edu',
      userRole,
      category,
      subject: subject.trim(),
      description: description.trim(),
      screenshotUrl: screenshotPreview,
    });

    setIsSubmitting(false);
    setSubmittedTicket(complaint.ticketNumber);
  };

  const handleResetAndClose = () => {
    setSubmittedTicket(null);
    setSubject('');
    setDescription('');
    setScreenshotPreview(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleResetAndClose}
      title="Contact Support & Issue Reporting"
      subtitle="Submit an inquiry, exam proctoring complaint, or technical issue to the administration"
      maxWidth="lg"
    >
      {submittedTicket ? (
        <div className="py-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Complaint Ticket Filed Successfully
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Your issue report has been securely registered in the central administration review desk. An administrator will review your logs and resolve your ticket.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 inline-block font-mono text-sm text-blue-700 font-bold tracking-wider">
            Ticket ID: {submittedTicket}
          </div>

          <div className="pt-2">
            <Button variant="primary" size="md" onClick={handleResetAndClose}>
              Done / Return to Platform
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Auto-filled Info Bar */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">User Name (Auto)</span>
                <span className="font-bold text-slate-800 truncate block">{name || 'User'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">User ID / Email</span>
                <span className="font-mono text-slate-700 truncate block text-[11px]">
                  {email || userId}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Role Verified</span>
                <span className="capitalize font-bold text-blue-700">{userRole}</span>
              </div>
            </div>
          </div>

          {/* Issue Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Issue Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="Proctoring / Camera Issue">Proctoring / Camera / Microphone Issue</option>
              <option value="Room Scan Difficulty">360° Room Scan Verification Difficulty</option>
              <option value="Question / KaTeX Notation Bug">Question Content / KaTeX Notation Error</option>
              <option value="Exam Submission Issue">Exam Submission / Timer Inquiry</option>
              <option value="Account / Profile Assistance">Account / Name Change Assistance</option>
              <option value="General Feedback">General Feedback / Other Inquiry</option>
            </select>
          </div>

          {/* Subject Line */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Subject Line <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Camera disconnected during thermodynamics exam question 5"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Complaint Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Detailed Description of Complaint <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Explain the problem in detail. Include question numbers, device behavior, or timestamps if applicable..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>

          {/* Optional Screenshot Attachment */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Attach Screenshot <span className="text-slate-400 font-normal">(Optional)</span>
            </label>

            {screenshotPreview ? (
              <div className="relative p-2 rounded-xl border border-slate-200 bg-slate-50 inline-block">
                <img
                  src={screenshotPreview}
                  alt="Complaint Attachment Preview"
                  className="max-h-36 rounded-lg object-contain border border-slate-200 bg-white"
                />
                <button
                  type="button"
                  onClick={handleRemoveScreenshot}
                  className="absolute top-3 right-3 p-1 rounded-full bg-rose-600 text-white shadow-xs hover:bg-rose-700 transition"
                  title="Remove Screenshot"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-50/50 hover:bg-blue-50/30 transition text-center">
                <Upload className="w-5 h-5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-700">
                  Click to upload screenshot or drag & drop
                </span>
                <span className="text-[10px] text-slate-400">PNG, JPG, WebP up to 5MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="secondary" size="sm" type="button" onClick={handleResetAndClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={isSubmitting}
              leftIcon={<LifeBuoy className="w-4 h-4" />}
            >
              Submit Complaint
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
