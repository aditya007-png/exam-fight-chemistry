import React, { useState } from 'react';
import { DashboardCard } from '../../components/common/DashboardCard';
import { Button } from '../../components/common/Button';
import {
  BarChart3,
  Award,
  Download,
  CheckCircle2,
  TrendingUp,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const TeacherAnalyticsPage: React.FC = () => {
  const [selectedCohort, setSelectedCohort] = useState('CHEM-301');

  const gradeHistogram = [
    { grade: 'A+', count: 8, percentage: 21, color: 'bg-emerald-600' },
    { grade: 'A', count: 14, percentage: 36, color: 'bg-blue-600' },
    { grade: 'B', count: 10, percentage: 26, color: 'bg-indigo-600' },
    { grade: 'C', count: 4, percentage: 10, color: 'bg-amber-500' },
    { grade: 'D', count: 2, percentage: 5, color: 'bg-orange-500' },
    { grade: 'F', count: 1, percentage: 2, color: 'bg-rose-600' },
  ];

  const topicWeaknesses = [
    {
      topic: 'Reaction Mechanisms (SN1 vs SN2 & Rearrangements)',
      domain: 'Organic Chemistry',
      accuracy: 68,
      difficulty: 'High',
      recommendation: 'Focus on carbocation hydride/methanide shift stability in next lecture.',
    },
    {
      topic: 'Thermodynamics & Gibbs Spontaneity Equations',
      domain: 'Physical Chemistry',
      accuracy: 84,
      difficulty: 'Medium',
      recommendation: 'Good mastery of ΔG° = ΔH° - TΔS° unit conversions.',
    },
    {
      topic: 'Crystal Field Theory & d-Orbital Splitting',
      domain: 'Inorganic Chemistry',
      accuracy: 72,
      difficulty: 'High',
      recommendation: 'Review strong-field vs weak-field spectrochemical series pairings.',
    },
    {
      topic: 'NMR & IR Spectroscopic Elucidation',
      domain: 'Analytical Chemistry',
      accuracy: 91,
      difficulty: 'Low',
      recommendation: 'Excellent proficiency in chemical shift assignments.',
    },
  ];

  const handleExportCSV = () => {
    const csvContent =
      'Student Name,Email,Exam Title,Score,Total Marks,Grade,Status,Integrity Score\n' +
      'Alex Chen,alex.chen@chem.edu,Thermodynamics Midterm,92,100,A+,PASSED,98%\n' +
      'Sarah Lin,sarah.lin@chem.edu,Thermodynamics Midterm,88,100,A,PASSED,96%\n' +
      'Julian Thorne,j.thorne@chem.edu,Thermodynamics Midterm,64,100,C,PASSED,64%\n' +
      'Marcus Holloway,m.holloway@chem.edu,Thermodynamics Midterm,82,100,B,PASSED,94%\n' +
      'Priya Patel,priya.patel@chem.edu,Thermodynamics Midterm,95,100,A+,PASSED,100%\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CHEM_COHORT_GRADEBOOK_${selectedCohort}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* 1. Banner */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Departmental Analytics
            </span>
            <span className="text-xs text-slate-500">Term: Spring 2026</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Chemistry Performance & Cohort Analytics
          </h1>
          <p className="text-xs text-slate-500">Statistical grade distributions, topic weakness matrices, and question discrimination curves</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedCohort}
            onChange={(e) => setSelectedCohort(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold"
          >
            <option value="CHEM-301">CHEM-301: Organic Synthesis</option>
            <option value="CHEM-302">CHEM-302: Physical Thermodynamics</option>
            <option value="CHEM-401">CHEM-401: Advanced Inorganic</option>
          </select>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download className="w-4 h-4 text-blue-600" />}
            onClick={handleExportCSV}
          >
            Export Gradebook CSV
          </Button>

          <Link to="/teacher/dashboard">
            <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Cohort Mean Score"
          value="81.4%"
          subtitle="Median: 84.0% (+3.2% vs midterm)"
          icon={Award}
          accentColor="blue"
          trend={{ value: '3.2%', isPositive: true }}
        />
        <DashboardCard
          title="Pass / Clearance Rate"
          value="97.4%"
          subtitle="38 of 39 candidates passed"
          icon={CheckCircle2}
          accentColor="emerald"
        />
        <DashboardCard
          title="Standard Deviation (σ)"
          value="8.6 pts"
          subtitle="Gaussian curve normal"
          icon={TrendingUp}
          accentColor="indigo"
        />
        <DashboardCard
          title="Avg Assessment Time"
          value="52.4m"
          subtitle="Allotted duration: 90 mins"
          icon={BarChart3}
          accentColor="cyan"
        />
      </div>

      {/* 3. Grade Distribution Gaussian Histogram */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Cohort Grade Distribution Curve
            </h2>
            <p className="text-xs text-slate-500">Distribution breakdown across standard letter grading thresholds</p>
          </div>
          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
            N = 39 Students
          </span>
        </div>

        <div className="grid grid-cols-6 gap-3 items-end h-48 pt-6 pb-2 px-2 bg-slate-50 rounded-xl border border-slate-100">
          {gradeHistogram.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end">
              <span className="text-[11px] font-mono font-bold text-slate-700">
                {item.count} ({item.percentage}%)
              </span>
              <div className="w-full bg-slate-200 rounded-t-xl overflow-hidden h-36 flex items-end">
                <div
                  className={`w-full ${item.color} rounded-t-xl transition-all duration-500 shadow-xs`}
                  style={{ height: `${item.percentage * 2.5}%` }}
                />
              </div>
              <span className="text-xs font-bold text-slate-900 font-mono">{item.grade}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Topic Mastery & Weakness Diagnostics */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-card space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            Topic Mastery & Curriculum Weakness Diagnostics
          </h2>
          <p className="text-xs text-slate-500">
            Automated recommendations based on student question responses and error frequency
          </p>
        </div>

        <div className="space-y-3">
          {topicWeaknesses.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 hover:border-slate-300 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{item.topic}</span>
                  <span className="text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-medium">
                    {item.domain}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-500">Difficulty: <strong className="text-slate-800">{item.difficulty}</strong></span>
                  <span className="font-mono font-bold text-blue-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {item.accuracy}% Accuracy
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    item.accuracy >= 80 ? 'bg-emerald-600' : item.accuracy >= 70 ? 'bg-blue-600' : 'bg-amber-500'
                  }`}
                  style={{ width: `${item.accuracy}%` }}
                />
              </div>

              <p className="text-xs text-slate-600 pt-0.5">
                <strong className="text-slate-800">Faculty Recommendation:</strong> {item.recommendation}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
