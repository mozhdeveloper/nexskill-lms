import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CertificateCard from '../../components/certificates/CertificateCard';
import { supabase } from '../../lib/supabaseClient';

interface Certificate {
  id: string;
  courseTitle: string;
  issueDate: string;
  certificateType: string;
  issuerName: string;
  studentName: string;
}

type FilterType = 'All' | 'Courses';
type SortType = 'Newest' | 'Oldest' | 'Course name A–Z';

const CertificatesList: React.FC = () => {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('All');
  const [sort, setSort] = useState<SortType>('Newest');

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch student's display name
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();
        const studentName = profile ? `${profile.first_name} ${profile.last_name}` : 'Student';

        // Fetch enrollments with nested course → module → content items
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('course_id, enrolled_at, courses(id, title, modules(id, module_content_items(content_type, content_id)))')
          .eq('profile_id', user.id);

        if (!enrollments?.length) return;

        // Build a map: courseId → lessonIds[]
        const courseData = (enrollments as any[]).map((en) => {
          const course = en.courses;
          const lessonIds: string[] = [];
          for (const mod of course?.modules ?? []) {
            for (const item of mod?.module_content_items ?? []) {
              if (item.content_type === 'lesson') lessonIds.push(item.content_id);
            }
          }
          return { courseId: course?.id as string, courseTitle: course?.title as string, lessonIds };
        });

        const allLessonIds = [...new Set(courseData.flatMap((c) => c.lessonIds))];
        if (!allLessonIds.length) return;

        // Fetch completed lessons for this student
        const { data: progress } = await supabase
          .from('user_lesson_progress')
          .select('lesson_id, completed_at')
          .eq('user_id', user.id)
          .eq('is_completed', true)
          .in('lesson_id', allLessonIds);

        const completedIds = new Set((progress ?? []).map((p: any) => p.lesson_id));

        // Find the date of the last completed lesson for issue date
        const lastCompletedAt = (progress ?? []).reduce((latest: string | null, p: any) => {
          if (!latest || (p.completed_at && p.completed_at > latest)) return p.completed_at as string;
          return latest;
        }, null);

        // Build a certificate for each fully completed course
        const certs: Certificate[] = [];
        for (const c of courseData) {
          if (!c.lessonIds.length) continue;
          const completedCount = c.lessonIds.filter((id) => completedIds.has(id)).length;
          if (completedCount < c.lessonIds.length) continue;

          const issueDate = lastCompletedAt
            ? new Date(lastCompletedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

          certs.push({
            id: c.courseId,
            courseTitle: c.courseTitle,
            issueDate,
            certificateType: 'Course completion',
            issuerName: 'NexSkill LMS',
            studentName,
          });
        }

        setCertificates(certs);
      } catch (err) {
        console.error('Error fetching certificates:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, []);

  const filteredCertificates = certificates.filter((cert) => {
    if (filter === 'All') return true;
    if (filter === 'Courses') return cert.certificateType === 'Course completion';
    return true;
  });

  const sortedCertificates = [...filteredCertificates].sort((a, b) => {
    if (sort === 'Newest') return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();
    if (sort === 'Oldest') return new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
    if (sort === 'Course name A–Z') return a.courseTitle.localeCompare(b.courseTitle);
    return 0;
  });

  const filterOptions: FilterType[] = ['All', 'Courses'];

  if (loading) {
    return (
      <div className="min-h-screen bg-[color:var(--bg-primary)] flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🎓</div>
          <p className="text-lg text-[color:var(--text-secondary)]">Loading your achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg-primary)]">
      {/* Back Button */}
      <div className="px-8 py-4">
        <button
          onClick={() => navigate('/student/my-courses')}
          className="flex items-center gap-2 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to My Courses</span>
        </button>
      </div>

      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[color:var(--text-primary)] mb-3">Certificates & achievements</h1>
          <p className="text-lg text-[color:var(--text-secondary)]">Review, download, and share your accomplishments</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="text-3xl font-bold text-[#304DB5] dark:text-blue-400 mb-1">{certificates.length}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Total certificates</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="text-3xl font-bold text-[#304DB5] dark:text-blue-400 mb-1">
              {certificates.filter((c) => c.certificateType === 'Course completion').length}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Course completions</div>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8">
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
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Sort by:</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortType)}
                className="px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-600 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 text-sm font-medium text-slate-900 dark:text-white"
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
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Showing {sortedCertificates.length} of {certificates.length} certificates
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
            <div className="text-slate-400 dark:text-slate-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-2">No certificates yet</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Complete all lessons in a course to earn your certificate.
            </p>
            <button
              onClick={() => navigate('/student/courses')}
              className="px-6 py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all"
            >
              Browse courses
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificatesList;
