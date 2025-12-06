import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import CoachAppLayout from '../../layouts/CoachAppLayout';
import StudentListTable from '../../components/coach/students/StudentListTable';
import StudentProgressOverview from '../../components/coach/students/StudentProgressOverview';
import StudentExportBar from '../../components/coach/students/StudentExportBar';
import GroupAnnouncementPanel from '../../components/coach/students/GroupAnnouncementPanel';
import StudentScoresPanel from '../../components/coach/students/StudentScoresPanel';

// Dummy student data
const dummyStudents = [
  {
    id: 'student-1',
    name: 'Emma Watson',
    email: 'emma.watson@email.com',
    enrollmentDate: '2024-11-15',
    status: 'Active' as const,
    progressPercent: 78,
    lastActiveAt: '2 hours ago',
    averageScore: 92,
  },
  {
    id: 'student-2',
    name: 'James Rodriguez',
    email: 'james.r@email.com',
    enrollmentDate: '2024-11-10',
    status: 'Completed' as const,
    progressPercent: 100,
    lastActiveAt: '1 day ago',
    averageScore: 88,
  },
  {
    id: 'student-3',
    name: 'Sophia Chen',
    email: 'sophia.chen@email.com',
    enrollmentDate: '2024-11-20',
    status: 'Active' as const,
    progressPercent: 65,
    lastActiveAt: '5 hours ago',
    averageScore: 85,
  },
  {
    id: 'student-4',
    name: 'Michael Brown',
    email: 'michael.b@email.com',
    enrollmentDate: '2024-11-08',
    status: 'At risk' as const,
    progressPercent: 23,
    lastActiveAt: '2 weeks ago',
    averageScore: 58,
  },
  {
    id: 'student-5',
    name: 'Olivia Martinez',
    email: 'olivia.m@email.com',
    enrollmentDate: '2024-11-25',
    status: 'Active' as const,
    progressPercent: 45,
    lastActiveAt: '1 hour ago',
    averageScore: 76,
  },
  {
    id: 'student-6',
    name: 'Daniel Kim',
    email: 'daniel.kim@email.com',
    enrollmentDate: '2024-11-05',
    status: 'Completed' as const,
    progressPercent: 100,
    lastActiveAt: '3 days ago',
    averageScore: 95,
  },
  {
    id: 'student-7',
    name: 'Isabella Garcia',
    email: 'isabella.g@email.com',
    enrollmentDate: '2024-11-18',
    status: 'Active' as const,
    progressPercent: 82,
    lastActiveAt: '30 minutes ago',
    averageScore: 89,
  },
  {
    id: 'student-8',
    name: 'William Taylor',
    email: 'william.t@email.com',
    enrollmentDate: '2024-11-12',
    status: 'At risk' as const,
    progressPercent: 31,
    lastActiveAt: '1 week ago',
    averageScore: 62,
  },
];

// Dummy course data
const dummyCourses: Record<string, { title: string }> = {
  'course-1': { title: 'UI Design Fundamentals' },
  'course-2': { title: 'JavaScript Mastery' },
  'course-3': { title: 'Product Management Excellence' },
  'course-4': { title: 'Data Analytics with Python' },
};

