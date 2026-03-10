import React, { useState, useEffect } from 'react';
import CoachAppLayout from '../../layouts/CoachAppLayout';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import AvailabilityCalendarPanel from '../../components/coaching/tools/AvailabilityCalendarPanel';
import BookingTypesPanel from '../../components/coaching/tools/BookingTypesPanel';
import SessionLogTable from '../../components/coaching/tools/SessionLogTable';
import GroupCoachingDashboard from '../../components/coaching/tools/GroupCoachingDashboard';
import StudentChatPanel from '../../components/coaching/tools/StudentChatPanel';
import SessionReplayUpload from '../../components/coaching/tools/SessionReplayUpload';
import SessionNotesPanel from '../../components/coaching/tools/SessionNotesPanel';

type ActiveTool =
  | 'availability'
  | 'booking-types'
  | 'session-log'
  | 'group-coaching'
  | 'chat'
  | 'replays'
  | 'notes';

interface DayAvailability {
  day: string;
  slots: Array<{ time: string; available: boolean; booked: boolean }>;
}

interface BookingType {
  id: string;
  name: string;
  duration: number;
  format: 'Online' | 'In-person';
  price: number;
  maxParticipants: number;
  status: 'Active' | 'Hidden';
}

const CoachingToolsHub: React.FC = () => {
  const { user } = useAuth();
  const [activeTool, setActiveTool] = useState<ActiveTool>('availability');

  // KPI stats from database
  const [kpiStats, setKpiStats] = useState({
    totalSessions: 0,
    upcoming: 0,
    activeStudents: 0,
    avgRating: 0,
    reviewCount: 0,
  });

  useEffect(() => {
    if (!user) return;
    const fetchKpis = async () => {
      try {
        const now = new Date().toISOString();
        const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();
        const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const [
          { count: totalSessions },
          { count: upcoming },
          { data: studentData },
          { data: reviewData },
        ] = await Promise.all([
          supabase.from('coaching_bookings').select('*', { count: 'exact', head: true })
            .eq('coach_id', user.id)
            .in('status', ['completed', 'confirmed'])
            .gte('created_at', yearStart),
          supabase.from('coaching_bookings').select('*', { count: 'exact', head: true })
            .eq('coach_id', user.id)
            .in('status', ['pending', 'confirmed'])
            .gte('session_date', now.split('T')[0])
            .lte('session_date', weekFromNow),
          supabase.from('coaching_bookings').select('student_id')
            .eq('coach_id', user.id)
            .in('status', ['pending', 'confirmed']),
          supabase.from('courses').select('id')
            .eq('coach_id', user.id)
            .then(async ({ data: courses }) => {
              if (!courses?.length) return { data: [] };
              const courseIds = courses.map(c => c.id);
              return supabase.from('reviews').select('rating').in('course_id', courseIds);
            }),
        ]);

        const uniqueStudents = new Set(studentData?.map(s => s.student_id) ?? []);
        const ratings = reviewData ?? [];
        const avgRating = ratings.length > 0
          ? ratings.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / ratings.length
          : 0;

        setKpiStats({
          totalSessions: totalSessions ?? 0,
          upcoming: upcoming ?? 0,
          activeStudents: uniqueStudents.size,
          avgRating: Math.round(avgRating * 10) / 10,
          reviewCount: ratings.length,
        });
      } catch (err) {
        console.error('Error fetching coaching KPIs:', err);
      }
    };
    fetchKpis();
  }, [user]);

  // Local UI state for components
  const [availabilityConfig, setAvailabilityConfig] = useState<DayAvailability[]>([
    {
      day: 'Monday',
      slots: [
        { time: '09:00 AM', available: true, booked: false },
        { time: '11:00 AM', available: true, booked: false },
        { time: '01:00 PM', available: false, booked: false },
        { time: '03:00 PM', available: true, booked: true },
        { time: '05:00 PM', available: false, booked: false },
      ],
    },
    {
      day: 'Tuesday',
      slots: [
        { time: '09:00 AM', available: true, booked: false },
        { time: '11:00 AM', available: true, booked: false },
        { time: '01:00 PM', available: true, booked: false },
        { time: '03:00 PM', available: false, booked: false },
        { time: '05:00 PM', available: true, booked: false },
      ],
    },
    {
      day: 'Wednesday',
      slots: [
        { time: '09:00 AM', available: false, booked: false },
        { time: '11:00 AM', available: true, booked: false },
        { time: '01:00 PM', available: true, booked: false },
        { time: '03:00 PM', available: true, booked: false },
        { time: '05:00 PM', available: false, booked: false },
      ],
    },
    {
      day: 'Thursday',
      slots: [
        { time: '09:00 AM', available: true, booked: false },
        { time: '11:00 AM', available: true, booked: true },
        { time: '01:00 PM', available: true, booked: false },
        { time: '03:00 PM', available: true, booked: false },
        { time: '05:00 PM', available: false, booked: false },
      ],
    },
    {
      day: 'Friday',
      slots: [
        { time: '09:00 AM', available: true, booked: false },
        { time: '11:00 AM', available: true, booked: false },
        { time: '01:00 PM', available: false, booked: false },
        { time: '03:00 PM', available: false, booked: false },
        { time: '05:00 PM', available: false, booked: false },
      ],
    },
    {
      day: 'Saturday',
      slots: [
        { time: '09:00 AM', available: false, booked: false },
        { time: '11:00 AM', available: false, booked: false },
        { time: '01:00 PM', available: false, booked: false },
        { time: '03:00 PM', available: false, booked: false },
        { time: '05:00 PM', available: false, booked: false },
      ],
    },
    {
      day: 'Sunday',
      slots: [
        { time: '09:00 AM', available: false, booked: false },
        { time: '11:00 AM', available: false, booked: false },
        { time: '01:00 PM', available: false, booked: false },
        { time: '03:00 PM', available: false, booked: false },
        { time: '05:00 PM', available: false, booked: false },
      ],
    },
  ]);

  const [bookingTypes, setBookingTypes] = useState<BookingType[]>([]);

  const toolTabs = [
    { id: 'availability' as ActiveTool, label: 'Availability', icon: '📅' },
    { id: 'booking-types' as ActiveTool, label: 'Booking Types', icon: '⚙️' },
    { id: 'session-log' as ActiveTool, label: 'Session Log', icon: '📋' },
    { id: 'group-coaching' as ActiveTool, label: 'Group Coaching', icon: '👥' },
    { id: 'chat' as ActiveTool, label: 'Student Chat', icon: '💬' },
    { id: 'replays' as ActiveTool, label: 'Replays', icon: '🎥' },
    { id: 'notes' as ActiveTool, label: 'Session Notes', icon: '📝' },
  ];

  return (
    <CoachAppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#111827] mb-2">Coaching Tools</h1>
          <p className="text-lg text-[#5F6473]">
            Manage your coaching sessions, availability, and student interactions
          </p>
        </div>

        {/* KPI Summary Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#304DB5] to-[#5E7BFF] rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm opacity-90">Total Sessions</p>
              <svg
                className="w-8 h-8 opacity-80"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-4xl font-bold">{kpiStats.totalSessions}</p>
            <p className="text-xs opacity-80 mt-1">This year</p>
          </div>

          <div className="bg-white dark:bg-dark-background-card rounded-2xl border border-[#EDF0FB] dark:border-gray-700 p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-[#5F6473]">Upcoming</p>
              <svg
                className="w-8 h-8 text-[#F97316]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-4xl font-bold text-[#111827]">{kpiStats.upcoming}</p>
            <p className="text-xs text-[#9CA3B5] mt-1">Next 7 days</p>
          </div>

          <div className="bg-white dark:bg-dark-background-card rounded-2xl border border-[#EDF0FB] dark:border-gray-700 p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-[#5F6473]">Active Students</p>
              <svg
                className="w-8 h-8 text-[#22C55E]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <p className="text-4xl font-bold text-[#111827]">{kpiStats.activeStudents}</p>
            <p className="text-xs text-[#9CA3B5] mt-1">Currently coaching</p>
          </div>

          <div className="bg-white dark:bg-dark-background-card rounded-2xl border border-[#EDF0FB] dark:border-gray-700 p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-[#5F6473]">Avg Rating</p>
              <svg
                className="w-8 h-8 text-[#F59E0B]"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <p className="text-4xl font-bold text-[#111827]">{kpiStats.avgRating > 0 ? kpiStats.avgRating : '—'}</p>
            <p className="text-xs text-[#9CA3B5] mt-1">From {kpiStats.reviewCount} review{kpiStats.reviewCount !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Tool Tabs */}
        <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-lg border border-[#EDF0FB] dark:border-gray-700 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-[#EDF0FB] dark:border-gray-700">
            {toolTabs.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`flex items-center gap-2 px-6 py-4 font-semibold whitespace-nowrap transition-all ${
                  activeTool === tool.id
                    ? 'bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white'
                    : 'text-[#5F6473] hover:bg-[#F5F7FF] dark:hover:bg-gray-800 dark:bg-gray-800'
                }`}
              >
                <span className="text-xl">{tool.icon}</span>
                <span>{tool.label}</span>
              </button>
            ))}
          </div>

          {/* Tool Content */}
          <div className="p-8">
            {activeTool === 'availability' && (
              <AvailabilityCalendarPanel
                availabilityConfig={availabilityConfig}
                onChange={setAvailabilityConfig}
              />
            )}
            {activeTool === 'booking-types' && (
              <BookingTypesPanel bookingTypes={bookingTypes} onChange={setBookingTypes} />
            )}
            {activeTool === 'session-log' && <SessionLogTable />}
            {activeTool === 'group-coaching' && <GroupCoachingDashboard />}
            {activeTool === 'chat' && <StudentChatPanel />}
            {activeTool === 'replays' && <SessionReplayUpload />}
            {activeTool === 'notes' && <SessionNotesPanel />}
          </div>
        </div>
      </div>
    </CoachAppLayout>
  );
};

export default CoachingToolsHub;
