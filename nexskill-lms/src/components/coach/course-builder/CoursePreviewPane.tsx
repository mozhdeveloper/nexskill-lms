import React, { useState } from 'react';
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
    const [isPlaying, setIsPlaying] = useState(false);

    const handlePlayVideo = () => {
        if (previewVideoUrl) {
            setIsPlaying(true);
        }
    };

    const handleCloseVideo = () => {
        setIsPlaying(false);
    };

    // Parse description to convert markdown-style lists to proper HTML
    const renderDescription = (text: string) => {
        if (!text) return <p className="text-slate-600 dark:text-dark-text-secondary leading-relaxed">No description provided.</p>;

        // Split by newlines and process each line
        const lines = text.split('\n');
        const elements: React.ReactNode[] = [];
        let currentList: string[] = [];
        let listStarted = false;

        lines.forEach((line, index) => {
            const trimmedLine = line.trim();

            // Check if line is a list item (starts with - or •)
            if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) {
                if (!listStarted) {
                    listStarted = true;
                }
                currentList.push(trimmedLine.substring(2));
            } else {
                // If we have a pending list, render it
                if (currentList.length > 0) {
                    elements.push(
                        <ul key={`list-${index}`} className="list-disc list-inside space-y-1 my-3 ml-2">
                            {currentList.map((item, i) => (
                                <li key={i} className="text-slate-600 dark:text-dark-text-secondary leading-relaxed">{item}</li>
                            ))}
                        </ul>
                    );
                    currentList = [];
                    listStarted = false;
                }

                // Render regular paragraph if line is not empty
                if (trimmedLine) {
                    elements.push(
                        <p key={`p-${index}`} className="text-slate-600 dark:text-dark-text-secondary leading-relaxed mb-4">
                            {trimmedLine}
                        </p>
                    );
                } else {
                    // Add spacing for empty lines
                    elements.push(<div key={`spacer-${index}`} className="h-2" />);
                }
            }
        });

        // Render any remaining list items
        if (currentList.length > 0) {
            elements.push(
                <ul key="list-final" className="list-disc list-inside space-y-1 my-3 ml-2">
                    {currentList.map((item, i) => (
                        <li key={i} className="text-slate-600 dark:text-dark-text-secondary leading-relaxed">{item}</li>
                    ))}
                </ul>
            );
        }

        return <>{elements}</>;
    };

    return (
        <div className="space-y-6">
            {/* Hero Section - Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                {/* Left Side - Text Content */}
                <div className="space-y-4 order-2 lg:order-1">
                    <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-dark-text-primary">
                        {courseTitle}
                    </h1>
                    {courseSubtitle && (
                        <p className="text-lg lg:text-xl text-slate-600 dark:text-dark-text-secondary">
                            {courseSubtitle}
                        </p>
                    )}
                    <p className="text-sm text-slate-500 dark:text-dark-text-secondary/70">
                        by <span className="font-medium text-slate-700 dark:text-dark-text-secondary">{instructorName}</span>
                    </p>
                </div>

                {/* Right Side - Video/Thumbnail */}
                <div className="relative rounded-xl overflow-hidden bg-slate-100 dark:bg-gray-800 order-1 lg:order-2">
                    {thumbnailUrl ? (
                        <>
                            <img
                                src={thumbnailUrl}
                                alt={courseTitle}
                                className="w-full h-64 lg:h-72 object-cover"
                            />

                            {/* Play Button Overlay (only if video exists and not playing) */}
                            {previewVideoUrl && !isPlaying && (
                                <button
                                    onClick={handlePlayVideo}
                                    className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group"
                                >
                                    <div className="w-20 h-20 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
                                        <Play className="w-10 h-10 text-[#304DB5] ml-1" fill="currentColor" />
                                    </div>
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-64 lg:h-72 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                            <ImageIcon className="w-16 h-16 text-slate-400 dark:text-gray-600" />
                        </div>
                    )}

                    {/* Video Player Overlay (when playing) */}
                    {isPlaying && previewVideoUrl && (
                        <div className="absolute inset-0 bg-black flex items-center justify-center z-20">
                            <div className="relative w-full h-full">
                                <video
                                    src={previewVideoUrl}
                                    controls
                                    autoPlay
                                    className="w-full h-full"
                                    style={{ objectFit: 'contain' }}
                                    controlsList="nodownload"
                                >
                                    Your browser does not support the video tag.
                                </video>
                                {/* Close button */}
                                <button
                                    onClick={handleCloseVideo}
                                    className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors z-30"
                                >
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Course Description */}
            <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-dark-text-primary mb-3">
                    About This Course
                </h3>
                <div className="prose dark:prose-invert max-w-none">
                    {renderDescription(courseDescription)}
                </div>
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