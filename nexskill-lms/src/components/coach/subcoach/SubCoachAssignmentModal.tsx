import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, Check, ChevronDown, User, BookOpen, Award, Users, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useUser } from '../../../context/UserContext';

interface Course {
  id: string;
  title: string;
  enrolledStudents: number;
  status: 'published' | 'draft';
}

interface EligibleStudent {
  id: string;
  name: string;
  email: string;
  completedCourseIds: string[];
  enrollmentDate: string;
  overallProgress: number;
}

interface EnrolledStudent {
  id: string;
  name: string;
  email: string;
  enrollmentDate: string;
  progress: number;
}

interface SubCoachAssignmentModalProps {
  courses: Course[];
  onClose: () => void;
  onAssign: (assignment: any) => void;
}

const SubCoachAssignmentModal: React.FC<SubCoachAssignmentModalProps> = ({
  courses,
  onClose,
  onAssign,
}) => {
  const { profile } = useUser();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Selected course
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Step 2: Required courses (optional)
  const [requiredCourseIds, setRequiredCourseIds] = useState<string[]>([]);

  // Step 3: Eligible students & selected sub-coach
  const [eligibleStudents, setEligibleStudents] = useState<EligibleStudent[]>([]);
  const [selectedSubCoach, setSelectedSubCoach] = useState<EligibleStudent | null>(null);
  const [loadingEligible, setLoadingEligible] = useState(false);

  // Step 4: Enrolled students in selected course
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [loadingEnrolled, setLoadingEnrolled] = useState(false);

  // UI state
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [enrolledSearchQuery, setEnrolledSearchQuery] = useState('');
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [showRequiredDropdown, setShowRequiredDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available courses for selection (only published)
  const availableCourses = courses.filter((c) => c.status === 'published');

  // Filtered courses by search
  const filteredCourses = useMemo(() => {
    if (!courseSearchQuery) return availableCourses;
    return availableCourses.filter(
      (c) =>
        c.title.toLowerCase().includes(courseSearchQuery.toLowerCase())
    );
  }, [availableCourses, courseSearchQuery]);

  // Courses available as prerequisites (exclude the selected course)
  const prerequisiteCourses = useMemo(() => {
    return availableCourses.filter((c) => c.id !== selectedCourse?.id);
  }, [availableCourses, selectedCourse]);

  // Toggle a course as required
  const toggleRequiredCourse = (courseId: string) => {
    if (requiredCourseIds.includes(courseId)) {
      setRequiredCourseIds(requiredCourseIds.filter((id) => id !== courseId));
    } else {
      setRequiredCourseIds([...requiredCourseIds, courseId]);
    }
  };

  // Step 3: Fetch students who can be sub-coaches
  useEffect(() => {
    const fetchEligibleStudents = async () => {
      if (step !== 3 || !profile) return;

      setLoadingEligible(true);
      setError(null);

      try {
        // Get all students enrolled in ANY of the coach's courses
        const courseIds = courses.map((c) => c.id);

        const { data: enrollments, error: enrollError } = await supabase
          .from('enrollments')
          .select('profile_id, course_id, enrolled_at')
          .in('course_id', courseIds);

        if (enrollError) throw enrollError;

        if (!enrollments || enrollments.length === 0) {
          setEligibleStudents([]);
          setLoadingEligible(false);
          return;
        }

        // Get unique student IDs
        const studentIds = [...new Set(enrollments.map((e) => e.profile_id))];

        // Fetch student profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name')
          .in('id', studentIds)
          .eq('role', 'student');

        if (profilesError) throw profilesError;

        // If requirements are set, filter by course completion
        let qualifiedStudentIds = studentIds;

        if (requiredCourseIds.length > 0) {
          // Get module progress for required courses
          const { data: progressData, error: progressError } = await supabase
            .from('user_module_progress')
            .select('user_id, module_id, completion_percentage')
            .in('user_id', studentIds);

          if (progressError) throw progressError;

          // Get modules for required courses
          const { data: modules, error: modulesError } = await supabase
            .from('modules')
            .select('id, course_id')
            .in('course_id', requiredCourseIds);

          if (modulesError) throw modulesError;

          // For each required course, check if all modules are 100% complete
          qualifiedStudentIds = studentIds.filter((studentId) => {
            return requiredCourseIds.every((courseId) => {
              const courseModules = modules?.filter((m) => m.course_id === courseId) || [];
              if (courseModules.length === 0) return true; // No modules = course complete

              return courseModules.every((module) => {
                const progress = progressData?.find(
                  (p) => p.user_id === studentId && p.module_id === module.id
                );
                return progress && progress.completion_percentage === 100;
              });
            });
          });
        }

        // Map to eligible students format
        const eligible: EligibleStudent[] = (profiles || [])
          .filter((p) => qualifiedStudentIds.includes(p.id))
          .map((p) => {
            const studentEnrollments = enrollments.filter((e) => e.profile_id === p.id);
            const earliestEnrollment = studentEnrollments.reduce((earliest, e) => {
              const date = new Date(e.enrolled_at);
              return !earliest || date < earliest ? date : earliest;
            }, null as Date | null);

            return {
              id: p.id,
              name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email,
              email: p.email,
              completedCourseIds: requiredCourseIds, // Simplified - they qualify
              enrollmentDate: earliestEnrollment?.toLocaleDateString() || 'N/A',
              overallProgress: 100, // Placeholder
            };
          });

        setEligibleStudents(eligible);
      } catch (err: any) {
        console.error('Error fetching eligible students:', err);
        setError(err.message || 'Failed to load eligible students');
      } finally {
        setLoadingEligible(false);
      }
    };

    fetchEligibleStudents();
  }, [step, profile, courses, requiredCourseIds]);

  // Step 4: Fetch students enrolled in the selected course
  useEffect(() => {
    const fetchEnrolledStudents = async () => {
      if (step !== 4 || !selectedCourse) return;

      setLoadingEnrolled(true);
      setError(null);

      try {
        // Get enrollments for the selected course
        const { data: enrollments, error: enrollError } = await supabase
          .from('enrollments')
          .select('profile_id, enrolled_at')
          .eq('course_id', selectedCourse.id);

        if (enrollError) throw enrollError;

        if (!enrollments || enrollments.length === 0) {
          setEnrolledStudents([]);
          setLoadingEnrolled(false);
          return;
        }

        const studentIds = enrollments.map((e) => e.profile_id);

        // Exclude the selected sub-coach from the list
        const filteredIds = studentIds.filter((id) => id !== selectedSubCoach?.id);

        if (filteredIds.length === 0) {
          setEnrolledStudents([]);
          setLoadingEnrolled(false);
          return;
        }

        // Fetch student profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name')
          .in('id', filteredIds);

        if (profilesError) throw profilesError;

        // Get module progress for the selected course
        const { data: modules } = await supabase
          .from('modules')
          .select('id')
          .eq('course_id', selectedCourse.id);

        const moduleIds = modules?.map((m) => m.id) || [];

        let progressMap: Record<string, number> = {};

        if (moduleIds.length > 0) {
          const { data: progressData } = await supabase
            .from('user_module_progress')
            .select('user_id, completion_percentage')
            .in('user_id', filteredIds)
            .in('module_id', moduleIds);

          // Calculate average progress per student
          filteredIds.forEach((studentId) => {
            const studentProgress = progressData?.filter((p) => p.user_id === studentId) || [];
            if (studentProgress.length > 0) {
              const avg = studentProgress.reduce((sum, p) => sum + (p.completion_percentage || 0), 0) / moduleIds.length;
              progressMap[studentId] = Math.round(avg);
            } else {
              progressMap[studentId] = 0;
            }
          });
        }

        // Map to enrolled students format
        const enrolled: EnrolledStudent[] = (profiles || []).map((p) => {
          const enrollment = enrollments.find((e) => e.profile_id === p.id);
          return {
            id: p.id,
            name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email,
            email: p.email,
            enrollmentDate: enrollment ? new Date(enrollment.enrolled_at).toLocaleDateString() : 'N/A',
            progress: progressMap[p.id] || 0,
          };
        });

        setEnrolledStudents(enrolled);
      } catch (err: any) {
        console.error('Error fetching enrolled students:', err);
        setError(err.message || 'Failed to load enrolled students');
      } finally {
        setLoadingEnrolled(false);
      }
    };

    fetchEnrolledStudents();
  }, [step, selectedCourse, selectedSubCoach]);

  // Filtered students by search
  const filteredEligibleStudents = useMemo(() => {
    if (!studentSearchQuery) return eligibleStudents;
    return eligibleStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(studentSearchQuery.toLowerCase())
    );
  }, [eligibleStudents, studentSearchQuery]);

  const filteredEnrolledStudents = useMemo(() => {
    if (!enrolledSearchQuery) return enrolledStudents;
    return enrolledStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(enrolledSearchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(enrolledSearchQuery.toLowerCase())
    );
  }, [enrolledStudents, enrolledSearchQuery]);

  // Handle final assignment
  const handleAssign = () => {
    if (!selectedCourse || !selectedSubCoach || selectedStudentIds.length === 0) return;

    const assignedStudentNames = enrolledStudents
      .filter((s) => selectedStudentIds.includes(s.id))
      .map((s) => s.name);

    onAssign({
      subCoachId: selectedSubCoach.id,
      subCoachName: selectedSubCoach.name,
      subCoachEmail: selectedSubCoach.email,
      courseId: selectedCourse.id,
      courseTitle: selectedCourse.title,
      assignedDate: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      requiredCourses: requiredCourseIds,
      studentsAssigned: selectedStudentIds.length,
      assignedStudentIds: selectedStudentIds,
      assignedStudentNames,
      status: 'pending',
    });
  };

  const canProceedStep1 = selectedCourse !== null;
  const canProceedStep2 = true; // Requirements are optional
  const canProceedStep3 = selectedSubCoach !== null;
  const canAssign = selectedStudentIds.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Assign Sub-Coach</h2>
            <p className="text-slate-600 mt-1">Step {step} of 4</p>
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
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full ${s <= step ? 'bg-[#304DB5]' : 'bg-slate-200'
                  }`}
              />
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-8 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

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
                        {selectedCourse.enrolledStudents} students
                      </p>
                    </div>
                  ) : (
                    <span className="text-slate-500">Select a course...</span>
                  )}
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform ${showCourseDropdown ? 'rotate-180' : ''
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
                    {filteredCourses.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-slate-500">No courses found</div>
                    ) : (
                      filteredCourses.map((course) => (
                        <button
                          key={course.id}
                          onClick={() => {
                            setSelectedCourse(course);
                            setShowCourseDropdown(false);
                            setCourseSearchQuery('');
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between ${selectedCourse?.id === course.id ? 'bg-blue-50' : ''
                            }`}
                        >
                          <div>
                            <p className="font-medium text-slate-900">{course.title}</p>
                            <p className="text-sm text-slate-500">
                              {course.enrolledStudents} students
                            </p>
                          </div>
                          {selectedCourse?.id === course.id && (
                            <Check className="w-5 h-5 text-[#304DB5]" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Set Requirements (Optional) */}
          {step === 2 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-[#304DB5]" />
                Set Course Requirements
                <span className="text-sm font-normal text-slate-400">(Optional)</span>
              </h3>
              <p className="text-slate-600 mb-6">
                Optionally select courses that a student must have completed to qualify as a sub-coach for{' '}
                <span className="font-semibold">{selectedCourse?.title}</span>. Skip this step to allow any enrolled student.
              </p>

              {/* Required Courses Multi-Select */}
              <div className="relative">
                <button
                  onClick={() => setShowRequiredDropdown(!showRequiredDropdown)}
                  className="w-full px-4 py-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between hover:border-[#304DB5] transition-colors"
                >
                  <div className="flex-1">
                    {requiredCourseIds.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {requiredCourseIds.map((id) => {
                          const course = availableCourses.find((c) => c.id === id);
                          return (
                            <span
                              key={id}
                              className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-700"
                            >
                              {course?.title || id}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-slate-500">No requirements (any student can be sub-coach)</span>
                    )}
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ml-2 ${showRequiredDropdown ? 'rotate-180' : ''
                      }`}
                  />
                </button>

                {showRequiredDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-10 max-h-64 overflow-y-auto">
                    {prerequisiteCourses.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-slate-500">No other courses available</div>
                    ) : (
                      prerequisiteCourses.map((course) => (
                        <button
                          key={course.id}
                          onClick={() => toggleRequiredCourse(course.id)}
                          className={`w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between ${requiredCourseIds.includes(course.id) ? 'bg-blue-50' : ''
                            }`}
                        >
                          <div>
                            <p className="font-medium text-slate-900">{course.title}</p>
                            <p className="text-sm text-slate-500">{course.title}</p>
                          </div>
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${requiredCourseIds.includes(course.id)
                                ? 'bg-[#304DB5] border-[#304DB5]'
                                : 'border-slate-300'
                              }`}
                          >
                            {requiredCourseIds.includes(course.id) && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Info message */}
              <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-600">
                  {requiredCourseIds.length === 0 ? (
                    <>All enrolled students in your courses can be selected as sub-coaches.</>
                  ) : (
                    <>Only students who completed all selected courses will be eligible.</>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Select Sub-Coach */}
          {step === 3 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-[#304DB5]" />
                Select Sub-Coach
              </h3>
              <p className="text-slate-600 mb-6">
                {requiredCourseIds.length > 0 ? (
                  <>Choose a student who has completed all required courses.</>
                ) : (
                  <>Choose a student to be the sub-coach for this course.</>
                )}
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
                {loadingEligible ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-[#304DB5]" />
                    <span className="ml-2 text-slate-500">Loading students...</span>
                  </div>
                ) : filteredEligibleStudents.length > 0 ? (
                  filteredEligibleStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => setSelectedSubCoach(student)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${selectedSubCoach?.id === student.id
                          ? 'border-[#304DB5] bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#304DB5] to-[#5E7BFF] flex items-center justify-center text-white font-semibold text-lg">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">{student.name}</p>
                          <p className="text-sm text-slate-500">{student.email}</p>
                          <p className="text-xs text-slate-400 mt-1">Enrolled: {student.enrollmentDate}</p>
                        </div>
                        {selectedSubCoach?.id === student.id && (
                          <Check className="w-6 h-6 text-[#304DB5]" />
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-500">
                      {requiredCourseIds.length > 0
                        ? 'No students have completed all required courses'
                        : 'No students found in your courses'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Select Students to Manage */}
          {step === 4 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#304DB5]" />
                Select Students to Assign
              </h3>
              <p className="text-slate-600 mb-6">
                Choose which students enrolled in{' '}
                <span className="font-semibold">{selectedCourse?.title}</span> will be managed by{' '}
                <span className="font-semibold">{selectedSubCoach?.name}</span>.
              </p>

              {/* Search and Select All */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={enrolledSearchQuery}
                    onChange={(e) => setEnrolledSearchQuery(e.target.value)}
                    placeholder="Search enrolled students..."
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <button
                  onClick={() => {
                    if (selectedStudentIds.length === filteredEnrolledStudents.length) {
                      setSelectedStudentIds([]);
                    } else {
                      setSelectedStudentIds(filteredEnrolledStudents.map((s) => s.id));
                    }
                  }}
                  className="px-4 py-3 text-sm font-medium text-[#304DB5] hover:bg-blue-50 rounded-xl transition-colors whitespace-nowrap"
                >
                  {selectedStudentIds.length === filteredEnrolledStudents.length
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
              </div>

              {/* Selected Count */}
              <div className="mb-4 p-3 bg-blue-50 rounded-xl flex items-center justify-between">
                <span className="text-sm text-slate-600">
                  <span className="font-semibold text-[#304DB5]">{selectedStudentIds.length}</span> of{' '}
                  {enrolledStudents.length} students selected
                </span>
                {selectedStudentIds.length > 0 && (
                  <button
                    onClick={() => setSelectedStudentIds([])}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear Selection
                  </button>
                )}
              </div>

              {/* Students List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {loadingEnrolled ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-[#304DB5]" />
                    <span className="ml-2 text-slate-500">Loading enrolled students...</span>
                  </div>
                ) : filteredEnrolledStudents.length > 0 ? (
                  filteredEnrolledStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => {
                        if (selectedStudentIds.includes(student.id)) {
                          setSelectedStudentIds(selectedStudentIds.filter((id) => id !== student.id));
                        } else {
                          setSelectedStudentIds([...selectedStudentIds, student.id]);
                        }
                      }}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${selectedStudentIds.includes(student.id)
                          ? 'border-[#304DB5] bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${selectedStudentIds.includes(student.id)
                              ? 'bg-[#304DB5] border-[#304DB5]'
                              : 'border-slate-300'
                            }`}
                        >
                          {selectedStudentIds.includes(student.id) && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white font-semibold">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{student.name}</p>
                          <p className="text-sm text-slate-500 truncate">{student.email}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-bold text-slate-700">{student.progress}%</p>
                          <p className="text-xs text-slate-500">Progress</p>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-500">No students enrolled in this course</p>
                  </div>
                )}
              </div>
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
                setStep((step - 1) as 1 | 2 | 3 | 4);
              }
            }}
            className="px-6 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-full transition-colors"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep((step + 1) as 1 | 2 | 3 | 4)}
              disabled={
                (step === 1 && !canProceedStep1) ||
                (step === 2 && !canProceedStep2) ||
                (step === 3 && !canProceedStep3)
              }
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
