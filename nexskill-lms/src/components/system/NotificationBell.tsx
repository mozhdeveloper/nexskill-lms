import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, X, Check, CheckCheck, User, BookOpen, Award, AlertCircle, MessageSquare, Settings, CreditCard, Users, FileText, Shield } from 'lucide-react';
// All icons used: Bell (main), X (close), Check (success), CheckCheck (mark all read), 
// User (coach_application), BookOpen (course), Award (achievement), AlertCircle (warning),
// MessageSquare (message), Settings (info default), CreditCard (payment), Users (student),
// FileText (grading), Shield (security)

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'coach_application' | 'message' | 'course' | 'achievement' | 'payment' | 'student' | 'grading' | 'security';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

type UserRole = 'student' | 'coach' | 'subcoach' | 'admin' | 'owner' | 'support' | 'community' | 'content' | 'org';

// Role-specific notifications
const notificationsByRole: Record<UserRole, Notification[]> = {
  student: [
    {
      id: 'stu-1',
      type: 'course',
      title: 'New Lesson Available',
      message: 'A new lesson "Advanced React Hooks" has been added to your enrolled course.',
      timestamp: '10 minutes ago',
      read: false,
    },
    {
      id: 'stu-2',
      type: 'achievement',
      title: 'Badge Earned! 🎉',
      message: 'Congratulations! You earned the "Quick Learner" badge for completing 5 lessons in one day.',
      timestamp: '2 hours ago',
      read: false,
    },
    {
      id: 'stu-3',
      type: 'message',
      title: 'Coach Replied',
      message: 'Your coach David Chen replied to your question about JavaScript closures.',
      timestamp: '3 hours ago',
      read: false,
    },
    {
      id: 'stu-4',
      type: 'grading',
      title: 'Assignment Graded',
      message: 'Your assignment "Build a Todo App" has been graded. You scored 95/100!',
      timestamp: '1 day ago',
      read: true,
    },
    {
      id: 'stu-5',
      type: 'info',
      title: 'Live Session Tomorrow',
      message: 'Reminder: Live Q&A session with your coach starts tomorrow at 3:00 PM.',
      timestamp: '1 day ago',
      read: true,
    },
  ],
  coach: [
    {
      id: 'coach-1',
      type: 'student',
      title: 'New Student Enrolled',
      message: '5 new students enrolled in your "JavaScript Mastery" course today.',
      timestamp: '30 minutes ago',
      read: false,
    },
    {
      id: 'coach-2',
      type: 'message',
      title: 'Student Question',
      message: 'Sarah Johnson asked a question about async/await in Lesson 12.',
      timestamp: '1 hour ago',
      read: false,
    },
    {
      id: 'coach-3',
      type: 'grading',
      title: 'Assignments Pending',
      message: 'You have 8 assignments waiting to be graded.',
      timestamp: '2 hours ago',
      read: false,
    },
    {
      id: 'coach-4',
      type: 'payment',
      title: 'Payment Received',
      message: 'You received $450 from course sales this week. View earnings.',
      timestamp: '1 day ago',
      read: true,
    },
    {
      id: 'coach-5',
      type: 'success',
      title: 'Course Approved',
      message: 'Your new course "TypeScript Advanced Patterns" has been approved and is now live.',
      timestamp: '2 days ago',
      read: true,
    },
  ],
  subcoach: [
    {
      id: 'sub-1',
      type: 'student',
      title: 'New Students Assigned',
      message: 'You have been assigned 3 new students for the "Web Development" course.',
      timestamp: '20 minutes ago',
      read: false,
    },
    {
      id: 'sub-2',
      type: 'grading',
      title: 'Grading Required',
      message: '5 assignments are waiting for your review in the grading queue.',
      timestamp: '1 hour ago',
      read: false,
    },
    {
      id: 'sub-3',
      type: 'message',
      title: 'Group Session Reminder',
      message: 'Your group tutoring session starts in 2 hours with 8 students.',
      timestamp: '2 hours ago',
      read: false,
    },
    {
      id: 'sub-4',
      type: 'info',
      title: 'New Guidelines',
      message: 'The head coach has shared updated grading guidelines. Please review.',
      timestamp: '1 day ago',
      read: true,
    },
  ],
  admin: [
    {
      id: 'admin-1',
      type: 'coach_application',
      title: 'New Coach Application',
      message: 'Alexandra Thompson has applied to become a coach. Review their credentials.',
      timestamp: '15 minutes ago',
      read: false,
    },
    {
      id: 'admin-2',
      type: 'warning',
      title: 'Content Flagged',
      message: 'A course lesson has been flagged for review by multiple users.',
      timestamp: '1 hour ago',
      read: false,
    },
    {
      id: 'admin-3',
      type: 'security',
      title: 'Suspicious Activity',
      message: 'Multiple failed login attempts detected for user account.',
      timestamp: '3 hours ago',
      read: false,
    },
    {
      id: 'admin-4',
      type: 'payment',
      title: 'Refund Request',
      message: 'New refund request from John Doe for "Data Science Bootcamp".',
      timestamp: '5 hours ago',
      read: true,
    },
    {
      id: 'admin-5',
      type: 'info',
      title: 'Weekly Report Ready',
      message: 'Platform analytics report for this week is ready to view.',
      timestamp: '1 day ago',
      read: true,
    },
  ],
  owner: [
    {
      id: 'owner-1',
      type: 'coach_application',
      title: 'Coach Applications Pending',
      message: '4 new coach applications are awaiting review and approval.',
      timestamp: '10 minutes ago',
      read: false,
    },
    {
      id: 'owner-2',
      type: 'payment',
      title: 'Revenue Milestone',
      message: 'Platform reached $100,000 in monthly revenue! View detailed report.',
      timestamp: '2 hours ago',
      read: false,
    },
    {
      id: 'owner-3',
      type: 'security',
      title: 'Security Audit Complete',
      message: 'Monthly security audit completed. No critical issues found.',
      timestamp: '1 day ago',
      read: false,
    },
    {
      id: 'owner-4',
      type: 'info',
      title: 'System Update Available',
      message: 'New platform version 2.5.0 is available with performance improvements.',
      timestamp: '2 days ago',
      read: true,
    },
    {
      id: 'owner-5',
      type: 'success',
      title: 'New Enterprise Client',
      message: 'TechCorp Inc. signed up for the Enterprise plan (200 seats).',
      timestamp: '3 days ago',
      read: true,
    },
  ],
  support: [
    {
      id: 'sup-1',
      type: 'warning',
      title: 'Urgent Ticket',
      message: 'New high-priority support ticket: "Cannot access my course materials".',
      timestamp: '5 minutes ago',
      read: false,
    },
    {
      id: 'sup-2',
      type: 'message',
      title: 'Ticket Escalated',
      message: 'Ticket #4521 has been escalated and requires immediate attention.',
      timestamp: '30 minutes ago',
      read: false,
    },
    {
      id: 'sup-3',
      type: 'info',
      title: 'Queue Update',
      message: 'You have 12 open tickets. Average response time: 2.4 hours.',
      timestamp: '1 hour ago',
      read: false,
    },
    {
      id: 'sup-4',
      type: 'success',
      title: 'Positive Feedback',
      message: 'You received a 5-star rating for resolving ticket #4498.',
      timestamp: '3 hours ago',
      read: true,
    },
  ],
  community: [
    {
      id: 'comm-1',
      type: 'warning',
      title: 'Content Reported',
      message: '3 new posts have been reported and need moderation review.',
      timestamp: '15 minutes ago',
      read: false,
    },
    {
      id: 'comm-2',
      type: 'student',
      title: 'New Discussion Trending',
      message: '"Best practices for React state management" is trending with 50+ replies.',
      timestamp: '1 hour ago',
      read: false,
    },
    {
      id: 'comm-3',
      type: 'info',
      title: 'Community Guidelines Updated',
      message: 'New community guidelines have been published. Review changes.',
      timestamp: '2 hours ago',
      read: false,
    },
    {
      id: 'comm-4',
      type: 'achievement',
      title: 'Engagement Milestone',
      message: 'Community reached 10,000 active members this month!',
      timestamp: '1 day ago',
      read: true,
    },
  ],
  content: [
    {
      id: 'cont-1',
      type: 'grading',
      title: 'Content Review Required',
      message: 'New course "Machine Learning Basics" is ready for content review.',
      timestamp: '20 minutes ago',
      read: false,
    },
    {
      id: 'cont-2',
      type: 'warning',
      title: 'Outdated Content',
      message: '5 lessons have been flagged as potentially outdated. Please review.',
      timestamp: '2 hours ago',
      read: false,
    },
    {
      id: 'cont-3',
      type: 'success',
      title: 'Translation Complete',
      message: 'Spanish translations for "JavaScript Fundamentals" are ready.',
      timestamp: '4 hours ago',
      read: false,
    },
    {
      id: 'cont-4',
      type: 'info',
      title: 'New Templates Available',
      message: '3 new lesson templates have been added to the library.',
      timestamp: '1 day ago',
      read: true,
    },
  ],
  org: [
    {
      id: 'org-1',
      type: 'student',
      title: 'New Team Members',
      message: '8 new employees have been added to your organization account.',
      timestamp: '30 minutes ago',
      read: false,
    },
    {
      id: 'org-2',
      type: 'achievement',
      title: 'Training Completion',
      message: '15 team members completed the "Cybersecurity Basics" course.',
      timestamp: '2 hours ago',
      read: false,
    },
    {
      id: 'org-3',
      type: 'payment',
      title: 'Invoice Ready',
      message: 'Your monthly invoice for December 2025 is ready. Amount: $2,850.',
      timestamp: '1 day ago',
      read: false,
    },
    {
      id: 'org-4',
      type: 'info',
      title: 'License Renewal',
      message: 'Your organization license renews in 30 days. Review your plan.',
      timestamp: '3 days ago',
      read: true,
    },
  ],
};

