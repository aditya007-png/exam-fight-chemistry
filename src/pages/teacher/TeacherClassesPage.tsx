// src/pages/teacher/TeacherClassesPage.tsx
// Complete Class, Section, and Enrollment Code Management for Teachers
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  AcademicClass,
  AcademicSection,
  ClassEnrollment,
} from '../../types/academic';
import {
  getStoredClasses,
  fetchClassesFromDB,
  createClass,
  deleteClass,
  getStoredSections,
  fetchSectionsFromDB,
  createSection,
  regenerateSectionCode,
  deleteSection,
  getStoredEnrollments,
  fetchEnrollmentsFromDB,
  removeStudentFromSection,
} from '../../lib/classService';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import {
  BookOpen,
  Plus,
  Copy,
  Check,
  Users,
  Trash2,
  Search,
  Layers,
  ShieldCheck,
  KeyRound,
  RefreshCw,
  UserX,
  GraduationCap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const TeacherClassesPage: React.FC = () => {
  const { user } = useAuth();
  const teacherId = user?.id || '';
  const teacherName = user?.full_name || 'Faculty Instructor';

  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [sections, setSections] = useState<AcademicSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<ClassEnrollment[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Create Class Modal
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassCode, setNewClassCode] = useState('');
  const [newAcademicYear, setNewAcademicYear] = useState('2026-27');
  const [newDescription, setNewDescription] = useState('');

  // Create Section Modal
  const [isCreateSectionOpen, setIsCreateSectionOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  const loadData = async () => {
    let clsList = getStoredClasses(teacherId);
    setClasses(clsList);

    if (teacherId) {
      const dbClasses = await fetchClassesFromDB(teacherId);
      if (dbClasses.length > 0) {
        clsList = dbClasses;
        setClasses(dbClasses);
      }
    }

    if (clsList.length > 0) {
      const activeClsId = selectedClassId || clsList[0].id;
      if (!selectedClassId) setSelectedClassId(activeClsId);

      await fetchSectionsFromDB(activeClsId);
      const secList = getStoredSections(activeClsId);
      setSections(secList);

      const activeSecId = selectedSectionId || (secList.length > 0 ? secList[0].id : null);
      if (!selectedSectionId && activeSecId) setSelectedSectionId(activeSecId);

      if (activeSecId) {
        await fetchEnrollmentsFromDB();
        const enrList = getStoredEnrollments({ sectionId: activeSecId });
        setEnrollments(enrList);
      } else {
        setEnrollments([]);
      }
    } else {
      setSections([]);
      setEnrollments([]);
    }
  };

  useEffect(() => {
    loadData();
  }, [teacherId, selectedClassId, selectedSectionId]);

  const handleSelectClass = async (clsId: string) => {
    setSelectedClassId(clsId);
    await fetchSectionsFromDB(clsId);
    const secList = getStoredSections(clsId);
    setSections(secList);
    if (secList.length > 0) {
      setSelectedSectionId(secList[0].id);
      setEnrollments(getStoredEnrollments({ sectionId: secList[0].id }));
    } else {
      setSelectedSectionId(null);
      setEnrollments([]);
    }
  };

  const handleSelectSection = (secId: string) => {
    setSelectedSectionId(secId);
    setEnrollments(getStoredEnrollments({ sectionId: secId }));
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim() || !newClassCode.trim()) return;

    const created = await createClass(
      teacherId,
      teacherName,
      newClassName,
      newClassCode,
      newAcademicYear,
      newDescription
    );

    setIsCreateClassOpen(false);
    setNewClassName('');
    setNewClassCode('');
    setNewDescription('');
    setSelectedClassId(created.id);
    await loadData();

    setSuccessToast(`Class "${created.name}" created successfully with Section A!`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !newSectionName.trim()) return;

    const cls = classes.find((c) => c.id === selectedClassId);
    const createdSec = await createSection(selectedClassId, cls?.name || 'Class', newSectionName);

    setIsCreateSectionOpen(false);
    setNewSectionName('');
    setSelectedSectionId(createdSec.id);
    await loadData();

    setSuccessToast(`Section "${createdSec.name}" created with code ${createdSec.enrollmentCode}!`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleRegenerateCode = async (secId: string) => {
    if (window.confirm('Regenerating will invalidate the previous code for new students. Continue?')) {
      const newCode = await regenerateSectionCode(secId);
      await loadData();
      setSuccessToast(`New enrollment code generated: ${newCode}`);
      setTimeout(() => setSuccessToast(null), 3500);
    }
  };

  const handleDeleteClass = async (clsId: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete class "${name}" and all its sections?`)) {
      await deleteClass(clsId);
      setSelectedClassId(null);
      setSelectedSectionId(null);
      await loadData();
      setSuccessToast(`Class "${name}" deleted.`);
      setTimeout(() => setSuccessToast(null), 3500);
    }
  };

  const handleDeleteSection = async (secId: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      await deleteSection(secId);
      setSelectedSectionId(null);
      await loadData();
      setSuccessToast(`Section "${name}" deleted.`);
      setTimeout(() => setSuccessToast(null), 3500);
    }
  };

  const handleRemoveStudent = async (enrId: string, studentName: string) => {
    if (window.confirm(`Remove student ${studentName} from this section?`)) {
      await removeStudentFromSection(enrId);
      await loadData();
      setSuccessToast(`Removed ${studentName} from section.`);
      setTimeout(() => setSuccessToast(null), 3500);
    }
  };

  const currentClass = classes.find((c) => c.id === selectedClassId);
  const currentSection = sections.find((s) => s.id === selectedSectionId);

  const filteredEnrollments = enrollments.filter(
    (e) =>
      e.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.studentEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successToast}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-blue-600" />
            <span>Classes & Cohort Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Organize academic classes, create sections, generate enrollment keys, and track enrolled students.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsCreateClassOpen(true)}
        >
          Create New Class
        </Button>
      </div>

      {classes.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center shadow-card space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-blue-600">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">No Classes Created Yet</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Create your first academic class (e.g. B.Tech CSE, Grade 12 Chemistry) to start enrolling students and assigning exams.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateClassOpen(true)}
          >
            Create Your First Class
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Classes and Sections Selector (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Classes List */}
            <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-card space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Your Classes ({classes.length})
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreateClassOpen(true)}
                  className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> New Class
                </button>
              </div>

              <div className="space-y-2">
                {classes.map((cls) => {
                  const isSelected = cls.id === selectedClassId;
                  const clsSections = getStoredSections(cls.id);
                  const clsEnrollments = getStoredEnrollments({ classId: cls.id });

                  return (
                    <div
                      key={cls.id}
                      onClick={() => handleSelectClass(cls.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                        isSelected
                          ? 'bg-blue-50/80 border-blue-500 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 leading-snug">
                            {cls.name}
                          </h4>
                          <span className="text-[11px] font-mono text-blue-700 font-semibold bg-blue-100/60 px-1.5 py-0.5 rounded">
                            {cls.classCode}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClass(cls.id, cls.name);
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                          title="Delete Class"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-slate-400" />
                          {clsSections.length} {clsSections.length === 1 ? 'Section' : 'Sections'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          {clsEnrollments.length} Students
                        </span>
                        <span className="text-slate-400">{cls.academicYear}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sections in Selected Class */}
            {currentClass && (
              <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-card space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Sections in {currentClass.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCreateSectionOpen(true)}
                    className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Section
                  </button>
                </div>

                {sections.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-400">
                    No sections in this class yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sections.map((sec) => {
                      const isSecSelected = sec.id === selectedSectionId;
                      const secEnrollments = getStoredEnrollments({ sectionId: sec.id });

                      return (
                        <div
                          key={sec.id}
                          onClick={() => handleSelectSection(sec.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSecSelected
                              ? 'bg-indigo-50/80 border-indigo-500 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">
                              {sec.name}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-100/70 px-1.5 py-0.5 rounded">
                                {sec.enrollmentCode}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {secEnrollments.length} enrolled
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyCode(sec.enrollmentCode);
                              }}
                              className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                              title="Copy Code"
                            >
                              {copiedCode === sec.enrollmentCode ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            {sections.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSection(sec.id, sec.name);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                title="Delete Section"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Section Detail & Enrolled Students Roster (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {currentSection ? (
              <>
                {/* Active Section Key Card */}
                <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-card space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono font-bold">
                          {currentClass?.classCode}
                        </span>
                        <h2 className="text-lg font-bold text-slate-900">
                          {currentClass?.name} — {currentSection.name}
                        </h2>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Students use the unique enrollment key below to join this section.
                      </p>
                    </div>

                    <Link to="/teacher/create-exam">
                      <Button variant="secondary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                        Create Exam for this Section
                      </Button>
                    </Link>
                  </div>

                  {/* Enrollment Key Banner */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Section Enrollment Key
                      </span>
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-blue-600" />
                        <span className="font-mono text-xl font-extrabold text-blue-900 tracking-wider">
                          {currentSection.enrollmentCode}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyCode(currentSection.enrollmentCode)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                      >
                        {copiedCode === currentSection.enrollmentCode ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Key</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRegenerateCode(currentSection.id)}
                        className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs transition-colors"
                        title="Regenerate Code"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Enrolled Students Roster */}
                <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-card space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-600" />
                        <span>Enrolled Students ({enrollments.length})</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Active student roster for {currentSection.name}.
                      </p>
                    </div>

                    <div className="relative w-full sm:w-60">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search student..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {filteredEnrollments.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                      <Users className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-semibold text-slate-600">
                        No students enrolled in this section yet.
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                        Share enrollment key <strong className="font-mono text-slate-700">{currentSection.enrollmentCode}</strong> with your students to have them join.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold">
                            <th className="py-2.5 px-3">Student Name</th>
                            <th className="py-2.5 px-3">Email Address</th>
                            <th className="py-2.5 px-3">Enrolled Date</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {filteredEnrollments.map((enr) => (
                            <tr key={enr.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                                  {enr.studentName.charAt(0)}
                                </div>
                                <span>{enr.studentName}</span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                                {enr.studentEmail}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                                {new Date(enr.joinedAt).toLocaleDateString()}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold inline-flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3" /> Active
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStudent(enr.id, enr.studentName)}
                                  className="text-slate-400 hover:text-rose-600 p-1 transition-colors text-[11px] font-medium"
                                  title="Remove from Section"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center shadow-card text-xs text-slate-400">
                Select a class and section from the left column to view enrollment keys and student rosters.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Create Class */}
      {isCreateClassOpen && (
        <Modal
          isOpen={isCreateClassOpen}
          onClose={() => setIsCreateClassOpen(false)}
          title="Create New Academic Class"
        >
          <form onSubmit={handleCreateClass} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Class Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. B.Tech CSE or Grade 12 Organic Chemistry"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Class Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE2026 or CHEM12"
                  value={newClassCode}
                  onChange={(e) => setNewClassCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Academic Year
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2026-27"
                  value={newAcademicYear}
                  onChange={(e) => setNewAcademicYear(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Brief course objectives or batch details..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => setIsCreateClassOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Create Class
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Create Section */}
      {isCreateSectionOpen && (
        <Modal
          isOpen={isCreateSectionOpen}
          onClose={() => setIsCreateSectionOpen(false)}
          title={`Add Section to ${currentClass?.name}`}
        >
          <form onSubmit={handleCreateSection} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Section Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Section B or Batch 2"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-[11px] text-blue-800">
              A unique enrollment code (e.g. {currentClass?.classCode}-BXXXX) will be generated automatically for this section.
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => setIsCreateSectionOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Create Section
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
