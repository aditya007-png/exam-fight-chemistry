import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../common/Navbar';
import { ShieldCheck, Mail, Lock, BookOpen, FlaskConical } from 'lucide-react';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col relative selection:bg-blue-500 selection:text-white">
      {/* Public Header */}
      <Navbar />

      {/* Main Public Page Content */}
      <main className="flex-1">{children}</main>

      {/* Clean Educational Footer */}
      <footer className="border-t border-slate-200 bg-white pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-slate-100">
            {/* Brand column */}
            <div className="space-y-3">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <span className="text-base font-bold text-slate-900 tracking-tight">
                  Exam Fight <span className="text-blue-600">Chemistry</span>
                </span>
              </Link>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                Unified chemistry examination platform with intelligent question authoring, 360° room scan verification, and live academic integrity monitoring.
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-700 pt-1 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified Academic Security</span>
              </div>
            </div>

            {/* Platform Features Links */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Platform & Capabilities</h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>
                  <span className="hover:text-blue-600 transition-colors">
                    Chemistry Question Authoring & Virtual Keyboard
                  </span>
                </li>
                <li>
                  <span className="hover:text-blue-600 transition-colors">
                    360° Environmental Room Scan Verification
                  </span>
                </li>
                <li>
                  <span className="hover:text-blue-600 transition-colors">
                    Continuous Camera & Microphone Monitoring
                  </span>
                </li>
                <li>
                  <span className="hover:text-blue-600 transition-colors">
                    Centralized Evidence Review Console
                  </span>
                </li>
              </ul>
            </div>

            {/* Legal & Governance */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Governance & Support</h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>
                  <span className="hover:text-blue-600 transition-colors cursor-pointer" onClick={() => alert('Privacy Policy: All examination proctoring streams and audio recordings are encrypted and retained strictly per institution policy.')}>
                    Privacy Policy
                  </span>
                </li>
                <li>
                  <span className="hover:text-blue-600 transition-colors cursor-pointer" onClick={() => alert('Terms: Examination integrity standards are enforced under institutional honor code guidelines.')}>
                    Terms of Academic Service
                  </span>
                </li>
                <li>
                  <a href="mailto:support@examfight.edu" className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    Contact Examination Support
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Exam Fight Chemistry. All rights reserved.</p>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-blue-600" />
                Role-Based Authorization Protected
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-indigo-600" />
                IUPAC Chemistry Standards
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
