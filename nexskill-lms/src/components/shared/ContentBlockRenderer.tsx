import React, { useCallback } from "react";
import {
    Type,
    Heading1,
    Image as ImageIcon,
    Video,
    Code as CodeIcon,
    ChevronUp,
    ChevronDown,
    Trash2,
} from "lucide-react";
import RichTextEditor from "../coach/lesson-editor/RichTextEditor";
import { MediaUploader } from "../MediaUploader";
import type { ContentBlock } from "../../types/quiz";
import type { MediaMetadata } from "../../types/media.types";

interface ContentBlockRendererProps {
    block: ContentBlock;
    isFirst: boolean;
    isLast: boolean;
    onContentUpdate: (content: string, blockId: string) => void;
    onMediaUpload: (blockId: string, metadata: MediaMetadata) => void;
    onAttributeUpdate: (
        blockId: string,
        attributes: Partial<ContentBlock["attributes"]>
    ) => void;
    onMove: (direction: "up" | "down") => void;
    onRemove: () => void;
}

const ContentBlockRenderer: React.FC<ContentBlockRendererProps> = React.memo(({
    block,
    isFirst,
    isLast,
    onContentUpdate,
    onMediaUpload,
    onAttributeUpdate,
    onMove,
    onRemove,
}) => {
    const config: Record<
        string,
        { icon: React.ElementType; label: string; color: string }
    > = {
        text: { icon: Type, label: "Text", color: "text-gray-600" },
        heading: {
            icon: Heading1,
            label: "Heading",
            color: "text-blue-600",
        },
        image: { icon: ImageIcon, label: "Image", color: "text-green-600" },
        code: { icon: CodeIcon, label: "Code", color: "text-purple-600" },
        video: { icon: Video, label: "Video", color: "text-red-600" },
    };

    const blockConfig = config[block.type] || {
        icon: Type,
        label: "Unknown",
        color: "text-gray-600",
    };
    const BlockIcon = blockConfig.icon;

    // Memoize event handlers to prevent unnecessary re-renders
    const handleMoveUp = useCallback(() => {
        onMove("up");
    }, [onMove]);

    const handleMoveDown = useCallback(() => {
        onMove("down");
    }, [onMove]);

    const handleRemove = useCallback(() => {
        onRemove();
    }, [onRemove]);

    const handleContentUpdate = useCallback((content: string) => {
        onContentUpdate(content, block.id);
    }, [onContentUpdate, block.id]);

    const handleAttributeUpdate = useCallback((e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const level = parseInt(e.target.value) as 1 | 2 | 3;
        onAttributeUpdate(block.id, { level });
    }, [onAttributeUpdate, block.id]);

    const handleHeadingTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onContentUpdate(e.target.value, block.id);
    }, [onContentUpdate, block.id]);

    const handleMediaUploadComplete = useCallback((metadata: MediaMetadata) => {
        onMediaUpload(block.id, metadata);
    }, [onMediaUpload, block.id]);

    const handleAltChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onAttributeUpdate(block.id, { alt: e.target.value });
    }, [onAttributeUpdate, block.id]);

    const handleCaptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onAttributeUpdate(block.id, { caption: e.target.value });
    }, [onAttributeUpdate, block.id]);

    const handleVideoSourceChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const isExternal = e.target.value === "external";
        onAttributeUpdate(block.id, { is_external: isExternal });
    }, [onAttributeUpdate, block.id]);

    const handleVideoUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onContentUpdate(e.target.value, block.id);
    }, [onContentUpdate, block.id]);

    const handleLanguageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onAttributeUpdate(block.id, { language: e.target.value });
    }, [onAttributeUpdate, block.id]);

    const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onContentUpdate(e.target.value, block.id);
    }, [onContentUpdate, block.id]);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-all hover:shadow-md group">
            {/* Block Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <BlockIcon className={`w-5 h-5 ${blockConfig.color}`} />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {blockConfig.label}
                    </span>
                </div>

                {/* Block Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={handleMoveUp}
                        disabled={isFirst}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move up"
                    >
                        <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleMoveDown}
                        disabled={isLast}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move down"
                    >
                        <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleRemove}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded"
                        title="Remove block"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Block Content */}
            <div>
                {block.type === "text" && (
                    <RichTextEditor
                        content={block.content}
                        onUpdate={handleContentUpdate}
                        placeholder="Enter your text content..."
                    />
                )}

                {block.type === "heading" && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600 dark:text-gray-400">
                                Level:
                            </label>
                            <select
                                value={block.attributes?.level || 2}
                                onChange={handleAttributeUpdate}
                                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                            >
                                <option value={1}>H1</option>
                                <option value={2}>H2</option>
                                <option value={3}>H3</option>
                            </select>
                        </div>
                        <input
                            type="text"
                            value={block.content}
                            onChange={handleHeadingTextChange}
                            placeholder="Enter heading text..."
                            className="w-full px-4 py-2 text-lg font-semibold border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                )}

                {block.type === "image" && (
                    <div className="space-y-3">
                        <MediaUploader
                            onUploadComplete={handleMediaUploadComplete}
                            resourceType="image"
                            currentUrl={block.content}
                        />
                        {block.content && (
                            <div className="space-y-2">
                                <img
                                    src={block.content}
                                    alt={block.attributes?.alt || ""}
                                    className="max-w-full rounded-lg"
                                />
                                <input
                                    type="text"
                                    value={block.attributes?.alt || ""}
                                    onChange={handleAltChange}
                                    placeholder="Alt text (for accessibility)..."
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                />
                                <input
                                    type="text"
                                    value={block.attributes?.caption || ""}
                                    onChange={handleCaptionChange}
                                    placeholder="Caption (optional)..."
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                />
                            </div>
                        )}
                    </div>
                )}

                {block.type === "video" && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600 dark:text-gray-400">
                                Video Source:
                            </label>
                            <select
                                value={
                                    block.attributes?.is_external
                                        ? "external"
                                        : "upload"
                                }
                                onChange={handleVideoSourceChange}
                                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                            >
                                <option value="upload">Upload Video</option>
                                <option value="external">External URL</option>
                            </select>
                        </div>

                        {block.attributes?.is_external ? (
                            <input
                                type="text"
                                value={block.content}
                                onChange={handleVideoUrlChange}
                                placeholder="Enter video URL (YouTube, Vimeo, etc.)..."
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        ) : (
                            <>
                                <MediaUploader
                                    onUploadComplete={handleMediaUploadComplete}
                                    resourceType="video"
                                    currentUrl={block.content}
                                />
                                {block.content && (
                                    <video
                                        src={block.content}
                                        controls
                                        className="max-w-full rounded-lg"
                                    />
                                )}
                            </>
                        )}
                    </div>
                )}

                {block.type === "code" && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600 dark:text-gray-400">
                                Language:
                            </label>
                            <input
                                type="text"
                                value={block.attributes?.language || ""}
                                onChange={handleLanguageChange}
                                placeholder="e.g., javascript, python, sql"
                                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                            />
                        </div>
                        <textarea
                            value={block.content}
                            onChange={handleCodeChange}
                            placeholder="Enter code..."
                            rows={8}
                            className="w-full px-4 py-3 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                )}
            </div>
        </div>
    );
});

export default ContentBlockRenderer;