const NotificationBell: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  // Detect role from URL path
  const currentRole = useMemo((): UserRole => {
    const path = location.pathname;
    if (path.startsWith('/student')) return 'student';
    if (path.startsWith('/coach')) return 'coach';
    if (path.startsWith('/subcoach')) return 'subcoach';
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/owner')) return 'owner';
    if (path.startsWith('/support')) return 'support';
    if (path.startsWith('/community')) return 'community';
    if (path.startsWith('/content')) return 'content';
    if (path.startsWith('/org')) return 'org';
    return 'student'; // default
  }, [location.pathname]);

  const [notifications, setNotifications] = useState<Notification[]>(notificationsByRole[currentRole]);

  // Update notifications when role changes
  useEffect(() => {
    setNotifications(notificationsByRole[currentRole]);
  }, [currentRole]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = (notificationId: string) => {
    setNotifications(
      notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(notifications.filter((n) => n.id !== notificationId));
  };

  const clearAll = () => {
    setNotifications([]);
    setIsOpen(false);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'coach_application':
        return <User className="w-4 h-4 text-purple-600" />;
      case 'course':
        return <BookOpen className="w-4 h-4 text-blue-600" />;
      case 'achievement':
        return <Award className="w-4 h-4 text-yellow-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-green-600" />;
      case 'success':
        return <Check className="w-4 h-4 text-emerald-600" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-indigo-600" />;
      case 'student':
        return <Users className="w-4 h-4 text-cyan-600" />;
      case 'grading':
        return <FileText className="w-4 h-4 text-pink-600" />;
      case 'security':
        return <Shield className="w-4 h-4 text-red-600" />;
      case 'info':
      default:
        return <Settings className="w-4 h-4 text-slate-600" />;
    }
  };

  const getNotificationBg = (type: Notification['type']) => {
    switch (type) {
      case 'coach_application':
        return 'bg-purple-100';
      case 'course':
        return 'bg-blue-100';
      case 'achievement':
        return 'bg-yellow-100';
      case 'warning':
        return 'bg-orange-100';
      case 'message':
        return 'bg-green-100';
      case 'success':
        return 'bg-emerald-100';
      case 'payment':
        return 'bg-indigo-100';
      case 'student':
        return 'bg-cyan-100';
      case 'grading':
        return 'bg-pink-100';
      case 'security':
        return 'bg-red-100';
      case 'info':
      default:
        return 'bg-slate-100';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-slate-600 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-gray-700 overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-slate-500 dark:text-gray-400">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-medium text-[#304DB5] hover:text-[#2a44a0] dark:text-blue-400 flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-slate-100 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-750 transition-colors ${
                    !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-full ${getNotificationBg(notification.type)} flex items-center justify-center flex-shrink-0`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium ${!notification.read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-gray-300'}`}>
                          {notification.title}
                        </p>
                        <button
                          onClick={() => removeNotification(notification.id)}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-gray-600 rounded-lg transition-colors flex-shrink-0"
                        >
                          <X className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-slate-400 dark:text-gray-500">
                          {notification.timestamp}
                        </span>
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs font-medium text-[#304DB5] hover:text-[#2a44a0] dark:text-blue-400"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-gray-700 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500 dark:text-gray-400">No notifications</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-200 dark:border-gray-700 flex items-center justify-between">
              <button
                onClick={clearAll}
                className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                Clear all
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs font-medium text-[#304DB5] hover:text-[#2a44a0] dark:text-blue-400"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
