import React, { useState } from 'react';

interface QuizQuestion {
  id: number;
  type: 'multiple-choice' | 'true-false';
  question: string;
  options?: string[];
  correctAnswer: string | number;
  isEditing?: boolean;
}

interface QuizFormData {
  topic: string;
  contentDescription: string;
  numberOfQuestions: number;
  includeMultipleChoice: boolean;
  includeTrueFalse: boolean;
}

const AIQuizGeneratorTool: React.FC = () => {
  const [formData, setFormData] = useState<QuizFormData>({
    topic: '',
    contentDescription: '',
    numberOfQuestions: 5,
    includeMultipleChoice: true,
    includeTrueFalse: true,
  });
  const [generatedQuestions, setGeneratedQuestions] = useState<QuizQuestion[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateQuiz = () => {
    if (!formData.topic.trim()) {
      alert('Please provide a topic');
      return;
    }

    if (!formData.includeMultipleChoice && !formData.includeTrueFalse) {
      alert('Please select at least one question type');
      return;
    }

    setIsGenerating(true);

    // Simulate AI generation
    setTimeout(() => {
      const questions: QuizQuestion[] = [];
      const selectedTypes: Array<'multiple-choice' | 'true-false'> = [];

      if (formData.includeMultipleChoice) selectedTypes.push('multiple-choice');
      if (formData.includeTrueFalse) selectedTypes.push('true-false');

      for (let i = 0; i < formData.numberOfQuestions; i++) {
        const type = selectedTypes[i % selectedTypes.length];

        if (type === 'multiple-choice') {
          const correctIndex = Math.floor(Math.random() * 4);
          questions.push({
            id: i + 1,
            type: 'multiple-choice',
            question: `What is an important concept related to ${formData.topic}?`,
            options: [
              'Option A: First possible answer',
              'Option B: Second possible answer',
              'Option C: Third possible answer',
              'Option D: Fourth possible answer',
            ],
            correctAnswer: correctIndex,
          });
        } else {
          const isTrue = Math.random() > 0.5;
          questions.push({
            id: i + 1,
            type: 'true-false',
            question: `${formData.topic} involves applying best practices and methodologies.`,
            correctAnswer: isTrue ? 'True' : 'False',
          });
        }
      }

      setGeneratedQuestions(questions);
      setIsGenerating(false);
    }, 1200);
  };

  const toggleEdit = (questionId: number) => {
    setGeneratedQuestions(
      (prev) =>
        prev?.map((q) => (q.id === questionId ? { ...q, isEditing: !q.isEditing } : q)) || null
    );
  };

  const sendToQuizBuilder = () => {
    console.log('Sending to Quiz Builder:', { formData, generatedQuestions });
    alert('Quiz sent to Quiz Builder (simulated)');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Input Side */}
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-[#111827] mb-4">Generate Quiz Questions</h3>
          <p className="text-sm text-[#5F6473] mb-6">
            Create assessment questions automatically based on your lesson content.
          </p>
        </div>

        {/* Topic */}
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-2">
            Topic / Lesson Title
          </label>
          <input
            type="text"
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            placeholder="e.g., Introduction to React Hooks"
            className="w-full px-4 py-3 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5] focus:border-transparent"
          />
        </div>

        {/* Content Description */}
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-2">
            Short Content Description
          </label>
          <textarea
            value={formData.contentDescription}
            onChange={(e) => setFormData({ ...formData, contentDescription: e.target.value })}
            placeholder="Brief summary of what the lesson covers..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5] focus:border-transparent resize-none"
          />
        </div>

        {/* Number of Questions */}
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-2">
            Number of Questions: {formData.numberOfQuestions}
          </label>
          <input
            type="range"
            min="3"
            max="10"
            value={formData.numberOfQuestions}
            onChange={(e) =>
              setFormData({ ...formData, numberOfQuestions: parseInt(e.target.value) })
            }
            className="w-full h-2 bg-[#E0E5FF] rounded-lg appearance-none cursor-pointer accent-[#304DB5]"
          />
          <div className="flex justify-between text-xs text-[#9CA3B5] mt-1">
            <span>3</span>
            <span>10</span>
          </div>
        </div>

        {/* Question Types */}
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-3">
            Question Types
          </label>
          <div className="space-y-3 bg-[#F5F7FF] rounded-xl p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.includeMultipleChoice}
                onChange={(e) =>
                  setFormData({ ...formData, includeMultipleChoice: e.target.checked })
                }
                className="w-4 h-4 text-[#304DB5] rounded focus:ring-[#304DB5]"
              />
              <span className="text-sm text-[#5F6473]">Multiple choice</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.includeTrueFalse}
                onChange={(e) =>
                  setFormData({ ...formData, includeTrueFalse: e.target.checked })
                }
                className="w-4 h-4 text-[#304DB5] rounded focus:ring-[#304DB5]"
              />
              <span className="text-sm text-[#5F6473]">True/False</span>
            </label>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={generateQuiz}
          disabled={isGenerating || !formData.topic.trim()}
          className="w-full bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold py-4 rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating...' : 'Generate Quiz'}
        </button>
      </div>

      {/* Output Side */}
      <div className="bg-gradient-to-br from-[#F5F7FF] to-[#FEFBFF] rounded-2xl p-6 border border-[#EDF0FB]">
        <h4 className="text-xl font-bold text-[#111827] mb-4">Generated Quiz</h4>

        {!generatedQuestions ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-6xl mb-4">❓</div>
            <p className="text-[#9CA3B5]">
              Fill in the form and click"Generate Quiz" to create your questions.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {generatedQuestions.map((question, idx) => (
                <div key={question.id} className="bg-white rounded-xl p-5 shadow-sm">
                  {/* Question Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#304DB5] text-white text-xs font-bold">
                        {idx + 1}
                      </span>
                      <span className="px-3 py-1 bg-[#E0E5FF] text-[#304DB5] text-xs font-medium rounded-full">
                        {question.type === 'multiple-choice' ? 'Multiple Choice' : 'True/False'}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleEdit(question.id)}
                      className="text-xs text-[#5F6473] hover:text-[#304DB5] font-medium"
                    >
                      {question.isEditing ? 'Done' : 'Edit'}
                    </button>
                  </div>

                  {/* Question Text */}
                  {question.isEditing ? (
                    <textarea
                      value={question.question}
                      className="w-full px-3 py-2 text-sm border border-[#EDF0FB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#304DB5] mb-3"
                      rows={2}
                    />
                  ) : (
                    <p className="text-sm font-medium text-[#111827] mb-3">
                      {question.question}
                    </p>
                  )}

                  {/* Options */}
                  {question.type === 'multiple-choice' && question.options && (
                    <div className="space-y-2">
                      {question.options.map((option, optIdx) => (
                        <div
                          key={optIdx}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                            optIdx === question.correctAnswer
                              ? 'bg-green-50 border border-green-300'
                              : 'bg-gray-50 border border-gray-200'
                          }`}
                        >
                          <span className="text-xs">
                            {optIdx === question.correctAnswer ? '✓' : '○'}
                          </span>
                          <span
                            className={
                              optIdx === question.correctAnswer
                                ? 'text-green-700 font-medium'
                                : 'text-[#5F6473]'
                            }
                          >
                            {option}
                          </span>
                          {optIdx === question.correctAnswer && (
                            <span className="ml-auto text-xs text-green-600 font-semibold">
                              Correct
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* True/False Answer */}
                  {question.type === 'true-false' && (
                    <div className="flex gap-3">
                      <div
                        className={`flex-1 px-3 py-2 rounded-lg text-sm text-center ${
                          question.correctAnswer === 'True'
                            ? 'bg-green-50 border border-green-300 text-green-700 font-medium'
                            : 'bg-gray-50 border border-gray-200 text-[#5F6473]'
                        }`}
                      >
                        {question.correctAnswer === 'True' ? '✓' : '○'} True
                      </div>
                      <div
                        className={`flex-1 px-3 py-2 rounded-lg text-sm text-center ${
                          question.correctAnswer === 'False'
                            ? 'bg-green-50 border border-green-300 text-green-700 font-medium'
                            : 'bg-gray-50 border border-gray-200 text-[#5F6473]'
                        }`}
                      >
                        {question.correctAnswer === 'False' ? '✓' : '○'} False
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Action Button */}
            <button
              onClick={sendToQuizBuilder}
              className="w-full bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-medium py-3 rounded-full shadow-md hover:shadow-lg transition-all"
            >
              Send to Quiz Builder
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AIQuizGeneratorTool;
