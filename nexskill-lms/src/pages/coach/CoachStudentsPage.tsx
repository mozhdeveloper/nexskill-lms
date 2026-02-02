import React, { useState, useEffect } from 'react';
import CoachAppLayout from '../../layouts/CoachAppLayout';
import { Search, Download, Mail, BarChart3, TrendingUp, Award, Clock, Loader2, Users, UserCheck } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import GlassCard from '../../components/ui/GlassCard';
import NeonButton from '../../components/ui/NeonButton';
import SkillProgressBar from '../../components/ui/SkillProgressBar';

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
  const { profile } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'completed'>('all');
  const [sortBy] = useState<'name' | 'progress' | 'score' | 'lastActive'>('name');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);



  // Fetch students from Supabase
  useEffect(() => {
    const fetchStudents = async () => {
      if (!profile) return;

      setIsLoading(true);

      try {
        const { supabase } = await import('../../lib/supabaseClient');

        // 1. Get courses taught by this coach
        const { data: courses, error: coursesError } = await supabase
          .from('courses')
          .select('id, title')
          .eq('coach_id', profile.id);

        if (coursesError) {
          throw coursesError;
        }


        if (!courses || courses.length === 0) {
          setStudents([]);
          setIsLoading(false);
          return;
        }

        const courseIds = courses.map(c => c.id);

        // 2. Get Enrollments linked to these courses
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select(`
            profile_id,
            course_id,
            enrolled_at
          `)
          .in('course_id', courseIds);

        if (enrollmentsError) {
          throw enrollmentsError;
        }


        if (!enrollments || enrollments.length === 0) {
          setStudents([]);
          setIsLoading(false);
          return;
        }

        const studentIds = [...new Set(enrollments.map(e => e.profile_id))];

        // 3. Get Student Profiles
        const { data: studentProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name, updated_at')
          .in('id', studentIds);

        if (profilesError) {
          throw profilesError;
        }


        // 4. Map & Aggregate Data
        const mappedStudents: Student[] = studentProfiles?.map((profile: any) => {
          const studentEnrollments = enrollments.filter(e => e.profile_id === profile.id);

          // Note: enrollments table doesn't have progress column
          // TODO: Calculate real progress from user_module_progress table
          let avgProgress: number = 0; // Placeholder until we query user_module_progress

          // Mock Avg Score (Placeholder logic until quiz_attempts populated)
          const mockAvgScore = Math.min(100, Math.round(avgProgress * (0.8 + Math.random() * 0.4)));

          // Get earliest enrollment date for this student (as their "joined" date for this coach)
          const earliestEnrollment = studentEnrollments.reduce((earliest, e) => {
            const enrolledAt = new Date(e.enrolled_at);
            return !earliest || enrolledAt < earliest ? enrolledAt : earliest;
          }, null as Date | null);

          // Last Active Calculation - use profile updated_at
          const lastActiveDate = new Date(profile.updated_at || new Date());
          const now = new Date();
          const diffMs = now.getTime() - lastActiveDate.getTime();
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

          let lastActive = 'Just now';
          if (diffHours < 1) lastActive = 'Just now';
          else if (diffHours < 24) lastActive = `${diffHours}h ago`;
          else if (diffDays < 7) lastActive = `${diffDays}d ago`;
          else lastActive = lastActiveDate.toLocaleDateString();

          // Status Determination
          let computedStatus: 'active' | 'inactive' | 'completed' = 'inactive';
          if (avgProgress === 100) computedStatus = 'completed';
          else if (diffDays < 14) computedStatus = 'active';

          return {
            id: profile.id,
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
            email: profile.email,
            enrolledCourses: studentEnrollments.length,
            totalProgress: avgProgress,
            averageScore: mockAvgScore,
            lastActive,
            joinedDate: earliestEnrollment ? earliestEnrollment.toLocaleDateString() : 'N/A',
            status: computedStatus,
            totalTimeSpent: `${Math.floor(avgProgress * 0.5 + Math.random() * 10)}h`, // Mock
            certificatesEarned: 0, // TODO: Calculate from actual completion data
          };
        }) || [];

        setStudents(mappedStudents);
      } catch (error: any) {
        console.error('Error fetching students:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, [profile]);

  const handleExportStudents = () => {
    window.alert("Export feature coming soon");
  };

  const handleMessageStudent = (student: Student) => {
    window.alert(`Message to ${student.name}`);
  };

  const handleViewProgress = (student: Student) => {
    setSelectedStudent(student);
    setShowDetailModal(true);
  };

  const handleSendBulkEmail = () => {
    window.alert("Bulk email feature");
  };

  const handleExportReport = (student: Student) => {
    window.alert(`Exporting report for ${student.name}`);
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
        case 'name': return a.name.localeCompare(b.name);
        case 'progress': return b.totalProgress - a.totalProgress;
        case 'score': return b.averageScore - a.averageScore;
        case 'lastActive': return a.lastActive.localeCompare(b.lastActive);
        default: return 0;
      }
    });

  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'active').length;
  const avgProgress = students.length > 0 ? Math.round(students.reduce((sum, s) => sum + s.totalProgress, 0) / students.length) : 0;
  const avgScore = students.length > 0 ? Math.round(students.reduce((sum, s) => sum + s.averageScore, 0) / students.length) : 0;

  return (
    <CoachAppLayout>
      <div className="flex-1 overflow-y-auto space-y-8 p-8 bg-[var(--bg-primary)]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Students</h1>
            <p className="text-gray-400">Track progress and engagement for your enrolled students</p>
          </div>
          <div className="flex gap-3">
            <NeonButton
              variant="secondary"
              onClick={handleSendBulkEmail}
              className="flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Bulk Email
            </NeonButton>
            <NeonButton
              variant="primary"
              onClick={handleExportStudents}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </NeonButton>
          </div>
        </div>

        {/* Stats Grid using GlassCards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard className="p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users className="w-16 h-16 text-brand-electric" />
            </div>
            <div className="text-sm text-gray-400 mb-1">Total Students</div>
            <div className="text-3xl font-bold text-white mb-2">{isLoading ? '...' : totalStudents}</div>
            <div className="text-xs text-brand-neon flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +12% this month
            </div>
          </GlassCard>

          <GlassCard className="p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <UserCheck className="w-16 h-16 text-green-500" />
            </div>
            <div className="text-sm text-gray-400 mb-1">Active Students</div>
            <div className="text-3xl font-bold text-white mb-2">{isLoading ? '...' : activeStudents}</div>
            <div className="text-xs text-gray-400">
              {(activeStudents / (totalStudents || 1) * 100).toFixed(0)}% engagement rate
            </div>
          </GlassCard>

          <GlassCard className="p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <BarChart3 className="w-16 h-16 text-purple-500" />
            </div>
            <div className="text-sm text-gray-400 mb-1">Avg. Progress</div>
            <div className="text-3xl font-bold text-white mb-2">{isLoading ? '...' : avgProgress}%</div>
            <div className="w-full bg-gray-700 h-1 rounded-full mt-2">
              <div className="bg-purple-500 h-1 rounded-full" style={{ width: `${avgProgress}%` }}></div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Award className="w-16 h-16 text-yellow-500" />
            </div>
            <div className="text-sm text-gray-400 mb-1">Avg. Score</div>
            <div className="text-3xl font-bold text-white mb-2">{isLoading ? '...' : avgScore}%</div>
            <div className="text-xs text-yellow-500 flex items-center gap-1">
              Top 10% performance
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
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
              <option value="inactive">Inactive</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <GlassCard className="overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                <Loader2 className="w-8 h-8 animate-spin text-brand-electric mb-2" />
                <p>Loading student data...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <p>No students found matching your criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Progress</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Avg Score</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Last Active</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredStudents.map(student => (
                      <tr key={student.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-electric to-brand-purple flex items-center justify-center text-white font-bold border border-white/10 text-sm">
                              {student.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-white">{student.name}</div>
                              <div className="text-xs text-gray-500">{student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-32">
                            <SkillProgressBar progress={student.totalProgress} showPercentage={true} />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-mono font-medium ${student.averageScore > 80 ? 'text-green-400' :
                            student.averageScore > 60 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                            {student.averageScore}%
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${student.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                            student.status === 'completed' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                              'bg-gray-500/10 text-gray-400 border-gray-500/20'
                            }`}>
                            {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {student.lastActive}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleMessageStudent(student)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Message">
                              <Mail className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleViewProgress(student)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="View Details">
                              <BarChart3 className="w-4 h-4" />
                            </button>
                          </div>
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
                    className={`px-3 py-1 rounded-full text-xs font-medium ${selectedStudent.status === 'active'
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
                    if (selectedStudent) handleMessageStudent(selectedStudent);
                    setShowDetailModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Send Message
                </button>
                <button
                  onClick={() => {
                    if (selectedStudent) handleExportReport(selectedStudent);
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
