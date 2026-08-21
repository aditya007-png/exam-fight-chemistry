import React from 'react';
import { UserRole } from '../../types/auth';
import { Shield, GraduationCap, School, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  size = 'md',
  showIcon = true,
}) => {
  const configs = {
    student: {
      label: 'Student',
      icon: GraduationCap,
      className: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    teacher: {
      label: 'Teacher',
      icon: School,
      className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    admin: {
      label: 'Administrator',
      icon: Shield,
      className: 'bg-amber-50 text-amber-800 border-amber-200',
    },
  };

  const config = configs[role] || configs.student;
  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${sizeClasses} ${config.className}`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span className="capitalize">{config.label}</span>
    </span>
  );
};

interface StatusBadgeProps {
  status: 'active' | 'scheduled' | 'completed' | 'draft' | 'archived' | 'passed' | 'failed' | 'warning' | 'live' | 'review';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const configs = {
    live: {
      label: 'Live',
      icon: Clock,
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold',
    },
    active: {
      label: 'Live',
      icon: Clock,
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold',
    },
    scheduled: {
      label: 'Scheduled',
      icon: Clock,
      className: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    completed: {
      label: 'Completed',
      icon: CheckCircle2,
      className: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    review: {
      label: 'Review',
      icon: AlertCircle,
      className: 'bg-amber-50 text-amber-700 border-amber-200 font-bold',
    },
    draft: {
      label: 'Draft',
      icon: AlertCircle,
      className: 'bg-slate-100 text-slate-600 border-slate-200',
    },
    archived: {
      label: 'Archived',
      icon: AlertCircle,
      className: 'bg-slate-100 text-slate-500 border-slate-200',
    },
    passed: {
      label: 'Passed',
      icon: CheckCircle2,
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold',
    },
    failed: {
      label: 'Needs Review',
      icon: AlertCircle,
      className: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    warning: {
      label: 'Review',
      icon: AlertCircle,
      className: 'bg-amber-50 text-amber-700 border-amber-200 font-bold',
    },
  };

  const config = configs[status] || configs.draft;
  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${sizeClasses} ${config.className}`}
    >
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
    </span>
  );
};
