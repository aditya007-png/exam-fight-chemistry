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
  fetchEnrollmentsFromDB,
  joinClassByCode,
} from '../../lib/classService';
import { getStoredExams, fetchExamsFromDB } from '../../lib/examService';
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
  Clock,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const StudentClassesPage: React.FC = () => {
  const { user } = useAuth();
  const studentId = user?.id || '';
  const studentName = user?.full_name || 'Aditya Student';
  const studentEmail = user?.email || '';

  const [enrolledClasses, setEnrolledClasses] = useState<
    Array<{ class: AcademicClass; section: AcademicSection; enrollment: ClassEnrollment }>
  >([]);
  const [allExams, setAllExams] = useState<ExamItem[]>([]);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [enrollmentCodeInput, setEnrollmentCodeInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccessData, setJoinSuccessData] = useState<{
    className: string;
    sectionName: string;
    teacherName: string;
  } | null>(null);

  const loadData = async () => {
    let list = getStudentEnrolledClasses(studentId, studentEmail);
    setEnrolledClasses(list);

    if (studentId || studentEmail) {
      await fetchEnrollmentsFromDB(studentId);
      await fetchExamsFromDB();
      list = getStudentEnrolledClasses(studentId, studentEmail);
      setEnrolledClasses(list);
    }
    setAllExams(getStoredExams());
  };

  useEffect(() => {
    loadData();
  }, [studentId, studentEmail]);

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    setJoinSuccessData(null);

    const result = await joinClassByCode(
      studentId,
      studentName,
      studentEmail,
      enrollmentCodeInput
    );

    if (result.success) {
      setJoinSuccessData({
        className: result.className || 'Chemistry Course',
        sectionName: result.sectionName || 'Section A',
        teacherName: result.teacherName || 'Faculty Instructor',
      });
      setEnrollmentCodeInput('');
      await loadData();
      setTimeout(() => {
        setIsJoinModalOpen(false);
        setJoinSuccessData(null);
      }, 2500);
    } else {
      setJoinError(result.error || 'Failed to join class. Please verify the enrollment code with your teacher.');
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
            setJoinSuccessData(null);
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
              Ask your teacher for your section enrollment code (e.g. <span className="font-mono font-bold text-slate-700">CHEM-A8X9</span>) to join your academic class and receive assigned exams.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setJoinError(null);
              setJoinSuccessData(null);
              setIsJoinModalOpen(true);
            }}
          >
            Join Your First Class
          </Button>
        </div>
      ) : (
        /* Classes Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {enrolledClasses.map(({ class: cls, section: sec, enrollment: enr }) => {
            const sectionExams = allExams.filter(
              (e) =>
                (!e.sectionId && !e.classId) ||
                (e.sectionId && e.sectionId === sec.id) ||
                (e.classId && e.classId === cls.id)
            );

            return (
              <div
                key={enr.id}
                className="rounded-2xl bg-white border border-slate-200 p-6 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {cls.classCode}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-1.5 leading-snug">
                        {cls.name}
                      </h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {sec.name}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Teacher: <strong className="text-slate-900">{cls.teacherName || enr.teacherName}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Enrolled: <span className="font-mono text-slate-700">{new Date(enr.joinedAt).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section Exams */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                    Assigned Examinations ({sectionExams.length})
                  </span>

                  {sectionExams.length > 0 ? (
                    <div className="space-y-2">
                      {sectionExams.slice(0, 2).map((exam) => (
                        <div
                          key={exam.id}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 block truncate max-w-[200px]">
                              {exam.title}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" /> {exam.durationMinutes} min • {exam.totalMarks || 100} marks
                            </span>
                          </div>

                          <Link to={`/student/exam/${exam.id}`}>
                            <Button variant="primary" size="sm" className="text-xs py-1 px-2.5 font-bold">
                              Start Exam
                            </Button>
                          </Link>
                        </div>
                      ))}
                      {sectionExams.length > 2 && (
                        <Link
                          to="/student/exams"
                          className="text-xs text-blue-600 font-semibold hover:underline block text-center pt-1"
                        >
                          + {sectionExams.length - 2} more exams in this class →
                        </Link>
                      )}
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

            {joinSuccessData && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Joined Successfully!</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-emerald-200/60">
                  <div>
                    <span className="text-[10px] text-emerald-700 uppercase font-semibold block">Class</span>
                    <span className="font-bold text-slate-900">{joinSuccessData.className}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-700 uppercase font-semibold block">Section</span>
                    <span className="font-bold text-slate-900">{joinSuccessData.sectionName}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-emerald-700 uppercase font-semibold block">Teacher</span>
                    <span className="font-bold text-slate-900">{joinSuccessData.teacherName}</span>
                  </div>
                </div>
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
                  placeholder="e.g. CHEM-A8X9"
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
