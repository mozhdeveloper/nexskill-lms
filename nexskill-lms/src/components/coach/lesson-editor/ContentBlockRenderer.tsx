import React, { useState } from 'react';
import DOMPurify from 'dompurify';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Play, X } from 'lucide-react';
import type { LessonContentBlock } from '../../../types/lesson';

interface ContentBlockRendererProps {
  block: LessonContentBlock;
}

const ContentBlockRenderer: React.FC<ContentBlockRendererProps> = ({ block }) => {
  const [showVideoModal, setShowVideoModal] = useState(false);

  if (!block.content) return null;

  // Debug: Log the video URL to check format
  console.log('Video Block:', {
    content: block.content,
    is_external: block.attributes?.is_external,
    has_media_metadata: !!block.attributes?.media_metadata,
    has_secure_url: !!block.attributes?.media_metadata?.secure_url,
    has_source_url: !!block.attributes?.source_url,
  });

  // Check if this is an UPLOADED video (from Cloudinary)
  // Check multiple indicators:
  const hasMetadata = !!block.attributes?.media_metadata;
  const hasSecureUrl = !!block.attributes?.media_metadata?.secure_url;
  const hasSourceUrl = !!block.attributes?.source_url;
  const isNotExternal = block.attributes?.is_external === false;
  
  // Cloudinary URLs contain these patterns
  const isCloudinaryUrl = block.content.includes('cloudinary.com') || 
                          block.content.includes('res.cloudinary.com');
  
  // External video platforms
  const isYouTube = block.content.includes('youtube.com') || block.content.includes('youtu.be');
  const isVimeo = block.content.includes('vimeo.com');
  
  // Determine video type
  const isUploadedVideo = (hasMetadata || hasSecureUrl || hasSourceUrl || isNotExternal) && isCloudinaryUrl && !isYouTube && !isVimeo;
  const isExternalVideo = isYouTube || isVimeo;

  console.log('Video Detection:', {
    isUploadedVideo,
    isExternalVideo,
    isCloudinaryUrl,
    isYouTube,
    isVimeo,
  });

  const openVideoModal = () => setShowVideoModal(true);
  const closeVideoModal = () => setShowVideoModal(false);

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
        3: 'text-xl font-semibold mt-4 mb-2 text-gray-900 dark:text-white'
      };
      return (
        <HeadingTag className={styles[level as keyof typeof styles] || styles[2]}>
          {block.content}
        </HeadingTag>
      );
    }

    case 'image':
      return (
        <div className="my-6">
          <img
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
        <div className="my-6 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {block.attributes?.language || 'Code'}
            </span>
          </div>
          <SyntaxHighlighter
            language={block.attributes?.language || 'typescript'}
            style={vscDarkPlus}
            showLineNumbers
            customStyle={{
              margin: 0,
              padding: '1.5rem',
              borderRadius: 0,
              fontSize: '0.875rem',
            }}
          >
            {block.content}
          </SyntaxHighlighter>
        </div>
      );

    case 'video':
      // ============================================
      // UPLOADED VIDEO (Cloudinary) - INLINE player
      // ============================================
      if (isUploadedVideo && !isExternalVideo) {
        const metadata = block.attributes?.media_metadata;
        const videoUrl = metadata?.secure_url || metadata?.source_url || block.content;
        
        console.log('Rendering UPLOADED video inline:', videoUrl);
        
        return (
          <div className="my-6">
            <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 bg-black">
              <video
                src={videoUrl}
                controls
                className="w-full aspect-video"
                poster={metadata?.thumbnail_url}
                preload="metadata"
              >
                <track kind="captions" />
                Your browser does not support the video tag.
              </video>
            </div>
            {block.attributes?.caption && (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2 italic">
                {block.attributes.caption}
              </p>
            )}
            {metadata?.original_filename && (
              <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-1">
                {metadata.original_filename}
                {metadata.duration && (
                  <span className="ml-2">
                    • {Math.floor(metadata.duration / 60)}:
                    {String(Math.floor(metadata.duration % 60)).padStart(2, '0')}
                  </span>
                )}
              </p>
            )}
          </div>
        );
      }

      // ============================================
      // EXTERNAL VIDEO (YouTube/Vimeo) - MODAL
      // ============================================
      if (isExternalVideo) {
        let thumbnailUrl = 'https://via.placeholder.com/640x360?text=Video+Preview';
        let embedUrl = block.content;
        let videoTitle = isYouTube ? 'YouTube Video' : 'Vimeo Video';

        if (isYouTube) {
          const videoId = block.content.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/)?.[1];
          if (videoId) {
            thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            embedUrl = block.content.includes('watch?v=')
              ? block.content.replace('watch?v=', 'embed/')
              : `https://www.youtube.com/embed/${videoId}`;
          }
        } else if (isVimeo) {
          const videoId = block.content.match(/vimeo\.com\/(?:.*\/)?(\d+)/)?.[1];
          if (videoId) {
            thumbnailUrl = `https://vumbnail.com/${videoId}.jpg`;
            embedUrl = `https://player.vimeo.com/video/${videoId}`;
          }
        }

        console.log('Rendering EXTERNAL video with modal:', embedUrl);

        return (
          <>
            {/* Thumbnail with Play Button */}
            <div className="my-6">
              <div
                onClick={openVideoModal}
                className="relative rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 aspect-video cursor-pointer group"
              >
                <img
                  src={thumbnailUrl}
                  alt="Video thumbnail"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/640x360?text=Video+Preview';
                  }}
                />
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center group-hover:bg-black/60 transition-colors">
                  <div className="w-20 h-20 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                    <Play className="w-10 h-10 text-[#304DB5] ml-1" />
                  </div>
                </div>

                {/* Video Info */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  {block.attributes?.caption && (
                    <p className="text-white text-sm font-medium">
                      {block.attributes.caption}
                    </p>
                  )}
                  <p className="text-white/80 text-xs mt-1">
                    {videoTitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Video Modal */}
            {showVideoModal && (
              <div
                className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                onClick={closeVideoModal}
              >
                <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={closeVideoModal}
                    className="absolute -top-12 right-0 flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-lg"
                  >
                    <X className="w-5 h-5" />
                    Close
                  </button>

                  <div className="bg-black rounded-xl overflow-hidden shadow-2xl aspect-video">
                    <iframe
                      src={embedUrl}
                      className="w-full h-full"
                      title="Video player"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      autoPlay
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        );
      }

      // ============================================
      // Fallback - Direct video file (treat as uploaded)
      // ============================================
      console.log('Rendering FALLBACK video inline:', block.content);
      
      return (
        <div className="my-6">
          <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 bg-black">
            <video
              src={block.content}
              controls
              className="w-full aspect-video"
              preload="metadata"
            >
              <track kind="captions" />
              Your browser does not support the video tag.
            </video>
          </div>
          {block.attributes?.caption && (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2 italic">
              {block.attributes.caption}
            </p>
          )}
        </div>
      );

    default:
      return (
        <div className="p-4 my-4 bg-gray-50 text-gray-500 rounded text-sm italic border border-dashed border-gray-200 text-center">
          Unsupported block type: {block.type}
        </div>
      );
  }
};

export default React.memo(ContentBlockRenderer);
