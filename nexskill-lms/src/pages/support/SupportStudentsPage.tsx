import { useState } from 'react';
import SupportStaffAppLayout from '../../layouts/SupportStaffAppLayout';
import SupportStudentList from '../../components/support/SupportStudentList';

interface Student {
  id: string;
  name: string;
  email: string;
  status: string;
  enrollments?: number;
  coursesEnrolled?: number;
}

const SupportStudentsPage = () => {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowDetailModal(true);
  };

  const handleResetPassword = (studentId: string) => {
    console.log('Resetting password for student:', studentId);
    alert('Password reset email sent successfully!');
  };

  const handleUnlockAccount = (studentId: string) => {
    console.log('Unlocking account:', studentId);
    alert('Account unlocked successfully!');
  };

  const handleSuspendAccount = (studentId: string) => {
    alert(`⚠️ Account Suspended\n\nStudent ID: ${studentId}\n\n🚫 Suspension Details:\n• Access: Blocked immediately\n• Course progress: Preserved\n• Certificates: Temporarily unavailable\n\n📧 Student Notification:\n• Suspension reason sent\n• Appeal process included\n• Support contact provided\n\n📝 Next Steps:\n• Document suspension reason\n• Set review date\n• Notify relevant instructors`);
  };

  const handleExportData = () => {
    console.log('Exporting student data...');
    alert('Export started!');
  };

  return (
    <SupportStaffAppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Accounts</h1>
              <p className="text-gray-600">Search and manage student account information</p>
            </div>
            <button
              onClick={handleExportData}
              className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-all font-medium"
            >
              📥 Export
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔍 Search by name, email, or student ID..."
                className="w-full px-4 py-3 bg-gray-50 rounded-full text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-gray-50 rounded-full text-sm text-gray-700 border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending Verification</option>
            </select>
          </div>
        </div>

        {/* Student List */}
        <SupportStudentList onViewStudent={handleViewStudent} />
      </div>

      {/* Student Detail Modal */}
      {showDetailModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Student Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedStudent.name}</h3>
                    <p className="text-gray-600">{selectedStudent.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedStudent.status === 'active' ? 'bg-green-100 text-green-700' :
                    selectedStudent.status === 'suspended' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedStudent.status}
                  </span>
                  <span className="text-sm text-gray-600">Student ID: {selectedStudent.id}</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl text-center">
                  <div className="text-2xl font-bold text-blue-600">{selectedStudent.enrollments || selectedStudent.coursesEnrolled || 0}</div>
                  <div className="text-xs text-gray-600 mt-1">Enrollments</div>
                </div>
                <div className="p-4 bg-green-50 rounded-xl text-center">
                  <div className="text-2xl font-bold text-green-600">87%</div>
                  <div className="text-xs text-gray-600 mt-1">Completion Rate</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl text-center">
                  <div className="text-2xl font-bold text-purple-600">4.5</div>
                  <div className="text-xs text-gray-600 mt-1">Avg. Rating</div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-3">Recent Activity</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Last login</span>
                    <span className="text-gray-500">2 hours ago</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Last course accessed</span>
                    <span className="text-gray-500">Advanced React Patterns</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Account created</span>
                    <span className="text-gray-500">Jan 15, 2024</span>
                  </div>
                </div>
              </div>

              {/* Support History */}
              <div className="p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200">
                <h4 className="font-semibold text-gray-900 mb-2">Support History</h4>
                <p className="text-sm text-gray-600">3 previous tickets • Last resolved 5 days ago</p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleResetPassword(selectedStudent.id)}
                  className="px-4 py-3 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-colors"
                >
                  🔑 Reset Password
                </button>
                <button
                  onClick={() => handleUnlockAccount(selectedStudent.id)}
                  className="px-4 py-3 bg-green-50 text-green-700 font-medium rounded-lg hover:bg-green-100 transition-colors"
                >
                  🔓 Unlock Account
                </button>
                <button
                  onClick={() => console.log('View enrollments:', selectedStudent.id)}
                  className="px-4 py-3 bg-purple-50 text-purple-700 font-medium rounded-lg hover:bg-purple-100 transition-colors"
                >
                  📚 View Enrollments
                </button>
                <button
                  onClick={() => handleSuspendAccount(selectedStudent.id)}
                  className="px-4 py-3 bg-red-50 text-red-700 font-medium rounded-lg hover:bg-red-100 transition-colors"
                >
                  🚫 Suspend Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SupportStaffAppLayout>
  );
};

export default SupportStudentsPage;
