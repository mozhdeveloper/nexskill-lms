import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import { supabase } from '../../lib/supabaseClient';

interface Booking {
  id: string;
  coach_name: string;
  coach_title: string;
  session_date: string;
  session_time: string;
  duration_minutes: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  amount: number;
}

const CoachingSessions: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from('coaching_bookings')
        .select('id, session_date, session_time, duration_minutes, status, amount, coach_id, coach:profiles!coaching_bookings_coach_id_fkey(first_name, last_name, coach_profiles(job_title))')
        .eq('student_id', user.id)
        .order('session_date', { ascending: false });

      setBookings(
        (data || []).map((b: any) => ({
          id: b.id,
          coach_name: b.coach
            ? `${b.coach.first_name || ''} ${b.coach.last_name || ''}`.trim()
            : 'Coach',
          coach_title: b.coach?.coach_profiles?.job_title || 'Coach',
          session_date: b.session_date,
          session_time: b.session_time,
          duration_minutes: b.duration_minutes || 60,
          status: b.status,
          amount: b.amount || 0,
        }))
      );
      setLoading(false);
    };
    fetchBookings();
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const upcoming = bookings.filter(
    (b) => b.session_date >= today && (b.status === 'pending' || b.status === 'confirmed')
  );
  const past = bookings.filter(
    (b) => b.session_date < today || b.status === 'completed' || b.status === 'cancelled'
  );

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700',
      confirmed: 'bg-green-100 text-green-700',
      completed: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-slate-100 text-slate-600',
    };
    return map[status] || 'bg-slate-100 text-slate-600';
  };

  const SessionCard = ({ booking }: { booking: Booking }) => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#304DB5] to-[#5E7BFF] flex items-center justify-center text-white font-bold text-lg">
            {booking.coach_name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">{booking.coach_name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{booking.coach_title}</p>
          </div>
        </div>
        <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${statusBadge(booking.status)}`}>
          {booking.status}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-slate-500 dark:text-slate-400">Date</p>
          <p className="font-semibold text-slate-900 dark:text-white">
            {new Date(booking.session_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400">Time</p>
          <p className="font-semibold text-slate-900 dark:text-white">{booking.session_time}</p>
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400">Duration</p>
          <p className="font-semibold text-slate-900 dark:text-white">{booking.duration_minutes} min</p>
        </div>
      </div>
    </div>
  );

  return (
    <StudentAppLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#E7F0FF] via-[#F9F0FF] to-[#E3F4FF] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-16 transition-colors">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">My sessions</h1>
              <p className="text-lg text-slate-600 dark:text-slate-400">Manage and review your coaching sessions</p>
            </div>
            <button
              onClick={() => navigate('/student/coaching')}
              className="px-6 py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all"
            >
              Book new session
            </button>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="text-3xl font-bold text-[#304DB5] dark:text-blue-400 mb-1">{upcoming.length}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Upcoming sessions</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="text-3xl font-bold text-[#304DB5] dark:text-blue-400 mb-1">
                {past.filter(b => b.status === 'completed').length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Completed sessions</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="text-3xl font-bold text-[#304DB5] dark:text-blue-400 mb-1">{bookings.length}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Total sessions</div>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
            <div className="flex border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`flex-1 px-6 py-4 font-semibold transition-all ${activeTab === 'upcoming'
                    ? 'text-[#304DB5] dark:text-blue-400 border-b-2 border-[#304DB5] dark:border-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Upcoming ({upcoming.length})
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={`flex-1 px-6 py-4 font-semibold transition-all ${activeTab === 'past'
                    ? 'text-[#304DB5] dark:text-blue-400 border-b-2 border-[#304DB5] dark:border-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Past ({past.length})
              </button>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#304DB5]" />
                </div>
              ) : (activeTab === 'upcoming' ? upcoming : past).length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d={activeTab === 'upcoming'
                        ? 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                        : 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'}
                    />
                  </svg>
                  <p className="text-lg text-slate-600 dark:text-slate-400 mb-2">
                    {activeTab === 'upcoming' ? 'No upcoming sessions' : 'No past sessions yet'}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-500 mb-6">
                    {activeTab === 'upcoming'
                      ? 'Book a 1:1 session with a coach to get started'
                      : 'Your completed sessions will appear here'}
                  </p>
                  {activeTab === 'upcoming' && (
                    <button
                      onClick={() => navigate('/student/coaching')}
                      className="px-6 py-2 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all"
                    >
                      Browse coaches
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {(activeTab === 'upcoming' ? upcoming : past).map((b) => (
                    <SessionCard key={b.id} booking={b} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default CoachingSessions;
