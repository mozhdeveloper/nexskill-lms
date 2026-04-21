import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLiveSessions } from '../../hooks/useLiveSessions';
import { supabase } from '../../lib/supabaseClient';
import type { LiveSession } from '../../types/db';

type TabType = 'upcoming' | 'completed' | 'recorded';

const LiveClasses: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const { upcomingSessions, completedSessions, recordedSessions, loading, error } = useLiveSessions();
  const [enrollmentCounts, setEnrollmentCounts] = useState<Record<string, number>>({});
  // Add state for selected course and max participants for demonstration
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [maxParticipants, setMaxParticipants] = useState<number>(0);

  useEffect(() => {
    const allSessions = [...upcomingSessions, ...completedSessions, ...recordedSessions];
    const courseIds = [...new Set(allSessions.map(s => s.course_id))];
    if (courseIds.length === 0) return;
    supabase
      .from('enrollments')
      .select('course_id, profile_id')
      .in('course_id', courseIds)
      .then(({ data }) => {
        console.log('[LiveClasses] Raw enrollments fetched:', data);
        const counts: Record<string, number> = {};
        (data || []).forEach((e: any) => {
          counts[e.course_id] = (counts[e.course_id] || 0) + 1;
        });
        console.log('[LiveClasses] Enrollment counts:', counts);
        setEnrollmentCounts(counts);
      });
  }, [upcomingSessions, completedSessions, recordedSessions]);

  // Update maxParticipants whenever selectedCourseId or enrollmentCounts changes
  useEffect(() => {
    if (!selectedCourseId) {
      setMaxParticipants(0);
      return;
    }
    setMaxParticipants(enrollmentCounts[selectedCourseId] ?? 0);
  }, [selectedCourseId, enrollmentCounts]);

  const getInstructorName = (session: LiveSession) => {
    if (session.coach) {
      return `${session.coach.first_name} ${session.coach.last_name || ''}`;
    }
    return 'Instructor';
  };

  const getThumbnailGradient = (id: string) => {
    const gradients = [
      'from-blue-400 to-purple-500',
      'from-purple-400 to-pink-500',
      'from-pink-400 to-orange-500',
      'from-green-400 to-teal-500',
      'from-yellow-400 to-orange-500',
      'from-blue-400 to-cyan-500'
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  };

  // Integrate max participants logic into the main UI
  return (
    <div className="min-h-screen bg-[color:var(--bg-primary)]">
      {/* Back Button */}
      <div className="px-8 py-4">
        <button
          onClick={() => navigate('/student/my-courses')}
          className="flex items-center gap-2 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to My Courses</span>
        </button>
      </div>

      <div className="px-8 py-6 border-b border-[color:var(--border-base)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[color:var(--text-primary)] mb-1">Live Classes</h1>
            <p className="text-sm text-[color:var(--text-secondary)]">
              Join interactive sessions with expert instructors
            </p>
          </div>
          <button className="px-4 py-2 text-sm font-medium rounded-lg transition-colors">
            🔍 Filter
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-1xl">
          {/* If you have a Booking Types panel or course selection UI, integrate here: */}
          <div className="mb-8">
            <label htmlFor="course-select" className="block mb-2 font-medium">Course</label>
            <select
              id="course-select"
              className="border rounded px-3 py-2 w-full mb-2"
              value={selectedCourseId || ''}
              onChange={e => setSelectedCourseId(e.target.value)}
            >
              <option value="">-- Select Course --</option>
              {[...new Set([...upcomingSessions, ...completedSessions, ...recordedSessions].map(s => s.course_id))].map(cid => (
                <option key={cid} value={cid}>{cid}</option>
              ))}
            </select>
            <label className="block mb-2 font-medium">Max Participants</label>
            <input
              type="number"
              className="border rounded px-3 py-2 w-full mb-2"
              value={maxParticipants}
              readOnly
            />
          </div>

          {loading && (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
            </div>
          )}

          {error && (
            <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-lg">
              Error loading live sessions: {error}
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Tabs */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-[#EDF0FB] dark:border-slate-700 mb-6">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${activeTab === 'upcoming'
                      ? 'text-brand-primary dark:text-blue-400 border-b-2 border-brand-primary dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-text-secondary dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                  >
                    🎥 Upcoming ({upcomingSessions.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('completed')}
                    className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${activeTab === 'completed'
                      ? 'text-brand-primary dark:text-blue-400 border-b-2 border-brand-primary dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-text-secondary dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                  >
                    ✅ Completed ({completedSessions.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('recorded')}
                    className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${activeTab === 'recorded'
                      ? 'text-brand-primary dark:text-blue-400 border-b-2 border-brand-primary dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-text-secondary dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                  >
                    📹 Recorded ({recordedSessions.length})
                  </button>
                </div>
              </div>

              {/* Upcoming Classes */}
              {activeTab === 'upcoming' && (
                <div className="space-y-4">
                  {upcomingSessions.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-4xl mb-4">📅</div>
                      <p>No upcoming live sessions found.</p>
                      <p className="text-sm">Enrolled in courses? Check back later!</p>
                    </div>
                  ) : (
                    upcomingSessions.map((liveClass) => {
                      const isStartingSoon = liveClass.is_live ||
                        (new Date(liveClass.scheduled_at).getTime() - Date.now() < 30 * 60 * 1000 &&
                          new Date(liveClass.scheduled_at).getTime() > Date.now());

                      const participants = enrollmentCounts[liveClass.course_id] || 0;

                      return (
                        <div
                          key={liveClass.id}
                          className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-[#EDF0FB] dark:border-slate-700 p-6 hover:shadow-md transition-all"
                        >
                          <div className="flex gap-6">
                            <div className={`w-48 h-32 rounded-xl bg-gradient-to-br ${getThumbnailGradient(liveClass.id)} flex-shrink-0 flex items-center justify-center`}>
                              <div className="text-white text-5xl">🎥</div>
                            </div>

                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    {(liveClass.is_live || isStartingSoon) && (
                                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-semibold rounded-full flex items-center gap-1">
                                        <span className="w-2 h-2 bg-red-600 dark:bg-red-400 rounded-full animate-pulse"></span>
                                        {liveClass.is_live ? 'Live Now' : 'Starting Soon'}
                                      </span>
                                    )}
                                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-full">
                                      {liveClass.courses?.category?.name || 'General'}
                                    </span>
                                  </div>
                                  <h3 className="text-lg font-bold text-text-primary dark:text-dark-text-primary mb-2">
                                    {liveClass.title}
                                  </h3>
                                  <div className="flex items-center gap-4 text-sm text-text-secondary dark:text-dark-text-secondary mb-3">
                                    <div className="flex items-center gap-1">
                                      <span>👨‍🏫</span>
                                      <span>{getInstructorName(liveClass)}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span>📅</span>
                                      <span>{formatDate(liveClass.scheduled_at)} at {formatTime(liveClass.scheduled_at)}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span>⏱️</span>
                                      <span>{liveClass.duration_minutes}m</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
                                    <span>👥 {participants}/100 registered</span>
                                    <div className="w-32 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-brand-primary rounded-full"
                                        style={{ width: `${(participants / 100) * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 mt-4">
                                {(liveClass.is_live || isStartingSoon) ? (
                                  <button
                                    onClick={() => {
                                      if (liveClass.meeting_link) {
                                        window.open(liveClass.meeting_link, '_blank');
                                      } else {
                                        navigate(`/student/live-class/${liveClass.id}`);
                                      }
                                    }}
                                    className="px-6 py-2.5 bg-gradient-to-r from-brand-primary to-brand-primary-light text-white text-sm font-semibold rounded-full hover:shadow-lg hover:scale-[1.02] transition-all"
                                  >
                                    Join Now
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => navigate(`/student/live-class/${liveClass.id}`)}
                                    className="px-6 py-2.5 bg-white border-2 border-brand-primary text-brand-primary text-sm font-semibold rounded-full hover:bg-blue-50 transition-all"
                                  >
                                    📅 View Details
                                  </button>
                                )}
                                <button
                                  onClick={() => navigate(`/student/live-class/${liveClass.id}`)}
                                  className="px-6 py-2.5 text-sm font-medium text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                                >
                                  View Details
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Completed Classes */}
              {activeTab === 'completed' && (
                <div className="space-y-4">
                  {completedSessions.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p>No completed live sessions found.</p>
                    </div>
                  ) : (
                    completedSessions.map((liveClass) => (
                      <div
                        key={liveClass.id}
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-[#EDF0FB] dark:border-slate-700 p-6 hover:shadow-md transition-all"
                      >
                        <div className="flex gap-6">
                          <div className={`w-48 h-32 rounded-xl bg-gradient-to-br ${getThumbnailGradient(liveClass.id)} flex-shrink-0 flex items-center justify-center`}>
                            <div className="text-white text-5xl">✅</div>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-text-primary dark:text-dark-text-primary mb-2">
                              {liveClass.title}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-text-secondary dark:text-dark-text-secondary mb-3">
                              <span>👨‍🏫 {getInstructorName(liveClass)}</span>
                              <span>📅 {formatDate(liveClass.scheduled_at)}</span>
                              <span>⏱️ {liveClass.duration_minutes}m</span>
                            </div>

                            <div className="flex items-center gap-3">
                              {liveClass.recording_url ? (
                                <button
                                  onClick={() => window.open(liveClass.recording_url!, '_blank')}
                                  className="px-6 py-2 bg-brand-primary text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-colors"
                                >
                                  📹 Watch Recording
                                </button>
                              ) : (
                                <span className="text-xs text-gray-500 italic">No recording available</span>
                              )}

                              <button
                                className="px-6 py-2 text-sm font-medium text-text-secondary rounded-full opacity-50 cursor-not-allowed"
                                disabled
                              >
                                📥 Download Resources
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )))}
                </div>
              )}

              {/* Recorded Classes */}
              {activeTab === 'recorded' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recordedSessions.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      <p>No recorded sessions available.</p>
                    </div>
                  ) : (
                    recordedSessions.map((recording) => (
                      <div
                        key={recording.id}
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-[#EDF0FB] dark:border-slate-700 overflow-hidden hover:shadow-md transition-all cursor-pointer"
                        onClick={() => recording.recording_url && window.open(recording.recording_url, '_blank')}
                      >
                        <div className={`h-40 bg-gradient-to-br ${getThumbnailGradient(recording.id)} flex items-center justify-center`}>
                          <div className="text-white text-5xl">▶️</div>
                        </div>
                        <div className="p-4">
                          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 text-xs font-medium rounded-full">
                            {recording.courses?.category?.name || 'General'}
                          </span>
                          <h3 className="text-base font-bold text-text-primary dark:text-white mt-2 mb-1">
                            {recording.title}
                          </h3>
                          <p className="text-sm text-text-secondary dark:text-dark-text-secondary mb-3">
                            by {getInstructorName(recording)}
                          </p>
                          <div className="flex items-center justify-between text-xs text-text-secondary dark:text-dark-text-secondary">
                            <span>⏱️ {recording.duration_minutes}m</span>
                          </div>
                          <button
                            className="w-full mt-3 px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            ▶️ Watch Now
                          </button>
                        </div>
                      </div>
                    )))}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default LiveClasses;
