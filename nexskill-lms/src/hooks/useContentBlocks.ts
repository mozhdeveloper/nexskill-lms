import { useCallback } from "react";
import type { ContentBlock } from "../types/quiz";
import type { MediaMetadata } from "../types/media.types";

/**
 * Generates a unique ID for content blocks
 */
const generateBlockId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

interface UseContentBlocksReturn {
    handleContentUpdate: (content: string, blockId?: string) => void;
    addContentBlock: (type: ContentBlock["type"]) => void;
    removeContentBlock: (blockId: string) => void;
    moveContentBlock: (blockId: string, direction: "up" | "down") => void;
    handleMediaUpload: (blockId: string, metadata: MediaMetadata) => void;
    updateBlockAttributes: (
        blockId: string,
        attributes: Partial<ContentBlock["attributes"]>
    ) => void;
}

/**
 * Shared hook for managing content blocks in lessons and quizzes
 * This provides a unified interface for content editing across the application
 */
export const useContentBlocks = (
    blocks: ContentBlock[],
    onChange: (blocks: ContentBlock[]) => void
): UseContentBlocksReturn => {
    /**
     * Updates content for a specific block or creates a new text block
     */
    const handleContentUpdate = useCallback((content: string, blockId?: string) => {
        let updatedBlocks: ContentBlock[];

        if (blockId) {
            // Update existing block
            updatedBlocks = blocks.map((block) =>
                block.id === blockId ? { ...block, content } : block
            );
        } else {
            // Create or update first text block
            const firstTextBlock = blocks.find((b) => b.type === "text");

            if (firstTextBlock) {
                // Update first text block
                updatedBlocks = blocks.map((block) =>
                    block.id === firstTextBlock.id
                        ? { ...block, content }
                        : block
                );
            } else {
                // Create new text block
                const newBlock: ContentBlock = {
                    id: generateBlockId(),
                    type: "text",
                    content,
                    position: 0,
                    attributes: {},
                };

                // Shift existing blocks down
                updatedBlocks = [
                    newBlock,
                    ...blocks.map((b) => ({
                        ...b,
                        position: b.position + 1,
                    })),
                ];
            }
        }

        onChange(updatedBlocks);
    }, [blocks, onChange]);

    /**
     * Adds a new content block of the specified type
     */
    const addContentBlock = useCallback((type: ContentBlock["type"]) => {
        const newBlock: ContentBlock = {
            id: generateBlockId(),
            type,
            content: "",
            position: blocks.length,
            attributes: type === "heading" ? { level: 2 } : {},
        };

        onChange([...blocks, newBlock]);
    }, [blocks, onChange]);

    /**
     * Removes a content block and updates positions
     */
    const removeContentBlock = useCallback((blockId: string) => {
        const updatedBlocks = blocks
            .filter((block) => block.id !== blockId)
            .map((block, index) => ({ ...block, position: index }));

        onChange(updatedBlocks);
    }, [blocks, onChange]);

    /**
     * Moves a block up or down in the content order
     */
    const moveContentBlock = useCallback((blockId: string, direction: "up" | "down") => {
        const blocksCopy = [...blocks];
        const index = blocksCopy.findIndex((b) => b.id === blockId);

        if (index !== -1) {
            if (direction === "up" && index > 0) {
                [blocksCopy[index - 1], blocksCopy[index]] = [
                    blocksCopy[index],
                    blocksCopy[index - 1],
                ];
            } else if (direction === "down" && index < blocksCopy.length - 1) {
                [blocksCopy[index], blocksCopy[index + 1]] = [
                    blocksCopy[index + 1],
                    blocksCopy[index],
                ];
            }

            // Update positions
            const updatedBlocks = blocksCopy.map((block, idx) => ({
                ...block,
                position: idx,
            }));

            onChange(updatedBlocks);
        }
    }, [blocks, onChange]);

    /**
     * Handles media upload for image/video blocks
     */
    const handleMediaUpload = useCallback((blockId: string, metadata: MediaMetadata) => {
        const updatedBlocks = blocks.map((block) =>
            block.id === blockId
                ? {
                      ...block,
                      content: metadata.url,
                      attributes: {
                          ...block.attributes,
                          media_metadata: metadata,
                      },
                  }
                : block
        );
        onChange(updatedBlocks);
    }, [blocks, onChange]);

    /**
     * Updates attributes for a specific block
     */
    const updateBlockAttributes = useCallback((
        blockId: string,
        attributes: Partial<ContentBlock["attributes"]>
    ) => {
        const updatedBlocks = blocks.map((block) =>
            block.id === blockId
                ? {
                      ...block,
                      attributes: {
                          ...block.attributes,
                          ...attributes,
                      },
                  }
                : block
        );
        onChange(updatedBlocks);
    }, [blocks, onChange]);

    return {
        handleContentUpdate,
        addContentBlock,
        removeContentBlock,
        moveContentBlock,
        handleMediaUpload,
        updateBlockAttributes,
    };
};
