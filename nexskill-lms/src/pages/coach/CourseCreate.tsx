import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CoachAppLayout from '../../layouts/CoachAppLayout';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../context/UserContext';

const CourseCreate: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    language: 'English',
    level: 'Beginner',
  });

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
    } else if (data) {
      setCategories(data);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const levels = [
    { value: 'Beginner', label: 'Beginner' },
    { value: 'Intermediate', label: 'Intermediate' },
    { value: 'Advanced', label: 'Advanced' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) {
      window.alert('You must be logged in to create a course.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('courses')
        .insert([
          {
            title: formData.title,
            category_id: formData.category_id ? parseInt(formData.category_id) : null,
            level: formData.level,
            duration_hours: 0, // Default for now, can be updated later
            price: 0, // Default for now
            visibility: 'private', // Default to private (Draft)
            coach_id: profile.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        window.alert(`✅ Course Created Successfully\n\nCourse: ${data.title}`);
        navigate(`/coach/courses/${data.id}/edit`, { state: { newCourse: true, ...formData } });
      }
    } catch (error: any) {
      console.error('Error creating course:', error);
      window.alert(`Failed to create course: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
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
                  <label htmlFor="category_id" className="block text-sm font-semibold text-slate-700 dark:text-dark-text-primary mb-2">
                    Category *
                  </label>
                  <select
                    id="category_id"
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    className="w-full px-5 py-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
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
                    disabled={isSubmitting}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Creating...' : 'Create course'}
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
