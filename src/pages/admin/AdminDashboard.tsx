import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStudents, getTeachers } from '../../lib/userService';
import { getStoredExams, getAllStoredAttempts } from '../../lib/examService';
import { getStoredClasses, getStoredSections } from '../../lib/classService';
import { DashboardCard } from '../../components/common/DashboardCard';
import { Button } from '../../components/common/Button';
import {
  Users,
  GraduationCap,
  FileText,
  Plus,
  ArrowRight,
  BookOpen,
  Layers,
  Award,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [studentCount, setStudentCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [classCount, setClassCount] = useState(0);
  const [sectionCount, setSectionCount] = useState(0);
  const [examCount, setExamCount] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);

  useEffect(() => {
    setStudentCount(getStudents().length);
    setTeacherCount(getTeachers().length);
    setClassCount(getStoredClasses().length);
    setSectionCount(getStoredSections().length);
    setExamCount(getStoredExams().length);
    setAttemptCount(getAllStoredAttempts().length);
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Institutional Administration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Platform governance, class cohorts, user provisioning, exam oversight, and student complaints management.
          </p>
        </div>

        <Link to="/admin/teachers">
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Authorize Teacher
          </Button>
        </Link>
      </div>

      {/* Real Dynamically Computed Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <DashboardCard
          title="Students"
          value={studentCount.toString().padStart(2, '0')}
          subtitle="Enrolled candidates"
          icon={Users}
          accentColor="blue"
        />
        <DashboardCard
          title="Teachers"
          value={teacherCount.toString().padStart(2, '0')}
          subtitle="Verified faculty"
          icon={GraduationCap}
          accentColor="indigo"
        />
        <DashboardCard
          title="Classes"
          value={classCount.toString().padStart(2, '0')}
          subtitle="Academic courses"
          icon={BookOpen}
          accentColor="cyan"
        />
        <DashboardCard
          title="Sections"
          value={sectionCount.toString().padStart(2, '0')}
          subtitle="Class cohorts"
          icon={Layers}
          accentColor="indigo"
        />
        <DashboardCard
          title="Exams"
          value={examCount.toString().padStart(2, '0')}
          subtitle="Created exams"
          icon={FileText}
          accentColor="emerald"
        />
        <DashboardCard
          title="Attempts"
          value={attemptCount.toString().padStart(2, '0')}
          subtitle="Student submissions"
          icon={Award}
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
