import React, { useState } from 'react';
import DOMPurify from 'dompurify';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Play, X } from 'lucide-react';
import type { LessonContentBlock } from '../../../types/lesson';
import MediaPreview from '../../MediaPreview';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContentBlockRendererProps {
  /** Array of blocks — used by CoursePlayer (student view) */
  contentBlocks?: LessonContentBlock[];
  /** Single block — used by editor / admin view */
  block?: LessonContentBlock;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Converts any YouTube / Vimeo / direct-video URL into an embeddable src.
 * Returns null if the URL is empty or unrecognised.
 */
const getEmbedUrl = (url: string): string | null => {
  const trimmed = url.trim();
  if (!trimmed) return null;
  const ytMatch = trimmed.match(/(?:youtube\.com\/watch\?.*v=|youtu\.be\/|youtube\.com\/embed\/)([^"&?\/\s]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  if (trimmed.match(/\.(mp4|webm|ogg|mov)($|\?)/i)) return trimmed;
  return null;
};

// ─── Single-block renderer ────────────────────────────────────────────────────

const renderBlock = (block: LessonContentBlock) => {
  switch (block.type) {

    case 'text':
      return (
        <div 
          className="prose dark:prose-invert max-w-none mb-4 text-gray-700 dark:text-gray-300 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.content) }}
        />
      );

    case 'heading': {
      const level = block.attributes?.level || 2;
      const HeadingTag = `h${level}` as React.ElementType; 
      const styles = {
        1: 'text-3xl font-bold mt-8 mb-4 text-gray-900 dark:text-white border-b pb-2 border-gray-100 dark:border-gray-800',
        2: 'text-2xl font-bold mt-6 mb-3 text-gray-900 dark:text-white',
        3: 'text-xl font-semibold mt-4 mb-2 text-gray-900 dark:text-white',
      };
      
      return (
        <HeadingTag key={block.id} className={styles[level] || styles[2]}>
          {block.content}
        </HeadingTag>
      );
    }


    case 'image':
      if (!block.content) return null;
      return (
        <div className="my-6">
          <img
          key={block.id}
            src={block.content}
            alt={block.attributes?.alt || 'Lesson image'}
            className="w-full h-auto max-h-[600px] object-contain rounded-xl shadow-lg"
          />
          {block.attributes?.caption && (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2 italic">
              {block.attributes.caption}
            </p>
          )}
        </div>
      );

    case 'code':
      return (
        <div
          key={block.id}
          className="my-6 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800"
        >
          <div className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {block.attributes?.language || 'Code'}
            </span>
          </div>
          <SyntaxHighlighter
            language={block.attributes?.language || 'typescript'}
            style={vscDarkPlus}
            showLineNumbers
            customStyle={{ margin: 0, padding: '1.5rem', borderRadius: 0, fontSize: '0.875rem' }}
          >
            {block.content}
          </SyntaxHighlighter>
        </div>
      );

    case 'video': {
      if (!block.content) return null;

      const embedUrl = getEmbedUrl(block.content);
      if (!embedUrl) return null;

      const isDirect = /\.(mp4|webm|ogg|mov)($|\?)/i.test(embedUrl);

      return (
        <div key={block.id} className="my-4 rounded-xl overflow-hidden bg-black shadow-md">
          <div className="aspect-video">
            {isDirect ? (
              <video
                controls
                className="w-full h-full"
                src={embedUrl}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <iframe
                src={embedUrl}
                title={block.attributes?.caption || 'Lesson video'}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
          {block.attributes?.caption && (
            <p className="px-4 py-2 text-xs text-gray-400 bg-gray-900 text-center">
              {block.attributes.caption}
            </p>
          )}
        </div>
      );
    }

    default:
      return (
        <div
          key={(block as any).id}
          className="p-4 my-4 bg-gray-50 text-gray-500 rounded text-sm italic border border-dashed border-gray-200 text-center"
        >
          Unsupported block type: {block.type}
        </div>
      );
  }
};

// ─── Component ────────────────────────────────────────────────────────────────

const ContentBlockRenderer: React.FC<ContentBlockRendererProps> = ({ contentBlocks, block }) => {
  if (contentBlocks) {
    if (contentBlocks.length === 0) {
      return (
        <p className="text-sm text-gray-400 italic text-center py-8">
          No content available for this lesson yet.
        </p>
      );
    }
    return <>{contentBlocks.map((b) => renderBlock(b))}</>;
  }

  if (block) return <>{renderBlock(block)}</>;

  return null;
};

export default React.memo(ContentBlockRenderer);