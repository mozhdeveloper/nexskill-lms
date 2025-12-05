import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import GlobalTopBarControls from '../components/system/GlobalTopBarControls';
import BrandLogo from '../components/brand/BrandLogo';

interface SupportStaffAppLayoutProps {
  children: React.ReactNode;
}

const SupportStaffAppLayout: React.FC<SupportStaffAppLayoutProps> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/support/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/support/tickets', label: 'Tickets', icon: '🎫' },
    { path: '/support/students', label: 'Students', icon: '👥' },
    { path: '/support/tech-status', label: 'Tech Status', icon: '🔧' },
    { path: '/support/certificates', label: 'Certificates', icon: '🏆' },
    { path: '/support/knowledge-base', label: 'Knowledge Base', icon: '📚' },
    { path: '/support/profile', label: 'Profile', icon: '👤' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EFF6FF] via-[#E0F2FE] to-[#DBEAFE] p-8 transition-colors">
      <div className="max-w-[1440px] mx-auto bg-white rounded-[32px] shadow-card overflow-hidden flex transition-colors" style={{ minHeight: 'calc(100vh - 64px)' }}>
        {/* Left Sidebar */}
        <aside className="w-[240px] flex-shrink-0 flex flex-col p-6 border-r border-[#EDF0FB]">
          {/* Logo */}
          <div className="mb-8">
            <Link to="/support/dashboard" className="flex items-center gap-3">
              <BrandLogo size="md" showText={false} />
              <div>
                <span className="text-xl font-bold text-blue-600 block leading-tight">NexSkill</span>
                <span className="text-xs text-slate-600">Support Staff</span>
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
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                    : 'text-text-secondary hover:bg-[#EFF6FF] hover:text-text-primary'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Quick Stats Widget */}
          <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <p className="text-xs font-semibold text-blue-800 mb-2">Open Tickets</p>
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-600">Urgent</span>
                <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full">3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-600">High Priority</span>
                <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs font-bold rounded-full">8</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-600">Normal</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs font-bold rounded-full">13</span>
              </div>
            </div>
            <div className="pt-2 border-t border-blue-200">
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-600">Avg Response</span>
                <span className="font-bold text-blue-800">2.4h</span>
              </div>
            </div>
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

export default SupportStaffAppLayout;


