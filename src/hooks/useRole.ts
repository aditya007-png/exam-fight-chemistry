import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';

export const useRole = () => {
  const { role, user } = useAuth();

  const isStudent = role === 'student';
  const isTeacher = role === 'teacher';
  const isAdmin = role === 'admin';

  const hasRole = (requiredRoles: UserRole | UserRole[]): boolean => {
    if (!role) return false;
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(role);
    }
    return role === requiredRoles;
  };

  const getDashboardPath = (): string => {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'teacher':
        return '/teacher/dashboard';
      case 'student':
      default:
        return '/student/dashboard';
    }
  };

  return {
    role,
    user,
    isStudent,
    isTeacher,
    isAdmin,
    hasRole,
    getDashboardPath,
  };
};
