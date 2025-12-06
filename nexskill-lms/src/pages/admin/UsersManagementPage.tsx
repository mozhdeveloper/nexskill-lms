import React, { useState } from 'react';
import AdminAppLayout from '../../layouts/AdminAppLayout';
import UserFiltersBar from '../../components/admin/users/UserFiltersBar';
import UsersTable from '../../components/admin/users/UsersTable';
import UserFormDrawer from '../../components/admin/users/UserFormDrawer';
import UserRolesPanel from '../../components/admin/users/UserRolesPanel';
import OrganizationManagementPanel from '../../components/admin/users/OrganizationManagementPanel';
import PendingCoachesPanel from '../../components/admin/users/PendingCoachesPanel';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: 'active' | 'banned' | 'pending';
  roles: string[];
  organizationId?: string;
  organizationName?: string;
  createdAt: string;
  lastActiveAt: string;
}

interface Organization {
  id: string;
  name: string;
  type: 'Individual' | 'B2B';
  usersCount: number;
  plan: 'Starter' | 'Pro' | 'Enterprise';
  contact: string;
}

interface FilterState {
  search: string;
  status: string;
  role: string;
  organizationId: string;
}

const UsersManagementPage: React.FC = () => {
  // Dummy Organizations
  const [organizations] = useState<Organization[]>([
    {
      id: 'org-1',
      name: 'TechCorp Inc.',
      type: 'B2B',
      usersCount: 45,
      plan: 'Enterprise',
      contact: 'admin@techcorp.com',
    },
    {
      id: 'org-2',
      name: 'EduSolutions',
      type: 'B2B',
      usersCount: 28,
      plan: 'Pro',
      contact: 'contact@edusolutions.com',
    },
    {
      id: 'org-3',
      name: 'Global Training Ltd.',
      type: 'B2B',
      usersCount: 62,
      plan: 'Enterprise',
      contact: 'hello@globaltraining.com',
    },
    {
      id: 'org-4',
      name: 'Startup Academy',
      type: 'B2B',
      usersCount: 15,
      plan: 'Starter',
      contact: 'team@startupacademy.io',
    },
  ]);

  // Dummy Users
  const [users, setUsers] = useState<User[]>([
    {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      status: 'active',
      roles: ['student'],
      createdAt: '2024-01-15T10:30:00Z',
      lastActiveAt: '2025-12-04T08:15:00Z',
    },
    {
      id: 'user-2',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.j@techcorp.com',
      status: 'active',
      roles: ['coach', 'student'],
      organizationId: 'org-1',
      organizationName: 'TechCorp Inc.',
      createdAt: '2024-02-20T14:00:00Z',
      lastActiveAt: '2025-12-04T06:45:00Z',
    },
    {
      id: 'user-3',
      firstName: 'Michael',
      lastName: 'Chen',
      email: 'mchen@example.com',
      status: 'banned',
      roles: ['student'],
      createdAt: '2024-03-10T09:00:00Z',
      lastActiveAt: '2025-11-20T12:00:00Z',
    },
    {
      id: 'user-4',
      firstName: 'Emily',
      lastName: 'Rodriguez',
      email: 'emily.r@edusolutions.com',
      status: 'active',
      roles: ['org_admin', 'coach'],
      organizationId: 'org-2',
      organizationName: 'EduSolutions',
      createdAt: '2024-04-05T11:30:00Z',
      lastActiveAt: '2025-12-03T16:20:00Z',
    },
    {
      id: 'user-5',
      firstName: 'David',
      lastName: 'Kim',
      email: 'david.kim@admin.nexskill.com',
      status: 'active',
      roles: ['admin'],
      createdAt: '2023-12-01T08:00:00Z',
      lastActiveAt: '2025-12-04T09:00:00Z',
    },
    {
      id: 'user-6',
      firstName: 'Lisa',
      lastName: 'Anderson',
      email: 'lisa.a@globaltraining.com',
      status: 'active',
      roles: ['coach'],
      organizationId: 'org-3',
      organizationName: 'Global Training Ltd.',
      createdAt: '2024-05-12T13:45:00Z',
      lastActiveAt: '2025-12-04T07:30:00Z',
    },
    {
      id: 'user-7',
      firstName: 'James',
      lastName: 'Wilson',
      email: 'jwilson@example.com',
      status: 'pending',
      roles: ['student'],
      createdAt: '2025-12-03T15:00:00Z',
      lastActiveAt: '2025-12-03T15:00:00Z',
    },
    {
      id: 'user-8',
      firstName: 'Maria',
      lastName: 'Garcia',
      email: 'maria.g@startupacademy.io',
      status: 'active',
      roles: ['org_admin'],
      organizationId: 'org-4',
      organizationName: 'Startup Academy',
      createdAt: '2024-06-18T10:00:00Z',
      lastActiveAt: '2025-12-02T14:00:00Z',
    },
    {
      id: 'user-9',
      firstName: 'Robert',
      lastName: 'Taylor',
      email: 'rtaylor@example.com',
      status: 'active',
      roles: ['coach', 'student'],
      createdAt: '2024-07-22T16:30:00Z',
      lastActiveAt: '2025-12-04T05:15:00Z',
    },
    {
      id: 'user-10',
      firstName: 'Jennifer',
      lastName: 'Martinez',
      email: 'jmartinez@example.com',
      status: 'banned',
      roles: ['student'],
      createdAt: '2024-08-14T12:00:00Z',
      lastActiveAt: '2025-11-15T10:30:00Z',
    },
    {
      id: 'user-11',
      firstName: 'William',
      lastName: 'Brown',
      email: 'wbrown@techcorp.com',
      status: 'active',
      roles: ['student'],
      organizationId: 'org-1',
      organizationName: 'TechCorp Inc.',
      createdAt: '2024-09-05T09:15:00Z',
      lastActiveAt: '2025-12-04T08:00:00Z',
    },
    {
      id: 'user-12',
      firstName: 'Patricia',
      lastName: 'Lee',
      email: 'patricia.lee@example.com',
      status: 'active',
      roles: ['coach'],
      createdAt: '2024-10-10T14:20:00Z',
      lastActiveAt: '2025-12-03T18:45:00Z',
    },
  ]);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    role: 'all',
    organizationId: 'all',
  });

  const [activeTab, setActiveTab] = useState<'users' | 'pending-coaches'>('users');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Filter users
  const filteredUsers = users.filter((user) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.id.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (filters.status !== 'all' && user.status !== filters.status) {
      return false;
    }

    // Role filter
    if (filters.role !== 'all' && !user.roles.includes(filters.role)) {
      return false;
    }

    // Organization filter
    if (filters.organizationId !== 'all') {
      if (filters.organizationId === '' && user.organizationId) {
        return false;
      }
      if (filters.organizationId !== '' && user.organizationId !== filters.organizationId) {
        return false;
      }
    }

    return true;
  });

  const selectedUser = users.find((u) => u.id === selectedUserId);

  const handleCreateUser = () => {
    setDrawerMode('create');
    setEditingUser(undefined);
    setDrawerOpen(true);
  };

  const handleEditUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setDrawerMode('edit');
      setEditingUser(user);
      setDrawerOpen(true);
    }
  };

  const handleSaveUser = (userData: Partial<User>) => {
    if (drawerMode === 'create') {
      const newUser: User = {
        ...(userData as User),
        id: `user-${Date.now()}`,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        organizationName: organizations.find((o) => o.id === userData.organizationId)?.name,
      };
      setUsers([...users, newUser]);
      showStatusMessage(`User ${newUser.firstName} ${newUser.lastName} created successfully`);
    } else {
      setUsers(
        users.map((u) =>
          u.id === userData.id
            ? {
                ...u,
                ...userData,
                organizationName: organizations.find((o) => o.id === userData.organizationId)?.name,
              }
            : u
        )
      );
      showStatusMessage(`User ${userData.firstName} ${userData.lastName} updated successfully`);
    }
    setDrawerOpen(false);
  };

  const handleToggleBan = (userId: string) => {
    setUsers(
      users.map((u) =>
        u.id === userId
          ? { ...u, status: u.status === 'banned' ? 'active' : 'banned' }
          : u
      )
    );
    const user = users.find((u) => u.id === userId);
    if (user) {
      const action = user.status === 'banned' ? 'unbanned' : 'banned';
      showStatusMessage(`User ${user.firstName} ${user.lastName} has been ${action}`);
    }
  };

  const handleUpdateUser = (userId: string, updatedFields: Partial<User>) => {
    setUsers(users.map((u) => (u.id === userId ? { ...u, ...updatedFields } : u)));
    showStatusMessage('User roles and status updated successfully');
  };

  const handleFilterByOrg = (orgId: string) => {
    setFilters({ ...filters, organizationId: orgId });
  };

  const showStatusMessage = (message: string) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <AdminAppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#111827] mb-2">User Management</h1>
            <p className="text-[#5F6473]">
              Manage users, roles, and organizations across NexSkill
            </p>
          </div>
          {activeTab === 'users' && (
            <button
              onClick={handleCreateUser}
              className="px-6 py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create User
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-[#EDF0FB]">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-4 text-sm font-medium transition-colors relative ${
                activeTab === 'users'
                  ? 'text-[#304DB5]'
                  : 'text-[#5F6473] hover:text-[#111827]'
              }`}
            >
              All Users
              {activeTab === 'users' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#304DB5]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('pending-coaches')}
              className={`pb-4 text-sm font-medium transition-colors relative flex items-center gap-2 ${
                activeTab === 'pending-coaches'
                  ? 'text-[#304DB5]'
                  : 'text-[#5F6473] hover:text-[#111827]'
              }`}
            >
              Pending Coaches
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-yellow-100 text-yellow-700">
                4
              </span>
              {activeTab === 'pending-coaches' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#304DB5]" />
              )}
            </button>
          </nav>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className="bg-[#D1FAE5] border border-[#6EE7B7] text-[#059669] px-4 py-3 rounded-xl flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-semibold">{statusMessage}</span>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'users' ? (
          <>
            {/* Filters */}
            <UserFiltersBar value={filters} organizations={organizations} onChange={setFilters} />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Users Table (2/3 width) */}
              <div className="lg:col-span-2">
                <UsersTable
                  users={filteredUsers}
                  onEdit={handleEditUser}
                  onToggleBan={handleToggleBan}
                  onSelect={setSelectedUserId}
                />
              </div>

              {/* Right: Side Panels (1/3 width) */}
              <div className="space-y-6">
                <UserRolesPanel
                  selectedUser={selectedUser}
                  onUpdate={handleUpdateUser}
                  onToggleBan={handleToggleBan}
                />
                <OrganizationManagementPanel
                  organizations={organizations}
                  onFilterByOrg={handleFilterByOrg}
                />
              </div>
            </div>
          </>
        ) : (
          <PendingCoachesPanel
            onApprove={(coachId) => {
              showStatusMessage(`Coach application approved successfully`);
              console.log('Approved coach:', coachId);
            }}
            onReject={(coachId, reason) => {
              showStatusMessage(`Coach application rejected`);
              console.log('Rejected coach:', coachId, 'Reason:', reason);
            }}
          />
        )}
      </div>

      {/* User Form Drawer */}
      <UserFormDrawer
        open={drawerOpen}
        mode={drawerMode}
        initialUser={editingUser}
        organizations={organizations}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSaveUser}
      />
    </AdminAppLayout>
  );
};

export default UsersManagementPage;
