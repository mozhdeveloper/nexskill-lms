import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CoachAppLayout from '../../layouts/CoachAppLayout';
import ContentBlockRenderer from '../../components/learning/ContentBlockRenderer';

// Mock Data for Demo Lessons
const MOCK_LESSONS = [
    { id: 1, title: 'Introduction to React Hooks', status: 'Published', lastUpdated: '2025-01-20', views: 1250 },
    { id: 2, title: 'State Management with Context API', status: 'Draft', lastUpdated: '2025-01-21', views: 0 },
    { id: 3, title: 'Advanced patterns in generic components', status: 'Published', lastUpdated: '2025-01-15', views: 890 },
    { id: 4, title: 'Understanding TypeScript Generics', status: 'Archived', lastUpdated: '2024-12-10', views: 3400 },
];

const DemoCreateLesson: React.FC = () => {
    const navigate = useNavigate();
    const [view, setView] = useState<'list' | 'create'>('list');
    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        content: '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        const lessonData = {
            title: formData.title,
            content: formData.content,
            type: 'text',
            version: 1,
            createdAt: new Date().toISOString()
        };

        console.log('Lesson JSON:', lessonData);
        window.alert(JSON.stringify(lessonData, null, 2));

        // Return to list after save
        setView('list');
        setFormData({ title: '', content: '' }); // Reset form
        setActiveTab('edit');
    };

    const handleLinkClick = (path: string) => {
        navigate(path);
    };

    // --- Views ---

    // 1. List View
    const renderListView = () => (
        <div className="p-8 max-w-6xl mx-auto">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-dark-background-card p-6 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-dark-text-secondary">Total Lessons</h3>
                    <p className="text-3xl font-bold text-slate-900 dark:text-dark-text-primary mt-2">12</p>
                </div>
                <div className="bg-white dark:bg-dark-background-card p-6 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-dark-text-secondary">Published</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">8</p>
                </div>
                <div className="bg-white dark:bg-dark-background-card p-6 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-dark-text-secondary">Drafts</h3>
                    <p className="text-3xl font-bold text-slate-900 dark:text-dark-text-primary mt-2">4</p>
                </div>
            </div>

            {/* List Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-dark-text-primary">Your Lessons</h2>
                <button
                    onClick={() => setView('create')}
                    className="px-6 py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create New Lesson
                </button>
            </div>

            {/* Lessons Table */}
            <div className="bg-white dark:bg-dark-background-card rounded-2xl border border-slate-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700">
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-dark-text-primary">Lesson Title</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-dark-text-primary">Status</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-dark-text-primary">Last Updated</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-dark-text-primary text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {MOCK_LESSONS.map((lesson) => (
                                <tr key={lesson.id} className="border-b border-slate-100 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-slate-900 dark:text-dark-text-primary">{lesson.title}</p>
                                        <p className="text-xs text-slate-500 dark:text-dark-text-secondary mt-0.5">{lesson.views.toLocaleString()} views</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${lesson.status === 'Published'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                            : lesson.status === 'Draft'
                                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                            }`}>
                                            {lesson.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-dark-text-secondary">
                                        {lesson.lastUpdated}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            className="text-[#304DB5] hover:text-[#5E7BFF] font-medium text-sm"
                                            onClick={() => window.alert(`Edit functionality for "${lesson.title}" would go here`)}
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {MOCK_LESSONS.length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                        No lessons found. Create your first one!
                    </div>
                )}
            </div>
        </div>
    );

    // 2. Editor View
    const renderEditorView = () => (
        <div className="p-8 max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <button onClick={() => setView('list')} className="hover:text-[#304DB5] transition-colors">Lessons</button>
                    <span>/</span>
                    <span className="text-slate-900 dark:text-dark-text-primary font-medium">New Lesson</span>
                </div>

                {/* Switcher */}
                <div className="flex bg-slate-100 dark:bg-gray-800 rounded-full p-1 border border-slate-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('edit')}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'edit'
                            ? 'bg-white dark:bg-gray-600 shadow-sm text-slate-900 dark:text-white'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => setActiveTab('preview')}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'preview'
                            ? 'bg-white dark:bg-gray-600 shadow-sm text-slate-900 dark:text-white'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        Preview
                    </button>
                </div>
            </div>

            {activeTab === 'edit' ? (
                <div className="bg-white dark:bg-dark-background-card rounded-3xl shadow-xl p-8 space-y-6">
                    {/* Title Input */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-semibold text-slate-700 dark:text-dark-text-primary mb-2">
                            Lesson Title
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="e.g., Introduction to React Hooks"
                            className="w-full px-5 py-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium text-lg"
                        />
                    </div>

                    {/* Content Textarea */}
                    <div>
                        <label htmlFor="content" className="block text-sm font-semibold text-slate-700 dark:text-dark-text-primary mb-2">
                            Lesson Content
                            <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                                Text Editor
                            </span>
                        </label>
                        <textarea
                            id="content"
                            name="content"
                            value={formData.content}
                            onChange={handleInputChange}
                            placeholder="Write your lesson content here..."
                            rows={15}
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-y font-mono text-sm leading-relaxed"
                        />
                        <p className="text-xs text-slate-500 dark:text-dark-text-muted mt-2">
                            This area will be upgraded to a Rich Text Editor in the future.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-gray-700 mt-6">
                        <button
                            type="button"
                            onClick={() => setView('list')}
                            className="px-6 py-3 text-slate-700 dark:text-slate-300 font-medium rounded-full border border-slate-200 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-700 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="px-8 py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            Save Lesson
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-dark-background-card rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-gray-700">
                    <div className="px-8 py-6 border-b border-slate-100 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/50">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Student View Preview
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-dark-text-primary">
                            {formData.title || "Untitled Lesson"}
                        </h1>
                    </div>

                    <div className="p-8">
                        {formData.content ? (
                            <ContentBlockRenderer
                                contentBlocks={[
                                    {
                                        id: 'preview-1',
                                        type: 'text',
                                        content: formData.content.replace(/\n/g, '<br />'),
                                        position: 0
                                    }
                                ]}
                            />
                        ) : (
                            <div className="text-center py-12 text-slate-400 italic border-2 border-dashed border-slate-100 dark:border-gray-700 rounded-xl">
                                Start typing content to see a preview here...
                            </div>
                        )}
                    </div>

                    <div className="px-8 py-4 bg-slate-50 dark:bg-gray-800 border-t border-slate-100 dark:border-gray-700 text-xs text-center text-slate-500">
                        This is how your lesson will appear to students
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <CoachAppLayout>
            <div className="flex-1 overflow-y-auto">
                {/* Header */}
                <div className="bg-white border-b border-slate-200 dark:border-gray-700 px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <button
                                onClick={() => handleLinkClick('/coach/dashboard')}
                                className="flex items-center gap-2 text-slate-600 dark:text-dark-text-secondary hover:text-slate-900 dark:hover:text-dark-text-primary dark:text-dark-text-primary mb-4 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Back to Dashboard
                            </button>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-dark-text-primary mb-2">
                                {view === 'list' ? 'Lesson Library' : 'Create Lesson'}
                            </h1>
                            <p className="text-slate-600 dark:text-dark-text-secondary">
                                {view === 'list' ? 'Manage and organize your course content' : 'Draft your lesson content below'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Dynamic Content */}
                {view === 'list' ? renderListView() : renderEditorView()}

            </div>
        </CoachAppLayout>
    );
};

export default DemoCreateLesson;
