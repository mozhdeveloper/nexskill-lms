import React, { useState, useMemo } from 'react';
import { X, Search, Check, ChevronDown, User, BookOpen, Award } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  code: string;
  enrolledStudents: number;
  status: 'published' | 'draft';
}

interface Student {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  completedCourses: string[]; // Array of course codes
  enrollmentDate: string;
  overallProgress: number;
}

interface SubCoachAssignment {
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
  status: 'active' | 'pending' | 'inactive';
}

interface SubCoachAssignmentModalProps {
  courses: Course[];
  onClose: () => void;
  onAssign: (assignment: Omit<SubCoachAssignment, 'id'>) => void;
}

// Dummy students with completed courses
const dummyStudents: Student[] = [
  {
    id: 'stu-1',
    name: 'Alex Thompson',
    email: 'alex.t@email.com',
    completedCourses: ['PROG1', 'PROG2', 'DS101', 'WEB1'],
    enrollmentDate: 'Jan 2025',
    overallProgress: 92,
  },
  {
    id: 'stu-2',
    name: 'Maria Garcia',
    email: 'maria.g@email.com',
    completedCourses: ['PROG1', 'WEB1', 'UI101'],
    enrollmentDate: 'Feb 2025',
    overallProgress: 85,
  },
  {
    id: 'stu-3',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    completedCourses: ['PROG1', 'PROG2', 'WEB1', 'JS201', 'PY101'],
    enrollmentDate: 'Dec 2024',
    overallProgress: 95,
  },
  {
    id: 'stu-4',
    name: 'Michael Chen',
    email: 'michael.c@email.com',
    completedCourses: ['PROG1', 'DS101', 'DB101'],
    enrollmentDate: 'Mar 2025',
    overallProgress: 78,
  },
  {
    id: 'stu-5',
    name: 'Lisa Anderson',
    email: 'lisa.a@email.com',
    completedCourses: ['PROG1', 'PROG2', 'WEB1', 'JS201', 'UI101', 'PY101'],
    enrollmentDate: 'Nov 2024',
    overallProgress: 98,
  },
  {
    id: 'stu-6',
    name: 'James Rodriguez',
    email: 'james.r@email.com',
    completedCourses: ['PROG1', 'PROG2', 'DS101', 'DB101'],
    enrollmentDate: 'Jan 2025',
    overallProgress: 88,
  },
  {
    id: 'stu-7',
    name: 'Emily Davis',
    email: 'emily.d@email.com',
    completedCourses: ['WEB1', 'UI101'],
    enrollmentDate: 'Apr 2025',
    overallProgress: 65,
  },
  {
    id: 'stu-8',
    name: 'Robert Wilson',
    email: 'robert.w@email.com',
    completedCourses: ['PROG1', 'PY101'],
    enrollmentDate: 'May 2025',
    overallProgress: 45,
  },
];

