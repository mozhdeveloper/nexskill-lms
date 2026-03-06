## Part 2: Application Implementation

### 1. Create File Upload Utility

Create `src/utils/fileUpload.ts`:

```typescript
import { supabase } from "../lib/supabaseClient";
import { v4 as uuidv4 } from "uuid";

interface UploadResult {
    url: string;
    path: string;
    fileId: string;
}

export async function uploadLessonFile(
    file: File,
    fileType: "image" | "pdf"
): Promise<UploadResult> {
    try {
        // Validate file
        if (fileType === "image" && !file.type.startsWith("image/")) {
            throw new Error("Please upload an image file");
        }
        if (fileType === "pdf" && file.type !== "application/pdf") {
            throw new Error("Please upload a PDF file");
        }

        // Create unique file path
        const fileExt = file.name.split(".").pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `editor-uploads/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from("course-assets")
            .upload(filePath, file, {
                cacheControl: "3600",
                upsert: false,
            });

        if (uploadError) throw uploadError;

        // Get public URL
        const {
            data: { publicUrl },
        } = supabase.storage.from("course-assets").getPublicUrl(filePath);

        // Track file in database
        const { data: fileData, error: dbError } = await supabase
            .from("lesson_content_files")
            .insert({
                file_url: publicUrl,
                file_path: filePath,
                file_name: file.name,
                file_type: fileType,
                file_size_bytes: file.size,
                mime_type: file.type,
                reference_count: 0, // Will be incremented when lesson is saved
            })
            .select("id")
            .single();

        if (dbError) throw dbError;

        return {
            url: publicUrl,
            path: filePath,
            fileId: fileData.id,
        };
    } catch (error) {
        console.error("Upload error:", error);
        throw error;
    }
}

export function extractImageUrlsFromHTML(html: string): string[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const images = doc.querySelectorAll("img");
    return Array.from(images).map((img) => img.src);
}

export function extractPdfUrlsFromHTML(html: string): string[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const links = doc.querySelectorAll('a[href$=".pdf"]');
    return Array.from(links)
        .map((link) => link.getAttribute("href"))
        .filter(Boolean) as string[];
}

export function extractAllFileUrls(contentBlocks: any[]): string[] {
    const urls: string[] = [];

    contentBlocks.forEach((block) => {
        if (block.type === "text") {
            // Extract from HTML content
            urls.push(...extractImageUrlsFromHTML(block.content));
            urls.push(...extractPdfUrlsFromHTML(block.content));
        } else if (block.type === "image" && block.content) {
            urls.push(block.content);
        }
    });

    return [...new Set(urls)]; // Remove duplicates
}

export async function updateFileReferences(
    lessonId: string,
    previousUrls: string[],
    currentUrls: string[]
) {
    const newUrls = currentUrls.filter((url) => !previousUrls.includes(url));
    const removedUrls = previousUrls.filter(
        (url) => !currentUrls.includes(url)
    );

    if (newUrls.length === 0 && removedUrls.length === 0) {
        return; // No changes
    }

    try {
        // Update reference counts
        await supabase.rpc("batch_update_file_references", {
            increment_urls: newUrls,
            decrement_urls: removedUrls,
        });

        // Update lesson_file_references table
        if (newUrls.length > 0) {
            const { data: fileData } = await supabase
                .from("lesson_content_files")
                .select("id, file_url")
                .in("file_url", newUrls);

            if (fileData) {
                const references = fileData.map((file) => ({
                    lesson_id: lessonId,
                    file_id: file.id,
                }));

                await supabase
                    .from("lesson_file_references")
                    .insert(references);
            }
        }

        if (removedUrls.length > 0) {
            const { data: fileData } = await supabase
                .from("lesson_content_files")
                .select("id")
                .in("file_url", removedUrls);

            if (fileData) {
                await supabase
                    .from("lesson_file_references")
                    .delete()
                    .eq("lesson_id", lessonId)
                    .in(
                        "file_id",
                        fileData.map((f) => f.id)
                    );
            }
        }
    } catch (error) {
        console.error("Error updating file references:", error);
        throw error;
    }
}

export async function deleteFile(filePath: string) {
    try {
        const { error } = await supabase.storage
            .from("course-assets")
            .remove([filePath]);

        if (error) throw error;
    } catch (error) {
        console.error("Error deleting file:", error);
    }
}
```

### 2. Update RichTextEditor Component

Update `src/components/lessons/RichTextEditor.tsx`:

```typescript
import React, { useCallback, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Code,
    Heading1,
    Heading2,
    Heading3,
    Heading4,
    List,
    ListOrdered,
    Quote,
    Link as LinkIcon,
    Image as ImageIcon,
    Minus,
    Palette,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Undo,
    Redo,
    Trash2,
    Loader2,
    FileText,
} from "lucide-react";
import { uploadLessonFile } from "../../utils/fileUpload";

