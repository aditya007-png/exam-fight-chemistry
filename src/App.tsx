import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/guards/ProtectedRoute';
import { RoleGuard } from './components/guards/RoleGuard';
import { PublicLayout } from './components/layout/PublicLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { SignupPage } from './pages/public/SignupPage';
import { ForgotPasswordPage } from './pages/public/ForgotPasswordPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Common Pages
import { ProfilePage } from './pages/common/ProfilePage';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentExamsPage } from './pages/student/StudentExamsPage';
import { ExamPlayerPage } from './pages/student/ExamPlayerPage';
import { PeriodicTablePage } from './pages/student/PeriodicTablePage';
import { StudentResultsPage } from './pages/student/StudentResultsPage';
import { ExamResultDetailPage } from './pages/student/ExamResultDetailPage';

// Teacher Pages
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { ExamBuilderPage } from './pages/teacher/ExamBuilderPage';
import { TeacherExamsPage } from './pages/teacher/TeacherExamsPage';
import { TeacherStudentsPage } from './pages/teacher/TeacherStudentsPage';
import { TeacherRequestsPage } from './pages/teacher/TeacherRequestsPage';
import { ProctoringReviewPage } from './pages/teacher/ProctoringReviewPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminTeachersPage } from './pages/admin/AdminTeachersPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminComplaintsPage } from './pages/admin/AdminComplaintsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              <PublicLayout>
                <LandingPage />
              </PublicLayout>
            }
          />
          <Route
            path="/login"
            element={
              <PublicLayout>
                <LoginPage />
              </PublicLayout>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicLayout>
                <SignupPage />
              </PublicLayout>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicLayout>
                <ForgotPasswordPage />
              </PublicLayout>
            }
          />

          {/* ========================================================= */}
          {/* STUDENT ROUTES: Dashboard | My Exams | Results | Profile */}
          {/* ========================================================= */}
          <Route
            path="/student"
            element={<Navigate to="/student/dashboard" replace />}
          />
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['student']}>
                  <DashboardLayout>
                    <StudentDashboard />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/exams"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['student']}>
                  <DashboardLayout>
                    <StudentExamsPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/exam/:examId"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['student']}>
                  <ExamPlayerPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/periodic-table"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['student']}>
                  <DashboardLayout>
                    <PeriodicTablePage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/results"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['student']}>
                  <DashboardLayout>
                    <StudentResultsPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/results/:resultId"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['student']}>
                  <DashboardLayout>
                    <ExamResultDetailPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['student']}>
                  <DashboardLayout>
                    <ProfilePage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* ========================================================= */}
          {/* TEACHER ROUTES: Dashboard | Create Exam | My Exams | Students | Evidence Review | Profile */}
          {/* ========================================================= */}
          <Route
            path="/teacher"
            element={<Navigate to="/teacher/dashboard" replace />}
          />
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['teacher']}>
                  <DashboardLayout>
                    <TeacherDashboard />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/create-exam"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['teacher']}>
                  <DashboardLayout>
                    <ExamBuilderPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/exam-builder"
            element={<Navigate to="/teacher/create-exam" replace />}
          />
          <Route
            path="/teacher/exams"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['teacher']}>
                  <DashboardLayout>
                    <TeacherExamsPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/students"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['teacher']}>
                  <DashboardLayout>
                    <TeacherStudentsPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/requests"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['teacher']}>
                  <DashboardLayout>
                    <TeacherRequestsPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/evidence-review"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['teacher']}>
                  <DashboardLayout>
                    <ProctoringReviewPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/proctoring-review"
            element={<Navigate to="/teacher/evidence-review" replace />}
          />
          <Route
            path="/teacher/profile"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['teacher']}>
                  <DashboardLayout>
                    <ProfilePage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* ========================================================= */}
          {/* ADMIN ROUTES: Dashboard | Users | Teachers | Settings */}
          {/* ========================================================= */}
          <Route
            path="/admin"
            element={<Navigate to="/admin/dashboard" replace />}
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['admin']}>
                  <DashboardLayout>
                    <AdminDashboard />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['admin']}>
                  <DashboardLayout>
                    <AdminUsersPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/teachers"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['admin']}>
                  <DashboardLayout>
                    <AdminTeachersPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/complaints"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['admin']}>
                  <DashboardLayout>
                    <AdminComplaintsPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/support"
            element={<Navigate to="/admin/complaints" replace />}
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['admin']}>
                  <DashboardLayout>
                    <AdminSettingsPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* 404 Catch-All */}
          <Route
            path="*"
            element={
              <PublicLayout>
                <NotFoundPage />
              </PublicLayout>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
