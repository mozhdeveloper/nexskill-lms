import React, { useState, useEffect } from 'react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: 'active' | 'banned' | 'pending';
  roles: string[];
  organizationId?: string;
  organizationName?: string;
}

interface UserRolesPanelProps {
  selectedUser?: User;
  onUpdate: (userId: string, updatedFields: Partial<User>) => Promise<void>;
  onToggleBan: (userId: string) => void;
}

const UserRolesPanel: React.FC<UserRolesPanelProps> = ({
  selectedUser,
  onUpdate,
  onToggleBan,
}) => {
  const [editedRoles, setEditedRoles] = useState<string[]>([]);
  const [editedStatus, setEditedStatus] = useState<User['status']>('active');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (selectedUser) {
      setEditedRoles([...selectedUser.roles]);
      setEditedStatus(selectedUser.status);
      setHasChanges(false);
    }
  }, [selectedUser]);

  const handleRoleToggle = (role: string) => {
    // Only allow one role at a time (since profiles.role is a single value)
    const newRoles = [role];
    setEditedRoles(newRoles);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (selectedUser) {
      setIsSaving(true);
      try {
        await onUpdate(selectedUser.id, {
          roles: editedRoles,
          status: editedStatus,
        });
        console.log('Roles & status updated for user:', selectedUser.id);
      } catch (error) {
        console.error('Error updating roles:', error);
      } finally {
        setIsSaving(false);
      }
      setHasChanges(false);
    }
  };

  const handleRevert = () => {
    if (selectedUser) {
      setEditedRoles([...selectedUser.roles]);
      setEditedStatus(selectedUser.status);
      setHasChanges(false);
    }
  };

  const handleToggleBan = () => {
    if (selectedUser) {
      onToggleBan(selectedUser.id);
    }
  };

  const roleDefinitions = [
    {
      role: 'student',
      label: 'Student',
      description: 'Access to courses and learning materials',
      risk: 'low',
    },
    {
      role: 'coach',
      label: 'Coach',
      description: 'Can create courses and manage students',
      risk: 'medium',
    },
    {
      role: 'admin',
      label: 'Admin',
      description: 'Full platform access and user management',
      risk: 'high',
    },
    {
      role: 'org_admin',
      label: 'Org Admin',
      description: 'Manage organization users and settings',
      risk: 'medium',
    },
  ];

  const getStatusConfig = (status: User['status']) => {
    switch (status) {
      case 'active':
        return {
          label: 'Active',
          bg: 'bg-[#D1FAE5]',
          text: 'text-[#059669]',
          border: 'border-[#6EE7B7]',
        };
      case 'banned':
        return {
          label: 'Banned',
          bg: 'bg-[#FEE2E2]',
          text: 'text-[#DC2626]',
          border: 'border-[#FCA5A5]',
        };
      case 'pending':
        return {
          label: 'Pending',
          bg: 'bg-[#FEF3C7]',
          text: 'text-[#D97706]',
          border: 'border-[#FCD34D]',
        };
    }
  };

  if (!selectedUser) {
    return (
      <div className="bg-white rounded-2xl border border-[#EDF0FB] p-6 shadow-md">
        <h2 className="text-xl font-bold text-[#111827] mb-4">Roles & Access</h2>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👤</div>
          <p className="text-sm text-[#5F6473]">
            Select a user from the table to manage roles and access
          </p>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(selectedUser.status);

  return (
    <div className="bg-white rounded-2xl border border-[#EDF0FB] p-6 shadow-md">
      <h2 className="text-xl font-bold text-[#111827] mb-6">Roles & Access</h2>

      {/* User Summary */}
      <div className="mb-6 p-4 bg-gradient-to-br from-[#F5F7FF] to-white rounded-xl border border-[#EDF0FB]">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-bold text-[#111827]">
              {selectedUser.firstName} {selectedUser.lastName}
            </p>
            <p className="text-sm text-[#9CA3B5]">{selectedUser.email}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
          >
            {statusConfig.label}
          </span>
        </div>
        <p className="text-xs text-[#5F6473]">
          <span className="font-semibold">Organization:</span>{' '}
          {selectedUser.organizationName || 'Individual'}
        </p>
      </div>

      {/* Role Management */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-[#111827] mb-3">Assigned Roles</h3>
        <div className="space-y-2">
          {roleDefinitions.map((roleDef) => {
            const isChecked = editedRoles.includes(roleDef.role);
            return (
              <label
                key={roleDef.role}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  isChecked
                    ? 'border-[#304DB5] bg-[#F5F7FF]'
                    : 'border-[#E5E7EB] hover:bg-[#F9FAFB]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleRoleToggle(roleDef.role)}
                  className="w-4 h-4 text-[#304DB5] border-[#E5E7EB] rounded focus:ring-[#304DB5] mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-[#111827]">
                      {roleDef.label}
                    </span>
                    {roleDef.risk === 'high' && (
                      <span className="px-2 py-0.5 bg-[#FEE2E2] text-[#DC2626] text-xs font-semibold rounded-full">
                        High Risk
                      </span>
                    )}
                    {roleDef.risk === 'medium' && (
                      <span className="px-2 py-0.5 bg-[#FEF3C7] text-[#D97706] text-xs font-semibold rounded-full">
                        Elevated
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#5F6473]">{roleDef.description}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Ban/Unban Controls */}
      <div className="mb-6 p-4 bg-[#FEF3C7] border border-[#FCD34D] rounded-xl">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-xl">⚠️</span>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-[#92400E] mb-1">Account Status</h3>
            <p className="text-xs text-[#92400E] mb-3">
              {selectedUser.status === 'banned'
                ? 'This user is currently banned from accessing the platform.'
                : 'Ban this user to immediately revoke platform access.'}
            </p>
            <button
              onClick={handleToggleBan}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                selectedUser.status === 'banned'
                  ? 'bg-[#22C55E] text-white hover:bg-[#16A34A]'
                  : 'bg-[#DC2626] text-white hover:bg-[#B91C1C]'
              }`}
            >
              {selectedUser.status === 'banned' ? 'Unban User' : 'Ban User'}
            </button>
          </div>
        </div>
      </div>

      {/* Save Actions */}
      {hasChanges && (
        <div className="flex gap-2">
          <button
            onClick={handleRevert}
            className="flex-1 px-4 py-2 bg-[#F5F7FF] text-[#5F6473] font-semibold rounded-full hover:bg-[#EDF0FB] transition-colors"
            disabled={isSaving}
          >
            Revert
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all disabled:opacity-50"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Roles'}
          </button>
        </div>
      )}
    </div>
  );
};

export default UserRolesPanel;
