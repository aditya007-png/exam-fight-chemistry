import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ContactSupportModal } from './ContactSupportModal';
import {
  LayoutDashboard,
  FileText,
  Users,
  ShieldCheck,
  Award,
  User,
  Settings,
  Inbox,
  Atom,
  LifeBuoy,
  BookOpen,
  Headphones,
  FlaskConical,
  GraduationCap,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { role } = useAuth();
  const location = useLocation();
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  // Strict navigation items per role
  const getNavItems = () => {
    if (role === 'teacher') {
      return [
        { label: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
        { label: 'Classes', path: '/teacher/classes', icon: GraduationCap },
        { label: 'Students', path: '/teacher/students', icon: Users },
        { label: 'Exams', path: '/teacher/exams', icon: FileText },
        { label: 'Results & Marks', path: '/teacher/results', icon: Award },
        { label: 'Requests', path: '/teacher/requests', icon: Inbox },
        { label: 'Evidence Review', path: '/teacher/evidence-review', icon: ShieldCheck },
        { label: 'Profile', path: '/teacher/profile', icon: User },
      ];
    }

    if (role === 'admin') {
      return [
        { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Classes', path: '/admin/classes', icon: BookOpen },
        { label: 'Teachers', path: '/admin/teachers', icon: GraduationCap },
        { label: 'Users', path: '/admin/users', icon: Users },
        { label: 'Complaints', path: '/admin/complaints', icon: LifeBuoy },
        { label: 'Settings', path: '/admin/settings', icon: Settings },
      ];
    }

    // Student role (default)
    return [
      { label: 'Home', path: '/student/dashboard', icon: LayoutDashboard },
      { label: 'My Classes', path: '/student/classes', icon: GraduationCap },
      { label: 'My Exams', path: '/student/exams', icon: FileText },
      { label: 'My Requests', path: '/student/requests', icon: Inbox },
      { label: 'Periodic Table', path: '/student/periodic-table', icon: Atom },
      { label: 'Results', path: '/student/results', icon: Award },
      { label: 'Profile', path: '/student/profile', icon: User },
    ];
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-60 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Top Brand Header */}
          <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-slate-900 leading-tight">
                Exam Fight
              </span>
              <span className="text-[11px] font-medium text-slate-500 tracking-wide">
                Chemistry
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="p-3.5 space-y-1 flex-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <NavLink
                  key={item.label}
                  to={item.path}
                  onClick={() => onClose()}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Bottom "Need Help?" Card */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/70 m-3 rounded-2xl border border-slate-200/80">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Headphones className="w-4 h-4" />
              </div>
              <h5 className="text-xs font-bold text-slate-900">Need Help?</h5>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
              File a complaint or technical issue with administration.
            </p>
            <button
              onClick={() => setIsSupportModalOpen(true)}
              className="w-full py-1.5 px-3 rounded-xl bg-white border border-slate-200 hover:border-blue-300 text-xs font-semibold text-blue-700 shadow-xs hover:bg-blue-50 transition-all text-center block"
            >
              Contact Support
            </button>
          </div>
        </div>
      </aside>

      {/* Support & Complaint Modal */}
      {isSupportModalOpen && (
        <ContactSupportModal
          isOpen={isSupportModalOpen}
          onClose={() => setIsSupportModalOpen(false)}
        />
      )}
    </>
  );
};
