import React from 'react';

interface Student {
  id: string;
  name: string;
  email: string;
  status: 'Active' | 'Completed' | 'At risk';
  progressPercent: number;
  averageScore: number;
  lastActiveAt: string;
}

interface StudentListTableProps {
  students: Student[];
  searchQuery?: string;
  filterStatus?: 'all' | 'active' | 'at-risk' | 'completed';
  onRowClick?: (studentId: string) => void;
}

const StudentListTable: React.FC<StudentListTableProps> = ({
  students,
  searchQuery = '',
  filterStatus = 'all',
  onRowClick,
}) => {
  // Filter students based on search and status
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      searchQuery === '' ||
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'active' && student.status === 'Active') ||
      (filterStatus === 'at-risk' && student.status === 'At risk') ||
      (filterStatus === 'completed' && student.status === 'Completed');

    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: Student['status']) => {
    switch (status) {
      case 'Active':
        return 'bg-[#304DB5] text-white';
      case 'Completed':
        return 'bg-[#22C55E] text-white';
      case 'At risk':
        return 'bg-[#F97316] text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (filteredStudents.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <p className="text-[#5F6473]">No students found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#F5F7FF] border-b border-[#EDF0FB]">
            <tr>
              <th className="text-left px-6 py-4 text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                Student
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                Email
              </th>
              <th className="text-left px-8 py-4 text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                Progress
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                Avg Score
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                Last Active
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EDF0FB]">
            {filteredStudents.map((student) => (
              <tr
                key={student.id}
                onClick={() => onRowClick?.(student.id)}
                className={`hover:bg-[#F5F7FF] transition-colors ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#304DB5] to-[#5E7BFF] flex items-center justify-center text-white font-semibold text-sm">
                      {getInitials(student.name)}
                    </div>
                    <span className="font-medium text-[#111827]">{student.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-[#5F6473]">{student.email}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      student.status
                    )}`}
                  >
                    {student.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-[#111827]">
                      {student.progressPercent}%
                    </div>
                    <div className="w-24 h-2 bg-[#EDF0FB] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#304DB5] to-[#5E7BFF]"
                        style={{ width: `${student.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-[#111827]">{student.averageScore}%</div>
                  <div className="text-xs text-[#9CA3B5]">Quiz avg</div>
                </td>
                <td className="px-6 py-4 text-sm text-[#5F6473]">{student.lastActiveAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden divide-y divide-[#EDF0FB]">
        {filteredStudents.map((student) => (
          <div
            key={student.id}
            onClick={() => onRowClick?.(student.id)}
            className={`p-4 ${onRowClick ? 'cursor-pointer active:bg-[#F5F7FF]' : ''}`}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#304DB5] to-[#5E7BFF] flex items-center justify-center text-white font-semibold">
                {getInitials(student.name)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[#111827] mb-1">{student.name}</h3>
                <p className="text-sm text-[#5F6473] truncate">{student.email}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                  student.status
                )}`}
              >
                {student.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[#9CA3B5] text-xs mb-1">Progress</p>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#111827]">{student.progressPercent}%</span>
                  <div className="flex-1 h-2 bg-[#EDF0FB] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#304DB5] to-[#5E7BFF]"
                      style={{ width: `${student.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[#9CA3B5] text-xs mb-1">Quiz Avg</p>
                <p className="font-medium text-[#111827]">{student.averageScore}%</p>
              </div>
              <div className="col-span-2">
                <p className="text-[#9CA3B5] text-xs mb-1">Last Active</p>
                <p className="text-[#5F6473]">{student.lastActiveAt}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentListTable;
