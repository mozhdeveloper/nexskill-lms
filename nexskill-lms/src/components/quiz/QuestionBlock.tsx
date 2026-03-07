import React, { useCallback } from "react";
import { useContentBlocks } from "../../hooks/useContentBlocks";
import ContentBlockRenderer from "../shared/ContentBlockRenderer";
import AddContentBlockButton from "../shared/AddContentBlockButton";
import QuestionTypeSelector from "./QuestionTypeSelector";
import AnswerConfigEditor from "./AnswerConfigEditor";
import { ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import type {
    QuizQuestion,
    QuestionType,
    AnswerConfig,
    ContentBlock,
} from "../../types/quiz";

interface QuestionBlockProps {
    question: QuizQuestion;
    position: number;
    totalQuestions: number;
    onChange: (updated: Partial<QuizQuestion>) => void;
    onMove: (direction: "up" | "down") => void;
    onRemove: () => void;
}

const getDefaultAnswerConfig = (type: QuestionType): AnswerConfig => {
    const generateId = () =>
        `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    switch (type) {
        case "multiple_choice":
            return {
                options: [
                    { id: generateId(), text: "", is_correct: false },
                    { id: generateId(), text: "", is_correct: false },
                ],
                allow_multiple: false,
                randomize_options: false,
            };
        case "true_false":
            return { correct_answer: true };
        case "short_answer":
            return {
                max_length: 500,
                accepted_answers: [],
                case_sensitive: false,
            };
        case "essay":
            return { min_words: 100, max_words: 1000, rubric: "" };
        case "file_upload":
            return {
                accepted_file_types: ["pdf", "docx", "txt"],
                max_file_size_mb: 10,
                max_files: 1,
                instructions: "",
            };
        case "video_submission":
            return {
                max_duration_minutes: 5,
                max_file_size_mb: 100,
                accepted_formats: ["mp4", "mov", "avi", "webm"],
                instructions: "",
            };
    }
};

const QuestionBlock: React.FC<QuestionBlockProps> = React.memo(({
    question,
    position,
    totalQuestions,
    onChange,
    onMove,
    onRemove,
}) => {
    const contentBlockHandlers = useContentBlocks(
        question.question_content || [],
        (blocks: ContentBlock[]) => onChange({ question_content: blocks })
    );

    const handleTypeChange = useCallback((newType: QuestionType) => {
        onChange({
            question_type: newType,
            answer_config: getDefaultAnswerConfig(newType),
        });
    }, [onChange]);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            {/* Question Header */}
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-semibold">
                            {position + 1}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Question {position + 1}
                        </h3>
                    </div>
                </div>

                {/* Question Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onMove("up")}
                        disabled={position === 0}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move up"
                    >
                        <ChevronUp className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => onMove("down")}
                        disabled={position === totalQuestions - 1}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move down"
                    >
                        <ChevronDown className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onRemove}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg"
                        title="Delete question"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Question Content Blocks */}
            <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Question Content
                </h4>
                {question.question_content &&
                question.question_content.length > 0 ? (
                    <div className="space-y-4">
                        {question.question_content.map((block, index) => (
                            <ContentBlockRenderer
                                key={block.id}
                                block={block}
                                isFirst={index === 0}
                                isLast={
                                    index ===
                                    question.question_content.length - 1
                                }
                                onContentUpdate={
                                    contentBlockHandlers.handleContentUpdate
                                }
                                onMediaUpload={
                                    contentBlockHandlers.handleMediaUpload
                                }
                                onAttributeUpdate={
                                    contentBlockHandlers.updateBlockAttributes
                                }
                                onMove={(direction) =>
                                    contentBlockHandlers.moveContentBlock(
                                        block.id,
                                        direction
                                    )
                                }
                                onRemove={() =>
                                    contentBlockHandlers.removeContentBlock(
                                        block.id
                                    )
                                }
                            />
                        ))}
                    </div>
                ) : (
                    <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            No content blocks yet. Add content to your question.
                        </p>
                    </div>
                )}
                <AddContentBlockButton
                    onAdd={contentBlockHandlers.addContentBlock}
                />
            </div>

            {/* Question Type Selector */}
            <QuestionTypeSelector
                type={question.question_type}
                onChange={handleTypeChange}
            />

            {/* Answer Configuration */}
            <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Answer Configuration
                </h4>
                <AnswerConfigEditor
                    questionType={question.question_type}
                    config={question.answer_config}
                    onChange={(config) => onChange({ answer_config: config })}
                />
            </div>

            {/* Question Settings */}
            <div className="flex items-center gap-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Points:
                    </label>
                    <input
                        type="number"
                        value={question.points}
                        onChange={(e) =>
                            onChange({
                                points: parseFloat(e.target.value) || 1,
                            })
                        }
                        min={0.5}
                        step={0.5}
                        className="w-20 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                    />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={question.requires_manual_grading}
                        onChange={(e) =>
                            onChange({
                                requires_manual_grading: e.target.checked,
                            })
                        }
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                        Requires manual grading
                    </span>
                </label>
            </div>
        </div>
    );
});

export default QuestionBlock;
