import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import GlobalTopBarControls from '../components/system/GlobalTopBarControls';
import BrandLogo from '../components/brand/BrandLogo';
import { LogOut } from 'lucide-react';

interface OrgOwnerAppLayoutProps {
  children: React.ReactNode;
}

const OrgOwnerAppLayout: React.FC<OrgOwnerAppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    sessionStorage.clear();
    navigate('/login');
  };

  const navItems = [
    { path: '/org/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/org/team', label: 'Team Members', icon: '👥' },
    { path: '/org/programs', label: 'Training Programs', icon: '🎓' },
    { path: '/org/analytics', label: 'Analytics', icon: '📈' },
    { path: '/org/licenses', label: 'Licenses', icon: '🎫' },
    { path: '/org/billing', label: 'Billing', icon: '💳' },
    { path: '/org/branding', label: 'Branding', icon: '🎨' },
    { path: '/org/settings', label: 'Settings', icon: '⚙️' },
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
                <span className="text-xs text-slate-600">Organization Portal</span>
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
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                    : 'text-text-secondary hover:bg-[#FFF5F0] hover:text-text-primary'
                  }`}
              >
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Organization Stats */}
          <div className="mt-6 p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-100">
            <p className="text-xs font-semibold text-orange-800 mb-3">Quick Stats</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-orange-600">Active Members</span>
                <span className="text-sm font-bold text-orange-800">142</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-orange-600">Licenses Used</span>
                <span className="text-sm font-bold text-orange-800">142/200</span>
              </div>
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

export default OrgOwnerAppLayout;
