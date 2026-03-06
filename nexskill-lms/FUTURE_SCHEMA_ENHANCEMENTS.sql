-- Optional Database Schema Enhancements for Future Phases
-- These tables are NOT required for current implementation
-- They would be useful for advanced features (phase 2/3)

-- PHASE 2: Dedicated Media Library Table (Optional)
-- This would replace the current approach of storing media within lesson content_blocks
-- Pros: Better searchability, reusability across courses, tracking
-- Cons: More complex schema, migration required

/*
CREATE TABLE public.course_media (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  media_type text NOT NULL CHECK (media_type = ANY (ARRAY['image'::text, 'video'::text, 'document'::text])),
  filename text NOT NULL,
  original_filename text,
  cloudinary_public_id text,
  bucket_path text,
  url text NOT NULL,
  file_size_bytes bigint,
  mime_type text,
  metadata jsonb,
  usage_count integer DEFAULT 0,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT course_media_pkey PRIMARY KEY (id),
  CONSTRAINT course_media_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT course_media_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

CREATE INDEX course_media_course_id_idx ON public.course_media(course_id);
CREATE INDEX course_media_type_idx ON public.course_media(media_type);
*/

-- PHASE 2: Document-Specific Uploads Table (Optional)
-- Tracks document uploads separately with additional metadata

/*
CREATE TABLE public.document_uploads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type = ANY (ARRAY['lesson'::text, 'assignment'::text])),
  content_id uuid NOT NULL,
  bucket_path text NOT NULL,
  file_name text NOT NULL,
  file_size_bytes bigint NOT NULL,
  mime_type text NOT NULL,
  processing_status text DEFAULT 'pending'::text CHECK (processing_status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text])),
  processing_error text,
  pages_count integer,
  searchable_text text,
  uploaded_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT document_uploads_pkey PRIMARY KEY (id),
  CONSTRAINT document_uploads_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id)
);

CREATE INDEX document_uploads_content_idx ON public.document_uploads(content_type, content_id);
*/

-- PHASE 3: Media Usage Tracking (Optional)
-- Track which lessons use which media files for analytics

/*
CREATE TABLE public.media_lesson_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  media_id uuid NOT NULL,
  lesson_id uuid NOT NULL,
  position integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT media_lesson_usage_pkey PRIMARY KEY (id),
  CONSTRAINT media_lesson_usage_media_id_fkey FOREIGN KEY (media_id) REFERENCES public.course_media(id),
  CONSTRAINT media_lesson_usage_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id)
);

CREATE INDEX media_lesson_usage_lesson_idx ON public.media_lesson_usage(lesson_id);
CREATE INDEX media_lesson_usage_media_idx ON public.media_lesson_usage(media_id);
*/

-- PHASE 3: Document Access Tracking (Optional)
-- Track which students have downloaded or viewed documents

/*
CREATE TABLE public.document_access (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  user_id uuid NOT NULL,
  action text CHECK (action = ANY (ARRAY['viewed'::text, 'downloaded'::text, 'printed'::text])),
  accessed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT document_access_pkey PRIMARY KEY (id),
  CONSTRAINT document_access_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.document_uploads(id),
  CONSTRAINT document_access_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE INDEX document_access_user_idx ON public.document_access(user_id);
CREATE INDEX document_access_document_idx ON public.document_access(document_id);
*/

-- CURRENT IMPLEMENTATION: 
-- Media is stored within lesson.content_blocks as JSONB
-- No additional tables needed for basic functionality
-- This is simple, flexible, and works well for current use cases

-- Example of content_block structure in lessons table:
/*
{
  "id": "uuid-here",
  "type": "document",
  "content": "https://cloudinary.com/url-to-document",
  "position": 2,
  "attributes": {
    "alt": "Course_Handbook.pdf",
    "caption": "Download the full course handbook",
    "media_metadata": {
      "public_id": "course-handbook",
      "url": "https://cloudinary.com/course-handbook.pdf",
      "original_filename": "Course_Handbook.pdf",
      "bytes": 2097152,
      "resource_type": "raw",
      "secure_url": "https://cloudinary.com/course-handbook.pdf"
    }
  }
}
*/
