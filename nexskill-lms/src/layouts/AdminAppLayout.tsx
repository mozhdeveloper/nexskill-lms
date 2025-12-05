import React, { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import GlobalTopBarControls from '../components/system/GlobalTopBarControls';
import BrandLogo from '../components/brand/BrandLogo';

interface AdminAppLayoutProps {
  children: ReactNode;
}

const AdminAppLayout: React.FC<AdminAppLayoutProps> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
    { label: 'Users', path: '/admin/users', icon: '👥' },
    { label: 'Coaches', path: '/admin/coaches', icon: '🎓' },
    { label: 'Courses', path: '/admin/courses/moderation', icon: '📚' },
    { label: 'Funnels', path: '/admin/funnels', icon: '🎯' },
    { label: 'Finance', path: '/admin/finance', icon: '💰' },
    { label: 'Contacts', path: '/admin/contacts', icon: '👤' },
    { label: 'CRM & Marketing', path: '/admin/crm-marketing', icon: '📢' },
    { label: 'Notifications', path: '/admin/notifications', icon: '🔔' },
    { label: 'Analytics', path: '/admin/analytics', icon: '📈' },
    { label: 'Reports', path: '/admin/reports', icon: '📋' },
    { label: 'Security', path: '/admin/security', icon: '🔒' },
    { label: 'Settings', path: '/admin/settings', icon: '⚙️' },
  ];

  const isActive = (path: string) => {
    // Exact match
    if (location.pathname === path) return true;
    
    // For nested routes, check if current path starts with nav path
    // e.g., /admin/contacts/123 should highlight /admin/contacts
    if (path !== '/admin/dashboard' && location.pathname.startsWith(path + '/')) {
      return true;
    }
    
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4FF] via-[#E8EEFF] to-[#F0F4FF] p-8 transition-colors">
      <div className="max-w-[1440px] mx-auto bg-white rounded-[32px] shadow-card overflow-hidden flex transition-colors" style={{ minHeight: 'calc(100vh - 64px)' }}>
        {/* Left Sidebar */}
        <aside className="w-[240px] flex-shrink-0 flex flex-col p-6 border-r border-[#EDF0FB]">
          {/* Logo */}
          <div className="mb-8">
            <Link to="/admin/dashboard" className="flex items-center gap-3">
              <BrandLogo size="md" showText={false} />
              <div>
                <span className="text-xl font-bold text-[#304DB5] block leading-tight">NexSkill</span>
                <span className="text-xs text-slate-600">Admin Console</span>
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
                    ? 'bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white shadow-md'
                    : 'text-text-secondary hover:bg-[#F0F4FF] hover:text-text-primary'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
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

export default AdminAppLayout;
