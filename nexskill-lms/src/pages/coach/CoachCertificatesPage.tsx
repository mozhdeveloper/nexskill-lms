import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CoachAppLayout from '../../layouts/CoachAppLayout';
import { useUser } from '../../context/UserContext';
import { supabase } from '../../lib/supabaseClient';
import {
  Award, Upload, Save, Eye, ChevronLeft, Palette, Type, PenTool, X, Check, Loader2, Image as ImageIcon, Trash2, Copy, CheckCircle2, Plus, BookOpen
} from 'lucide-react';

interface CourseSummary {
  id: string;
  title: string;
  enrollmentCount: number;
}

interface CertificateTemplate {
  courseId: string;
  certificateTitle: string;
  certificateDescription: string;
  issuerName: string;
  issuerTitle: string;
  organizationName: string;
  signatureUrl: string | null;
  logoUrl: string | null;
  borderColor: string;
  accentColor: string;
  showSeal: boolean;
  sealText: string;
  customMessage: string;
}

const defaultTemplate = (_courseTitle: string, coachName: string): Omit<CertificateTemplate, 'courseId'> => ({
  certificateTitle: 'Certificate of Completion',
  certificateDescription: `Has successfully completed all requirements for`,
  issuerName: coachName,
  issuerTitle: 'Course Instructor',
  organizationName: 'NexSkill LMS',
  signatureUrl: null,
  logoUrl: null,
  borderColor: '#304DB5',
  accentColor: '#5E7BFF',
  showSeal: true,
  sealText: 'VERIFIED',
  customMessage: '',
});

const TEMPLATE_TABLE = 'certificate_templates';

const CoachCertificatesPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useUser();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<CourseSummary | null>(null);
  const [template, setTemplate] = useState<CertificateTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'appearance' | 'signature'>('details');
  const [showPreview, setShowPreview] = useState(false);
  const [templateExists, setTemplateExists] = useState(false);
  const [coursesWithTemplates, setCoursesWithTemplates] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [targetCourseId, setTargetCourseId] = useState('');
  const [certTitles, setCertTitles] = useState<Record<string, string>>({});
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const coachName = profile ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() : 'Instructor';

  useEffect(() => {
    if (!profile) return;
    const fetchCourses = async () => {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('id, title')
          .eq('coach_id', profile.id)
          .order('created_at', { ascending: false });
        if (error) throw error;

        const courseIds = (data || []).map((c: any) => c.id);
        let enrollMap: Record<string, number> = {};
        if (courseIds.length) {
          const { data: enrollments } = await supabase
            .from('enrollments')
            .select('course_id')
            .in('course_id', courseIds);
          (enrollments || []).forEach((e: any) => {
            enrollMap[e.course_id] = (enrollMap[e.course_id] || 0) + 1;
          });
        }

        const mapped = (data || []).map((c: any) => ({
          id: c.id,
          title: c.title,
          enrollmentCount: enrollMap[c.id] || 0,
        }));
        setCourses(mapped);

        // Fetch which courses already have a certificate template
        if (courseIds.length) {
          const { data: tmplData } = await supabase
            .from(TEMPLATE_TABLE)
            .select('course_id, certificate_title')
            .in('course_id', courseIds);
          setCoursesWithTemplates(new Set((tmplData || []).map((t: any) => t.course_id)));
          const titles: Record<string, string> = {};
          (tmplData || []).forEach((t: any) => { titles[t.course_id] = t.certificate_title; });
          setCertTitles(titles);
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [profile]);

  const loadTemplate = async (course: CourseSummary) => {
    setSelectedCourse(course);
    setActiveTab('details');
    setSaveSuccess(false);
    try {
      const { data, error } = await supabase
        .from(TEMPLATE_TABLE)
        .select('*')
        .eq('course_id', course.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
        console.error('Error loading template:', error);
      }

      if (data) {
        setTemplateExists(true);
        setTemplate({
          courseId: course.id,
          certificateTitle: data.certificate_title ?? 'Certificate of Completion',
          certificateDescription: data.certificate_description ?? 'Has successfully completed all requirements for',
          issuerName: data.issuer_name ?? coachName,
          issuerTitle: data.issuer_title ?? 'Course Instructor',
          organizationName: data.organization_name ?? 'NexSkill LMS',
          signatureUrl: data.signature_url,
          logoUrl: data.logo_url,
          borderColor: data.border_color ?? '#304DB5',
          accentColor: data.accent_color ?? '#5E7BFF',
          showSeal: data.show_seal ?? true,
          sealText: data.seal_text ?? 'VERIFIED',
          customMessage: data.custom_message ?? '',
        });
      } else {
        setTemplateExists(false);
        setTemplate({
          courseId: course.id,
          ...defaultTemplate(course.title, coachName),
        });
      }
    } catch {
      setTemplateExists(false);
      setTemplate({
        courseId: course.id,
        ...defaultTemplate(course.title, coachName),
      });
    }
  };

  const handleSave = async () => {
    if (!template || !profile) return;
    if (isCreatingNew && !targetCourseId) {
      alert('Please select a course to assign this certificate to.');
      return;
    }
    if (!isCreatingNew && !selectedCourse) return;
    const courseIdToUse = isCreatingNew ? targetCourseId : selectedCourse!.id;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const payload = {
        course_id: courseIdToUse,
        coach_id: profile.id,
        certificate_title: template.certificateTitle,
        certificate_description: template.certificateDescription,
        issuer_name: template.issuerName,
        issuer_title: template.issuerTitle,
        organization_name: template.organizationName,
        signature_url: template.signatureUrl,
        logo_url: template.logoUrl,
        border_color: template.borderColor,
        accent_color: template.accentColor,
        show_seal: template.showSeal,
        seal_text: template.sealText,
        custom_message: template.customMessage,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from(TEMPLATE_TABLE)
        .upsert(payload, { onConflict: 'course_id' });

      if (error) {
        console.warn('Could not save to DB (table may not exist):', error.message);
        localStorage.setItem(`cert_template_${courseIdToUse}`, JSON.stringify(template));
      }
      setSaveSuccess(true);
      setTemplateExists(true);
      setCoursesWithTemplates((prev) => new Set([...prev, courseIdToUse]));
      setCertTitles((prev) => ({ ...prev, [courseIdToUse]: template.certificateTitle }));
      if (isCreatingNew) {
        const assignedCourse = courses.find((c) => c.id === courseIdToUse);
        if (assignedCourse) setSelectedCourse(assignedCourse);
        setIsCreatingNew(false);
        setTargetCourseId('');
      }
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Save error:', err);
      localStorage.setItem(`cert_template_${courseIdToUse}`, JSON.stringify(template));
      setSaveSuccess(true);
      setTemplateExists(true);
      setCoursesWithTemplates((prev) => new Set([...prev, courseIdToUse]));
      setCertTitles((prev) => ({ ...prev, [courseIdToUse]: template.certificateTitle }));
      if (isCreatingNew) {
        const assignedCourse = courses.find((c) => c.id === courseIdToUse);
        if (assignedCourse) setSelectedCourse(assignedCourse);
        setIsCreatingNew(false);
        setTargetCourseId('');
      }
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCourse || !profile) return;
    if (!window.confirm('Remove the certificate template for this course? Students will see the default certificate until a new one is created.')) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from(TEMPLATE_TABLE)
        .delete()
        .eq('course_id', selectedCourse.id);
      if (!error) {
        setTemplateExists(false);
        setCoursesWithTemplates((prev) => {
          const next = new Set(prev);
          next.delete(selectedCourse.id);
          return next;
        });
        // Reset editor to defaults
        setTemplate({ courseId: selectedCourse.id, ...defaultTemplate(selectedCourse.title, coachName) });
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleCopyTo = async (targetCourseId: string) => {
    if (!template || !profile) return;
    const payload = {
      course_id: targetCourseId,
      coach_id: profile.id,
      certificate_title: template.certificateTitle,
      certificate_description: template.certificateDescription,
      issuer_name: template.issuerName,
      issuer_title: template.issuerTitle,
      organization_name: template.organizationName,
      signature_url: template.signatureUrl,
      logo_url: template.logoUrl,
      border_color: template.borderColor,
      accent_color: template.accentColor,
      show_seal: template.showSeal,
      seal_text: template.sealText,
      custom_message: template.customMessage,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from(TEMPLATE_TABLE).upsert(payload, { onConflict: 'course_id' });
    if (!error) {
      setCoursesWithTemplates((prev) => new Set([...prev, targetCourseId]));
    }
    setShowCopyModal(false);
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'signatureUrl' | 'logoUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    const courseIdForPath = isCreatingNew ? (targetCourseId || 'new') : (selectedCourse?.id ?? 'new');

    // Validate file type and size
    const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PNG, JPG, WebP, or SVG image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be under 2MB.');
      return;
    }

    try {
      const ext = file.name.split('.').pop();
      const folder = field === 'signatureUrl' ? 'signatures' : 'logos';
      const path = `certificates/${profile.id}/${folder}/${courseIdForPath}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(path, file, { upsert: true });

      if (uploadError) {
        // Fallback: use local data URL
        const reader = new FileReader();
        reader.onloadend = () => {
          setTemplate((prev) => prev ? { ...prev, [field]: reader.result as string } : prev);
        };
        reader.readAsDataURL(file);
        return;
      }

      const { data: urlData } = supabase.storage.from('public').getPublicUrl(path);
      setTemplate((prev) => prev ? { ...prev, [field]: urlData.publicUrl } : prev);
    } catch {
      // Fallback to data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setTemplate((prev) => prev ? { ...prev, [field]: reader.result as string } : prev);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateTemplate = (key: keyof CertificateTemplate, value: any) => {
    setTemplate((prev) => prev ? { ...prev, [key]: value } : prev);
  };

  const handleAddNew = () => {
    setSelectedCourse(null);
    setIsCreatingNew(true);
    setTemplateExists(false);
    setTargetCourseId('');
    setTemplate({ courseId: '', ...defaultTemplate('', coachName) });
    setActiveTab('details');
    setSaveSuccess(false);
    setShowPreview(false);
  };

  // ---- VIEWS ----

  if (loading) {
    return (
      <CoachAppLayout>
        <div className="flex-1 flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-brand-electric" />
        </div>
      </CoachAppLayout>
    );
  }

  // Course list / create-new view
  if ((!selectedCourse && !isCreatingNew) || !template) {
    return (
      <CoachAppLayout>
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="bg-[color:var(--bg-secondary)] border-b border-[color:var(--border-base)] px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Certificate Creator</h1>
                <p className="text-slate-600 dark:text-slate-400">Design and assign certificates to your courses</p>
              </div>
              <button
                onClick={handleAddNew}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                Add Certificate
              </button>
            </div>
          </div>

          <div className="p-8">
            {courses.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                <Award className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No courses yet</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">Create a course first to customize its certificate.</p>
                <button
                  onClick={() => navigate('/coach/courses/new')}
                  className="px-6 py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                >
                  + Create New Course
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                  Click a course to edit its certificate, or use &ldquo;Add Certificate&rdquo; to create a new one:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courses.map((course) => (
                    <button
                      key={course.id}
                      onClick={() => loadTemplate(course)}
                      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 text-left hover:border-[#304DB5] hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-[#304DB5]/10 to-[#5E7BFF]/10 group-hover:from-[#304DB5]/20 group-hover:to-[#5E7BFF]/20 transition-colors">
                          <Award className="w-6 h-6 text-[#304DB5]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 dark:text-white mb-1 truncate group-hover:text-[#304DB5] transition-colors">
                            {course.title}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {course.enrollmentCount} student{course.enrollmentCount !== 1 ? 's' : ''} enrolled
                            </p>
                            {coursesWithTemplates.has(course.id) ? (
                              <>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                                  <CheckCircle2 className="w-3 h-3" /> Assigned
                                </span>
                                {certTitles[course.id] && (
                                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[120px]" title={certTitles[course.id]}>
                                    &ldquo;{certTitles[course.id]}&rdquo;
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-amber-600 dark:text-amber-400">No certificate yet</span>
                            )}
                          </div>
                        </div>
                        <PenTool className="w-4 h-4 text-slate-400 group-hover:text-[#304DB5] transition-colors flex-shrink-0 mt-1" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CoachAppLayout>
    );
  }

  // Certificate editor
  return (
    <CoachAppLayout>
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-[color:var(--bg-secondary)] border-b border-[color:var(--border-base)] px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => { setSelectedCourse(null); setTemplate(null); setIsCreatingNew(false); setTargetCourseId(''); }}
                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {isCreatingNew ? 'New Certificate' : selectedCourse!.title}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {isCreatingNew ? 'Fill in the details and assign to a course' : 'Edit certificate template'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Assignment status badge */}
              {templateExists ? (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Certificate Assigned
                </span>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-medium">
                  Not yet assigned
                </span>
              )}

              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
              >
                <Eye className="w-4 h-4" />
                {showPreview ? 'Hide Preview' : 'Preview'}
              </button>

              {/* Copy to another course */}
              {templateExists && (
                <button
                  onClick={() => setShowCopyModal(true)}
                  title="Copy this template to another course"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
                >
                  <Copy className="w-4 h-4" /> Copy to Course
                </button>
              )}

              {/* Delete template */}
              {templateExists && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  title="Remove certificate assignment"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium disabled:opacity-60"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {deleting ? 'Removing...' : 'Remove'}
                </button>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white hover:shadow-lg transition-all text-sm font-semibold disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : saveSuccess ? 'Assigned!' : templateExists ? 'Update Certificate' : 'Assign to Course'}
              </button>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className={`grid gap-8 ${showPreview ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 max-w-3xl'}`}>
            {/* Editor Panel */}
            <div className="space-y-6">
              {/* Course Assignment */}
              {isCreatingNew ? (
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Assign to Course <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    Select which course this certificate will be awarded for. Each course can only have one certificate template.
                  </p>
                  {courses.length === 0 ? (
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      You have no courses yet. Create a course first before assigning a certificate.
                    </p>
                  ) : (
                    <select
                      value={targetCourseId}
                      onChange={(e) => setTargetCourseId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-[#304DB5] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:outline-none transition-colors"
                    >
                      <option value="">-- Select a course --</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}{coursesWithTemplates.has(c.id) ? ' (already has a certificate — will replace)' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  {targetCourseId && coursesWithTemplates.has(targetCourseId) && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                      ⚠ This course already has a certificate. Saving will replace it.
                    </p>
                  )}
                </div>
              ) : selectedCourse ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <Award className="w-4 h-4 text-[#304DB5] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Assigned to course</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{selectedCourse.title}</p>
                  </div>
                  {templateExists && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                </div>
              ) : null}

              {/* Tabs */}
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                {[
                  { key: 'details' as const, label: 'Details', icon: Type },
                  { key: 'appearance' as const, label: 'Appearance', icon: Palette },
                  { key: 'signature' as const, label: 'Signature & Logo', icon: PenTool },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                      activeTab === key
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Details Tab */}
              {activeTab === 'details' && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Type className="w-5 h-5 text-[#304DB5]" />
                    Certificate Details
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Certificate Title</label>
                    <input
                      type="text"
                      value={template.certificateTitle}
                      onChange={(e) => updateTemplate('certificateTitle', e.target.value)}
                      placeholder="Certificate of Completion"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-[#304DB5] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description Text</label>
                    <textarea
                      value={template.certificateDescription}
                      onChange={(e) => updateTemplate('certificateDescription', e.target.value)}
                      placeholder="Has successfully completed all requirements for"
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-[#304DB5] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Issuer Name</label>
                      <input
                        type="text"
                        value={template.issuerName}
                        onChange={(e) => updateTemplate('issuerName', e.target.value)}
                        placeholder="Your Name"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-[#304DB5] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Issuer Title</label>
                      <input
                        type="text"
                        value={template.issuerTitle}
                        onChange={(e) => updateTemplate('issuerTitle', e.target.value)}
                        placeholder="Course Instructor"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-[#304DB5] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Organization Name</label>
                    <input
                      type="text"
                      value={template.organizationName}
                      onChange={(e) => updateTemplate('organizationName', e.target.value)}
                      placeholder="NexSkill LMS"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-[#304DB5] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Custom Message (optional)</label>
                    <textarea
                      value={template.customMessage}
                      onChange={(e) => updateTemplate('customMessage', e.target.value)}
                      placeholder="Congratulations on completing this course! You have demonstrated exceptional skill and dedication..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-[#304DB5] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:outline-none transition-colors resize-none"
                    />
                    <p className="text-xs text-slate-400 mt-1">Shown below the course title on the certificate</p>
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Palette className="w-5 h-5 text-[#304DB5]" />
                    Certificate Appearance
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Border Color</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={template.borderColor}
                          onChange={(e) => updateTemplate('borderColor', e.target.value)}
                          className="w-12 h-12 rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={template.borderColor}
                          onChange={(e) => updateTemplate('borderColor', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:border-[#304DB5]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Accent Color</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={template.accentColor}
                          onChange={(e) => updateTemplate('accentColor', e.target.value)}
                          className="w-12 h-12 rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={template.accentColor}
                          onChange={(e) => updateTemplate('accentColor', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:border-[#304DB5]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Color Presets */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Quick Color Presets</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { name: 'Classic Blue', border: '#304DB5', accent: '#5E7BFF' },
                        { name: 'Royal Purple', border: '#6B21A8', accent: '#A855F7' },
                        { name: 'Emerald', border: '#047857', accent: '#10B981' },
                        { name: 'Gold', border: '#92400E', accent: '#F59E0B' },
                        { name: 'Crimson', border: '#991B1B', accent: '#EF4444' },
                        { name: 'Midnight', border: '#1E293B', accent: '#475569' },
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => {
                            updateTemplate('borderColor', preset.border);
                            updateTemplate('accentColor', preset.accent);
                          }}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-400 transition-colors text-xs font-medium text-slate-700 dark:text-slate-300"
                        >
                          <div className="flex gap-0.5">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.border }} />
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.accent }} />
                          </div>
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-700 pt-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Show Verification Seal</label>
                        <p className="text-xs text-slate-400">Gold seal badge displayed on the certificate</p>
                      </div>
                      <button
                        onClick={() => updateTemplate('showSeal', !template.showSeal)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${template.showSeal ? 'bg-[#304DB5]' : 'bg-slate-300 dark:bg-slate-600'}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${template.showSeal ? 'left-[26px]' : 'left-0.5'}`} />
                      </button>
                    </div>
                    {template.showSeal && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Seal Text</label>
                        <input
                          type="text"
                          value={template.sealText}
                          onChange={(e) => updateTemplate('sealText', e.target.value)}
                          placeholder="VERIFIED"
                          maxLength={12}
                          className="w-48 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-[#304DB5] focus:outline-none text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Signature & Logo Tab */}
              {activeTab === 'signature' && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <PenTool className="w-5 h-5 text-[#304DB5]" />
                    Signature & Logo
                  </h3>

                  {/* Signature Upload */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Signature Image</label>
                    <p className="text-xs text-slate-400 mb-3">Upload your handwritten signature (PNG or SVG with transparent background recommended). Max 2MB.</p>
                    {template.signatureUrl ? (
                      <div className="flex items-center gap-4">
                        <div className="h-20 w-48 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600 flex items-center justify-center bg-white dark:bg-slate-900 p-2">
                          <img src={template.signatureUrl} alt="Signature" className="max-h-full max-w-full object-contain" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => signatureInputRef.current?.click()}
                            className="text-sm text-[#304DB5] hover:underline font-medium"
                          >
                            Replace
                          </button>
                          <button
                            onClick={() => updateTemplate('signatureUrl', null)}
                            className="text-sm text-red-500 hover:underline font-medium flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => signatureInputRef.current?.click()}
                        className="w-full h-28 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-[#304DB5] hover:text-[#304DB5] transition-colors"
                      >
                        <Upload className="w-6 h-6" />
                        <span className="text-sm font-medium">Upload Signature</span>
                      </button>
                    )}
                    <input
                      ref={signatureInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={(e) => handleFileUpload(e, 'signatureUrl')}
                      className="hidden"
                    />
                  </div>

                  {/* Logo Upload */}
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Custom Logo (optional)</label>
                    <p className="text-xs text-slate-400 mb-3">Replace the default NexSkill logo on the certificate with your own brand logo. Max 2MB.</p>
                    {template.logoUrl ? (
                      <div className="flex items-center gap-4">
                        <div className="h-20 w-20 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600 flex items-center justify-center bg-white dark:bg-slate-900 p-2">
                          <img src={template.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => logoInputRef.current?.click()}
                            className="text-sm text-[#304DB5] hover:underline font-medium"
                          >
                            Replace
                          </button>
                          <button
                            onClick={() => updateTemplate('logoUrl', null)}
                            className="text-sm text-red-500 hover:underline font-medium flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => logoInputRef.current?.click()}
                        className="w-48 h-28 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-[#304DB5] hover:text-[#304DB5] transition-colors"
                      >
                        <ImageIcon className="w-6 h-6" />
                        <span className="text-sm font-medium">Upload Logo</span>
                      </button>
                    )}
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={(e) => handleFileUpload(e, 'logoUrl')}
                      className="hidden"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Live Preview Panel */}
            {showPreview && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Live Preview</h3>
                  <button onClick={() => setShowPreview(false)} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700">
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
                <CertificatePreview
                template={template}
                courseTitle={isCreatingNew
                  ? (courses.find((c) => c.id === targetCourseId)?.title ?? 'Your Course Title')
                  : selectedCourse!.title
                }
              />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Copy-to-Course Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Copy Template to Course</h2>
              <button onClick={() => setShowCopyModal(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Select a course to apply this certificate template to. Any existing template for that course will be replaced.
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {courses
                  .filter((c) => c.id !== selectedCourse?.id)
                  .map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleCopyTo(c.id)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 hover:border-[#304DB5] hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <Award className="w-4 h-4 text-[#304DB5]" />
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{c.title}</span>
                      </div>
                      {coursesWithTemplates.has(c.id) && (
                        <span className="text-xs text-amber-600 dark:text-amber-400">Will replace existing</span>
                      )}
                    </button>
                  ))}
                {courses.filter((c) => c.id !== selectedCourse?.id).length === 0 && (
                  <p className="text-center text-slate-400 py-6 text-sm">No other courses available.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </CoachAppLayout>
  );
};

// ---- Live Preview Component ----
const CertificatePreview: React.FC<{ template: CertificateTemplate; courseTitle: string }> = ({ template, courseTitle }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4">
      <div
        className="relative aspect-[16/11] rounded-xl p-6 flex flex-col items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${template.borderColor}08 0%, #ffffff 50%, ${template.accentColor}08 100%)`,
          border: `3px solid ${template.borderColor}`,
        }}
      >
        {/* Inner decorative border */}
        <div
          className="absolute inset-4 rounded-lg border-2 opacity-20"
          style={{ borderColor: template.borderColor }}
        />

        <div className="relative z-10 text-center w-full max-w-lg">
          {/* Logo */}
          <div className="mb-3">
            {template.logoUrl ? (
              <img src={template.logoUrl} alt="Logo" className="w-14 h-14 mx-auto rounded-full object-cover" />
            ) : (
              <div
                className="w-14 h-14 mx-auto rounded-full flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${template.borderColor}, ${template.accentColor})` }}
              >
                <span className="text-white font-bold text-xl">N</span>
              </div>
            )}
          </div>

          {/* Certificate Title */}
          <h1
            className="text-lg font-bold mb-1"
            style={{ color: template.borderColor }}
          >
            {template.certificateTitle || 'Certificate of Completion'}
          </h1>
          <p className="text-[9px] text-slate-500 mb-2 uppercase tracking-widest">This certifies that</p>

          {/* Student Name (placeholder) */}
          <h2 className="text-2xl font-bold text-slate-900 mb-1">John Doe</h2>
          <p className="text-[10px] text-slate-500 mb-1">{template.certificateDescription || 'Has successfully completed all requirements for'}</p>

          {/* Course Title */}
          <h3
            className="text-base font-bold mb-1"
            style={{ color: template.borderColor }}
          >
            {courseTitle}
          </h3>

          {/* Custom Message */}
          {template.customMessage && (
            <p className="text-[9px] text-slate-500 italic mb-2 max-w-xs mx-auto">
              {template.customMessage}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-end justify-between pt-3 mt-2 border-t border-slate-200">
            <div className="text-left">
              {template.signatureUrl ? (
                <img src={template.signatureUrl} alt="Signature" className="h-8 mb-1 object-contain" />
              ) : (
                <div className="w-24 h-0.5 bg-slate-400 mb-1" />
              )}
              <p className="text-[9px] font-medium text-slate-700">{template.issuerName}</p>
              <p className="text-[8px] text-slate-500">{template.issuerTitle}</p>
            </div>

            <div className="text-center">
              <p className="text-[9px] font-semibold text-slate-900">March 9, 2026</p>
              <p className="text-[8px] text-slate-500">Issue Date</p>
            </div>

            <div className="text-right">
              <div className="w-24 h-0.5 bg-slate-400 mb-1 ml-auto" />
              <p className="text-[9px] font-medium text-slate-700">{template.organizationName}</p>
              <p className="text-[8px] text-slate-500">Authorized By</p>
            </div>
          </div>
        </div>

        {/* Seal */}
        {template.showSeal && (
          <div className="absolute bottom-4 right-4 w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border-2 border-white shadow-lg flex items-center justify-center transform rotate-12">
            <div className="text-center">
              <svg className="w-6 h-6 text-white mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-[7px] font-bold text-white">{template.sealText}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachCertificatesPage;
