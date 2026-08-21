import React from 'react';
import { Link } from 'react-router-dom';
import { DashboardCard } from '../../components/common/DashboardCard';
import { Button } from '../../components/common/Button';
import {
  Users,
  GraduationCap,
  FileText,
  ShieldCheck,
  Plus,
  ArrowRight,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Institutional Administration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Platform governance, teacher access provisioning, and system configuration.
          </p>
        </div>

        <Link to="/admin/teachers">
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Authorize Teacher
          </Button>
        </Link>
      </div>

      {/* 4 Clean Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Total Students"
          value="248"
          subtitle="Enrolled candidates"
          icon={Users}
          accentColor="blue"
        />
        <DashboardCard
          title="Verified Teachers"
          value="12"
          subtitle="Faculty members"
          icon={GraduationCap}
          accentColor="indigo"
        />
        <DashboardCard
          title="Active Exams"
          value="06"
          subtitle="All courses"
          icon={FileText}
          accentColor="emerald"
        />
        <DashboardCard
          title="Platform Security"
          value="100%"
          subtitle="RLS Policies Active"
          icon={ShieldCheck}
          accentColor="cyan"
        />
      </div>

      {/* Quick Navigation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-card space-y-3">
          <h3 className="text-base font-bold text-slate-900">User Management</h3>
          <p className="text-xs text-slate-500">
            View, inspect, and manage student and instructor account access.
          </p>
          <Link to="/admin/users">
            <Button variant="secondary" size="sm" className="w-full text-xs" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Manage Users
            </Button>
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-card space-y-3">
          <h3 className="text-base font-bold text-slate-900">Teacher Access Keys</h3>
          <p className="text-xs text-slate-500">
            Generate and manage faculty verification tokens for registration.
          </p>
          <Link to="/admin/teachers">
            <Button variant="secondary" size="sm" className="w-full text-xs" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Manage Teachers
            </Button>
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-card space-y-3">
          <h3 className="text-base font-bold text-slate-900">Platform Settings</h3>
          <p className="text-xs text-slate-500">
            Configure examination policies, proctoring thresholds, and storage.
          </p>
          <Link to="/admin/settings">
            <Button variant="secondary" size="sm" className="w-full text-xs" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Open Settings
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
