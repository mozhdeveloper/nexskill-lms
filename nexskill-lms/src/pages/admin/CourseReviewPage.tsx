import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import AdminAppLayout from '../../layouts/AdminAppLayout';
import CourseStructureTree from '../../components/admin/review/CourseStructureTree';
import LessonContentViewer from '../../components/admin/review/LessonContentViewer';
import FeedbackPanel from '../../components/admin/review/FeedbackPanel';
import VerificationActions from '../../components/admin/review/VerificationActions';
import { useCourseVerification } from '../../hooks/useCourseVerification';

const CourseReviewPage: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();

    const {
        course,
        feedback,
        loading,
        error,
        addFeedback,
        resolveFeedback,
        updateVerificationStatus
    } = useCourseVerification(courseId);

    const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
    const [selectedLessonTitle, setSelectedLessonTitle] = useState<string | null>(null);

    // Calculate feedback counts per lesson
    const feedbackCounts = useMemo(() => {
        const counts: { [lessonId: string]: number } = {};
        feedback.forEach(f => {
            if (f.lesson_id) {
                counts[f.lesson_id] = (counts[f.lesson_id] || 0) + 1;
            }
        });
        return counts;
    }, [feedback]);

    // Unresolved feedback count
    const unresolvedFeedbackCount = useMemo(() => {
        return feedback.filter(f => !f.is_resolved).length;
    }, [feedback]);

    // Check if any modules or content items have pending changes
    const hasPendingContentChanges = useMemo(() => {
        if (!course) return false;
        return course.modules.some(m =>
            m.content_status === 'pending_addition' ||
            m.content_status === 'pending_deletion' ||
            m.content_items.some(ci =>
                ci.content_status === 'pending_addition' ||
                ci.content_status === 'pending_deletion'
            )
        );
    }, [course]);

    // Get selected lesson content
    const selectedLessonContent = useMemo(() => {
        if (!selectedLessonId || !course) return null;

        for (const module of course.modules) {
            const item = module.content_items.find(
                i => i.content_type === 'lesson' && i.lesson_id === selectedLessonId
            );
            if (item) {
                return {
                    id: item.lesson_id,
                    title: item.lesson_title,
                    description: item.lesson_description,
                    lessonContentItems: item.lesson_content_items || [],
                    estimatedDuration: item.estimated_duration_minutes
                };
            }
        }
        return null;
    }, [selectedLessonId, course]);

    const handleUpdateStatus = async (status: Parameters<typeof updateVerificationStatus>[0], feedback?: string) => {
        await updateVerificationStatus(status, feedback);
        if (status === 'approved') {
            navigate('/admin/courses/moderation');
        }
    };

    const handleSelectLesson = (lessonId: string, lessonTitle: string) => {
        setSelectedLessonId(lessonId);
        setSelectedLessonTitle(lessonTitle);
    };

    // Auto-select the first lesson when course data loads
    useEffect(() => {
        if (course && !selectedLessonId) {
            for (const module of course.modules) {
                const firstLesson = module.content_items.find(ci => ci.content_type === 'lesson');
                if (firstLesson) {
                    handleSelectLesson(firstLesson.lesson_id, firstLesson.lesson_title);
                    break;
                }
            }
        }
    }, [course]);

    if (loading) {
        return (
            <AdminAppLayout>
                <div className="flex items-center justify-center h-[calc(100vh-100px)]">
                    <Loader2 className="w-8 h-8 animate-spin text-[#304DB5]" />
                </div>
            </AdminAppLayout>
        );
    }

    if (error || !course) {
        return (
            <AdminAppLayout>
                <div className="m-5">
                    <button
                        onClick={() => navigate('/admin/courses/moderation')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft size={20} />
                        Back to Course Moderation
                    </button>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <p className="text-red-700">{error || 'Course not found'}</p>
                    </div>
                </div>
            </AdminAppLayout>
        );
    }

    return (
        <AdminAppLayout>
            <div className="m-5 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin/courses/moderation')}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Course Review</h1>
                            <p className="text-sm text-gray-500">{course.title}</p>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-12 gap-4 h-[calc(100vh-180px)] overflow-hidden">
                    {/* Left Column - Course Structure (3 cols) */}
                    <div className="col-span-3 sticky top-0 self-start max-h-[calc(100vh-180px)] overflow-y-auto">
                        <CourseStructureTree
                            modules={course.modules}
                            selectedLessonId={selectedLessonId}
                            onSelectLesson={handleSelectLesson}
                            feedbackCounts={feedbackCounts}
                        />
                    </div>

                    {/* Center Column - Content Viewer (5 cols) */}
                    <div className="col-span-5 overflow-y-auto">
                        <LessonContentViewer
                                lessonId={selectedLessonContent?.id || null}
                                lessonTitle={selectedLessonContent?.title || null}
                                lessonDescription={selectedLessonContent?.description || null}
                                lessonContentItems={selectedLessonContent?.lessonContentItems || []}
                                estimatedDuration={selectedLessonContent?.estimatedDuration || null}
                        />
                    </div>

                    {/* Right Column - Feedback & Actions (4 cols) */}
                    <div className="col-span-4 sticky top-0 self-start max-h-[calc(100vh-180px)] overflow-y-auto space-y-4">
                        {/* Verification Actions */}
                        <VerificationActions
                            course={course}
                            unresolvedFeedbackCount={unresolvedFeedbackCount}
                            hasPendingContentChanges={hasPendingContentChanges}
                            onUpdateStatus={handleUpdateStatus}
                            onAddFeedback={addFeedback}
                        />

                        {/* Feedback Panel */}
                        <div className="h-[350px]">
                            <FeedbackPanel
                                feedback={feedback}
                                selectedLessonId={selectedLessonId}
                                selectedLessonTitle={selectedLessonTitle}
                                isCourseLevelView={false}
                                onAddFeedback={addFeedback}
                                onResolveFeedback={resolveFeedback}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </AdminAppLayout>
    );
};

export default CourseReviewPage;
