import React, { useState } from 'react';

interface Role {
  id: string;
  name: string;
  description: string;
  system: boolean;
}

interface Permission {
  key: string;
  label: string;
  category: 'Dashboard' | 'Courses' | 'Finance' | 'CRM' | 'System';
}

interface RolePermission {
  roleId: string;
  permissionKey: string;
  allowed: boolean;
}

interface AccessControlPanelProps {
  roles: Role[];
  permissions: Permission[];
  rolePermissions: RolePermission[];
  onChangeRoles: (roles: Role[]) => void;
  onChangeRolePermissions: (rolePermissions: RolePermission[]) => void;
}

const AccessControlPanel: React.FC<AccessControlPanelProps> = ({
  roles,
  permissions,
  rolePermissions,
  onChangeRoles,
  onChangeRolePermissions,
}) => {
  const [showAddRoleForm, setShowAddRoleForm] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<
    'all' | 'Dashboard' | 'Courses' | 'Finance' | 'CRM' | 'System'
  >('all');
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(roles[0]?.id || null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddRole = () => {
    if (!newRoleName.trim() || !newRoleDescription.trim()) {
      showNotification('⚠️ Please enter both name and description');
      return;
    }

    const newRole: Role = {
      id: `role-${Date.now()}`,
      name: newRoleName,
      description: newRoleDescription,
      system: false,
    };

    onChangeRoles([...roles, newRole]);
    setNewRoleName('');
    setNewRoleDescription('');
    setShowAddRoleForm(false);
    showNotification(`✓ Role"${newRoleName}" created`);
  };

  const handleDuplicateRole = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;

    const duplicatedRole: Role = {
      id: `role-${Date.now()}`,
      name: `${role.name} (Copy)`,
      description: role.description,
      system: false,
    };

    // Copy permissions
    const rolePerms = rolePermissions.filter((rp) => rp.roleId === roleId);
    const duplicatedPerms = rolePerms.map((rp) => ({
      ...rp,
      roleId: duplicatedRole.id,
    }));

    onChangeRoles([...roles, duplicatedRole]);
    onChangeRolePermissions([...rolePermissions, ...duplicatedPerms]);
    showNotification(`✓ Duplicated"${role.name}"`);
  };

  const handleDeleteRole = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (role?.system) {
      showNotification('⚠️ Cannot delete system roles');
      return;
    }

    const updatedRoles = roles.filter((r) => r.id !== roleId);
    const updatedPerms = rolePermissions.filter((rp) => rp.roleId !== roleId);

    onChangeRoles(updatedRoles);
    onChangeRolePermissions(updatedPerms);
    if (selectedRoleId === roleId) {
      setSelectedRoleId(updatedRoles[0]?.id || null);
    }
    showNotification(`✓ Role deleted`);
  };

  const handleTogglePermission = (roleId: string, permissionKey: string) => {
    const existing = rolePermissions.find(
      (rp) => rp.roleId === roleId && rp.permissionKey === permissionKey
    );

    let updated: RolePermission[];
    if (existing) {
      // Toggle or remove
      if (existing.allowed) {
        updated = rolePermissions.map((rp) =>
          rp.roleId === roleId && rp.permissionKey === permissionKey
            ? { ...rp, allowed: false }
            : rp
        );
      } else {
        updated = rolePermissions.map((rp) =>
          rp.roleId === roleId && rp.permissionKey === permissionKey
            ? { ...rp, allowed: true }
            : rp
        );
      }
    } else {
      // Add new
      updated = [
        ...rolePermissions,
        { roleId, permissionKey, allowed: true },
      ];
    }

    onChangeRolePermissions(updated);
  };

  const isPermissionAllowed = (roleId: string, permissionKey: string): boolean => {
    const rp = rolePermissions.find(
      (item) => item.roleId === roleId && item.permissionKey === permissionKey
    );
    return rp?.allowed || false;
  };

  const filteredPermissions =
    categoryFilter === 'all'
      ? permissions
      : permissions.filter((p) => p.category === categoryFilter);

  const getPermissionCount = (roleId: string): number => {
    return rolePermissions.filter((rp) => rp.roleId === roleId && rp.allowed).length;
  };

  const categories = ['Dashboard', 'Courses', 'Finance', 'CRM', 'System'] as const;

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 space-y-6">
      {/* Notification Banner */}
      {notification && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm">
          {notification}
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Access control</h2>
        <p className="text-gray-600 mt-1">
          Define which roles can access which capabilities.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
          <div className="text-sm text-blue-700 mb-1">Total Roles</div>
          <div className="text-3xl font-bold text-blue-900">{roles.length}</div>
          <div className="text-xs text-blue-600 mt-1">
            {roles.filter((r) => r.system).length} system
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
          <div className="text-sm text-purple-700 mb-1">Total Permissions</div>
          <div className="text-3xl font-bold text-purple-900">{permissions.length}</div>
          <div className="text-xs text-purple-600 mt-1">Across {categories.length} categories</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
          <div className="text-sm text-green-700 mb-1">RBAC Mode</div>
          <div className="text-lg font-bold text-green-900">Role-based</div>
          <div className="text-xs text-green-600 mt-1">Simulated environment</div>
        </div>
      </div>

      {/* Role Management Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Roles</h3>
          <button
            onClick={() => setShowAddRoleForm(!showAddRoleForm)}
            className="bg-[#304DB5] text-white px-5 py-2 rounded-full font-medium hover:bg-[#5E7BFF] transition-colors text-sm shadow-md"
          >
            + Add role
          </button>
        </div>

        {/* Add Role Form */}
        {showAddRoleForm && (
          <div className="bg-gray-50 rounded-xl p-5 space-y-4 border border-gray-200">
            <h4 className="font-semibold text-gray-900">Create new role</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role Name</label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g., Content Manager"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#304DB5] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  placeholder="Brief description of role responsibilities"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#304DB5] focus:border-transparent"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAddRole}
                  className="bg-[#304DB5] text-white px-5 py-2 rounded-full font-medium hover:bg-[#5E7BFF] transition-colors text-sm"
                >
                  Create role
                </button>
                <button
                  onClick={() => setShowAddRoleForm(false)}
                  className="bg-gray-200 text-gray-700 px-5 py-2 rounded-full font-medium hover:bg-gray-300 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Roles List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {roles.map((role) => (
            <div
              key={role.id}
              className={`border rounded-xl p-4 transition-all cursor-pointer ${
                selectedRoleId === role.id
                  ? 'border-[#304DB5] bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => setSelectedRoleId(role.id)}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h4 className="font-semibold text-gray-900">{role.name}</h4>
                  {role.system && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                      System
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{role.description}</p>
                <div className="text-xs text-gray-500">
                  {getPermissionCount(role.id)} permissions enabled
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicateRole(role.id);
                    }}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                  >
                    📋 Duplicate
                  </button>
                  {!role.system && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRole(role.id);
                      }}
                      className="px-3 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Permissions Matrix</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                categoryFilter === 'all'
                  ? 'bg-[#304DB5] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  categoryFilter === cat
                    ? 'bg-[#304DB5] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {selectedRoleId && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <span className="font-semibold">
                Editing: {roles.find((r) => r.id === selectedRoleId)?.name}
              </span>
              <span>·</span>
              <span>{getPermissionCount(selectedRoleId)} permissions enabled</span>
            </div>
          </div>
        )}

        {/* Matrix Table */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 sticky left-0 bg-gray-50">
                    Permission
                  </th>
                  {roles.map((role) => (
                    <th
                      key={role.id}
                      className="px-4 py-3 text-center text-sm font-semibold text-gray-700 min-w-[100px]"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span>{role.name}</span>
                        {role.system && (
                          <span className="text-xs text-gray-500">(System)</span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPermissions.map((permission) => (
                  <tr key={permission.key} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 sticky left-0 bg-white">
                      <div>
                        <div className="font-medium">{permission.label}</div>
                        <div className="text-xs text-gray-500 font-mono">{permission.key}</div>
                      </div>
                    </td>
                    {roles.map((role) => (
                      <td key={`${role.id}-${permission.key}`} className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleTogglePermission(role.id, permission.key)}
                          className={`w-6 h-6 rounded border-2 transition-all ${
                            isPermissionAllowed(role.id, permission.key)
                              ? 'bg-green-500 border-green-600'
                              : 'bg-white border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {isPermissionAllowed(role.id, permission.key) && (
                            <span className="text-white text-sm">✓</span>
                          )}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-yellow-600 text-xl">⚠️</span>
          <div className="text-sm text-yellow-800">
            <strong>Important:</strong> System roles cannot be deleted. All permission changes are
            simulated locally and not enforced in this demo environment.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessControlPanel;
