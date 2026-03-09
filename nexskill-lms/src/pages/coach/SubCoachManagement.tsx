import React, { useState, useEffect, useMemo } from 'react';
import CoachAppLayout from '../../layouts/CoachAppLayout';
import SubCoachAssignmentModal from '../../components/coach/subcoach/SubCoachAssignmentModal';
import { Search, UserPlus, Users, BookOpen, Award, MoreVertical, Trash2, Eye, ShieldCheck, Loader2 } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { supabase } from '../../lib/supabaseClient';
import GlassCard from '../../components/ui/GlassCard';
import NeonButton from '../../components/ui/NeonButton';

// Types
interface Course {
  id: string;
  title: string;
  enrolledStudents: number;
  status: 'published' | 'draft';
}

interface FormattedAssignment {
  id: string;
  subCoachName: string;
  subCoachEmail: string;
  courseTitle: string;
  assignedDate: string;
  status: 'active' | 'pending' | 'inactive';
  studentsCount: number;
}

const SubCoachManagement: React.FC = () => {
  const { profile } = useUser();
  const [assignments, setAssignments] = useState<FormattedAssignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending' | 'inactive'>('all');
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Data
  useEffect(() => {
    const fetchPageData = async () => {
      if (!profile) return;
      setIsLoading(true);
      try {
        // 1. Fetch Courses
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('id, title, visibility')
          .eq('coach_id', profile.id);

        if (coursesError) throw coursesError;

        // Mock enrollment count for courses or fetch aggregate
        // For now, simpler map
        const mappedCourses: Course[] = coursesData?.map((c: any) => ({
          id: c.id,
          title: c.title,
          status: c.visibility === 'public' ? 'published' : 'draft',
          enrolledStudents: 0
        })) || [];

        setCourses(mappedCourses);

        // 2. Fetch Assignments
        const { data: assignmentsData, error: assignError } = await supabase
          .from('sub_coach_assignments')
          .select(`
            id,
            coach_id,
            sub_coach_id,
            course_id,
            status,
            created_at,
            sub_coach_profile:profiles!sub_coach_assignments_sub_coach_id_fkey(first_name, last_name, email),
            course:courses!sub_coach_assignments_course_id_fkey(title)
          `)
          .eq('coach_id', profile.id);

        if (assignError) throw assignError;

        const formatted: FormattedAssignment[] = (assignmentsData as any)?.map((a: any) => ({
          id: a.id,
          subCoachName: `${a.sub_coach_profile?.first_name || ''} ${a.sub_coach_profile?.last_name || ''}`.trim() || 'Unknown',
          subCoachEmail: a.sub_coach_profile?.email || '',
          courseTitle: a.course?.title || 'Unknown Course',
          assignedDate: new Date(a.created_at).toLocaleDateString(),
          status: a.status,
          studentsCount: 0
        })) || [];

        setAssignments(formatted);

      } catch (err) {
        console.error("Error fetching sub-coach data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPageData();
  }, [profile]);

  // Actions
  const handleAssignSubCoach = async (newAssignmentData: any) => {
    try {
      // 1. Insert the main assignment
      const { data: assignment, error: assignError } = await supabase
        .from('sub_coach_assignments')
        .insert({
          coach_id: profile?.id,
          sub_coach_id: newAssignmentData.subCoachId,
          course_id: newAssignmentData.courseId,
          status: newAssignmentData.status || 'pending'
        })
        .select('id')
        .single();

      if (assignError) throw assignError;

      const assignmentId = assignment.id;

      // 2. Insert requirements (if any)
      if (newAssignmentData.requiredCourses && newAssignmentData.requiredCourses.length > 0) {
        const requirements = newAssignmentData.requiredCourses.map((courseId: string) => ({
          assignment_id: assignmentId,
          required_course_id: courseId
        }));

        const { error: reqError } = await supabase
          .from('sub_coach_requirements')
          .insert(requirements);

        if (reqError) {
          console.error('Error inserting requirements:', reqError);
          // Continue anyway - requirements are optional
        }
      }

      // 3. Insert student allocations
      if (newAssignmentData.assignedStudentIds && newAssignmentData.assignedStudentIds.length > 0) {
        const allocations = newAssignmentData.assignedStudentIds.map((studentId: string) => ({
          assignment_id: assignmentId,
          student_id: studentId
        }));

        const { error: allocError } = await supabase
          .from('sub_coach_student_allocations')
          .insert(allocations);

        if (allocError) throw allocError;
      }

      // Refresh the page to show new data
      window.location.reload();
    } catch (err) {
      console.error("Error creating assignment:", err);
      alert("Failed to assign sub-coach. Please try again.");
    }
    setShowAssignmentModal(false);
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (confirm('Are you sure you want to remove this sub-coach assignment?')) {
      try {
        const { error } = await supabase
          .from('sub_coach_assignments')
          .delete()
          .eq('id', assignmentId);

        if (error) throw error;

        setAssignments(prev => prev.filter(a => a.id !== assignmentId));
      } catch (err) {
        console.error("Error removing assignment:", err);
        alert("Failed to remove assignment.");
      }
    }
    setShowActionsMenu(null);
  };

  // Filter
  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const matchesSearch =
        searchQuery === '' ||
        assignment.subCoachName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.courseTitle.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = filterStatus === 'all' || assignment.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [assignments, searchQuery, filterStatus]);

  // Stats
  const stats = {
    totalSubCoaches: new Set(assignments.map((a) => a.subCoachEmail)).size,
    activeAssignments: assignments.filter((a) => a.status === 'active').length,
    pendingAssignments: assignments.filter((a) => a.status === 'pending').length,
    // totalStudentsManaged: assignments.reduce((sum, a) => sum + a.studentsCount, 0),
  };

  return (
    <CoachAppLayout>
      <div className="flex-1 overflow-y-auto space-y-8 p-8 bg-[var(--bg-primary)]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Sub-Coach Management</h1>
            <p className="text-gray-400">Assign qualified students as sub-coaches for your courses</p>
          </div>
          <NeonButton
            variant="primary"
            onClick={() => setShowAssignmentModal(true)}
            className="flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Assign Sub-Coach
          </NeonButton>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard className="p-6 flex items-center gap-4">
            <div className="p-4 rounded-full bg-blue-500/20 text-blue-400">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="text-3xl font-bold text-white">{stats.totalSubCoaches}</div>
              <div className="text-sm text-gray-400">Total Sub-Coaches</div>
            </div>
          </GlassCard>
          <GlassCard className="p-6 flex items-center gap-4">
            <div className="p-4 rounded-full bg-green-500/20 text-green-400">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <div className="text-3xl font-bold text-white">{stats.activeAssignments}</div>
              <div className="text-sm text-gray-400">Active Assignments</div>
            </div>
          </GlassCard>
          <GlassCard className="p-6 flex items-center gap-4">
            <div className="p-4 rounded-full bg-yellow-500/20 text-yellow-400">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <div className="text-3xl font-bold text-white">{stats.pendingAssignments}</div>
              <div className="text-sm text-gray-400">Pending Assignments</div>
            </div>
          </GlassCard>
        </div>

        {/* Filters & Table */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or course..."
                className="w-full pl-12 pr-4 py-3 bg-[var(--bg-secondary)] border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-electric focus:ring-1 focus:ring-brand-electric transition-colors"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-3 bg-[var(--bg-secondary)] border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-electric"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <GlassCard className="overflow-hidden min-h-[400px]">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center p-12 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin text-brand-electric mb-4" />
                <p>Loading assignments...</p>
              </div>
            ) : filteredAssignments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-12 text-gray-400">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 opacity-50" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No assignments found</h3>
                <p className="text-sm">Try adjusting filters or create a new assignment.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Sub-Coach</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Course</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Assigned Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredAssignments.map((assignment) => (
                      <tr key={assignment.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-electric to-brand-purple flex items-center justify-center text-white font-bold border border-white/10 text-sm">
                              {assignment.subCoachName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-white">{assignment.subCoachName}</div>
                              <div className="text-xs text-gray-500">{assignment.subCoachEmail}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-white">{assignment.courseTitle}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {assignment.assignedDate}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${assignment.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                            assignment.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                              'bg-gray-500/10 text-gray-400 border-gray-500/20'
                            }`}>
                            {assignment.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right relative">
                          <button
                            onClick={() => setShowActionsMenu(showActionsMenu === assignment.id ? null : assignment.id)}
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {showActionsMenu === assignment.id && (
                            <div className="absolute right-10 top-0 mt-2 w-48 bg-[#1a1f2e] border border-white/20 rounded-xl shadow-xl py-2 z-10">
                              <button className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/10 flex items-center gap-2">
                                <Eye className="w-4 h-4" /> View Details
                              </button>
                              <button
                                onClick={() => handleRemoveAssignment(assignment.id)}
                                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/10 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" /> Remove
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {showAssignmentModal && (
        <SubCoachAssignmentModal
          courses={courses}
          onClose={() => setShowAssignmentModal(false)}
          onAssign={handleAssignSubCoach}
        />
      )}
    </CoachAppLayout>
  );
};

export default SubCoachManagement;
