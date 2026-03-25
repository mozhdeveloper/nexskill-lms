import React, { useState, useEffect } from "react";
import {
    X,
    Image as ImageIcon,
    Type,
    Video,
    Code,
    Trash2,
    MoveUp,
    MoveDown,
    Settings
} from "lucide-react";
import type { Lesson, LessonContentBlock, CompletionCriteria } from "../../../types/lesson";
import CompletionSettingsModal from "./CompletionSettingsModal";
import VideoBlockEditor from "./VideoBlockEditor";

interface LessonEditorPanelProps {
    lesson: Lesson;
    onChange: (lesson: Lesson) => void;
    onClose: () => void;
}

const LessonEditorPanel: React.FC<LessonEditorPanelProps> = ({
    lesson,
    onChange,
    onClose,
}) => {
    const [currentLesson, setCurrentLesson] = useState<Lesson>(lesson);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    useEffect(() => {
        setCurrentLesson(lesson);
    }, [lesson.id]); // Only reset if lesson ID changes

    const updateLesson = (updates: Partial<Lesson>) => {
        const updated = { ...currentLesson, ...updates };
        setCurrentLesson(updated);
        onChange(updated);
    };

    const handleAddBlock = (type: LessonContentBlock["type"]) => {
        const newBlock: LessonContentBlock = {
            id: crypto.randomUUID(),
            type,
            content: "",
            position: currentLesson.content_blocks.length,
        };

        updateLesson({
            content_blocks: [...currentLesson.content_blocks, newBlock],
        });
    };

    const updateBlock = (blockId: string, content: string) => {
        const updatedBlocks = currentLesson.content_blocks.map((block) =>
            block.id === blockId ? { ...block, content } : block
        );
        updateLesson({ content_blocks: updatedBlocks });
    };

    const deleteBlock = (blockId: string) => {
        const updatedBlocks = currentLesson.content_blocks.filter(
            (block) => block.id !== blockId
        );
        updateLesson({ content_blocks: updatedBlocks });
    };

    const moveBlock = (index: number, direction: "up" | "down") => {
        const blocks = [...currentLesson.content_blocks];
        if (direction === "up" && index > 0) {
            [blocks[index], blocks[index - 1]] = [blocks[index - 1], blocks[index]];
        } else if (direction === "down" && index < blocks.length - 1) {
            [blocks[index], blocks[index + 1]] = [blocks[index + 1], blocks[index]];
        }
        updateLesson({ content_blocks: blocks });
    };

    const handleCompletionSettingsSave = (criteria: CompletionCriteria) => {
        updateLesson({ completion_criteria: criteria });
    };

    return (
        <div className="fixed inset-0 bg-white dark:bg-slate-900 z-50 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900">
                <div className="flex items-center gap-4 flex-1">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                    <div className="flex-1 max-w-2xl">
                        <input
                            type="text"
                            value={currentLesson.title}
                            onChange={(e) => updateLesson({ title: e.target.value })}
                            className="w-full text-xl font-bold bg-transparent border-none focus:ring-0 placeholder-gray-400 dark:text-white"
                            placeholder="Lesson Title"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <Settings className="w-4 h-4" />
                        Settings
                    </button>
                    <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
                    <span className="text-sm text-gray-500">
                        {currentLesson.is_published ? "Published" : "Draft"}
                    </span>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950 p-8">
                <div className="max-w-3xl mx-auto space-y-6">

                    {/* Description */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                        <textarea
                            value={currentLesson.description || ""}
                            onChange={(e) => updateLesson({ description: e.target.value })}
                            className="w-full bg-transparent border-none focus:ring-0 text-gray-700 dark:text-gray-300 resize-none"
                            placeholder="Add a brief description for this lesson..."
                            rows={2}
                        />
                    </div>

                    {currentLesson.content_blocks.map((block, index) => (
                        <div
                            key={block.id}
                            className="group relative bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="absolute right-4 top-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-900 p-1 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
                                <button
                                    onClick={() => moveBlock(index, "up")}
                                    disabled={index === 0}
                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-gray-500 disabled:opacity-30"
                                >
                                    <MoveUp className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => moveBlock(index, "down")}
                                    disabled={index === currentLesson.content_blocks.length - 1}
                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-gray-500 disabled:opacity-30"
                                >
                                    <MoveDown className="w-4 h-4" />
                                </button>
                                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
                                <button
                                    onClick={() => deleteBlock(block.id)}
                                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-4 text-gray-400 uppercase text-xs font-bold tracking-wider">
                                    {block.type === 'text' && <><Type className="w-4 h-4" /> Text Content</>}
                                    {block.type === 'image' && <><ImageIcon className="w-4 h-4" /> Image</>}
                                    {block.type === 'video' && <><Video className="w-4 h-4" /> Video</>}
                                    {block.type === 'code' && <><Code className="w-4 h-4" /> Code Block</>}
                                    {block.type === 'heading' && <><Type className="w-4 h-4" /> Heading</>}
                                </div>

                                {block.type === "text" && (
                                    <textarea
                                        value={block.content}
                                        onChange={(e) => updateBlock(block.id, e.target.value)}
                                        className="w-full h-32 p-0 bg-transparent border-none focus:ring-0 text-gray-800 dark:text-gray-200 resize-y"
                                        placeholder="Write your lesson content here..."
                                    />
                                )}

                                {block.type === "heading" && (
                                    <input
                                        type="text"
                                        value={block.content}
                                        onChange={(e) => updateBlock(block.id, e.target.value)}
                                        className="w-full text-2xl font-bold bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white"
                                        placeholder="Heading..."
                                    />
                                )}

                                {block.type === "image" && (
                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            value={block.content}
                                            onChange={(e) => updateBlock(block.id, e.target.value)}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm"
                                            placeholder="Enter image URL..."
                                        />
                                        {block.content && (
                                            <div className="aspect-video bg-gray-100 dark:bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200 dark:border-gray-800">
                                                <img
                                                    src={block.content}
                                                    alt="Preview"
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {block.type === "video" && (
                                    <VideoBlockEditor
                                        block={block}
                                        onChange={(updatedBlock) => {
                                            const updatedBlocks = currentLesson.content_blocks.map((b) =>
                                                b.id === updatedBlock.id ? updatedBlock : b
                                            );
                                            updateLesson({ content_blocks: updatedBlocks });
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Add Block Controls */}
                    <div className="flex flex-wrap items-center justify-center gap-3 py-8">
                        <button
                            onClick={() => handleAddBlock("text")}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all text-sm font-medium"
                        >
                            <Type className="w-4 h-4" /> Text
                        </button>
                        <button
                            onClick={() => handleAddBlock("heading")}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all text-sm font-medium"
                        >
                            <Type className="w-4 h-4" /> Heading
                        </button>
                        <button
                            onClick={() => handleAddBlock("image")}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all text-sm font-medium"
                        >
                            <ImageIcon className="w-4 h-4" /> Image
                        </button>
                        <button
                            onClick={() => handleAddBlock("video")}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all text-sm font-medium"
                        >
                            <Video className="w-4 h-4" /> Video
                        </button>
                    </div>
                </div>
            </div>

            {isSettingsOpen && (
                <CompletionSettingsModal
                    currentCriteria={currentLesson.completion_criteria}
                    onSave={handleCompletionSettingsSave}
                    onClose={() => setIsSettingsOpen(false)}
                />
            )}
        </div>
    );
};

export default LessonEditorPanel;
