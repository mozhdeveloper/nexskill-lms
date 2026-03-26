import React from 'react';
import AdminAppLayout from '../../layouts/AdminAppLayout';
import CoachAppLayout from '../../layouts/CoachAppLayout';

interface ComingSoonProps {
  featureName: string;
  description?: string;
  layout?: 'admin' | 'coach' | 'full';
}

const ComingSoon: React.FC<ComingSoonProps> = ({ 
  featureName, 
  description = 'This feature is currently under development. Please check back later!',
  layout = 'full'
}) => {
  const renderContent = () => (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
          <span className="text-5xl">🚧</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary mb-3">
          {featureName}
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-text-secondary dark:text-dark-text-secondary mb-2">
          Coming Soon!
        </p>

        {/* Description */}
        <p className="text-sm text-text-muted dark:text-dark-text-muted mb-8">
          {description}
        </p>

        {/* Features Preview */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 mb-8">
          <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary mb-4">
            What's Coming:
          </h3>
          <div className="space-y-2 text-sm text-text-secondary dark:text-dark-text-secondary">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Enhanced functionality</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Improved user experience</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Better performance</span>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="text-xs text-text-muted dark:text-dark-text-muted">
          <p>Have questions? Contact our support team.</p>
          <p className="mt-1">We'll notify you when this feature is ready! 🎉</p>
        </div>
      </div>
    </div>
  );

  if (layout === 'admin') {
    return (
      <AdminAppLayout>
        {renderContent()}
      </AdminAppLayout>
    );
  }

  if (layout === 'coach') {
    return (
      <CoachAppLayout>
        {renderContent()}
      </CoachAppLayout>
    );
  }

  // Full page layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900">
      {renderContent()}
    </div>
  );
};

export default ComingSoon;
