import React from 'react';
import DOMPurify from 'dompurify';
import { FileText, Video, HelpCircle, StickyNote, FileIcon, Clock, Plus, Trash2, Download, CheckCircle, XCircle, Upload, BookOpen } from 'lucide-react';

interface QuizQuestionData {
    id: string;
    quiz_id: string;
    position: number;
    question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'file_upload' | 'video_submission';
    question_content: any[];
    points: number;
    answer_config: any;
}

interface LessonContentItemData {
    id: string;
    lesson_id: string;
    content_type: 'video' | 'quiz' | 'text' | 'document' | 'notes';
    content_id: string | null;
    metadata: any;
    position: number;
    content_status: string;
    quiz_questions?: QuizQuestionData[];
}

interface LessonContentViewerProps {
    lessonId: string | null;
    lessonTitle: string | null;
    lessonDescription: string | null;
    lessonContentItems: LessonContentItemData[];
    estimatedDuration: number | null;
}

const LessonContentViewer: React.FC<LessonContentViewerProps> = ({
    lessonId,
    lessonTitle,
    lessonDescription,
    lessonContentItems,
    estimatedDuration
}) => {
    if (!lessonId) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                    <FileText size={48} className="mx-auto mb-3 opacity-50" />
                    <p>Select a lesson to view its content</p>
                </div>
            </div>
        );
    }

    const getStatusIndicator = (status: string) => {
        if (status === 'pending_addition') {
            return (
                <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium border border-blue-200">
                    <Plus size={10} />
                    New
                </span>
            );
        }
        if (status === 'pending_deletion') {
            return (
                <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-medium border border-red-200">
                    <Trash2 size={10} />
                    Delete
                </span>
            );
        }
        return null;
    };

    const getYouTubeEmbedUrl = (url: string): string | null => {
        const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        return match ? `https://www.youtube.com/embed/${match[1]}` : null;
    };

    const renderVideo = (item: LessonContentItemData) => {
        const url = item.metadata?.url || item.metadata?.cloudinary_secure_url;
        const videoType = item.metadata?.video_type;
        const title = item.metadata?.title || 'Video';
        const duration = item.metadata?.duration;

        if (!url) {
            return (
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border">
                    <p className="text-gray-400 text-sm">No video URL available</p>
                </div>
            );
        }

        if (videoType === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
            const embedUrl = getYouTubeEmbedUrl(url);
            return (
                <div>
                    <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Video size={16} className="text-purple-500" />
                        {title}
                        {duration && <span className="text-xs text-gray-400">({Math.round(duration / 60)} min)</span>}
                    </p>
                    {embedUrl ? (
                        <div className="aspect-video rounded-lg overflow-hidden border">
                            <iframe
                                src={embedUrl}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title={title}
                            />
                        </div>
                    ) : (
                        <a href={url} target="_blank" rel="noopener noreferrer"
                            className="text-[#304DB5] hover:underline text-sm">
                            Open YouTube Video
                        </a>
                    )}
                </div>
            );
        }

        return (
            <div>
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Video size={16} className="text-purple-500" />
                    {title}
                    {duration && <span className="text-xs text-gray-400">({Math.round(duration / 60)} min)</span>}
                </p>
                <video src={url} controls className="w-full rounded-lg border" />
            </div>
        );
    };

    const renderTextOrNotes = (item: LessonContentItemData) => {
        const content = item.metadata?.content;
        const title = item.metadata?.title;
        const readingTime = item.metadata?.reading_time;
        const isNotes = item.content_type === 'notes';

        return (
            <div>
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <StickyNote size={16} className="text-green-500" />
                    {title || (isNotes ? 'Notes' : 'Text')}
                    {readingTime && <span className="text-xs text-gray-400">({readingTime} min read)</span>}
                </p>
                {content ? (
                    <div
                        className="prose prose-sm max-w-none bg-gray-50 rounded-lg p-4 border"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
                    />
                ) : (
                    <p className="text-sm text-gray-400 italic">No content</p>
                )}
            </div>
        );
    };

    const renderDocument = (item: LessonContentItemData) => {
        const fileName = item.metadata?.file_name || 'Document';
        const downloadUrl = item.metadata?.download_url;
        const fileSize = item.metadata?.file_size;

        return (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border">
                <FileIcon size={24} className="text-gray-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{fileName}</p>
                    {fileSize && (
                        <p className="text-xs text-gray-400">{(fileSize / 1024 / 1024).toFixed(2)} MB</p>
                    )}
                </div>
                {downloadUrl && (
                    <a
                        href={downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-[#304DB5] hover:underline"
                    >
                        <Download size={14} />
                        Download
                    </a>
                )}
            </div>
        );
    };

    const renderQuestionContent = (blocks: any[]) => {
        if (!blocks || blocks.length === 0) return null;
        return blocks.map((block: any, i: number) => {
            if (block.type === 'text' && block.content) {
                return <span key={i} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.content) }} />;
            }
            return <span key={i}>{block.content || ''}</span>;
        });
    };

    const renderQuiz = (item: LessonContentItemData) => {
        const title = item.metadata?.title || 'Quiz';
        const questions = item.quiz_questions || [];

        return (
            <div>
                <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <HelpCircle size={16} className="text-orange-500" />
                    {title}
                    <span className="text-xs text-gray-400">({questions.length} question{questions.length !== 1 ? 's' : ''})</span>
                </p>
                {questions.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No questions added yet</p>
                ) : (
                    <div className="space-y-4">
                        {questions.sort((a, b) => a.position - b.position).map((q, qi) => (
                            <div key={q.id} className="bg-gray-50 rounded-lg border p-4">
                                <div className="flex items-start gap-2 mb-2">
                                    <span className="text-xs font-bold text-gray-400 mt-0.5">Q{qi + 1}</span>
                                    <div className="flex-1 text-sm text-gray-900">
                                        {renderQuestionContent(q.question_content)}
                                    </div>
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap">{q.points} pt{q.points !== 1 ? 's' : ''}</span>
                                </div>
                                {renderAnswerConfig(q)}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderAnswerConfig = (q: QuizQuestionData) => {
        const { question_type, answer_config } = q;

        if (question_type === 'multiple_choice' && answer_config?.options) {
            return (
                <div className="ml-6 space-y-1.5">
                    {answer_config.options.map((opt: any) => (
                        <div key={opt.id} className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-md ${
                            opt.is_correct ? 'bg-green-50 border border-green-200' : 'bg-white border border-gray-100'
                        }`}>
                            {opt.is_correct ? (
                                <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                            ) : (
                                <XCircle size={14} className="text-gray-300 flex-shrink-0" />
                            )}
                            <span className={opt.is_correct ? 'text-green-700' : 'text-gray-600'}>{opt.text}</span>
                        </div>
                    ))}
                </div>
            );
        }

        if (question_type === 'true_false') {
            const correct = answer_config?.correct_answer;
            return (
                <div className="ml-6 space-y-1.5">
                    {[true, false].map(val => (
                        <div key={String(val)} className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-md ${
                            correct === val ? 'bg-green-50 border border-green-200' : 'bg-white border border-gray-100'
                        }`}>
                            {correct === val ? (
                                <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                            ) : (
                                <XCircle size={14} className="text-gray-300 flex-shrink-0" />
                            )}
                            <span className={correct === val ? 'text-green-700' : 'text-gray-600'}>
                                {val ? 'True' : 'False'}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }

        if (question_type === 'short_answer') {
            const accepted = answer_config?.accepted_answers || [];
            return (
                <div className="ml-6 text-sm text-gray-500">
                    {accepted.length > 0 ? (
                        <p>Accepted answers: <span className="font-medium text-gray-700">{accepted.join(', ')}</span></p>
                    ) : (
                        <p className="italic">Manually graded</p>
                    )}
                </div>
            );
        }

        if (question_type === 'essay') {
            return (
                <div className="ml-6 text-sm text-gray-500 flex items-center gap-1">
                    <BookOpen size={14} />
                    <span>Essay response — manually graded</span>
                </div>
            );
        }

        if (question_type === 'file_upload' || question_type === 'video_submission') {
            return (
                <div className="ml-6 text-sm text-gray-500 flex items-center gap-1">
                    <Upload size={14} />
                    <span>{question_type === 'file_upload' ? 'File upload' : 'Video submission'} — manually graded</span>
                </div>
            );
        }

        return null;
    };

    const renderContentItem = (item: LessonContentItemData) => {
        switch (item.content_type) {
            case 'video': return renderVideo(item);
            case 'text': case 'notes': return renderTextOrNotes(item);
            case 'document': return renderDocument(item);
            case 'quiz': return renderQuiz(item);
            default: return <p className="text-sm text-gray-400">Unknown content type: {item.content_type}</p>;
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden h-full flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#304DB5]/5 to-transparent">
                <h2 className="text-lg font-semibold text-gray-900">{lessonTitle}</h2>
                {lessonDescription && (
                    <p className="text-sm text-gray-500 mt-1">{lessonDescription}</p>
                )}
                {estimatedDuration && (
                    <div className="flex items-center gap-1 mt-2 text-sm text-gray-400">
                        <Clock size={14} />
                        <span>{estimatedDuration} min</span>
                    </div>
                )}
            </div>

            {/* Content Items */}
            <div className="flex-1 overflow-y-auto p-6">
                {lessonContentItems.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <FileText size={48} className="mx-auto mb-3 opacity-50" />
                        <p>No content items in this lesson</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {lessonContentItems
                            .sort((a, b) => a.position - b.position)
                            .map((item) => (
                                <div
                                    key={item.id}
                                    className={`rounded-xl border p-5 transition-colors ${
                                        item.content_status === 'pending_deletion'
                                            ? 'border-red-200 bg-red-50/30'
                                            : item.content_status === 'pending_addition'
                                            ? 'border-blue-200 bg-blue-50/30'
                                            : 'border-gray-200'
                                    }`}
                                >
                                    {getStatusIndicator(item.content_status) && (
                                        <div className="mb-3">{getStatusIndicator(item.content_status)}</div>
                                    )}
                                    {renderContentItem(item)}
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LessonContentViewer;
