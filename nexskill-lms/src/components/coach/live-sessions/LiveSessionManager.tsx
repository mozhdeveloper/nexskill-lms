import React, { useState } from 'react';
import { useLiveSessions } from '../../../hooks/useLiveSessions';
import type { LiveSession, SessionStatus } from '../../../types/db';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';

const LiveSessionManager: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const { sessions, loading, error, createSession, updateSession, deleteSession } = useLiveSessions(courseId);
    const [isCreating, setIsCreating] = useState(false);
    const [editingSession, setEditingSession] = useState<LiveSession | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<LiveSession>>({
        title: '',
        description: '',
        scheduled_at: '',
        duration_minutes: 60,
        meeting_link: '',
        is_live: false,
        status: 'scheduled'
    });

    if (!courseId) {
        return (
            <div className="text-center py-12 text-slate-500">
                <p>Invalid course. No course ID provided.</p>
            </div>
        );
    }

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            scheduled_at: '',
            duration_minutes: 60,
            meeting_link: '',
            is_live: false,
            status: 'scheduled'
        });
        setIsCreating(false);
        setEditingSession(null);
    };

    const handleEditClick = (session: LiveSession) => {
        setFormData({
            ...session,
            // Ensure date string format is compatible with datetime-local input if needed
            scheduled_at: session.scheduled_at ? new Date(session.scheduled_at).toISOString().slice(0, 16) : ''
        });
        setEditingSession(session);
        setIsCreating(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Need the current user ID for coach_id
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                alert('You must be logged in to create a session');
                return;
            }

            const payload: any = {
                ...formData,
                course_id: courseId,
                coach_id: user.id, // Assign current user as coach
                scheduled_at: new Date(formData.scheduled_at!).toISOString()
            };

            if (editingSession) {
                await updateSession(editingSession.id, payload);
            } else {
                await createSession(payload);
            }
            resetForm();
        } catch (err: any) {
            alert('Failed to save session: ' + err.message);
        }
    };

    const handleStartSession = async (session: LiveSession) => {
        if (window.confirm('Are you sure you want to go LIVE? This will reveal the link to students.')) {
            await updateSession(session.id, { is_live: true, status: 'live' });
        }
    };

    const handleEndSession = async (session: LiveSession) => {
        if (window.confirm('End this session?')) {
            await updateSession(session.id, { is_live: false, status: 'completed' });
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this session?')) {
            await deleteSession(id);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading sessions...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-dark-text-primary">Live Sessions</h2>
                    <p className="text-slate-600 dark:text-dark-text-secondary">Schedule and manage your live classes</p>
                </div>
                {!isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
                    >
                        + Schedule Session
                    </button>
                )}
            </div>

            {isCreating ? (
                <div className="bg-white dark:bg-dark-background-card p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold mb-4">{editingSession ? 'Edit' : 'Schedule'} Session</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Title <span className="text-red-500">*</span></label>
                                <input
                                    className="w-full px-3 py-2 border rounded-lg"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Date & Time <span className="text-red-500">*</span></label>
                                <input
                                    type="datetime-local"
                                    className="w-full px-3 py-2 border rounded-lg"
                                    required
                                    value={formData.scheduled_at} // formatted for input
                                    onChange={e => setFormData({ ...formData, scheduled_at: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Duration (Minutes)</label>
                                <input
                                    type="number"
                                    className="w-full px-3 py-2 border rounded-lg"
                                    value={formData.duration_minutes}
                                    onChange={e => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Meeting Link (Zoom/Google Meet) <span className="text-red-500">*</span></label>
                                <input
                                    type="url"
                                    className="w-full px-3 py-2 border rounded-lg"
                                    placeholder="https://..."
                                    required
                                    value={formData.meeting_link || ''}
                                    onChange={e => setFormData({ ...formData, meeting_link: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700">Description</label>
                            <textarea
                                className="w-full px-3 py-2 border rounded-lg h-24"
                                value={formData.description || ''}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="flex gap-3 justify-end pt-4">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                {editingSession ? 'Update Session' : 'Schedule Session'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="space-y-4">
                    {sessions.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                            <p className="text-slate-500">No live sessions scheduled yet.</p>
                        </div>
                    ) : (
                        sessions.map(session => (
                            <div key={session.id} className="bg-white dark:bg-dark-background-card p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-bold text-lg text-slate-900">{session.title}</h3>
                                        <StatusBadge status={session.status} is_live={session.is_live} />
                                    </div>
                                    <p className="text-sm text-slate-500 mb-2">
                                        {session.scheduled_at ? new Date(session.scheduled_at).toLocaleString() : 'Date not set'} • {session.duration_minutes} mins
                                    </p>
                                    {session.description && <p className="text-sm text-slate-600 line-clamp-2">{session.description}</p>}
                                    {session.is_live && session.meeting_link && (
                                        <div className="mt-3">
                                            <a href={session.meeting_link} target="_blank" rel="noreferrer" className="text-indigo-600 font-medium underline">
                                                Join Meeting Link
                                            </a>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    {/* Action Buttons based on status */}
                                    {session.status === 'scheduled' && (
                                        <>
                                            <button
                                                onClick={() => handleStartSession(session)}
                                                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 font-medium"
                                            >
                                                Start Live
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm('Are you sure you want to cancel this session?')) {
                                                        await updateSession(session.id, { status: 'canceled' });
                                                    }
                                                }}
                                                className="px-4 py-2 bg-red-100 text-red-600 text-sm rounded-lg hover:bg-red-200 font-medium border border-red-300 ml-2"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    )}
                                    {session.status === 'live' && (
                                        <button
                                            onClick={() => handleEndSession(session)}
                                            className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 font-medium"
                                        >
                                            End Session
                                        </button>
                                    )}

                                    <button
                                        onClick={() => handleEditClick(session)}
                                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                                        title="Edit"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => handleDelete(session.id)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                        title="Delete"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

const StatusBadge = ({ status, is_live }: { status: SessionStatus, is_live: boolean }) => {
    if (is_live) return <span className="px-2 py-0.5 text-xs font-bold bg-green-100 text-green-700 border border-green-200 rounded animate-pulse">🔴 LIVE NOW</span>;

    switch (status) {
        case 'scheduled': return <span className="px-2 py-0.5 text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100 rounded">Scheduled</span>;
        case 'completed': return <span className="px-2 py-0.5 text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200 rounded">Completed</span>;
        case 'cancelled': return <span className="px-2 py-0.5 text-xs font-bold bg-red-50 text-red-600 border border-red-100 rounded">Cancelled</span>;
        default: return null;
    }
};

export default LiveSessionManager;
