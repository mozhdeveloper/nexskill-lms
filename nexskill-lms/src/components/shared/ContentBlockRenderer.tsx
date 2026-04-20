import React, { useCallback, useState } from "react";
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
import ReactQuillEditor from "./ReactQuillEditor";
import type { ContentBlock } from "../../types/quiz";
import { supabase } from "../../lib/supabaseClient";
import { SupabaseStorageUploadService } from "../../services/supabaseStorageUpload.service";

interface ContentBlockRendererProps {
    block: ContentBlock;
    isFirst: boolean;
    isLast: boolean;
    onContentUpdate: (content: string, blockId: string) => void;
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
    onAttributeUpdate,
    onMove,
    onRemove,
}) => {
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [imageUploadError, setImageUploadError] = useState<string | null>(null);

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

    const handleAltChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onAttributeUpdate(block.id, { alt: e.target.value });
    }, [onAttributeUpdate, block.id]);

    const handleCaptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onAttributeUpdate(block.id, { caption: e.target.value });
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

    const handleImageUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onContentUpdate(e.target.value, block.id);
    }, [onContentUpdate, block.id]);

    const handleImageFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImageUploadError(null);
        setIsUploadingImage(true);

        try {
            const { data } = await supabase.auth.getUser();
            const ownerId = data.user?.id || "anonymous";
            const uploaded = await SupabaseStorageUploadService.uploadQuestionImage(file, ownerId);
            onContentUpdate(uploaded.url, block.id);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Image upload failed";
            setImageUploadError(message);
        } finally {
            setIsUploadingImage(false);
            e.target.value = "";
        }
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
                    <ReactQuillEditor
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
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Upload image
                            </label>
                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                onChange={handleImageFileUpload}
                                disabled={isUploadingImage}
                                className="block w-full text-sm text-gray-700 dark:text-gray-300 file:mr-3 file:px-3 file:py-2 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 disabled:opacity-60"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Supported formats: JPG, PNG, WebP (max 2MB)
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Or use image URL
                            </label>
                            <input
                                type="text"
                                value={block.content || ""}
                                onChange={handleImageUrlChange}
                                placeholder="https://example.com/question-image.jpg"
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                            />
                        </div>

                        {isUploadingImage && (
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                Uploading image...
                            </p>
                        )}

                        {imageUploadError && (
                            <p className="text-sm text-red-600 dark:text-red-400">
                                {imageUploadError}
                            </p>
                        )}

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
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                External URL only (YouTube, Vimeo, etc.)
                            </span>
                        </div>
                        <input
                            type="text"
                            value={block.content}
                            onChange={handleVideoUrlChange}
                            placeholder="Enter video URL (YouTube, Vimeo, etc.)..."
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
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
