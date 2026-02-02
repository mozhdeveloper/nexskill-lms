import React, { type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import GlobalTopBarControls from '../components/system/GlobalTopBarControls';
import BrandLogo from '../components/brand/BrandLogo';
import { LogOut } from 'lucide-react';

interface AdminAppLayoutProps {
  children: ReactNode;
}

const AdminAppLayout: React.FC<AdminAppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    sessionStorage.clear();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard' },
    { label: 'Users', path: '/admin/users' },
    { label: 'Coaches', path: '/admin/coaches' },
    { label: 'Courses', path: '/admin/courses/moderation' },
    { label: 'Funnels', path: '/admin/funnels' },
    { label: 'Finance', path: '/admin/finance' },
    { label: 'Contacts', path: '/admin/contacts' },
    { label: 'CRM & Marketing', path: '/admin/crm-marketing' },
    { label: 'Notifications', path: '/admin/notifications' },
    { label: 'Analytics', path: '/admin/analytics' },
    { label: 'Security', path: '/admin/security' },
    { label: 'Settings', path: '/admin/settings' },
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
    <div className="min-h-screen bg-[color:var(--bg-primary)] p-8 transition-colors">
      <div className="mx-auto bg-[color:var(--bg-secondary)] rounded-[32px] shadow-card overflow-hidden flex transition-colors border border-[color:var(--border-base)]" style={{ minHeight: 'calc(100vh - 64px)' }}>
        {/* Left Sidebar */}
        <aside className="w-[240px] flex-shrink-0 flex flex-col p-6 border-r border-[color:var(--border-base)]">
          {/* Logo */}
          <div className="mb-8">
            <Link to="/admin/dashboard" className="flex items-center gap-3">
              <BrandLogo size="md" showText={false} />
              <div>
                <span className="text-xl font-bold text-gradient block leading-tight">NexSkill</span>
                <span className="text-xs text-[color:var(--text-secondary)]">Admin Console</span>
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
                  ? 'bg-gradient-to-r from-[color:var(--color-brand-neon)] to-[color:var(--color-brand-electric)] text-[color:var(--text-on-neon)] shadow-md'
                  : 'text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-glass-hover)] hover:text-[color:var(--color-brand-electric)]'
                  }`}
              >
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="pt-6 mt-6 border-t border-[color:var(--border-base)]">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-[color:var(--bg-primary)]">
          {/* Top Bar */}
          <header className="px-8 py-4 border-b border-[color:var(--border-base)] flex items-center justify-end bg-[color:var(--bg-secondary)]">
            <GlobalTopBarControls />
          </header>

          {/* Page Content */}
          <main className="flex-1 flex flex-col overflow-hidden bg-[color:var(--bg-primary)]">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminAppLayout;
