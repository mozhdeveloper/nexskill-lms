import React from 'react';
import type { ContentBlock } from '../../types/quiz';
import QuestionPrompt from './QuestionPrompt';

interface QuestionParagraphProps {
  question: {
    id: string;
    questionText: string;
    questionContent?: ContentBlock[];
  };
  value?: string;
  onChange: (text: string) => void;
  placeholder?: string;
}

const QuestionParagraph: React.FC<QuestionParagraphProps> = ({
  question,
  value,
  onChange,
  placeholder,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <QuestionPrompt
          questionText={question.questionText}
          questionContent={question.questionContent}
        />
      </div>

      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Type your answer...'}
        rows={7}
        className="w-full rounded-2xl p-4 bg-white border-2 border-slate-200 focus:border-[#304DB5] focus:outline-none text-slate-900"
      />
    </div>
  );
};

export default QuestionParagraph;
