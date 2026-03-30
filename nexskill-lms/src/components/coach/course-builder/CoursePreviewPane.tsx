import React from 'react';
import { Play, Image as ImageIcon } from 'lucide-react';

interface CoursePreviewPaneProps {
    courseTitle: string;
    courseSubtitle: string;
    courseDescription: string;
    instructorName: string;
    learningObjectives: string[];
    thumbnailUrl?: string | null;
    previewVideoUrl?: string | null;
}

const CoursePreviewPane: React.FC<CoursePreviewPaneProps> = ({
    courseTitle,
    courseSubtitle,
    courseDescription,
    instructorName,
    learningObjectives,
    thumbnailUrl,
    previewVideoUrl,
}) => {
    return (
        <div className="space-y-6">
            {/* Hero Section with Thumbnail */}
            <div className="relative rounded-xl overflow-hidden bg-slate-100 dark:bg-gray-800">
                {thumbnailUrl ? (
                    <img
                        src={thumbnailUrl}
                        alt={courseTitle}
                        className="w-full h-64 object-cover"
                    />
                ) : (
                    <div className="w-full h-64 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                        <ImageIcon className="w-16 h-16 text-slate-400 dark:text-gray-600" />
                    </div>
                )}
                
                {/* Overlay for text */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h1 className="text-3xl font-bold mb-2">{courseTitle}</h1>
                    {courseSubtitle && (
                        <p className="text-lg text-white/90">{courseSubtitle}</p>
                    )}
                    <p className="text-sm text-white/80 mt-2">by {instructorName}</p>
                </div>
            </div>

            {/* Preview Video Section */}
            {previewVideoUrl && (
                <div className="rounded-xl overflow-hidden bg-slate-50 dark:bg-gray-800/50 p-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-dark-text-primary mb-3 flex items-center gap-2">
                        <Play className="w-5 h-5" />
                        Course Preview
                    </h3>
                    <video
                        src={previewVideoUrl}
                        controls
                        className="w-full rounded-lg"
                        poster={thumbnailUrl || undefined}
                    >
                        Your browser does not support the video tag.
                    </video>
                </div>
            )}

            {/* Course Description */}
            <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-dark-text-primary mb-3">
                    About This Course
                </h3>
                <p className="text-slate-600 dark:text-dark-text-secondary leading-relaxed">
                    {courseDescription || "No description provided."}
                </p>
            </div>

            {/* Learning Objectives */}
            {learningObjectives && learningObjectives.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-dark-text-primary mb-3">
                        What You'll Learn
                    </h3>
                    <ul className="space-y-2">
                        {learningObjectives.map((objective, index) => (
                            <li key={index} className="flex items-start gap-2 text-slate-600 dark:text-dark-text-secondary">
                                <span className="text-[#304DB5] mt-1">✓</span>
                                <span>{objective}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default CoursePreviewPane;