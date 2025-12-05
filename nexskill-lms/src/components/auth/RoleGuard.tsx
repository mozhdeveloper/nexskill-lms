import React from 'react';
import type { ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types/roles';
import { labelByRole } from '../../types/roles';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

/**
 * RoleGuard component - protects routes based on user role
 * 
 * Usage:
 * <RoleGuard allowedRoles={["ADMIN","PLATFORM_OWNER"]}>
 *   <AdminRoutes />
 * </RoleGuard>
 */
const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles }) => {
  const { currentUser, isAuthenticated, getDefaultRoute } = useAuth();
  const navigate = useNavigate();

  // Not authenticated - redirect to login
  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Check if user's role is allowed
  const hasAccess = allowedRoles.includes(currentUser.role);

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E7F0FF] via-[#F9F0FF] to-[#E3F4FF] flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-card p-8">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-[#111827] text-center mb-3">
            Access Denied
          </h1>

          {/* Message */}
          <p className="text-[#5F6473] text-center mb-2">
            You don't have permission to view this area.
          </p>
          <p className="text-sm text-[#9CA3B5] text-center mb-8">
            Your role: <span className="font-medium text-[#5F6473]">{labelByRole[currentUser.role]}</span>
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate(getDefaultRoute())}
              className="w-full py-3 px-6 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-medium rounded-full shadow-[0_12px_24px_rgba(35,76,200,0.35)] hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Go to My Dashboard
            </button>
            <button
              onClick={() => navigate(-1)}
              className="w-full py-3 px-6 bg-[#F5F7FF] text-[#304DB5] font-medium rounded-full hover:bg-[#E0E5FF] transition-all"
            >
              Go Back
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 p-4 bg-[#F5F7FF] rounded-2xl">
            <p className="text-xs text-[#5F6473] text-center">
              This area requires one of these roles:
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {allowedRoles.map((role) => (
                <span
                  key={role}
                  className="px-3 py-1 bg-white text-xs font-medium text-[#304DB5] rounded-full border border-[#E0E5FF]"
                >
                  {labelByRole[role]}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User has access - render children
  return <>{children}</>;
};

export default RoleGuard;