const CourseStudents: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'at-risk' | 'completed'>(
    'all'
  );
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const course = courseId ? dummyCourses[courseId] : null;
  const courseTitle = course?.title || 'Course';

  // Calculate aggregate metrics
  const totalEnrolled = dummyStudents.length;
  const averageCompletion = Math.round(
    dummyStudents.reduce((sum, s) => sum + s.progressPercent, 0) / dummyStudents.length
  );
  const averageQuizScore = Math.round(
    dummyStudents.reduce((sum, s) => sum + s.averageScore, 0) / dummyStudents.length
  );

  const handleExport = (payload: { type: string; format: string }) => {
    window.alert(`📊 Exporting Student Data\n\nExport Type: ${payload.type}\nFormat: ${payload.format.toUpperCase()}\n\n📦 Export Contents:\n• Student names and emails\n• Enrollment dates\n• Progress percentages\n• Quiz scores and grades\n• Last activity dates\n• Completion certificates\n\n⏱️ Processing Time: 10-30 seconds\n📧 Delivery: Download link ready\n💾 File Size: ~${Math.ceil(totalEnrolled / 10)}MB\n\n🔒 Data Privacy:\n• Encrypted during transfer\n• Complies with GDPR/CCPA\n• Use responsibly\n\n✅ Export will begin shortly...`);
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  const handleSendAnnouncement = (payload: {
    subject: string;
    channels: { email: boolean; inApp: boolean };
    body: string;
  }) => {
    const recipientCount = dummyStudents.length;
    const channels = [];
    if (payload.channels.email) channels.push('Email');
    if (payload.channels.inApp) channels.push('In-App');
    
    window.alert(`📢 Announcement Sent Successfully\n\nSubject: "${payload.subject}"\n\n📊 Delivery Details:\n• Recipients: ${recipientCount} students\n• Channels: ${channels.join(', ')}\n• Status: Delivered\n• Sent: ${new Date().toLocaleTimeString()}\n\n✅ Delivery Confirmation:\n${payload.channels.email ? `• Email: Sent to ${recipientCount} addresses\n` : ''}${payload.channels.inApp ? `• In-App: ${recipientCount} notifications delivered\n` : ''}\n📈 Expected Engagement:\n• Open rate: ~65%\n• Read time: 2-3 minutes\n• Response rate: ~15%\n\n💡 Track engagement in analytics dashboard.`);
    setIsAnnouncementOpen(false);
  };

  return (
    <CoachAppLayout>
      <div className="flex-1 overflow-y-auto p-8">
        {/* Header */}
        <div className="mb-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-[#5F6473] mb-3">
            <Link to="/coach/courses" className="hover:text-[#304DB5] transition-colors">
              Courses
            </Link>
            <span>→</span>
            <span>{courseTitle}</span>
            <span>→</span>
            <span className="text-[#111827] font-medium">Students</span>
          </div>

          {/* Title and Meta */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-[#111827] mb-3">{courseTitle} – Students</h1>
              <div className="flex items-center gap-3">
                <span className="px-4 py-2 bg-[#E0E5FF] text-[#304DB5] rounded-full text-sm font-semibold">
                  Enrolled: {totalEnrolled}
                </span>
                <span className="px-4 py-2 bg-[#E0F2FE] text-[#0284C7] rounded-full text-sm font-semibold">
                  Avg completion: {averageCompletion}%
                </span>
                <span className="px-4 py-2 bg-[#D1FAE5] text-[#059669] rounded-full text-sm font-semibold">
                  Avg quiz score: {averageQuizScore}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Utility Bar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          {/* Left: Search and Filter */}
          <div className="flex items-center gap-3 flex-1 w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-initial lg:w-80">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#EDF0FB] dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#304DB5] focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3B5]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as 'all' | 'active' | 'at-risk' | 'completed')
              }
              className="px-4 py-3 rounded-xl border border-[#EDF0FB] dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#304DB5] focus:border-transparent bg-white text-[#111827] font-medium"
            >
              <option value="all">All students</option>
              <option value="active">Active</option>
              <option value="at-risk">At risk</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Right: Export and Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <StudentExportBar onExport={handleExport} />
            <button
              onClick={() => setIsAnnouncementOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                />
              </svg>
              Send group announcement
            </button>
          </div>
        </div>

        {/* Export Success Banner */}
        {exportSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <p className="text-sm font-medium text-green-900">
              Export generated successfully! (simulated)
            </p>
          </div>
        )}

        {/* Main Content: Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Student List (wider) */}
          <div className="lg:col-span-2">
            <StudentListTable
              students={dummyStudents}
              searchQuery={searchQuery}
              filterStatus={filterStatus}
            />
          </div>

          {/* Right Column: Overview Cards (narrower) */}
          <div className="space-y-6">
            <StudentProgressOverview students={dummyStudents} />
            <StudentScoresPanel />
          </div>
        </div>
      </div>

      {/* Announcement Panel */}
      <GroupAnnouncementPanel
        isOpen={isAnnouncementOpen}
        onClose={() => setIsAnnouncementOpen(false)}
        onSend={handleSendAnnouncement}
      />
    </CoachAppLayout>
  );
};

export default CourseStudents;
