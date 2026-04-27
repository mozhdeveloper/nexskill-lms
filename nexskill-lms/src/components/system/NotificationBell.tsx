import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, FileText, Trash2, CheckCheck, Check, X, UserPlus, UserMinus } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { supabase } from '../../lib/supabaseClient';

interface Notification {
  id: string;
  type: 'quiz_review' | 'enrollment' | 'student_left';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl: string;
}

const NotificationBell: React.FC = () => {
  const { profile } = useUser();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const isCoach = profile?.role?.toUpperCase() === 'COACH';

  const fetchNotifications = useCallback(async () => {
    if (!isCoach || !profile?.id) return;

    try {
      const { data, error } = await supabase.rpc('get_coach_all_notifications', {
        p_coach_id: profile.id
      });

      if (error) throw error;

      const mapped: Notification[] = (data || []).map((n: any) => {
        let title = '';
        let message = '';
        let url = '';

        if (n.notif_type === 'quiz_review') {
          title = n.status === 'pending_review' ? 'New Submission' : 'Quiz Reviewed';
          message = `${n.student_name || 'Student'} submitted "${n.content_title}" in ${n.course_title}.`;
          url = `/coach/courses/${n.course_id}/quiz-reviews/${n.extra_id}`;
        } else if (n.notif_type === 'enrollment') {
          title = 'New Enrollment! 🎉';
          message = `${n.student_name || 'A student'} just enrolled in "${n.course_title}".`;
          url = `/coach/courses/${n.course_id}/students`;
        } else if (n.notif_type === 'student_left') {
          title = 'Student Left Course ⚠️';
          message = `${n.student_name || 'A student'} unenrolled from "${n.course_title}".`;
          url = `/coach/courses/${n.course_id}/students`;
        }

        return {
          id: n.notif_id,
          type: n.notif_type,
          title,
          message,
          timestamp: new Date(n.created_at).toLocaleString(),
          read: n.is_read,
          actionUrl: url
        };
      });

      setNotifications(mapped);
    } catch (err) {
      console.error('🔔 Notification fetch error:', err);
    }
  }, [isCoach, profile?.id]);

  useEffect(() => {
    if (isCoach && profile?.id) {
      fetchNotifications();
      
      const quizChannel = supabase
        .channel('coach-quiz-notifs')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_submissions' }, () => fetchNotifications())
        .subscribe();

      const enrollChannel = supabase
        .channel('coach-enroll-notifs')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'enrollments' }, () => fetchNotifications())
        .subscribe();
        
      const leaveChannel = supabase
        .channel('coach-leave-notifs')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'course_leaves' }, () => fetchNotifications())
        .subscribe();

      return () => { 
        supabase.removeChannel(quizChannel);
        supabase.removeChannel(enrollChannel);
        supabase.removeChannel(leaveChannel);
      };
    }
  }, [isCoach, profile?.id, fetchNotifications]);

  const getTableForType = (type: string) => {
    switch (type) {
      case 'quiz_review': return 'quiz_submissions';
      case 'enrollment': return 'enrollments';
      case 'student_left': return 'course_leaves';
      default: return 'quiz_submissions';
    }
  };

  const markAsRead = async (e: React.MouseEvent, n: Notification) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.rpc('mark_specific_coach_notification_read', {
        p_notif_id: n.id,
        p_notif_type: n.type
      });
      if (error) throw error;
      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
    } catch (err) { console.error('Error marking as read:', err); }
  };

  const removeNotification = async (e: React.MouseEvent, n: Notification) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.rpc('clear_specific_coach_notification', {
        p_notif_id: n.id,
        p_notif_type: n.type
      });
      if (error) throw error;
      setNotifications(prev => prev.filter(item => item.id !== n.id));
    } catch (err) { console.error('Error removing notification:', err); }
  };

  const markAllAsRead = async () => {
    if (!profile?.id || notifications.length === 0) return;
    try {
      const { error } = await supabase.rpc('mark_all_coach_notifications_read', {
        p_coach_id: profile.id
      });
      if (error) throw error;
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) { console.error('Error marking all as read:', err); }
  };

  const clearAll = async () => {
    if (!profile?.id || notifications.length === 0 || !window.confirm("Clear all notifications?")) return;
    try {
      const { error } = await supabase.rpc('clear_all_coach_notifications', {
        p_coach_id: profile.id
      });
      if (error) throw error;
      setNotifications([]);
    } catch (err) { console.error('Error clearing all:', err); }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickOut = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener('mousedown', clickOut);
    return () => document.removeEventListener('mousedown', clickOut);
  }, []);

  if (!isCoach) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors">
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <h3 className="font-semibold text-slate-900 text-sm">Notifications ({notifications.length})</h3>
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
                <div key={`${n.type}-${n.id}`} onClick={() => { navigate(n.actionUrl); setIsOpen(false); }} className={`px-4 py-4 border-b border-slate-100 hover:bg-slate-50 transition-all cursor-pointer relative group ${!n.read ? 'bg-blue-50/50' : ''}`}>
                  <button 
                    onClick={(e) => removeNotification(e, n)}
                    className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all z-20"
                    title="Remove notification"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      n.type === 'enrollment' ? 'bg-green-100' : 
                      n.type === 'student_left' ? 'bg-red-100' : 'bg-purple-100'
                    }`}>
                      {n.type === 'enrollment' ? <UserPlus className="w-5 h-5 text-green-600" /> : 
                       n.type === 'student_left' ? <UserMinus className="w-5 h-5 text-red-600" /> :
                       <FileText className="w-5 h-5 text-purple-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 pr-4">
                        <p className={`text-sm leading-tight mb-1 ${!n.read ? 'font-bold text-slate-900' : 'text-slate-600'}`}>{n.title}</p>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">{n.message}</p>
                      <div className='flex content-between my-1'>
                        <span className="text-[10px] text-slate-400 mt-1 block uppercase font-medium">{n.timestamp}</span>
                         <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                          {!n.read && (
                            <button 
                              onClick={(e) => markAsRead(e, n)}
                              className=" p-1 px-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors z-10 text-[10px] font-bold"
                              title="Mark as read"
                            >
                              Mark as read
                            </button>
                          )}
                          {!n.read && <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" /> No notifications
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
