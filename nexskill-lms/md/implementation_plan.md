# Course Builder Redesign - Complete Implementation Plan

## Table of Contents
1. [Overview](#overview)
2. [Phase 1: Core Layout Improvements](#phase-1-core-layout-improvements)
3. [Phase 2: Settings Form Enhancement](#phase-2-settings-form-enhancement)
4. [Phase 3: Curriculum Editor Redesign](#phase-3-curriculum-editor-redesign)
5. [Phase 4: Sidebar & Navigation](#phase-4-sidebar--navigation)
6. [Phase 5: New Features Integration](#phase-5-new-features-integration)
7. [Dependencies & Setup](#dependencies--setup)

---

## Overview

### Design Goals
- **Improved Visual Hierarchy**: Clear sections with better organization
- **Enhanced Usability**: Intuitive navigation and reduced cognitive load
- **Better Feedback**: Real-time validation, auto-save, and progress tracking
- **Modern Aesthetics**: Contemporary UI with smooth transitions
- **Responsive Design**: Works seamlessly across all screen sizes

### Key Changes Summary
1. ✅ Add progress tracking header
2. ✅ Implement auto-save functionality
3. ✅ Consolidate lessons/quizzes into curriculum
4. ✅ Add admin verification workflow
5. ✅ Conditional live sessions access
6. ✅ Enhanced form validation and feedback
7. ✅ Improved drag-and-drop for curriculum
8. ✅ Better empty states and onboarding

---

## Phase 1: Core Layout Improvements

### 1.1 Install Dependencies

```bash
npm install framer-motion date-fns
# or
yarn add framer-motion date-fns
```

### 1.2 CourseBuilder.tsx - Add Progress Tracking Header

**Location**: `src/pages/coach/CourseBuilder.tsx`

**Step 1**: Add progress calculation function after state declarations

```tsx
// Add this after all useState declarations (around line 90)
const calculateCompletionPercentage = (): number => {
  const checks = {
    hasTitle: settings.title.length > 0,
    hasDescription: settings.longDescription.length > 50,
    hasShortDescription: settings.shortDescription.length > 0,
    hasCategory: settings.category.length > 0,
    hasLevel: settings.level.length > 0,
    hasModules: curriculum.length > 0,
    hasLessons: curriculum.some(m => m.lessons.length > 0),
    hasPricing: pricing.price > 0,
    hasTopics: settings.topics && settings.topics.length >= 3,
  };
  
  const completed = Object.values(checks).filter(Boolean).length;
  return Math.round((completed / Object.keys(checks).length) * 100);
};

const getMissingRequirements = (): string[] => {
  const missing: string[] = [];
  if (!settings.title) missing.push('Course title');
  if (settings.longDescription.length < 50) missing.push('Detailed description (min 50 characters)');
  if (!settings.shortDescription) missing.push('Short description');
  if (!settings.category) missing.push('Category');
  if (curriculum.length === 0) missing.push('At least one module');
  if (!curriculum.some(m => m.lessons.length > 0)) missing.push('At least one lesson');
  if (pricing.price <= 0) missing.push('Course pricing');
  if (!settings.topics || settings.topics.length < 3) missing.push('At least 3 topics');
  return missing;
};
```

**Step 2**: Replace the breadcrumb section (around line 650) with enhanced navigation

```tsx
{/* Replace the existing breadcrumb div with this */}
<div className="mb-6">
  {/* Enhanced Breadcrumb Navigation */}
  <nav className="mb-4 flex items-center justify-between">
    <div className="flex items-center gap-2 text-sm">
      <button 
        onClick={() => navigate('/coach/dashboard')}
        className="flex items-center gap-1.5 text-slate-600 dark:text-dark-text-secondary hover:text-slate-900 dark:hover:text-dark-text-primary transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        Dashboard
      </button>
      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
      <button 
        onClick={() => navigate('/coach/courses')}
        className="text-slate-600 dark:text-dark-text-secondary hover:text-slate-900 dark:hover:text-dark-text-primary transition-colors"
      >
        My Courses
      </button>
      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
      <span className="text-slate-900 dark:text-dark-text-primary font-medium">
        {settings.title || 'New Course'}
      </span>
    </div>
    
    {/* Auto-save indicator */}
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <span>All changes saved</span>
    </div>
  </nav>

  {/* Progress Tracking Header */}
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl border border-blue-100 dark:border-gray-700 p-6 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-[#304DB5] to-[#5E7BFF] rounded-xl shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-dark-text-primary">
            {settings.title || 'Untitled Course'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-dark-text-secondary">
            Complete all sections to submit for review
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <span className={`px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 ${
          courseStatus === 'published' 
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
        }`}>
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              courseStatus === 'published' ? 'bg-green-400' : 'bg-amber-400'
            }`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              courseStatus === 'published' ? 'bg-green-500' : 'bg-amber-500'
            }`}></span>
          </span>
          {courseStatus === 'published' ? 'Published' : 'Draft'}
        </span>
        
        <button 
          onClick={() => setActiveSection('preview')}
          className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-dark-text-primary hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all border border-slate-200 dark:border-gray-600 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Preview
        </button>
      </div>
    </div>
    
    {/* Progress Bar */}
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700 dark:text-dark-text-primary">
          Course Completion
        </span>
        <span className="font-bold text-slate-900 dark:text-dark-text-primary">
          {calculateCompletionPercentage()}%
        </span>
      </div>
      <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
        <div 
          className="h-full bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] transition-all duration-700 ease-out rounded-full shadow-lg"
          style={{ width: `${calculateCompletionPercentage()}%` }}
        />
      </div>
      
      {/* Missing Requirements */}
      {calculateCompletionPercentage() < 100 && (
        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 mb-2 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Still needed:
          </p>
          <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1 ml-5">
            {getMissingRequirements().map((req, idx) => (
              <li key={idx} className="list-disc">{req}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  </div>
</div>
```

**Step 3**: Add animation to section transitions (around line 660)

```tsx
// Import at the top of the file
import { motion, AnimatePresence } from 'framer-motion';

// Replace the main content area div with this
<div className="flex-1">
  <AnimatePresence mode="wait">
    <motion.div
      key={activeSection}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      <div className="bg-white dark:bg-dark-background-card rounded-3xl shadow-lg p-8">
        {renderSection()}
      </div>
    </motion.div>
  </AnimatePresence>
</div>
```

---

## Phase 2: Settings Form Enhancement

### 2.1 CourseSettingsForm.tsx - Complete Redesign

**Location**: `src/components/coach/course-builder/CourseSettingsForm.tsx`

**Step 1**: Import required dependencies at the top

```tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { formatDistanceToNow } from 'date-fns';
```

**Step 2**: Add auto-save state and functionality

```tsx
const CourseSettingsForm: React.FC<CourseSettingsFormProps> = ({ settings, onChange, onSave }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [availableTopics, setAvailableTopics] = useState<any[]>([]);
  const [topicSearch, setTopicSearch] = useState('');
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);

  // Validation function
  const validateField = (name: string, value: any): string | null => {
    switch (name) {
      case 'title':
        if (!value || value.length === 0) return 'Title is required';
        if (value.length > 60) return 'Title should be under 60 characters';
        if (value.length < 5) return 'Title should be at least 5 characters';
        return null;
      case 'shortDescription':
        if (!value || value.length === 0) return 'Short description is required';
        if (value.length > 160) return 'Keep it under 160 characters';
        if (value.length < 20) return 'Should be at least 20 characters';
        return null;
      case 'longDescription':
        if (!value || value.length === 0) return 'Detailed description is required';
        if (value.length < 50) return 'Should be at least 50 characters for better SEO';
        return null;
      case 'category':
        if (!value) return 'Please select a category';
        return null;
      default:
        return null;
    }
  };

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled) return;
    
    const timer = setTimeout(async () => {
      // Validate before auto-saving
      const errors: Record<string, string> = {};
      let hasErrors = false;
      
      Object.keys(settings).forEach(key => {
        const error = validateField(key, settings[key as keyof CourseSettings]);
        if (error) {
          errors[key] = error;
          hasErrors = true;
        }
      });
      
      if (!hasErrors) {
        await handleSave(true); // silent save
      }
    }, 3000); // Auto-save after 3 seconds of inactivity
    
    return () => clearTimeout(timer);
  }, [settings, autoSaveEnabled]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Real-time validation
    const error = validateField(name, value);
    setValidationErrors(prev => {
      const next = { ...prev };
      if (error) {
        next[name] = error;
      } else {
        delete next[name];
      }
      return next;
    });
    
    onChange({ ...settings, [name]: value });
  };

  const handleSave = async (silent = false) => {
    setIsSaving(true);
    try {
      await onSave();
      setLastSaved(new Date());
      if (!silent) {
        // Show success notification (implement toast notification)
        console.log('Settings saved successfully');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      if (!silent) {
        alert('Failed to save settings');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ... rest of the existing useEffect for fetchMetadata
```

**Step 3**: Replace the entire return statement with enhanced UI

```tsx
return (
  <div className="space-y-6">
    {/* Header with Auto-Save Toggle */}
    <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-dark-background-card z-10 pb-4 border-b border-slate-200 dark:border-gray-700">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-dark-text-primary">
          Course Settings
        </h2>
        {lastSaved && (
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}
          </p>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        {/* Auto-save toggle */}
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-dark-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={autoSaveEnabled}
            onChange={(e) => setAutoSaveEnabled(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
          />
          <span>Auto-save</span>
        </label>
        
        <button
          onClick={() => handleSave(false)}
          disabled={isSaving || Object.keys(validationErrors).length > 0}
          className={`px-6 py-2.5 font-semibold rounded-xl transition-all flex items-center gap-2 ${
            isSaving
              ? 'bg-green-100 text-green-700 cursor-wait'
              : Object.keys(validationErrors).length > 0
              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white hover:shadow-lg hover:scale-105'
          }`}
        >
          {isSaving ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>

    {/* Validation Errors Summary */}
    {Object.keys(validationErrors).length > 0 && (
      <div className="p-4 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 rounded-r-xl">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-semibold text-red-800 dark:text-red-400 mb-1">
              Please fix the following errors:
            </h4>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
              {Object.entries(validationErrors).map(([field, error]) => (
                <li key={field}>• {error}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    )}

    {/* Basic Information Card */}
    <div className="bg-gradient-to-br from-slate-50 to-white dark:from-gray-800 dark:to-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-dark-text-primary">
            Basic Information
          </h3>
          <p className="text-sm text-slate-600 dark:text-dark-text-secondary">
            Essential details that help students find your course
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Course Title with Character Count */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="title" className="block text-sm font-semibold text-slate-700 dark:text-dark-text-primary">
              Course Title <span className="text-red-500">*</span>
            </label>
            <span className={`text-xs font-medium ${
              settings.title.length > 50 
                ? 'text-amber-600' 
                : settings.title.length === 0 
                ? 'text-slate-400'
                : 'text-slate-500'
            }`}>
              {settings.title.length}/60
            </span>
          </div>
          <input
            type="text"
            id="title"
            name="title"
            value={settings.title}
            onChange={handleInputChange}
            maxLength={60}
            placeholder="e.g., Complete Web Development Bootcamp 2024"
            className={`w-full px-4 py-3.5 bg-white dark:bg-gray-900 rounded-xl border-2 transition-all ${
              validationErrors.title
                ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                : 'border-slate-200 dark:border-gray-700 focus:border-[#304DB5] focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30'
            } focus:outline-none`}
          />
          {validationErrors.title ? (
            <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {validationErrors.title}
            </p>
          ) : settings.title.length > 50 ? (
            <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Consider a shorter, punchier title for better engagement
            </p>
          ) : (
            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Make it clear, compelling, and keyword-rich for better discoverability
            </p>
          )}
        </div>

        {/* Subtitle */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="subtitle" className="block text-sm font-semibold text-slate-700 dark:text-dark-text-primary">
              Subtitle / Tagline
            </label>
            <span className="text-xs text-slate-500">
              {settings.subtitle.length}/120
            </span>
          </div>
          <input
            type="text"
            id="subtitle"
            name="subtitle"
            value={settings.subtitle}
            onChange={handleInputChange}
            maxLength={120}
            placeholder="A compelling tagline that complements your title"
            className="w-full px-4 py-3.5 bg-white dark:bg-gray-900 rounded-xl border-2 border-slate-200 dark:border-gray-700 focus:border-[#304DB5] focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
          />
          <p className="text-xs text-slate-500 mt-1.5 flex items-start gap-1.5">
            <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>This appears below your title on the course card and search results</span>
          </p>
        </div>

        {/* Grid for Category, Level, Language */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-semibold text-slate-700 dark:text-dark-text-primary mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="category"
                name="category"
                value={settings.category}
                onChange={handleInputChange}
                className={`w-full appearance-none px-4 py-3.5 bg-white dark:bg-gray-900 rounded-xl border-2 transition-all ${
                  validationErrors.category
                    ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                    : 'border-slate-200 dark:border-gray-700 focus:border-[#304DB5] focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30'
                } focus:outline-none cursor-pointer`}
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {validationErrors.category && (
              <p className="text-xs text-red-600 mt-1">{validationErrors.category}</p>
            )}
          </div>

          {/* Level */}
          <div>
            <label htmlFor="level" className="block text-sm font-semibold text-slate-700 dark:text-dark-text-primary mb-2">
              Difficulty Level <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="level"
                name="level"
                value={settings.level}
                onChange={handleInputChange}
                className="w-full appearance-none px-4 py-3.5 bg-white dark:bg-gray-900 rounded-xl border-2 border-slate-200 dark:border-gray-700 focus:border-[#304DB5] focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all cursor-pointer"
              >
                <option value="beginner">🌱 Beginner</option>
                <option value="intermediate">🚀 Intermediate</option>
                <option value="advanced">⭐ Advanced</option>
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Language */}
          <div>
            <label htmlFor="language" className="block text-sm font-semibold text-slate-700 dark:text-dark-text-primary mb-2">
              Language <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="language"
              name="language"
              value={settings.language}
              onChange={handleInputChange}
              placeholder="e.g., English"
              className="w-full px-4 py-3.5 bg-white dark:bg-gray-900 rounded-xl border-2 border-slate-200 dark:border-gray-700 focus:border-[#304DB5] focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
            />
          </div>
        </div>
      </div>
    </div>

    {/* Course Description Card */}
    <div className="bg-gradient-to-br from-slate-50 to-white dark:from-gray-800 dark:to-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl">
          <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-dark-text-primary">
            Course Description
          </h3>
          <p className="text-sm text-slate-600 dark:text-dark-text-secondary">
            Help students understand what they'll learn and why
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Short Description */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="shortDescription" className="block text-sm font-semibold text-slate-700 dark:text-dark-text-primary">
              Short Description <span className="text-red-500">*</span>
            </label>
            <span className={`text-xs font-medium ${
              settings.shortDescription.length > 140 
                ? 'text-amber-600' 
                : settings.shortDescription.length === 0 
                ? 'text-slate-400'
                : 'text-slate-500'
            }`}>
              {settings.shortDescription.length}/160
            </span>
          </div>
          <textarea
            id="shortDescription"
            name="shortDescription"
            value={settings.shortDescription}
            onChange={handleInputChange}
            rows={3}
            maxLength={160}
            placeholder="Write a compelling 1-2 sentence overview that appears on course cards and search results..."
            className={`w-full px-4 py-3.5 bg-white dark:bg-gray-900 rounded-xl border-2 transition-all resize-none ${
              validationErrors.shortDescription
                ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                : 'border-slate-200 dark:border-gray-700 focus:border-[#304DB5] focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30'
            } focus:outline-none`}
          />
          {validationErrors.shortDescription ? (
            <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {validationErrors.shortDescription}
            </p>
          ) : (
            <p className="text-xs text-slate-500 mt-1.5 flex items-start gap-1.5">
              <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>This is the first thing potential students will read. Make it compelling and action-oriented!</span>
            </p>
          )}
        </div>

        {/* Long Description */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="longDescription" className="block text-sm font-semibold text-slate-700 dark:text-dark-text-primary">
              Detailed Description <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium ${
                settings.longDescription.length < 50 
                  ? 'text-red-500'
                  : settings.longDescription.length < 200
                  ? 'text-amber-600'
                  : 'text-green-600'
              }`}>
                {settings.longDescription.length} characters
                {settings.longDescription.length < 50 && ' (min 50)'}
              </span>
            </div>
          </div>
          <textarea
            id="longDescription"
            name="longDescription"
            value={settings.longDescription}
            onChange={handleInputChange}
            rows={10}
            placeholder="Provide a detailed description of your course...

What will students learn?
• Key skill #1
• Key skill #2
• Key skill #3

Who is this course for?
• Target audience characteristic #1
• Target audience characteristic #2

What are the prerequisites?
• Requirement #1 (or 'No prior experience needed')
• Requirement #2"
            className={`w-full px-4 py-3.5 bg-white dark:bg-gray-900 rounded-xl border-2 transition-all resize-none font-mono text-sm ${
              validationErrors.longDescription
                ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                : 'border-slate-200 dark:border-gray-700 focus:border-[#304DB5] focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30'
            } focus:outline-none`}
          />
          {validationErrors.longDescription ? (
            <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {validationErrors.longDescription}
            </p>
          ) : (
            <div className="flex items-start justify-between mt-2 gap-4">
              <p className="text-xs text-slate-500 flex items-start gap-1.5">
                <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>Tip: Use bullet points and clear structure to make your description scannable</span>
              </p>
              {settings.longDescription.length >= 50 && (
                <button
                  type="button"
                  onClick={() => {
                    // TODO: Implement markdown preview
                    alert('Preview functionality coming soon!');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 whitespace-nowrap"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Topics Card - Enhanced */}
    <div className="bg-gradient-to-br from-slate-50 to-white dark:from-gray-800 dark:to-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-xl">
          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-dark-text-primary">
            Topics & Tags
          </h3>
          <p className="text-sm text-slate-600 dark:text-dark-text-secondary">
            Help students find your course (select 3-5 topics for best results)
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Selected Topics */}
        {settings.topics && settings.topics.length > 0 && (
          <div className="flex flex-wrap gap-2 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl">
            {settings.topics.map((topicId) => {
              const topic = availableTopics.find((t) => t.id === topicId);
              if (!topic) return null;
              return (
                <span
                  key={topic.id}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white shadow-sm hover:shadow-md transition-all group"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {topic.name}
                  <button
                    type="button"
                    onClick={() => {
                      const newTopics = settings.topics?.filter((id) => id !== topic.id) || [];
                      onChange({ ...settings, topics: newTopics });
                    }}
                    className="hover:bg-white/20 rounded-full p-1 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Topic Counter */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-dark-text-secondary">
            {settings.topics?.length || 0} topics selected
          </span>
          {settings.topics && settings.topics.length < 3 && (
            <span className="text-amber-600 text-xs flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Add at least 3 topics for better discoverability
            </span>
          )}
        </div>

        {/* Autocomplete Input */}
        <div className="relative">
          <div className="relative">
            <input
              type="text"
              value={topicSearch}
              onChange={(e) => {
                setTopicSearch(e.target.value);
                setShowTopicDropdown(true);
              }}
              onFocus={() => setShowTopicDropdown(true)}
              onBlur={() => setTimeout(() => setShowTopicDropdown(false), 200)}
              placeholder="Search and add topics (e.g., JavaScript, Web Development, React)..."
              className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-gray-900 rounded-xl border-2 border-slate-200 dark:border-gray-700 focus:border-[#304DB5] focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Dropdown Results */}
          {showTopicDropdown && topicSearch && (
            <div className="absolute z-20 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-slate-200 dark:border-gray-700 max-h-64 overflow-y-auto">
              {availableTopics
                .filter((topic) =>
                  topic.name.toLowerCase().includes(topicSearch.toLowerCase()) &&
                  !settings.topics?.includes(topic.id)
                )
                .map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      const currentTopics = settings.topics || [];
                      onChange({ ...settings, topics: [...currentTopics, topic.id] });
                      setTopicSearch('');
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 transition-colors flex items-center gap-2 group"
                  >
                    <svg className="w-4 h-4 text-slate-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {topic.name}
                  </button>
                ))}
              {availableTopics.filter(t => 
                t.name.toLowerCase().includes(topicSearch.toLowerCase()) && 
                !settings.topics?.includes(t.id)
              ).length === 0 && (
                <div className="px-4 py-6 text-center">
                  <svg className="w-12 h-12 mx-auto text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-slate-500 text-sm">No matching topics found</p>
                  <p className="text-slate-400 text-xs mt-1">Try a different search term</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Popular Topics Suggestion */}
        {(!settings.topics || settings.topics.length === 0) && (
          <div className="p-4 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700">
            <p className="text-xs font-semibold text-slate-700 dark:text-dark-text-primary mb-2">
              Popular topics to consider:
            </p>
            <div className="flex flex-wrap gap-2">
              {availableTopics.slice(0, 8).map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => {
                    const currentTopics = settings.topics || [];
                    if (!currentTopics.includes(topic.id)) {
                      onChange({ ...settings, topics: [...currentTopics, topic.id] });
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-dark-text-secondary bg-white dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-gray-600 border border-slate-200 dark:border-gray-600 rounded-lg transition-colors"
                >
                  + {topic.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Visibility Settings - Enhanced */}
    <div className="bg-gradient-to-br from-slate-50 to-white dark:from-gray-800 dark:to-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 rounded-xl">
          <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-dark-text-primary">
            Visibility & Access
          </h3>
          <p className="text-sm text-slate-600 dark:text-dark-text-secondary">
            Control who can see and access your course
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['public', 'unlisted', 'private'] as const).map((vis) => (
          <button
            key={vis}
            type="button"
            onClick={() => onChange({ ...settings, visibility: vis })}
            className={`group p-5 rounded-xl border-2 transition-all text-left relative overflow-hidden ${
              settings.visibility === vis
                ? 'border-[#5E7BFF] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-md'
                : 'border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600 hover:shadow-sm'
            }`}
          >
            {/* Selection Indicator */}
            {settings.visibility === vis && (
              <div className="absolute top-3 right-3">
                <div className="w-6 h-6 bg-[#5E7BFF] rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}

            {/* Icon */}
            <div className={`inline-flex p-2.5 rounded-lg mb-3 ${
              settings.visibility === vis
                ? 'bg-[#5E7BFF]/10'
                : 'bg-slate-100 dark:bg-gray-700 group-hover:bg-slate-200'
            }`}>
              {vis === 'public' && (
                <svg className={`w-5 h-5 ${settings.visibility === vis ? 'text-[#5E7BFF]' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {vis === 'unlisted' && (
                <svg className={`w-5 h-5 ${settings.visibility === vis ? 'text-[#5E7BFF]' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              )}
              {vis === 'private' && (
                <svg className={`w-5 h-5 ${settings.visibility === vis ? 'text-[#5E7BFF]' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
            </div>

            {/* Title */}
            <p className={`font-bold text-base mb-1.5 capitalize ${
              settings.visibility === vis
                ? 'text-[#5E7BFF]'
                : 'text-slate-900 dark:text-dark-text-primary'
            }`}>
              {vis}
            </p>

            {/* Description */}
            <p className="text-xs text-slate-600 dark:text-dark-text-secondary leading-relaxed">
              {vis === 'public' && 'Visible to all users in the course catalog and search engines'}
              {vis === 'unlisted' && 'Only accessible via direct link. Not shown in catalog or search'}
              {vis === 'private' && 'Only invited students can access. Perfect for exclusive content'}
            </p>

            {/* Feature Badges */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {vis === 'public' && (
                <>
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                    SEO Indexed
                  </span>
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                    Maximum Reach
                  </span>
                </>
              )}
              {vis === 'unlisted' && (
                <>
                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full">
                    Link Only
                  </span>
                  <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-full">
                    Hidden
                  </span>
                </>
              )}
              {vis === 'private' && (
                <>
                  <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full">
                    Invitation Only
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-full">
                    Exclusive
                  </span>
                </>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  </div>
);
```

---

## Phase 3: Curriculum Editor Redesign

### 3.1 CurriculumEditor.tsx - Enhanced Module & Lesson Management

**Location**: `src/components/coach/course-builder/CurriculumEditor.tsx`

**Step 1**: Add drag-and-drop state management

```tsx
import React, { useState } from 'react';
import type { Lesson } from '../../../types/lesson';

// Add after imports
interface DragState {
  moduleId: string | null;
  lessonId: string | null;
  type: 'module' | 'lesson' | null;
}

const CurriculumEditor: React.FC<CurriculumEditorProps> = ({ 
  curriculum, 
  onChange, 
  onEditLesson, 
  onAddLesson, 
  onDeleteLesson, 
  onMoveLesson 
}) => {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(curriculum.map((m) => m.id))
  );
  const [dragState, setDragState] = useState<DragState>({
    moduleId: null,
    lessonId: null,
    type: null
  });
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [showModuleActions, setShowModuleActions] = useState<string | null>(null);

  // ... rest of the component
```

**Step 2**: Replace the entire return statement with enhanced UI

```tsx
return (
  <div className="space-y-6">
    {/* Header with Stats */}
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl border border-blue-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-dark-text-primary mb-2">
            Course Curriculum
          </h2>
          <p className="text-sm text-slate-600 dark:text-dark-text-secondary">
            Organize your course content into modules and lessons
          </p>
        </div>
        <button
          onClick={handleAddModule}
          className="px-5 py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center gap-2 hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Module
        </button>
      </div>

      {/* Course Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-700/50 rounded-xl p-4 border border-slate-200 dark:border-gray-600">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-dark-text-primary">
                {curriculum.length}
              </p>
              <p className="text-xs text-slate-600 dark:text-dark-text-secondary">
                Modules
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-700/50 rounded-xl p-4 border border-slate-200 dark:border-gray-600">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-dark-text-primary">
                {curriculum.reduce((acc, mod) => acc + mod.lessons.length, 0)}
              </p>
              <p className="text-xs text-slate-600 dark:text-dark-text-secondary">
                Lessons
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-700/50 rounded-xl p-4 border border-slate-200 dark:border-gray-600">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-dark-text-primary">
                {curriculum.reduce((acc, mod) => 
                  acc + mod.lessons.reduce((lAcc, lesson) => 
                    lAcc + (lesson.estimated_duration_minutes || 0), 0
                  ), 0
                )} min
              </p>
              <p className="text-xs text-slate-600 dark:text-dark-text-secondary">
                Total Duration
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Curriculum List */}
    <div className="space-y-4">
      {curriculum.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16