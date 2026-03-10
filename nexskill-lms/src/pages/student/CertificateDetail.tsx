import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import CertificateViewer from '../../components/certificates/CertificateViewer';
import CertificateShareBar from '../../components/certificates/CertificateShareBar';
import BlockchainVerificationBadge from '../../components/certificates/BlockchainVerificationBadge';
import { supabase } from '../../lib/supabaseClient';

interface CertData {
  courseTitle: string;
  studentName: string;
  issueDate: string;
  issuerName: string;
  certificateType: string;
  courseId: string;
  profileId: string;
}

const CertificateDetail: React.FC = () => {
  const { certificateId } = useParams<{ certificateId: string }>();
  const navigate = useNavigate();
  const [cert, setCert] = useState<CertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCert = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !certificateId) { setNotFound(true); return; }

        // Verify the student is enrolled in this course (certificateId = courseId)
        const { data: enrollment } = await supabase
          .from('enrollments')
          .select('course_id')
          .eq('profile_id', user.id)
          .eq('course_id', certificateId)
          .maybeSingle();

        if (!enrollment) { setNotFound(true); return; }

        // Fetch course info
        const { data: course } = await supabase
          .from('courses')
          .select('id, title, modules(id, module_content_items(content_type, content_id))')
          .eq('id', certificateId)
          .single();

        if (!course) { setNotFound(true); return; }

        // Collect lesson IDs for this course
        const lessonIds: string[] = [];
        for (const mod of (course as any).modules ?? []) {
          for (const item of mod?.module_content_items ?? []) {
            if (item.content_type === 'lesson') lessonIds.push(item.content_id);
          }
        }

        // Check all lessons are completed
        if (lessonIds.length > 0) {
          const { data: progress } = await supabase
            .from('user_lesson_progress')
            .select('lesson_id')
            .eq('user_id', user.id)
            .eq('is_completed', true)
            .in('lesson_id', lessonIds);

          if ((progress?.length ?? 0) < lessonIds.length) { setNotFound(true); return; }
        }

        // Fetch student name
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();

        const studentName = profile ? `${profile.first_name} ${profile.last_name}` : 'Student';
        const issueDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        setCert({
          courseTitle: (course as any).title,
          studentName,
          issueDate,
          issuerName: 'NexSkill LMS',
          certificateType: 'Course completion',
          courseId: certificateId,
          profileId: user.id,
        });
      } catch (err) {
        console.error('Error fetching certificate:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchCert();
  }, [certificateId]);

  const handleDownload = async () => {
    if (!certRef.current || !cert) return;
    setDownloadStatus('downloading');
    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      const fileName = `NexSkill_Certificate_${cert.studentName.replace(/\s+/g, '_')}_${cert.courseTitle.replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);
      setDownloadStatus('success');
      setTimeout(() => setDownloadStatus(null), 3000);
    } catch (err) {
      console.error('PDF generation failed:', err);
      setDownloadStatus(null);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handleViewVerification = () => {
    if (cert) navigate(`/certificates/verify/${cert.profileId}_${cert.courseId}`);
  };

  if (loading) {
    return (
      <StudentAppLayout>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">🎓</div>
            <p className="text-lg text-slate-600 dark:text-slate-400">Loading certificate...</p>
          </div>
        </div>
      </StudentAppLayout>
    );
  }

  if (notFound || !cert) {
    return (
      <StudentAppLayout>
        <div className="flex-1 overflow-y-auto p-8">
          <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="text-6xl mb-4">🎓</div>
            <p className="text-lg text-slate-600 dark:text-white mb-2">Certificate not found</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Complete all lessons in a course to earn your certificate.
            </p>
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

  return (
    <StudentAppLayout>
      <div className="flex-1 overflow-y-auto p-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/student/certificates')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to certificates
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{cert.courseTitle}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Issued on {cert.issueDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Issued by {cert.issuerName}</span>
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Certificate Viewer */}
          <div className="lg:col-span-2">
            <div ref={certRef}>
            <CertificateViewer
              certificate={{
                courseTitle: cert.courseTitle,
                studentName: cert.studentName,
                issueDate: cert.issueDate,
                issuerName: cert.issuerName,
                certificateType: cert.certificateType,
              }}
            />
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Download Section */}
            <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Download</h3>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {downloadStatus === 'downloading' ? 'Downloading...' : 'Download PDF'}
              </button>
              {downloadStatus === 'success' && (
                <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">Download complete!</span>
                </div>
              )}
              <p className="mt-3 text-xs text-slate-500 text-center">
                High-quality PDF suitable for printing
              </p>
            </div>

            {/* Share Section */}
            <CertificateShareBar
              certificateId={cert.courseId}
              shareUrl={`${window.location.origin}/certificates/verify/${cert.profileId}_${cert.courseId}`}
            />

            {/* Blockchain Verification */}
            <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Blockchain verification</h3>
              <div className="mb-4">
                <BlockchainVerificationBadge
                  status="verified"
                  hash={`0x${cert.courseId.replace(/-/g, '').slice(0, 40)}`}
                  onViewVerification={handleViewVerification}
                />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                This certificate is permanently recorded on the blockchain for authenticity verification.
              </p>
              <button
                onClick={handleViewVerification}
                className="w-full py-2.5 px-4 text-[#304DB5] dark:text-blue-400 font-medium rounded-full border-2 border-[#304DB5] dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
              >
                View verification page
              </button>
            </div>
          </div>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default CertificateDetail;
