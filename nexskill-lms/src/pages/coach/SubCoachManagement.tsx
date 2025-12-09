import React, { useState, useMemo } from 'react';
import CoachAppLayout from '../../layouts/CoachAppLayout';
import SubCoachAssignmentModal from '../../components/coach/subcoach/SubCoachAssignmentModal';
import { Search, UserPlus, Users, BookOpen, Award, MoreVertical, Trash2, Eye } from 'lucide-react';

// Types
interface Course {
  id: string;
  title: string;
  code: string;
  enrolledStudents: number;
  status: 'published' | 'draft';
}

interface SubCoachAssignment {
  id: string;
  subCoachId: string;
  subCoachName: string;
  subCoachEmail: string;
  subCoachAvatar?: string;
  courseId: string;
  courseTitle: string;
  courseCode: string;
  assignedDate: string;
  requiredCourses: string[];
  studentsAssigned: number;
  assignedStudentIds?: string[];
  assignedStudentNames?: string[];
  status: 'active' | 'pending' | 'inactive';
}

// Dummy data for courses
const dummyCourses: Course[] = [
  { id: 'course-1', title: 'Programming Fundamentals', code: 'PROG1', enrolledStudents: 48, status: 'published' },
  { id: 'course-2', title: 'Advanced Programming', code: 'PROG2', enrolledStudents: 32, status: 'published' },
  { id: 'course-3', title: 'Data Structures', code: 'DS101', enrolledStudents: 28, status: 'published' },
  { id: 'course-4', title: 'Web Development Basics', code: 'WEB1', enrolledStudents: 56, status: 'published' },
  { id: 'course-5', title: 'Database Management', code: 'DB101', enrolledStudents: 24, status: 'published' },
  { id: 'course-6', title: 'UI Design Fundamentals', code: 'UI101', enrolledStudents: 42, status: 'published' },
  { id: 'course-7', title: 'JavaScript Mastery', code: 'JS201', enrolledStudents: 38, status: 'published' },
  { id: 'course-8', title: 'Python for Beginners', code: 'PY101', enrolledStudents: 52, status: 'published' },
];

// Dummy data for existing sub-coach assignments
const dummyAssignments: SubCoachAssignment[] = [
  {
    id: 'assign-1',
    subCoachId: 'stu-3',
    subCoachName: 'Sarah Johnson',
    subCoachEmail: 'sarah.j@email.com',
    courseId: 'course-1',
    courseTitle: 'Programming Fundamentals',
    courseCode: 'PROG1',
    assignedDate: 'Nov 15, 2025',
    requiredCourses: ['PROG1', 'PROG2'],
    studentsAssigned: 12,
    status: 'active',
  },
  {
    id: 'assign-2',
    subCoachId: 'stu-5',
    subCoachName: 'Lisa Anderson',
    subCoachEmail: 'lisa.a@email.com',
    courseId: 'course-4',
    courseTitle: 'Web Development Basics',
    courseCode: 'WEB1',
    assignedDate: 'Nov 20, 2025',
    requiredCourses: ['WEB1', 'JS201'],
    studentsAssigned: 8,
    status: 'active',
  },
  {
    id: 'assign-3',
    subCoachId: 'stu-6',
    subCoachName: 'James Rodriguez',
    subCoachEmail: 'james.r@email.com',
    courseId: 'course-2',
    courseTitle: 'Advanced Programming',
    courseCode: 'PROG2',
    assignedDate: 'Dec 1, 2025',
    requiredCourses: ['PROG1', 'PROG2', 'DS101'],
    studentsAssigned: 6,
    status: 'pending',
  },
];

