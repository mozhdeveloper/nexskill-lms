import React, { useState } from 'react';

interface CourseModule {
  title: string;
  lessons: string[];
}

interface OutlineState {
  topic: string;
  audience: string;
  difficulty: string;
  courseLength: string;
  focusAreas: string[];
}

const AICourseOutlineTool: React.FC = () => {
  const [formData, setFormData] = useState<OutlineState>({
    topic: '',
    audience: '',
    difficulty: 'beginner',
    courseLength: 'standard',
    focusAreas: [],
  });
  const [generatedOutline, setGeneratedOutline] = useState<CourseModule[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const focusAreaOptions = [
    'Career-ready',
    'Project-based',
    'Exam prep',
    'Hands-on practice',
    'Theory-focused',
    'Real-world examples',
  ];

  const toggleFocusArea = (area: string) => {
    setFormData((prev) => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(area)
        ? prev.focusAreas.filter((a) => a !== area)
        : [...prev.focusAreas, area],
    }));
  };

  const generateOutline = () => {
    setIsGenerating(true);

    // Simulate AI generation delay
    setTimeout(() => {
      const moduleCounts: Record<string, number> = {
        short: 4,
        standard: 6,
        intensive: 9,
      };

      const moduleCount = moduleCounts[formData.courseLength] || 6;
      const modules: CourseModule[] = [];

      for (let i = 1; i <= moduleCount; i++) {
        const lessonCount = 3 + Math.floor(Math.random() * 3); // 3-5 lessons per module
        const lessons: string[] = [];

        for (let j = 1; j <= lessonCount; j++) {
          lessons.push(
            `${formData.topic ? formData.topic + ' - ' : ''}Lesson ${j}: Core Concept ${j}`
          );
        }

        modules.push({
          title: `Module ${i}: ${formData.topic || 'Topic'} Fundamentals ${i}`,
          lessons,
        });
      }

      setGeneratedOutline(modules);
      setIsGenerating(false);
    }, 1200);
  };

  const copyOutline = () => {
    if (!generatedOutline) return;

    let text = `Course Outline: ${formData.topic}\n\n`;
    generatedOutline.forEach((module) => {
      text += `${module.title}\n`;
      module.lessons.forEach((lesson) => {
        text += `  • ${lesson}\n`;
      });
      text += '\n';
    });

    navigator.clipboard.writeText(text);
    alert('Outline copied to clipboard!');
  };

  const sendToCourseBuilder = () => {
    console.log('Sending to Course Builder:', { formData, generatedOutline });
    alert('Outline sent to Course Builder (simulated)');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Input Side */}
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-[#111827] mb-4">Generate Course Outline</h3>
          <p className="text-sm text-[#5F6473] mb-6">
            Provide course details and we'll create a structured outline for you.
          </p>
        </div>

        {/* Course Topic */}
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-2">
            Course Topic
          </label>
          <input
            type="text"
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            placeholder="e.g., Web Development with React"
            className="w-full px-4 py-3 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5] focus:border-transparent"
          />
        </div>

        {/* Target Audience */}
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-2">
            Target Audience
          </label>
          <textarea
            value={formData.audience}
            onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
            placeholder="Describe your target learners..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5] focus:border-transparent resize-none"
          />
        </div>

        {/* Difficulty Level */}
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-2">
            Difficulty Level
          </label>
          <select
            value={formData.difficulty}
            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5] focus:border-transparent"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {/* Course Length */}
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-3">
            Course Length Preference
          </label>
          <div className="space-y-2">
            {[
              { value: 'short', label: 'Short (3–5 modules)' },
              { value: 'standard', label: 'Standard (6–8 modules)' },
              { value: 'intensive', label: 'Intensive (9+ modules)' },
            ].map((option) => (
              <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="courseLength"
                  value={option.value}
                  checked={formData.courseLength === option.value}
                  onChange={(e) =>
                    setFormData({ ...formData, courseLength: e.target.value })
                  }
                  className="w-4 h-4 text-[#304DB5] focus:ring-[#304DB5]"
                />
                <span className="text-sm text-[#5F6473]">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Focus Areas */}
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-3">
            Optional Focus Areas
          </label>
          <div className="flex flex-wrap gap-2">
            {focusAreaOptions.map((area) => (
              <button
                key={area}
                onClick={() => toggleFocusArea(area)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  formData.focusAreas.includes(area)
                    ? 'bg-[#304DB5] text-white shadow-md'
                    : 'bg-[#F5F7FF] text-[#5F6473] hover:bg-[#E0E5FF]'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={generateOutline}
          disabled={isGenerating || !formData.topic}
          className="w-full bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold py-4 rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating...' : 'Generate Outline'}
        </button>
      </div>

      {/* Output Side */}
      <div className="bg-gradient-to-br from-[#F5F7FF] to-[#FEFBFF] rounded-2xl p-6 border border-[#EDF0FB]">
        <h4 className="text-xl font-bold text-[#111827] mb-4">Proposed Course Structure</h4>

        {!generatedOutline ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-[#9CA3B5]">
              Fill in the form and click"Generate Outline" to see your course structure.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {generatedOutline.map((module, idx) => (
                <div key={idx} className="bg-white rounded-xl p-4 shadow-sm">
                  <h5 className="font-bold text-[#304DB5] mb-2">{module.title}</h5>
                  <ul className="space-y-1.5">
                    {module.lessons.map((lesson, lessonIdx) => (
                      <li key={lessonIdx} className="text-sm text-[#5F6473] flex items-start">
                        <span className="mr-2">•</span>
                        <span>{lesson}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={copyOutline}
                className="flex-1 bg-white text-[#304DB5] border border-[#304DB5] font-medium py-3 rounded-full hover:bg-[#F5F7FF] transition-all"
              >
                Copy Outline
              </button>
              <button
                onClick={sendToCourseBuilder}
                className="flex-1 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-medium py-3 rounded-full shadow-md hover:shadow-lg transition-all"
              >
                Send to Course Builder
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AICourseOutlineTool;
