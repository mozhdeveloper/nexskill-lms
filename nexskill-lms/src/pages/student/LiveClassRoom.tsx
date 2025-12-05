import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';

const LiveClassRoom: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();

  // Dummy data - In production, this will be fetched from Zoom API or similar service
  const classData = {
    id: classId || '1',
    title: 'Introduction to Design Systems',
    instructor: 'Sarah Johnson',
    instructorTitle: 'Senior UX Designer',
    instructorBio: '10+ years of experience in design systems and user experience',
    startTime: '2:00 PM',
    endTime: '3:30 PM',
    duration: '1h 30m',
    date: 'Today, December 5, 2025',
    participants: 45,
    maxParticipants: 100,
    status: 'live' as const,
    description: `Join us for an comprehensive introduction to Design Systems. In this live session, we'll explore:

• What are design systems and why they matter
• Core components and patterns
• Best practices for building scalable design systems
• Tools and workflows for design system management
• Real-world case studies and examples

This is an interactive session where you can ask questions and engage with the instructor and other participants.`,
    topics: [
      'Design System Fundamentals',
      'Component Libraries',
      'Design Tokens',
      'Documentation Best Practices',
      'Tool Integration (Figma, Storybook)',
    ],
    meetingLink: 'https://zoom.us/j/1234567890?pwd=example', // Will be fetched from Zoom API
    meetingId: '123 456 7890',
    passcode: 'design2025',
    requirements: [
      'Basic understanding of UI/UX design',
      'Familiarity with design tools (Figma or Sketch)',
      'Notebook for taking notes',
    ],
  };

  const handleJoinClass = () => {
    // In production, this would open the Zoom meeting link
    window.open(classData.meetingLink, '_blank');
  };

  const handleCopyMeetingLink = () => {
    navigator.clipboard.writeText(classData.meetingLink);
    // You can add a toast notification here
    alert('Meeting link copied to clipboard!');
  };

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
                <span className="px-3 py-1 bg-red-100/30 text-red-600 text-sm font-semibold rounded-full flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                  LIVE NOW
                </span>
                <span className="text-sm text-text-secondary">
                  {classData.participants} / {classData.maxParticipants} participants
                </span>
              </div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">{classData.title}</h1>
              <p className="text-text-secondary">
                {classData.date} • {classData.startTime} - {classData.endTime} ({classData.duration})
              </p>
            </div>
          </div>
        </div>

        {/* Join Meeting Card */}
        <div className="bg-gradient-to-br from-brand-primary to-blue-700 rounded-xl p-8 mb-8 text-white transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Ready to Join?</h2>
              <p className="text-blue-100 mb-4">Click the button to join the live class session</p>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-semibold">Meeting ID:</span>
                  <span className="font-mono bg-white/20/20 px-3 py-1 rounded">{classData.meetingId}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-semibold">Passcode:</span>
                  <span className="font-mono bg-white/20/20 px-3 py-1 rounded">{classData.passcode}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleJoinClass}
                  className="px-6 py-3 bg-white text-brand-primary font-semibold rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2">
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
            <div className="bg-white rounded-xl p-6 border border-[#EDF0FB] transition-colors">
              <h3 className="text-xl font-bold text-text-primary mb-4">About This Class</h3>
              <p className="text-text-primary whitespace-pre-line leading-relaxed">{classData.description}</p>
            </div>

            {/* Topics Covered */}
            <div className="bg-white rounded-xl p-6 border border-[#EDF0FB] transition-colors">
              <h3 className="text-xl font-bold text-text-primary mb-4">Topics Covered</h3>
              <ul className="space-y-3">
                {classData.topics.map((topic, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-brand-primary mt-1">✓</span>
                    <span className="text-text-primary">{topic}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-xl p-6 border border-[#EDF0FB] transition-colors">
              <h3 className="text-xl font-bold text-text-primary mb-4">What You'll Need</h3>
              <ul className="space-y-3">
                {classData.requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-gray-400 mt-1">•</span>
                    <span className="text-text-primary">{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Instructor Info */}
            <div className="bg-white rounded-xl p-6 border border-[#EDF0FB] transition-colors">
              <h3 className="text-lg font-bold text-text-primary mb-4">Your Instructor</h3>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-brand-primary rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {classData.instructor.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary">{classData.instructor}</h4>
                  <p className="text-sm text-text-secondary mb-2">{classData.instructorTitle}</p>
                </div>
              </div>
              <p className="text-sm text-text-primary">{classData.instructorBio}</p>
            </div>

            {/* Quick Info */}
            <div className="bg-white rounded-xl p-6 border border-[#EDF0FB] transition-colors">
              <h3 className="text-lg font-bold text-text-primary mb-4">Class Details</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-text-secondary text-sm mb-1">
                    <span>📅</span>
                    <span>Date & Time</span>
                  </div>
                  <p className="text-text-primary font-medium ml-6">{classData.date}</p>
                  <p className="text-text-primary ml-6">{classData.startTime} - {classData.endTime}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-text-secondary text-sm mb-1">
                    <span>⏱️</span>
                    <span>Duration</span>
                  </div>
                  <p className="text-text-primary font-medium ml-6">{classData.duration}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-text-secondary text-sm mb-1">
                    <span>👥</span>
                    <span>Participants</span>
                  </div>
                  <p className="text-text-primary font-medium ml-6">
                    {classData.participants} joined • {classData.maxParticipants - classData.participants} spots left
                  </p>
                </div>
              </div>
            </div>

            {/* Technical Requirements */}
            <div className="bg-blue-50/20 rounded-xl p-6 border border-blue-100 transition-colors">
              <h3 className="text-lg font-bold text-text-primary mb-3">Technical Setup</h3>
              <ul className="space-y-2 text-sm text-text-primary">
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>Stable internet connection</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>Working camera and microphone</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>Zoom app installed (recommended)</span>
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
