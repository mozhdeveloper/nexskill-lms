import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import GlobalTopBarControls from '../components/system/GlobalTopBarControls';
import BrandLogo from '../components/brand/BrandLogo';
import { LogOut } from 'lucide-react';

interface ContentEditorAppLayoutProps {
  children: React.ReactNode;
}

const ContentEditorAppLayout: React.FC<ContentEditorAppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    sessionStorage.clear();
    navigate('/login');
  };

  const navItems = [
    { path: '/content/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/content/courses', label: 'Courses', icon: '📚' },
    { path: '/content/lessons', label: 'Lessons', icon: '📝' },
    { path: '/content/media-library', label: 'Media Library', icon: '🎬' },
    { path: '/content/resources', label: 'Resources', icon: '📁' },
    { path: '/content/review-queue', label: 'Review Queue', icon: '✓' },
    { path: '/content/templates', label: 'Templates', icon: '📋' },
    { path: '/content/settings', label: 'Settings', icon: '⚙️' },
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
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                    : 'text-text-secondary hover:bg-[#FFF9F0] hover:text-text-primary'
                  }`}
              >
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Quick Actions */}
          <div className="mt-6 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
            <p className="text-xs font-semibold text-amber-800 mb-2">Quick Actions</p>
            <div className="space-y-2">
              <button className="w-full px-3 py-2 bg-white text-amber-600 text-xs font-medium rounded-lg hover:bg-amber-50 transition-colors border border-amber-200 text-left">
                📝 New Lesson
              </button>
              <button className="w-full px-3 py-2 bg-white text-amber-600 text-xs font-medium rounded-lg hover:bg-amber-50 transition-colors border border-amber-200 text-left">
                🎬 Upload Media
              </button>
            </div>
          </div>

          {/* Logout Button */}
          <div className="pt-6 mt-6 border-t border-[#EDF0FB]">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <header className="px-8 py-4 border-b border-[#EDF0FB] flex items-center justify-end">
            <GlobalTopBarControls />
          </header>

          {/* Page Content */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ContentEditorAppLayout;
