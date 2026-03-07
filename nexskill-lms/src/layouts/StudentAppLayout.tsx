import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import GlobalTopBarControls from "../components/system/GlobalTopBarControls";
import BrandLogo from "../components/brand/BrandLogo";
import { LogOut, Menu, X } from "lucide-react";

interface StudentAppLayoutProps {
  children: React.ReactNode;
}

const StudentAppLayout: React.FC<StudentAppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    sessionStorage.clear();
    navigate("/login");
  };

  const navItems = [
    { path: "/student/dashboard", label: "Dashboard", icon: "📊" },
    { path: "/student/courses", label: "My Courses", icon: "📚" },
    { path: "/student/messages", label: "Messages", icon: "✉️" },
    { path: "/student/community", label: "Community", icon: "💬" },
    { path: "/student/coaching", label: "Coaching", icon: "👨‍🏫" },
    { path: "/student/ai-coach", label: "AI Coach", icon: "🤖" },
    { path: "/student/live-classes", label: "Live Classes", icon: "🎥" },
    { path: "/student/certificates", label: "Certificates", icon: "🏆" },
    { path: "/student/membership", label: "Membership", icon: "💎" },
    { path: "/student/profile", label: "Profile", icon: "👤" },
    { path: "/student/settings", label: "Settings", icon: "⚙️" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="h-screen flex bg-[color:var(--bg-primary)] transition-colors overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[260px] flex-shrink-0 flex flex-col bg-[color:var(--color-bg-sidebar)] border-r border-[color:var(--border-base)] transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <Link to="/student/dashboard" className="flex items-center gap-3">
              <BrandLogo size="md" showText={false} />
              <div>
                <span className="text-xl font-bold text-gradient block leading-tight">
                  NexSkill
                </span>
                <span className="text-xs text-[color:var(--text-secondary)]">
                  Student Portal
                </span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-lg text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-glass-hover)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-hidden px-4 py-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                isActive(item.path)
                  ? "bg-gradient-to-r from-[color:var(--color-brand-neon)] to-[color:var(--color-brand-electric)] text-white font-medium shadow-md"
                  : "text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-glass-hover)] hover:text-[color:var(--color-brand-electric)]"
              }`}
            >
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-[color:var(--border-base)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
              S
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[color:var(--text-primary)] truncate">
                Student User
              </p>
              <p className="text-xs text-[color:var(--text-secondary)]">
                Premium
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 border-b border-[color:var(--border-base)] bg-[color:var(--bg-secondary)]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-glass-hover)]"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <GlobalTopBarControls />
        </header>

        <main className="flex-1 overflow-auto scrollbar-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default StudentAppLayout;
