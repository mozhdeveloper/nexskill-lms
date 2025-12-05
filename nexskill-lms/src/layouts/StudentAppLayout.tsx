import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import GlobalTopBarControls from '../components/system/GlobalTopBarControls';
import BrandLogo from '../components/brand/BrandLogo';

interface StudentAppLayoutProps {
  children: React.ReactNode;
}

const StudentAppLayout: React.FC<StudentAppLayoutProps> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/student/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/student/courses', label: 'My Courses', icon: '📚' },
    { path: '/student/community', label: 'Community', icon: '💬' },
    { path: '/student/coaching', label: 'Coaching', icon: '👨‍🏫' },
    { path: '/student/ai-coach', label: 'AI Coach', icon: '🤖' },    
    { path: '/student/live-classes', label: 'Live Classes', icon: '🎥' },
    { path: '/student/certificates', label: 'Certificates', icon: '🏆' },
    { path: '/student/membership', label: 'Membership', icon: '💎' },
    { path: '/student/profile', label: 'Profile', icon: '👤' },
    { path: '/student/settings', label: 'Settings', icon: '⚙️' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E7F0FF] via-[#F9F0FF] to-[#E3F4FF] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-8 transition-colors">
      <div className="max-w-[1440px] mx-auto bg-white dark:bg-dark-background-shell rounded-[32px] shadow-card overflow-hidden flex transition-colors" style={{ minHeight: 'calc(100vh - 64px)' }}>
        {/* Left Sidebar */}
        <aside className="w-[240px] flex-shrink-0 flex flex-col p-6 border-r border-[#EDF0FB] dark:border-gray-700">
          {/* Logo */}
          <div className="mb-8">
            <Link to="/student/dashboard" className="flex items-center gap-3">
              <BrandLogo size="md" showText={false} />
              <div>
                <span className="text-xl font-bold text-brand-primary block leading-tight">NexSkill</span>
                <span className="text-xs text-slate-600 dark:text-gray-400">Student Portal</span>
              </div>
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
                    ? 'bg-brand-primary-soft dark:bg-blue-900/30 text-brand-primary dark:text-blue-400 font-medium'
                    : 'text-text-secondary dark:text-dark-text-secondary hover:bg-[#F5F7FF] dark:hover:bg-gray-800 hover:text-brand-primary dark:hover:text-blue-400'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Profile */}
          <div className="pt-6 mt-6 border-t border-[#EDF0FB] dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
                S
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary truncate">Student User</p>
                <p className="text-xs text-text-muted dark:text-dark-text-muted">Premium</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar with Global Controls */}
          <div className="flex items-center justify-end px-8 pt-6 pb-4 border-b border-[#EDF0FB] dark:border-gray-700">
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

export default StudentAppLayout;
