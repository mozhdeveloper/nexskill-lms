import React, { useState } from 'react';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import CertificateCard from '../../components/certificates/CertificateCard';

// Dummy certificates data
const allCertificates = [
  {
    id: 'cert-1',
    courseTitle: 'UI Design Fundamentals',
    issueDate: 'December 1, 2025',
    certificateType: 'Course completion',
    score: 94,
    issuerName: 'NexSkill LMS',
    blockchainHash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
    studentName: 'Sarah Johnson',
  },
  {
    id: 'cert-2',
    courseTitle: 'JavaScript Mastery',
    issueDate: 'November 20, 2025',
    certificateType: 'Course completion',
    score: 89,
    issuerName: 'NexSkill LMS',
    blockchainHash: '0x9876543210fedcba0987654321fedcba09876543',
    studentName: 'Sarah Johnson',
  },
  {
    id: 'cert-3',
    courseTitle: 'Product Management Excellence',
    issueDate: 'November 10, 2025',
    certificateType: 'Specialization',
    grade: 3.8,
    issuerName: 'NexSkill LMS',
    blockchainHash: '0xabcdef1234567890fedcba0987654321abcdef12',
    studentName: 'Sarah Johnson',
  },
  {
    id: 'cert-4',
    courseTitle: 'Career Transition Coaching',
    issueDate: 'November 5, 2025',
    certificateType: 'Coaching',
    issuerName: 'NexSkill LMS',
    blockchainHash: '0x567890abcdef1234567890abcdef1234567890ab',
    studentName: 'Sarah Johnson',
  },
  {
    id: 'cert-5',
    courseTitle: 'Data Analytics with Python',
    issueDate: 'October 28, 2025',
    certificateType: 'Course completion',
    score: 91,
    issuerName: 'NexSkill LMS',
    blockchainHash: '0xfedcba0987654321fedcba0987654321fedcba09',
    studentName: 'Sarah Johnson',
  },
  {
    id: 'cert-6',
    courseTitle: 'Full Stack Web Development',
    issueDate: 'October 15, 2025',
    certificateType: 'Specialization',
    grade: 4.0,
    issuerName: 'NexSkill LMS',
    blockchainHash: '0x1234567890abcdef1234567890abcdef12345678',
    studentName: 'Sarah Johnson',
  },
];

type FilterType = 'All' | 'Courses' | 'Specializations' | 'Coaching';
type SortType = 'Newest' | 'Oldest' | 'Course name A–Z';

const CertificatesList: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('All');
  const [sort, setSort] = useState<SortType>('Newest');

  // Filter certificates
  const filteredCertificates = allCertificates.filter((cert) => {
    if (filter === 'All') return true;
    if (filter === 'Courses') return cert.certificateType === 'Course completion';
    if (filter === 'Specializations') return cert.certificateType === 'Specialization';
    if (filter === 'Coaching') return cert.certificateType === 'Coaching';
    return true;
  });

  // Sort certificates
  const sortedCertificates = [...filteredCertificates].sort((a, b) => {
    if (sort === 'Newest') {
      return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();
    }
    if (sort === 'Oldest') {
      return new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
    }
    if (sort === 'Course name A–Z') {
      return a.courseTitle.localeCompare(b.courseTitle);
    }
    return 0;
  });

  const filterOptions: FilterType[] = ['All', 'Courses', 'Specializations', 'Coaching'];

  return (
    <StudentAppLayout>
      <div className="flex-1 overflow-y-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Certificates & achievements</h1>
          <p className="text-lg text-slate-600">Review, download, and share your accomplishments</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="text-3xl font-bold text-[#304DB5] mb-1">{allCertificates.length}</div>
            <div className="text-sm text-slate-600">Total certificates</div>
          </div>
          <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="text-3xl font-bold text-[#304DB5] mb-1">
              {allCertificates.filter((c) => c.certificateType === 'Course completion').length}
            </div>
            <div className="text-sm text-slate-600">Course completions</div>
          </div>
          <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="text-3xl font-bold text-[#304DB5] mb-1">
              {allCertificates.filter((c) => c.certificateType === 'Specialization').length}
            </div>
            <div className="text-sm text-slate-600">Specializations</div>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setFilter(option)}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                    filter === option
                      ? 'bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Sort by:</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortType)}
                className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm font-medium"
              >
                <option value="Newest">Newest</option>
                <option value="Oldest">Oldest</option>
                <option value="Course name A–Z">Course name A–Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-slate-600">
            Showing {sortedCertificates.length} of {allCertificates.length} certificates
          </p>
        </div>

        {/* Certificates Grid */}
        {sortedCertificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedCertificates.map((certificate) => (
              <CertificateCard key={certificate.id} certificate={certificate} />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="text-slate-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            </div>
            <p className="text-lg text-slate-600 mb-2">No certificates found</p>
            <p className="text-sm text-slate-500">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </StudentAppLayout>
  );
};

export default CertificatesList;
