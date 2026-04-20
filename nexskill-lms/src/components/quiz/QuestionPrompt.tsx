import React from 'react';
import ContentBlockDisplay from '../shared/ContentBlockDisplay';
import type { ContentBlock } from '../../types/quiz';

interface QuestionPromptProps {
  questionText: string;
  questionContent?: ContentBlock[];
  subtitle?: string;
}

const QuestionPrompt: React.FC<QuestionPromptProps> = ({
  questionText,
  questionContent = [],
  subtitle,
}) => {
  const hasRenderableContent = questionContent.length > 0;

  return (
    <div>
      {hasRenderableContent ? (
        <div className="space-y-4 mb-2">
          {questionContent.map((block) => (
            <ContentBlockDisplay key={block.id} block={block} />
          ))}
        </div>
      ) : (
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          {questionText}
        </h3>
      )}
      {subtitle && <p className="text-slate-600">{subtitle}</p>}
    </div>
  );
};

export default QuestionPrompt;
