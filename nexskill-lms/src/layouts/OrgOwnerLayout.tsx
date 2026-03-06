import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import GlobalTopBarControls from '../components/system/GlobalTopBarControls';
import BrandLogo from '../components/brand/BrandLogo';

interface OrgOwnerLayoutProps {
  children: React.ReactNode;
}

const OrgOwnerLayout: React.FC<OrgOwnerLayoutProps> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/org/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/org/team', label: 'Team', icon: '👥' },
    { path: '/org/seats', label: 'Seats & Licenses', icon: '🎫' },
    { path: '/org/learners', label: 'Learners', icon: '🎓' },
    { path: '/org/analytics', label: 'Analytics', icon: '📈' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5F0] via-[#FFF0E8] to-[#FFE8D8] p-8">
      <div className="mx-auto bg-white rounded-[32px] shadow-card overflow-hidden flex" style={{ minHeight: 'calc(100vh - 64px)' }}>
        {/* Left Sidebar */}
        <aside className="w-[240px] flex-shrink-0 flex flex-col p-6 border-r border-[#EDF0FB]">
          {/* Logo */}
          <div className="mb-8">
            <Link to="/org/dashboard" className="flex items-center gap-3">
              <BrandLogo size="md" showText={false} />
              <div>
                <span className="text-xl font-bold text-orange-600 block leading-tight">NexSkill</span>
                <span className="text-xs text-slate-600">Organization</span>
              </div>
            </Link>
          </div>

          {/* Current Organization Badge */}
          <div className="mb-6 p-3 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-100">
            <p className="text-xs font-semibold text-orange-800 mb-1">Current Organization</p>
            <p className="text-sm font-bold text-orange-900">Acme Corporation</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive(item.path)
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium shadow-md'
                    : 'text-text-secondary hover:bg-[#FFF5F0] hover:text-text-primary'
                  }`}
              >
                <span className="text-sm">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Organization Stats */}
          <div className="mt-6 p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-100">
            <p className="text-xs font-semibold text-orange-800 mb-3">Quick Stats</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-orange-600">Active Learners</span>
                <span className="text-sm font-bold text-orange-800">89</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-orange-600">Seats Used</span>
                <span className="text-sm font-bold text-orange-800">142/200</span>
              </div>
            </div>
          </div>

          {/* User Profile */}
          <div className="pt-6 mt-6 border-t border-[#EDF0FB]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center text-white font-semibold">
                OO
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">Org Owner</p>
                <p className="text-xs text-text-muted">Administrator</p>
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

export default OrgOwnerLayout;
