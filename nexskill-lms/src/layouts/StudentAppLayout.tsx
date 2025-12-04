import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface StudentAppLayoutProps {
  children: React.ReactNode;
}

const StudentAppLayout: React.FC<StudentAppLayoutProps> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/student/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/student/courses', label: 'My Courses', icon: '📚' },
    { path: '/student/live-classes', label: 'Live Classes', icon: '🎥' },
    { path: '/student/certificates', label: 'Certificates', icon: '🏆' },
    { path: '/student/ai-coach', label: 'AI Coach', icon: '🤖' },
    { path: '/student/settings', label: 'Settings', icon: '⚙️' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E7F0FF] via-[#F9F0FF] to-[#E3F4FF] p-8">
      <div className="max-w-[1440px] mx-auto bg-white rounded-[32px] shadow-card overflow-hidden flex" style={{ minHeight: 'calc(100vh - 64px)' }}>
        {/* Left Sidebar */}
        <aside className="w-[230px] flex-shrink-0 flex flex-col p-6 border-r border-[#EDF0FB]">
          {/* Logo */}
          <div className="mb-8">
            <Link to="/student/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center">
                <span className="text-white font-bold text-xl">N</span>
              </div>
              <span className="text-xl font-bold text-brand-primary">NexSkill</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive(item.path)
                    ? 'bg-brand-primary-soft text-brand-primary font-medium'
                    : 'text-text-secondary hover:bg-[#F5F7FF] hover:text-brand-primary'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Profile */}
          <div className="pt-6 mt-6 border-t border-[#EDF0FB]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
                S
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">Student User</p>
                <p className="text-xs text-text-muted">Premium</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default StudentAppLayout;
