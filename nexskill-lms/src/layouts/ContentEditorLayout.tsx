import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import GlobalTopBarControls from '../components/system/GlobalTopBarControls';
import BrandLogo from '../components/brand/BrandLogo';

interface ContentEditorLayoutProps {
  children: React.ReactNode;
}

const ContentEditorLayout: React.FC<ContentEditorLayoutProps> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/content/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/content/review-queue', label: 'Review Queue', icon: '✓' },
    { path: '/content/courses', label: 'Courses', icon: '📚' },
    { path: '/content/resources', label: 'Resources', icon: '📁' },
    { path: '/content/translations', label: 'Translations', icon: '🌐' },
    { path: '/content/suggestions', label: 'Suggestions', icon: '💡' },
    { path: '/content/profile', label: 'Profile', icon: '👤' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F0] via-[#FFF5E8] to-[#FFE8D0] p-8">
      <div className="mx-auto bg-white rounded-[32px] shadow-card overflow-hidden flex" style={{ minHeight: 'calc(100vh - 64px)' }}>
        {/* Left Sidebar */}
        <aside className="w-[240px] flex-shrink-0 flex flex-col p-6 border-r border-[#EDF0FB]">
          {/* Logo */}
          <div className="mb-8">
            <Link to="/content/dashboard" className="flex items-center gap-3">
              <BrandLogo size="md" showText={false} />
              <div>
                <span className="text-xl font-bold text-amber-600 block leading-tight">NexSkill</span>
                <span className="text-xs text-slate-600">Content Editor</span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive(item.path)
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium shadow-md'
                    : 'text-text-secondary hover:bg-[#FFF9F0] hover:text-text-primary'
                  }`}
              >
                <span className="text-sm">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Quick Stats */}
          <div className="mt-6 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
            <p className="text-xs font-semibold text-amber-800 mb-3">Quick Stats</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-600">Review Queue</span>
                <span className="text-sm font-bold text-amber-800">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-600">Pending Tasks</span>
                <span className="text-sm font-bold text-amber-800">6</span>
              </div>
            </div>
          </div>

          {/* User Profile */}
          <div className="pt-6 mt-6 border-t border-[#EDF0FB]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white font-semibold">
                CE
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">Content Editor</p>
                <p className="text-xs text-text-muted">Editor</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar with Global Controls */}
          <div className="flex items-center justify-end px-8 pt-6 pb-4 border-b border-[#EDF0FB]">
            <GlobalTopBarControls />
          </div>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ContentEditorLayout;
