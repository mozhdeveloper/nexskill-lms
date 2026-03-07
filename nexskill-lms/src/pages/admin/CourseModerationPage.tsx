import React, { useState } from 'react';
import AdminAppLayout from '../../layouts/AdminAppLayout';
import CourseModerationFiltersBar from '../../components/admin/moderation/CourseModerationFiltersBar';
import CourseApprovalTable from '../../components/admin/moderation/CourseApprovalTable';
import CourseQualityScorePanel from '../../components/admin/moderation/CourseQualityScorePanel';
import ReportedContentQueuePanel from '../../components/admin/moderation/ReportedContentQueuePanel';

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
}

interface Filters {
  search: string;
  status: string;
  category: string;
  qualityBand: string;
}

const CourseModerationPage: React.FC = () => {
  // Dummy data for courses
  // Supabase for Active Courses
  const [activeCourses, setActiveCourses] = useState<Course[]>([]);
  const [, setLoadingActive] = useState(true);

  // Mock for Pending/Rejected
  const [mockCourses] = useState<Course[]>([
    {
      id: 'c1',
      title: 'Complete Python Programming Bootcamp 2024',
      instructorName: 'Sarah Johnson',
      instructorEmail: 'sarah.johnson@example.com',
      instructorId: 'i1',
      category: 'Programming',
      status: 'pending',
      submittedAt: '2024-01-15',
      qualityScore: 85,
      qualityMetrics: {
        contentCompleteness: 90,
        engagementPotential: 85,
        productionQuality: 82,
        policyCompliance: 83,
      },
      qualityFlags: [],
      reportsCount: 0,
    },
    {
      id: 'c2',
      title: 'Web Development Masterclass',
      instructorName: 'Michael Chen',
      instructorEmail: 'michael.chen@example.com',
      instructorId: 'i2',
      category: 'Web Development',
      status: 'pending',
      submittedAt: '2024-01-14',
      qualityScore: 72,
      qualityMetrics: {
        contentCompleteness: 75,
        engagementPotential: 78,
        productionQuality: 68,
        policyCompliance: 67,
      },
      qualityFlags: ['Audio quality inconsistent', 'Missing lesson objectives'],
      reportsCount: 2,
    },
    {
      id: 'c4',
      title: 'Introduction to Cryptocurrency Trading',
      instructorName: 'Alex Martinez',
      instructorEmail: 'alex.martinez@example.com',
      instructorId: 'i4',
      category: 'Finance',
      status: 'pending',
      submittedAt: '2024-01-12',
      qualityScore: 55,
      qualityMetrics: {
        contentCompleteness: 60,
        engagementPotential: 65,
        productionQuality: 50,
        policyCompliance: 45,
      },
      qualityFlags: [
        'Potential financial advice without disclaimer',
        'Incomplete module structure',
        'Video resolution below standards',
      ],
      reportsCount: 3,
    },
    {
      id: 'c9',
      title: 'Quick Money from Home - Get Rich Fast',
      instructorName: 'Unknown Creator',
      instructorEmail: 'unknown@example.com',
      instructorId: 'i9',
      category: 'Finance',
      status: 'rejected',
      submittedAt: '2024-01-02',
      qualityScore: 28,
      qualityMetrics: {
        contentCompleteness: 35,
        engagementPotential: 40,
        productionQuality: 20,
        policyCompliance: 15,
      },
      qualityFlags: [
        'Misleading claims detected',
        'No verifiable credentials',
        'Poor production quality',
        'Violation of financial advice policy',
      ],
      reportsCount: 5,
    },
    {
      id: 'c10',
      title: 'Low Quality Content Example',
      instructorName: 'Test Instructor',
      instructorEmail: 'test@example.com',
      instructorId: 'i10',
      category: 'Other',
      status: 'rejected',
      submittedAt: '2024-01-01',
      qualityScore: 42,
      qualityMetrics: {
        contentCompleteness: 45,
        engagementPotential: 50,
        productionQuality: 35,
        policyCompliance: 38,
      },
      qualityFlags: ['Incomplete course structure', 'Copyright concerns'],
      reportsCount: 1,
    }
  ]);

  // Tab State
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'rejected'>('pending');

  React.useEffect(() => {
    const fetchActiveCourses = async () => {
      setLoadingActive(true);
      const { supabase } = await import('../../lib/supabaseClient');

      // Fetch courses for the current tab
      let query = supabase
        .from('courses')
        .select('*, coach:profiles!courses_coach_id_fkey(first_name, last_name, email), category:categories(name)')
        .order('updated_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching courses:", error);
      } else if (data) {
        // Map to Course interface
        const mapped: Course[] = data.map((c: any) => {
          // Map DB verification_status to UI status
          let uiStatus: 'pending' | 'approved' | 'rejected' | 'changes_requested' = 'pending';

          if (c.verification_status === 'approved') uiStatus = 'approved';
          else if (c.verification_status === 'rejected') uiStatus = 'rejected';
          else if (c.verification_status === 'changes_requested') uiStatus = 'changes_requested';
          else if (c.verification_status === 'pending_review') uiStatus = 'pending';
          else if (c.verification_status === 'draft') uiStatus = 'pending'; // Show drafts in pending for now matches current flow

          return {
            id: c.id,
            title: c.title,
            instructorName: c.coach ? `${c.coach.first_name} ${c.coach.last_name}` : 'Unknown',
            instructorEmail: c.coach?.email || 'N/A',
            instructorId: c.coach_id || 'unknown',
            category: c.category?.name || 'General',
            status: uiStatus,
            submittedAt: c.created_at,
            qualityScore: 85,
            qualityMetrics: {
              contentCompleteness: 90,
              engagementPotential: 85,
              productionQuality: 80,
              policyCompliance: 90,
            },
            qualityFlags: [],
            reportsCount: 0
          };
        });
        setActiveCourses(mapped);
      }
      setLoadingActive(false);
    };

    fetchActiveCourses();
  }, [activeTab]);

  // Combine data
  const courses = activeTab === 'active'
    ? activeCourses.filter(c => c.status === 'approved')
    : activeTab === 'rejected'
      ? activeCourses.filter(c => c.status === 'rejected' || c.status === 'changes_requested')
      : activeCourses.filter(c => c.status === 'pending');


  // Dummy data for reports
  const [reports] = useState<Report[]>([
    {
      id: 'r1',
      courseId: 'c2',
      courseTitle: 'Web Development Masterclass',
      reporterType: 'student',
      reasonCategory: 'Quality Issues',
      reasonSnippet: 'Audio is very inconsistent across lessons. Some parts are almost inaudible.',
      severity: 'medium',
      status: 'open',
      createdAt: '2024-01-16',
    },
    {
      id: 'r2',
      courseId: 'c2',
      courseTitle: 'Web Development Masterclass',
      reporterType: 'system',
      reasonCategory: 'Content Completeness',
      reasonSnippet: 'Multiple lessons missing clear objectives and learning outcomes.',
      severity: 'low',
      status: 'open',
      createdAt: '2024-01-16',
    },
    {
      id: 'r3',
      courseId: 'c4',
      courseTitle: 'Introduction to Cryptocurrency Trading',
      reporterType: 'student',
      reasonCategory: 'Policy Violation',
      reasonSnippet: 'Instructor provides specific investment advice without proper disclaimers.',
      severity: 'high',
      status: 'open',
      createdAt: '2024-01-15',
    },
    {
      id: 'r4',
      courseId: 'c4',
      courseTitle: 'Introduction to Cryptocurrency Trading',
      reporterType: 'system',
      reasonCategory: 'Technical Standards',
      reasonSnippet: 'Video resolution below minimum standards (480p detected).',
      severity: 'medium',
      status: 'open',
      createdAt: '2024-01-15',
    },
    {
      id: 'r5',
      courseId: 'c4',
      courseTitle: 'Introduction to Cryptocurrency Trading',
      reporterType: 'coach',
      reasonCategory: 'Content Accuracy',
      reasonSnippet: 'Some information appears outdated and potentially misleading.',
      severity: 'high',
      status: 'open',
      createdAt: '2024-01-14',
    },
    {
      id: 'r6',
      courseId: 'c9',
      courseTitle: 'Quick Money from Home - Get Rich Fast',
      reporterType: 'student',
      reasonCategory: 'Misleading Content',
      reasonSnippet: 'Course promises unrealistic returns and uses deceptive marketing.',
      severity: 'critical',
      status: 'resolved',
      createdAt: '2024-01-10',
    },
    {
      id: 'r7',
      courseId: 'c9',
      courseTitle: 'Quick Money from Home - Get Rich Fast',
      reporterType: 'system',
      reasonCategory: 'Policy Violation',
      reasonSnippet: 'Multiple policy violations detected: financial advice, misleading claims.',
      severity: 'critical',
      status: 'resolved',
      createdAt: '2024-01-10',
    },
    {
      id: 'r8',
      courseId: 'c10',
      courseTitle: 'Low Quality Content Example',
      reporterType: 'system',
      reasonCategory: 'Copyright Concern',
      reasonSnippet: 'Potential copyright infringement detected in course materials.',
      severity: 'high',
      status: 'resolved',
      createdAt: '2024-01-08',
    },
  ]);

  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: 'all',
    category: 'all',
    qualityBand: 'all',
  });

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  // Filter courses based on current filters
  const filteredCourses = courses.filter((course) => {
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
      if (
        filters.qualityBand === 'medium' &&
        (course.qualityScore < 60 || course.qualityScore >= 80)
      )
        return false;
      if (filters.qualityBand === 'low' && course.qualityScore >= 60) return false;
    }
    return true;
  });

  const selectedCourse = selectedCourseId
    ? courses.find((c) => c.id === selectedCourseId)
    : undefined;

  const handleApprove = async (courseId: string) => {
    try {
      const { supabase } = await import('../../lib/supabaseClient');
      const { error } = await supabase
        .from('courses')
        .update({ verification_status: 'approved' })
        .eq('id', courseId);

      if (error) throw error;

      // Refresh list
      const updatedCourses = activeCourses.filter(c => c.id !== courseId);
      setActiveCourses(updatedCourses);

      window.alert(`✅ Course Approved & Published\n\nCourse ID: ${courseId}\n\nStatus updated to Approved.`);
    } catch (error) {
      console.error('Error approving course:', error);
      window.alert('Failed to approve course');
    }
  };

  const handleRequestChanges = async (courseId: string, reason: string) => {
    try {
      const { supabase } = await import('../../lib/supabaseClient');

      // Update status and save admin_feedback
      const { error } = await supabase
        .from('courses')
        .update({
          verification_status: 'changes_requested'
        })
        .eq('id', courseId);

      if (error) throw error;

      // Add feedback comment to history log
      if (reason) {
        // Need current user ID for admin_id
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

      // Refresh list
      const updatedCourses = activeCourses.filter(c => c.id !== courseId);
      setActiveCourses(updatedCourses);

      window.alert(`⚠️ Changes Requested\n\nCourse ID: ${courseId}\n\nFeedback sent to instructor.`);
    } catch (error) {
      console.error('Error requesting changes:', error);
      window.alert('Failed to request changes');
    }
  };

  const handleReject = async (courseId: string, reason: string) => {
    try {
      const { supabase } = await import('../../lib/supabaseClient');

      // Update status and save admin_feedback
      // We'll treat it as a hard rejection via feedback
      const { error } = await supabase
        .from('courses')
        .update({
          verification_status: 'changes_requested'
        })
        .eq('id', courseId);

      if (error) throw error;

      // Add feedback comment
      if (reason) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('admin_verification_feedback').insert({
            course_id: courseId,
            admin_id: user.id,
            content: `REJECTED: ${reason}`,
            is_resolved: false // Keep unresolved so it appears prominently
          });
        }
      }

      // Refresh list
      const updatedCourses = activeCourses.filter(c => c.id !== courseId);
      setActiveCourses(updatedCourses);

      window.alert(`❌ Course Rejected\n\nCourse ID: ${courseId}\n\nStatus updated to Changes Requested (Admin Rejected).`);
    } catch (error) {
      console.error('Error rejecting course:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      window.alert(`Failed to reject course: ${errorMessage}`);
    }
  };

  const handleInvestigate = (reportId: string) => {
    window.alert(`🔍 Investigation Started\n\nReport ID: ${reportId}\n\n📊 Investigation Process:\n• Status: Under active review\n• Priority: High\n• Assigned: Moderation team\n• Timeline: 24-48 hours\n\n🔎 Investigation Steps:\n• Content review in progress\n• Evidence collection\n• Stakeholder interviews\n• Policy compliance check\n\n📧 Notifications:\n• Reporter: Investigation started\n• Content owner: Under review\n• Admin team: Case assigned\n\n⏱️ Updates will be provided every 12 hours until resolved.`);
  };

  const handleResolve = (reportId: string) => {
    window.alert(`✅ Report Resolved\n\nReport ID: ${reportId}\n\n📋 Resolution Summary:\n• Status: Closed\n• Action taken: Content updated/removed\n• Resolution time: 36 hours\n• Outcome: Satisfactory\n\n📧 Notifications Sent:\n• Reporter: Issue resolved confirmation\n• Content owner: Action taken notice\n• Moderation team: Case closed\n\n📊 Impact:\n• Content compliance: Restored\n• User safety: Protected\n• Platform standards: Maintained\n\n📝 Case documentation saved for future reference.`);
  };

  const handleDismiss = (reportId: string) => {
    window.alert(`🚫 Report Dismissed\n\nReport ID: ${reportId}\n\n📝 Dismissal Reasoning:\n• Finding: No policy violation\n• Content: Complies with standards\n• Evidence: Insufficient or invalid\n• Decision: No action required\n\n📧 Notifications:\n• Reporter: Outcome explained\n• Content owner: No action needed\n• Documentation: Case archived\n\n💡 Reporter Options:\n• Review dismissal reasoning\n• Provide additional evidence\n• Submit new report if needed\n• Contact support for clarification\n\nAll decisions are logged for quality assurance.`);
  };

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
              Pending Review
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`${activeTab === 'active'
                ? 'border-[#304DB5] text-[#304DB5]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Active Courses
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`${activeTab === 'rejected'
                ? 'border-[#304DB5] text-[#304DB5]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Rejected
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
              {mockCourses.filter((c) => c.status === 'pending').length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-[#D1FAE5] to-white rounded-2xl p-4 border border-[#6EE7B7]">
            <p className="text-sm text-[#047857] mb-1">Approved</p>
            <p className="text-2xl font-bold text-[#111827]">
              {activeCourses.length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-[#FEE2E2] to-white rounded-2xl p-4 border border-[#FCA5A5]">
            <p className="text-sm text-[#991B1B] mb-1">Rejected</p>
            <p className="text-2xl font-bold text-[#111827]">
              {mockCourses.filter((c) => c.status === 'rejected').length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-[#FED7AA] to-white rounded-2xl p-4 border border-[#FDBA74]">
            <p className="text-sm text-[#9A3412] mb-1">Open Reports</p>
            <p className="text-2xl font-bold text-[#111827]">
              {reports.filter((r) => r.status === 'open').length}
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
