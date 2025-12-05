import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import CertificateViewer from '../../components/certificates/CertificateViewer';
import CertificateShareBar from '../../components/certificates/CertificateShareBar';
import BlockchainVerificationBadge from '../../components/certificates/BlockchainVerificationBadge';

// Dummy certificates data (same as in CertificatesList)
const certificatesData: Record<string, any> = {
  'cert-1': {
    id: 'cert-1',
    courseTitle: 'UI Design Fundamentals',
    issueDate: 'December 1, 2025',
    certificateType: 'Course completion',
    score: 94,
    issuerName: 'NexSkill LMS',
    blockchainHash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
    studentName: 'Sarah Johnson',
  },
  'cert-2': {
    id: 'cert-2',
    courseTitle: 'JavaScript Mastery',
    issueDate: 'November 20, 2025',
    certificateType: 'Course completion',
    score: 89,
    issuerName: 'NexSkill LMS',
    blockchainHash: '0x9876543210fedcba0987654321fedcba09876543',
    studentName: 'Sarah Johnson',
  },
  'cert-3': {
    id: 'cert-3',
    courseTitle: 'Product Management Excellence',
    issueDate: 'November 10, 2025',
    certificateType: 'Specialization',
    grade: 3.8,
    issuerName: 'NexSkill LMS',
    blockchainHash: '0xabcdef1234567890fedcba0987654321abcdef12',
    studentName: 'Sarah Johnson',
  },
  'cert-4': {
    id: 'cert-4',
    courseTitle: 'Career Transition Coaching',
    issueDate: 'November 5, 2025',
    certificateType: 'Coaching',
    issuerName: 'NexSkill LMS',
    blockchainHash: '0x567890abcdef1234567890abcdef1234567890ab',
    studentName: 'Sarah Johnson',
  },
  'cert-5': {
    id: 'cert-5',
    courseTitle: 'Data Analytics with Python',
    issueDate: 'October 28, 2025',
    certificateType: 'Course completion',
    score: 91,
    issuerName: 'NexSkill LMS',
    blockchainHash: '0xfedcba0987654321fedcba0987654321fedcba09',
    studentName: 'Sarah Johnson',
  },
  'cert-6': {
    id: 'cert-6',
    courseTitle: 'Full Stack Web Development',
    issueDate: 'October 15, 2025',
    certificateType: 'Specialization',
    grade: 4.0,
    issuerName: 'NexSkill LMS',
    blockchainHash: '0x1234567890abcdef1234567890abcdef12345678',
    studentName: 'Sarah Johnson',
  },
};

const CertificateDetail: React.FC = () => {
  const { certificateId } = useParams<{ certificateId: string }>();
  const navigate = useNavigate();
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);

  const certificate = certificateId ? certificatesData[certificateId] : null;

  if (!certificate) {
    return (
      <StudentAppLayout>
        <div className="flex-1 overflow-y-auto p-8">
          <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <p className="text-lg text-slate-600 mb-4">Certificate not found</p>
            <button
              onClick={() => navigate('/student/certificates')}
              className="px-6 py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all"
            >
              Back to certificates
            </button>
          </div>
        </div>
      </StudentAppLayout>
    );
  }

  const handleDownload = () => {
    console.log('Download certificate:', certificate.id);
    // Simulate download
    setDownloadStatus('downloading');
    setTimeout(() => {
      setDownloadStatus('success');
      setTimeout(() => setDownloadStatus(null), 3000);
    }, 1500);
  };

  const handleViewVerification = () => {
    navigate(`/certificates/verify/${certificate.blockchainHash}`);
  };

  return (
    <StudentAppLayout>
      <div className="flex-1 overflow-y-auto p-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/student/certificates')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to certificates
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{certificate.courseTitle}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>Issued on {certificate.issueDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                />
              </svg>
              <span>Certificate ID: {certificate.id}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Issued by {certificate.issuerName}</span>
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Certificate Viewer */}
          <div className="lg:col-span-2">
            <CertificateViewer
              certificate={{
                courseTitle: certificate.courseTitle,
                studentName: certificate.studentName,
                issueDate: certificate.issueDate,
                issuerName: certificate.issuerName,
                certificateType: certificate.certificateType,
              }}
            />
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Download Section */}
            <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Download</h3>
              <button
                onClick={handleDownload}
                disabled={downloadStatus === 'downloading'}
                className={`w-full py-3 px-6 font-semibold rounded-full transition-all flex items-center justify-center gap-2 ${
                  downloadStatus === 'downloading'
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white hover:shadow-lg'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                {downloadStatus === 'downloading' ? 'Downloading...' : 'Download PDF'}
              </button>
              {downloadStatus === 'success' && (
                <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg text-center">
                  <span className="text-sm font-medium text-green-700">Download complete!</span>
                </div>
              )}
              <p className="mt-3 text-xs text-slate-500 text-center">
                High-quality PDF suitable for printing
              </p>
            </div>

            {/* Share Section */}
            <CertificateShareBar certificateId={certificate.id} />

            {/* Blockchain Verification */}
            <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Blockchain verification</h3>
              <div className="mb-4">
                <BlockchainVerificationBadge
                  status="verified"
                  hash={certificate.blockchainHash}
                  onViewVerification={handleViewVerification}
                />
              </div>
              <p className="text-xs text-slate-600 mb-4">
                This certificate is permanently recorded on the blockchain for authenticity verification.
              </p>
              <button
                onClick={handleViewVerification}
                className="w-full py-2.5 px-4 text-[#304DB5] font-medium rounded-full border-2 border-[#304DB5] hover:bg-blue-50 transition-all"
              >
                View verification page
              </button>
            </div>

            {/* Certificate Info */}
            {(certificate.score || certificate.grade) && (
              <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Performance</h3>
                {certificate.score && (
                  <div className="mb-3">
                    <div className="text-sm text-slate-600 mb-1">Final Score</div>
                    <div className="text-3xl font-bold text-[#304DB5]">{certificate.score}%</div>
                  </div>
                )}
                {certificate.grade && (
                  <div>
                    <div className="text-sm text-slate-600 mb-1">Grade</div>
                    <div className="text-3xl font-bold text-[#304DB5]">{certificate.grade}/4.0</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default CertificateDetail;
