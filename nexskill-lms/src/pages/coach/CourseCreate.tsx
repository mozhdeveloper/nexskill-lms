import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CoachAppLayout from '../../layouts/CoachAppLayout';

const CourseCreate: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    language: 'English',
    level: 'beginner',
  });

  const categories = [
    'Web Development',
    'Mobile Development',
    'Data Science',
    'Design',
    'Business',
    'Marketing',
    'Photography',
    'Music',
    'Other',
  ];

  const levels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Generate dummy courseId
    const courseId = `course-${Date.now()}`;
    window.alert(`✅ Course Created Successfully\n\nCourse: ${formData.title}\nCategory: ${formData.category}\nLevel: ${formData.level}\nLanguage: ${formData.language}\n\n📚 Course Setup:\n• Course ID: ${courseId}\n• Status: Draft\n• Visibility: Private\n\n🎯 Next Steps:\n1. Add course description and objectives\n2. Upload course thumbnail\n3. Create curriculum and lessons\n4. Set pricing and enrollment options\n5. Preview and publish\n\n💡 You can save your progress at any time and return later.`);
    // Navigate to builder with initial data
    navigate(`/coach/courses/${courseId}/edit`, { state: { newCourse: true, ...formData } });
  };

  const handleCancel = () => {
    navigate('/coach/courses');
  };

  return (
    <CoachAppLayout>
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 dark:border-gray-700 px-8 py-6">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-slate-600 dark:text-dark-text-secondary hover:text-slate-900 dark:hover:text-dark-text-primary dark:text-dark-text-primary mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to my courses
          </button>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-dark-text-primary mb-2">Create new course</h1>
          <p className="text-slate-600 dark:text-dark-text-secondary">Set up the basics to get started</p>
        </div>

        {/* Main Content */}
        <div className="p-8 flex items-center justify-center">
          <div className="w-full max-w-2xl">
            <div className="bg-white dark:bg-dark-background-card rounded-3xl shadow-xl p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Course Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-semibold text-slate-700 dark:text-dark-text-primary mb-2">
                    Course title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Complete Web Development Bootcamp"
                    className="w-full px-5 py-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                    required
                  />
                  <p className="text-xs text-slate-500 dark:text-dark-text-muted mt-2">Choose a clear, descriptive title</p>
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-sm font-semibold text-slate-700 dark:text-dark-text-primary mb-2">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-5 py-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Language & Level */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="language" className="block text-sm font-semibold text-slate-700 dark:text-dark-text-primary mb-2">
                      Primary language *
                    </label>
                    <input
                      type="text"
                      id="language"
                      name="language"
                      value={formData.language}
                      onChange={handleInputChange}
                      className="w-full px-5 py-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="level" className="block text-sm font-semibold text-slate-700 dark:text-dark-text-primary mb-2">
                      Difficulty level *
                    </label>
                    <select
                      id="level"
                      name="level"
                      value={formData.level}
                      onChange={handleInputChange}
                      className="w-full px-5 py-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                      required
                    >
                      {levels.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Info Box */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#304DB5] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-sm text-slate-700 dark:text-dark-text-primary">
                      You'll be able to add curriculum, pricing, and other details in the course builder.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all"
                  >
                    Create course
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 py-3 px-6 text-slate-700 font-medium rounded-full border-2 border-slate-300 dark:border-gray-600 hover:bg-slate-50 dark:bg-gray-800 dark:hover:bg-gray-800 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </CoachAppLayout>
  );
};

export default CourseCreate;
