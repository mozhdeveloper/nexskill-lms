import React from 'react';
import type { ContentBlock } from '../../types/quiz';
import QuestionPrompt from './QuestionPrompt';

interface ImageOption {
  id: string;
  imageUrl: string;
  label?: string;
}

interface QuestionImageChoiceProps {
  question: {
    id: string;
    questionText: string;
    questionContent?: ContentBlock[];
    options: ImageOption[];
  };
  selectedOptionId?: string;
  onSelect: (optionId: string) => void;
}

const QuestionImageChoice: React.FC<QuestionImageChoiceProps> = ({
  question,
  selectedOptionId,
  onSelect,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <QuestionPrompt
          questionText={question.questionText}
          questionContent={question.questionContent}
          subtitle="Select the correct image."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {question.options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          return (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              className={`
                rounded-2xl overflow-hidden transition-all transform hover:scale-105
                ${
                  isSelected
                    ? 'ring-4 ring-[#304DB5] shadow-xl'
                    : 'ring-2 ring-slate-200 hover:ring-slate-300 shadow-md'
                }
              `}
            >
              <div className="aspect-video bg-slate-100 flex items-center justify-center">
                <img
                  src={option.imageUrl}
                  alt={option.label || `Option ${option.id}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback for broken images
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.innerHTML = `
                        <div class="flex flex-col items-center justify-center h-full text-slate-400">
                          <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span class="text-sm mt-2">Image placeholder</span>
                        </div>
                      `;
                    }
                  }}
                />
              </div>
              {option.label && (
                <div
                  className={`
                    p-3 text-center font-medium
                    ${isSelected ? 'bg-blue-50 text-[#304DB5]' : 'bg-white text-slate-900'}
                  `}
                >
                  {option.label}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionImageChoice;
