import { useState } from 'react';
import { Eye, Mail, Phone, Calendar } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinedDate: string;
  coursesEnrolled: number;
  ticketsOpened: number;
  status: 'active' | 'inactive' | 'suspended';
}

interface SupportStudentListProps {
  onViewStudent?: (student: Student) => void;
}

const SupportStudentList = ({ onViewStudent }: SupportStudentListProps) => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const students: Student[] = [
    { id: 'STU-1001', name: 'Sarah Chen', email: 'sarah.chen@email.com', phone: '+1 234-567-8901', joinedDate: 'Jan 15, 2024', coursesEnrolled: 5, ticketsOpened: 3, status: 'active' },
    { id: 'STU-1002', name: 'Michael Brown', email: 'michael.b@email.com', phone: '+1 234-567-8902', joinedDate: 'Feb 20, 2024', coursesEnrolled: 3, ticketsOpened: 1, status: 'active' },
    { id: 'STU-1003', name: 'Emma Wilson', email: 'emma.w@email.com', phone: '+1 234-567-8903', joinedDate: 'Mar 10, 2024', coursesEnrolled: 8, ticketsOpened: 5, status: 'active' },
    { id: 'STU-1004', name: 'James Lee', email: 'james.lee@email.com', phone: '+1 234-567-8904', joinedDate: 'Jan 5, 2024', coursesEnrolled: 2, ticketsOpened: 0, status: 'inactive' },
    { id: 'STU-1005', name: 'Olivia Martinez', email: 'olivia.m@email.com', phone: '+1 234-567-8905', joinedDate: 'Apr 12, 2024', coursesEnrolled: 6, ticketsOpened: 2, status: 'active' },
    { id: 'STU-1006', name: 'Noah Davis', email: 'noah.d@email.com', phone: '+1 234-567-8906', joinedDate: 'Feb 28, 2024', coursesEnrolled: 4, ticketsOpened: 1, status: 'active' },
  ];

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-300';
      case 'inactive': return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'suspended': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <>
      <div className="bg-white rounded-3xl shadow-lg p-6">
        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name, email, or student ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-100">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Student ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Email</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Phone</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Joined</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Courses</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Tickets</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id} className="border-b border-gray-50 hover:bg-blue-50 transition-colors">
                  <td className="py-4 px-4">
                    <span className="font-mono text-sm font-semibold text-gray-700">{student.id}</span>
                  </td>
                  <td className="py-4 px-4 font-medium text-gray-900">{student.name}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {student.email}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {student.phone}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {student.joinedDate}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                      {student.coursesEnrolled}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                      {student.ticketsOpened}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(student.status)}`}>
                      {student.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => onViewStudent ? onViewStudent(student) : setSelectedStudent(student)}
                      className="p-2 hover:bg-blue-100 rounded-xl transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5 text-blue-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedStudent(null)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Student Details</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-semibold text-gray-600">Student ID</span>
                  <p className="font-mono text-lg font-bold text-gray-900">{selectedStudent.id}</p>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-600">Status</span>
                  <p className="mt-1">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedStudent.status)}`}>
                      {selectedStudent.status.toUpperCase()}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-600">Name</span>
                  <p className="text-lg font-medium text-gray-900">{selectedStudent.name}</p>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-600">Joined Date</span>
                  <p className="text-lg font-medium text-gray-900">{selectedStudent.joinedDate}</p>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-600">Email</span>
                  <p className="text-sm text-gray-900">{selectedStudent.email}</p>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-600">Phone</span>
                  <p className="text-sm text-gray-900">{selectedStudent.phone}</p>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-600">Courses Enrolled</span>
                  <p className="text-lg font-medium text-gray-900">{selectedStudent.coursesEnrolled}</p>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-600">Tickets Opened</span>
                  <p className="text-lg font-medium text-gray-900">{selectedStudent.ticketsOpened}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 italic">Note: View-only access. Cannot edit student information.</p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-semibold hover:shadow-lg transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SupportStudentList;
