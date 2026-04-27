import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import BrandLogo from "../components/brand/BrandLogo";
import { LogOut, Menu, X, ChevronDown, User, Settings, CreditCard, HelpCircle, Heart, ShoppingCart } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import NotificationBellStudent from "../components/system/NotificationBellStudent";

interface StudentAppLayoutProps {
  children: React.ReactNode;
  customHeader?: React.ReactNode;
  hideSearch?: boolean;
}

const StudentAppLayout: React.FC<StudentAppLayoutProps> = ({ 
  children, 
  customHeader, 
  hideSearch = false 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState("Student User");
  const [userInitial, setUserInitial] = useState("S");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

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
          const name = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Student User";
          setUserName(name);
          setUserInitial((profile.first_name?.[0] || "S").toUpperCase());
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

  // Categories for the second bar
  const categories = [
    { path: "/student/courses?category=development", label: "Development" },
    { path: "/student/courses?category=business", label: "Business" },
    { path: "/student/courses?category=finance", label: "Finance & Accounting" },
    { path: "/student/courses?category=it-software", label: "IT & Software" },
    { path: "/student/courses?category=productivity", label: "Office Productivity" },
    { path: "/student/courses?category=personal-dev", label: "Personal Development" },
    { path: "/student/courses?category=design", label: "Design" },
    { path: "/student/courses?category=marketing", label: "Marketing" },
    { path: "/student/courses?category=health-fitness", label: "Health & Fitness" },
    { path: "/student/courses?category=music", label: "Music" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 border-b border-gray-200 bg-white flex-shrink-0">
        {/* Left: Logo + Custom Header (if provided) */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <Link to="/student" className="flex items-center gap-2">
            <BrandLogo size="md" showText={false} />
            <span className="text-xl font-bold text-gray-900 hidden sm:block">NexSkill</span>
          </Link>
          {/* Custom Header positioned right after logo */}
          {customHeader && (
            <div className="ml-4 border-l border-gray-300 pl-4">
              {customHeader}
            </div>
          )}
        </div>

        {/* Center: Search (only shown when no custom header and hideSearch is false) */}
        {!customHeader && !hideSearch && (
          <div className="flex-1 max-w-3xl mx-4 flex items-center gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search for anything"
                className="w-full px-4 py-2.5 pl-12 rounded-full bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        )}

        {/* Spacer to push right content when custom header is shown */}
        {(customHeader || hideSearch) && <div className="flex-1" />}

        {/* Right: Actions + Profile */}
        <div className="flex items-center gap-1">
          <Link
            to="/student/my-courses"
            className="px-5 py-2.5  text-black text-sm font-semibold rounded-lg hover:bg-[#23c363] hover:text-white transition-all whitespace-nowrap"
          >
            My Courses
          </Link>
          
          
          <NotificationBellStudent />

          <button className="hidden sm:flex p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
            <Heart className="w-5 h-5" />
          </button>

          
          
          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-sm font-semibold">
                {userInitial}
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${profileMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            {profileMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  {/* User Info */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center text-white text-lg font-bold">
                        {userInitial}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{userName}</p>
                        <p className="text-xs text-gray-500">Student</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2">
                    <Link
                      to="/student/profile"
                      onClick={() => { setProfileMenuOpen(false); }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-all"
                    >
                      <User className="w-4 h-4" />
                      <span className="text-sm">Profile</span>
                    </Link>
                    <Link
                      to="/student/membership"
                      onClick={() => { setProfileMenuOpen(false); }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-all"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span className="text-sm">Membership</span>
                    </Link>
                    <Link
                      to="/student/settings"
                      onClick={() => { setProfileMenuOpen(false); }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-all"
                    >
                      <Settings className="w-4 h-4" />
                      <span className="text-sm">Settings</span>
                    </Link>
                  </div>

                  {/* Logout */}
                  <div className="p-2 border-t border-gray-200">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <main className="flex-1 overflow-auto scrollbar-hidden bg-white">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed lg:hidden inset-y-0 left-0 z-50 w-[280px] flex-shrink-0 flex flex-col bg-white border-r border-gray-200 transform transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <Link to="/student" className="flex items-center gap-3">
              <BrandLogo size="md" showText={false} />
              <span className="text-xl font-bold text-gray-900">NexSkill</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-hidden px-4 py-4 space-y-1">
          <Link
            to="/student/my-courses"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isActive("/student/my-courses")
                ? "bg-purple-100 text-purple-700 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span className="text-xl">📚</span>
            <span className="text-sm font-medium">My Courses</span>
          </Link>
          
          <Link
            to="/student/community"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isActive("/student/community")
                ? "bg-purple-100 text-purple-700 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span className="text-xl">💬</span>
            <span className="text-sm font-medium">Community</span>
          </Link>

          <Link
            to="/student/coaching"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isActive("/student/coaching")
                ? "bg-purple-100 text-purple-700 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span className="texttext-xl">👨‍</span>
            <span className="text-sm font-medium">Coaching</span>
          </Link>

          <Link
            to="/student/ai-coach"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isActive("/student/ai-coach")
                ? "bg-purple-100 text-purple-700 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span className="text-xl">🤖</span>
            <span className="text-sm font-medium">AI Coach</span>
          </Link>

          <Link
            to="/student/live-classes"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isActive("/student/live-classes")
                ? "bg-purple-100 text-purple-700 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span className="text-xl">🎥</span>
            <span className="text-sm font-medium">Live Classes</span>
          </Link>

          <Link
            to="/student/certificates"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isActive("/student/certificates")
                ? "bg-purple-100 text-purple-700 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span className="text-xl">🏆</span>
            <span className="text-sm font-medium">Certificates</span>
          </Link>

          <div className="pt-4 mt-4 border-t border-gray-200">
            <Link
              to="/student/profile"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100 transition-all"
            >
              <User className="w-5 h-5" />
              <span className="text-sm font-medium">Profile</span>
            </Link>
            <Link
              to="/student/membership"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100 transition-all"
            >
              <CreditCard className="w-5 h-5" />
              <span className="text-sm font-medium">Membership</span>
            </Link>
            <Link
              to="/student/settings"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100 transition-all"
            >
              <Settings className="w-5 h-5" />
              <span className="text-sm font-medium">Settings</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all mt-2"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </nav>
      </aside>
    </div>
  );
};

export default StudentAppLayout;