interface RichTextEditorProps {
    content: string;
    onUpdate: (content: string) => void;
    placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
    content,
    onUpdate,
    placeholder = "Write your lesson content here...",
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pdfInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({ placeholder }),
            Underline,
            Highlight.configure({ multicolor: true }),
            Link.configure({
                openOnClick: false,
                autolink: true,
            }),
            TextAlign.configure({
                types: ["heading", "paragraph"],
            }),
            Image,
        ],
        content,
        onUpdate: useCallback(
            ({ editor }) => {
                onUpdate(editor.getHTML());
            },
            [onUpdate]
        ),
    });

    const setLink = useCallback(() => {
        if (!editor) return;
        const previousUrl = editor.getAttributes("link").href;
        const url = window.prompt("URL", previousUrl);

        if (url === null) return;

        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }

        editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: url })
            .run();
    }, [editor]);

    const addImage = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const addPdf = useCallback(() => {
        pdfInputRef.current?.click();
    }, []);

    const handleImageUpload = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (!file || !editor) return;

        setIsUploading(true);

        try {
            const { url } = await uploadLessonFile(file, "image");
            editor.chain().focus().setImage({ src: url }).run();
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Failed to upload image. Please try again.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handlePdfUpload = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (!file || !editor) return;

        setIsUploading(true);

        try {
            const { url } = await uploadLessonFile(file, "pdf");
            editor
                .chain()
                .focus()
                .setLink({ href: url })
                .insertContent(`📄 ${file.name}`)
                .run();
        } catch (error) {
            console.error("Error uploading PDF:", error);
            alert("Failed to upload PDF. Please try again.");
        } finally {
            setIsUploading(false);
            if (pdfInputRef.current) {
                pdfInputRef.current.value = "";
            }
        }
    };

    if (!editor) return null;

    return (
        <div className="border border-slate-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
            />
            <input
                type="file"
                ref={pdfInputRef}
                className="hidden"
                accept="application/pdf"
                onChange={handlePdfUpload}
            />

            {/* Toolbar - keep your existing toolbar code */}
            <div className="bg-slate-50 dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 p-2 flex flex-wrap items-center gap-2">
                {/* ... your existing toolbar buttons ... */}

                {isUploading && (
                    <div className="ml-auto flex items-center gap-2 text-sm text-blue-600">
                        <Loader2 size={16} className="animate-spin" />
                        <span>Uploading...</span>
                    </div>
                )}
            </div>

            {/* Editor Content */}
            <div className="p-4 min-h-[300px] bg-white dark:bg-gray-900">
                <EditorContent
                    editor={editor}
                    className="prose prose-slate dark:prose-invert max-w-none min-h-[250px]"
                />
            </div>
        </div>
    );
};

export default RichTextEditor;
```

### 3. Update LessonEditorPanel Component

Update `src/components/lessons/LessonEditorPanel.tsx`:

```typescript
import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Lesson, LessonContentBlock } from "../../types/lesson";
import RichTextEditor from "./RichTextEditor";
import {
    extractAllFileUrls,
    updateFileReferences,
} from "../../utils/fileUpload";

interface LessonEditorPanelProps {
    lesson: Lesson;
    onChange: (updatedLesson: Lesson) => void;
    onClose: () => void;
    onSave: (lesson: Lesson) => Promise<void>; // Add this prop
}

const LessonEditorPanel: React.FC<LessonEditorPanelProps> = ({
    lesson,
    onChange,
    onClose,
    onSave,
}) => {
    const [isSaving, setIsSaving] = useState(false);
    const initialFileUrlsRef = useRef<string[]>([]);

    // Track initial file URLs when component mounts
    useEffect(() => {
        initialFileUrlsRef.current = extractAllFileUrls(
            lesson.content_blocks || []
        );
    }, []);

    const handleInputChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;
        let newValue: any = value;

        if (name === "estimated_duration_minutes") {
            newValue = parseInt(value) || undefined;
        } else if (name === "is_published") {
            newValue = value === "true";
        }

        onChange({ ...lesson, [name]: newValue });
    };

    // ... keep all your existing handler functions ...

    const handleSave = async () => {
        // Validate required fields
        if (!lesson.title.trim()) {
            alert("Please enter a lesson title");
            return;
        }

        setIsSaving(true);

        try {
            // Save lesson first
            await onSave(lesson);

            // Update file references after successful save
            const currentFileUrls = extractAllFileUrls(
                lesson.content_blocks || []
            );
            await updateFileReferences(
                lesson.id,
                initialFileUrlsRef.current,
                currentFileUrls
            );

            // Update the ref for future saves
            initialFileUrlsRef.current = currentFileUrls;

            onClose();
        } catch (error) {
            console.error("Error saving lesson:", error);
            alert("Failed to save lesson. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = async () => {
        // Get current file URLs
        const currentFileUrls = extractAllFileUrls(lesson.content_blocks || []);

        // Find files that were added but not saved
        const unsavedFileUrls = currentFileUrls.filter(
            (url) => !initialFileUrlsRef.current.includes(url)
        );

        // Clean up unsaved files by decrementing their reference (they start at 0)
        if (unsavedFileUrls.length > 0) {
            try {
                await updateFileReferences(lesson.id, unsavedFileUrls, []);
            } catch (error) {
                console.error("Error cleaning up unsaved files:", error);
            }
        }

        onClose();
    };

    return (
        <div className="fixed inset-0 bg-white dark:bg-dark-background-card z-50 flex flex-col">
            {/* ... keep your existing JSX ... */}

            {/* Update Footer buttons */}
            <div className="sticky bottom-0 bg-slate-50 dark:bg-gray-800 border-t border-slate-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
                <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="px-6 py-2.5 text-slate-700 dark:text-dark-text-primary font-medium rounded-full border-2 border-slate-300 dark:border-gray-600 hover:bg-white dark:bg-dark-background-card transition-all disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                >
                    {isSaving ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Saving...
                        </>
                    ) : (
                        "Save lesson"
                    )}
                </button>
            </div>
        </div>
    );
};

