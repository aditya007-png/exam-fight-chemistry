import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NotificationDropdown } from './NotificationDropdown';
import { Button } from './Button';
import {
  Search,
  Menu,
  ChevronDown,
  LogOut,
  Shield,
  FlaskConical,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, showSidebarToggle = false }) => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const displayName = user?.full_name || 'User';
  const displayRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Student';

  // If in dashboard layout (sidebar toggle exists or user is authenticated inside dashboard)
  const isDashboardView = showSidebarToggle;

  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 shadow-2xs">
      {/* Left: Brand or Hamburger + Search */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
        {showSidebarToggle && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {!isDashboardView ? (
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <FlaskConical className="w-4 h-4" />
            </div>
            <span className="text-base font-bold text-slate-900 tracking-tight">
              Exam Fight <span className="text-blue-600">Chemistry</span>
            </span>
          </Link>
        ) : (
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search exams, students, questions..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        )}
      </div>

      {/* Right Navigation */}
      <div className="flex items-center gap-3">
        {/* If inside public layout and user is already logged in */}
        {!isDashboardView && user && (
          <div className="flex items-center gap-3">
            <Link to={role === 'teacher' ? '/teacher/dashboard' : role === 'admin' ? '/admin/dashboard' : '/student/dashboard'}>
              <Button variant="primary" size="sm">
                Go to Dashboard →
              </Button>
            </Link>
          </div>
        )}

        {/* If inside Dashboard Layout */}
        {isDashboardView && (
          <>
            <NotificationDropdown />

            {/* User Profile Card & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-50 transition-colors focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  {displayName.charAt(0)}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 leading-tight">
                    {displayName}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {displayRole}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 rounded-2xl bg-white border border-slate-200 shadow-dropdown py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{displayName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email || 'user@chem.edu'}</p>
                  </div>

                  <Link
                    to={role === 'teacher' ? '/teacher/profile' : '/student/profile'}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Shield className="w-4 h-4 text-blue-600" />
                    Profile & Diagnostics
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
};
