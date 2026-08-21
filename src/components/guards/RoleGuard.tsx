import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../hooks/useRole';
import { UserRole } from '../../types/auth';
import { LoadingState } from '../common/LoadingState';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { user, role, isLoading } = useAuth();
  const { getDashboardPath } = useRole();

  if (isLoading) {
    return <LoadingState fullScreen message="Evaluating Role Authorization..." />;
  }

  if (!user || !role) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    console.warn(`Access denied: User with role '${role}' attempted to access a route requiring ${allowedRoles.join(', ')}`);
    // Redirect to user's authorized role dashboard
    return <Navigate to={getDashboardPath()} replace />;
  }

  return <>{children}</>;
};
