import React, { useState } from 'react';
import AdminAppLayout from '../../layouts/AdminAppLayout';

interface Coach {
  id: string;
  name: string;
  email: string;
  coursesCount: number;
  studentsCount: number;
  rating: number;
  totalRevenue: number;
  status: 'active' | 'pending' | 'suspended';
  joinedDate: string;
  lastActive: string;
}

const CoachesManagementPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCoaches, setSelectedCoaches] = useState<string[]>([]);

  // Mock data
  const coaches: Coach[] = [
    {
      id: '1',
      name: 'Maria Santos',
      email: 'maria.santos@nexskill.com',
      coursesCount: 8,
      studentsCount: 1245,
      rating: 4.8,
      totalRevenue: 125000,
      status: 'active',
      joinedDate: '2024-01-15',
      lastActive: '2 hours ago'
    },
    {
      id: '2',
      name: 'John Rodriguez',
      email: 'john.rodriguez@nexskill.com',
      coursesCount: 12,
      studentsCount: 2134,
      rating: 4.9,
      totalRevenue: 185000,
      status: 'active',
      joinedDate: '2023-11-20',
      lastActive: '30 minutes ago'
    },
    {
      id: '3',
      name: 'Sarah Chen',
      email: 'sarah.chen@nexskill.com',
      coursesCount: 5,
      studentsCount: 678,
      rating: 4.7,
      totalRevenue: 68000,
      status: 'active',
      joinedDate: '2024-03-10',
      lastActive: '1 day ago'
    },
    {
      id: '4',
      name: 'Ahmed Hassan',
      email: 'ahmed.hassan@nexskill.com',
      coursesCount: 3,
      studentsCount: 234,
      rating: 4.5,
      totalRevenue: 28000,
      status: 'pending',
      joinedDate: '2024-12-01',
      lastActive: '3 hours ago'
    },
    {
      id: '5',
      name: 'Lisa Thompson',
      email: 'lisa.thompson@nexskill.com',
      coursesCount: 15,
      studentsCount: 3456,
      rating: 4.9,
      totalRevenue: 298000,
      status: 'active',
      joinedDate: '2023-08-05',
      lastActive: '1 hour ago'
    },
    {
      id: '6',
      name: 'David Park',
      email: 'david.park@nexskill.com',
      coursesCount: 0,
      studentsCount: 0,
      rating: 0,
      totalRevenue: 0,
      status: 'suspended',
      joinedDate: '2024-10-15',
      lastActive: '2 weeks ago'
    }
  ];

  const filteredCoaches = coaches.filter(coach => {
    const matchesSearch = coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         coach.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || coach.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSelectAll = () => {
    if (selectedCoaches.length === filteredCoaches.length) {
      setSelectedCoaches([]);
    } else {
      setSelectedCoaches(filteredCoaches.map(c => c.id));
    }
  };

  const handleSelectCoach = (id: string) => {
    setSelectedCoaches(prev =>
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'suspended':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const stats = {
    total: coaches.length,
    active: coaches.filter(c => c.status === 'active').length,
    pending: coaches.filter(c => c.status === 'pending').length,
    suspended: coaches.filter(c => c.status === 'suspended').length,
    totalRevenue: coaches.reduce((sum, c) => sum + c.totalRevenue, 0)
  };

  return (
    <AdminAppLayout>
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#111827] mb-2">Coaches Management</h1>
              <p className="text-[#5F6473]">Manage and monitor all coaches on the platform</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-sm">
              <div className="text-2xl mb-1">👨‍🏫</div>
              <div className="text-3xl font-bold text-[#111827] mb-1">{stats.total}</div>
              <div className="text-sm text-[#5F6473]">Total Coaches</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-sm">
              <div className="text-2xl mb-1">✅</div>
              <div className="text-3xl font-bold text-green-600 mb-1">{stats.active}</div>
              <div className="text-sm text-[#5F6473]">Active</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-sm">
              <div className="text-2xl mb-1">⏳</div>
              <div className="text-3xl font-bold text-yellow-600 mb-1">{stats.pending}</div>
              <div className="text-sm text-[#5F6473]">Pending</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-sm">
              <div className="text-2xl mb-1">🚫</div>
              <div className="text-3xl font-bold text-red-600 mb-1">{stats.suspended}</div>
              <div className="text-sm text-[#5F6473]">Suspended</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-sm">
              <div className="text-2xl mb-1">💰</div>
              <div className="text-2xl font-bold text-[#111827] mb-1">
                ${(stats.totalRevenue / 1000).toFixed(0)}k
              </div>
              <div className="text-sm text-[#5F6473]">Total Revenue</div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-sm">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Search */}
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search coaches by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-5 py-3 pl-12 bg-[#F5F7FF] rounded-full text-sm text-[#111827] placeholder-[#5F6473] focus:outline-none focus:ring-2 focus:ring-[#304DB5]"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
                </div>
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-5 py-3 bg-[#F5F7FF] rounded-full text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#304DB5] cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>

              {/* More Filters Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-5 py-3 bg-white border border-[#E5E7EB] text-[#111827] text-sm font-medium rounded-full hover:border-[#304DB5] transition-colors"
              >
                ⚙️ More Filters
              </button>

              {/* Bulk Actions */}
              {selectedCoaches.length > 0 && (
                <button className="px-5 py-3 bg-[#304DB5] text-white text-sm font-medium rounded-full hover:bg-[#243a8f] transition-colors">
                  Actions ({selectedCoaches.length})
                </button>
              )}
            </div>

            {/* Extended Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-[#E5E7EB] grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">Rating</label>
                  <select className="w-full px-4 py-2 bg-[#F5F7FF] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#304DB5]">
                    <option>All Ratings</option>
                    <option>4.5+ Stars</option>
                    <option>4.0 - 4.5 Stars</option>
                    <option>Below 4.0 Stars</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">Courses</label>
                  <select className="w-full px-4 py-2 bg-[#F5F7FF] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#304DB5]">
                    <option>Any Number</option>
                    <option>10+ Courses</option>
                    <option>5-10 Courses</option>
                    <option>1-5 Courses</option>
                    <option>No Courses</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">Join Date</label>
                  <select className="w-full px-4 py-2 bg-[#F5F7FF] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#304DB5]">
                    <option>Any Time</option>
                    <option>Last 30 Days</option>
                    <option>Last 3 Months</option>
                    <option>Last 6 Months</option>
                    <option>Last Year</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Coaches Table */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F5F7FF] border-b border-[#E5E7EB]">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedCoaches.length === filteredCoaches.length && filteredCoaches.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-[#304DB5] focus:ring-[#304DB5]"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                      Coach
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                      Courses
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                      Students
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                      Last Active
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {filteredCoaches.map((coach) => (
                    <tr key={coach.id} className="hover:bg-[#F5F7FF] transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedCoaches.includes(coach.id)}
                          onChange={() => handleSelectCoach(coach.id)}
                          className="w-4 h-4 rounded border-gray-300 text-[#304DB5] focus:ring-[#304DB5]"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#304DB5] to-[#5E7BFF] flex items-center justify-center text-white font-semibold">
                            {coach.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-[#111827]">{coach.name}</div>
                            <div className="text-sm text-[#5F6473]">{coach.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(coach.status)}`}>
                          {coach.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[#111827] font-medium">{coach.coursesCount}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[#111827] font-medium">{coach.studentsCount.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">⭐</span>
                          <span className="text-[#111827] font-medium">
                            {coach.rating > 0 ? coach.rating.toFixed(1) : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[#111827] font-medium">
                          ${(coach.totalRevenue / 1000).toFixed(0)}k
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-[#5F6473]">{coach.lastActive}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-[#304DB5] hover:text-[#243a8f] font-medium text-sm">
                          View Details →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {filteredCoaches.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-[#111827] mb-2">No coaches found</h3>
                <p className="text-[#5F6473]">Try adjusting your search or filters</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredCoaches.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-[#5F6473]">
                Showing {filteredCoaches.length} of {coaches.length} coaches
              </div>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#5F6473] hover:border-[#304DB5] hover:text-[#304DB5] transition-colors">
                  Previous
                </button>
                <button className="px-4 py-2 bg-[#304DB5] text-white rounded-lg text-sm font-medium">
                  1
                </button>
                <button className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#5F6473] hover:border-[#304DB5] hover:text-[#304DB5] transition-colors">
                  2
                </button>
                <button className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#5F6473] hover:border-[#304DB5] hover:text-[#304DB5] transition-colors">
                  3
                </button>
                <button className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#5F6473] hover:border-[#304DB5] hover:text-[#304DB5] transition-colors">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminAppLayout>
  );
};

export default CoachesManagementPage;
