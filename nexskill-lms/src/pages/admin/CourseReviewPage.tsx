import React, { useState, useMemo } from 'react';
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
    const [isCourseFeedbackSelected, setIsCourseFeedbackSelected] = useState(false);

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

    // Course-level feedback count
    const courseLevelFeedbackCount = useMemo(() => {
        return feedback.filter(f => f.lesson_id === null).length;
    }, [feedback]);

    // Unresolved feedback count
    const unresolvedFeedbackCount = useMemo(() => {
        return feedback.filter(f => !f.is_resolved).length;
    }, [feedback]);

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
                    contentBlocks: item.content_blocks || [],
                    estimatedDuration: item.estimated_duration_minutes
                };
            }
        }
        return null;
    }, [selectedLessonId, course]);

    const handleSelectLesson = (lessonId: string, lessonTitle: string) => {
        setSelectedLessonId(lessonId);
        setSelectedLessonTitle(lessonTitle);
        setIsCourseFeedbackSelected(false);
    };

    const handleSelectCourseFeedback = () => {
        setSelectedLessonId(null);
        setSelectedLessonTitle(null);
        setIsCourseFeedbackSelected(true);
    };

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
                <div className="grid grid-cols-12 gap-4 h-[calc(100vh-180px)]">
                    {/* Left Column - Course Structure (3 cols) */}
                    <div className="col-span-3">
                        <CourseStructureTree
                            modules={course.modules}
                            selectedLessonId={selectedLessonId}
                            onSelectLesson={handleSelectLesson}
                            feedbackCounts={feedbackCounts}
                            courseLevelFeedbackCount={courseLevelFeedbackCount}
                            onSelectCourseFeedback={handleSelectCourseFeedback}
                            isCourseFeedbackSelected={isCourseFeedbackSelected}
                        />
                    </div>

                    {/* Center Column - Content Viewer (5 cols) */}
                    <div className="col-span-5">
                        {isCourseFeedbackSelected ? (
                            <div className="bg-white rounded-2xl border border-gray-200 h-full flex flex-col">
                                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#304DB5]/5 to-transparent">
                                    <h2 className="text-lg font-semibold text-gray-900">Course Overview</h2>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6">
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="font-medium text-gray-700">Title</h3>
                                            <p className="text-gray-900">{course.title}</p>
                                        </div>
                                        {course.subtitle && (
                                            <div>
                                                <h3 className="font-medium text-gray-700">Subtitle</h3>
                                                <p className="text-gray-900">{course.subtitle}</p>
                                            </div>
                                        )}
                                        {course.short_description && (
                                            <div>
                                                <h3 className="font-medium text-gray-700">Short Description</h3>
                                                <p className="text-gray-600">{course.short_description}</p>
                                            </div>
                                        )}
                                        {course.long_description && (
                                            <div>
                                                <h3 className="font-medium text-gray-700">Long Description</h3>
                                                <div
                                                    className="prose prose-sm max-w-none text-gray-600"
                                                    dangerouslySetInnerHTML={{ __html: course.long_description }}
                                                />
                                            </div>
                                        )}
                                        <div className="pt-4 border-t">
                                            <h3 className="font-medium text-gray-700 mb-2">Course Structure</h3>
                                            <p className="text-sm text-gray-500">
                                                {course.modules.length} modules, {' '}
                                                {course.modules.reduce((acc, m) => acc + m.content_items.length, 0)} items total
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <LessonContentViewer
                                lessonId={selectedLessonContent?.id || null}
                                lessonTitle={selectedLessonContent?.title || null}
                                lessonDescription={selectedLessonContent?.description || null}
                                contentBlocks={selectedLessonContent?.contentBlocks || []}
                                estimatedDuration={selectedLessonContent?.estimatedDuration || null}
                            />
                        )}
                    </div>

                    {/* Right Column - Feedback & Actions (4 cols) */}
                    <div className="col-span-4 space-y-4 overflow-y-auto">
                        {/* Verification Actions */}
                        <VerificationActions
                            course={course}
                            unresolvedFeedbackCount={unresolvedFeedbackCount}
                            onUpdateStatus={updateVerificationStatus}
                            onAddFeedback={addFeedback}
                        />

                        {/* Feedback Panel */}
                        <div className="h-[400px]">
                            <FeedbackPanel
                                feedback={feedback}
                                selectedLessonId={selectedLessonId}
                                selectedLessonTitle={selectedLessonTitle}
                                isCourseLevelView={isCourseFeedbackSelected}
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
