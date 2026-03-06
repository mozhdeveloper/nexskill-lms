import React, { useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import { TextStyle } from "@tiptap/extension-text-style";
import { Extension } from "@tiptap/core";
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Code,
    List,
    ListOrdered,
    Link as LinkIcon,
    Palette,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Trash2,
    Type,
} from "lucide-react";

// Custom FontSize extension
const FontSizeExtension = Extension.create({
    name: "fontSize",
    addOptions() {
        return {
            types: ["textStyle"],
        };
    },
    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: (element) => element.style.fontSize || null,
                        renderHTML: (attributes) => {
                            if (!attributes.fontSize) {
                                return {};
                            }
                            return {
                                style: `font-size: ${attributes.fontSize}`,
                            };
                        },
                    },
                },
            },
        ];
    },
    addCommands() {
        return {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setFontSize:
                (fontSize: string) =>
                ({ chain }: any) => {
                    return chain().setMark("textStyle", { fontSize }).run();
                },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            unsetFontSize:
                () =>
                ({ chain }: any) => {
                    return chain()
                        .setMark("textStyle", { fontSize: null })
                        .updateAttributes("textStyle", { fontSize: null })
                        .run();
                },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
    },
});

interface RichTextEditorProps {
    content: string;
    onUpdate: (content: string) => void;
    placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = React.memo(({
    content,
    onUpdate,
    placeholder = "Write your lesson content here...",
}) => {
    // Store the previous content to prevent unnecessary updates
    const prevContentRef = useRef<string>(content);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder,
            }),
            Highlight.configure({ multicolor: true }),
            TextAlign.configure({
                types: ["heading", "paragraph"],
            }),
            Image,
            TextStyle,
            FontSizeExtension,
        ],
        content,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onUpdate: useCallback(
            ({ editor }: any) => {
                const htmlContent = editor.getHTML();
                // Only call onUpdate if content actually changed to prevent infinite loops
                if (htmlContent !== prevContentRef.current) {
                    onUpdate(htmlContent);
                    prevContentRef.current = htmlContent;
                }
            },
            [onUpdate]
        ),
    });

    // Update the editor content when the prop changes
    useEffect(() => {
        if (editor && content !== prevContentRef.current) {
            editor.commands.setContent(content, false); // false means don't preserve selection
            prevContentRef.current = content;
        }
    }, [editor, content]);

    const setLink = useCallback(() => {
        if (!editor) return;
        const previousUrl = editor.getAttributes("link").href;
        const url = window.prompt("URL", previousUrl);

        if (url === null) {
            return;
        }

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

    if (!editor) {
        return null;
    }

    // Memoize toolbar button handlers to prevent re-renders
    const handleToggleBold = useCallback(() => {
        editor.chain().focus().toggleBold().run();
    }, [editor]);

    const handleToggleItalic = useCallback(() => {
        editor.chain().focus().toggleItalic().run();
    }, [editor]);

    const handleToggleUnderline = useCallback(() => {
        editor.chain().focus().toggleUnderline().run();
    }, [editor]);

    const handleToggleStrike = useCallback(() => {
        editor.chain().focus().toggleStrike().run();
    }, [editor]);

    const handleToggleHighlight = useCallback(() => {
        editor.chain().focus().toggleHighlight().run();
    }, [editor]);

    const handleSetHighlightColor = useCallback((event: React.SyntheticEvent) => {
        const target = event.target as HTMLInputElement;
        editor
            .chain()
            .focus()
            .setHighlight({
                color: target.value,
            })
            .run();
    }, [editor]);

    const handleFocusEditor = useCallback(() => {
        editor?.chain().focus().run();
    }, [editor]);

    const handleHeadingChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const level = parseInt(e.target.value);
        if (level === 0) {
            editor.chain().focus().setParagraph().run();
        } else {
            editor
                .chain()
                .focus()
                .toggleHeading({
                    level: level as 1 | 2 | 3 | 4,
                })
                .run();
        }
    }, [editor]);

    const handleFontSizeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value === "unset") {
            editor.chain().focus().unsetFontSize().run();
        } else {
            editor
                .chain()
                .focus()
                .setFontSize(e.target.value)
                .run();
        }
    }, [editor]);

    const handleSetTextAlign = useCallback((align: 'left' | 'center' | 'right' | 'justify') => {
        editor.chain().focus().setTextAlign(align).run();
    }, [editor]);

    const handleToggleBulletList = useCallback(() => {
        editor.chain().focus().toggleBulletList().run();
    }, [editor]);

    const handleToggleOrderedList = useCallback(() => {
        editor.chain().focus().toggleOrderedList().run();
    }, [editor]);

    const handleToggleCodeBlock = useCallback(() => {
        editor.chain().focus().toggleCodeBlock().run();
    }, [editor]);

    const handleClearFormatting = useCallback(() => {
        editor
            .chain()
            .focus()
            .clearNodes()
            .unsetAllMarks()
            .run();
    }, [editor]);

    return (
        <div
            className="group/editor border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 transition-all cursor-text"
            onClick={handleFocusEditor}
        >
            {/* Toolbar */}
            <div className="bg-transparent border-b border-gray-100 dark:border-gray-800 pt-1 pb-2 px-2 flex flex-wrap items-center gap-1 opacity-50 group-hover/editor:opacity-100 transition-opacity">
                {/* Heading Level */}
                <select
                    value={
                        editor.isActive("heading")
                            ? editor.getAttributes("heading").level
                            : 0
                    }
                    onChange={handleHeadingChange}
                    className="p-2 rounded-md bg-transparent hover:bg-slate-100 dark:hover:bg-gray-700 text-sm"
                >
                    <option value="0">Paragraph</option>
                    <option value="1">H1</option>
                    <option value="2">H2</option>
                    <option value="3">H3</option>
                    <option value="4">H4</option>
                </select>

                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>

                {/* Font Size */}
                <div className="flex items-center gap-1">
                    <Type size={14} className="text-gray-400" />
                    <select
                        value={
                            editor.getAttributes("textStyle").fontSize || "16px"
                        }
                        onChange={handleFontSizeChange}
                        className="p-2 rounded-md bg-transparent hover:bg-slate-100 dark:hover:bg-gray-700 text-sm"
                    >
                        <option value="unset">Default</option>
                        <option value="12px">12px</option>
                        <option value="14px">14px</option>
                        <option value="16px">16px</option>
                        <option value="18px">18px</option>
                        <option value="20px">20px</option>
                        <option value="24px">24px</option>
                        <option value="28px">28px</option>
                        <option value="32px">32px</option>
                    </select>
                </div>

                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>

                {/* Basic Formatting */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleToggleBold}
                        className={`p-2 rounded-md ${
                            editor.isActive("bold")
                                ? "bg-slate-200 dark:bg-gray-700"
                                : "hover:bg-slate-100 dark:hover:bg-gray-700"
                        }`}
                        title="Bold"
                    >
                        <Bold size={16} />
                    </button>
                    <button
                        onClick={handleToggleItalic}
                        className={`p-2 rounded-md ${
                            editor.isActive("italic")
                                ? "bg-slate-200 dark:bg-gray-700"
                                : "hover:bg-slate-100 dark:hover:bg-gray-700"
                        }`}
                        title="Italic"
                    >
                        <Italic size={16} />
                    </button>
                    <button
                        onClick={handleToggleUnderline}
                        className={`p-2 rounded-md ${
                            editor.isActive("underline")
                                ? "bg-slate-200 dark:bg-gray-700"
                                : "hover:bg-slate-100 dark:hover:bg-gray-700"
                        }`}
                        title="Underline"
                    >
                        <UnderlineIcon size={16} />
                    </button>
                    <button
                        onClick={handleToggleStrike}
                        className={`p-2 rounded-md ${
                            editor.isActive("strike")
                                ? "bg-slate-200 dark:bg-gray-700"
                                : "hover:bg-slate-100 dark:hover:bg-gray-700"
                        }`}
                        title="Strikethrough"
                    >
                        <Strikethrough size={16} />
                    </button>
                </div>

                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>

                {/* Highlight */}
                <div className="flex items-center gap-1 relative">
                    <button
                        onClick={handleToggleHighlight}
                        className={`p-2 rounded-md ${
                            editor.isActive("highlight")
                                ? "bg-slate-200 dark:bg-gray-700"
                                : "hover:bg-slate-100 dark:hover:bg-gray-700"
                        }`}
                        title="Highlight"
                    >
                        <Palette size={16} />
                    </button>
                    <input
                        type="color"
                        onInput={handleSetHighlightColor}
                        value={
                            editor.getAttributes("highlight").color || "#ffffff"
                        }
                        className="w-6 h-6 p-0 border-none bg-transparent"
                        title="Highlight Color"
                    />
                </div>

                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>

                {/* Link */}
                <button
                    onClick={setLink}
                    className={`p-2 rounded-md ${
                        editor.isActive("link")
                            ? "bg-slate-200 dark:bg-gray-700"
                            : "hover:bg-slate-100 dark:hover:bg-gray-700"
                    }`}
                    title="Add Link"
                >
                    <LinkIcon size={16} />
                </button>

                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>

                {/* Text Align */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => handleSetTextAlign('left')}
                        className={`p-2 rounded-md ${
                            editor.isActive({ textAlign: "left" })
                                ? "bg-slate-200 dark:bg-gray-700"
                                : "hover:bg-slate-100 dark:hover:bg-gray-700"
                        }`}
                        title="Align Left"
                    >
                        <AlignLeft size={16} />
                    </button>
                    <button
                        onClick={() => handleSetTextAlign('center')}
                        className={`p-2 rounded-md ${
                            editor.isActive({ textAlign: "center" })
                                ? "bg-slate-200 dark:bg-gray-700"
                                : "hover:bg-slate-100 dark:hover:bg-gray-700"
                        }`}
                        title="Align Center"
                    >
                        <AlignCenter size={16} />
                    </button>
                    <button
                        onClick={() => handleSetTextAlign('right')}
                        className={`p-2 rounded-md ${
                            editor.isActive({ textAlign: "right" })
                                ? "bg-slate-200 dark:bg-gray-700"
                                : "hover:bg-slate-100 dark:hover:bg-gray-700"
                        }`}
                        title="Align Right"
                    >
                        <AlignRight size={16} />
                    </button>
                    <button
                        onClick={() => handleSetTextAlign('justify')}
                        className={`p-2 rounded-md ${
                            editor.isActive({ textAlign: "justify" })
                                ? "bg-slate-200 dark:bg-gray-700"
                                : "hover:bg-slate-700"
                        }`}
                        title="Justify"
                    >
                        <AlignJustify size={16} />
                    </button>
                </div>

                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>

                {/* Lists */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleToggleBulletList}
                        className={`p-2 rounded-md ${
                            editor.isActive("bulletList")
                                ? "bg-slate-200 dark:bg-gray-700"
                                : "hover:bg-slate-100 dark:hover:bg-gray-700"
                        }`}
                        title="Bullet List"
                    >
                        <List size={16} />
                    </button>
                    <button
                        onClick={handleToggleOrderedList}
                        className={`p-2 rounded-md ${
                            editor.isActive("orderedList")
                                ? "bg-slate-200 dark:bg-gray-700"
                                : "hover:bg-slate-100 dark:hover:bg-gray-700"
                        }`}
                        title="Numbered List"
                    >
                        <ListOrdered size={16} />
                    </button>
                </div>

                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>

                {/* Inserts */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleToggleCodeBlock}
                        className={`p-2 rounded-md ${
                            editor.isActive("codeBlock")
                                ? "bg-slate-200 dark:bg-gray-700"
                                : "hover:bg-slate-100 dark:hover:bg-gray-700"
                        }`}
                        title="Code Block"
                    >
                        <Code size={16} />
                    </button>
                </div>

                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>

                {/* Clear */}
                <button
                    onClick={handleClearFormatting}
                    className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-gray-700"
                    title="Clear Formatting"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            {/* Editor Content */}
            <div className="p-3 min-h-[200px] bg-transparent">
                <EditorContent
                    editor={editor}
                    className="prose prose-slate dark:prose-invert max-w-none min-h-[150px]"
                />
            </div>
        </div>
    );
});

export default RichTextEditor;
