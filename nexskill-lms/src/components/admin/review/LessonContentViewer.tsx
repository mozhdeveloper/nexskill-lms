import React from 'react';
import { FileText, Video, Code, Image, List, Quote, MinusSquare, ExternalLink, Clock } from 'lucide-react';

interface ContentBlock {
    id: string;
    type: 'text' | 'image' | 'video' | 'code' | 'heading' | 'list' | 'quote' | 'divider' | 'embed';
    content: string;
    attributes?: {
        caption?: string;
        level?: number;
        language?: string;
        alt?: string;
        external_url?: string;
        is_external?: boolean;
        [key: string]: any;
    };
    position: number;
}

interface LessonContentViewerProps {
    lessonId: string | null;
    lessonTitle: string | null;
    lessonDescription: string | null;
    contentBlocks: ContentBlock[];
    estimatedDuration: number | null;
}

const LessonContentViewer: React.FC<LessonContentViewerProps> = ({
    lessonId,
    lessonTitle,
    lessonDescription,
    contentBlocks,
    estimatedDuration
}) => {
    if (!lessonId) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                    <FileText size={48} className="mx-auto mb-3 opacity-50" />
                    <p>Select a lesson to view its content</p>
                </div>
            </div>
        );
    }

    const renderBlock = (block: ContentBlock) => {
        switch (block.type) {
            case 'text':
                return (
                    <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: block.content }}
                    />
                );

            case 'heading':
                const level = block.attributes?.level || 2;
                const headingClass = "font-bold text-gray-900";
                switch (level) {
                    case 1: return <h1 className={headingClass}>{block.content}</h1>;
                    case 2: return <h2 className={headingClass}>{block.content}</h2>;
                    case 3: return <h3 className={headingClass}>{block.content}</h3>;
                    case 4: return <h4 className={headingClass}>{block.content}</h4>;
                    case 5: return <h5 className={headingClass}>{block.content}</h5>;
                    case 6: return <h6 className={headingClass}>{block.content}</h6>;
                    default: return <h2 className={headingClass}>{block.content}</h2>;
                }

            case 'image':
                return (
                    <figure className="my-4">
                        <img
                            src={block.content}
                            alt={block.attributes?.alt || 'Lesson image'}
                            className="rounded-lg max-w-full h-auto"
                        />
                        {block.attributes?.caption && (
                            <figcaption className="text-sm text-gray-500 mt-2 text-center">
                                {block.attributes.caption}
                            </figcaption>
                        )}
                    </figure>
                );

            case 'video':
                if (block.attributes?.is_external && block.attributes?.external_url) {
                    // External video (YouTube/Vimeo)
                    return (
                        <div className="my-4">
                            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border">
                                <a
                                    href={block.attributes.external_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-[#304DB5] hover:underline"
                                >
                                    <ExternalLink size={20} />
                                    View External Video
                                </a>
                            </div>
                        </div>
                    );
                }
                return (
                    <div className="my-4">
                        <video
                            src={block.content}
                            controls
                            className="rounded-lg max-w-full"
                        />
                    </div>
                );

            case 'code':
                return (
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4">
                        <code className="text-sm font-mono">
                            {block.content}
                        </code>
                    </pre>
                );

            case 'list':
                return (
                    <ul className="list-disc list-inside space-y-1 my-4">
                        {block.content.split('\n').map((item, i) => (
                            <li key={i} className="text-gray-700">{item}</li>
                        ))}
                    </ul>
                );

            case 'quote':
                return (
                    <blockquote className="border-l-4 border-[#304DB5] pl-4 italic text-gray-600 my-4">
                        {block.content}
                    </blockquote>
                );

            case 'divider':
                return <hr className="border-gray-200 my-6" />;

            case 'embed':
                return (
                    <div className="my-4 p-4 bg-gray-50 rounded-lg border">
                        <p className="text-sm text-gray-500">Embedded content: {block.content}</p>
                    </div>
                );

            default:
                return (
                    <div className="p-4 bg-gray-50 rounded-lg border my-4">
                        <p className="text-sm text-gray-500">Unknown block type: {block.type}</p>
                    </div>
                );
        }
    };

    const getBlockIcon = (type: string) => {
        switch (type) {
            case 'text': return <FileText size={14} />;
            case 'video': return <Video size={14} />;
            case 'code': return <Code size={14} />;
            case 'image': return <Image size={14} />;
            case 'list': return <List size={14} />;
            case 'quote': return <Quote size={14} />;
            case 'divider': return <MinusSquare size={14} />;
            default: return <FileText size={14} />;
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden h-full flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#304DB5]/5 to-transparent">
                <h2 className="text-lg font-semibold text-gray-900">{lessonTitle}</h2>
                {lessonDescription && (
                    <p className="text-sm text-gray-500 mt-1">{lessonDescription}</p>
                )}
                {estimatedDuration && (
                    <div className="flex items-center gap-1 mt-2 text-sm text-gray-400">
                        <Clock size={14} />
                        <span>{estimatedDuration} min</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {contentBlocks.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <FileText size={48} className="mx-auto mb-3 opacity-50" />
                        <p>No content blocks in this lesson</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {contentBlocks
                            .sort((a, b) => a.position - b.position)
                            .map((block, index) => (
                                <div
                                    key={block.id || index}
                                    className="relative group"
                                >
                                    {/* Block type indicator */}
                                    <div className="absolute -left-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-gray-400" title={block.type}>
                                            {getBlockIcon(block.type)}
                                        </span>
                                    </div>
                                    {renderBlock(block)}
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LessonContentViewer;
