import React from "react";
import type { ContentBlock } from "../../types/quiz";

interface ContentBlockDisplayProps {
    block: ContentBlock;
}

/**
 * Renders a content block in display/preview mode
 * Used in quiz preview and student-facing views
 */
const ContentBlockDisplay: React.FC<ContentBlockDisplayProps> = ({ block }) => {
    switch (block.type) {
        case "text":
            return (
                <div
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: block.content }}
                />
            );

        case "heading": {
            const HeadingTag = `h${block.attributes?.level || 2}` as
                | "h1"
                | "h2"
                | "h3";
            const headingClasses: Record<string, string> = {
                h1: "text-3xl font-bold mb-4",
                h2: "text-2xl font-bold mb-3",
                h3: "text-xl font-semibold mb-2",
            };

            return (
                <HeadingTag
                    className={`${
                        headingClasses[HeadingTag] || headingClasses.h2
                    } text-gray-900 dark:text-white`}
                >
                    {block.content}
                </HeadingTag>
            );
        }

        case "image":
            return (
                <figure className="my-4">
                    <img
                        src={block.content}
                        alt={block.attributes?.alt || ""}
                        className="max-w-full rounded-lg shadow-md"
                    />
                    {block.attributes?.caption && (
                        <figcaption className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center italic">
                            {block.attributes.caption}
                        </figcaption>
                    )}
                </figure>
            );

        case "video": {
            const videoUrl = block.attributes?.external_url || block.content;

            if (block.attributes?.is_external) {
                // Handle external videos (YouTube, Vimeo, etc.)
                return (
                    <div className="my-4 aspect-video">
                        <iframe
                            src={videoUrl}
                            className="w-full h-full rounded-lg"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                );
            } else {
                // Handle uploaded videos
                return (
                    <div className="my-4">
                        <video
                            src={block.content}
                            controls
                            autoPlay={block.attributes?.autoplay}
                            loop={block.attributes?.loop}
                            muted={block.attributes?.muted}
                            className="max-w-full rounded-lg shadow-md"
                        />
                    </div>
                );
            }
        }

        case "code":
            return (
                <div className="my-4">
                    {block.attributes?.language && (
                        <div className="bg-gray-800 text-gray-300 px-4 py-2 rounded-t-lg text-sm font-mono">
                            {block.attributes.language}
                        </div>
                    )}
                    <pre
                        className={`bg-gray-900 text-gray-100 p-4 ${
                            block.attributes?.language
                                ? "rounded-b-lg"
                                : "rounded-lg"
                        } overflow-x-auto`}
                    >
                        <code className="font-mono text-sm">
                            {block.content}
                        </code>
                    </pre>
                </div>
            );

        default:
            return null;
    }
};

export default ContentBlockDisplay;
