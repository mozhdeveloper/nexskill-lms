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

  // Supabase Integration
  const [activeCoaches, setActiveCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Active Coaches from Supabase
  React.useEffect(() => {
    const fetchCoaches = async () => {
      setLoading(true);
      const { supabase } = await import('../../lib/supabaseClient');

      // Fetch profiles with role 'coach'
      // Note: This assumes we have a 'profiles' table. Adjust schema if needed.
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'coach');

      if (error) {
        console.error('Error fetching coaches:', error);
      } else if (data) {
        // Map Supabase profiles to Coach interface
        // We might need to join with other tables for stats (revenue, etc.) later.
        // For now, we'll map what we have and mock the stats.
        const mappedCoaches: Coach[] = data.map((profile: any) => ({
          id: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Unknown',
          email: profile.email || 'N/A',
          coursesCount: 0, // Placeholder - requires query to courses table
          studentsCount: 0, // Placeholder
          rating: 0, // Placeholder
          totalRevenue: 0, // Placeholder
          status: 'active',
          joinedDate: profile.created_at ? new Date(profile.created_at).toISOString().split('T')[0] : 'N/A',
          lastActive: 'N/A'
        }));
        setActiveCoaches(mappedCoaches);
      }
      setLoading(false);
    };

    if (statusFilter === 'active' || statusFilter === 'all') {
      fetchCoaches();
    }
  }, [statusFilter]);

  // Mock data for Pending/Suspended (since instructions said "no need yet for supabase integration" for pending)
  const mockPendingCoaches: Coach[] = [
    {
      id: '4',
      name: 'Ahmed Hassan',
      email: 'ahmed.hassan@nexskill.com',
      coursesCount: 3,
      studentsCount: 0,
      rating: 0,
      totalRevenue: 0,
      status: 'pending',
      joinedDate: '2024-12-01',
      lastActive: '3 hours ago'
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

  // Combine lists based on what we want to validly show
  // If we are in 'Active' tab, show activeCoaches.
  // If 'Pending', show pending mock data.

  // Refined State for Tabs
  const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active');

  const displayedCoaches = activeTab === 'active' ? activeCoaches : mockPendingCoaches.filter(c => c.status === 'pending');

  const filteredCoaches = displayedCoaches.filter(coach => {
    const matchesSearch = coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coach.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleVerifyCoach = (coachId: string) => {
    // Mock Verification
    const coach = mockPendingCoaches.find(c => c.id === coachId);
    const confirm = window.confirm(`Verify coach application for ${coach?.name}?`);
    if (confirm) {
      window.alert(`Coach ${coach?.name} verified! (Mock Action)`);
      // In real app: call supabase update to set status='active'
    }
  };

  const stats = {
    total: activeCoaches.length + mockPendingCoaches.length,
    active: activeCoaches.length,
    pending: mockPendingCoaches.filter(c => c.status === 'pending').length,
    suspended: mockPendingCoaches.filter(c => c.status === 'suspended').length,
    totalRevenue: activeCoaches.reduce((sum, c) => sum + c.totalRevenue, 0) // Only counting active for now
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

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('active')}
                className={`${activeTab === 'active'
                  ? 'border-[#304DB5] text-[#304DB5]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Active Coaches
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`${activeTab === 'pending'
                  ? 'border-[#304DB5] text-[#304DB5]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Pending Applications ({stats.pending})
              </button>
            </nav>
          </div>

          {/* Filters and Search - Simplified for now to just Search */}
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

              {/* Bulk Actions */}
              {selectedCoaches.length > 0 && (
                <button className="px-5 py-3 bg-[#304DB5] text-white text-sm font-medium rounded-full hover:bg-[#243a8f] transition-colors">
                  Actions ({selectedCoaches.length})
                </button>
              )}
            </div>
          </div>

          {/* Coaches Table */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F5F7FF] border-b border-[#E5E7EB]">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      {/* Checkbox logic simplified */}
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
                    {/* Removed extra columns for brevity in this refactor, kept core info */}
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                      Joined Date
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredCoaches.map((coach) => (
                    <tr key={coach.id} className="hover:bg-[#F5F7FF] transition-colors">
                      <td className="px-6 py-4">
                        {/* Checkbox Placeholder */}
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
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${coach.status === 'active' ? 'bg-green-100 text-green-700' :
                          coach.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                          {coach.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[#111827] font-medium">{coach.coursesCount}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-[#5F6473]">{coach.joinedDate}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {activeTab === 'pending' ? (
                          <button
                            onClick={() => handleVerifyCoach(coach.id)}
                            className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-md font-medium text-xs transition-colors"
                          >
                            Verify Application
                          </button>
                        ) : (
                          <button className="text-[#304DB5] hover:text-[#243a8f] font-medium text-sm">
                            View Details →
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {!loading && filteredCoaches.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-[#111827] mb-2">No coaches found</h3>
                <p className="text-[#5F6473]">Try adjusting your search or tabs</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredCoaches.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-[#5F6473]">
                Showing {filteredCoaches.length} of {stats.total} coaches
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
