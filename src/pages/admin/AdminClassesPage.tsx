// src/pages/admin/AdminClassesPage.tsx
// Institutional Classes & Sections Directory for Admin
import React, { useState, useEffect } from 'react';
import {
  AcademicClass,
  AcademicSection,
  ClassEnrollment,
} from '../../types/academic';
import {
  getStoredClasses,
  fetchClassesFromDB,
  getStoredSections,
  getStoredEnrollments,
  fetchEnrollmentsFromDB,
} from '../../lib/classService';
import {
  BookOpen,
  Layers,
  Users,
  Search,
} from 'lucide-react';

export const AdminClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [sections, setSections] = useState<AcademicSection[]>([]);
  const [enrollments, setEnrollments] = useState<ClassEnrollment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadAdminClasses = async () => {
      await fetchClassesFromDB();
      await fetchEnrollmentsFromDB();
      setClasses(getStoredClasses());
      setSections(getStoredSections());
      setEnrollments(getStoredEnrollments());
    };

    loadAdminClasses();
  }, []);

  const filteredClasses = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.classCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.teacherName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-blue-600" />
            <span>Academic Classes & Sections Directory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Institutional oversight of all academic classes, sections, enrollment codes, and student cohorts.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search class, code, teacher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {filteredClasses.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center shadow-card space-y-2">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No classes found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Classes created by authorized faculty instructors will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClasses.map((cls) => {
            const classSections = sections.filter((s) => s.classId === cls.id);
            const classEnrollments = enrollments.filter((e) => e.classId === cls.id);

            return (
              <div
                key={cls.id}
                className="rounded-2xl bg-white border border-slate-200 p-6 shadow-card space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {cls.classCode}
                      </span>
                      <h3 className="text-base font-bold text-slate-900">{cls.name}</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Faculty Instructor: <strong className="text-slate-800">{cls.teacherName}</strong> • Academic Year: {cls.academicYear}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Layers className="w-4 h-4 text-slate-400" />
                      <strong>{classSections.length}</strong> {classSections.length === 1 ? 'Section' : 'Sections'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-slate-400" />
                      <strong>{classEnrollments.length}</strong> Enrolled
                    </span>
                  </div>
                </div>

                {/* Sections Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {classSections.map((sec) => {
                    const secEnrollments = enrollments.filter((e) => e.sectionId === sec.id);

                    return (
                      <div
                        key={sec.id}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{sec.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {secEnrollments.length} students
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            Enrollment Key:
                          </span>
                          <span className="font-mono text-xs font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                            {sec.enrollmentCode}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
