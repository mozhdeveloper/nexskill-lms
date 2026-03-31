import React, { useState, useCallback, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { FileText, Save, Clock, Type } from "lucide-react";

interface NotesEditorProps {
    content: string;
    onUpdate: (content: string) => void;
    onSave?: () => void;
    isSaving?: boolean;
    placeholder?: string;
}

const NotesEditor: React.FC<NotesEditorProps> = ({
    content,
    onUpdate,
    onSave,
    isSaving = false,
    placeholder = "Start writing your notes here...",
}) => {
    const [wordCount, setWordCount] = useState(0);
    const [readingTime, setReadingTime] = useState(0);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Calculate word count and reading time
    const calculateStats = useCallback((htmlContent: string) => {
        // Strip HTML tags to get plain text
        const text = htmlContent.replace(/<[^>]*>/g, " ").trim();
        const words = text.split(/\s+/).filter(word => word.length > 0);
        const count = words.length;
        
        setWordCount(count);
        // Average reading speed: 200 words per minute
        setReadingTime(Math.ceil(count / 200));
    }, []);

    // Update stats when content changes
    useEffect(() => {
        calculateStats(content);
    }, [content, calculateStats]);

    // Handle content change
    const handleChange = useCallback((value: string) => {
        onUpdate(value);
    }, [onUpdate]);

    // Handle save
    const handleSave = useCallback(() => {
        if (onSave) {
            onSave();
            setLastSaved(new Date());
        }
    }, [onSave]);

    // Quill modules configuration
    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'align': [] }],
            ['link', 'blockquote', 'code-block'],
            [{ 'color': [] }, { 'background': [] }],
            ['clean'],
        ],
    };

    // Quill formats configuration
    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'list', 'bullet',
        'indent',
        'align',
        'link', 'blockquote', 'code-block',
        'color', 'background',
    ];

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
            {/* Header */}
            <div className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-gray-700 dark:text-gray-200">Notes</h3>
                </div>
                <div className="flex items-center gap-4">
                    {/* Stats */}
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                            <Type className="w-4 h-4" />
                            <span>{wordCount} words</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>~{readingTime} min read</span>
                        </div>
                    </div>
                    
                    {/* Save Button */}
                    {onSave && (
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors text-sm font-medium"
                        >
                            <Save className="w-4 h-4" />
                            {isSaving ? "Saving..." : "Save"}
                        </button>
                    )}
                </div>
            </div>

            {/* Editor */}
            <div className="p-4">
                <ReactQuill
                    theme="snow"
                    value={content}
                    onChange={handleChange}
                    modules={modules}
                    formats={formats}
                    placeholder={placeholder}
                    className="notes-editor"
                    style={{
                        height: "400px",
                        display: "flex",
                        flexDirection: "column",
                    }}
                />
            </div>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Rich text editor with formatting options</span>
                {lastSaved && (
                    <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
                )}
            </div>

            {/* Custom Styles */}
            <style>{`
                .notes-editor .ql-toolbar {
                    border: 1px solid #e5e7eb !important;
                    border-bottom: none !important;
                    border-radius: 0.375rem 0.375rem 0 0;
                    background-color: #f9fafb;
                }
                
                .dark .notes-editor .ql-toolbar {
                    background-color: #1e293b;
                    border-color: #374151 !important;
                }
                
                .notes-editor .ql-container {
                    border: 1px solid #e5e7eb !important;
                    border-radius: 0 0 0.375rem 0.375rem;
                    font-family: inherit;
                    font-size: 1rem;
                    background-color: white;
                    flex: 1;
                    overflow-y: auto;
                }
                
                .dark .notes-editor .ql-container {
                    background-color: #0f172a;
                    border-color: #374151 !important;
                }
                
                .notes-editor .ql-editor {
                    min-height: 300px;
                    line-height: 1.7;
                }
                
                .notes-editor .ql-editor p {
                    margin-bottom: 1em;
                }
                
                .notes-editor .ql-editor h1,
                .notes-editor .ql-editor h2,
                .notes-editor .ql-editor h3,
                .notes-editor .ql-editor h4,
                .notes-editor .ql-editor h5,
                .notes-editor .ql-editor h6 {
                    margin-top: 1em;
                    margin-bottom: 0.5em;
                    font-weight: 600;
                }
                
                .notes-editor .ql-editor ul,
                .notes-editor .ql-editor ol {
                    padding-left: 1.5em;
                    margin-bottom: 1em;
                }
                
                .notes-editor .ql-editor blockquote {
                    border-left: 4px solid #3b82f6;
                    padding-left: 1em;
                    margin-left: 0;
                    margin-right: 0;
                    font-style: italic;
                    color: #6b7280;
                }
                
                .dark .notes-editor .ql-editor blockquote {
                    color: #9ca3af;
                }
                
                .notes-editor .ql-editor code {
                    background-color: #f3f4f6;
                    padding: 0.2em 0.4em;
                    border-radius: 0.25rem;
                    font-size: 0.9em;
                }
                
                .dark .notes-editor .ql-editor code {
                    background-color: #1e293b;
                }
                
                .notes-editor .ql-editor pre.ql-syntax {
                    background-color: #1e293b;
                    color: #e2e8f0;
                    padding: 1em;
                    border-radius: 0.375rem;
                    overflow-x: auto;
                }
            `}</style>
        </div>
    );
};

export default NotesEditor;
