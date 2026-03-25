import React from 'react';
import DOMPurify from 'dompurify';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FileQuestion, Clock, CheckCircle, AlertCircle, Play } from 'lucide-react';
import type { LessonContentBlock } from '../../../types/lesson';

interface ContentBlockRendererProps {
  contentBlocks?: LessonContentBlock[];
  block?: LessonContentBlock;
  onQuizClick?: (quizId: string) => void;
}

const getEmbedUrl = (url: string): string | null => {
  const trimmed = url.trim();
  if (!trimmed) return null;

  // YouTube - handles watch?v=, youtu.be/, embed/
  const ytMatch = trimmed.match(/(?:youtube\.com\/watch\?.*v=|youtu\.be\/|youtube\.com\/embed\/)([^"&?\/\s]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  // Vimeo
  const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  // Direct video file
  if (trimmed.match(/\.(mp4|webm|ogg|mov)($|\?)/i)) return trimmed;

  return null;
};

const ContentBlockRenderer: React.FC<ContentBlockRendererProps> = ({ contentBlocks, block, onQuizClick }) => {
  const renderBlock = (b: LessonContentBlock) => {
    switch (b.type) {
      case 'text':
        return (
          <div
            key={b.id}
            className="prose prose-slate dark:prose-invert max-w-none mb-4"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(b.content),
            }}
          />
        );

      case 'heading': {
        const level = b.attributes?.level || 2;
        const HeadingTag = `h${Math.min(Math.max(level, 1), 6)}` as keyof JSX.IntrinsicElements;
        const sizeClasses: Record<number, string> = {
          1: 'text-3xl',
          2: 'text-2xl',
          3: 'text-xl',
          4: 'text-lg',
          5: 'text-base',
          6: 'text-sm',
        };
        return (
          <HeadingTag
            key={b.id}
            className={`${sizeClasses[level]} font-bold mt-6 mb-4 text-slate-900 dark:text-dark-text-primary`}
          >
            {b.content}
          </HeadingTag>
        );
      }

      case 'image':
        return (
          <div key={b.id} className="my-4">
            <img
              src={b.content}
              alt={b.attributes?.alt || ''}
              className="max-w-full h-auto rounded-lg border border-slate-200 dark:border-gray-700"
            />
            {b.attributes?.caption && (
              <p className="text-center text-sm text-slate-600 dark:text-dark-text-secondary mt-2">
                {b.attributes.caption}
              </p>
            )}
          </div>
        );

      case 'video': {
        const embedUrl = getEmbedUrl(b.content);
        
        if (!embedUrl) {
          return (
            <div key={b.id} className="my-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400">Invalid video URL: {b.content}</p>
            </div>
          );
        }

        const isDirect = embedUrl.match(/\.(mp4|webm|ogg|mov)($|\?)/i);

        return (
          <div key={b.id} className="my-4">
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              {isDirect ? (
                <video controls className="w-full h-full">
                  <source src={embedUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <iframe
                  src={embedUrl}
                  title="Video player"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
            {b.attributes?.caption && (
              <p className="text-center text-sm text-slate-600 dark:text-dark-text-secondary mt-2">
                {b.attributes.caption}
              </p>
            )}
          </div>
        );
      }

      case 'code': {
        const language = b.attributes?.language || 'typescript';
        return (
          <div key={b.id} className="my-4 rounded-lg overflow-hidden">
            <SyntaxHighlighter
              language={language}
              style={vscDarkPlus}
              customStyle={{ margin: 0, borderRadius: '0.5rem' }}
            >
              {b.content}
            </SyntaxHighlighter>
          </div>
        );
      }

      case 'list': {
        const isOrdered = b.attributes?.ordered || false;
        const ListTag = isOrdered ? 'ol' : 'ul';
        const items = b.content.split('\n').filter(item => item.trim());
        
        return (
          <ListTag key={b.id} className={`${isOrdered ? 'list-decimal' : 'list-disc'} list-inside my-4 pl-4`}>
            {items.map((item, idx) => (
              <li key={idx} className="mb-1 text-slate-700 dark:text-dark-text-secondary">
                {item.trim().replace(/^[-*]\s*/, '')}
              </li>
            ))}
          </ListTag>
        );
      }

      case 'quote':
        return (
          <blockquote
            key={b.id}
            className="border-l-4 border-brand-primary pl-4 py-2 my-4 italic text-slate-700 dark:text-dark-text-secondary bg-slate-50 dark:bg-slate-800/50 rounded-r-lg"
          >
            {b.content}
            {b.attributes?.author && (
              <footer className="text-sm not-italic mt-2 text-slate-500 dark:text-dark-text-muted">
                — {b.attributes.author}
              </footer>
            )}
          </blockquote>
        );

      case 'divider':
        return <hr key={b.id} className="my-6 border-t border-slate-200 dark:border-gray-700" />;

      case 'embed':
        return (
          <div key={b.id} className="my-4">
            <iframe
              src={b.content}
              className="w-full rounded-lg border border-slate-200 dark:border-gray-700"
              style={{ height: b.attributes?.height || 400 }}
              frameBorder="0"
              allowFullScreen
            />
          </div>
        );

      // ═════════════════════════════════════════════════════════════════
      // THE FIX: Added 'quiz' case here
      // ═════════════════════════════════════════════════════════════════
      case 'quiz': {
        const quizId = b.attributes?.quizId || (b as any).quizId;
        const title = b.attributes?.title || (b as any).title || 'Untitled Quiz';
        const description = b.attributes?.description || (b as any).description;
        const timeLimit = b.attributes?.timeLimitMinutes || (b as any).time_limit_minutes;
        const passingScore = b.attributes?.passingScore !== undefined ? b.attributes?.passingScore : (b as any).passing_score;
        const maxAttempts = b.attributes?.maxAttempts || (b as any).max_attempts;
        const isPublished = b.attributes?.isPublished !== undefined ? b.attributes?.isPublished : ((b as any).is_published ?? true);

        const handleQuizClick = () => {
          if (quizId && onQuizClick) {
            onQuizClick(quizId);
          }
        };

        return (
          <div key={b.id} className="my-6">
            <div 
              className={`
                relative overflow-hidden rounded-xl border-2 transition-all duration-200
                ${isPublished 
                  ? 'bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700 cursor-pointer' 
                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-75'
                }
              `}
              onClick={isPublished ? handleQuizClick : undefined}
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`
                    flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center
                    ${isPublished 
                      ? 'bg-purple-100 dark:bg-purple-800/50 text-purple-600 dark:text-purple-400' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }
                  `}>
                    <FileQuestion className="w-6 h-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                      {title}
                    </h3>
                    {description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                        {description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      {timeLimit && (
                        <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          {timeLimit} min
                        </span>
                      )}
                      {passingScore !== undefined && passingScore !== null && (
                        <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Pass: {passingScore}%
                        </span>
                      )}
                      {maxAttempts && (
                        <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {maxAttempts} attempt{maxAttempts !== 1 ? 's' : ''}
                        </span>
                      )}
                      {!isPublished && (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full font-medium">
                          <AlertCircle className="w-3 h-3" />
                          Unpublished
                        </span>
                      )}
                    </div>
                  </div>

                  {isPublished && (
                    <div className="flex-shrink-0">
                      <button 
                        className="
                          flex items-center gap-2 px-4 py-2 
                          bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-500
                          text-white text-sm font-medium rounded-lg 
                          transition-colors shadow-sm hover:shadow-md
                        "
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuizClick();
                        }}
                      >
                        <Play className="w-4 h-4" />
                        Start Quiz
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className={`
                h-1 w-full 
                ${isPublished 
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500' 
                  : 'bg-gray-300 dark:bg-gray-600'
                }
              `} />
            </div>
          </div>
        );
      }

      default:
        return (
          <div key={b.id} className="text-red-500 p-2 border border-red-200 rounded">
            Unsupported content block type: {(b as any).type}
          </div>
        );
    }
  };

  if (contentBlocks) {
    if (contentBlocks.length === 0) {
      return (
        <p className="text-sm text-gray-400 italic text-center py-8">
          No content available for this lesson yet.
        </p>
      );
    }
    return <div className="space-y-2">{contentBlocks.map((b) => renderBlock(b))}</div>;
  }

  if (block) {
    return <>{renderBlock(block)}</>;
  }

  return null;
};

export default ContentBlockRenderer;