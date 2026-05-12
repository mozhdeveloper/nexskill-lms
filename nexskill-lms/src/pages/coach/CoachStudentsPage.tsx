import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CoachAppLayout from '../../layouts/CoachAppLayout';
import { Search, Download, Mail, BarChart3, TrendingUp, Award, Clock, Loader2, Users, UserCheck, X, BookOpen, ChevronRight } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { supabase } from '../../lib/supabaseClient';
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
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'completed'>('all');
  const [sortBy] = useState<'name' | 'progress' | 'score' | 'lastActive'>('name');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!profile) return;
      setIsLoading(true);
      try {
        const { data: courses } = await supabase.from('courses').select('id, title').eq('coach_id', profile.id);
        if (!courses || courses.length === 0) { setStudents([]); setIsLoading(false); return; }
        const courseIds = courses.map(c => c.id);
        const { data: enrollments } = await supabase.from('enrollments').select('profile_id, course_id, enrolled_at').in('course_id', courseIds);
        if (!enrollments || enrollments.length === 0) { setStudents([]); setIsLoading(false); return; }
        const studentIds = [...new Set(enrollments.map(e => e.profile_id))];
        const { data: studentProfiles } = await supabase.from('profiles').select('id, email, first_name, last_name, updated_at').in('id', studentIds);
        
        const { data: modules } = await supabase.from('modules').select('id, course_id').in('course_id', courseIds);
        const moduleIds = (modules || []).map(m => m.id);
        let lessonIds: string[] = [];
        let lessonContentItems: { content_id: string; module_id: string }[] = [];
        if (moduleIds.length > 0) {
          const { data: contentItems } = await supabase.from('module_content_items').select('content_id, module_id').in('module_id', moduleIds).eq('content_type', 'lesson');
          lessonContentItems = contentItems || [];
          lessonIds = lessonContentItems.map(ci => ci.content_id);
        }

        const moduleIdToCourseId: Record<string, string> = {};
        (modules || []).forEach((m: any) => { moduleIdToCourseId[m.id] = m.course_id; });
        const lessonsByCourse: Record<string, Set<string>> = {};
        for (const ci of lessonContentItems) {
          const cid = moduleIdToCourseId[ci.module_id];
          if (!cid) continue;
          if (!lessonsByCourse[cid]) lessonsByCourse[cid] = new Set();
          lessonsByCourse[cid].add(ci.content_id);
        }

        let progressRows: any[] = [];
        if (lessonIds.length > 0 && studentIds.length > 0) {
          const { data } = await supabase.from('user_lesson_progress').select('user_id, lesson_id, is_completed, time_spent_seconds').in('user_id', studentIds).in('lesson_id', lessonIds);
          progressRows = data || [];
        }

        let attemptRows: any[] = [];
        if (studentIds.length > 0) {
          let quizIds: string[] = [];
          if (moduleIds.length > 0) {
            const { data: quizItems } = await supabase.from('module_content_items').select('content_id').in('module_id', moduleIds).eq('content_type', 'quiz');
            quizIds = (quizItems || []).map(qi => qi.content_id);
          }
          if (quizIds.length > 0) {
            const { data } = await supabase.from('quiz_attempts').select('user_id, score, max_score').in('user_id', studentIds).in('quiz_id', quizIds).in('status', ['submitted', 'graded']);
            attemptRows = data || [];
          }
        }

        const totalLessonsCount = lessonIds.length;
        const progressByStudent: Record<string, { completed: number; timeSeconds: number; completedLessons: Set<string> }> = {};
        for (const row of progressRows) {
          if (!progressByStudent[row.user_id]) progressByStudent[row.user_id] = { completed: 0, timeSeconds: 0, completedLessons: new Set() };
          if (row.is_completed) { progressByStudent[row.user_id].completed++; progressByStudent[row.user_id].completedLessons.add(row.lesson_id); }
          progressByStudent[row.user_id].timeSeconds += (row.time_spent_seconds || 0);
        }

        const scoresByStudent: Record<string, { totalPct: number; count: number }> = {};
        for (const row of attemptRows) {
          if (!scoresByStudent[row.user_id]) scoresByStudent[row.user_id] = { totalPct: 0, count: 0 };
          if (row.max_score > 0) { scoresByStudent[row.user_id].totalPct += (row.score / row.max_score) * 100; scoresByStudent[row.user_id].count++; }
        }

        const mappedStudents: Student[] = studentProfiles?.map((profile: any) => {
          const studentEnrollments = (enrollments || []).filter(e => e.profile_id === profile.id);
          const sp = progressByStudent[profile.id];
          const avgProgress = totalLessonsCount > 0 && sp ? Math.round((sp.completed / totalLessonsCount) * 100) : 0;
          const sq = scoresByStudent[profile.id];
          const avgScoreVal = sq && sq.count > 0 ? Math.round(sq.totalPct / sq.count) : 0;
          const earliestEnrollment = studentEnrollments.reduce((earliest, e) => {
            const enrolledAt = new Date(e.enrolled_at);
            return !earliest || enrolledAt < earliest ? enrolledAt : earliest;
          }, null as Date | null);

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

          let computedStatus: 'active' | 'inactive' | 'completed' = 'inactive';
          if (avgProgress === 100) computedStatus = 'completed';
          else if (diffDays < 14) computedStatus = 'active';

          return {
            id: profile.id,
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
            email: profile.email,
            enrolledCourses: studentEnrollments.length,
            totalProgress: avgProgress,
            averageScore: avgScoreVal,
            lastActive,
            joinedDate: earliestEnrollment ? earliestEnrollment.toLocaleDateString() : 'N/A',
            status: computedStatus,
            totalTimeSpent: sp ? `${Math.round(sp.timeSeconds / 3600)}h` : '0h',
            certificatesEarned: sp ? Object.entries(lessonsByCourse).filter(([, lessons]) => {
              if (lessons.size === 0) return false;
              for (const lid of lessons) if (!sp.completedLessons.has(lid)) return false;
              return true;
            }).length : 0,
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
    if (filteredStudents.length === 0) return;
    const headers = ['Name', 'Email', 'Enrolled Courses', 'Progress %', 'Avg Score %', 'Status', 'Last Active', 'Joined', 'Time Spent'];
    const rows = filteredStudents.map(s => [s.name, s.email, s.enrolledCourses, s.totalProgress, s.averageScore, s.status, s.lastActive, s.joinedDate, s.totalTimeSpent]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleMessageStudent = (_student: Student) => navigate('/coach/messages');
  const handleViewProgress = (student: Student) => { setSelectedStudent(student); setShowDetailModal(true); };
  const handleSendBulkEmail = () => navigate('/coach/messages');
  const handleExportReport = (student: Student) => {
    const headers = ['Name', 'Email', 'Enrolled Courses', 'Progress %', 'Avg Score %', 'Status', 'Last Active', 'Joined', 'Time Spent'];
    const row = [student.name, student.email, student.enrolledCourses, student.totalProgress, student.averageScore, student.status, student.lastActive, student.joinedDate, student.totalTimeSpent];
    const csv = [headers.join(','), row.map(v => `"${v}"`).join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_report_${student.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredStudents = students
    .filter(student => (student.name.toLowerCase().includes(searchQuery.toLowerCase()) || student.email.toLowerCase().includes(searchQuery.toLowerCase())) && (filterStatus === 'all' || student.status === filterStatus))
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'progress': return b.totalProgress - a.totalProgress;
        case 'score': return b.averageScore - a.averageScore;
        case 'lastActive': return a.lastActive.localeCompare(b.lastActive);
        default: return 0;
      }
    });
const avgProgress = students.length > 0 ? Math.round(students.reduce((sum, s) => sum + s.totalProgress, 0) / students.length) : 0;
const avgScore = students.length > 0 ? Math.round(students.reduce((sum, s) => sum + s.averageScore, 0) / students.length) : 0;

return (
    <CoachAppLayout>
      <div className="flex-1 overflow-y-auto bg-slate-50 min-h-screen text-slate-900">
        <div className="max-w-[1600px] mx-auto p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Student Directory</h1>
              <p className="text-slate-500 text-lg">Manage and monitor the performance of all students enrolled in your programs.</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleSendBulkEmail}
                className="px-5 py-2.5 bg-white text-slate-700 font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
              >
                <Mail className="w-4 h-4" /> Bulk Email
              </button>
              <NeonButton 
                variant="primary" 
                onClick={handleExportStudents} 
                className="flex items-center gap-2 px-6 py-2.5 shadow-md"
              >
                <Download className="w-4 h-4" /> Export CSV
              </NeonButton>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Students', value: isLoading ? '...' : students.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Active Learners', value: isLoading ? '...' : students.filter(s => s.status === 'active').length, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Avg. Progress', value: `${isLoading ? '...' : avgProgress}%`, icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Avg. Test Score', value: `${isLoading ? '...' : avgScore}%`, icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' }
            ].map((stat, i) => (
              <div key={i} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.label}</div>
                    <div className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg w-fit">
                  <TrendingUp className="w-3 h-3" /> +12% this month
                </div>
              </div>
            ))}
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
              />
            </div>
            <div className="flex gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium focus:border-blue-500 outline-none cursor-pointer min-w-[160px] shadow-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {isLoading ? (
              <div className="p-24 text-center flex flex-col items-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                <p className="text-lg font-medium text-slate-500">Loading directory...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-24 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                <p className="text-xl font-semibold text-slate-900">No students matching criteria</p>
                <p className="text-slate-500 mt-1 text-lg">Try adjusting your search or filter settings.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student Profile</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Course Progress</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg. Grade</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Active</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map(student => (
                      <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                              {student.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900">{student.name}</div>
                              <div className="text-xs text-slate-500 font-medium">{student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                              <div className="bg-blue-600 h-full rounded-full" style={{ width: `${student.totalProgress}%` }} />
                            </div>
                            <span className="text-xs font-bold text-slate-700">{student.totalProgress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 font-mono text-sm font-bold">
                          <span className={student.averageScore >= 80 ? 'text-emerald-600' : student.averageScore >= 60 ? 'text-amber-600' : 'text-rose-600'}>
                            {student.averageScore}%
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            student.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            student.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full mr-2 ${student.status === 'active' ? 'bg-emerald-500' : student.status === 'completed' ? 'bg-blue-500' : 'bg-slate-400'}`} />
                            {student.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-xs text-slate-500 font-bold">
                          {student.lastActive}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleMessageStudent(student)} 
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Message Student"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleViewProgress(student)} 
                              className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                              title="View Details"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal - Professional Light Design */}
      {showDetailModal && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="max-w-3xl w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200">
            <div className="p-8 border-b border-slate-100 bg-slate-50 relative">
              <button 
                onClick={() => setShowDetailModal(false)} 
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all shadow-sm"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-3xl shadow-lg">
                  {selectedStudent.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1 leading-tight">{selectedStudent.name}</h2>
                  <p className="text-slate-500 text-lg font-medium mb-3">{selectedStudent.email}</p>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-100 uppercase tracking-widest">
                      {selectedStudent.status}
                    </span>
                    <span className="px-3 py-1 bg-white text-slate-500 text-[10px] font-bold rounded-lg border border-slate-200 flex items-center gap-1.5 uppercase tracking-widest">
                      <Clock className="w-3 h-3" /> Joined {selectedStudent.joinedDate}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-10 space-y-10">
              {/* Performance Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { label: 'Progress', value: `${selectedStudent.totalProgress}%`, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Avg Grade', value: `${selectedStudent.averageScore}%`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Total Time', value: selectedStudent.totalTimeSpent, color: 'text-purple-600', bg: 'bg-purple-50' }
                ].map((item, i) => (
                  <div key={i} className={`p-6 rounded-2xl border border-slate-100 ${item.bg}`}>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">{item.label}</div>
                    <div className={`text-4xl font-bold ${item.color} tracking-tighter`}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Data Rows */}
              <div className="space-y-4">
                <div className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3 text-slate-700 font-bold">
                    <BookOpen className="w-5 h-5 text-blue-600" /> Course Enrollments
                  </div>
                  <span className="text-xl font-bold text-slate-900">{selectedStudent.enrolledCourses} Courses</span>
                </div>
                <div className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3 text-slate-700 font-bold">
                    <Award className="w-5 h-5 text-amber-600" /> Certificates Issued
                  </div>
                  <span className="text-xl font-bold text-slate-900">{selectedStudent.certificatesEarned} Issued</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button 
                  onClick={() => { handleMessageStudent(selectedStudent); setShowDetailModal(false); }} 
                  className="flex-1 py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-blue-600 transition-all shadow-lg shadow-blue-900/10"
                >
                  <Mail className="w-5 h-5 mr-2 inline-block" /> Send Message
                </button>
                <button 
                  onClick={() => { handleExportReport(selectedStudent); setShowDetailModal(false); }} 
                  className="flex-1 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Download className="w-5 h-5" /> Download Report
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
