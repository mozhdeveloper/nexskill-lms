import React from 'react';

interface CoursePreviewPaneProps {
    courseTitle: string;
    courseSubtitle?: string;
    courseDescription?: string;
    instructorName?: string;
    learningObjectives?: string[];
}

const CoursePreviewPane: React.FC<CoursePreviewPaneProps> = ({
    courseTitle,
    courseSubtitle,
    courseDescription,
    instructorName = "Instructor",
    learningObjectives
}) => {
    return (
        <div className="bg-white dark:bg-dark-background-card rounded-3xl shadow-lg border border-slate-100 dark:border-gray-700 overflow-hidden">
            {/* Mock Course Landing Page Header */}
            <div className="bg-slate-900 text-white p-12">
                <div className="max-w-4xl mx-auto">
                    <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-medium mb-4 backdrop-blur-sm">
                        Course Preview
                    </span>
                    <h1 className="text-4xl font-bold mb-4 leading-tight">{courseTitle || "Untitled Course"}</h1>
                    <p className="text-xl text-slate-300 mb-6 font-light">{courseSubtitle || "No subtitle provided."}</p>

                    <div className="flex items-center gap-4 text-sm text-slate-400">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                                {instructorName.charAt(0)}
                            </div>
                            <span>Created by {instructorName}</span>
                        </div>
                        <span>•</span>
                        <span>Last updated {new Date().toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-12 max-w-4xl mx-auto">
                <div className="prose prose-lg dark:prose-invert max-w-none">
                    <h3>About this course</h3>
                    <div className="whitespace-pre-wrap text-slate-600 dark:text-dark-text-secondary">
                        {courseDescription || "No description addded yet."}
                    </div>
                </div>

                <div className="mt-12 p-6 bg-slate-50 dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-dark-text-primary mb-4">What you'll learn</h3>
                    {learningObjectives && learningObjectives.length > 0 ? (
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {learningObjectives.map((objective, i) => (
                                <li key={i} className="flex items-start gap-2 text-slate-600 dark:text-dark-text-secondary">
                                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>{objective}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-slate-500 italic text-sm">No learning objectives added yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CoursePreviewPane;
