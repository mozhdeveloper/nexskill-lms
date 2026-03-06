import React from "react";
import MultipleChoiceEditor from "./answer-configs/MultipleChoiceEditor";
import TrueFalseEditor from "./answer-configs/TrueFalseEditor";
import ShortAnswerEditor from "./answer-configs/ShortAnswerEditor";
import EssayEditor from "./answer-configs/EssayEditor";
import FileUploadEditor from "./answer-configs/FileUploadEditor";
import VideoSubmissionEditor from "./answer-configs/VideoSubmissionEditor";
import type {
    QuestionType,
    AnswerConfig,
    MultipleChoiceConfig,
    TrueFalseConfig,
    ShortAnswerConfig,
    EssayConfig,
    FileUploadConfig,
    VideoSubmissionConfig,
} from "../../types/quiz";

interface AnswerConfigEditorProps {
    questionType: QuestionType;
    config: AnswerConfig;
    onChange: (config: AnswerConfig) => void;
}

const AnswerConfigEditor: React.FC<AnswerConfigEditorProps> = ({
    questionType,
    config,
    onChange,
}) => {
    switch (questionType) {
        case "multiple_choice":
            return (
                <MultipleChoiceEditor
                    config={config as MultipleChoiceConfig}
                    onChange={
                        onChange as (config: MultipleChoiceConfig) => void
                    }
                />
            );
        case "true_false":
            return (
                <TrueFalseEditor
                    config={config as TrueFalseConfig}
                    onChange={onChange as (config: TrueFalseConfig) => void}
                />
            );
        case "short_answer":
            return (
                <ShortAnswerEditor
                    config={config as ShortAnswerConfig}
                    onChange={onChange as (config: ShortAnswerConfig) => void}
                />
            );
        case "essay":
            return (
                <EssayEditor
                    config={config as EssayConfig}
                    onChange={onChange as (config: EssayConfig) => void}
                />
            );
        case "file_upload":
            return (
                <FileUploadEditor
                    config={config as FileUploadConfig}
                    onChange={onChange as (config: FileUploadConfig) => void}
                />
            );
        case "video_submission":
            return (
                <VideoSubmissionEditor
                    config={config as VideoSubmissionConfig}
                    onChange={
                        onChange as (config: VideoSubmissionConfig) => void
                    }
                />
            );
        default:
            return (
                <div className="p-4 bg-gray-100 dark:bg-slate-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Unknown question type
                    </p>
                </div>
            );
    }
};

export default AnswerConfigEditor;
