/**
 * Lesson Video Service
 * Handles saving video URLs to Supabase lessons table
 */

import { supabase } from "../lib/supabaseClient";

export interface VideoMetadata {
    cloudinary_id: string;
    source_url: string;
    duration?: number;
    thumbnail_url?: string;
}

/**
 * Save video URL to lessons table
 * Updates the lesson's content_blocks with the video information
 */
export async function saveVideoToLesson(
    lessonId: string,
    videoUrl: string,
    metadata?: VideoMetadata
): Promise<{ success: boolean; error?: string }> {
    try {
        // Fetch the current lesson to get content_blocks
        const { data: lesson, error: fetchError } = await supabase
            .from("lessons")
            .select("content_blocks")
            .eq("id", lessonId)
            .single();

        if (fetchError) {
            console.error("Error fetching lesson:", fetchError);
            return { success: false, error: fetchError.message };
        }

        if (!lesson) {
            return { success: false, error: "Lesson not found" };
        }

        // Update content_blocks with video block
        const contentBlocks = lesson.content_blocks || [];
        
        // Find existing video block or create new one
        const videoBlockIndex = contentBlocks.findIndex(
            (block: any) => block.type === "video"
        );

        const videoBlock = {
            id: videoBlockIndex >= 0 ? contentBlocks[videoBlockIndex].id : crypto.randomUUID(),
            type: "video" as const,
            content: videoUrl,
            position: videoBlockIndex >= 0 ? contentBlocks[videoBlockIndex].position : contentBlocks.length,
            attributes: {
                source_url: videoUrl,
                is_external: false,
                media_metadata: metadata ? {
                    cloudinary_id: metadata.cloudinary_id,
                    public_id: metadata.cloudinary_id,
                    secure_url: videoUrl,
                    resource_type: "video",
                    format: videoUrl.split('.').pop() || "mp4",
                    bytes: 0,
                    duration: metadata.duration,
                    thumbnail_url: metadata.thumbnail_url,
                } : undefined,
            },
        };

        let updatedBlocks;
        if (videoBlockIndex >= 0) {
            // Update existing video block
            updatedBlocks = contentBlocks.map((block: any, index: number) =>
                index === videoBlockIndex ? videoBlock : block
            );
        } else {
            // Add new video block
            updatedBlocks = [...contentBlocks, videoBlock];
        }

        // Update the lesson with new content_blocks
        const { error: updateError } = await supabase
            .from("lessons")
            .update({
                content_blocks: updatedBlocks,
                updated_at: new Date().toISOString(),
            })
            .eq("id", lessonId);

        if (updateError) {
            console.error("Error updating lesson:", updateError);
            return { success: false, error: updateError.message };
        }

        return { success: true };
    } catch (error) {
        console.error("Unexpected error saving video:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

/**
 * Update lesson content blocks
 */
export async function updateLessonContentBlocks(
    lessonId: string,
    contentBlocks: any[]
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from("lessons")
            .update({
                content_blocks: contentBlocks,
                updated_at: new Date().toISOString(),
            })
            .eq("id", lessonId);

        if (error) {
            console.error("Error updating lesson content:", error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error("Unexpected error updating content:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

/**
 * Get lesson by ID
 */
export async function getLesson(lessonId: string) {
    try {
        const { data, error } = await supabase
            .from("lessons")
            .select("*")
            .eq("id", lessonId)
            .single();

        if (error) {
            console.error("Error fetching lesson:", error);
            return null;
        }

        return data;
    } catch (error) {
        console.error("Unexpected error fetching lesson:", error);
        return null;
    }
}
