import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import GlobalTopBarControls from '../components/system/GlobalTopBarControls';
import BrandLogo from '../components/brand/BrandLogo';
import { LogOut, Menu, X } from 'lucide-react';

interface ContentEditorAppLayoutProps {
  children: React.ReactNode;
}

const ContentEditorAppLayout: React.FC<ContentEditorAppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    sessionStorage.clear();
    navigate('/login');
  };

  const navItems = [
    { path: '/content/dashboard', label: 'Dashboard' },
    { path: '/content/courses', label: 'Courses' },
    { path: '/content/lessons', label: 'Lessons' },
    { path: '/content/media-library', label: 'Media Library' },
    { path: '/content/resources', label: 'Resources' },
    { path: '/content/review-queue', label: 'Review Queue' },
    { path: '/content/templates', label: 'Templates' },
    { path: '/content/settings', label: 'Settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="h-screen flex bg-[color:var(--bg-primary)] transition-colors overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[260px] flex-shrink-0 flex flex-col bg-[color:var(--color-bg-sidebar)] border-r border-[color:var(--border-base)] transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <Link to="/content/dashboard" className="flex items-center gap-3">
              <BrandLogo size="md" showText={false} />
              <div>
                <span className="text-xl font-bold text-gradient block leading-tight">NexSkill</span>
                <span className="text-xs text-[color:var(--text-secondary)]">Content Editor</span>
              </div>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-lg text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-glass-hover)]">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-hidden px-4 py-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${isActive(item.path)
                  ? 'bg-gradient-to-r from-[color:var(--color-brand-neon)] to-[color:var(--color-brand-electric)] text-white font-medium shadow-md'
                  : 'text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-glass-hover)] hover:text-[color:var(--color-brand-electric)]'
                }`}
            >
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Quick Actions */}
        <div className="mx-4 mb-2 p-3 glass-card rounded-xl">
          <p className="text-xs font-semibold text-[color:var(--text-primary)] mb-2">Quick Actions</p>
          <div className="space-y-1.5">
            <button className="w-full px-3 py-2 bg-[color:var(--bg-glass-hover)] text-[color:var(--color-brand-electric)] text-xs font-medium rounded-lg hover:bg-[color:var(--bg-glass)] transition-colors border border-[color:var(--border-base)] text-left">
              New Lesson
            </button>
            <button className="w-full px-3 py-2 bg-[color:var(--bg-glass-hover)] text-[color:var(--color-brand-electric)] text-xs font-medium rounded-lg hover:bg-[color:var(--bg-glass)] transition-colors border border-[color:var(--border-base)] text-left">
              Upload Media
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-[color:var(--border-base)]">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 border-b border-[color:var(--border-base)] bg-[color:var(--bg-secondary)]">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-glass-hover)]">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <GlobalTopBarControls />
        </header>

        <main className="flex-1 flex flex-col overflow-auto scrollbar-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ContentEditorAppLayout;
