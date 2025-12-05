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
  status: 'pending' | 'approved' | 'rejected';
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
  const [courses] = useState<Course[]>([
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
      id: 'c3',
      title: 'Data Science with R and Python',
      instructorName: 'Dr. Emily Rodriguez',
      instructorEmail: 'emily.rodriguez@example.com',
      instructorId: 'i3',
      category: 'Data Science',
      status: 'pending',
      submittedAt: '2024-01-13',
      qualityScore: 92,
      qualityMetrics: {
        contentCompleteness: 95,
        engagementPotential: 90,
        productionQuality: 91,
        policyCompliance: 92,
      },
      qualityFlags: [],
      reportsCount: 0,
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
      id: 'c5',
      title: 'Advanced JavaScript: ES6 and Beyond',
      instructorName: 'Kevin Park',
      instructorEmail: 'kevin.park@example.com',
      instructorId: 'i5',
      category: 'Programming',
      status: 'approved',
      submittedAt: '2024-01-10',
      qualityScore: 88,
      qualityMetrics: {
        contentCompleteness: 90,
        engagementPotential: 87,
        productionQuality: 86,
        policyCompliance: 89,
      },
      qualityFlags: [],
      reportsCount: 0,
    },
    {
      id: 'c6',
      title: 'UX/UI Design Fundamentals',
      instructorName: 'Jessica Lee',
      instructorEmail: 'jessica.lee@example.com',
      instructorId: 'i6',
      category: 'Design',
      status: 'approved',
      submittedAt: '2024-01-08',
      qualityScore: 91,
      qualityMetrics: {
        contentCompleteness: 92,
        engagementPotential: 93,
        productionQuality: 89,
        policyCompliance: 90,
      },
      qualityFlags: [],
      reportsCount: 0,
    },
    {
      id: 'c7',
      title: 'Digital Marketing Strategy 2024',
      instructorName: 'David Thompson',
      instructorEmail: 'david.thompson@example.com',
      instructorId: 'i7',
      category: 'Marketing',
      status: 'approved',
      submittedAt: '2024-01-05',
      qualityScore: 84,
      qualityMetrics: {
        contentCompleteness: 85,
        engagementPotential: 86,
        productionQuality: 82,
        policyCompliance: 83,
      },
      qualityFlags: [],
      reportsCount: 0,
    },
    {
      id: 'c8',
      title: 'Machine Learning Basics',
      instructorName: 'Dr. Rachel Kim',
      instructorEmail: 'rachel.kim@example.com',
      instructorId: 'i8',
      category: 'Data Science',
      status: 'approved',
      submittedAt: '2024-01-03',
      qualityScore: 89,
      qualityMetrics: {
        contentCompleteness: 90,
        engagementPotential: 88,
        productionQuality: 89,
        policyCompliance: 89,
      },
      qualityFlags: [],
      reportsCount: 0,
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
    },
  ]);

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

  const handleApprove = (courseId: string) => {
    console.log('Approving course:', courseId);
    window.alert(`Course ${courseId} has been approved and published.`);
  };

  const handleReject = (courseId: string, reason: string) => {
    console.log('Rejecting course:', courseId, 'Reason:', reason);
    window.alert(`Course ${courseId} has been rejected. Instructor will be notified.`);
  };

  const handleInvestigate = (reportId: string) => {
    console.log('Investigating report:', reportId);
    window.alert(`Report ${reportId} status changed to"Investigating".`);
  };

  const handleResolve = (reportId: string) => {
    console.log('Resolving report:', reportId);
    window.alert(`Report ${reportId} has been marked as resolved.`);
  };

  const handleDismiss = (reportId: string) => {
    console.log('Dismissing report:', reportId);
    window.alert(`Report ${reportId} has been dismissed.`);
  };

  return (
    <AdminAppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#111827] mb-2">Course Moderation</h1>
          <p className="text-sm text-[#5F6473]">
            Review and approve courses, manage quality standards, and handle reported content
          </p>
        </div>

        {/* Filters */}
        <CourseModerationFiltersBar value={filters} onChange={setFilters} />

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-[#DBEAFE] to-white rounded-2xl p-4 border border-[#93C5FD]">
            <p className="text-sm text-[#1E40AF] mb-1">Pending Review</p>
            <p className="text-2xl font-bold text-[#111827]">
              {courses.filter((c) => c.status === 'pending').length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-[#D1FAE5] to-white rounded-2xl p-4 border border-[#6EE7B7]">
            <p className="text-sm text-[#047857] mb-1">Approved</p>
            <p className="text-2xl font-bold text-[#111827]">
              {courses.filter((c) => c.status === 'approved').length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-[#FEE2E2] to-white rounded-2xl p-4 border border-[#FCA5A5]">
            <p className="text-sm text-[#991B1B] mb-1">Rejected</p>
            <p className="text-2xl font-bold text-[#111827]">
              {courses.filter((c) => c.status === 'rejected').length}
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
