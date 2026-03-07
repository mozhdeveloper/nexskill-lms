import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

interface CourseSettings {
  title: string;
  subtitle: string;
  category: string;
  level: string;
  language: string;
  shortDescription: string;
  longDescription: string;
  visibility: 'public' | 'unlisted' | 'private';
  topics: number[]; // Array of Topic IDs
  learningObjectives?: string[];
}

interface CourseSettingsFormProps {
  settings: CourseSettings;
  onChange: (updatedSettings: CourseSettings) => void;
  onSave: () => Promise<void>;
  onDelete: () => Promise<void>;
}

const CourseSettingsForm: React.FC<CourseSettingsFormProps> = ({ settings, onChange, onSave, onDelete }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  const [availableTopics, setAvailableTopics] = useState<any[]>([]);
  const [topicSearch, setTopicSearch] = useState('');
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      // Fetch Categories
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (catError) console.error('Error fetching categories:', catError);
      else if (catData) setCategories(catData);

      // Fetch Topics
      const { data: topicData, error: topicError } = await supabase
        .from('topics')
        .select('id, name')
        .order('name');

      if (topicError) console.error('Error fetching topics:', topicError);
      else if (topicData) setAvailableTopics(topicData);
    };
    fetchMetadata();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onChange({ ...settings, [name]: value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave();
    setIsSaving(false);
  };

  return (
    <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Course settings</h2>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`px-6 py-2 font-semibold rounded-full transition-all ${isSaving
            ? 'bg-green-100 text-green-700 cursor-not-allowed'
            : 'bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white hover:shadow-lg'
            }`}
        >
          {isSaving ? '✓ Saved' : 'Save changes'}
        </button>
      </div>

      <div className="space-y-6">
        {/* General Info */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-dark-text-primary mb-4">General information</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-slate-700 dark:text-dark-text-primary mb-2">
                Course title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={settings.title}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label htmlFor="subtitle" className="block text-sm font-semibold text-slate-700 dark:text-dark-text-primary mb-2">
                Subtitle / tagline
              </label>
              <input
                type="text"
                id="subtitle"
                name="subtitle"
                value={settings.subtitle}
                onChange={handleInputChange}
                placeholder="A brief tagline to complement your title"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-semibold text-slate-700 dark:text-dark-text-primary mb-2">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={settings.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="level" className="block text-sm font-semibold text-slate-700 dark:text-dark-text-primary mb-2">
                  Level
                </label>
                <select
                  id="level"
                  name="level"
                  value={settings.level}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label htmlFor="language" className="block text-sm font-semibold text-slate-700 dark:text-dark-text-primary mb-2">
                  Language
                </label>
                <input
                  type="text"
                  id="language"
                  name="language"
                  value={settings.language}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Course Details */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-dark-text-primary mb-4">Course details</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="shortDescription" className="block text-sm font-semibold text-slate-700 dark:text-dark-text-primary mb-2">
                Short description
              </label>
              <textarea
                id="shortDescription"
                name="shortDescription"
                value={settings.shortDescription}
                onChange={handleInputChange}
                rows={2}
                placeholder="One or two sentences for the course card"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
              />
            </div>

            <div>
              <label htmlFor="longDescription" className="block text-sm font-semibold text-slate-700 dark:text-dark-text-primary mb-2">
                Long description
              </label>
              <textarea
                id="longDescription"
                name="longDescription"
                value={settings.longDescription}
                onChange={handleInputChange}
                rows={6}
                placeholder="Detailed description of what students will learn"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
              />
            </div>

            {/* Topics Selection (Autocomplete) */}
            <div className="relative">
              <label className="block text-sm font-semibold text-slate-700 dark:text-dark-text-primary mb-2">
                Topics
              </label>

              {/* Selected Topics (Tags Display) */}
              <div className="flex flex-wrap gap-2 mb-3">
                {settings.topics?.map((topicId) => {
                  const topic = availableTopics.find((t) => t.id === topicId);
                  if (!topic) return null;
                  return (
                    <span
                      key={topic.id}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-[#304DB5]/10 text-[#304DB5] border border-[#304DB5]/20"
                    >
                      {topic.name}
                      <button
                        type="button"
                        onClick={() => {
                          const newTopics = settings.topics?.filter((id) => id !== topic.id) || [];
                          onChange({ ...settings, topics: newTopics });
                        }}
                        className="hover:bg-[#304DB5]/20 rounded-full p-0.5 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  );
                })}
              </div>

              {/* Autocomplete Input */}
              <div className="relative">
                <input
                  type="text"
                  value={topicSearch}
                  onChange={(e) => {
                    setTopicSearch(e.target.value);
                    setShowTopicDropdown(true);
                  }}
                  onFocus={() => setShowTopicDropdown(true)}
                  onBlur={() => setTimeout(() => setShowTopicDropdown(false), 200)} // Delay to allow click
                  placeholder="Search and select topics..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
                />

                {/* Dropdown Results */}
                {showTopicDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-slate-200 dark:border-gray-700 max-h-60 overflow-y-auto">
                    {availableTopics
                      .filter((topic) =>
                        topic.name.toLowerCase().includes(topicSearch.toLowerCase()) &&
                        !settings.topics?.includes(topic.id)
                      )
                      .map((topic) => (
                        <button
                          key={topic.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
                          onClick={() => {
                            const currentTopics = settings.topics || [];
                            onChange({ ...settings, topics: [...currentTopics, topic.id] });
                            setTopicSearch('');
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200"
                        >
                          {topic.name}
                        </button>
                      ))}
                    {availableTopics.filter(t => t.name.toLowerCase().includes(topicSearch.toLowerCase()) && !settings.topics?.includes(t.id)).length === 0 && (
                      <div className="px-4 py-2 text-slate-500 text-sm">No new topics found</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* What You'll Learn */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-dark-text-primary mb-4">What you'll learn</h3>
          <div className="space-y-3">
            {settings.learningObjectives?.map((objective, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={objective}
                    onChange={(e) => {
                      const newObjectives = [...(settings.learningObjectives || [])];
                      newObjectives[index] = e.target.value;
                      onChange({ ...settings, learningObjectives: newObjectives });
                    }}
                    placeholder="e.g., Build full-stack applications with React and Node.js"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newObjectives = settings.learningObjectives?.filter((_, i) => i !== index);
                      onChange({ ...settings, learningObjectives: newObjectives });
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => {
                const newObjectives = [...(settings.learningObjectives || []), ""];
                onChange({ ...settings, learningObjectives: newObjectives });
              }}
              className="flex items-center gap-2 text-[#304DB5] font-medium hover:text-[#5E7BFF] transition-colors mt-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add learning objective
            </button>
          </div>
        </div>

        {/* Visibility */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-dark-text-primary mb-4">Visibility</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(['public', 'unlisted', 'private'] as const).map((vis) => (
              <button
                key={vis}
                type="button"
                onClick={() => onChange({ ...settings, visibility: vis })}
                className={`p-4 rounded-xl border-2 transition-all text-left ${settings.visibility === vis
                  ? 'border-[#5E7BFF] bg-blue-50'
                  : 'border-slate-200 dark:border-gray-700 hover:border-slate-300'
                  }`}
              >
                <p className="font-semibold text-slate-900 dark:text-dark-text-primary capitalize mb-1">{vis}</p>
                <p className="text-xs text-slate-600">
                  {vis === 'public' && 'Visible to all users'}
                  {vis === 'unlisted' && 'Only via direct link'}
                  {vis === 'private' && 'Only invited students'}
                </p>
              </button>
            ))}
          </div>
        </div>
        {/* Danger Zone */}
        <div className="pt-6 border-t border-slate-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-red-600 mb-4">Danger Zone</h3>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-red-900">Delete this course</p>
              <p className="text-sm text-red-700">Once deleted, it cannot be recovered.</p>
            </div>
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-white border border-red-200 text-red-600 font-semibold rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors"
            >
              Delete Course
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseSettingsForm;
