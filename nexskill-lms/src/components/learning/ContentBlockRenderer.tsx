import React from 'react';
import type { LessonContentBlock } from '../../types/lesson';

interface ContentBlockRendererProps {
  contentBlocks: LessonContentBlock[];
}

const ContentBlockRenderer: React.FC<ContentBlockRendererProps> = ({ contentBlocks }) => {
  const renderBlock = (block: LessonContentBlock) => {
    switch (block.type) {
      case 'text':
        return (
          <div 
            key={block.id} 
            className="prose prose-slate dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: block.content }} 
          />
        );
      
      case 'heading':
        // Extract heading level from attributes or default to h2
        const headingLevel = block.attributes?.level || 2;
        const HeadingTag = `h${headingLevel}` as keyof JSX.IntrinsicElements;
        
        return (
          <HeadingTag 
            key={block.id} 
            className={`text-${Math.max(1, 6 - headingLevel)}xl font-bold mt-6 mb-4 text-slate-900 dark:text-dark-text-primary`}
          >
            {block.content}
          </HeadingTag>
        );
      
      case 'image':
        return (
          <div key={block.id} className="my-4">
            <img 
              src={block.content} 
              alt={block.attributes?.alt || ''} 
              className="max-w-full h-auto rounded-lg border border-slate-200 dark:border-gray-700"
            />
            {block.attributes?.caption && (
              <p className="text-center text-sm text-slate-600 dark:text-dark-text-secondary mt-2">
                {block.attributes.caption}
              </p>
            )}
          </div>
        );
      
      case 'video':
        return (
          <div key={block.id} className="my-4 aspect-video bg-black rounded-lg overflow-hidden">
            <video 
              controls 
              className="w-full h-full"
              poster={block.attributes?.poster || undefined}
            >
              <source src={block.content} type={block.attributes?.type || "video/mp4"} />
              Your browser does not support the video tag.
            </video>
          </div>
        );
      
      case 'code':
        return (
          <pre 
            key={block.id} 
            className="p-4 bg-slate-900 text-slate-100 dark:bg-gray-800 dark:text-dark-text-primary rounded-lg overflow-x-auto my-4 text-sm"
          >
            <code>{block.content}</code>
          </pre>
        );
      
      case 'list':
        const isOrdered = block.attributes?.ordered || false;
        const Tag = isOrdered ? 'ol' : 'ul';
        const listClasses = isOrdered 
          ? "list-decimal list-inside my-4 pl-4" 
          : "list-disc list-inside my-4 pl-4";
        
        // For simplicity, we'll treat the content as plain text for now
        // In a real implementation, you might want to parse the content into individual list items
        return (
          <Tag key={block.id} className={listClasses}>
            <li className="mb-1">{block.content}</li>
          </Tag>
        );
      
      case 'quote':
        return (
          <blockquote 
            key={block.id} 
            className="border-l-4 border-[#304DB5] pl-4 py-2 my-4 italic text-slate-700 dark:text-dark-text-secondary"
          >
            {block.content}
            {block.attributes?.author && (
              <footer className="text-sm not-italic mt-2 text-slate-500 dark:text-dark-text-muted">
                — {block.attributes.author}
              </footer>
            )}
          </blockquote>
        );
      
      case 'divider':
        return <hr key={block.id} className="my-6 border-t border-slate-200 dark:border-gray-700" />;
      
      case 'embed':
        return (
          <div key={block.id} className="my-4">
            <iframe
              src={block.content}
              width={block.attributes?.width || "100%"}
              height={block.attributes?.height || 400}
              className="rounded-lg border border-slate-200 dark:border-gray-700"
              frameBorder="0"
              allowFullScreen
            ></iframe>
          </div>
        );
      
      default:
        return (
          <div key={block.id} className="text-red-500">
            Unsupported content block type: {block.type}
          </div>
        );
    }
  };

  return (
    <div className="lesson-content-blocks">
      {contentBlocks
        .sort((a, b) => a.position - b.position) // Sort by position to ensure correct order
        .map(renderBlock)}
    </div>
  );
};

export default ContentBlockRenderer;