import React, { useState } from 'react';
import { DashboardCard } from '../../components/common/DashboardCard';
import { LiveCandidateCard } from '../../components/teacher/LiveCandidateCard';
import { BroadcastModal } from '../../components/teacher/BroadcastModal';
import { TimeExtensionModal } from '../../components/teacher/TimeExtensionModal';
import { LiveCandidateSession, LiveCandidateStatus, BroadcastAnnouncement } from '../../types/liveExam';
import { Button } from '../../components/common/Button';
import { Link } from 'react-router-dom';
import {
  Activity,
  ShieldAlert,
  ArrowLeft,
  Search,
  CheckCircle2,
  Clock,
  Radio,
} from 'lucide-react';

export const LiveExamMonitorPage: React.FC = () => {
  const [candidates, setCandidates] = useState<LiveCandidateSession[]>([
    {
      studentId: 'stu-1',
      studentName: 'Alex Chen',
      studentEmail: 'alex.chen@chem.edu',
      status: 'writing',
      currentQuestionIndex: 3,
      totalQuestions: 5,
      answeredCount: 3,
      timeRemainingSeconds: 3450,
      strikeCount: 0,
      lastActiveTimestamp: 'Just now',
      isFlaggedSuspicious: false,
      ipAddress: '192.168.1.104',
      deviceInfo: 'Chrome / Windows',
    },
    {
      studentId: 'stu-2',
      studentName: 'Julian Thorne',
      studentEmail: 'j.thorne@chem.edu',
      status: 'flagged',
      currentQuestionIndex: 2,
      totalQuestions: 5,
      answeredCount: 2,
      timeRemainingSeconds: 3120,
      strikeCount: 2,
      lastActiveTimestamp: '2 mins ago',
      isFlaggedSuspicious: true,
      ipAddress: '185.220.101.5',
      deviceInfo: 'Edge / Windows',
    },
    {
      studentId: 'stu-3',
      studentName: 'Sarah Lin',
      studentEmail: 'sarah.lin@chem.edu',
      status: 'writing',
      currentQuestionIndex: 4,
      totalQuestions: 5,
      answeredCount: 4,
      timeRemainingSeconds: 3890,
      strikeCount: 0,
      lastActiveTimestamp: 'Just now',
      isFlaggedSuspicious: false,
      ipAddress: '192.168.1.118',
      deviceInfo: 'Firefox / macOS',
    },
    {
      studentId: 'stu-4',
      studentName: 'Marcus Holloway',
      studentEmail: 'm.holloway@chem.edu',
      status: 'idle',
      currentQuestionIndex: 1,
      totalQuestions: 5,
      answeredCount: 1,
      timeRemainingSeconds: 2900,
      strikeCount: 1,
      lastActiveTimestamp: '4 mins ago',
      isFlaggedSuspicious: false,
      ipAddress: '10.0.4.12',
      deviceInfo: 'Safari / iPadOS',
    },
    {
      studentId: 'stu-5',
      studentName: 'Priya Patel',
      studentEmail: 'priya.patel@chem.edu',
      status: 'submitted',
      currentQuestionIndex: 5,
      totalQuestions: 5,
      answeredCount: 5,
      timeRemainingSeconds: 0,
      strikeCount: 0,
      lastActiveTimestamp: 'Submitted 12m ago',
      isFlaggedSuspicious: false,
      ipAddress: '192.168.1.202',
      deviceInfo: 'Chrome / Windows',
    },
  ]);

  const [filterStatus, setFilterStatus] = useState<'all' | LiveCandidateStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [selectedCandidateForExtension, setSelectedCandidateForExtension] = useState<LiveCandidateSession | null>(null);
  const [activeBroadcast, setActiveBroadcast] = useState<BroadcastAnnouncement | null>(null);

  // Metrics
  const totalTakers = candidates.length;
  const writingCount = candidates.filter((c) => c.status === 'writing').length;
  const flaggedCount = candidates.filter((c) => c.status === 'flagged').length;
  const submittedCount = candidates.filter((c) => c.status === 'submitted').length;

  const filteredCandidates = candidates.filter((c) => {
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesSearch =
      c.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.studentEmail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleGrantTime = (studentId: string, additionalMinutes: number) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.studentId === studentId
          ? { ...c, timeRemainingSeconds: c.timeRemainingSeconds + additionalMinutes * 60 }
          : c
      )
    );
  };

  const handleSendWarning = (candidate: LiveCandidateSession) => {
    alert(`Dispatched formal faculty warning strike to ${candidate.studentName}!`);
    setCandidates((prev) =>
      prev.map((c) =>
        c.studentId === candidate.studentId
          ? { ...c, strikeCount: c.strikeCount + 1, status: 'flagged' }
          : c
      )
    );
  };

  const handleRequestReScan = (candidate: LiveCandidateSession) => {
    alert(`Dispatched mandatory 360° Environmental Room Re-Scan request to ${candidate.studentName}!`);
  };

  const handleForceSubmit = (candidate: LiveCandidateSession) => {
    if (confirm(`Are you sure you want to terminate and force-submit ${candidate.studentName}'s session?`)) {
      setCandidates((prev) =>
        prev.map((c) =>
          c.studentId === candidate.studentId
            ? { ...c, status: 'submitted' }
            : c
        )
      );
    }
  };

  const handleDispatchBroadcast = (message: string, severity: 'info' | 'important' | 'correction') => {
    const newBroadcast: BroadcastAnnouncement = {
      id: `bc-${Date.now()}`,
      examId: 'exam-act-001',
      instructorName: 'Dr. Evelyn Vance',
      message,
      severity,
      sentAt: new Date().toLocaleTimeString(),
    };
    setActiveBroadcast(newBroadcast);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6">
      {/* 1. Header Banner */}
      <div className="rounded-2xl bg-surface-100 border border-slate-700/80 p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-mono text-chem-300 bg-chem-500/10 px-2 py-0.5 rounded border border-chem-500/20">
              Live Proctoring Radar
            </span>
            <span className="text-xs text-slate-400">CHEM-302 • Active Testing Window</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            Real-Time Cohort Examination Radar
          </h1>
          <p className="text-xs text-slate-400">Live proctoring telemetry, tab focus tracking, and emergency broadcast console</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="glow"
            size="sm"
            leftIcon={<Radio className="w-4 h-4" />}
            onClick={() => setIsBroadcastOpen(true)}
          >
            Dispatch Live Broadcast
          </Button>

          <Link to="/teacher/dashboard">
            <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Active Broadcast Notification Banner if dispatched */}
      {activeBroadcast && (
        <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/50 flex items-center justify-between text-xs text-indigo-200">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span>
              <strong>Active Broadcast:</strong> {activeBroadcast.message}
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">{activeBroadcast.sentAt}</span>
        </div>
      )}

      {/* 2. Key Telemetry Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Active Candidates"
          value={`${writingCount}/${totalTakers}`}
          subtitle="Currently writing in browser"
          icon={Activity}
          accentColor="cyan"
        />
        <DashboardCard
          title="Flagged Anomalies"
          value={flaggedCount}
          subtitle="Multiple strikes or focus loss"
          icon={ShieldAlert}
          accentColor="rose"
        />
        <DashboardCard
          title="Submitted Papers"
          value={`${submittedCount}/${totalTakers}`}
          subtitle="Finalized submissions"
          icon={CheckCircle2}
          accentColor="emerald"
        />
        <DashboardCard
          title="Cohort Time Left"
          value="58 mins"
          subtitle="Average session remaining"
          icon={Clock}
          accentColor="amber"
        />
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-100 p-4 rounded-2xl border border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidate name or IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-1.5 rounded-lg bg-surface-200 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-chem-400 w-64"
          />
        </div>

        <div className="flex rounded-lg bg-surface-200 p-0.5 border border-slate-700 text-xs">
          {(['all', 'writing', 'flagged', 'idle', 'submitted'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-md capitalize font-medium transition-all ${
                filterStatus === st
                  ? 'bg-slate-800 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Live Candidate Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCandidates.map((candidate) => (
          <LiveCandidateCard
            key={candidate.studentId}
            candidate={candidate}
            onGrantTime={(cand) => setSelectedCandidateForExtension(cand)}
            onSendWarning={handleSendWarning}
            onRequestReScan={handleRequestReScan}
            onForceSubmit={handleForceSubmit}
          />
        ))}
      </div>

      {/* MODALS */}
      <BroadcastModal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
        onSendBroadcast={handleDispatchBroadcast}
      />

      <TimeExtensionModal
        isOpen={!!selectedCandidateForExtension}
        onClose={() => setSelectedCandidateForExtension(null)}
        candidate={selectedCandidateForExtension}
        onGrantTime={handleGrantTime}
      />
    </div>
  );
};
