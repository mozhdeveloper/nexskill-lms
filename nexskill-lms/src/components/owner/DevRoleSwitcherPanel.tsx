import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import type { UserRole } from '../../types/roles';
import { labelByRole, defaultLandingRouteByRole, roleIcons } from '../../types/roles';

const DevRoleSwitcherPanel: React.FC = () => {
  const navigate = useNavigate();
  const { switchRole } = useUser();
  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT');

  const allRoles: UserRole[] = [
    'PLATFORM_OWNER',
    'ADMIN',
    'COACH',
    'SUB_COACH',
    'CONTENT_EDITOR',
    'COMMUNITY_MANAGER',
    'SUPPORT_STAFF',
    'STUDENT',
    'ORG_OWNER',
  ];

  const handleSwitchRole = () => {
    console.log(`Dev: Switching to role ${selectedRole}`);
    switchRole(selectedRole);
    const targetRoute = defaultLandingRouteByRole[selectedRole];
    navigate(targetRoute);
  };

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-dashed border-amber-300">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🧪</span>
          <h3 className="text-lg font-bold text-text-primary">Dev Role Tester</h3>
        </div>
        <p className="text-sm text-text-secondary">
          Switch to another role to validate their experience
        </p>
        <div className="mt-2 px-3 py-1 bg-amber-200 text-amber-900 text-xs font-medium rounded-full inline-block">
          For development/testing only
        </div>
      </div>

      {/* Role Selector */}
      <div className="mb-4">
        <label htmlFor="role-select" className="block text-sm font-medium text-text-primary mb-2">
          Select Role
        </label>
        <div className="relative">
          <select
            id="role-select"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as UserRole)}
            className="w-full px-4 py-3 pr-10 bg-white border border-[#EDF0FB] rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary appearance-none"
          >
            {allRoles.map((role) => (
              <option key={role} value={role}>
                {roleIcons[role]} {labelByRole[role]}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
            ▼
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleSwitchRole}
        className="w-full py-3 px-4 bg-amber-500 text-white rounded-xl font-medium text-sm hover:bg-amber-600 transition-colors shadow-md"
      >
        Switch to {labelByRole[selectedRole]} →
      </button>

      {/* Info */}
      <p className="text-xs text-text-muted mt-3 text-center">
        You'll be redirected to the {labelByRole[selectedRole]} dashboard
      </p>
    </div>
  );
};

export default DevRoleSwitcherPanel;