export default LessonEditorPanel;
```

### 4. Create Cleanup Edge Function

Create `supabase/functions/cleanup-orphaned-files/index.ts`:

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Get orphaned files (7+ days old with 0 references)
        const { data: orphanedFiles, error: fetchError } = await supabase.rpc(
            "get_orphaned_files",
            { days_old: 7 }
        );

        if (fetchError) throw fetchError;

        if (!orphanedFiles || orphanedFiles.length === 0) {
            return new Response(
                JSON.stringify({
                    message: "No orphaned files to clean up",
                    deleted: 0,
                }),
                { headers: { "Content-Type": "application/json" } }
            );
        }

        let deletedCount = 0;

        // Delete each orphaned file
        for (const file of orphanedFiles) {
            try {
                // Delete from storage
                const { error: storageError } = await supabase.storage
                    .from("course-assets")
                    .remove([file.file_path]);

                if (storageError) {
                    console.error(
                        `Failed to delete ${file.file_path}:`,
                        storageError
                    );
                    continue;
                }

                // Delete from database
                const { error: dbError } = await supabase
                    .from("lesson_content_files")
                    .delete()
                    .eq("id", file.id);

                if (dbError) {
                    console.error(
                        `Failed to delete record ${file.id}:`,
                        dbError
                    );
                    continue;
                }

                deletedCount++;
            } catch (error) {
                console.error(`Error processing file ${file.id}:`, error);
            }
        }

        return new Response(
            JSON.stringify({
                message: `Cleanup completed`,
                total: orphanedFiles.length,
                deleted: deletedCount,
                failed: orphanedFiles.length - deletedCount,
            }),
            { headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Cleanup error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});
```

Deploy the function:

```bash
supabase functions deploy cleanup-orphaned-files
```

### 5. Schedule Cleanup with Cron Job

In Supabase Dashboard → Database → Cron Jobs (using pg_cron):

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule weekly cleanup (every Sunday at 2 AM)
SELECT cron.schedule(
  'cleanup-orphaned-files',
  '0 2 * * 0',
  $$
  SELECT net.http_post(
    url := 'YOUR_SUPABASE_PROJECT_URL/functions/v1/cleanup-orphaned-files',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

---

## Part 3: Testing Checklist

### Test Scenarios

1. **Upload and Save**

    - [ ] Upload image in RichTextEditor
    - [ ] Save lesson
    - [ ] Verify file appears in `lesson_content_files` with `reference_count = 1`
    - [ ] Verify entry in `lesson_file_references`

2. **Remove File and Save**

    - [ ] Remove image from editor
    - [ ] Save lesson
    - [ ] Verify `reference_count` decremented to 0
    - [ ] Verify `lesson_file_references` entry removed

3. **Upload and Cancel**

    - [ ] Upload image
    - [ ] Click Cancel without saving
    - [ ] Verify file cleanup happens (reference stays at 0)

4. **Multiple Files**

    - [ ] Add 3 images and 2 PDFs
    - [ ] Save lesson
    - [ ] Verify all 5 files tracked correctly

5. **Cleanup Function**
    - [ ] Manually run cleanup function
    - [ ] Verify orphaned files (7+ days, 0 refs) are deleted

---

## Summary of Changes

### In Supabase:

1. ✅ Storage bucket: `course-assets` (already exists)
2. ✅ New tables: `lesson_content_files`, `lesson_file_references`
3. ✅ Database functions for reference counting
4. ✅ Edge function for automated cleanup
5. ✅ Cron job for weekly cleanup

### In React App:

1. ✅ Utility functions in `src/utils/fileUpload.ts`
2. ✅ Updated `RichTextEditor` with improved upload handling
3. ✅ Updated `LessonEditorPanel` with save/cancel logic
4. ✅ File reference tracking on save/cancel

### Benefits:

-   ✅ **Zero orphaned files** after 7 days
-   ✅ **Automatic cleanup** via cron job
-   ✅ **Handles multiple references** (same file in multiple lessons)
-   ✅ **Reliable** server-side tracking
-   ✅ **Scalable** to thousands of lessons and files
-   ✅ **Cost-effective** prevents storage waste

This implementation gives you production-ready file management with automatic cleanup and scales efficiently!
