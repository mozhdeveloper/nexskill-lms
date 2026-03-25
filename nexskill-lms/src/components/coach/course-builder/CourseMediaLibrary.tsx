import React, { useState, useEffect } from 'react';
import { Upload, FileText, Image, Video, Trash2, ExternalLink, Loader } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';

interface CourseMedia {
  id: string;
  courseId: string;
  type: 'image' | 'video' | 'document';
  filename: string;
  url: string;
  fileSize: number;
  uploadedAt: string;
}

interface CourseMediaLibraryProps {
  courseId: string;
}

const CourseMediaLibrary: React.FC<CourseMediaLibraryProps> = ({ courseId }) => {
  const [media, setMedia] = useState<CourseMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'images' | 'videos' | 'documents'>('all');

  useEffect(() => {
    fetchMedia();
  }, [courseId]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      // Fetch media from lessons associated with this course
      const { data: modules } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', courseId);

      if (!modules || modules.length === 0) {
        setMedia([]);
        return;
      }

      // Fetch all lessons in these modules
      const moduleIds = modules.map(m => m.id);
      const { data: contentItems } = await supabase
        .from('module_content_items')
        .select('content_id, content_type')
        .in('module_id', moduleIds)
        .eq('content_type', 'lesson');

      if (!contentItems || contentItems.length === 0) {
        setMedia([]);
        return;
      }

      const lessonIds = contentItems.map(ci => ci.content_id);
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, content_blocks')
        .in('id', lessonIds);

      // Extract media from content blocks
      const extractedMedia: CourseMedia[] = [];
      lessons?.forEach(lesson => {
        const blocks = lesson.content_blocks as any[];
        if (Array.isArray(blocks)) {
          blocks.forEach(block => {
            if (['image', 'video', 'document'].includes(block.type) && block.content) {
              const type = block.type as 'image' | 'video' | 'document';
              extractedMedia.push({
                id: `${lesson.id}-${block.id}`,
                courseId,
                type,
                filename: block.attributes?.alt || block.attributes?.original_filename || 'Untitled',
                url: block.content,
                fileSize: block.attributes?.bytes || 0,
                uploadedAt: new Date().toISOString(),
              });
            }
          });
        }
      });

      setMedia(extractedMedia);
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (mediaId: string) => {
    if (!window.confirm('Are you sure you want to delete this media? It may be used in lessons.')) {
      return;
    }

    try {
      setMedia(media.filter(m => m.id !== mediaId));
    } catch (error) {
      console.error('Error deleting media:', error);
      alert('Failed to delete media');
    }
  };

  const filteredMedia = media.filter(m => {
    if (activeTab === 'all') return true;
    if (activeTab === 'images') return m.type === 'image';
    if (activeTab === 'videos') return m.type === 'video';
    if (activeTab === 'documents') return m.type === 'document';
    return false;
  });

  const getIcon = (type: 'image' | 'video' | 'document') => {
    switch (type) {
      case 'image':
        return <Image className="w-5 h-5 text-blue-500" />;
      case 'video':
        return <Video className="w-5 h-5 text-purple-500" />;
      case 'document':
        return <FileText className="w-5 h-5 text-orange-500" />;
      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-dark-text-primary">Media Library</h2>
          <p className="text-sm text-slate-600 dark:text-dark-text-secondary mt-1">
            View all media files used in your course
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        {(['all', 'images', 'videos', 'documents'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium text-sm transition-colors capitalize border-b-2 ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            {tab === 'documents' ? 'PDF/PPT' : tab}
          </button>
        ))}
      </div>

      {/* Media Grid */}
      {filteredMedia.length === 0 ? (
        <div className="text-center py-12">
          <Upload className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">
            No media yet
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500">
            {activeTab === 'all'
              ? 'Add media to your lessons to see it here'
              : `No ${activeTab.slice(0, -1)} files yet`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMedia.map(m => (
            <div
              key={m.id}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-slate-100 dark:bg-slate-900 flex items-center justify-center relative group">
                {m.type === 'image' ? (
                  <img
                    src={m.url}
                    alt={m.filename}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Image';
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full">
                    {getIcon(m.type)}
                  </div>
                )}

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white rounded-lg hover:bg-slate-100 transition-colors"
                    title="Open media"
                  >
                    <ExternalLink className="w-5 h-5 text-slate-700" />
                  </a>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="p-2 bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                    title="Delete media"
                  >
                    <Trash2 className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h4 className="font-medium text-slate-900 dark:text-white truncate" title={m.filename}>
                  {m.filename}
                </h4>
                <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    {getIcon(m.type)}
                    {m.type.charAt(0).toUpperCase() + m.type.slice(1)}
                  </span>
                  <span>{formatFileSize(m.fileSize)}</span>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {formatDate(m.uploadedAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Footer */}
      {media.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 flex items-center justify-between">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Total media files: <span className="font-semibold text-slate-900 dark:text-white">{media.length}</span>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              Images: <span className="font-semibold">{media.filter(m => m.type === 'image').length}</span>
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              Videos: <span className="font-semibold">{media.filter(m => m.type === 'video').length}</span>
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              Documents: <span className="font-semibold">{media.filter(m => m.type === 'document').length}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseMediaLibrary;
