import React, { useState } from 'react';
import SubCoachAppLayout from '../../layouts/SubCoachAppLayout';
import AssignedStudentsTable from '../../components/subcoach/AssignedStudentsTable';

const SubCoachStudentsPage: React.FC = () => {
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

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

  const handleViewStudent = (id: string) => {
    setSelectedStudent(id);
    setShowDetailModal(true);
  };

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
              onStudentClick={handleViewStudent}
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

      {/* Student Detail Modal */}
      {showDetailModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#EDF0FB] flex items-center justify-between">
              <h3 className="text-xl font-bold text-text-primary">Student Details</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {(() => {
                const student = allStudents.find((s) => s.id === selectedStudent);
                if (!student) return null;
                return (
                  <>
                    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-5 border border-teal-200">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white text-xl font-bold">
                          {student.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-text-primary">{student.name}</h4>
                          <p className="text-sm text-text-secondary">{student.email}</p>
                          <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-lg ${
                            student.status === 'active' ? 'bg-green-100 text-green-700' :
                            student.status === 'needs-support' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {student.status === 'active' ? '✅ Active' :
                             student.status === 'needs-support' ? '⚠️ Needs Support' :
                             '🔴 At Risk'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-xs text-text-secondary">Course Progress</div>
                          <div className="text-lg font-bold text-text-primary">{student.course}</div>
                        </div>
                        <div className="text-2xl font-bold text-teal-600">{student.progress}%</div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-teal-500 to-cyan-500"
                          style={{ width: `${student.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-blue-700">12</div>
                        <div className="text-xs text-blue-600 mt-1">Lessons Completed</div>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-purple-700">3</div>
                        <div className="text-xs text-purple-600 mt-1">Assignments Graded</div>
                      </div>
                      <div className="bg-green-50 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-green-700">85%</div>
                        <div className="text-xs text-green-600 mt-1">Avg. Score</div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="text-xs text-text-secondary mb-1">Last Active</div>
                      <div className="text-sm font-semibold text-text-primary">{student.lastActive}</div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          alert(`✉️ Email sent to ${student.name}!`);
                          console.log('Send message to:', student.id);
                        }}
                        className="flex-1 px-4 py-2 text-sm font-medium text-teal-600 border border-teal-600 hover:bg-teal-50 rounded-xl transition-all"
                      >
                        📧 Send Message
                      </button>
                      <button
                        onClick={() => {
                          alert(`📊 Viewing detailed progress for ${student.name}`);
                          console.log('View progress for:', student.id);
                        }}
                        className="flex-1 px-4 py-2 text-sm font-medium text-text-primary border border-gray-300 hover:bg-gray-50 rounded-xl transition-all"
                      >
                        📊 View Full Progress
                      </button>
                    </div>

                    {student.status === 'at-risk' && (
                      <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                        <div className="flex items-start gap-3">
                          <div className="text-xl">🚨</div>
                          <div>
                            <div className="text-sm font-bold text-red-700 mb-1">Student At Risk</div>
                            <p className="text-xs text-red-600">
                              This student hasn't been active recently and may need additional support. Consider reaching out to check on their progress.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </SubCoachAppLayout>
  );
};

export default SubCoachStudentsPage;