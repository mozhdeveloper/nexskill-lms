import React, { useState, useEffect } from 'react';
import AdminAppLayout from '../../layouts/AdminAppLayout';
import CourseModerationFiltersBar from '../../components/admin/moderation/CourseModerationFiltersBar';
import CourseApprovalTable from '../../components/admin/moderation/CourseApprovalTable';
import CourseQualityScorePanel from '../../components/admin/moderation/CourseQualityScorePanel';
import ReportedContentQueuePanel from '../../components/admin/moderation/ReportedContentQueuePanel';
import { supabase } from '../../lib/supabaseClient';
import { Loader2 } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  instructorName: string;
  instructorEmail: string;
  instructorId: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  submittedAt: string;
  qualityScore: number;
  qualityMetrics: {
    contentCompleteness: number;
    engagementPotential: number;
    productionQuality: number;
    policyCompliance: number;
  };
  qualityFlags: string[];
  reportsCount: number;
  description?: string;
  is_published?: boolean;
}

interface Report {
  id: string;
  courseId: string;
  courseTitle: string;
  reporterType: 'student' | 'coach' | 'system';
  reasonCategory: string;
  reasonSnippet: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  createdAt: string;
  reporterId?: string;
}

interface Filters {
  search: string;
  status: string;
  category: string;
  qualityBand: string;
}

const CourseModerationPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'rejected'>('pending');
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: 'all',
    category: 'all',
    qualityBand: 'all',
  });
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const calculateQualityScore = (course: any) => {
    let score = 0;
    let factors = 0;

    const hasDescription = course.description ? 1 : 0;
    const hasImage = course.image_url ? 1 : 0;
    score += (hasDescription + hasImage) / 2 * 30;
    factors += 30;

    const studentsCount = course.students_count || 0;
    const engagementScore = Math.min(studentsCount / 100, 1);
    score += engagementScore * 25;
    factors += 25;

    const hasCurriculum = course.modules_count > 0;
    const hasLessons = course.lessons_count > 0;
    const hasQuizzes = course.quizzes_count > 0;
    const curriculumScore = (hasCurriculum ? 1 : 0) + (hasLessons ? 1 : 0) + (hasQuizzes ? 1 : 0);
    score += (curriculumScore / 3) * 25;
    factors += 25;

    const isPublished = course.is_published ? 1 : 0;
    const isVerified = course.verification_status === 'approved' ? 1 : 0;
    score += (isPublished + isVerified) / 2 * 20;
    factors += 20;

    return factors > 0 ? Math.round(score) : 0;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select(`
            *,
            coach:profiles!courses_coach_id_fkey(first_name, last_name, email),
            category:categories(name)
          `)
          .order('created_at', { ascending: false });

        if (coursesError) throw coursesError;

        const { data: modulesData } = await supabase
          .from('modules')
          .select('course_id, id');

        const moduleCounts = modulesData?.reduce((acc: Record<string, number>, m: any) => {
          acc[m.course_id] = (acc[m.course_id] || 0) + 1;
          return acc;
        }, {});

        const { data: lessonsData } = await supabase
          .from('module_content_items')
          .select('module_id, content_type')
          .in('module_id', modulesData?.map(m => m.id) || []);

        const lessonCounts: Record<string, number> = {};
        const quizCounts: Record<string, number> = {};

        if (lessonsData && modulesData) {
          const moduleIds = modulesData.map(m => m.id);
          const modulesMap = new Map(modulesData.map(m => [m.id, m.course_id]));

          lessonsData.forEach(item => {
            const courseId = modulesMap.get(item.module_id);
            if (courseId) {
              if (item.content_type === 'lesson') {
                lessonCounts[courseId] = (lessonCounts[courseId] || 0) + 1;
              } else if (item.content_type === 'quiz') {
                quizCounts[courseId] = (quizCounts[courseId] || 0) + 1;
              }
            }
          });
        }

        const enrollmentPromises = (coursesData || []).map(async (c) => {
          const { count } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', c.id);
          return { courseId: c.id, count: count || 0 };
        });

        const enrollmentResults = await Promise.all(enrollmentPromises);
        const studentsCountMap = enrollmentResults.reduce((acc, r) => {
          acc[r.courseId] = r.count;
          return acc;
        }, {} as Record<string, number>);

        const mappedCourses: Course[] = (coursesData || []).map((c: any) => {
          let uiStatus: 'pending' | 'approved' | 'rejected' | 'changes_requested' = 'pending';

          if (c.verification_status === 'approved') uiStatus = 'approved';
          else if (c.verification_status === 'rejected') uiStatus = 'rejected';
          else if (c.verification_status === 'changes_requested') uiStatus = 'changes_requested';
          else if (c.verification_status === 'pending_review') uiStatus = 'pending';
          else if (c.verification_status === 'draft') uiStatus = 'pending';

          const qualityScore = calculateQualityScore({
            ...c,
            modules_count: moduleCounts?.[c.id] || 0,
            lessons_count: lessonCounts?.[c.id] || 0,
            quizzes_count: quizCounts?.[c.id] || 0,
            students_count: studentsCountMap?.[c.id] || 0,
          });

          const qualityFlags: string[] = [];
          if (!c.description) qualityFlags.push('Missing course description');
          if (!c.image_url) qualityFlags.push('Missing course image');
          if ((moduleCounts?.[c.id] || 0) === 0) qualityFlags.push('No modules created');
          if ((lessonCounts?.[c.id] || 0) === 0) qualityFlags.push('No lessons added');
          if ((quizCounts?.[c.id] || 0) === 0) qualityFlags.push('No quizzes created');

          return {
            id: c.id,
            title: c.title,
            instructorName: c.coach ? `${c.coach.first_name || ''} ${c.coach.last_name || ''}`.trim() || c.coach?.email : 'Unknown',
            instructorEmail: c.coach?.email || 'N/A',
            instructorId: c.coach_id || 'unknown',
            category: c.category?.name || 'General',
            status: uiStatus,
            submittedAt: c.created_at,
            qualityScore,
            qualityMetrics: {
              contentCompleteness: c.description ? 90 : 40,
              engagementPotential: Math.min((studentsCountMap?.[c.id] || 0) * 2, 100),
              productionQuality: qualityScore,
              policyCompliance: c.verification_status === 'approved' ? 100 : c.verification_status === 'rejected' ? 30 : 60,
            },
            qualityFlags,
            reportsCount: 0,
            description: c.description,
            is_published: c.is_published,
          };
        });

        setCourses(mappedCourses);
        setReports([]);
      } catch (error) {
        console.error('Error fetching moderation data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredCourses = courses.filter((course) => {
    if (activeTab === 'pending' && course.status !== 'pending') return false;
    if (activeTab === 'active' && course.status !== 'approved') return false;
    if (activeTab === 'rejected' && course.status !== 'rejected' && course.status !== 'changes_requested') return false;

    if (filters.search && !course.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status !== 'all' && course.status !== filters.status) {
      return false;
    }
    if (filters.category !== 'all' && course.category !== filters.category) {
      return false;
    }
    if (filters.qualityBand !== 'all') {
      if (filters.qualityBand === 'high' && course.qualityScore < 80) return false;
      if (filters.qualityBand === 'medium' && (course.qualityScore < 60 || course.qualityScore >= 80)) return false;
      if (filters.qualityBand === 'low' && course.qualityScore >= 60) return false;
    }

    return true;
  });

  const selectedCourse = selectedCourseId
    ? courses.find((c) => c.id === selectedCourseId)
    : undefined;

  const stats = {
    pending: courses.filter(c => c.status === 'pending').length,
    approved: courses.filter(c => c.status === 'approved').length,
    rejected: courses.filter(c => c.status === 'rejected' || c.status === 'changes_requested').length,
    openReports: 0,
  };

  const handleApprove = async (courseId: string) => {
    if (!courseId) {
      alert('Error: No course ID provided');
      return;
    }

    try {
      console.log('[Admin] Approving course:', courseId);

      // Step 1: Publish module_content_items FIRST (course is still pending, so trigger won't reset anything)
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', courseId);

      console.log('[Admin] Modules found:', { modulesData, modulesError });

      if (modulesData && modulesData.length > 0) {
        const moduleIds = modulesData.map(m => m.id);
        
        console.log('[Admin] Publishing module_content_items for modules:', moduleIds);

        const { data: updateData, error: updateError } = await supabase
          .from('module_content_items')
          .update({ is_published: true })
          .in('module_id', moduleIds)
          .select();

        console.log('[Admin] Module content items update result:', { updateData, updateError });

        if (updateError) {
          console.error('[Admin] Module content items update error:', updateError);
        }
      }

      // Step 2: THEN approve the course (nothing will touch it after this)
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .update({
          verification_status: 'approved',
          visibility: 'public',
          updated_at: new Date().toISOString()
        })
        .eq('id', courseId)
        .select();

      console.log('[Admin] Course update result:', { courseData, courseError });

      if (courseError) {
        console.error('[Admin] Course update error:', courseError);
        throw courseError;
      }
      if (!courseData || courseData.length === 0) throw new Error('Course not found');

      setCourses(prev => prev.map(c =>
        c.id === courseId
          ? { ...c, status: 'approved' as const, qualityScore: Math.max(c.qualityScore, 80) }
          : c
      ));

      alert(`Course Approved!\n\nCourse: ${courseData[0].title}\n\nThe course is now visible to students.`);

    } catch (error: any) {
      console.error('Approval error:', error);
      alert(`Failed to approve\n\nError: ${error.message || error}\n\nCheck console (F12) for details.`);
    }
  };

  const handleRequestChanges = async (courseId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({
          verification_status: 'changes_requested',
          updated_at: new Date().toISOString()
        })
        .eq('id', courseId);

      if (error) throw error;

      setCourses(prev => prev.map(c => 
        c.id === courseId 
          ? { ...c, status: 'changes_requested' as const }
          : c
      ));

      alert(`Changes Requested\n\nCourse ID: ${courseId}`);
    } catch (error) {
      console.error('Error requesting changes:', error);
      alert('Failed to request changes');
    }
  };

  const handleReject = async (courseId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({
          verification_status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', courseId);

      if (error) throw error;

      setCourses(prev => prev.map(c => 
        c.id === courseId 
          ? { ...c, status: 'rejected' as const, qualityScore: Math.min(c.qualityScore, 40) }
          : c
      ));

      alert(`Course Rejected\n\nCourse ID: ${courseId}`);
    } catch (error) {
      console.error('Error rejecting course:', error);
      alert(`Failed to reject course: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <AdminAppLayout>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-[#304DB5] mx-auto mb-4" />
            <p className="text-text-secondary">Loading moderation data...</p>
          </div>
        </div>
      </AdminAppLayout>
    );
  }

  return (
    <AdminAppLayout>
      <div className="m-5 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] mb-2">Course Moderation</h1>
          <p className="text-sm text-[#5F6473]">
            Review and approve courses, manage quality standards, and handle reported content
          </p>
        </div>

        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('pending')}
              className={`${activeTab === 'pending'
                ? 'border-[#304DB5] text-[#304DB5]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Pending Review ({stats.pending})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`${activeTab === 'active'
                ? 'border-[#304DB5] text-[#304DB5]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Active Courses ({stats.approved})
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`${activeTab === 'rejected'
                ? 'border-[#304DB5] text-[#304DB5]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Rejected ({stats.rejected})
            </button>
          </nav>
        </div>

        <CourseModerationFiltersBar value={filters} onChange={setFilters} />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-[#DBEAFE] to-white rounded-2xl p-4 border border-[#93C5FD]">
            <p className="text-sm text-[#1E40AF] mb-1">Pending Review</p>
            <p className="text-2xl font-bold text-[#111827]">{stats.pending}</p>
          </div>
          <div className="bg-gradient-to-br from-[#D1FAE5] to-white rounded-2xl p-4 border border-[#6EE7B7]">
            <p className="text-sm text-[#047857] mb-1">Approved</p>
            <p className="text-2xl font-bold text-[#111827]">{stats.approved}</p>
          </div>
          <div className="bg-gradient-to-br from-[#FEE2E2] to-white rounded-2xl p-4 border border-[#FCA5A5]">
            <p className="text-sm text-[#991B1B] mb-1">Rejected</p>
            <p className="text-2xl font-bold text-[#111827]">{stats.rejected}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CourseApprovalTable
              courses={filteredCourses}
              onSelect={setSelectedCourseId}
              onApprove={handleApprove}
              onReject={handleReject}
              onRequestChanges={handleRequestChanges}
            />
          </div>

          <div className="lg:col-span-1 space-y-6">
            <CourseQualityScorePanel selectedCourse={selectedCourse} />
            <ReportedContentQueuePanel
              reports={reports}
              onInvestigate={() => {}}
              onResolve={() => {}}
              onDismiss={() => {}}
            />
          </div>
        </div>
      </div>
    </AdminAppLayout>
  );
};

export default CourseModerationPage;
