/**
 * Lesson Content Items - Database Queries
 * Reusable Supabase queries for managing lesson content items
 */

import { supabase } from '../supabaseClient';
import type { LessonContentItem, ContentMetadata, CreateContentItemInput, UpdateContentItemInput } from '../types/lesson-content-item';

/**
 * Fetch all content items for a lesson
 */
export async function fetchLessonContentItems(lessonId: string) {
    const { data, error } = await supabase
        .from('lesson_content_items')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('position', { ascending: true });

    if (error) throw error;
    return data as LessonContentItem[];
}

/**
 * Fetch content items with quiz data joined
 */
export async function fetchLessonContentItemsWithData(lessonId: string) {
    const { data, error } = await supabase
        .from('lesson_content_items_with_data')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('position', { ascending: true });

    if (error) throw error;
    return data;
}

/**
 * Create a new content item
 */
export async function createContentItem(input: CreateContentItemInput, options?: { is_published?: boolean }) {
    const { lesson_id, course_id, module_id, content_type, content_id, metadata = {}, position } = input;

    // Get max position if not provided
    const finalPosition = position ?? await getMaxPosition(lesson_id);

    // Phase 1: Determine publish status
    // If course is already approved, new content should be unpublished (pending admin approval)
    // Otherwise, use the provided value or default to true (for new courses being built)
    let isPublished: boolean;
    if (options?.is_published !== undefined) {
        isPublished = options.is_published;
    } else {
        // Auto-detect: check if course is approved
        try {
            console.log('[createContentItem] Checking course status for course_id:', course_id);
            const { data: course, error: courseError } = await supabase
                .from('courses')
                .select('verification_status')
                .eq('id', course_id)
                .single();
            
            if (courseError) {
                console.error('[createContentItem] Error fetching course:', courseError);
            } else {
                console.log('[createContentItem] Course verification_status:', course?.verification_status);
            }
            
            // If course is approved, save as unpublished (pending review)
            // Otherwise, save as published (normal course building)
            isPublished = course?.verification_status !== 'approved';
            console.log('[createContentItem] isPublished will be:', isPublished);
        } catch (err) {
            console.error('[createContentItem] Exception checking course status:', err);
            // If we can't determine course status, default to published
            isPublished = true;
        }
    }

    const { data, error } = await supabase
        .from('lesson_content_items')
        .insert([{
            lesson_id,
            course_id,
            module_id,
            content_type,
            content_id,
            metadata,
            position: finalPosition,
            is_published: isPublished,
        }])
        .select()
        .single();

    if (error) throw error;
    return data as LessonContentItem;
}

/**
 * Update a content item
 */
export async function updateContentItem(contentItemId: string, updates: UpdateContentItemInput) {
    const updateData: any = { ...updates };

    // Convert metadata to JSON string if it exists
    if (updates.metadata) {
        updateData.metadata = updates.metadata;
    }

    const { data, error } = await supabase
        .from('lesson_content_items')
        .update(updateData)
        .eq('id', contentItemId)
        .select()
        .single();

    if (error) throw error;
    return data as LessonContentItem;
}

/**
 * Delete a content item
 */
export async function deleteContentItem(contentItemId: string) {
    const { error } = await supabase
        .from('lesson_content_items')
        .delete()
        .eq('id', contentItemId);

    if (error) throw error;
}

/**
 * Get max position for a lesson
 */
async function getMaxPosition(lessonId: string): Promise<number> {
    const { data, error } = await supabase
        .from('lesson_content_items')
        .select('position')
        .eq('lesson_id', lessonId)
        .order('position', { ascending: false })
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data ? data.position + 1 : 0;
}

/**
 * Reorder content items in a lesson
 */
export async function reorderContentItems(
    lessonId: string,
    itemId: string,
    direction: 'up' | 'down'
) {
    // Get all items for this lesson
    const { data: items, error: fetchError } = await supabase
        .from('lesson_content_items')
        .select('id, position')
        .eq('lesson_id', lessonId)
        .order('position', { ascending: true });

    if (fetchError) throw fetchError;
    if (!items || items.length === 0) return;

    // Find the item
    const itemIndex = items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;

    // Calculate new position
    const targetIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    // Swap positions
    const currentItem = items[itemIndex];
    const targetItem = items[targetIndex];

    const updates = items.map(item => {
        if (item.id === itemId) {
            return { id: item.id, position: targetItem.position };
        }
        if (item.id === targetItem.id) {
            return { id: item.id, position: currentItem.position };
        }
        return { id: item.id, position: item.position };
    });

    const { error } = await supabase
        .from('lesson_content_items')
        .upsert(updates);

    if (error) throw error;
}

/**
 * Update content item metadata (for video uploads, notes, etc.)
 */
export async function updateContentItemMetadata(
    contentItemId: string,
    metadata: Partial<ContentMetadata>
) {
    // Fetch current metadata
    const { data: currentItem, error: fetchError } = await supabase
        .from('lesson_content_items')
        .select('metadata')
        .eq('id', contentItemId)
        .single();

    if (fetchError) throw fetchError;

    // Merge metadata
    const updatedMetadata = {
        ...(currentItem?.metadata || {}),
        ...metadata,
    };

    return updateContentItem(contentItemId, { metadata: updatedMetadata });
}

/**
 * Batch create content items (for migration or bulk import)
 */
export async function batchCreateContentItems(items: CreateContentItemInput[]) {
    const { data, error } = await supabase
        .from('lesson_content_items')
        .insert(
            items.map(item => ({
                lesson_id: item.lesson_id,
                course_id: item.course_id,
                module_id: item.module_id,
                content_type: item.content_type,
                content_id: item.content_id,
                metadata: item.metadata || {},
                position: item.position ?? 0,
                is_published: item.is_published ?? true,
            }))
        )
        .select();

    if (error) throw error;
    return data as LessonContentItem[];
}

/**
 * Sync content items order (ensure positions are sequential)
 */
export async function syncContentItemsOrder(lessonId: string) {
    const { data: items, error } = await supabase
        .from('lesson_content_items')
        .select('id, position')
        .eq('lesson_id', lessonId)
        .order('position', { ascending: true });

    if (error) throw error;

    const updates = items.map((item, index) => ({
        id: item.id,
        position: index,
    }));

    await supabase
        .from('lesson_content_items')
        .upsert(updates);
}
