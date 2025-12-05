import React, { useState } from 'react';

interface LessonSection {
  type: string;
  content: string;
}

interface LessonFormData {
  sourceContent: string;
  objective: string;
  includeIntro: boolean;
  includeKeyPoints: boolean;
  includeExample: boolean;
  includeSummary: boolean;
  includeActionItems: boolean;
}

const AILessonCreatorTool: React.FC = () => {
  const [formData, setFormData] = useState<LessonFormData>({
    sourceContent: '',
    objective: '',
    includeIntro: true,
    includeKeyPoints: true,
    includeExample: true,
    includeSummary: true,
    includeActionItems: true,
  });
  const [generatedLesson, setGeneratedLesson] = useState<LessonSection[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateLesson = () => {
    if (!formData.sourceContent.trim()) {
      alert('Please provide source content');
      return;
    }

    setIsGenerating(true);

    // Simulate AI generation
    setTimeout(() => {
      const sections: LessonSection[] = [];

      if (formData.includeIntro) {
        sections.push({
          type: 'Introduction',
          content: `Welcome to this lesson${
            formData.objective ? ' on ' + formData.objective : ''
          }. In this session, we'll explore key concepts and practical applications that will help you master this topic. By the end of this lesson, you'll have a solid understanding of the fundamentals and be ready to apply what you've learned.`,
        });
      }

      if (formData.includeKeyPoints) {
        sections.push({
          type: 'Key Points',
          content: `• Understanding the core concepts and principles
• Identifying best practices and common patterns
• Recognizing potential challenges and solutions
• Applying knowledge in real-world scenarios
• Building upon foundational knowledge`,
        });
      }

      if (formData.includeExample) {
        sections.push({
          type: 'Example / Scenario',
          content: `Let's consider a practical example: Imagine you're working on a project where you need to apply these concepts. You would start by analyzing the requirements, then implement the solution step by step. For instance, if ${
            formData.objective || 'your goal'
          } is to be achieved, you would first establish the groundwork, then progressively build complexity while maintaining code quality and best practices.`,
        });
      }

      if (formData.includeSummary) {
        sections.push({
          type: 'Summary',
          content: `In this lesson, we've covered the essential aspects of ${
            formData.objective || 'this topic'
          }. You've learned about the key principles, explored practical examples, and discovered how to apply these concepts effectively. Remember that practice is crucial for mastery, so continue to experiment and build upon what you've learned here.`,
        });
      }

      if (formData.includeActionItems) {
        sections.push({
          type: 'Action Items',
          content: `☐ Review the key concepts covered in this lesson
☐ Practice implementing the examples on your own
☐ Explore additional resources and documentation
☐ Apply the techniques to a personal project
☐ Share your learnings with peers or the community`,
        });
      }

      setGeneratedLesson(sections);
      setIsGenerating(false);
    }, 1000);
  };

  const copyToClipboard = () => {
    if (!generatedLesson) return;

    let text = 'Generated Lesson\n\n';
    generatedLesson.forEach((section) => {
      text += `${section.type}\n${section.content}\n\n`;
    });

    navigator.clipboard.writeText(text);
    alert('Lesson copied to clipboard!');
  };

  const exportToCourseBuilder = () => {
    console.log('Exporting to Course Builder:', { formData, generatedLesson });
    alert('Lesson exported to Course Builder (simulated)');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Input Side */}
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-[#111827] mb-4">Create Lesson Structure</h3>
          <p className="text-sm text-[#5F6473] mb-6">
            Convert your notes or bullet points into a well-structured lesson.
          </p>
        </div>

        {/* Source Content */}
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-2">
            Source Content
          </label>
          <textarea
            value={formData.sourceContent}
            onChange={(e) => setFormData({ ...formData, sourceContent: e.target.value })}
            placeholder="Paste your notes or bullet points here..."
            rows={6}
            className="w-full px-4 py-3 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5] focus:border-transparent resize-none"
          />
        </div>

        {/* Lesson Objective */}
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-2">
            Lesson Objective(s)
          </label>
          <input
            type="text"
            value={formData.objective}
            onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
            placeholder="What should learners achieve by the end?"
            className="w-full px-4 py-3 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5] focus:border-transparent"
          />
        </div>

        {/* Output Format Options */}
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-3">
            Output Format Options
          </label>
          <div className="space-y-3 bg-[#F5F7FF] rounded-xl p-4">
            {[
              { key: 'includeIntro', label: 'Lesson introduction' },
              { key: 'includeKeyPoints', label: 'Key points' },
              { key: 'includeExample', label: 'Example / scenario' },
              { key: 'includeSummary', label: 'Summary' },
              { key: 'includeActionItems', label: 'Action items' },
            ].map((option) => (
              <label key={option.key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData[option.key as keyof LessonFormData] as boolean}
                  onChange={(e) =>
                    setFormData({ ...formData, [option.key]: e.target.checked })
                  }
                  className="w-4 h-4 text-[#304DB5] rounded focus:ring-[#304DB5]"
                />
                <span className="text-sm text-[#5F6473]">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={generateLesson}
          disabled={isGenerating || !formData.sourceContent.trim()}
          className="w-full bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold py-4 rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating...' : 'Generate Lesson Structure'}
        </button>
      </div>

      {/* Output Side */}
      <div className="bg-gradient-to-br from-[#F5F7FF] to-[#FEFBFF] rounded-2xl p-6 border border-[#EDF0FB]">
        <h4 className="text-xl font-bold text-[#111827] mb-4">Lesson Draft</h4>

        {!generatedLesson ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-6xl mb-4">📖</div>
            <p className="text-[#9CA3B5]">
              Provide your source content and click"Generate Lesson Structure" to create your
              lesson.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-5 mb-6 max-h-96 overflow-y-auto">
              {generatedLesson.map((section, idx) => (
                <div key={idx} className="bg-white rounded-xl p-5 shadow-sm">
                  <h5 className="font-bold text-[#304DB5] mb-3 flex items-center gap-2">
                    {section.type === 'Introduction' && '👋'}
                    {section.type === 'Key Points' && '🎯'}
                    {section.type === 'Example / Scenario' && '💡'}
                    {section.type === 'Summary' && '📝'}
                    {section.type === 'Action Items' && '✅'}
                    <span>{section.type}</span>
                  </h5>
                  <div className="text-sm text-[#5F6473] whitespace-pre-line leading-relaxed">
                    {section.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
              <p className="text-xs text-blue-700">
                ℹ️ Generated text is simulated; no real AI calls yet.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={copyToClipboard}
                className="flex-1 bg-white text-[#304DB5] border border-[#304DB5] font-medium py-3 rounded-full hover:bg-[#F5F7FF] transition-all"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={exportToCourseBuilder}
                className="flex-1 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-medium py-3 rounded-full shadow-md hover:shadow-lg transition-all"
              >
                Export to Course Builder
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AILessonCreatorTool;
