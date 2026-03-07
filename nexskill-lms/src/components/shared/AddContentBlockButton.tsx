import React, { useState } from "react";
import {
    Plus,
    Type,
    Heading1,
    Image,
    Code as CodeIcon,
    Video,
} from "lucide-react";
import type { ContentBlock } from "../../types/quiz";

interface AddContentBlockButtonProps {
    onAdd: (type: ContentBlock["type"]) => void;
}

const AddContentBlockButton: React.FC<AddContentBlockButtonProps> = ({
    onAdd,
}) => {
    const [showDropdown, setShowDropdown] = useState(false);

    const blockTypes: Array<{
        type: ContentBlock["type"];
        icon: React.ElementType;
        label: string;
        color: string;
    }> = [
        { type: "text", icon: Type, label: "Text", color: "text-gray-600" },
        {
            type: "heading",
            icon: Heading1,
            label: "Heading",
            color: "text-blue-600",
        },
        { type: "image", icon: Image, label: "Image", color: "text-green-600" },
        { type: "video", icon: Video, label: "Video", color: "text-red-600" },
        {
            type: "code",
            icon: CodeIcon,
            label: "Code",
            color: "text-purple-600",
        },
    ];

    const handleAddBlock = (type: ContentBlock["type"]) => {
        onAdd(type);
        setShowDropdown(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
            >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Add Content Block</span>
            </button>

            {showDropdown && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowDropdown(false)}
                    />

                    {/* Dropdown Menu */}
                    <div className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20">
                        {blockTypes.map((blockType) => {
                            const Icon = blockType.icon;
                            return (
                                <button
                                    key={blockType.type}
                                    onClick={() =>
                                        handleAddBlock(blockType.type)
                                    }
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left"
                                >
                                    <Icon
                                        className={`w-5 h-5 ${blockType.color}`}
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {blockType.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

export default AddContentBlockButton;
