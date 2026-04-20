import React from 'react';
import type { ContentBlock } from '../../types/quiz';
import QuestionPrompt from './QuestionPrompt';

interface Option {
  id: string;
  label: string;
  isOther?: boolean;
}

interface QuestionDropdownProps {
  question: {
    id: string;
    questionText: string;
    questionContent?: ContentBlock[];
    options: Option[];
  };
  selectedOptionId?: string;
  selectedOtherText?: string;
  onSelect: (optionId: string) => void;
  onOtherTextChange: (text: string) => void;
}

const QuestionDropdown: React.FC<QuestionDropdownProps> = ({
  question,
  selectedOptionId,
  selectedOtherText,
  onSelect,
  onOtherTextChange,
}) => {
  const selectedOption = question.options.find((opt) => opt.id === selectedOptionId);
  const isOtherSelected = Boolean(selectedOption?.isOther);

  return (
    <div className="space-y-6">
      <div>
        <QuestionPrompt
          questionText={question.questionText}
          questionContent={question.questionContent}
        />
      </div>

      <div className="space-y-3">
        <select
          value={selectedOptionId || ''}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full rounded-2xl p-4 bg-slate-50 border-2 border-slate-200 focus:border-[#304DB5] focus:outline-none text-slate-900"
        >
          <option value="" disabled>Select an option</option>
          {question.options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>

        {isOtherSelected && (
          <input
            type="text"
            value={selectedOtherText || ''}
            onChange={(e) => onOtherTextChange(e.target.value)}
            placeholder="Type your answer"
            className="w-full rounded-2xl p-4 bg-white border-2 border-slate-200 focus:border-[#304DB5] focus:outline-none"
          />
        )}
      </div>
    </div>
  );
};

export default QuestionDropdown;
