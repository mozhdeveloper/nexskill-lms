import React, { useState } from 'react';
import SubCoachAppLayout from '../../layouts/SubCoachAppLayout';
import AssignedStudentsTable from '../../components/subcoach/AssignedStudentsTable';

const SubCoachStudentsPage: React.FC = () => {
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dummy students data
  const allStudents = [
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
    {
      id: '4',
      name: 'Emma Wilson',
      email: 'emma.w@example.com',
      course: 'UI Design Fundamentals',
      progress: 92,
      lastActive: '30 minutes ago',
      status: 'active' as const,
    },
    {
      id: '5',
      name: 'David Lee',
      email: 'david.l@example.com',
      course: 'JavaScript Mastery',
      progress: 68,
      lastActive: '4 hours ago',
      status: 'active' as const,
    },
    {
      id: '6',
      name: 'Sophie Turner',
      email: 'sophie.t@example.com',
      course: 'UI Design Fundamentals',
      progress: 35,
      lastActive: '2 days ago',
      status: 'needs-support' as const,
    },
    {
      id: '7',
      name: 'James Rodriguez',
      email: 'james.r@example.com',
      course: 'Product Management',
      progress: 55,
      lastActive: '5 hours ago',
      status: 'active' as const,
    },
    {
      id: '8',
      name: 'Lisa Anderson',
      email: 'lisa.a@example.com',
      course: 'JavaScript Mastery',
      progress: 15,
      lastActive: '5 days ago',
      status: 'at-risk' as const,
    },
  ];

  // Filter students
  const filteredStudents = allStudents.filter((student) => {
    const matchesCourse = filterCourse === 'all' || student.course === filterCourse;
    const matchesStatus = filterStatus === 'all' || student.status === filterStatus;
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCourse && matchesStatus && matchesSearch;
  });

  // Get unique courses
  const courses = Array.from(new Set(allStudents.map((s) => s.course)));

  // Statistics
  const activeCount = allStudents.filter((s) => s.status === 'active').length;
  const needsSupportCount = allStudents.filter((s) => s.status === 'needs-support').length;
  const atRiskCount = allStudents.filter((s) => s.status === 'at-risk').length;

  return (
    <SubCoachAppLayout>
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#EDF0FB]">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-text-primary mb-2">My Students</h1>
          <p className="text-sm text-text-secondary">
            Students assigned to you across {courses.length} courses
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-[#EDF0FB]">
              <div className="text-2xl font-bold text-text-primary">{allStudents.length}</div>
              <div className="text-xs text-text-secondary mt-1">Total Students</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-200">
              <div className="text-2xl font-bold text-green-700">{activeCount}</div>
              <div className="text-xs text-green-600 mt-1">Active & On Track</div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-5 border border-amber-200">
              <div className="text-2xl font-bold text-amber-700">{needsSupportCount}</div>
              <div className="text-xs text-amber-600 mt-1">Needs Support</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-5 border border-red-200">
              <div className="text-2xl font-bold text-red-700">{atRiskCount}</div>
              <div className="text-xs text-red-600 mt-1">At Risk</div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="bg-white rounded-2xl p-6 border border-[#EDF0FB]">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  Search Students
                </label>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-[#EDF0FB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                />
              </div>

              {/* Filter by Course */}
              <div className="w-full md:w-64">
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  Filter by Course
                </label>
                <select
                  value={filterCourse}
                  onChange={(e) => setFilterCourse(e.target.value)}
                  className="w-full px-4 py-2 border border-[#EDF0FB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                >
                  <option value="all">All Courses</option>
                  {courses.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter by Status */}
              <div className="w-full md:w-48">
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  Filter by Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-[#EDF0FB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="needs-support">Needs Support</option>
                  <option value="at-risk">At Risk</option>
                </select>
              </div>
            </div>

            <div className="mt-3 text-xs text-text-secondary">
              Showing {filteredStudents.length} of {allStudents.length} students
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white rounded-2xl p-6 border border-[#EDF0FB]">
            <h3 className="text-lg font-bold text-text-primary mb-4">Student List</h3>
            <AssignedStudentsTable
              students={filteredStudents}
              onStudentClick={(id) => console.log('View student:', id)}
            />
          </div>

          {/* Help Section */}
          <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-2xl p-6 border-2 border-dashed border-cyan-300">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center text-xl flex-shrink-0">
                💡
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary mb-2">Working with Students</h4>
                <p className="text-xs text-text-secondary mb-3">
                  As a Sub-Coach, you can support students in your assigned courses:
                </p>
                <ul className="space-y-1 text-xs text-text-secondary">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-600">•</span>
                    <span>Click on a student to view their detailed progress and notes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-600">•</span>
                    <span>Students marked"At Risk" need immediate attention - reach out to them</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-600">•</span>
                    <span>You can answer questions and grade assignments for these students</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-600">•</span>
                    <span>For access to student contact details or advanced analytics, contact your supervising coach</span>
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

export default SubCoachStudentsPage;
