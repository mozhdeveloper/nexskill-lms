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
  reporterType: 'student' | 'coach' | 'system' | 'admin';
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

  // Calculate quality score based on course completeness
  const calculateQualityScore = (course: any) => {
    let score = 0;
    let factors = 0;

    // Content completeness (30%)
    const hasDescription = course.description ? 1 : 0;
    const hasImage = course.image_url ? 1 : 0;
    score += (hasDescription + hasImage) / 2 * 30;
    factors += 30;

    // Engagement potential (25%)
    const studentsCount = course.students_count || 0;
    const engagementScore = Math.min(studentsCount / 100, 1);
    score += engagementScore * 25;
    factors += 25;

    // Production quality (25%)
    const hasCurriculum = course.modules_count > 0;
    const hasLessons = course.lessons_count > 0;
    const hasQuizzes = course.quizzes_count > 0;
    const curriculumScore = (hasCurriculum ? 1 : 0) + (hasLessons ? 1 : 0) + (hasQuizzes ? 1 : 0);
    score += (curriculumScore / 3) * 25;
    factors += 25;

    // Policy compliance (20%)
    const isPublished = course.is_published ? 1 : 0;
    const isVerified = course.verification_status === 'approved' ? 1 : 0;
    score += (isPublished + isVerified) / 2 * 20;
    factors += 20;

    return factors > 0 ? Math.round(score) : 0;
  };

  // Fetch courses and reports
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all courses with coach and category info
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select(`
            *,
            coach:profiles!courses_coach_id_fkey(first_name, last_name, email),
            category:categories(name)
          `)
          .order('created_at', { ascending: false });

        if (coursesError) throw coursesError;

        // Fetch module counts for each course
        const { data: modulesData } = await supabase
          .from('modules')
          .select('course_id, id');

        const moduleCounts = modulesData?.reduce((acc: Record<string, number>, m: any) => {
          acc[m.course_id] = (acc[m.course_id] || 0) + 1;
          return acc;
        }, {});

        // Fetch lesson counts
        const { data: lessonsData } = await supabase
          .from('module_content_items')
          .select('module_id, content_type')
          .in('module_id', modulesData?.map(m => m.id) || []);

        const lessonCounts: Record<string, number> = {};
        const quizCounts: Record<string, number> = {};
        
        if (lessonsData) {
          const moduleIds = modulesData?.map(m => m.id) || [];
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

        // Fetch enrollment counts
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

        // Map to Course interface
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

        // Fetch reports - content_reports table may not exist
        let mappedReports: Report[] = [];
        let reportsAvailable = false;
        
        // First check if content_reports table exists
        try {
          const { count, error: checkError } = await supabase
            .from('content_reports')
            .select('*', { count: 'exact', head: true });
          
          reportsAvailable = !checkError;
          if (!reportsAvailable) {
            console.log('ℹ️ Content reports table not available - reports disabled');
          }
        } catch (e) {
          reportsAvailable = false;
          console.log('ℹ️ Content reports table not available - reports disabled');
        }

        // Only fetch reports if table exists
        if (reportsAvailable) {
          try {
            const { data: reportsData, error: reportsError } = await supabase
              .from('content_reports')
              .select(`
                *,
                course:courses(title),
                reporter:profiles!content_reports_reporter_id_fkey(first_name, last_name)
              `)
              .order('created_at', { ascending: false });

            if (!reportsError && reportsData) {
              mappedReports = reportsData.map((r: any) => ({
                id: r.id,
                courseId: r.course_id,
                courseTitle: r.course?.title || 'Unknown Course',
                reporterType: r.reporter_type || 'student',
                reasonCategory: r.reason_category || 'Other',
                reasonSnippet: r.description || 'No description provided',
                severity: r.severity || 'medium',
                status: r.status || 'open',
                createdAt: r.created_at,
                reporterId: r.reporter_id,
              }));
            }
          } catch (e) {
            console.log('ℹ️ Content reports fetch failed - using empty reports');
          }
        }

        // Count reports per course
        const reportsCountMap = mappedReports.reduce((acc, r) => {
          acc[r.courseId] = (acc[r.courseId] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Update courses with report counts
        mappedCourses.forEach(c => {
          c.reportsCount = reportsCountMap?.[c.id] || 0;
        });

        setCourses(mappedCourses);
        setReports(mappedReports);
      } catch (error) {
        console.error('Error fetching moderation data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter courses based on active tab and filters
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

  // Stats calculations
  const stats = {
    pending: courses.filter(c => c.status === 'pending').length,
    approved: courses.filter(c => c.status === 'approved').length,
    rejected: courses.filter(c => c.status === 'rejected' || c.status === 'changes_requested').length,
    openReports: reports.filter(r => r.status === 'open' || r.status === 'investigating').length,
  };

  const handleApprove = async (courseId: string) => {
    console.log('🟢 Approving course:', courseId);
    
    if (!courseId) {
      alert('❌ Error: No course ID provided');
      return;
    }

    try {
      // Step 1: Update course verification status
      console.log('⏳ Step 1: Updating course status to approved...');
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .update({
          verification_status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', courseId)
        .select();

      console.log('Course update result:', { courseData, courseError });

      if (courseError) {
        console.error('❌ Course update error:', courseError);
        throw courseError;
      }

      if (!courseData || courseData.length === 0) {
        console.error('❌ No course found with ID:', courseId);
        throw new Error('Course not found');
      }

      // Step 2: Publish all modules
      console.log('⏳ Step 2: Publishing modules...');
      const { error: modulesError } = await supabase
        .from('modules')
        .update({ is_published: true, updated_at: new Date().toISOString() })
        .eq('course_id', courseId);

      if (modulesError) {
        console.error('⚠️ Warning: Error publishing modules:', modulesError);
        // Don't throw - continue with approval
      }

      // Step 3: Get all module IDs
      console.log('⏳ Step 3: Getting module IDs...');
      const { data: modulesData, error: modulesFetchError } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', courseId);

      if (modulesFetchError) {
        console.error('⚠️ Warning: Error fetching modules:', modulesFetchError);
      }

      if (modulesData && modulesData.length > 0) {
        const moduleIds = modulesData.map(m => m.id);
        console.log('Found modules:', moduleIds);

        // Step 4: Publish all module content items
        console.log('⏳ Step 4: Publishing content items...');
        const { error: itemsError } = await supabase
          .from('module_content_items')
          .update({ is_published: true, updated_at: new Date().toISOString() })
          .in('module_id', moduleIds);

        if (itemsError) {
          console.error('⚠️ Warning: Error publishing content items:', itemsError);
        }

        // Step 5: Publish all lessons
        console.log('⏳ Step 5: Publishing lessons...');
        const { data: lessonContentItems } = await supabase
          .from('module_content_items')
          .select('content_id')
          .in('module_id', moduleIds)
          .eq('content_type', 'lesson');

        if (lessonContentItems && lessonContentItems.length > 0) {
          const lessonIds = lessonContentItems.map(l => l.content_id);
          console.log('Found lessons:', lessonIds);
          
          const { error: lessonsError } = await supabase
            .from('lessons')
            .update({ is_published: true, updated_at: new Date().toISOString() })
            .in('id', lessonIds);
          
          if (lessonsError) {
            console.error('⚠️ Warning: Error publishing lessons:', lessonsError);
          }
        }

        // Note: Quizzes are NOT auto-published to avoid RLS issues
        // Coaches can publish their own quizzes after approval
      }

      // Step 6: Update local state
      console.log('✅ Course approved successfully!');
      setCourses(prev => prev.map(c =>
        c.id === courseId
          ? { ...c, status: 'approved' as const, qualityScore: Math.max(c.qualityScore, 80) }
          : c
      ));

      alert(`✅ Course Approved!\n\nCourse ID: ${courseId}\nCourse Title: ${courseData[0].title}\n\n✅ Modules and lessons have been published.\n⚠️ Note: Coaches need to publish quizzes manually.`);
      
    } catch (error: any) {
      console.error('❌ Error approving course:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      alert(`❌ Failed to approve course\n\nError: ${errorMsg}\n\nCheck console for details.`);
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

      if (reason) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('admin_verification_feedback').insert({
            course_id: courseId,
            admin_id: user.id,
            content: reason,
            is_resolved: false
          });
        }
      }

      setCourses(prev => prev.map(c => 
        c.id === courseId 
          ? { ...c, status: 'changes_requested' as const }
          : c
      ));

      alert(`⚠️ Changes Requested\n\nCourse ID: ${courseId}\n\nFeedback sent to instructor.`);
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

      if (reason) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('admin_verification_feedback').insert({
            course_id: courseId,
            admin_id: user.id,
            content: `REJECTED: ${reason}`,
            is_resolved: false
          });
        }
      }

      setCourses(prev => prev.map(c => 
        c.id === courseId 
          ? { ...c, status: 'rejected' as const, qualityScore: Math.min(c.qualityScore, 40) }
          : c
      ));

      alert(`❌ Course Rejected\n\nCourse ID: ${courseId}\n\nStatus updated to Rejected.`);
    } catch (error) {
      console.error('Error rejecting course:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to reject course: ${errorMessage}`);
    }
  };

  const handleInvestigate = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('content_reports')
        .update({ status: 'investigating' })
        .eq('id', reportId);

      if (error) throw error;

      setReports(prev => prev.map(r => 
        r.id === reportId ? { ...r, status: 'investigating' as const } : r
      ));

      alert(`🔍 Investigation Started\n\nReport ID: ${reportId}\n\nStatus updated to "Under Investigation"`);
    } catch (error) {
      console.log('ℹ️ Reports feature not available - content_reports table not found');
      alert(`⚠️ Reports Not Available\n\nThe content reports feature is not enabled in this instance.`);
    }
  };

  const handleResolve = async (reportId: string, resolution: string = 'Content reviewed and action taken') => {
    try {
      const { error } = await supabase
        .from('content_reports')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          admin_notes: resolution
        })
        .eq('id', reportId);

      if (error) throw error;

      setReports(prev => prev.map(r => 
        r.id === reportId ? { ...r, status: 'resolved' as const } : r
      ));

      alert(`✅ Report Resolved\n\nReport ID: ${reportId}\n\n${resolution}`);
    } catch (error) {
      console.log('ℹ️ Reports feature not available - content_reports table not found');
      alert(`⚠️ Reports Not Available\n\nThe content reports feature is not enabled in this instance.`);
    }
  };

  const handleDismiss = async (reportId: string, reason: string = 'No violation found') => {
    try {
      const { error } = await supabase
        .from('content_reports')
        .update({ 
          status: 'dismissed',
          dismissed_at: new Date().toISOString(),
          admin_notes: reason
        })
        .eq('id', reportId);

      if (error) throw error;

      setReports(prev => prev.map(r => 
        r.id === reportId ? { ...r, status: 'dismissed' as const } : r
      ));

      alert(`🚫 Report Dismissed\n\nReport ID: ${reportId}\n\n${reason}`);
    } catch (error) {
      console.log('ℹ️ Reports feature not available - content_reports table not found');
      alert(`⚠️ Reports Not Available\n\nThe content reports feature is not enabled in this instance.`);
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
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#111827] mb-2">Course Moderation</h1>
          <p className="text-sm text-[#5F6473]">
            Review and approve courses, manage quality standards, and handle reported content
          </p>
        </div>

        {/* Tabs */}
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

        {/* Filters */}
        <CourseModerationFiltersBar value={filters} onChange={setFilters} />

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-[#DBEAFE] to-white rounded-2xl p-4 border border-[#93C5FD]">
            <p className="text-sm text-[#1E40AF] mb-1">Pending Review</p>
            <p className="text-2xl font-bold text-[#111827]">
              {stats.pending}
            </p>
          </div>
          <div className="bg-gradient-to-br from-[#D1FAE5] to-white rounded-2xl p-4 border border-[#6EE7B7]">
            <p className="text-sm text-[#047857] mb-1">Approved</p>
            <p className="text-2xl font-bold text-[#111827]">
              {stats.approved}
            </p>
          </div>
          <div className="bg-gradient-to-br from-[#FEE2E2] to-white rounded-2xl p-4 border border-[#FCA5A5]">
            <p className="text-sm text-[#991B1B] mb-1">Rejected</p>
            <p className="text-2xl font-bold text-[#111827]">
              {stats.rejected}
            </p>
          </div>
          <div className="bg-gradient-to-br from-[#FED7AA] to-white rounded-2xl p-4 border border-[#FDBA74]">
            <p className="text-sm text-[#9A3412] mb-1">Open Reports</p>
            <p className="text-2xl font-bold text-[#111827]">
              {stats.openReports}
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Course Approval Table (2/3) */}
          <div className="lg:col-span-2">
            <CourseApprovalTable
              courses={filteredCourses}
              onSelect={setSelectedCourseId}
              onApprove={handleApprove}
              onReject={handleReject}
              onRequestChanges={handleRequestChanges}
            />
          </div>

          {/* Right: Side Panels (1/3) */}
          <div className="lg:col-span-1 space-y-6">
            <CourseQualityScorePanel selectedCourse={selectedCourse} />
            <ReportedContentQueuePanel
              reports={reports}
              onInvestigate={handleInvestigate}
              onResolve={handleResolve}
              onDismiss={handleDismiss}
            />
          </div>
        </div>
      </div>
    </AdminAppLayout>
  );
};

export default CourseModerationPage;
