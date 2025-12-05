import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlobalTopBarControls from '../components/system/GlobalTopBarControls';
import BrandLogo from '../components/brand/BrandLogo';

interface SubCoachAppLayoutProps {
  children: React.ReactNode;
}

const SubCoachAppLayout: React.FC<SubCoachAppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { currentUser } = useAuth();

  const navItems = [
    { path: '/subcoach/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/subcoach/students', label: 'My Students', icon: '👨‍🎓' },
    { path: '/subcoach/lessons', label: 'My Lessons', icon: '📚' },
    { path: '/subcoach/grading', label: 'Grading', icon: '✍️' },
    { path: '/subcoach/groups', label: 'Group Sessions', icon: '👥' },
    { path: '/subcoach/community', label: 'Community', icon: '💬' },
    { path: '/subcoach/notifications', label: 'Notifications', icon: '🔔' },
    { path: '/subcoach/profile', label: 'Profile', icon: '⚙️' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E7F0FF] via-[#F9F0FF] to-[#E3F4FF] p-8 transition-colors">
      <div className="max-w-[1440px] mx-auto bg-white rounded-[32px] shadow-card overflow-hidden flex transition-colors" style={{ minHeight: 'calc(100vh - 64px)' }}>
        {/* Left Sidebar */}
        <aside className="w-[240px] flex-shrink-0 flex flex-col p-6 border-r border-[#EDF0FB]">
          {/* Logo */}
          <div className="mb-8">
            <Link to="/subcoach/dashboard" className="flex items-center gap-3">
              <BrandLogo size="md" showText={false} />
              <div>
                <span className="text-xl font-bold text-teal-600 block leading-tight">NexSkill</span>
                <span className="text-xs text-slate-600">Sub-Coach Portal</span>
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
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium shadow-md'
                    : 'text-text-secondary hover:bg-teal-50 hover:text-teal-700'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Sub-Coach Profile */}
          <div className="pt-6 mt-6 border-t border-[#EDF0FB]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center text-white font-semibold">
                {currentUser?.name.charAt(0).toUpperCase() || 'S'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {currentUser?.name || 'Sub-Coach'}
                </p>
                <p className="text-xs text-text-muted">Assistant Instructor</p>
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

export default SubCoachAppLayout;
