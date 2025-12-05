import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Dummy verification database
const verifiedCertificates: Record<string, any> = {
  '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12': {
    studentName: 'Sarah Johnson',
    courseTitle: 'UI Design Fundamentals',
    issueDate: 'December 1, 2025',
    issuerName: 'NexSkill LMS',
    certificateType: 'Course completion',
    score: 94,
  },
  '0x9876543210fedcba0987654321fedcba09876543': {
    studentName: 'Sarah Johnson',
    courseTitle: 'JavaScript Mastery',
    issueDate: 'November 20, 2025',
    issuerName: 'NexSkill LMS',
    certificateType: 'Course completion',
    score: 89,
  },
  '0xabcdef1234567890fedcba0987654321abcdef12': {
    studentName: 'Sarah Johnson',
    courseTitle: 'Product Management Excellence',
    issueDate: 'November 10, 2025',
    issuerName: 'NexSkill LMS',
    certificateType: 'Specialization',
  },
  '0x567890abcdef1234567890abcdef1234567890ab': {
    studentName: 'Sarah Johnson',
    courseTitle: 'Career Transition Coaching',
    issueDate: 'November 5, 2025',
    issuerName: 'NexSkill LMS',
    certificateType: 'Coaching',
  },
  '0xfedcba0987654321fedcba0987654321fedcba09': {
    studentName: 'Sarah Johnson',
    courseTitle: 'Data Analytics with Python',
    issueDate: 'October 28, 2025',
    issuerName: 'NexSkill LMS',
    certificateType: 'Course completion',
    score: 91,
  },
  '0x1234567890abcdef1234567890abcdef12345678': {
    studentName: 'Sarah Johnson',
    courseTitle: 'Full Stack Web Development',
    issueDate: 'October 15, 2025',
    issuerName: 'NexSkill LMS',
    certificateType: 'Specialization',
  },
};

const CertificateVerify: React.FC = () => {
  const { hash } = useParams<{ hash: string }>();
  const navigate = useNavigate();

  const certificate = hash ? verifiedCertificates[hash] : null;
  const isVerified = !!certificate;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E7F0FF] via-[#F9F0FF] to-[#E3F4FF] flex items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        {/* Main Card */}
        <div className="bg-white dark:bg-dark-background-card rounded-3xl shadow-2xl p-8 md:p-12">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#304DB5] to-[#5E7BFF] flex items-center justify-center">
              <span className="text-white font-bold text-3xl">N</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Certificate Verification</h1>
            <p className="text-slate-600">Blockchain-powered authenticity verification</p>
          </div>

          {/* Hash Display */}
          <div className="bg-slate-50 rounded-xl p-4 mb-8">
            <div className="text-xs font-semibold text-slate-600 mb-2">Certificate Hash:</div>
            <div className="text-sm font-mono text-slate-900 break-all">{hash || 'No hash provided'}</div>
          </div>

          {/* Verification Status */}
          {isVerified ? (
            <div>
              {/* Success Status */}
              <div className="mb-8 p-6 bg-green-50 border-2 border-green-200 rounded-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-green-700">Verified</h2>
                    <p className="text-sm text-green-600">This certificate is authentic and valid</p>
                  </div>
                </div>
              </div>

              {/* Certificate Details */}
              <div className="space-y-4 mb-8">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Certificate Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="text-xs font-semibold text-slate-600 mb-1">Student Name</div>
                    <div className="text-lg font-bold text-slate-900">{certificate.studentName}</div>
                  </div>
                  
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="text-xs font-semibold text-slate-600 mb-1">Issue Date</div>
                    <div className="text-lg font-bold text-slate-900">{certificate.issueDate}</div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="text-xs font-semibold text-slate-600 mb-1">Course Title</div>
                  <div className="text-xl font-bold text-[#304DB5]">{certificate.courseTitle}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="text-xs font-semibold text-slate-600 mb-1">Certificate Type</div>
                    <div className="text-lg font-semibold text-slate-900">{certificate.certificateType}</div>
                  </div>
                  
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="text-xs font-semibold text-slate-600 mb-1">Issued By</div>
                    <div className="text-lg font-semibold text-slate-900">{certificate.issuerName}</div>
                  </div>
                </div>

                {certificate.score && (
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <div className="text-xs font-semibold text-blue-600 mb-1">Final Score</div>
                    <div className="text-2xl font-bold text-blue-700">{certificate.score}%</div>
                  </div>
                )}
              </div>

              {/* Verification Info */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm text-blue-700">
                    This certificate has been permanently recorded on the blockchain and cannot be altered or
                    forged. The verification is cryptographically secure.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Error Status */}
              <div className="mb-8 p-6 bg-red-50 border-2 border-red-200 rounded-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-red-700">Not Verified</h2>
                    <p className="text-sm text-red-600">This certificate hash was not found in our blockchain</p>
                  </div>
                </div>
              </div>

              {/* Error Explanation */}
              <div className="p-6 bg-slate-50 rounded-xl mb-6">
                <h3 className="text-lg font-bold text-slate-900 mb-3">Possible reasons:</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="text-slate-400 mt-1">•</span>
                    <span>The certificate hash is incorrect or incomplete</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-400 mt-1">•</span>
                    <span>The certificate has not been issued yet</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-400 mt-1">•</span>
                    <span>The certificate was not issued by NexSkill LMS</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-400 mt-1">•</span>
                    <span>The certificate may have been revoked</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('/student/courses')}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all"
            >
              Explore courses
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-3 px-6 text-[#304DB5] font-medium rounded-full border-2 border-[#304DB5] hover:bg-blue-50 transition-all"
            >
              Visit NexSkill
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-600">
            Powered by blockchain technology for tamper-proof verification
          </p>
        </div>
      </div>
    </div>
  );
};

export default CertificateVerify;
