import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import GlobalTopBarControls from '../components/system/GlobalTopBarControls';
import BrandLogo from '../components/brand/BrandLogo';
import { LogOut, Menu, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface SupportStaffAppLayoutProps {
  children: React.ReactNode;
}

const SupportStaffAppLayout: React.FC<SupportStaffAppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('authToken');
    sessionStorage.clear();
    navigate('/login');
  };

  const navItems = [
    { path: '/support/dashboard', label: 'Dashboard' },
    { path: '/support/tickets', label: 'Tickets' },
    { path: '/support/students', label: 'Students' },
    { path: '/support/tech-status', label: 'Tech Status' },
    { path: '/support/certificates', label: 'Certificates' },
    { path: '/support/knowledge-base', label: 'Knowledge Base' },
    { path: '/support/profile', label: 'Profile' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="h-screen flex bg-[color:var(--bg-primary)] transition-colors overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[260px] flex-shrink-0 flex flex-col bg-[color:var(--color-bg-sidebar)] border-r border-[color:var(--border-base)] transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <Link to="/support/dashboard" className="flex items-center gap-3">
              <BrandLogo size="md" showText={false} />
              <div>
                <span className="text-xl font-bold text-gradient block leading-tight">NexSkill</span>
                <span className="text-xs text-[color:var(--text-secondary)]">Support Staff</span>
              </div>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-lg text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-glass-hover)]">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-hidden px-4 py-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${isActive(item.path)
                  ? 'bg-gradient-to-r from-[color:var(--color-brand-neon)] to-[color:var(--color-brand-electric)] text-white font-medium shadow-md'
                  : 'text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-glass-hover)] hover:text-[color:var(--color-brand-electric)]'
                }`}
            >
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Quick Stats */}
        <div className="mx-4 mb-2 p-3 glass-card rounded-xl">
          <p className="text-xs font-semibold text-[color:var(--text-primary)] mb-2">Open Tickets</p>
          <div className="space-y-1.5 mb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[color:var(--text-secondary)]">Urgent</span>
              <span className="px-2 py-0.5 bg-red-500/15 text-red-400 text-xs font-bold rounded-full">3</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[color:var(--text-secondary)]">High Priority</span>
              <span className="px-2 py-0.5 bg-orange-500/15 text-orange-400 text-xs font-bold rounded-full">8</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[color:var(--text-secondary)]">Normal</span>
              <span className="px-2 py-0.5 bg-blue-500/15 text-blue-400 text-xs font-bold rounded-full">13</span>
            </div>
          </div>
          <div className="pt-2 border-t border-[color:var(--border-base)]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[color:var(--text-secondary)]">Avg Response</span>
              <span className="font-bold text-[color:var(--text-primary)]">2.4h</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[color:var(--border-base)]">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 border-b border-[color:var(--border-base)] bg-[color:var(--bg-secondary)]">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-glass-hover)]">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <GlobalTopBarControls />
        </header>

        <main className="flex-1 flex flex-col overflow-auto scrollbar-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default SupportStaffAppLayout;

