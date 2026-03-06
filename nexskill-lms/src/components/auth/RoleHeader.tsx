import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import type { UserRole } from '../../types/roles';
import { labelByRole, roleIcons, roleColors, allRoles } from '../../types/roles';

/**
 * RoleHeader component - displays current user info and dev role switcher
 * Responsive design with mobile/desktop variants
 */
const RoleHeader: React.FC = () => {
  const { signOut } = useAuth();
  const { profile: currentUser, loading, getDefaultRoute, switchRole } = useUser();
  const navigate = useNavigate();
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const roleSwitcherRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleSwitcherRef.current && !roleSwitcherRef.current.contains(event.target as Node)) {
        setShowRoleSwitcher(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading || !currentUser) return null;

  const roleColor = roleColors[currentUser.role];
  const isDevelopment = import.meta.env.DEV;

  const handleRoleSwitch = (newRole: UserRole) => {
    switchRole(newRole);
    setShowRoleSwitcher(false);
    // Navigate to new role's default dashboard
    navigate(getDefaultRoute());
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex items-center gap-3 ml-auto">
      {/* Dev Role Switcher (Desktop) */}
      {isDevelopment && (
        <div className="relative hidden md:block" ref={roleSwitcherRef}>
          <button
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            className="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-full text-xs font-medium text-yellow-800 hover:bg-yellow-100 transition-all flex items-center gap-2"
            title="Development mode: Switch roles for testing"
          >
            <span>🔧</span>
            <span className="hidden lg:inline">Switch Role</span>
          </button>

          {showRoleSwitcher && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-lg border border-[#EDF0FB] py-2 z-50 max-h-96 overflow-y-auto">
              <div className="px-4 py-2 border-b border-[#EDF0FB]">
                <p className="text-xs font-medium text-[#5F6473]">Development Mode</p>
                <p className="text-xs text-[#9CA3B5] mt-0.5">Quick role switching</p>
              </div>
              {allRoles.map((role) => {
                const isActive = role === currentUser.role;
                return (
                  <button
                    key={role}
                    onClick={() => handleRoleSwitch(role)}
                    disabled={isActive}
                    className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors ${
                      isActive
                        ? 'bg-[#E0E5FF] cursor-default'
                        : 'hover:bg-[#F5F7FF] cursor-pointer'
                    }`}
                  >
                    <span className="text-lg">{roleIcons[role]}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isActive ? 'text-[#304DB5]' : 'text-[#111827]'}`}>
                        {labelByRole[role]}
                      </p>
                    </div>
                    {isActive && (
                      <svg className="w-4 h-4 text-[#304DB5] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Role Badge (Desktop) */}
      <div className={`hidden md:flex items-center gap-2 px-4 py-2 ${roleColor.bg} rounded-full border ${roleColor.border}`}>
        <span className="text-sm">{roleIcons[currentUser.role]}</span>
        <span className={`text-sm font-medium ${roleColor.text}`}>
          {labelByRole[currentUser.role]}
        </span>
      </div>

      {/* User Menu */}
      <div className="relative" ref={userMenuRef}>
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-3 px-3 py-2 rounded-full hover:bg-[#F5F7FF] transition-all"
        >
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#304DB5] to-[#5E7BFF] flex items-center justify-center">
            <span className="text-white text-sm font-semibold">
              {currentUser.firstName.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* User Name (Desktop) */}
          <div className="hidden lg:block text-left">
            <p className="text-sm font-medium text-[#111827] leading-tight">
              {currentUser.firstName} {currentUser.lastName}
            </p>
            <p className={`text-xs ${roleColor.text} leading-tight md:hidden lg:block`}>
              {labelByRole[currentUser.role]}
            </p>
          </div>

          {/* Dropdown Arrow */}
          <svg
            className={`w-4 h-4 text-[#5F6473] transition-transform ${
              showUserMenu ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showUserMenu && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-lg border border-[#EDF0FB] py-2 z-50">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-[#EDF0FB]">
              <p className="text-sm font-medium text-[#111827]">{currentUser.firstName} {currentUser.lastName}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs">{roleIcons[currentUser.role]}</span>
                <span className={`text-xs font-medium ${roleColor.text}`}>
                  {labelByRole[currentUser.role]}
                </span>
              </div>
            </div>

            {/* Dev Role Switcher (Mobile) */}
            {isDevelopment && (
              <div className="md:hidden px-4 py-3 border-b border-[#EDF0FB]">
                <p className="text-xs font-medium text-yellow-800 mb-2 flex items-center gap-1">
                  <span>🔧</span> Dev: Switch Role
                </p>
                <select
                  value={currentUser.role}
                  onChange={(e) => handleRoleSwitch(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-[#F5F7FF] rounded-lg text-sm text-[#111827] border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5]"
                >
                  {allRoles.map((role) => (
                    <option key={role} value={role}>
                      {roleIcons[role]} {labelByRole[role]}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Actions */}
            <div className="px-2 py-2">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleHeader;
