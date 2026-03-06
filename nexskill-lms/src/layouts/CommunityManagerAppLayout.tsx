import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import GlobalTopBarControls from '../components/system/GlobalTopBarControls';
import BrandLogo from '../components/brand/BrandLogo';
import { LogOut } from 'lucide-react';

interface CommunityManagerAppLayoutProps {
  children: React.ReactNode;
}

const CommunityManagerAppLayout: React.FC<CommunityManagerAppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    sessionStorage.clear();
    navigate('/login');
  };

  const navItems = [
    { path: '/community/dashboard', label: 'Dashboard' },
    { path: '/community/discussions', label: 'Discussions' },
    { path: '/community/moderation', label: 'Moderation' },
    { path: '/community/reported-content', label: 'Reported Content' },
    { path: '/community/members', label: 'Members' },
    { path: '/community/engagement', label: 'Engagement' },
    { path: '/community/guidelines', label: 'Guidelines' },
    { path: '/community/settings', label: 'Settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0FFF4] via-[#E8FFF0] to-[#D0FFE8] p-8">
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
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                    : 'text-text-secondary hover:bg-[#F0FFF4] hover:text-text-primary'
                  }`}
              >
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Alerts */}
          <div className="mt-6 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
            <p className="text-xs font-semibold text-green-800 mb-2">Pending Reviews</p>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-green-600">Reported posts</span>
              <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full">3</span>
            </div>
            <button className="w-full px-3 py-2 bg-white text-green-600 text-xs font-medium rounded-lg hover:bg-green-50 transition-colors border border-green-200">
              Review Now
            </button>
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

export default CommunityManagerAppLayout;
