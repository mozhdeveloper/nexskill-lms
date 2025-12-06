import React, { useState } from 'react';
import CoachAppLayout from '../../layouts/CoachAppLayout';
import { Search, Download, Mail, BarChart3, TrendingUp, TrendingDown, Award, Clock } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  enrolledCourses: number;
  totalProgress: number;
  averageScore: number;
  lastActive: string;
  joinedDate: string;
  status: 'active' | 'inactive' | 'completed';
  totalTimeSpent: string;
  certificatesEarned: number;
}

const CoachStudentsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'score' | 'lastActive'>('name');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [students] = useState<Student[]>([
    {
      id: 'stu-1',
      name: 'Emma Wilson',
      email: 'emma.wilson@email.com',
      enrolledCourses: 3,
      totalProgress: 85,
      averageScore: 92,
      lastActive: '2 hours ago',
      joinedDate: '2024-01-15',
      status: 'active',
      totalTimeSpent: '24h 30m',
      certificatesEarned: 1,
    },
    {
      id: 'stu-2',
      name: 'Michael Chen',
      email: 'michael.chen@email.com',
      enrolledCourses: 2,
      totalProgress: 45,
      averageScore: 78,
      lastActive: '1 day ago',
      joinedDate: '2024-02-01',
      status: 'active',
      totalTimeSpent: '12h 15m',
      certificatesEarned: 0,
    },
    {
      id: 'stu-3',
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      enrolledCourses: 4,
      totalProgress: 100,
      averageScore: 95,
      lastActive: '3 days ago',
      joinedDate: '2023-11-10',
      status: 'completed',
      totalTimeSpent: '45h 20m',
      certificatesEarned: 4,
    },
    {
      id: 'stu-4',
      name: 'David Park',
      email: 'david.park@email.com',
      enrolledCourses: 1,
      totalProgress: 15,
      averageScore: 65,
      lastActive: '2 weeks ago',
      joinedDate: '2024-01-20',
      status: 'inactive',
      totalTimeSpent: '3h 45m',
      certificatesEarned: 0,
    },
    {
      id: 'stu-5',
      name: 'Lisa Anderson',
      email: 'lisa.a@email.com',
      enrolledCourses: 2,
      totalProgress: 67,
      averageScore: 88,
      lastActive: '5 hours ago',
      joinedDate: '2024-01-05',
      status: 'active',
      totalTimeSpent: '18h 50m',
      certificatesEarned: 1,
    },
    {
      id: 'stu-6',
      name: 'James Rodriguez',
      email: 'james.r@email.com',
      enrolledCourses: 3,
      totalProgress: 92,
      averageScore: 90,
      lastActive: '1 hour ago',
      joinedDate: '2023-12-15',
      status: 'active',
      totalTimeSpent: '32h 10m',
      certificatesEarned: 2,
    },
  ]);

  const handleExportStudents = () => {
    window.alert(`📊 Exporting Student Data\n\n📦 Export Contents:\n• Student names and emails\n• Enrollment information\n• Progress and scores\n• Activity timestamps\n• Course completion data\n• Certificate records\n\n📄 Format: CSV\n⏱️ Processing: 5-15 seconds\n📧 Delivery: Download starts immediately\n💾 File size: ~${Math.ceil(students.length / 10)}MB\n\n🔒 Privacy:\n• GDPR/CCPA compliant\n• Encrypted data\n• Secure download\n\n✅ Export will begin shortly...`);
  };

  const handleMessageStudent = (student: Student) => {
    window.alert(`💬 Send Message to ${student.name}\n\n📧 Contact Info:\n• Email: ${student.email}\n• Preferred: In-app messaging\n• Response time: 2-4 hours\n\n📨 Quick Actions:\n• Send direct message\n• Schedule 1-on-1 call\n• Send course feedback\n• Share resources\n\n💡 Tip: Students receive email notifications for new messages and can respond directly from their inbox.`);
  };

  const handleViewProgress = (student: Student) => {
    setSelectedStudent(student);
    setShowDetailModal(true);
  };

  const handleSendBulkEmail = () => {
    const activeStudents = students.filter(s => s.status === 'active').length;
    window.alert(`📧 Send Bulk Email\n\n👥 Recipients:\n• Total students: ${students.length}\n• Active students: ${activeStudents}\n• Filter: ${filterStatus === 'all' ? 'All students' : filterStatus + ' students'}\n\n✨ Email Features:\n• Personalized greetings\n• Course-specific content\n• Progress tracking links\n• Custom attachments\n• Schedule send time\n\n📊 Expected Engagement:\n• Open rate: ~70%\n• Click rate: ~25%\n• Response rate: ~10%\n\n💡 Use bulk email for announcements, updates, and course-wide communications.`);
  };

  const handleExportReport = (student: Student) => {
    window.alert(`📄 Export Student Report\n\nStudent: ${student.name}\n\n📊 Report Includes:\n• Enrollment history\n• Course progress (${student.totalProgress}%)\n• Quiz scores (Average: ${student.averageScore}%)\n• Time spent: ${student.totalTimeSpent}\n• Certificates: ${student.certificatesEarned}\n• Activity timeline\n• Learning patterns\n• Engagement metrics\n\n📁 Format Options:\n• PDF (Detailed report)\n• CSV (Raw data)\n• Excel (With charts)\n\n✅ Report will be generated and downloaded automatically.`);
  };

  const filteredStudents = students
    .filter(student => {
      const matchesSearch = 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === 'all' || student.status === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'progress':
          return b.totalProgress - a.totalProgress;
        case 'score':
          return b.averageScore - a.averageScore;
        case 'lastActive':
          return a.lastActive.localeCompare(b.lastActive);
        default:
          return 0;
      }
    });

  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'active').length;
  const avgProgress = Math.round(students.reduce((sum, s) => sum + s.totalProgress, 0) / students.length);
  const avgScore = Math.round(students.reduce((sum, s) => sum + s.averageScore, 0) / students.length);

  return (
    <CoachAppLayout>
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white dark:bg-dark-background-card border-b border-slate-200 dark:border-gray-700 px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-dark-text-primary mb-2">Students</h1>
              <p className="text-slate-600 dark:text-dark-text-secondary">Manage and track your student's progress</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSendBulkEmail}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-dark-text-primary rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Send Email
              </button>
              <button
                onClick={handleExportStudents}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Data
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-4">
              <div className="text-sm text-slate-600 dark:text-dark-text-secondary mb-1">Total Students</div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totalStudents}</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-4">
              <div className="text-sm text-slate-600 dark:text-dark-text-secondary mb-1">Active Students</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{activeStudents}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-4">
              <div className="text-sm text-slate-600 dark:text-dark-text-secondary mb-1">Avg Progress</div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{avgProgress}%</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-2xl p-4">
              <div className="text-sm text-slate-600 dark:text-dark-text-secondary mb-1">Avg Score</div>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{avgScore}%</div>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="px-8 py-6 bg-slate-50 dark:bg-dark-background border-b border-slate-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search students by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-dark-background-card rounded-lg border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 bg-white dark:bg-dark-background-card border border-slate-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 bg-white dark:bg-dark-background-card border border-slate-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Sort by Name</option>
                <option value="progress">Sort by Progress</option>
                <option value="score">Sort by Score</option>
                <option value="lastActive">Sort by Last Active</option>
              </select>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="p-8">
          <div className="bg-white dark:bg-dark-background-card rounded-2xl border border-slate-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-dark-text-primary">Student</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-dark-text-primary">Courses</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-dark-text-primary">Progress</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-dark-text-primary">Avg Score</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-dark-text-primary">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-dark-text-primary">Last Active</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-dark-text-primary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
                  {filteredStudents.map(student => (
                    <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {student.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-dark-text-primary">{student.name}</div>
                            <div className="text-sm text-slate-600 dark:text-dark-text-secondary">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-900 dark:text-dark-text-primary">{student.enrolledCourses}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 dark:bg-gray-700 rounded-full h-2 w-24">
                            <div
                              className={`h-2 rounded-full ${
                                student.totalProgress >= 80 ? 'bg-green-500' :
                                student.totalProgress >= 50 ? 'bg-blue-500' :
                                'bg-orange-500'
                              }`}
                              style={{ width: `${student.totalProgress}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-slate-700 dark:text-dark-text-primary">{student.totalProgress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-900 dark:text-dark-text-primary font-medium">{student.averageScore}%</span>
                          {student.averageScore >= 90 ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          ) : student.averageScore < 70 ? (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            student.status === 'active'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : student.status === 'completed'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600 dark:text-dark-text-secondary">{student.lastActive}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewProgress(student)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <BarChart3 className="w-4 h-4 text-slate-600 dark:text-dark-text-secondary" />
                          </button>
                          <button
                            onClick={() => handleMessageStudent(student)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Send Message"
                          >
                            <Mail className="w-4 h-4 text-slate-600 dark:text-dark-text-secondary" />
                          </button>
                          <button
                            onClick={() => handleExportReport(student)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Export Report"
                          >
                            <Download className="w-4 h-4 text-slate-600 dark:text-dark-text-secondary" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Student Detail Modal */}
      {showDetailModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-background-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xl">
                    {selectedStudent.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-dark-text-primary">{selectedStudent.name}</h2>
                    <p className="text-slate-600 dark:text-dark-text-secondary">{selectedStudent.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-dark-text-primary"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                  <div className="text-sm text-slate-600 dark:text-dark-text-secondary mb-1">Total Progress</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedStudent.totalProgress}%</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                  <div className="text-sm text-slate-600 dark:text-dark-text-secondary mb-1">Avg Score</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{selectedStudent.averageScore}%</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                  <div className="text-sm text-slate-600 dark:text-dark-text-secondary mb-1">Time Spent</div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{selectedStudent.totalTimeSpent}</div>
                </div>
              </div>

              {/* Detailed Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-gray-700">
                  <span className="text-slate-600 dark:text-dark-text-secondary">Enrolled Courses</span>
                  <span className="font-semibold text-slate-900 dark:text-dark-text-primary">{selectedStudent.enrolledCourses}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-gray-700">
                  <span className="text-slate-600 dark:text-dark-text-secondary">Certificates Earned</span>
                  <span className="font-semibold text-slate-900 dark:text-dark-text-primary flex items-center gap-2">
                    <Award className="w-4 h-4 text-yellow-500" />
                    {selectedStudent.certificatesEarned}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-gray-700">
                  <span className="text-slate-600 dark:text-dark-text-secondary">Joined Date</span>
                  <span className="font-semibold text-slate-900 dark:text-dark-text-primary">{selectedStudent.joinedDate}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-gray-700">
                  <span className="text-slate-600 dark:text-dark-text-secondary">Last Active</span>
                  <span className="font-semibold text-slate-900 dark:text-dark-text-primary flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    {selectedStudent.lastActive}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-slate-600 dark:text-dark-text-secondary">Status</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedStudent.status === 'active'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : selectedStudent.status === 'completed'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {selectedStudent.status}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    handleMessageStudent(selectedStudent);
                    setShowDetailModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Send Message
                </button>
                <button
                  onClick={() => {
                    handleExportReport(selectedStudent);
                    setShowDetailModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-dark-text-primary rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </CoachAppLayout>
  );
};

export default CoachStudentsPage;
