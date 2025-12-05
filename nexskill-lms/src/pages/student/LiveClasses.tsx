import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';

type TabType = 'upcoming' | 'completed' | 'recorded';

const LiveClasses: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');

  const upcomingClasses = [
    {
      id: 1,
      title: 'Introduction to Design Systems',
      instructor: 'Sarah Johnson',
      instructorAvatar: 'SJ',
      date: 'Today',
      time: '2:00 PM',
      duration: '1h 30m',
      status: 'starting-soon' as const,
      participants: 45,
      maxParticipants: 50,
      thumbnail: 'from-blue-400 to-purple-500',
      category: 'Design',
    },
    {
      id: 2,
      title: 'React Performance Optimization',
      instructor: 'Mike Chen',
      instructorAvatar: 'MC',
      date: 'Tomorrow',
      time: '10:00 AM',
      duration: '2h',
      status: 'scheduled' as const,
      participants: 38,
      maxParticipants: 50,
      thumbnail: 'from-purple-400 to-pink-500',
      category: 'Development',
    },
    {
      id: 3,
      title: 'Typography Best Practices',
      instructor: 'Emma Wilson',
      instructorAvatar: 'EW',
      date: 'Dec 6',
      time: '3:00 PM',
      duration: '1h',
      status: 'scheduled' as const,
      participants: 42,
      maxParticipants: 50,
      thumbnail: 'from-pink-400 to-orange-500',
      category: 'Design',
    },
    {
      id: 4,
      title: 'Advanced CSS Animations',
      instructor: 'Alex Brown',
      instructorAvatar: 'AB',
      date: 'Dec 8',
      time: '4:00 PM',
      duration: '1h 45m',
      status: 'scheduled' as const,
      participants: 35,
      maxParticipants: 50,
      thumbnail: 'from-green-400 to-teal-500',
      category: 'Development',
    },
  ];

  const completedClasses = [
    {
      id: 5,
      title: 'Figma Basics Workshop',
      instructor: 'Sarah Johnson',
      date: 'Dec 2',
      time: '2:00 PM',
      duration: '1h 30m',
      thumbnail: 'from-blue-400 to-cyan-500',
      rating: 4.8,
      attendees: 48,
    },
    {
      id: 6,
      title: 'JavaScript ES6+ Features',
      instructor: 'Mike Chen',
      date: 'Dec 1',
      time: '11:00 AM',
      duration: '2h',
      thumbnail: 'from-yellow-400 to-orange-500',
      rating: 4.9,
      attendees: 45,
    },
  ];

  const recordedClasses = [
    {
      id: 7,
      title: 'UI Design Fundamentals',
      instructor: 'Sarah Johnson',
      date: 'Nov 28',
      duration: '1h 30m',
      views: 234,
      thumbnail: 'from-purple-400 to-pink-500',
      category: 'Design',
    },
    {
      id: 8,
      title: 'React Hooks Deep Dive',
      instructor: 'Mike Chen',
      date: 'Nov 25',
      duration: '2h 15m',
      views: 189,
      thumbnail: 'from-blue-400 to-indigo-500',
      category: 'Development',
    },
    {
      id: 9,
      title: 'Color Theory for Designers',
      instructor: 'Emma Wilson',
      date: 'Nov 20',
      duration: '1h',
      views: 156,
      thumbnail: 'from-pink-400 to-red-500',
      category: 'Design',
    },
  ];

  return (
    <StudentAppLayout>
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#EDF0FB] dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary mb-1">Live Classes</h1>
            <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
              Join interactive sessions with expert instructors
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => console.log('Browse all classes')}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              📅 Browse Schedule
            </button>
            <button
              onClick={() => console.log('Filter classes')}
              className="px-4 py-2 text-sm font-medium text-brand-primary hover:bg-blue-50 border border-brand-primary rounded-lg transition-colors"
            >
              🔍 Filter
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          {/* Tabs */}
          <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-[#EDF0FB] dark:border-gray-700 mb-6">
            <div className="flex">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
                  activeTab === 'upcoming'
                    ? 'text-brand-primary border-b-2 border-brand-primary bg-blue-50'
                    : 'text-text-secondary hover:bg-gray-50'
                }`}
              >
                🎥 Upcoming ({upcomingClasses.length})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
                  activeTab === 'completed'
                    ? 'text-brand-primary border-b-2 border-brand-primary bg-blue-50'
                    : 'text-text-secondary hover:bg-gray-50'
                }`}
              >
                ✅ Completed ({completedClasses.length})
              </button>
              <button
                onClick={() => setActiveTab('recorded')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
                  activeTab === 'recorded'
                    ? 'text-brand-primary border-b-2 border-brand-primary bg-blue-50'
                    : 'text-text-secondary hover:bg-gray-50'
                }`}
              >
                📹 Recorded ({recordedClasses.length})
              </button>
            </div>
          </div>

          {/* Upcoming Classes */}
          {activeTab === 'upcoming' && (
            <div className="space-y-4">
              {upcomingClasses.map((liveClass) => (
                <div
                  key={liveClass.id}
                  className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-[#EDF0FB] dark:border-gray-700 p-6 hover:shadow-md transition-all"
                >
                  <div className="flex gap-6">
                    {/* Thumbnail */}
                    <div className={`w-48 h-32 rounded-xl bg-gradient-to-br ${liveClass.thumbnail} flex-shrink-0 flex items-center justify-center`}>
                      <div className="text-white text-5xl">🎥</div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            {liveClass.status === 'starting-soon' && (
                              <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-semibold rounded-full flex items-center gap-1">
                                <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                                Starting Soon
                              </span>
                            )}
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                              {liveClass.category}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-text-primary dark:text-dark-text-primary mb-2">
                            {liveClass.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-text-secondary dark:text-dark-text-secondary mb-3">
                            <div className="flex items-center gap-1">
                              <span>👨‍🏫</span>
                              <span>{liveClass.instructor}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>📅</span>
                              <span>{liveClass.date} at {liveClass.time}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>⏱️</span>
                              <span>{liveClass.duration}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
                            <span>👥 {liveClass.participants}/{liveClass.maxParticipants} registered</span>
                            <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-brand-primary rounded-full"
                                style={{ width: `${(liveClass.participants / liveClass.maxParticipants) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-4">
                        {liveClass.status === 'starting-soon' ? (
                          <button
                            onClick={() => navigate(`/student/live-class/${liveClass.id}`)}
                            className="px-6 py-2.5 bg-gradient-to-r from-brand-primary to-brand-primary-light text-white text-sm font-semibold rounded-full hover:shadow-lg hover:scale-[1.02] transition-all"
                          >
                            Join Now
                          </button>
                        ) : (
                          <button
                            onClick={() => console.log('Add to calendar:', liveClass.id)}
                            className="px-6 py-2.5 bg-white border-2 border-brand-primary text-brand-primary text-sm font-semibold rounded-full hover:bg-blue-50 transition-all"
                          >
                            📅 Add to Calendar
                          </button>
                        )}
                        <button
                          onClick={() => console.log('View details:', liveClass.id)}
                          className="px-6 py-2.5 text-sm font-medium text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Completed Classes */}
          {activeTab === 'completed' && (
            <div className="space-y-4">
              {completedClasses.map((liveClass) => (
                <div
                  key={liveClass.id}
                  className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-[#EDF0FB] dark:border-gray-700 p-6 hover:shadow-md transition-all"
                >
                  <div className="flex gap-6">
                    <div className={`w-48 h-32 rounded-xl bg-gradient-to-br ${liveClass.thumbnail} flex-shrink-0 flex items-center justify-center`}>
                      <div className="text-white text-5xl">✅</div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-text-primary dark:text-dark-text-primary mb-2">
                        {liveClass.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-text-secondary dark:text-dark-text-secondary mb-3">
                        <span>👨‍🏫 {liveClass.instructor}</span>
                        <span>📅 {liveClass.date} at {liveClass.time}</span>
                        <span>⏱️ {liveClass.duration}</span>
                        <span>⭐ {liveClass.rating}/5</span>
                      </div>
                      <p className="text-sm text-text-secondary dark:text-dark-text-secondary mb-4">
                        {liveClass.attendees} students attended this session
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => console.log('Watch recording:', liveClass.id)}
                          className="px-6 py-2 bg-brand-primary text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-colors"
                        >
                          📹 Watch Recording
                        </button>
                        <button
                          onClick={() => console.log('Download resources:', liveClass.id)}
                          className="px-6 py-2 text-sm font-medium text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        >
                          📥 Download Resources
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recorded Classes */}
          {activeTab === 'recorded' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recordedClasses.map((recording) => (
                <div
                  key={recording.id}
                  className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-[#EDF0FB] dark:border-gray-700 overflow-hidden hover:shadow-md transition-all cursor-pointer"
                  onClick={() => console.log('Watch recording:', recording.id)}
                >
                  <div className={`h-40 bg-gradient-to-br ${recording.thumbnail} flex items-center justify-center`}>
                    <div className="text-white text-5xl">▶️</div>
                  </div>
                  <div className="p-4">
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                      {recording.category}
                    </span>
                    <h3 className="text-base font-bold text-text-primary mt-2 mb-1">
                      {recording.title}
                    </h3>
                    <p className="text-sm text-text-secondary dark:text-dark-text-secondary mb-3">
                      by {recording.instructor}
                    </p>
                    <div className="flex items-center justify-between text-xs text-text-secondary dark:text-dark-text-secondary">
                      <span>⏱️ {recording.duration}</span>
                      <span>👁️ {recording.views} views</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Play recording:', recording.id);
                      }}
                      className="w-full mt-3 px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      ▶️ Watch Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default LiveClasses;
