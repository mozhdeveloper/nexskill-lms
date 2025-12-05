import React, { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlobalTopBarControls from '../components/system/GlobalTopBarControls';
import BrandLogo from '../components/brand/BrandLogo';

interface PlatformOwnerAppLayoutProps {
  children: ReactNode;
}

const PlatformOwnerAppLayout: React.FC<PlatformOwnerAppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { currentUser } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/owner/dashboard', icon: '👑' },
    { label: 'Users & Roles', path: '/owner/users', icon: '👥' },
    { label: 'Billing & Payouts', path: '/owner/billing', icon: '💰' },
    { label: 'Security & Compliance', path: '/owner/security', icon: '🔒' },
    { label: 'System Settings', path: '/owner/settings', icon: '⚙️' },
    { label: 'AI Governance', path: '/owner/ai-governance', icon: '🤖' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E7F0FF] via-[#F9F0FF] to-[#E3F4FF] p-8 transition-colors">
      <div className="max-w-[1440px] mx-auto bg-white rounded-[32px] shadow-card overflow-hidden flex transition-colors" style={{ minHeight: 'calc(100vh - 64px)' }}>
        {/* Left Sidebar */}
        <aside className="w-[240px] flex-shrink-0 flex flex-col p-6 border-r border-[#EDF0FB]">
          {/* Logo */}
          <div className="mb-8">
            <Link to="/owner/dashboard" className="flex items-center gap-3">
              <BrandLogo size="md" showText={false} />
              <div>
                <span className="text-xl font-bold text-purple-600 block leading-tight">NexSkill</span>
                <span className="text-xs text-slate-600">Platform Owner</span>
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
                    ? 'bg-purple-50/30 text-purple-700 font-medium'
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
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-400 flex items-center justify-center text-white font-semibold">
                {currentUser?.name.charAt(0).toUpperCase() || 'P'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {currentUser?.name || 'Platform Owner'}
                </p>
                <p className="text-xs text-text-muted">Super Admin</p>
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

export default PlatformOwnerAppLayout;
