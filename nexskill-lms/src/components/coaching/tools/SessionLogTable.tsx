import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../context/AuthContext';

type SessionStatus = 'Completed' | 'Scheduled' | 'Cancelled' | 'Pending';

interface Session {
  id: string;
  studentName: string;
  bookingType: string;
  date: string;
  time: string;
  duration: number;
  status: SessionStatus;
  meetingLink?: string;
  notes?: string;
  amount: number;
}

// Map DB status → display status
const mapStatus = (dbStatus: string): SessionStatus => {
  switch (dbStatus) {
    case 'completed':  return 'Completed';
    case 'confirmed':  return 'Scheduled';
    case 'pending':    return 'Pending';
    case 'cancelled':  return 'Cancelled';
    default:           return 'Pending';
  }
};

const SessionLogTable: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coaching_bookings')
        .select(`
          id,
          session_date,
          session_time,
          duration_minutes,
          status,
          notes,
          meeting_link,
          amount,
          student:profiles!coaching_bookings_student_id_fkey(first_name, last_name)
        `)
        .eq('coach_id', user.id)
        .order('session_date', { ascending: false });

      if (error) throw error;

      const mapped: Session[] = (data ?? []).map((row: any) => ({
        id: row.id,
        studentName: row.student
          ? `${row.student.first_name ?? ''} ${row.student.last_name ?? ''}`.trim()
          : 'Unknown Student',
        bookingType: '1:1 Coaching Session',
        date: row.session_date,
        time: row.session_time,
        duration: row.duration_minutes,
        status: mapStatus(row.status),
        meetingLink: row.meeting_link ?? undefined,
        notes: row.notes ?? undefined,
        amount: row.amount ?? 0,
      }));
      setSessions(mapped);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      session.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.bookingType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || session.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-[#22C55E] text-white';
      case 'Scheduled': return 'bg-[#304DB5] text-white';
      case 'Pending':   return 'bg-[#F59E0B] text-white';
      case 'Cancelled': return 'bg-gray-400 text-white';
      default:          return 'bg-gray-300 text-gray-700';
    }
  };

  const copyMeetingLink = (link: string) => {
    navigator.clipboard.writeText(link);
  };

  const markComplete = async (sessionId: string) => {
    setActionLoading(sessionId);
    try {
      const { error } = await supabase
        .from('coaching_bookings')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', sessionId);
      if (error) throw error;
      setSessions(prev =>
        prev.map(s => s.id === sessionId ? { ...s, status: 'Completed' as SessionStatus } : s)
      );
      if (selectedSession?.id === sessionId) {
        setSelectedSession(prev => prev ? { ...prev, status: 'Completed' } : null);
      }
    } catch (err) {
      console.error('Error marking complete:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const saveNotes = async (sessionId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('coaching_bookings')
        .update({ notes, updated_at: new Date().toISOString() })
        .eq('id', sessionId);
      if (error) throw error;
      setSessions(prev =>
        prev.map(s => s.id === sessionId ? { ...s, notes } : s)
      );
      if (selectedSession?.id === sessionId) {
        setSelectedSession(prev => prev ? { ...prev, notes } : null);
      }
    } catch (err) {
      console.error('Error saving notes:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold text-[#111827]">Session Log</h3>
        <p className="text-sm text-[#5F6473] mt-1">
          View and manage all past and upcoming coaching sessions
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by student or booking type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5]"
        >
          <option value="All">All Statuses</option>
          <option value="Completed">Completed</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Pending">Pending</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="bg-white rounded-2xl border border-[#EDF0FB] p-12 text-center">
          <div className="w-8 h-8 border-4 border-[#304DB5] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[#5F6473]">Loading sessions...</p>
        </div>
      )}

      {/* Table - Desktop */}
      {!loading && (
        <div className="hidden md:block bg-white rounded-2xl border border-[#EDF0FB] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#F5F7FF]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">Duration</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[#5F6473] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDF0FB]">
              {filteredSessions.map((session) => (
                <tr
                  key={session.id}
                  className="hover:bg-[#F5F7FF] cursor-pointer"
                  onClick={() => setSelectedSession(session)}
                >
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-[#111827]">{session.studentName}</p>
                    <p className="text-xs text-[#9CA3B5]">{session.bookingType}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#111827]">{session.date}</p>
                    <p className="text-xs text-[#9CA3B5]">{session.time}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#5F6473]">{session.duration} min</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-[#111827]">₱{session.amount.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(session.status)}`}>
                      {session.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {session.meetingLink && (
                        <button
                          onClick={(e) => { e.stopPropagation(); copyMeetingLink(session.meetingLink!); }}
                          className="px-3 py-1 text-xs font-medium text-[#304DB5] hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          Copy Link
                        </button>
                      )}
                      {(session.status === 'Scheduled' || session.status === 'Pending') && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markComplete(session.id); }}
                          disabled={actionLoading === session.id}
                          className="px-3 py-1 text-xs font-medium text-[#22C55E] hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {actionLoading === session.id ? '...' : 'Mark Complete'}
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedSession(session); }}
                        className="px-3 py-1 text-xs font-medium text-[#5F6473] hover:bg-[#F5F7FF] rounded-lg transition-colors"
                      >
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cards - Mobile */}
      {!loading && (
        <div className="md:hidden space-y-4">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              onClick={() => setSelectedSession(session)}
              className="bg-white rounded-2xl border border-[#EDF0FB] p-4 hover:border-[#304DB5] transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-[#111827]">{session.studentName}</p>
                  <p className="text-sm text-[#5F6473]">{session.bookingType}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(session.status)}`}>
                  {session.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div>
                  <p className="text-[#9CA3B5] text-xs mb-1">Date</p>
                  <p className="text-[#111827]">{session.date}</p>
                </div>
                <div>
                  <p className="text-[#9CA3B5] text-xs mb-1">Time</p>
                  <p className="text-[#111827]">{session.time}</p>
                </div>
                <div>
                  <p className="text-[#9CA3B5] text-xs mb-1">Duration</p>
                  <p className="text-[#111827]">{session.duration} min</p>
                </div>
                <div>
                  <p className="text-[#9CA3B5] text-xs mb-1">Amount</p>
                  <p className="text-[#111827] font-medium">₱{session.amount.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-[#EDF0FB]">
                {session.meetingLink && (
                  <button
                    onClick={(e) => { e.stopPropagation(); copyMeetingLink(session.meetingLink!); }}
                    className="flex-1 px-3 py-2 text-xs font-medium text-[#304DB5] bg-blue-50 rounded-lg"
                  >
                    Copy Link
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedSession(session); }}
                  className="flex-1 px-3 py-2 text-xs font-medium text-[#5F6473] bg-[#F5F7FF] rounded-lg"
                >
                  Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredSessions.length === 0 && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-[#EDF0FB] p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-lg text-[#5F6473] mb-2">
            {sessions.length === 0 ? 'No sessions yet' : 'No sessions found'}
          </p>
          <p className="text-sm text-[#9CA3B5]">
            {sessions.length === 0
              ? 'Coaching session bookings made by students will appear here'
              : 'Try adjusting your search or filter criteria'}
          </p>
        </div>
      )}

      {/* Session Details Modal */}
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onMarkComplete={markComplete}
          onSaveNotes={saveNotes}
          actionLoading={actionLoading}
          getStatusColor={getStatusColor}
        />
      )}
    </div>
  );
};

// --- Detail Modal ---

interface SessionDetailModalProps {
  session: Session;
  onClose: () => void;
  onMarkComplete: (id: string) => void;
  onSaveNotes: (id: string, notes: string) => Promise<void>;
  actionLoading: string | null;
  getStatusColor: (status: string) => string;
}

const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  session,
  onClose,
  onMarkComplete,
  onSaveNotes,
  actionLoading,
  getStatusColor,
}) => {
  const [notesText, setNotesText] = useState(session.notes ?? '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  const copyMeetingLink = (link: string) => {
    navigator.clipboard.writeText(link);
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    await onSaveNotes(session.id, notesText);
    setSavingNotes(false);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-[#111827]">Session Details</h3>
            <p className="text-sm text-[#5F6473] mt-1">{session.studentName}</p>
          </div>
          <button onClick={onClose} className="text-[#5F6473] hover:text-[#111827]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#F5F7FF] rounded-xl p-4">
              <p className="text-xs text-[#9CA3B5] mb-1">Student</p>
              <p className="font-semibold text-[#111827]">{session.studentName}</p>
            </div>
            <div className="bg-[#F5F7FF] rounded-xl p-4">
              <p className="text-xs text-[#9CA3B5] mb-1">Booking Type</p>
              <p className="font-semibold text-[#111827]">{session.bookingType}</p>
            </div>
            <div className="bg-[#F5F7FF] rounded-xl p-4">
              <p className="text-xs text-[#9CA3B5] mb-1">Date & Time</p>
              <p className="font-semibold text-[#111827]">{session.date} at {session.time}</p>
            </div>
            <div className="bg-[#F5F7FF] rounded-xl p-4">
              <p className="text-xs text-[#9CA3B5] mb-1">Duration & Amount</p>
              <p className="font-semibold text-[#111827]">{session.duration} min · ₱{session.amount.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-[#F5F7FF] rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-[#9CA3B5] mb-1">Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(session.status)}`}>
                {session.status}
              </span>
            </div>
            {(session.status === 'Scheduled' || session.status === 'Pending') && (
              <button
                onClick={() => onMarkComplete(session.id)}
                disabled={actionLoading === session.id}
                className="px-5 py-2 bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white text-sm font-semibold rounded-full hover:shadow-lg transition-all disabled:opacity-50"
              >
                {actionLoading === session.id ? 'Saving...' : 'Mark Complete'}
              </button>
            )}
          </div>

          {session.meetingLink && (
            <div className="bg-[#F5F7FF] rounded-xl p-4">
              <p className="text-xs text-[#9CA3B5] mb-2">Meeting Link</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={session.meetingLink}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white rounded-lg text-sm text-[#5F6473]"
                />
                <button
                  onClick={() => copyMeetingLink(session.meetingLink!)}
                  className="px-4 py-2 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-medium rounded-full hover:shadow-lg transition-all"
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          {/* Notes editor */}
          <div className="bg-[#F5F7FF] rounded-xl p-4">
            <p className="text-xs text-[#9CA3B5] mb-2">Session Notes</p>
            <textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Add notes about this session..."
              rows={4}
              className="w-full px-3 py-2 bg-white rounded-lg text-sm text-[#111827] placeholder-[#9CA3B5] border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5] resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-[#9CA3B5]">Notes are saved to the booking record</p>
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="px-4 py-1.5 bg-[#304DB5] text-white text-xs font-semibold rounded-full hover:bg-[#2340A0] transition-colors disabled:opacity-50"
              >
                {savingNotes ? 'Saving...' : notesSaved ? 'Saved ✓' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionLogTable;
