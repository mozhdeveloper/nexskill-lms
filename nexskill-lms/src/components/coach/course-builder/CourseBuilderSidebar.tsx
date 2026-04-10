import React from 'react';
import {
  Settings,
  BookOpen,
  Image,
  Video,
  Calendar,
  DollarSign,
  Rocket,
  Eye,
  HelpCircle,
  Target
} from 'lucide-react';

interface Section {
  key: string;
  label: string;
  icon: React.ElementType;
}

interface CourseBuilderSidebarProps {
  activeSection: string;
  onChangeSection: (sectionKey: string) => void;
  courseTitle: string;
  courseStatus: 'draft' | 'published';
  verificationStatus?: string;
  pendingContent?: boolean;
}

const sections: Section[] = [
  { key: 'settings', label: 'Overview & Settings', icon: Settings },
  { key: 'media', label: 'Course Media', icon: Image },
  { key: 'curriculum', label: 'Curriculum', icon: BookOpen },
  { key: 'goals', label: 'Course Goals', icon: Target },
  { key: 'live-sessions', label: 'Live Sessions', icon: Video },
  { key: 'drip', label: 'Drip Schedule', icon: Calendar },
  { key: 'pricing', label: 'Pricing', icon: DollarSign },
  { key: 'publish', label: 'Publish', icon: Rocket },
  { key: 'preview', label: 'Preview', icon: Eye },
];

const CourseBuilderSidebar: React.FC<CourseBuilderSidebarProps> = ({
  activeSection,
  onChangeSection,
  courseTitle,
  courseStatus,
  verificationStatus = 'draft',
  pendingContent = false,
}) => {
  const getStatusDisplay = () => {
    // Phase 1.5: Show "Pending Changes" when course is approved but has unpublished content
    if (verificationStatus === 'approved' && pendingContent) {
      return { text: 'Pending Changes', className: 'bg-purple-100 text-purple-700 border-purple-200' };
    }
    if (courseStatus === 'published') {
      return { text: 'Published', className: 'bg-green-100 text-green-700 border-green-200' };
    }
    return { text: 'Draft', className: 'bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-dark-text-primary border-slate-200' };
  };

  const statusInfo = getStatusDisplay();

  return (
    <div className="w-[280px] flex-shrink-0 bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 h-fit sticky top-8 flex flex-col overflow-hidden">
      {/* Course Summary */}
      <div className="p-5 border-b border-slate-200 dark:border-gray-700">
        <h3 className="font-bold text-slate-900 dark:text-dark-text-primary mb-3 line-clamp-2 leading-tight">
          {courseTitle || 'Untitled Course'}
        </h3>
        <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full border ${statusInfo.className}`}>
          {statusInfo.text}
        </span>
      </div>

      {/* Section Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.key;
          return (
            <button
              key={section.key}
              onClick={() => onChangeSection(section.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left group ${isActive
                  ? 'bg-[#304DB5] text-white shadow-md'
                  : 'text-slate-600 dark:text-dark-text-secondary hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-dark-text-primary'
                }`}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#304DB5] dark:text-gray-500 dark:group-hover:text-white'
                  }`}
                strokeWidth={isActive ? 2 : 1.5}
              />
              <span className={`text-sm font-medium ${isActive ? 'font-semibold' : ''}`}>
                {section.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Help Box */}
      <div className="p-4 border-t border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50">
        <div className="flex items-start gap-3">
          <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full flex-shrink-0">
            <HelpCircle className="w-4 h-4 text-[#304DB5] dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-dark-text-primary mb-1">Need help?</p>
            <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
              Check out our course creation guide or contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseBuilderSidebar;
