// src/pages/admin/AdminDashboard.tsx
// Real Institutional Administration Dashboard with dynamic statistics calculation
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStudents, getTeachers } from '../../lib/userService';
import { getStoredExams } from '../../lib/examService';
import { getStoredComplaints } from '../../lib/supportService';
import { DashboardCard } from '../../components/common/DashboardCard';
import { Button } from '../../components/common/Button';
import {
  Users,
  GraduationCap,
  FileText,
  LifeBuoy,
  Plus,
  ArrowRight,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [studentCount, setStudentCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [examCount, setExamCount] = useState(0);
  const [openComplaintsCount, setOpenComplaintsCount] = useState(0);

  useEffect(() => {
    setStudentCount(getStudents().length);
    setTeacherCount(getTeachers().length);
    setExamCount(getStoredExams().length);
    setOpenComplaintsCount(
      getStoredComplaints().filter((c) => c.status === 'Open').length
    );
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Institutional Administration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Platform governance, user provisioning, exam oversight, and student complaints management.
          </p>
        </div>

        <Link to="/admin/teachers">
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Authorize Teacher
          </Button>
        </Link>
      </div>

      {/* 4 Real Dynamically Computed Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Total Students"
          value={studentCount.toString().padStart(2, '0')}
          subtitle="Enrolled candidates"
          icon={Users}
          accentColor="blue"
        />
        <DashboardCard
          title="Verified Teachers"
          value={teacherCount.toString().padStart(2, '0')}
          subtitle="Faculty members"
          icon={GraduationCap}
          accentColor="indigo"
        />
        <DashboardCard
          title="Active Exams"
          value={examCount.toString().padStart(2, '0')}
          subtitle="All created exams"
          icon={FileText}
          accentColor="emerald"
        />
        <DashboardCard
          title="Open Complaints"
          value={openComplaintsCount.toString().padStart(2, '0')}
          subtitle="Pending admin resolution"
          icon={LifeBuoy}
          accentColor="amber"
        />
      </div>

      {/* Quick Navigation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-card space-y-3">
          <h3 className="text-base font-bold text-slate-900">User Directory</h3>
          <p className="text-xs text-slate-500">
            View, edit names, and manage student and instructor account access.
          </p>
          <Link to="/admin/users">
            <Button variant="secondary" size="sm" className="w-full text-xs" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Manage Users
            </Button>
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-card space-y-3">
          <h3 className="text-base font-bold text-slate-900">Support & Complaints</h3>
          <p className="text-xs text-slate-500">
            Inspect screenshots and resolve tickets submitted by students and teachers.
          </p>
          <Link to="/admin/complaints">
            <Button variant="secondary" size="sm" className="w-full text-xs" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Review Complaints
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
