import React from 'react';
import type { ContentBlock } from '../../types/quiz';
import QuestionPrompt from './QuestionPrompt';

interface Option {
  id: string;
  label: string;
  helperText?: string;
  isOther?: boolean;
}

interface QuestionMultipleChoiceProps {
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

const QuestionMultipleChoice: React.FC<QuestionMultipleChoiceProps> = ({
  question,
  selectedOptionId,
  selectedOtherText,
  onSelect,
  onOtherTextChange,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <QuestionPrompt
          questionText={question.questionText}
          questionContent={question.questionContent}
        />
      </div>

      <div className="space-y-3">
        {question.options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          return (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              className={`
                w-full text-left rounded-2xl p-4 transition-all
                ${
                  isSelected
                    ? 'bg-blue-50 border-2 border-[#304DB5] shadow-sm'
                    : 'bg-slate-50 border-2 border-transparent hover:border-slate-300 hover:shadow-sm'
                }
              `}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-0.5">
                  <div
                    className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center
                      ${
                        isSelected
                          ? 'border-[#304DB5] bg-[#304DB5]'
                          : 'border-slate-300 bg-white'
                      }
                    `}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className={`font-medium ${isSelected ? 'text-[#304DB5]' : 'text-slate-900'}`}>
                    {option.label}
                  </div>
                  {option.helperText && (
                    <div className="text-sm text-slate-600 mt-1">
                      {option.helperText}
                    </div>
                  )}
                  {isSelected && option.isOther && (
                    <input
                      type="text"
                      value={selectedOtherText || ''}
                      onChange={(e) => onOtherTextChange(e.target.value)}
                      placeholder="Type your answer"
                      className="mt-3 w-full rounded-xl p-3 bg-white border border-slate-300 focus:border-[#304DB5] focus:outline-none text-slate-900"
                    />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionMultipleChoice;
