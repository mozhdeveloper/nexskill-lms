import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

interface CertInfo {
  studentName: string;
  courseTitle: string;
  issueDate: string;
  issuerName: string;
  certificateType: string;
}

const CertificateVerify: React.FC = () => {
  const { hash } = useParams<{ hash: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState<CertInfo | null>(null);

  useEffect(() => {
    if (!hash) { setLoading(false); return; }
    const verify = async () => {
      try {
        // Hash format: profileId_courseId (UUIDs separated by underscore)
        const sepIdx = hash.indexOf('_');
        if (sepIdx < 1) { setLoading(false); return; }
        const profileId = hash.slice(0, sepIdx);
        const courseId = hash.slice(sepIdx + 1);

        const { data: enrollment } = await supabase
          .from('enrollments')
          .select(`
            enrolled_at,
            profile_id,
            course_id,
            profiles:profile_id ( first_name, last_name ),
            courses:course_id ( title )
          `)
          .eq('profile_id', profileId)
          .eq('course_id', courseId)
          .maybeSingle();

        if (!enrollment) { setLoading(false); return; }

        const profile = (enrollment as any).profiles;
        const course = (enrollment as any).courses;

        setCertificate({
          studentName: `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() || 'Student',
          courseTitle: course?.title ?? 'Course',
          issueDate: new Date(enrollment.enrolled_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
          }),
          issuerName: 'NexSkill LMS',
          certificateType: 'Course completion',
        });
      } catch {
        // not found
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [hash]);

  const isVerified = !!certificate;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E7F0FF] via-[#F9F0FF] to-[#E3F4FF] flex items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#304DB5]" />
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-background-card rounded-3xl shadow-2xl p-8 md:p-12">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#304DB5] to-[#5E7BFF] flex items-center justify-center">
              <span className="text-white font-bold text-3xl">N</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Certificate Verification</h1>
            <p className="text-slate-600">NexSkill LMS authenticity verification</p>
          </div>

          {/* Hash Display */}
          <div className="bg-slate-50 rounded-xl p-4 mb-8">
            <div className="text-xs font-semibold text-slate-600 mb-2">Certificate ID:</div>
            <div className="text-sm font-mono text-slate-900 break-all">{hash || 'No ID provided'}</div>
          </div>

          {/* Verification Status */}
          {isVerified ? (
            <div>
              {/* Success Status */}
              <div className="mb-8 p-6 bg-green-50 border-2 border-green-200 rounded-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
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
                    <div className="text-lg font-bold text-slate-900">{certificate!.studentName}</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="text-xs font-semibold text-slate-600 mb-1">Issue Date</div>
                    <div className="text-lg font-bold text-slate-900">{certificate!.issueDate}</div>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="text-xs font-semibold text-slate-600 mb-1">Course Title</div>
                  <div className="text-xl font-bold text-[#304DB5]">{certificate!.courseTitle}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="text-xs font-semibold text-slate-600 mb-1">Certificate Type</div>
                    <div className="text-lg font-semibold text-slate-900">{certificate!.certificateType}</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="text-xs font-semibold text-slate-600 mb-1">Issued By</div>
                    <div className="text-lg font-semibold text-slate-900">{certificate!.issuerName}</div>
                  </div>
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
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-red-700">Not Verified</h2>
                    <p className="text-sm text-red-600">This certificate ID was not found in our records</p>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-slate-50 rounded-xl mb-6">
                <h3 className="text-lg font-bold text-slate-900 mb-3">Possible reasons:</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2"><span className="text-slate-400 mt-1">•</span><span>The certificate ID is incorrect or incomplete</span></li>
                  <li className="flex items-start gap-2"><span className="text-slate-400 mt-1">•</span><span>The certificate has not been issued yet</span></li>
                  <li className="flex items-start gap-2"><span className="text-slate-400 mt-1">•</span><span>The certificate was not issued by NexSkill LMS</span></li>
                </ul>
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={() => navigate('/student/courses')} className="flex-1 py-3 px-6 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all">
              Explore courses
            </button>
            <button onClick={() => navigate('/')} className="flex-1 py-3 px-6 text-[#304DB5] font-medium rounded-full border-2 border-[#304DB5] hover:bg-blue-50 transition-all">
              Visit NexSkill
            </button>
          </div>
        </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-600">
            NexSkill LMS — Certificate Authenticity Verification
          </p>
        </div>
      </div>
    </div>
  );
};

export default CertificateVerify;
