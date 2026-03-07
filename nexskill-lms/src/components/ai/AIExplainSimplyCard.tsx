import React, { useState } from 'react';

const AIExplainSimplyCard: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');

  const handleExplain = () => {
    if (inputText.trim()) {
      // Generate a canned simplified explanation
      const simplified = `In simpler terms, this concept is about making complex ideas easier to understand. Think of it like breaking down a big puzzle into smaller, manageable pieces.

Here's what you need to know:
• The core idea focuses on simplification and clarity
• It's commonly used to help learners grasp difficult topics
• You can apply this by breaking concepts into steps

Try thinking about it this way: if you had to explain this to a friend who's never heard of it, you'd naturally use simpler words and relatable examples. That's exactly what we're doing here!`;

      setOutputText(simplified);
    }
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-6 transition-colors">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Explain this simply</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">Paste a concept and get a beginner-friendly explanation.</p>
      </div>

      {/* Quick Prompts */}
      {!outputText && (
        <div className="flex flex-wrap gap-2 mb-4">
          {['Recursion', 'API', 'Grid vs Flex'].map((topic) => (
            <button
              key={topic}
              onClick={() => setInputText(`Explain ${topic}`)}
              className="px-3 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors"
            >
              Explain {topic}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="relative mb-4">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste a paragraph or a concept you're struggling with…"
          rows={outputText ? 2 : 4}
          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 resize-none text-slate-900 dark:text-white placeholder:text-slate-400 transition-all font-medium text-sm"
        />
        <div className="absolute bottom-3 right-3 flex gap-2">
          {outputText && (
            <button
              onClick={handleClear}
              className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Clear
            </button>
          )}
          <button
            onClick={handleExplain}
            disabled={!inputText.trim()}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${inputText.trim()
                ? 'bg-[#304DB5] text-white hover:bg-blue-700 shadow-md'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
          >
            Explain
          </button>
        </div>
      </div>


      {/* Output area */}
      {outputText && (
        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-[#304DB5] dark:text-blue-400 mb-1">Simplification</h4>
              <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{outputText}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIExplainSimplyCard;
