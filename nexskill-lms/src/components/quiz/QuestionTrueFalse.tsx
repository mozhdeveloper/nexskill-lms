import React from 'react';
import type { ContentBlock } from '../../types/quiz';
import QuestionPrompt from './QuestionPrompt';

interface QuestionTrueFalseProps {
  question: {
    id: string;
    questionText: string;
    questionContent?: ContentBlock[];
  };
  value: boolean | null;
  onChange: (value: boolean) => void;
}

const QuestionTrueFalse: React.FC<QuestionTrueFalseProps> = ({
  question,
  value,
  onChange,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <QuestionPrompt
          questionText={question.questionText}
          questionContent={question.questionContent}
          subtitle="Select whether this statement is true or false."
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => onChange(true)}
          className={`
            flex-1 py-4 px-8 rounded-full font-semibold text-lg transition-all
            ${
              value === true
                ? 'bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white shadow-lg'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }
          `}
        >
          True
        </button>
        <button
          onClick={() => onChange(false)}
          className={`
            flex-1 py-4 px-8 rounded-full font-semibold text-lg transition-all
            ${
              value === false
                ? 'bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white shadow-lg'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }
          `}
        >
          False
        </button>
      </div>
    </div>
  );
};

export default QuestionTrueFalse;
