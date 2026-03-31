import React, { useCallback, useMemo } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

interface ReactQuillEditorProps {
    content: string;
    onUpdate: (content: string) => void;
    placeholder?: string;
}

const ReactQuillEditor: React.FC<ReactQuillEditorProps> = React.memo(({
    content,
    onUpdate,
    placeholder = "Write your content here...",
}) => {
    // Memoize modules configuration to prevent re-creation on each render
    const modules = useMemo(() => ({
        toolbar: [
            [{ header: [1, 2, 3, 4, false] }],
            [{ size: ["small", false, "large", "huge"] }],
            ["bold", "italic", "underline", "strike"],
            [{ color: [] }, { background: [] }],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ align: [] }],
            ["link"],
            ["code-block"],
            ["clean"],
        ],
    }), []);

    const formats = useMemo(() => [
        "header",
        "size",
        "bold",
        "italic",
        "underline",
        "strike",
        "color",
        "background",
        "list",
        "align",
        "link",
        "code-block",
    ], []);

    const handleChange = useCallback((value: string) => {
        onUpdate(value);
    }, [onUpdate]);

    return (
        <div className="react-quill-editor-container">
            <ReactQuill
                theme="snow"
                value={content}
                onChange={handleChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder}
                className="bg-white dark:bg-slate-800"
                style={{
                    height: "200px",
                }}
            />
            <style>{`
                .react-quill-editor-container .ql-toolbar {
                    border: 1px solid #e2e8f0 !important;
                    border-bottom: none !important;
                    border-top-left-radius: 0.5rem;
                    border-top-right-radius: 0.5rem;
                    background-color: #f8fafc;
                }
                .dark .react-quill-editor-container .ql-toolbar {
                    border-color: #475569 !important;
                    background-color: #1e293b;
                }
                .react-quill-editor-container .ql-container {
                    border: 1px solid #e2e8f0 !important;
                    border-bottom-left-radius: 0.5rem;
                    border-bottom-right-radius: 0.5rem;
                    font-size: 1rem;
                }
                .dark .react-quill-editor-container .ql-container {
                    border-color: #475569 !important;
                }
                .react-quill-editor-container .ql-container.ql-snow {
                    border: 1px solid #e2e8f0;
                }
                .react-quill-editor-container .ql-editor {
                    min-height: 150px;
                    max-height: 500px;
                    overflow-y: auto;
                }
                .react-quill-editor-container .ql-editor p {
                    margin-bottom: 0.5em;
                }
                .react-quill-editor-container .ql-editor h1,
                .react-quill-editor-container .ql-editor h2,
                .react-quill-editor-container .ql-editor h3,
                .react-quill-editor-container .ql-editor h4 {
                    margin-top: 0.5em;
                    margin-bottom: 0.5em;
                    font-weight: 600;
                }
                .react-quill-editor-container .ql-editor h1 {
                    font-size: 2em;
                }
                .react-quill-editor-container .ql-editor h2 {
                    font-size: 1.5em;
                }
                .react-quill-editor-container .ql-editor h3 {
                    font-size: 1.25em;
                }
                .react-quill-editor-container .ql-editor h4 {
                    font-size: 1em;
                }
                .react-quill-editor-container .ql-editor ul,
                .react-quill-editor-container .ql-editor ol {
                    padding-left: 1.5em;
                }
                .react-quill-editor-container .ql-editor pre.ql-syntax {
                    background-color: #1e293b;
                    color: #e2e8f0;
                    padding: 1em;
                    border-radius: 0.5rem;
                    overflow-x: auto;
                }
                .react-quill-editor-container .ql-editor a {
                    color: #2563eb;
                    text-decoration: underline;
                }
                .dark .react-quill-editor-container .ql-editor a {
                    color: #60a5fa;
                }
                .react-quill-editor-container .ql-toolbar button:hover,
                .react-quill-editor-container .ql-toolbar button:focus,
                .react-quill-editor-container .ql-toolbar button.ql-active {
                    color: #2563eb;
                }
                .dark .react-quill-editor-container .ql-toolbar button:hover,
                .dark .react-quill-editor-container .ql-toolbar button:focus,
                .dark .react-quill-editor-container .ql-toolbar button.ql-active {
                    color: #60a5fa;
                }
                .react-quill-editor-container .ql-toolbar .ql-stroke {
                    stroke: #475569;
                }
                .react-quill-editor-container .ql-toolbar .ql-fill {
                    fill: #475569;
                }
                .dark .react-quill-editor-container .ql-toolbar .ql-stroke {
                    stroke: #94a3b8;
                }
                .dark .react-quill-editor-container .ql-toolbar .ql-fill {
                    fill: #94a3b8;
                }
                .react-quill-editor-container .ql-picker-label {
                    color: #475569;
                }
                .dark .react-quill-editor-container .ql-picker-label {
                    color: #94a3b8;
                }
            `}</style>
        </div>
    );
});

export default ReactQuillEditor;