const SubCoachManagement: React.FC = () => {
  const [assignments, setAssignments] = useState<SubCoachAssignment[]>(dummyAssignments);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending' | 'inactive'>('all');
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);

  // Filter assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const matchesSearch =
        searchQuery === '' ||
        assignment.subCoachName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.courseCode.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCourse = filterCourse === 'all' || assignment.courseId === filterCourse;
      const matchesStatus = filterStatus === 'all' || assignment.status === filterStatus;

      return matchesSearch && matchesCourse && matchesStatus;
    });
  }, [assignments, searchQuery, filterCourse, filterStatus]);

  // Stats
  const stats = useMemo(() => {
    return {
      totalSubCoaches: new Set(assignments.map((a) => a.subCoachId)).size,
      activeAssignments: assignments.filter((a) => a.status === 'active').length,
      pendingAssignments: assignments.filter((a) => a.status === 'pending').length,
      totalStudentsManaged: assignments.reduce((sum, a) => sum + a.studentsAssigned, 0),
    };
  }, [assignments]);

  const handleAssignSubCoach = (newAssignment: Omit<SubCoachAssignment, 'id'>) => {
    const assignment: SubCoachAssignment = {
      ...newAssignment,
      id: `assign-${Date.now()}`,
    };
    setAssignments([...assignments, assignment]);
    setShowAssignmentModal(false);
  };

  const handleRemoveAssignment = (assignmentId: string) => {
    if (confirm('Are you sure you want to remove this sub-coach assignment?')) {
      setAssignments(assignments.filter((a) => a.id !== assignmentId));
    }
    setShowActionsMenu(null);
  };

  const handleViewDetails = (assignment: SubCoachAssignment) => {
    setShowActionsMenu(null);
    // Could open a detail modal here
    const studentsList = assignment.assignedStudentNames?.length 
      ? `\n\nAssigned Students:\n${assignment.assignedStudentNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}`
      : '';
    alert(`Viewing details for ${assignment.subCoachName}\n\nAssigned to: ${assignment.courseTitle}\nRequired courses: ${assignment.requiredCourses.join(', ')}\nStudents assigned: ${assignment.studentsAssigned}${studentsList}`);
  };

  const getStatusBadge = (status: SubCoachAssignment['status']) => {
    switch (status) {
      case 'active':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">Active</span>;
      case 'pending':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">Pending</span>;
      case 'inactive':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600">Inactive</span>;
    }
  };

  return (
    <CoachAppLayout>
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Sub-Coach Management</h1>
              <p className="text-slate-600">Assign qualified students as sub-coaches for your courses</p>
            </div>
            <button
              onClick={() => setShowAssignmentModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all flex items-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Assign Sub-Coach
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-sm text-slate-600">Total Sub-Coaches</p>
              </div>
              <p className="text-3xl font-bold text-[#304DB5]">{stats.totalSubCoaches}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Award className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-sm text-slate-600">Active Assignments</p>
              </div>
              <p className="text-3xl font-bold text-green-600">{stats.activeAssignments}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-yellow-600" />
                </div>
                <p className="text-sm text-slate-600">Pending</p>
              </div>
              <p className="text-3xl font-bold text-yellow-600">{stats.pendingAssignments}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-sm text-slate-600">Students Managed</p>
              </div>
              <p className="text-3xl font-bold text-purple-600">{stats.totalStudentsManaged}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or course..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Course Filter */}
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">All Courses</option>
                {dummyCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.title}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Assignments Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                Sub-Coach Assignments ({filteredAssignments.length})
              </h2>
            </div>

            {filteredAssignments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Sub-Coach
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Assigned Course
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Required Courses
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Students
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Assigned Date
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredAssignments.map((assignment) => (
                      <tr key={assignment.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#304DB5] to-[#5E7BFF] flex items-center justify-center text-white font-semibold">
                              {assignment.subCoachName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{assignment.subCoachName}</p>
                              <p className="text-sm text-slate-500">{assignment.subCoachEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-slate-900">{assignment.courseCode}</p>
                            <p className="text-sm text-slate-500">{assignment.courseTitle}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {assignment.requiredCourses.map((course) => (
                              <span
                                key={course}
                                className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700"
                              >
                                {course}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-900">{assignment.studentsAssigned}</span>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(assignment.status)}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{assignment.assignedDate}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="relative">
                            <button
                              onClick={() => setShowActionsMenu(showActionsMenu === assignment.id ? null : assignment.id)}
                              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <MoreVertical className="w-5 h-5 text-slate-500" />
                            </button>

                            {showActionsMenu === assignment.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-10">
                                <button
                                  onClick={() => handleViewDetails(assignment)}
                                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  View Details
                                </button>
                                <button
                                  onClick={() => handleRemoveAssignment(assignment.id)}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Remove Assignment
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                  <Users className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No assignments found</h3>
                <p className="text-slate-600 mb-4">
                  {searchQuery || filterCourse !== 'all' || filterStatus !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Start by assigning your first sub-coach'}
                </p>
                {!searchQuery && filterCourse === 'all' && filterStatus === 'all' && (
                  <button
                    onClick={() => setShowAssignmentModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all"
                  >
                    Assign Sub-Coach
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <SubCoachAssignmentModal
          courses={dummyCourses}
          onClose={() => setShowAssignmentModal(false)}
          onAssign={handleAssignSubCoach}
        />
      )}
    </CoachAppLayout>
  );
};

export default SubCoachManagement;
