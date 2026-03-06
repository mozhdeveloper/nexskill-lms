import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import { useLiveSession } from '../../hooks/useLiveSessions';

const LiveClassRoom: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { session: classData, loading, error } = useLiveSession(classId);

  const handleJoinClass = () => {
    if (classData?.meeting_link) {
      window.open(classData.meeting_link, '_blank');
    } else {
      alert("The session hasn't started yet. Please wait for the coach.");
    }
  };

  const handleCopyMeetingLink = () => {
    if (classData?.meeting_link) {
      navigator.clipboard.writeText(classData.meeting_link);
      alert('Meeting link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <StudentAppLayout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
        </div>
      </StudentAppLayout>
    );
  }

  if (error || !classData) {
    return (
      <StudentAppLayout>
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error Loading Class</h1>
          <p className="text-gray-600">{error || 'Class not found'}</p>
          <button onClick={() => navigate('/student/live-classes')} className="mt-4 text-brand-primary hover:underline">
            Back to Live Classes
          </button>
        </div>
      </StudentAppLayout>
    );
  }

  // Derived values
  const startTime = new Date(classData.scheduled_at);
  const endTime = new Date(startTime.getTime() + classData.duration_minutes * 60000);
  const isLive = classData.is_live || classData.status === 'in_progress';
  const participantsCount = classData.participants_count || Math.floor(Math.random() * 20) + 1; // Mock
  const instructorName = classData.coach ? `${classData.coach.first_name} ${classData.coach.last_name || ''}` : 'Instructor';
  const instructorInitials = classData.coach ? (classData.coach.first_name[0] + (classData.coach.last_name?.[0] || '')) : 'IN';

  return (
    <StudentAppLayout>
      <div className="max-w-5xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/student/live-classes')}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-4 transition-colors"
          >
            <span>←</span>
            <span>Back to Live Classes</span>
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {isLive && (
                  <span className="px-3 py-1 bg-red-100/30 text-red-600 text-sm font-semibold rounded-full flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                    LIVE NOW
                  </span>
                )}
                {!isLive && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-600 text-sm font-semibold rounded-full">
                    {classData.status === 'completed' ? 'Completed' : 'Scheduled'}
                  </span>
                )}
                <span className="text-sm text-text-secondary dark:text-dark-text-secondary">
                  {participantsCount} participants
                </span>
              </div>
              <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary mb-2">{classData.title}</h1>
              <p className="text-text-secondary dark:text-dark-text-secondary">
                {startTime.toLocaleDateString()} • {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({classData.duration_minutes} min)
              </p>
            </div>
          </div>
        </div>

        {/* Join Meeting Card */}
        <div className="bg-gradient-to-br from-brand-primary to-blue-700 rounded-xl p-8 mb-8 text-white transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {isLive ? 'Ready to Join?' : 'Class Scheduled'}
              </h2>
              <p className="text-blue-100 mb-4">
                {isLive ? 'Click the button to join the live class session' : `This session is scheduled for ${startTime.toLocaleString()}`}
              </p>

              {isLive && classData.meeting_link ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleJoinClass}
                    className="px-6 py-3 bg-white text-brand-primary font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2">
                    <span>🎥</span>
                    <span>Join Live Class</span>
                  </button>
                  <button
                    onClick={handleCopyMeetingLink}
                    className="px-4 py-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                    title="Copy meeting link"
                  >
                    📋
                  </button>
                </div>
              ) : (
                <div className="mt-4 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                  <p className="text-sm flex items-center gap-2">
                    <span>🔒</span>
                    The meeting link will appear here when the coach starts the session.
                  </p>
                </div>
              )}
            </div>
            <div className="hidden lg:block">
              <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center text-6xl">
                📹
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About This Class */}
            <div className="bg-white dark:bg-dark-background-card rounded-xl p-6 border border-[#EDF0FB] dark:border-gray-700 transition-colors">
              <h3 className="text-xl font-bold text-text-primary dark:text-dark-text-primary mb-4">About This Class</h3>
              <p className="text-text-primary whitespace-pre-line leading-relaxed">
                {classData.description || 'No description provided.'}
              </p>
            </div>

            {/* Topics Covered - Mock/Placeholder since DB doesn't have it */}
            <div className="bg-white dark:bg-dark-background-card rounded-xl p-6 border border-[#EDF0FB] dark:border-gray-700 transition-colors">
              <h3 className="text-xl font-bold text-text-primary dark:text-dark-text-primary mb-4">You'll Learn</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-brand-primary mt-1">✓</span>
                  <span className="text-text-primary dark:text-dark-text-primary">Key concepts and practical applications</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-primary mt-1">✓</span>
                  <span className="text-text-primary dark:text-dark-text-primary">Live Q&A with {instructorName}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Instructor Info */}
            <div className="bg-white dark:bg-dark-background-card rounded-xl p-6 border border-[#EDF0FB] dark:border-gray-700 transition-colors">
              <h3 className="text-lg font-bold text-text-primary dark:text-dark-text-primary mb-4">Your Instructor</h3>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-brand-primary rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {instructorInitials}
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary dark:text-dark-text-primary">{instructorName}</h4>
                  <p className="text-sm text-text-secondary dark:text-dark-text-secondary mb-2">
                    {classData.coach?.username || 'Expert Coach'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Info */}
            <div className="bg-white dark:bg-dark-background-card rounded-xl p-6 border border-[#EDF0FB] dark:border-gray-700 transition-colors">
              <h3 className="text-lg font-bold text-text-primary dark:text-dark-text-primary mb-4">Class Details</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-text-secondary text-sm mb-1">
                    <span>📅</span>
                    <span>Date & Time</span>
                  </div>
                  <p className="text-text-primary font-medium ml-6">{startTime.toLocaleDateString()}</p>
                  <p className="text-text-primary ml-6">{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-text-secondary text-sm mb-1">
                    <span>⏱️</span>
                    <span>Duration</span>
                  </div>
                  <p className="text-text-primary font-medium ml-6">{classData.duration_minutes} minutes</p>
                </div>
              </div>
            </div>

            {/* Technical Requirements */}
            <div className="bg-blue-50/20 rounded-xl p-6 border border-blue-100 transition-colors">
              <h3 className="text-lg font-bold text-text-primary dark:text-dark-text-primary mb-3">Technical Setup</h3>
              <ul className="space-y-2 text-sm text-text-primary dark:text-dark-text-primary">
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>Stable internet connection</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>Working camera and microphone</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default LiveClassRoom;
