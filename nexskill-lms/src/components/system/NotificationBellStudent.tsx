import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, FileText, Trash2, CheckCheck, Check, X, Award, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface Notification {
  id: string;
  quizId: string; // Added quizId
  type: 'quiz_result';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  status: string;
  actionUrl: string;
}

const NotificationBellStudent: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (uid: string) => {
    try {
      const { data, error } = await supabase.rpc('get_student_quiz_notifications', {
        p_student_id: uid
      });

      if (error) throw error;

      const mapped: Notification[] = (data || []).map((n: any) => {
        let title = 'Quiz Result';
        let message = '';
        
        if (n.status === 'passed') {
          title = '🎉 Quiz Passed!';
          message = `Congratulations! You passed "${n.quiz_title}" in ${n.course_title}.`;
        } else if (n.status === 'failed') {
          title = '❌ Quiz Not Passed';
          message = `You didn't pass "${n.quiz_title}" in ${n.course_title}. Keep trying!`;
        } else if (n.status === 'resubmission_required') {
          title = '📝 Resubmission Required';
          message = `Your coach requested a resubmission for "${n.quiz_title}" in ${n.course_title}.`;
        }

        return {
          id: n.submission_id,
          quizId: n.quiz_id, // Use the real quiz_id from DB
          type: 'quiz_result',
          title,
          message,
          timestamp: new Date(n.reviewed_at).toLocaleString(),
          read: n.is_read,
          status: n.status,
          actionUrl: `/student/courses/${n.course_id}/quizzes/${n.quiz_id}/feedback`
        };
      });

      setNotifications(mapped);
    } catch (err) {
      console.error('🔔 Student notification fetch error:', err);
    }
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchNotifications(user.id);

        const channel = supabase
          .channel('student-notifs')
          .on('postgres_changes', { 
            event: '*', // Listen for all events (INSERT/UPDATE)
            schema: 'public', 
            table: 'quiz_submissions',
            filter: `user_id=eq.${user.id}`
          }, () => {
            console.log('🔄 Student notification update detected');
            fetchNotifications(user.id);
          })
          .subscribe();

        return () => { supabase.removeChannel(channel); };
      }
    };
    getUser();
  }, [fetchNotifications]);

  const markAsRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.from('quiz_submissions').update({ student_read_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) { console.error('Error marking as read:', err); }
  };

  const removeNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.from('quiz_submissions').update({ student_cleared_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) { console.error('Error removing notification:', err); }
  };

  const markAllAsRead = async () => {
    if (!userId || notifications.length === 0) return;
    try {
      const { error } = await supabase.rpc('mark_all_student_quiz_notifications_read', {
        p_student_id: userId
      });
      if (error) throw error;
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) { console.error('Error marking all as read:', err); }
  };

  const clearAll = async () => {
    if (notifications.length === 0 || !window.confirm("Clear all notifications?")) return;
    try {
      const ids = notifications.map(n => n.id);
      const { error } = await supabase.from('quiz_submissions').update({ student_cleared_at: new Date().toISOString() }).in('id', ids);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <Award className="w-5 h-5 text-green-600" />;
      case 'failed': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'resubmission_required': return <RefreshCw className="w-5 h-5 text-orange-600" />;
      default: return <FileText className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-100';
      case 'failed': return 'bg-red-100';
      case 'resubmission_required': return 'bg-orange-100';
      default: return 'bg-blue-100';
    }
  };

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
                  <button onClick={clearAll} className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded hover:bg-red-100 flex items-center gap-1 transition-colors">
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map(n => (
                <div key={n.id} onClick={() => { navigate(n.actionUrl); setIsOpen(false); }} className={`px-4 py-4 border-b border-slate-100 hover:bg-slate-50 transition-all cursor-pointer relative group ${!n.read ? 'bg-blue-50/30' : ''}`}>
                  <button 
                    onClick={(e) => removeNotification(e, n.id)}
                    className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all z-20"
                    title="Remove notification"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-xl ${getStatusBg(n.status)} flex items-center justify-center flex-shrink-0`}>
                      {getStatusIcon(n.status)}
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
                              onClick={(e) => markAsRead(e, n.id)}
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

export default NotificationBellStudent;
