import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Plus, X, Eye } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import QuizHeader from "./QuizHeader";
import QuizSettings from "./QuizSettings";
import QuestionBlock from "./QuestionBlock";
import QuizPreview from "./QuizPreview";
import type {
    Quiz,
    QuizQuestion,
    QuestionType,
    AnswerConfig,
} from "../../types/quiz";
import { supabase } from "../../lib/supabaseClient";

interface QuizEditorPanelProps {
    quiz: Quiz;
    questions: QuizQuestion[];
    onChange: (updatedQuiz: Quiz) => void;
    onQuestionsChange: (questions: QuizQuestion[]) => void;
    onClose: () => void;
}

const generateId = () => uuidv4();

const getDefaultAnswerConfig = (type: QuestionType): AnswerConfig => {
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
        case "dropdown":
            return {
                options: [
                    { id: generateId(), text: "", is_correct: false },
                    { id: generateId(), text: "", is_correct: false },
                ],
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
        case "paragraph":
            return {
                max_length: 2000,
                placeholder: "Type your answer...",
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
        default: {
            void (type as never);
            return {
                options: [
                    { id: generateId(), text: "", is_correct: false },
                    { id: generateId(), text: "", is_correct: false },
                ],
                allow_multiple: false,
                randomize_options: false,
            };
        }
    }
};

const QuizEditorPanel: React.FC<QuizEditorPanelProps> = React.memo(({
    quiz,
    questions,
    onChange,
    onQuestionsChange,
    onClose,
}) => {
    const [isEditingHeader, setIsEditingHeader] = useState(false);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [localTitle, setLocalTitle] = useState(quiz.title);
    const [localDescription, setLocalDescription] = useState(
        quiz.description || ""
    );
    const [localInstructions, setLocalInstructions] = useState(
        quiz.instructions || ""
    );
    const [missingCorrectAnswerQuestionIds, setMissingCorrectAnswerQuestionIds] = useState<string[]>([]);
    const [saveValidationError, setSaveValidationError] = useState<string | null>(null);

    const hasCorrectAnswerSelected = useCallback((question: QuizQuestion): boolean => {
        const type = question.question_type;

        if (type !== "multiple_choice" && type !== "dropdown") {
            return true;
        }

        const config = question.answer_config as { options?: Array<{ is_correct?: boolean }> };
        const options = Array.isArray(config?.options) ? config.options : [];
        return options.some((option) => option?.is_correct === true);
    }, []);

    const validateBeforeSaveAndClose = useCallback((): boolean => {
        if (quiz.quiz_type !== "standard") {
            setMissingCorrectAnswerQuestionIds([]);
            setSaveValidationError(null);
            return true;
        }

        const invalidQuestionIds = questions
            .filter((question) => question.id && !hasCorrectAnswerSelected(question))
            .map((question) => question.id as string);

        setMissingCorrectAnswerQuestionIds(invalidQuestionIds);

        if (invalidQuestionIds.length > 0) {
            setSaveValidationError("All questions must have a correct answer selected.");
            return false;
        }

        setSaveValidationError(null);
        return true;
    }, [quiz.quiz_type, questions, hasCorrectAnswerSelected]);

    const handleSaveAndClose = useCallback(() => {
        if (!validateBeforeSaveAndClose()) return;
        onClose();
    }, [validateBeforeSaveAndClose, onClose]);

    useEffect(() => {
        if (missingCorrectAnswerQuestionIds.length === 0) return;

        const stillInvalid = missingCorrectAnswerQuestionIds.filter((id) => {
            const question = questions.find((q) => q.id === id);
            return question ? !hasCorrectAnswerSelected(question) : false;
        });

        if (stillInvalid.length !== missingCorrectAnswerQuestionIds.length) {
            setMissingCorrectAnswerQuestionIds(stillInvalid);
        }

        if (stillInvalid.length === 0) {
            setSaveValidationError(null);
        }
    }, [questions, missingCorrectAnswerQuestionIds, hasCorrectAnswerSelected]);

    // Memoize the total points calculation
    const totalPoints = useMemo(() => {
        return questions.reduce((sum, q) => sum + q.points, 0);
    }, [questions]);

    // Memoize header blur handler
    const handleHeaderBlur = useCallback((field: keyof Quiz, value: string) => {
        onChange({ ...quiz, [field]: value });
    }, [quiz, onChange]);

    // Memoize add question handler
    const addQuestion = useCallback(async () => {
        const newQuestion: QuizQuestion = {
            quiz_id: quiz.id,
            position: questions.length,
            question_type: "multiple_choice",
            question_content: [],
            points: 1,
            requires_manual_grading: false,
            answer_config: getDefaultAnswerConfig("multiple_choice"),
        };
        try {
            const { data, error } = await supabase
                .from("quiz_questions")
                .insert([newQuestion])
                .select();
            if (error) {
                console.error(
                    "[QuizEditorPanel] Error inserting question: ",
                    error
                );
                return;
            }
            onQuestionsChange([...questions, ...data]);
        } catch (error) {
            console.error("[QuizEditorPanel] Error adding question:", error);
        }
    }, [quiz, questions, onQuestionsChange]);

    // Memoize update question handler
    const updateQuestion = useCallback((
        questionId: string,
        updated: Partial<QuizQuestion>
    ) => {
        onQuestionsChange(
            questions.map((q) =>
                q.id === questionId ? { ...q, ...updated } : q
            )
        );
    }, [questions, onQuestionsChange]);

    // Memoize remove question handler
    const removeQuestion = useCallback((questionId: string) => {
        const updatedQuestions = questions
            .filter((q) => q.id !== questionId)
            .map((q, index) => ({ ...q, position: index }));
        onQuestionsChange(updatedQuestions);
    }, [questions, onQuestionsChange]);

    // Memoize move question handler
    const moveQuestion = useCallback((questionId: string, direction: "up" | "down") => {
        const questionsCopy = [...questions];
        const index = questionsCopy.findIndex((q) => q.id === questionId);

        if (index !== -1) {
            if (direction === "up" && index > 0) {
                [questionsCopy[index - 1], questionsCopy[index]] = [
                    questionsCopy[index],
                    questionsCopy[index - 1],
                ];
            } else if (
                direction === "down" &&
                index < questionsCopy.length - 1
            ) {
                [questionsCopy[index], questionsCopy[index + 1]] = [
                    questionsCopy[index + 1],
                    questionsCopy[index],
                ];
            }
            const updatedQuestions = questionsCopy.map((q, idx) => ({
                ...q,
                position: idx,
            }));
            onQuestionsChange(updatedQuestions);
        }
    }, [questions, onQuestionsChange]);

    if (isPreviewMode) {
        return (
            <QuizPreview
                quiz={quiz}
                questions={questions}
                onExitPreview={() => setIsPreviewMode(false)}
            />
        );
    }

    return (
        <div className="fixed inset-0 bg-white dark:bg-slate-900 z-50 flex flex-col overflow-hidden">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Quiz Editor
                    </h2>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm rounded-full">
                        {questions.length} Question
                        {questions.length !== 1 ? "s" : ""} · {totalPoints}{" "}
                        Point{totalPoints !== 1 ? "s" : ""}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsPreviewMode(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
                    >
                        <Eye className="w-4 h-4" />
                        Preview
                    </button>

                    <button
                        onClick={handleSaveAndClose}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        Save & Close
                    </button>

                    <button
                        onClick={handleSaveAndClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900">
                <div className="max-w-5xl mx-auto p-6 space-y-6">
                    {/* Quiz Header */}
                    <QuizHeader
                        quiz={quiz}
                        isEditing={isEditingHeader}
                        onToggleEdit={() =>
                            setIsEditingHeader(!isEditingHeader)
                        }
                        title={localTitle}
                        description={localDescription}
                        instructions={localInstructions}
                        onTitleChange={setLocalTitle}
                        onDescriptionChange={setLocalDescription}
                        onInstructionsChange={setLocalInstructions}
                        onBlur={handleHeaderBlur}
                    />

                    {/* Quiz Settings */}
                    <QuizSettings
                        quiz={quiz}
                        onChange={(updates: Partial<Quiz>) =>
                            onChange({ ...quiz, ...updates })
                        }
                    />

                    {/* Questions */}
                    <div className="space-y-4">
                        {saveValidationError && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                                    {saveValidationError}
                                </p>
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Questions
                            </h3>
                            
                        </div>

                        {questions.length === 0 ? (
                            <div className="p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                                <p className="text-gray-500 dark:text-gray-400">
                                    No questions yet. Add your first question to
                                    get started.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {questions
                                    .filter((question) => question.id)
                                    .map((question, index) => (
                                        <QuestionBlock
                                            key={question.id}
                                            question={question}
                                            position={index}
                                            totalQuestions={questions.length}
                                            showMissingCorrectAnswerWarning={missingCorrectAnswerQuestionIds.includes(question.id!)}
                                            onChange={(updated) =>
                                                updateQuestion(
                                                    question.id!,
                                                    updated
                                                )
                                            }
                                            onMove={(direction) =>
                                                moveQuestion(
                                                    question.id!,
                                                    direction
                                                )
                                            }
                                            onRemove={() =>
                                                removeQuestion(question.id!)
                                            }
                                        />
                                    ))}
                            </div>
                        )}

                        <div className="flex justify-center pt-4">
                            <button
                                onClick={addQuestion}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Question
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default QuizEditorPanel;
