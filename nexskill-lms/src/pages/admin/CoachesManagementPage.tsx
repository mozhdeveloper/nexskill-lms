import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import AdminAppLayout from '../../layouts/AdminAppLayout';

interface Coach {
  id: string;
  name: string;
  email: string;
  phone?: string;
  coursesCount: number;
  studentsCount: number;
  rating: number;
  totalRevenue: number;
  status: 'active' | 'pending' | 'suspended';
  joinedDate: string;
  lastActive: string;
  jobTitle?: string;
}

const CoachesManagementPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'suspended'>('active');
  const [selectedCoaches, setSelectedCoaches] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // State for coaches
  const [activeCoaches, setActiveCoaches] = useState<Coach[]>([]);
  const [pendingCoaches, setPendingCoaches] = useState<Coach[]>([]);
  const [suspendedCoaches, setSuspendedCoaches] = useState<Coach[]>([]);

  // Fetch Coaches from Supabase
  useEffect(() => {
    const fetchCoaches = async () => {
      setLoading(true);
      setError(null);
      console.log('📊 Fetching coaches data...');

      try {
        // 1. Fetch All Coaches (role = 'coach')
        const { data: coachesData, error: coachesError } = await supabase
          .from('profiles')
          .select(`
            id,
            email,
            first_name,
            last_name,
            updated_at,
            role
          `)
          .eq('role', 'coach');

        if (coachesError) {
          console.error('Error fetching coaches:', coachesError);
          setError(`Failed to load coaches: ${coachesError.message}`);
          setLoading(false);
          return;
        }

        console.log('✅ Coaches fetched:', coachesData?.length || 0);

        // 2. Fetch coach_profiles for verification status
        const { data: coachProfilesData } = await supabase
          .from('coach_profiles')
          .select('id, verification_status, job_title, created_at');

        console.log('✅ Coach profiles fetched:', coachProfilesData?.length || 0);

        // 3. Separate coaches by status
        const verified: Coach[] = [];
        const pending: Coach[] = [];
        const suspended: Coach[] = [];

        for (const coach of coachesData || []) {
          const coachProfile = coachProfilesData?.find(cp => cp.id === coach.id);
          const verificationStatus = coachProfile?.verification_status || 'pending';

          const coachData: Coach = {
            id: coach.id,
            name: `${coach.first_name || ''} ${coach.last_name || ''}`.trim() || coach.email || 'Unknown',
            email: coach.email || 'N/A',
            phone: '',
            coursesCount: 0,
            studentsCount: 0,
            rating: 0,
            totalRevenue: 0,
            status: verificationStatus === 'verified' ? 'active' : verificationStatus === 'pending' ? 'pending' : 'suspended',
            joinedDate: coachProfile?.created_at ? new Date(coachProfile.created_at).toLocaleDateString() : (coach.updated_at ? new Date(coach.updated_at).toLocaleDateString() : 'N/A'),
            lastActive: coach.updated_at ? new Date(coach.updated_at).toLocaleDateString() : 'Never',
            jobTitle: coachProfile?.job_title || 'Coach',
          };

          if (verificationStatus === 'verified') {
            verified.push(coachData);
          } else if (verificationStatus === 'pending' || verificationStatus === 'under_review') {
            pending.push(coachData);
          } else {
            suspended.push(coachData);
          }
        }

        // 4. Fetch stats for active coaches
        console.log('📈 Fetching stats for active coaches...');
        const activeCoachesWithStats = await Promise.all(
          verified.map(async (coach) => {
            // Courses count
            const { count: coursesCount } = await supabase
              .from('courses')
              .select('*', { count: 'exact', head: true })
              .eq('coach_id', coach.id)
              .eq('verification_status', 'approved');

            // Get course IDs for this coach
            const { data: coachCourses } = await supabase
              .from('courses')
              .select('id')
              .eq('coach_id', coach.id)
              .eq('verification_status', 'approved');

            const courseIds = coachCourses?.map(c => c.id) || [];

            // Students count
            let studentsCount = 0;
            if (courseIds.length > 0) {
              const { data: enrollments } = await supabase
                .from('enrollments')
                .select('profile_id')
                .in('course_id', courseIds)
                .in('status', ['active', 'completed']);
              studentsCount = new Set(enrollments?.map(e => e.profile_id) || []).size;
            }

            // Rating
            const { data: reviews } = await supabase
              .from('reviews')
              .select('rating')
              .in('course_id', courseIds);
            const avgRating = reviews && reviews.length > 0
              ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
              : 0;

            // Revenue
            const { data: transactions } = await supabase
              .from('transactions')
              .select('net_amount, amount')
              .eq('coach_id', coach.id)
              .eq('type', 'sale')
              .neq('status', 'failed');
            const totalRevenue = transactions?.reduce((sum, tx) => sum + (tx.net_amount || tx.amount || 0), 0) || 0;

            return {
              ...coach,
              coursesCount: coursesCount || 0,
              studentsCount,
              rating: avgRating,
              totalRevenue,
            };
          })
        );

        setActiveCoaches(activeCoachesWithStats);
        setPendingCoaches(pending);
        setSuspendedCoaches(suspended);

        console.log('✅ Coaches data loaded successfully');
        console.log('Active:', activeCoachesWithStats.length);
        console.log('Pending:', pending.length);
        console.log('Suspended:', suspended.length);

      } catch (err: any) {
        console.error('❌ Error fetching coaches:', err);
        setError(err.message || 'Failed to load coaches');
      } finally {
        setLoading(false);
      }
    };

    fetchCoaches();
  }, []);

  const displayedCoaches = activeTab === 'active' ? activeCoaches : activeTab === 'pending' ? pendingCoaches : suspendedCoaches;

  const filteredCoaches = displayedCoaches.filter(coach => {
    const matchesSearch = coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coach.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleToggleSelect = (coachId: string) => {
    setSelectedCoaches(prev => 
      prev.includes(coachId) 
        ? prev.filter(id => id !== coachId)
        : [...prev, coachId]
    );
  };

  const handleVerifyCoach = async (coachId: string) => {
    console.log('🔍 Verifying coach:', coachId);
    console.log('Current pending coaches:', pendingCoaches.map(c => ({ id: c.id, name: c.name })));
    
    const coach = pendingCoaches.find(c => c.id === coachId);
    console.log('Found coach in state:', coach);
    
    if (!coach) {
      console.error('❌ Coach not found in pending list!');
      alert('Coach not found. Please refresh the page and try again.');
      return;
    }

    const confirm = window.confirm(`Verify coach application for ${coach.name}?\n\nThis will:\n• Grant them coach privileges\n• Allow them to create courses\n• Give them access to the coach dashboard`);

    if (confirm) {
      try {
        console.log('⏳ Step 1: Updating coach_profiles...');
        
        // Step 1: Update coach_profiles verification status
        const { data: cpData, error: cpError } = await supabase
          .from('coach_profiles')
          .update({ verification_status: 'verified' })
          .eq('id', coachId)
          .select();

        console.log('Coach profiles update:', { cpData, cpError });

        if (cpError) {
          console.error('❌ Coach profiles error:', cpError);
          throw new Error(`Failed to update coach profile: ${cpError.message}`);
        }

        console.log('⏳ Step 2: Updating profile role...');
        
        // Step 2: Update profile role to 'coach'
        const { data: pData, error: pError } = await supabase
          .from('profiles')
          .update({ role: 'coach' })
          .eq('id', coachId)
          .select();

        console.log('Profile update:', { pData, pError });

        if (pError) {
          console.error('❌ Profile error:', pError);
          throw new Error(`Failed to update profile: ${pError.message}`);
        }

        alert(`✅ Success!\n\n${coach.name} is now a verified coach.`);
        
        // Remove from pending list
        setPendingCoaches(prev => {
          const newList = prev.filter(c => c.id !== coachId);
          console.log('Updated pending list:', newList.length, 'coaches');
          return newList;
        });
        
        // Reload after a short delay
        setTimeout(() => {
          console.log('🔄 Reloading page...');
          window.location.reload();
        }, 1000);
        
      } catch (error: any) {
        console.error('❌ Full error:', error);
        alert(`❌ Failed to verify coach\n\nError: ${error.message || 'Unknown error'}\n\nCheck console for details.`);
      }
    }
  };

  const handleRejectCoach = async (coachId: string) => {
    console.log('🔍 Rejecting coach:', coachId);
    console.log('Current pending coaches:', pendingCoaches.map(c => ({ id: c.id, name: c.name })));
    
    const coach = pendingCoaches.find(c => c.id === coachId);
    console.log('Found coach in state:', coach);
    
    if (!coach) {
      console.error('❌ Coach not found in pending list!');
      alert('Coach not found. Please refresh the page and try again.');
      return;
    }

    const reason = window.prompt('Enter rejection reason (optional):\n\nThis will be stored in the database for reference.');

    if (reason !== null) {
      try {
        console.log('⏳ Updating coach_profiles...');
        
        const { data: updateData, error } = await supabase
          .from('coach_profiles')
          .update({ 
            verification_status: 'rejected',
            rejection_reason: reason || 'No reason provided',
            rejected_at: new Date().toISOString()
          })
          .eq('id', coachId)
          .select();

        console.log('Update result:', { updateData, error });

        if (error) {
          console.error('❌ Supabase error:', error);
          throw error;
        }

        alert(`✅ Coach application rejected\n\n${coach.name}'s application has been rejected.`);
        
        // Remove from pending list
        setPendingCoaches(prev => {
          const newList = prev.filter(c => c.id !== coachId);
          console.log('Updated pending list:', newList.length, 'coaches');
          return newList;
        });
        
        // Reload after a short delay
        setTimeout(() => {
          console.log('🔄 Reloading page...');
          window.location.reload();
        }, 1000);
        
      } catch (error: any) {
        console.error('❌ Full error:', error);
        alert(`❌ Failed to reject coach\n\nError: ${error.message || 'Unknown error'}\n\nCheck console for details.`);
      }
    }
  };

  const handleSuspendCoach = async (coachId: string) => {
    const coach = activeCoaches.find(c => c.id === coachId);
    if (!coach) return;
    
    const confirm = window.confirm(`Suspend coach ${coach.name}? They will lose coach privileges.`);
    
    if (confirm) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ role: 'student' })
          .eq('id', coachId);

        if (error) throw error;

        alert(`Coach ${coach.name} suspended.`);
        window.location.reload();
      } catch (error: any) {
        console.error('Error suspending coach:', error);
        alert('Failed to suspend coach. Please try again.');
      }
    }
  };

  const handleViewDetails = (coach: Coach) => {
    setSelectedCoach(coach);
    setShowDetailsModal(true);
  };

  const stats = {
    total: activeCoaches.length + pendingCoaches.length + suspendedCoaches.length,
    active: activeCoaches.length,
    pending: pendingCoaches.length,
    suspended: suspendedCoaches.length,
    totalRevenue: activeCoaches.reduce((sum, c) => sum + c.totalRevenue, 0),
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
              <div className="text-3xl font-bold text-[#111827] mb-1">{loading ? '...' : stats.total}</div>
              <div className="text-sm text-[#5F6473]">Total Coaches</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-sm">
              <div className="text-2xl mb-1">✅</div>
              <div className="text-3xl font-bold text-green-600 mb-1">{loading ? '...' : stats.active}</div>
              <div className="text-sm text-[#5F6473]">Active</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-sm">
              <div className="text-2xl mb-1">⏳</div>
              <div className="text-3xl font-bold text-yellow-600 mb-1">{loading ? '...' : stats.pending}</div>
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
                ${loading ? '...' : stats.totalRevenue.toLocaleString()}
              </div>
              <div className="text-sm text-[#5F6473]">Total Revenue</div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              <strong>Error:</strong> {error}
            </div>
          )}

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
                Active Coaches ({activeCoaches.length})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`${activeTab === 'pending'
                  ? 'border-[#304DB5] text-[#304DB5]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Pending Applications ({pendingCoaches.length})
              </button>
              <button
                onClick={() => setActiveTab('suspended')}
                className={`${activeTab === 'suspended'
                  ? 'border-[#304DB5] text-[#304DB5]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Suspended ({suspendedCoaches.length})
              </button>
            </nav>
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
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCoaches(displayedCoaches.map(c => c.id));
                          } else {
                            setSelectedCoaches([]);
                          }
                        }}
                        checked={displayedCoaches.length > 0 && selectedCoaches.length === displayedCoaches.length}
                        className="w-4 h-4 text-[#304DB5] border-[#E5E7EB] rounded focus:ring-[#304DB5]"
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
                      Joined
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
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#304DB5]"></div>
                          Loading coaches...
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-red-500">
                        {error}
                      </td>
                    </tr>
                  ) : filteredCoaches.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                        <div className="text-4xl mb-4">🔍</div>
                        <h3 className="text-lg font-semibold text-[#111827] mb-2">No coaches found</h3>
                        <p className="text-[#5F6473]">Try adjusting your search or switch tabs</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCoaches.map((coach) => (
                      <tr key={coach.id} className="hover:bg-[#F5F7FF] transition-colors">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedCoaches.includes(coach.id)}
                            onChange={() => handleToggleSelect(coach.id)}
                            className="w-4 h-4 text-[#304DB5] border-[#E5E7EB] rounded focus:ring-[#304DB5]"
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
                              {coach.jobTitle && (
                                <div className="text-xs text-[#9CA3B5] mt-1">{coach.jobTitle}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            coach.status === 'active' ? 'bg-green-100 text-green-700' :
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
                          <span className="text-[#111827] font-medium">{coach.studentsCount}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <span className="text-xl">⭐</span>
                            <span className="text-[#111827] font-medium">{coach.rating > 0 ? coach.rating.toFixed(1) : '—'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[#111827] font-medium">${coach.totalRevenue.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-[#5F6473]">{coach.joinedDate}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-[#5F6473]">{coach.lastActive}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {activeTab === 'pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleVerifyCoach(coach.id)}
                                className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-md font-medium text-xs transition-colors"
                                title="Verify Application"
                              >
                                ✓ Verify
                              </button>
                              <button
                                onClick={() => handleRejectCoach(coach.id)}
                                className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md font-medium text-xs transition-colors"
                                title="Reject Application"
                              >
                                ✕ Reject
                              </button>
                            </div>
                          ) : activeTab === 'suspended' ? (
                            <button 
                              className="text-[#304DB5] hover:text-[#243a8f] font-medium text-sm"
                              title="View Profile"
                            >
                              View Profile →
                            </button>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleViewDetails(coach)}
                                className="text-[#304DB5] hover:text-[#243a8f] font-medium text-sm"
                                title="View Details"
                              >
                                View Details →
                              </button>
                              <button
                                onClick={() => handleSuspendCoach(coach.id)}
                                className="text-red-600 hover:text-red-700 font-medium text-sm"
                                title="Suspend Coach"
                              >
                                Suspend
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          {/* Pagination Info */}
          {!loading && !error && filteredCoaches.length > 0 && (
            <div className="px-6 py-4 border-t border-[#E5E7EB] flex items-center justify-between">
              <div className="text-sm text-[#5F6473]">
                Showing {filteredCoaches.length} of {stats.total} coaches
              </div>
              <div className="flex items-center gap-2">
                {selectedCoaches.length > 0 && (
                  <span className="text-sm text-[#5F6473] bg-[#F5F7FF] px-3 py-1 rounded-full">
                    {selectedCoaches.length} selected
                  </span>
                )}
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Coach Details Modal */}
        {showDetailsModal && selectedCoach && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-[#E5E7EB] flex items-start justify-between sticky top-0 bg-white rounded-t-3xl">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#304DB5] to-[#5E7BFF] flex items-center justify-center text-white text-2xl font-bold">
                    {selectedCoach.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[#111827]">{selectedCoach.name}</h2>
                    <p className="text-[#5F6473]">{selectedCoach.jobTitle}</p>
                    <span className={`inline-block mt-1 px-3 py-1 text-xs font-semibold rounded-full ${
                      selectedCoach.status === 'active' ? 'bg-green-100 text-green-700' :
                      selectedCoach.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {selectedCoach.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-[#F5F7FF] rounded-full transition-colors"
                >
                  <svg className="w-6 h-6 text-[#5F6473]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-8 space-y-6">
                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-[#111827] mb-3">📧 Contact Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-[#F5F7FF] rounded-xl">
                      <p className="text-xs text-[#5F6473] mb-1">Email</p>
                      <p className="font-medium text-[#111827]">{selectedCoach.email}</p>
                    </div>
                    <div className="p-4 bg-[#F5F7FF] rounded-xl">
                      <p className="text-xs text-[#5F6473] mb-1">Joined</p>
                      <p className="font-medium text-[#111827]">{selectedCoach.joinedDate}</p>
                    </div>
                    <div className="p-4 bg-[#F5F7FF] rounded-xl">
                      <p className="text-xs text-[#5F6473] mb-1">Last Active</p>
                      <p className="font-medium text-[#111827]">{selectedCoach.lastActive}</p>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div>
                  <h3 className="text-lg font-semibold text-[#111827] mb-3">📊 Performance Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-[#F5F7FF] rounded-xl text-center">
                      <p className="text-3xl font-bold text-[#304DB5]">{selectedCoach.coursesCount}</p>
                      <p className="text-xs text-[#5F6473] mt-1">Courses</p>
                    </div>
                    <div className="p-4 bg-[#F5F7FF] rounded-xl text-center">
                      <p className="text-3xl font-bold text-[#5E7BFF]">{selectedCoach.studentsCount}</p>
                      <p className="text-xs text-[#5F6473] mt-1">Students</p>
                    </div>
                    <div className="p-4 bg-[#F5F7FF] rounded-xl text-center">
                      <p className="text-3xl font-bold text-yellow-500">{selectedCoach.rating > 0 ? selectedCoach.rating.toFixed(1) : '—'}</p>
                      <p className="text-xs text-[#5F6473] mt-1">Rating ⭐</p>
                    </div>
                    <div className="p-4 bg-[#F5F7FF] rounded-xl text-center">
                      <p className="text-2xl font-bold text-green-600">${selectedCoach.totalRevenue.toLocaleString()}</p>
                      <p className="text-xs text-[#5F6473] mt-1">Revenue</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {selectedCoach.status === 'active' && (
                  <div className="flex gap-3 pt-4 border-t border-[#E5E7EB]">
                    <button
                      onClick={() => {
                        handleSuspendCoach(selectedCoach.id);
                        setShowDetailsModal(false);
                      }}
                      className="flex-1 px-6 py-3 bg-red-50 text-red-600 font-semibold rounded-full hover:bg-red-100 transition-colors"
                    >
                      Suspend Coach
                    </button>
                    <button
                      onClick={() => setShowDetailsModal(false)}
                      className="flex-1 px-6 py-3 bg-[#F5F7FF] text-[#5F6473] font-semibold rounded-full hover:bg-[#E5E7EB] transition-colors"
                    >
                      Close
                    </button>
                  </div>
                )}

                {selectedCoach.status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t border-[#E5E7EB]">
                    <button
                      onClick={() => {
                        handleVerifyCoach(selectedCoach.id);
                        setShowDetailsModal(false);
                      }}
                      className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 transition-colors"
                    >
                      ✓ Verify Coach
                    </button>
                    <button
                      onClick={() => {
                        handleRejectCoach(selectedCoach.id);
                        setShowDetailsModal(false);
                      }}
                      className="flex-1 px-6 py-3 bg-red-600 text-white font-semibold rounded-full hover:bg-red-700 transition-colors"
                    >
                      ✕ Reject
                    </button>
                  </div>
                )}

                {selectedCoach.status === 'suspended' && (
                  <div className="pt-4 border-t border-[#E5E7EB]">
                    <p className="text-sm text-[#5F6473] text-center">
                      This coach has been suspended and cannot access coach features.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminAppLayout>
  );
};

export default CoachesManagementPage;
