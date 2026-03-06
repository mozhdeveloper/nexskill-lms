import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import GlobalTopBarControls from "../components/system/GlobalTopBarControls";
import BrandLogo from "../components/brand/BrandLogo";
import { LogOut } from "lucide-react";

interface CoachAppLayoutProps {
    children: React.ReactNode;
}

const CoachAppLayout: React.FC<CoachAppLayoutProps> = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        // Clear any auth tokens/session here
        localStorage.removeItem("authToken");
        sessionStorage.clear();
        navigate("/login");
    };

    const navItems = [
        { path: "/coach/dashboard", label: "Dashboard" },
        { path: "/coach/courses", label: "Courses" },
        { path: "/coach/ai-tools", label: "AI Tools" },
        { path: "/coach/quizzes", label: "Quizzes & Assessments" },
        { path: "/coach/coaching-tools", label: "Coaching Tools" },
        { path: "/coach/students", label: "Students" },
        { path: "/coach/subcoach-management", label: "Sub-Coaches" },
        { path: "/coach/earnings", label: "Earnings" },
        { path: "/coach/messages", label: "Messages" },
        { path: "/coach/profile", label: "Profile" },
        { path: "/coach/settings", label: "Settings" },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="min-h-screen bg-[color:var(--bg-primary)] p-8 transition-colors">
            <div
                className="max-w-[1440px] mx-auto bg-[color:var(--bg-secondary)] dark:bg-[color:var(--bg-secondary)] rounded-[32px] shadow-card overflow-hidden flex transition-colors border border-[color:var(--border-base)]"
                style={{ minHeight: "calc(100vh - 64px)" }}
            >
                {/* Left Sidebar */}
                <aside className="w-[240px] flex-shrink-0 flex flex-col p-6 border-r border-[color:var(--border-base)]">
                    {/* Logo */}
                    <div className="mb-8">
                        <Link
                            to="/coach/dashboard"
                            className="flex items-center gap-3"
                        >
                            <BrandLogo size="md" showText={false} />
                            <div>
                                <span className="text-xl font-bold text-gradient block leading-tight">
                                    NexSkill
                                </span>
                                <span className="text-xs text-[color:var(--text-secondary)]">
                                    Coach Portal
                                </span>
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
                                        ? "bg-gradient-to-r from-[color:var(--color-brand-neon)] to-[color:var(--color-brand-electric)] text-[color:var(--text-on-neon)] font-medium shadow-md"
                                        : "text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-glass-hover)] hover:text-[color:var(--color-brand-electric)]"
                                    }`}
                            >
                                <span className="text-sm">{item.label}</span>
                            </Link>
                        ))}
                    </nav>

                    {/* Coach Profile */}
                    <div className="pt-6 mt-6 border-t border-[color:var(--border-base)]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[color:var(--color-brand-neon)] to-[color:var(--color-brand-electric)] flex items-center justify-center text-white font-semibold shadow-lg">
                                C
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[color:var(--text-primary)] truncate">
                                    Coach User
                                </p>
                                <p className="text-xs text-[color:var(--text-secondary)]">
                                    Instructor
                                </p>
                            </div>
                        </div>
                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="mt-4 w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="text-sm font-medium">Logout</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col overflow-hidden bg-[color:var(--bg-primary)]">
                    {/* Top Bar with Global Controls */}
                    <div className="flex items-center justify-end px-8 pt-6 pb-4 border-b border-[color:var(--border-base)]">
                        <GlobalTopBarControls />
                    </div>

                    <div className="flex-1 overflow-auto">{children}</div>
                </main>
            </div>
        </div>
    );
};

export default CoachAppLayout;
