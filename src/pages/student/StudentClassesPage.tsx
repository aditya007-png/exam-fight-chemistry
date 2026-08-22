// src/pages/student/StudentClassesPage.tsx
// Student Class Enrollment and Cohort Directory with Join Class modal
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  AcademicClass,
  AcademicSection,
  ClassEnrollment,
} from '../../types/academic';
import {
  getStudentEnrolledClasses,
  joinClassByCode,
} from '../../lib/classService';
import { getStoredExams } from '../../lib/examService';
import { ExamItem } from '../../types/dashboard';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import {
  GraduationCap,
  Plus,
  BookOpen,
  User,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const StudentClassesPage: React.FC = () => {
  const { user } = useAuth();
  const studentId = user?.id || '';
  const studentName = user?.full_name || 'Student';
  const studentEmail = user?.email || '';

  const [enrolledClasses, setEnrolledClasses] = useState<
    Array<{ class: AcademicClass; section: AcademicSection; enrollment: ClassEnrollment }>
  >([]);
  const [allExams, setAllExams] = useState<ExamItem[]>([]);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [enrollmentCodeInput, setEnrollmentCodeInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

  const loadData = () => {
    if (studentId) {
      const list = getStudentEnrolledClasses(studentId);
      setEnrolledClasses(list);
    }
    setAllExams(getStoredExams());
  };

  useEffect(() => {
    loadData();
  }, [studentId]);

  const handleJoinClass = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    setJoinSuccess(null);

    const result = joinClassByCode(
      studentId,
      studentName,
      studentEmail,
      enrollmentCodeInput
    );

    if (result.success) {
      setJoinSuccess(`Successfully joined ${result.className} — ${result.sectionName}!`);
      setEnrollmentCodeInput('');
      loadData();
      setTimeout(() => {
        setIsJoinModalOpen(false);
        setJoinSuccess(null);
      }, 2000);
    } else {
      setJoinError(result.error || 'Failed to join class. Please check the enrollment code.');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-blue-600" />
            <span>My Enrolled Classes & Sections</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Access your course sections, faculty instructors, and assigned chemistry examinations.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setJoinError(null);
            setJoinSuccess(null);
            setIsJoinModalOpen(true);
          }}
        >
          Join Class
        </Button>
      </div>

      {enrolledClasses.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center shadow-card space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-blue-600">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">Not Enrolled in Any Classes Yet</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Ask your teacher for your section enrollment code (e.g. <span className="font-mono font-bold text-slate-700">CSE-A7K29</span>) to join your academic class and receive assigned exams.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            leftIcon={<KeyRound className="w-4 h-4" />}
            onClick={() => {
              setJoinError(null);
              setJoinSuccess(null);
              setIsJoinModalOpen(true);
            }}
          >
            Enter Section Enrollment Code
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {enrolledClasses.map(({ class: cls, section: sec, enrollment: enr }) => {
            // Find exams assigned to this section
            const sectionExams = allExams.filter(
              (ex) => ex.sectionId === sec.id || ex.classId === cls.id
            );

            return (
              <div
                key={enr.id}
                className="rounded-2xl bg-white border border-slate-200 p-5 shadow-card space-y-4 hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {cls.classCode}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        {cls.name}
                      </h3>
                      <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded inline-block mt-1">
                        {sec.name}
                      </span>
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold inline-flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Enrolled
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Teacher: <strong className="font-semibold">{cls.teacherName}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Academic Year: {cls.academicYear}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Joined: {new Date(enr.joinedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Section Assigned Exams */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      Assigned Exams
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {sectionExams.length} {sectionExams.length === 1 ? 'Exam' : 'Exams'}
                    </span>
                  </div>

                  {sectionExams.length > 0 ? (
                    <div className="space-y-1.5">
                      {sectionExams.slice(0, 2).map((ex) => (
                        <Link
                          key={ex.id}
                          to={`/student/exam/${ex.id}`}
                          className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-all flex items-center justify-between text-xs text-slate-800"
                        >
                          <span className="font-semibold truncate max-w-[180px]">{ex.title}</span>
                          <span className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5">
                            Start <ArrowRight className="w-3 h-3" />
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      No exams currently scheduled for this section.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Join Class Modal */}
      {isJoinModalOpen && (
        <Modal
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
          title="Join Academic Class / Section"
        >
          <form onSubmit={handleJoinClass} className="space-y-4 text-xs">
            <p className="text-slate-500">
              Enter the unique Section Enrollment Code provided by your teacher to enroll into your class cohort.
            </p>

            {joinError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{joinError}</span>
              </div>
            )}

            {joinSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{joinSuccess}</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Section Enrollment Code <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE-A7K29"
                  value={enrollmentCodeInput}
                  onChange={(e) => setEnrollmentCodeInput(e.target.value.toUpperCase())}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-sm font-bold placeholder-slate-400 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => setIsJoinModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Join Class
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
