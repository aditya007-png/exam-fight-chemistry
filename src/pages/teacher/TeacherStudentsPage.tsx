import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Search, ShieldCheck } from 'lucide-react';

export const TeacherStudentsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const students = [
    {
      id: 'stu-rahul-01',
      attemptId: 'att-rahul',
      name: 'Rahul Sharma',
      email: 'rahul.sharma@university.edu',
      class: '12-A',
      examsTaken: 4,
      avgScore: '84%',
      integrityScore: 92,
      status: 'Verified',
    },
    {
      id: 'stu-priya-02',
      attemptId: 'att-priya',
      name: 'Priya Patel',
      email: 'priya.patel@university.edu',
      class: '12-B',
      examsTaken: 5,
      avgScore: '95%',
      integrityScore: 99,
      status: 'Verified',
    },
    {
      id: 'stu-arjun-03',
      attemptId: 'att-arjun',
      name: 'Arjun Mehta',
      email: 'arjun.mehta@university.edu',
      class: '11-A',
      examsTaken: 3,
      avgScore: '58%',
      integrityScore: 61,
      status: 'Review Required',
    },
    {
      id: 'demo-student-001',
      attemptId: 'att-001',
      name: 'Alex Chen',
      email: 'alex.chen@university.edu',
      class: '12-A',
      examsTaken: 4,
      avgScore: '92%',
      integrityScore: 98,
      status: 'Verified',
    },
  ];

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.class.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Assigned Students
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Students enrolled in your chemistry examination cohorts.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student or class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-4">Student</th>
              <th className="py-3.5 px-4">Class</th>
              <th className="py-3.5 px-4">Exams Taken</th>
              <th className="py-3.5 px-4">Average Score</th>
              <th className="py-3.5 px-4">Integrity Status</th>
              <th className="py-3.5 px-4 text-right">Evidence Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredStudents.map((stu) => (
              <tr key={stu.id} className="hover:bg-slate-50">
                <td className="py-4 px-4 font-bold text-slate-900">
                  <div>{stu.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono font-normal">{stu.email}</div>
                </td>
                <td className="py-4 px-4 font-mono font-bold text-blue-700">{stu.class}</td>
                <td className="py-4 px-4 font-mono">{stu.examsTaken}</td>
                <td className="py-4 px-4 font-mono font-bold text-slate-900">{stu.avgScore}</td>
                <td className="py-4 px-4">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      stu.integrityScore >= 80
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {stu.status} ({stu.integrityScore}%)
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <Link to={`/teacher/evidence-review?attempt=${stu.attemptId}`}>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-xs py-1 px-3"
                      leftIcon={<ShieldCheck className="w-3.5 h-3.5 text-blue-600" />}
                    >
                      Review Evidence
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