const SubCoachAssignmentModal: React.FC<SubCoachAssignmentModalProps> = ({
  courses,
  onClose,
  onAssign,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [requiredCourses, setRequiredCourses] = useState<string[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [showRequiredDropdown, setShowRequiredDropdown] = useState(false);
  const [studentsToAssign, setStudentsToAssign] = useState<number>(5);

  // Available courses for prerequisite selection
  const availableCourses = courses.filter((c) => c.status === 'published');

  // Filter students who have completed ALL required courses
  const eligibleStudents = useMemo(() => {
    if (requiredCourses.length === 0) {
      return dummyStudents;
    }
    return dummyStudents.filter((student) =>
      requiredCourses.every((courseCode) => student.completedCourses.includes(courseCode))
    );
  }, [requiredCourses]);

  // Filtered students by search
  const filteredStudents = useMemo(() => {
    if (!studentSearchQuery) return eligibleStudents;
    return eligibleStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(studentSearchQuery.toLowerCase())
    );
  }, [eligibleStudents, studentSearchQuery]);

  // Filtered courses by search
  const filteredCourses = useMemo(() => {
    if (!courseSearchQuery) return availableCourses;
    return availableCourses.filter(
      (c) =>
        c.title.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(courseSearchQuery.toLowerCase())
    );
  }, [availableCourses, courseSearchQuery]);

  const toggleRequiredCourse = (courseCode: string) => {
    if (requiredCourses.includes(courseCode)) {
      setRequiredCourses(requiredCourses.filter((c) => c !== courseCode));
    } else {
      setRequiredCourses([...requiredCourses, courseCode]);
    }
  };

  const handleAssign = () => {
    if (!selectedCourse || !selectedStudent) return;

    onAssign({
      subCoachId: selectedStudent.id,
      subCoachName: selectedStudent.name,
      subCoachEmail: selectedStudent.email,
      subCoachAvatar: selectedStudent.avatar,
      courseId: selectedCourse.id,
      courseTitle: selectedCourse.title,
      courseCode: selectedCourse.code,
      assignedDate: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      requiredCourses,
      studentsAssigned: studentsToAssign,
      status: 'pending',
    });
  };

  const canProceedStep1 = selectedCourse !== null;
  const canProceedStep2 = requiredCourses.length > 0;
  const canAssign = selectedStudent !== null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Assign Sub-Coach</h2>
            <p className="text-slate-600 mt-1">Step {step} of 3</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-8 pt-4">
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full ${
                  s <= step ? 'bg-[#304DB5]' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {/* Step 1: Select Course */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#304DB5]" />
                Select Course for Sub-Coach
              </h3>
              <p className="text-slate-600 mb-6">
                Choose the course you want to assign a sub-coach to help with.
              </p>

              {/* Course Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowCourseDropdown(!showCourseDropdown)}
                  className="w-full px-4 py-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between hover:border-[#304DB5] transition-colors"
                >
                  {selectedCourse ? (
                    <div className="text-left">
                      <p className="font-medium text-slate-900">{selectedCourse.title}</p>
                      <p className="text-sm text-slate-500">
                        {selectedCourse.code} • {selectedCourse.enrolledStudents} students
                      </p>
                    </div>
                  ) : (
                    <span className="text-slate-500">Select a course...</span>
                  )}
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform ${
                      showCourseDropdown ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {showCourseDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-10 max-h-64 overflow-y-auto">
                    <div className="px-3 pb-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={courseSearchQuery}
                          onChange={(e) => setCourseSearchQuery(e.target.value)}
                          placeholder="Search courses..."
                          className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-lg border border-slate-200 focus:border-[#304DB5] focus:outline-none text-sm"
                        />
                      </div>
                    </div>
                    {filteredCourses.map((course) => (
                      <button
                        key={course.id}
                        onClick={() => {
                          setSelectedCourse(course);
                          setShowCourseDropdown(false);
                          setCourseSearchQuery('');
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between ${
                          selectedCourse?.id === course.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div>
                          <p className="font-medium text-slate-900">{course.title}</p>
                          <p className="text-sm text-slate-500">
                            {course.code} • {course.enrolledStudents} students
                          </p>
                        </div>
                        {selectedCourse?.id === course.id && (
                          <Check className="w-5 h-5 text-[#304DB5]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Set Requirements */}
          {step === 2 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-[#304DB5]" />
                Set Course Requirements
              </h3>
              <p className="text-slate-600 mb-6">
                Select the courses that a student must have completed to qualify as a sub-coach for{' '}
                <span className="font-semibold">{selectedCourse?.title}</span>.
              </p>

              {/* Required Courses Multi-Select */}
              <div className="relative">
                <button
                  onClick={() => setShowRequiredDropdown(!showRequiredDropdown)}
                  className="w-full px-4 py-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between hover:border-[#304DB5] transition-colors"
                >
                  <div className="flex-1">
                    {requiredCourses.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {requiredCourses.map((code) => (
                          <span
                            key={code}
                            className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-700"
                          >
                            {code}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500">Select required courses...</span>
                    )}
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ml-2 ${
                      showRequiredDropdown ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {showRequiredDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-10 max-h-64 overflow-y-auto">
                    {availableCourses.map((course) => (
                      <button
                        key={course.id}
                        onClick={() => toggleRequiredCourse(course.code)}
                        className={`w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between ${
                          requiredCourses.includes(course.code) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div>
                          <p className="font-medium text-slate-900">{course.title}</p>
                          <p className="text-sm text-slate-500">{course.code}</p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            requiredCourses.includes(course.code)
                              ? 'bg-[#304DB5] border-[#304DB5]'
                              : 'border-slate-300'
                          }`}
                        >
                          {requiredCourses.includes(course.code) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Show eligible count */}
              <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-[#304DB5]">{eligibleStudents.length}</span>{' '}
                  students meet these requirements
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Select Student */}
          {step === 3 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-[#304DB5]" />
                Select Eligible Student
              </h3>
              <p className="text-slate-600 mb-6">
                Choose a student who has completed all required courses:{' '}
                <span className="font-semibold">{requiredCourses.join(', ')}</span>
              </p>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  placeholder="Search students..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Students List */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        selectedStudent?.id === student.id
                          ? 'border-[#304DB5] bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#304DB5] to-[#5E7BFF] flex items-center justify-center text-white font-semibold text-lg">
                          {student.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">{student.name}</p>
                          <p className="text-sm text-slate-500">{student.email}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {student.completedCourses.map((code) => (
                              <span
                                key={code}
                                className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                  requiredCourses.includes(code)
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {code}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-[#304DB5]">{student.overallProgress}%</p>
                          <p className="text-xs text-slate-500">Progress</p>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-500">No students match the requirements</p>
                  </div>
                )}
              </div>

              {/* Students to Assign */}
              {selectedStudent && (
                <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Number of students to assign to this sub-coach:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={studentsToAssign}
                    onChange={(e) => setStudentsToAssign(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => {
              if (step === 1) {
                onClose();
              } else {
                setStep((step - 1) as 1 | 2 | 3);
              }
            }}
            className="px-6 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-full transition-colors"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep((step + 1) as 1 | 2 | 3)}
              disabled={(step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2)}
              className="px-6 py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleAssign}
              disabled={!canAssign}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Assign Sub-Coach
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubCoachAssignmentModal;
