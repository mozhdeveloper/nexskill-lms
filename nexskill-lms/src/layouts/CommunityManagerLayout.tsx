import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import GlobalTopBarControls from '../components/system/GlobalTopBarControls';
import BrandLogo from '../components/brand/BrandLogo';

interface CommunityManagerLayoutProps {
  children: React.ReactNode;
}

const CommunityManagerLayout: React.FC<CommunityManagerLayoutProps> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/community/dashboard', label: 'Dashboard' },
    { path: '/community/overview', label: 'Overview' },
    { path: '/community/groups', label: 'Groups' },
    { path: '/community/approvals', label: 'Approvals' },
    { path: '/community/announcements', label: 'Announcements' },
    { path: '/community/engagement', label: 'Engagement' },
    { path: '/community/profile', label: 'Profile' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0FFF9] via-[#E8FFF5] to-[#D0FFED] p-8">
      <div className="mx-auto bg-white rounded-[32px] shadow-card overflow-hidden flex" style={{ minHeight: 'calc(100vh - 64px)' }}>
        {/* Left Sidebar */}
        <aside className="w-[240px] flex-shrink-0 flex flex-col p-6 border-r border-[#EDF0FB]">
          {/* Logo */}
          <div className="mb-8">
            <Link to="/community/dashboard" className="flex items-center gap-3">
              <BrandLogo size="md" showText={false} />
              <div>
                <span className="text-xl font-bold text-green-600 block leading-tight">NexSkill</span>
                <span className="text-xs text-slate-600">Community Manager</span>
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
                    ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white font-medium shadow-md'
                    : 'text-text-secondary hover:bg-[#F0FFF9] hover:text-text-primary'
                  }`}
              >

                <span className="text-sm">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Quick Stats */}
          <div className="mt-6 p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl border border-green-100">
            <p className="text-xs font-semibold text-green-800 mb-3">Quick Stats</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-600">Pending Posts</span>
                <span className="text-sm font-bold text-green-800">8</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-600">Active Groups</span>
                <span className="text-sm font-bold text-green-800">15</span>
              </div>
            </div>
          </div>

          {/* User Profile */}
          <div className="pt-6 mt-6 border-t border-[#EDF0FB]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center text-white font-semibold">
                CM
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">Community Manager</p>
                <p className="text-xs text-text-muted truncate">Moderator</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <header className="h-16 flex-shrink-0 flex items-center justify-end px-8 border-b border-[#EDF0FB]">
            <GlobalTopBarControls />
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default CommunityManagerLayout;
