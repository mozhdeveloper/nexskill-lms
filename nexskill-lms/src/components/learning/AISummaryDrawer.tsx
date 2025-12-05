import React from 'react';

interface AISummaryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lessonTitle: string;
}

const AISummaryDrawer: React.FC<AISummaryDrawerProps> = ({ isOpen, onClose, lessonTitle }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white rounded-l-3xl shadow-2xl z-50 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-text-primary mb-1">AI lesson summary</h3>
              <p className="text-sm text-text-secondary">{lessonTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#F5F7FF] rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Summary Content */}
          <div className="space-y-6">
            {/* Key Points */}
            <div className="bg-gradient-to-br from-[#E8EEFF] to-[#F5E8FF] rounded-2xl p-5">
              <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <span>🤖</span> AI-Generated Summary
              </h4>
              <p className="text-sm text-text-secondary leading-relaxed">
                This lesson covers advanced React hooks patterns, focusing on custom hook composition and performance optimization. You'll learn how to build reusable logic and avoid common pitfalls.
              </p>
            </div>

            {/* Key Takeaways */}
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-3">Key Takeaways</h4>
              <ul className="space-y-3">
                {[
                  'Custom hooks enable logic reuse across components',
                  'useCallback and useMemo prevent unnecessary re-renders',
                  'Dependency arrays must be carefully managed',
                  'Hook composition creates powerful abstractions',
                  'Performance optimization requires profiling first',
                ].map((takeaway, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-sm text-text-secondary">{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Concepts Covered */}
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-3">Concepts Covered</h4>
              <div className="flex flex-wrap gap-2">
                {['Custom Hooks', 'useCallback', 'useMemo', 'Performance', 'Best Practices'].map(
                  (concept) => (
                    <span
                      key={concept}
                      className="px-3 py-1.5 bg-[#F5F7FF] text-brand-primary rounded-full text-xs font-medium"
                    >
                      {concept}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Suggested Next Steps */}
            <div className="bg-[#F5F7FF] rounded-2xl p-5">
              <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <span>💡</span> Suggested Next Steps
              </h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>• Practice building custom hooks with the provided exercises</li>
                <li>• Review the performance optimization checklist</li>
                <li>• Move on to the next lesson:"Advanced Context Patterns"</li>
              </ul>
            </div>

            {/* Action Button */}
            <button
              onClick={onClose}
              className="w-full py-3 bg-gradient-to-r from-brand-primary to-brand-primary-light text-white font-medium rounded-full hover:shadow-lg transition-all"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AISummaryDrawer;
