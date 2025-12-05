import React, { useState } from 'react';

interface AskAIWidgetProps {
  activeLessonId: string;
}

const AskAIWidget: React.FC<AskAIWidgetProps> = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAsk = () => {
    if (!question.trim()) return;

    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      setAnswer(
        `Great question! Based on this lesson, ${question.toLowerCase().includes('hook') 
          ? 'hooks are functions that let you"hook into" React features from function components. They enable you to use state and lifecycle features without writing a class.' 
          : 'the key concept here is understanding the fundamentals before moving to advanced patterns. Make sure to practice with the provided examples.'
        }`
      );
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🤖</span>
        <h4 className="text-sm font-semibold text-text-primary">Ask AI about this lesson</h4>
      </div>
      <p className="text-xs text-text-secondary mb-3">
        Ask a question and get a quick explanation
      </p>

      {/* Input */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your question..."
          className="flex-1 px-4 py-2 bg-[#F5F7FF] rounded-full text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary-light transition-all"
        />
        <button
          onClick={handleAsk}
          disabled={!question.trim() || isLoading}
          className="px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-primary-light text-white text-sm font-medium rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '...' : 'Ask'}
        </button>
      </div>

      {/* Response Area */}
      {answer && (
        <div className="bg-gradient-to-br from-[#E8EEFF] to-[#F5E8FF] rounded-2xl p-4">
          <div className="flex items-start gap-2 mb-2">
            <span className="text-sm">💡</span>
            <p className="text-xs font-medium text-text-primary">AI Answer:</p>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">{answer}</p>
        </div>
      )}

      {isLoading && (
        <div className="bg-[#F5F7FF] rounded-2xl p-4 flex items-center gap-3">
          <div className="animate-spin w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full"></div>
          <p className="text-sm text-text-secondary">Thinking...</p>
        </div>
      )}
    </div>
  );
};

export default AskAIWidget;
