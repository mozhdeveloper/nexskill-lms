import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, FileText, CheckCheck, X, BookOpen, RefreshCw } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { supabase } from '../../lib/supabaseClient';

interface AdminNotification {
  id: string;
  type: 'new_course' | 'course_update';
  courseId: string;
  courseTitle: string;
  coachId: string;
  coachName: string;
  timestamp: string;
  read: boolean;
  actionUrl: string;
}

const NotificationBellAdmin: React.FC = () => {
  const { profile } = useUser();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  
  const isAdmin = profile?.role?.toUpperCase() === 'ADMIN';

  const fetchNotifications = useCallback(async () => {
    if (!isAdmin) return;

    try {
      const { data, error } = await supabase.rpc('get_admin_notifications');

      if (error) throw error;

      const mapped: AdminNotification[] = (data || []).map((n: any) => ({
        id: n.notif_id,
        type: n.notif_type as 'new_course' | 'course_update',
        courseId: n.course_id,
        courseTitle: n.course_title,
        coachId: n.coach_id,
        coachName: n.coach_name,
        timestamp: new Date(n.created_at).toLocaleString(),
        read: n.is_read,
        actionUrl: `/admin/courses/review/${n.course_id}`
      }));

      setNotifications(mapped);
    } catch (err) {
      console.error('🔔 Admin Notification fetch error:', err);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchNotifications();
      
      // Listen for changes in admin_notifications table
      const adminNotifChannel = supabase
        .channel('admin-notifications-realtime')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'admin_notifications' }, 
            () => fetchNotifications()
        )
        .subscribe();

      return () => { 
        supabase.removeChannel(adminNotifChannel);
      };
    }
  }, [isAdmin, fetchNotifications]);

  const markAsRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.rpc('mark_admin_notification_read', {
        p_notif_id: id
      });
      if (error) throw error;
      setNotifications(prev => prev.map(item => item.id === id ? { ...item, read: true } : item));
    } catch (err) { console.error('Error marking as read:', err); }
  };

  const removeNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.rpc('clear_admin_notification', {
        p_notif_id: id
      });
      if (error) throw error;
      setNotifications(prev => prev.filter(item => item.id !== id));
    } catch (err) { console.error('Error removing notification:', err); }
  };

  const markAllAsRead = async () => {
    if (notifications.length === 0) return;
    try {
      const { error } = await supabase.rpc('mark_all_admin_notifications_read');
      if (error) throw error;
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) { console.error('Error marking all as read:', err); }
  };

  const clearAll = async () => {
    if (notifications.length === 0 || !window.confirm("Clear all notifications?")) return;
    try {
      const { error } = await supabase.rpc('clear_all_admin_notifications');
      if (error) throw error;
      setNotifications([]);
    } catch (err) { console.error('Error clearing all:', err); }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickOut = (e: MouseEvent) => { 
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false); 
    };
    document.addEventListener('mousedown', clickOut);
    return () => document.removeEventListener('mousedown', clickOut);
  }, []);

  if (!isAdmin) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors">
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <h3 className="font-semibold text-slate-900 text-sm">Admin Notifications ({notifications.length})</h3>
            <div className="flex gap-2">
              {notifications.length > 0 && (
                <>
                  <button onClick={markAllAsRead} className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 flex items-center gap-1 transition-colors">
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                  <button onClick={clearAll} className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 flex items-center gap-1 transition-colors">
                     Clear all
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map(n => (
                <div key={n.id} onClick={() => { navigate(n.actionUrl); setIsOpen(false); }} className={`px-4 py-4 border-b border-slate-100 hover:bg-slate-50 transition-all cursor-pointer relative group ${!n.read ? 'bg-orange-50/50' : ''}`}>
                  <button 
                    onClick={(e) => removeNotification(e, n.id)}
                    className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all z-20"
                    title="Remove notification"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      n.type === 'new_course' ? 'bg-blue-100' : 'bg-purple-100'
                    }`}>
                      {n.type === 'new_course' ? <BookOpen className="w-5 h-5 text-blue-600" /> : <RefreshCw className="w-5 h-5 text-purple-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 pr-4">
                        <p className={`text-sm leading-tight mb-1 ${!n.read ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                          {n.type === 'new_course' ? 'New Course Approval' : 'Course Content Update'}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        <span className="font-semibold text-slate-700">{n.courseTitle}</span>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Coach: {n.coachName}
                      </p>
                      <div className='flex content-between my-1'>
                        <span className="text-[10px] text-slate-400 mt-1 block uppercase font-medium">{n.timestamp}</span>
                         <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                          {!n.read && (
                            <button 
                              onClick={(e) => markAsRead(e, n.id)}
                              className=" p-1 px-2 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors z-10 text-[10px] font-bold"
                              title="Mark as read"
                            >
                              Mark as read
                            </button>
                          )}
                          {!n.read && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse" />}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" /> No admin notifications
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBellAdmin;
