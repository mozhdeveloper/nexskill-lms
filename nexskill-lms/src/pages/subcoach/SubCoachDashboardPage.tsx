import React from 'react';
import SubCoachAppLayout from '../../layouts/SubCoachAppLayout';
import SubCoachKpiStrip from '../../components/subcoach/SubCoachKpiStrip';
import AssignedStudentsTable from '../../components/subcoach/AssignedStudentsTable';
import GradingQueueList from '../../components/subcoach/GradingQueueList';
import GroupSessionsList from '../../components/subcoach/GroupSessionsList';
import { useNavigate } from 'react-router-dom';

const SubCoachDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // Dummy KPI stats
  const stats = {
    studentsAssigned: 24,
    activeCoursesSupporting: 3,
    assignmentsInQueue: 8,
    upcomingSessions: 5,
  };

  // Dummy students (preview - top 5)
  const recentStudents = [
    {
      id: '1',
      name: 'Alex Martinez',
      email: 'alex.m@example.com',
      course: 'UI Design Fundamentals',
      progress: 75,
      lastActive: '2 hours ago',
      status: 'active' as const,
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.j@example.com',
      course: 'JavaScript Mastery',
      progress: 45,
      lastActive: '1 day ago',
      status: 'needs-support' as const,
    },
    {
      id: '3',
      name: 'Michael Chen',
      email: 'michael.c@example.com',
      course: 'Product Management',
      progress: 20,
      lastActive: '3 days ago',
      status: 'at-risk' as const,
    },
  ];

  // Dummy grading queue (preview)
  const gradingPreview = [
    {
      id: '1',
      studentName: 'Emma Wilson',
      courseName: 'UI Design Fundamentals',
      lessonTitle: 'Assignment: Portfolio Website',
      submittedAt: '1 hour ago',
      status: 'Submitted' as const,
    },
    {
      id: '2',
      studentName: 'David Lee',
      courseName: 'JavaScript Mastery',
      lessonTitle: 'Final Project',
      submittedAt: '3 hours ago',
      status: 'Submitted' as const,
    },
  ];

  // Dummy upcoming sessions (preview)
  const upcomingPreview = [
    {
      id: '1',
      title: 'Q&A Session - UI Principles',
      courseName: 'UI Design Fundamentals',
      dateTime: 'Today, 3:00 PM',
      registeredStudents: 12,
      maxCapacity: 20,
      status: 'Upcoming' as const,
    },
    {
      id: '2',
      title: 'JavaScript Workshop',
      courseName: 'JavaScript Mastery',
      dateTime: 'Tomorrow, 10:00 AM',
      registeredStudents: 8,
      maxCapacity: 15,
      status: 'Upcoming' as const,
    },
  ];

  return (
    <SubCoachAppLayout>
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#EDF0FB]">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Sub-Coach Dashboard
          </h1>
          <p className="text-sm text-text-secondary">
            Overview of your assigned students, lessons, and sessions
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* KPI Strip */}
          <SubCoachKpiStrip stats={stats} />

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Students Assigned */}
              <div className="bg-white rounded-2xl p-6 border border-[#EDF0FB]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-text-primary">Students Assigned to You</h3>
                  <button
                    onClick={() => navigate('/subcoach/students')}
                    className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                  >
                    View All →
                  </button>
                </div>
                <AssignedStudentsTable
                  students={recentStudents}
                  onStudentClick={(id) => {
                    const student = recentStudents.find(s => s.id === id);
                    window.alert(`👨‍🎓 Student Profile\n\nName: ${student?.name}\nStatus: ${student?.status}\n\n📊 Quick Stats:\n• Overall progress: ${student?.progress}%\n• Active course: ${student?.course}\n• Last active: ${student?.lastActive}\n• Response rate: High\n\n🎯 Recent Activity:\n• Lessons completed this week: 3\n• Assignments pending: 2\n• Quiz scores: 85% average\n\n💬 Quick Actions:\n• Send message\n• View full progress\n• Schedule 1-on-1\n• Review assignments\n\n💡 Click on 'My Students' to access detailed student information and communication tools.`);
                  }}
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Grading Queue */}
              <div className="bg-white rounded-2xl p-6 border border-[#EDF0FB]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-text-primary">Grading Queue</h3>
                  <button
                    onClick={() => navigate('/subcoach/grading')}
                    className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                  >
                    View All →
                  </button>
                </div>
                <GradingQueueList
                  items={gradingPreview}
                  onGrade={(id) => navigate(`/subcoach/grading?item=${id}`)}
                />
              </div>

              {/* Upcoming Sessions */}
              <div className="bg-white rounded-2xl p-6 border border-[#EDF0FB]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-text-primary">Upcoming Sessions</h3>
                  <button
                    onClick={() => navigate('/subcoach/groups')}
                    className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                  >
                    View All →
                  </button>
                </div>
                <GroupSessionsList
                  sessions={upcomingPreview}
                  onViewDetails={(id) => {
                    const session = upcomingPreview.find(s => s.id === id);
                    window.alert(`📅 Session Details

Title: ${session?.title}

📚 Session Info:
• Registered students: ${session?.registeredStudents || 0}
• Duration: 90 minutes
• Format: Live video call
• Materials: Prepared
• Recording: Enabled
\n✅ Preparation:
• Review lesson plan
• Test video/audio
• Prepare materials
• Send reminders 24h before

💡 Join 10 minutes early to greet students and handle any technical setup.`);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Access Restrictions Notice */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-dashed border-amber-300">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-2xl flex-shrink-0">
                🔒
              </div>
              <div>
                <h4 className="text-base font-bold text-text-primary mb-2">Your Access Level</h4>
                <p className="text-sm text-text-secondary mb-3">
                  As a Sub-Coach, you have limited access to course management features:
                </p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-text-secondary">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>View assigned lessons and materials</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Grade student assignments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Answer student questions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Manage assigned group sessions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600">✗</span>
                    <span>Cannot modify course pricing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600">✗</span>
                    <span>Cannot publish/delete lessons</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600">✗</span>
                    <span>Cannot access earnings reports</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600">✗</span>
                    <span>Cannot access global CRM/funnels</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SubCoachAppLayout>
  );
};

export default SubCoachDashboardPage;
