import React, { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

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
    <div className="min-h-screen bg-gradient-to-br from-[#F5F7FF] via-[#FEFEFE] to-[#FFF9F5]">
      <div className="max-w-7xl mx-auto my-8 px-4">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="flex">
            {/* Sidebar */}
            <aside className="w-64 bg-gradient-to-b from-[#304DB5] to-[#5E7BFF] p-6 flex flex-col min-h-screen">
              {/* Brand */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-2xl">
                    🛡️
                  </div>
                  <div>
                    <h1 className="text-white font-bold text-lg">NexSkill</h1>
                    <p className="text-[#B8C9FF] text-xs">Admin Console</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-full transition-all ${
                      isActive(item.path)
                        ? 'bg-white text-[#304DB5] shadow-md'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-semibold">{item.label}</span>
                  </Link>
                ))}
              </nav>

              {/* Admin Profile */}
              <div className="mt-8 pt-6 border-t border-white/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                    AD
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Admin User</p>
                    <p className="text-[#B8C9FF] text-xs">Platform Admin</p>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAppLayout;
