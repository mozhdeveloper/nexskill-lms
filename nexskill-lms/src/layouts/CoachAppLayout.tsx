import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import GlobalTopBarControls from "../components/system/GlobalTopBarControls";
import BrandLogo from "../components/brand/BrandLogo";
import { 
    LogOut, Menu, X, ChevronLeft, ChevronRight, GraduationCap,
    LayoutDashboard, BookOpen, Sparkles, ClipboardList, Users,
    UserPlus, DollarSign, MessageSquare, User, Settings, Crown
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

interface CoachAppLayoutProps {
    children: React.ReactNode;
}

const CoachAppLayout: React.FC<CoachAppLayoutProps> = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [isHovered, setIsHovered] = useState(false);
    const [userName, setUserName] = useState("Coach User");
    const [userInitial, setUserInitial] = useState("C");

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("first_name, last_name")
                    .eq("id", user.id)
                    .single();
                if (profile) {
                    const name = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Coach User";
                    setUserName(name);
                    setUserInitial((profile.first_name?.[0] || "C").toUpperCase());
                }
            }
        };
        fetchUser();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        localStorage.removeItem("authToken");
        sessionStorage.clear();
        navigate("/login");
    };

    const handleMouseEnter = () => {
        if (isCollapsed) {
            setIsHovered(true);
        }
    };

    const handleMouseLeave = () => {
        if (isCollapsed) {
            setIsHovered(false);
        }
    };

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    const navItems = [
        { path: "/coach/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { path: "/coach/courses", label: "Courses", icon: BookOpen },
        { path: "/coach/ai-tools", label: "AI Tools", icon: Sparkles },
        { path: "/coach/quizzes", label: "Quizzes & Assessments", icon: ClipboardList },
        { path: "/coach/coaching-tools", label: "Coaching Tools", icon: Users },
        { path: "/coach/students", label: "Students", icon: UserPlus },
        { path: "/coach/subcoach-management", label: "Sub-Coaches", comingSoon: true, icon: Users },
        { path: "/coach/earnings", label: "Earnings", icon: DollarSign },
        { path: "/coach/messages", label: "Messages", icon: MessageSquare },
        { path: "/coach/profile", label: "Profile", icon: User },
        { path: "/coach/settings", label: "Settings", icon: Settings },
    ];

    const isActive = (path: string) => location.pathname === path;

    // Determine if sidebar should be expanded (clicked or hovered)
    const isExpanded = !isCollapsed || isHovered;

    return (
        <div className="h-screen flex bg-[color:var(--bg-primary)] transition-colors overflow-hidden">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Left Sidebar - Desktop */}
            <aside
                className={`hidden lg:flex fixed lg:static inset-y-0 left-0 z-50 flex-shrink-0 flex-col bg-[color:var(--color-bg-sidebar)] border-r border-[color:var(--border-base)] transition-all duration-300 ease-in-out ${
                    isExpanded ? "w-[260px]" : "w-[70px]"
                }`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {/* Logo & Toggle */}
                <div className="p-6 pb-2">
                    <div className="flex items-center justify-between">
                        <Link to="/coach/dashboard" className="flex items-center gap-3">
                            <BrandLogo size="md" showText={false} />
                            <div className={`transition-opacity duration-200 ${isExpanded ? "opacity-100" : "opacity-0 hidden"}`}>
                                <span className="text-xl font-bold text-gradient block leading-tight">
                                    NexSkill
                                </span>
                                <span className="text-xs text-[color:var(--text-secondary)]">
                                    Coach Portal
                                </span>
                            </div>
                        </Link>
                        {/* Collapse Toggle Button */}
                        <button
                            onClick={toggleSidebar}
                            className={`p-1.5 rounded-lg text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-glass-hover)] transition-colors ${
                                isExpanded ? "opacity-100" : "opacity-0 hidden"
                            }`}
                            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto scrollbar-hidden px-4 py-2 space-y-1">
                    {navItems.map((item) => {
                        const IconComponent = item.icon;
                        return item.comingSoon ? (
                            <div
                                key={item.path}
                                className={`group relative flex items-center gap-3 px-2 py-2.5 rounded-xl text-gray-400 dark:text-gray-500 cursor-not-allowed transition-opacity duration-200 ${
                                    isExpanded ? "opacity-100" : "opacity-100"
                                }`}
                                title="Coming Soon - This feature is under development"
                            >
                                {IconComponent && <IconComponent className="w-5 h-5 flex-shrink-0 text-gray-400" />}
                                <span className={`text-sm transition-opacity duration-200 ${isExpanded ? "opacity-100" : "opacity-0 hidden"}`}>{item.label}</span>
                                <span className={`ml-auto px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded-full font-medium transition-opacity duration-200 ${
                                    isExpanded ? "opacity-100" : "opacity-0 hidden"
                                }`}>
                                    Soon
                                </span>
                            </div>
                        ) : (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-2 py-2.5 rounded-xl transition-all ${
                                    isActive(item.path)
                                        ? "bg-gradient-to-r from-[color:var(--color-brand-neon)] to-[color:var(--color-brand-electric)] text-white font-medium shadow-md"
                                        : "text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-glass-hover)] hover:text-[color:var(--color-brand-electric)]"
                                } ${isExpanded ? "opacity-100" : "opacity-100"}`}
                            >
                                {IconComponent && <IconComponent className="w-5 h-5 flex-shrink-0" />}
                                <span className={`text-sm transition-opacity duration-200 ${isExpanded ? "opacity-100" : "opacity-0 hidden"}`}>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Coach Profile */}
                <div className={`p-4 border-t border-[color:var(--border-base)] transition-opacity duration-200 ${
                    isExpanded ? "opacity-100" : "opacity-0 hidden"
                }`}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[color:var(--color-brand-neon)] to-[color:var(--color-brand-electric)] flex items-center justify-center text-white text-sm font-semibold shadow-lg">
                            {userInitial}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[color:var(--text-primary)] truncate">
                                {userName}
                            </p>
                            <p className="text-xs text-[color:var(--text-secondary)]">
                                Coach
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

            {/* Left Sidebar - Mobile */}
            <aside
                className={`fixed lg:hidden inset-y-0 left-0 z-50 w-[260px] flex-shrink-0 flex flex-col bg-[color:var(--color-bg-sidebar)] border-r border-[color:var(--border-base)] transform transition-transform duration-200 ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                {/* Logo */}
                <div className="p-6 pb-2">
                    <div className="flex items-center justify-between">
                        <Link to="/coach/dashboard" className="flex items-center gap-3">
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
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-1 rounded-lg text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-glass-hover)]"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto scrollbar-hidden px-4 py-2 space-y-1">
                    {navItems.map((item) => {
                        const IconComponent = item.icon;
                        return item.comingSoon ? (
                            <div
                                key={item.path}
                                className="group relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60"
                                title="Coming Soon - This feature is under development"
                            >
                                {IconComponent && <IconComponent className="w-5 h-5" />}
                                <span className="text-sm">{item.label}</span>
                                <span className="ml-auto px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded-full font-medium">
                                    Soon
                                </span>
                            </div>
                        ) : (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                                    isActive(item.path)
                                        ? "bg-gradient-to-r from-[color:var(--color-brand-neon)] to-[color:var(--color-brand-electric)] text-white font-medium shadow-md"
                                        : "text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-glass-hover)] hover:text-[color:var(--color-brand-electric)] "
                                }`}
                            >
                                {IconComponent && <IconComponent className="w-5 h-5" />}
                                <span className="text-sm">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Coach Profile */}
                <div className="p-4 border-t border-[color:var(--border-base)]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[color:var(--color-brand-neon)] to-[color:var(--color-brand-electric)] flex items-center justify-center text-white text-sm font-semibold shadow-lg">
                            {userInitial}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[color:var(--text-primary)] truncate">
                                {userName}
                            </p>
                            <p className="text-xs text-[color:var(--text-secondary)]">
                                Coach
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
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2 rounded-lg text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-glass-hover)]"
                        aria-label="Open menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="flex-1" />
                    <GlobalTopBarControls />
                </header>

                <main className="flex-1 overflow-auto scrollbar-hidden bg-[color:var(--bg-primary)]">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default CoachAppLayout;
