import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
// Only need id and title for dropdown
type CourseDropdown = { id: string; title: string; student_count?: number };

interface BookingType {
  id: string;
  name: string;
  duration: number;
  format: 'Online' | 'In-person';
  price: number;
  maxParticipants: number;
  status: 'Active' | 'Hidden';
  course_id?: string;
  session_date?: string;
  session_time?: string;
}

interface BookingTypesPanelProps {
  bookingTypes: BookingType[];
  onChange: (updatedBookingTypes: BookingType[]) => void;
}

const BookingTypesPanel: React.FC<BookingTypesPanelProps> = ({ bookingTypes, onChange }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<BookingType>>({});
  const [courses, setCourses] = useState<CourseDropdown[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Fetch courses on mount
  useEffect(() => {
    const fetchCourses = async () => {
      setCoursesLoading(true);
      setCoursesError(null);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('courses')
          .select('id, title')
          .eq('coach_id', user.id);
        
        if (error) throw error;
        
        const coursesRaw = data || [];
        const { data: enrollmentsData, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select('course_id');
        
        const counts: Record<string, number> = {};
        if (!enrollmentsError && enrollmentsData) {
          enrollmentsData.forEach((e: any) => {
            counts[e.course_id] = (counts[e.course_id] || 0) + 1;
          });
        }

        setCourses(coursesRaw.map(c => ({
          ...c,
          student_count: counts[c.id] || 0
        })));
      } catch (err: any) {
        setCoursesError(err.message);
      } finally {
        setCoursesLoading(false);
      }
    };
    fetchCourses();
  }, []);

  // Fetch live sessions from database on mount
  useEffect(() => {
    const fetchSessions = async () => {
      setSessionsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('live_sessions')
          .select('*')
          .eq('coach_id', user.id);

        if (error) throw error;

        const mapped: BookingType[] = (data || []).map(s => {
          const scheduledDate = new Date(s.scheduled_at);
          return {
            id: s.id,
            name: s.title,
            duration: s.duration_minutes,
            format: (s.format as any) || 'Online',
            price: s.price || 0,
            maxParticipants: s.max_participants || 1,
            status: s.status === 'cancelled' ? 'Hidden' : 'Active',
            course_id: s.course_id,
            session_date: scheduledDate.toISOString().split('T')[0],
            session_time: scheduledDate.toTimeString().split(' ')[0].substring(0, 5)
          };
        });
        onChange(mapped);
      } catch (err) {
        console.error('Error fetching sessions:', err);
      } finally {
        setSessionsLoading(false);
      }
    };
    fetchSessions();
  }, []);

  // Auto-fill max participants when course changes
  useEffect(() => {
    if (!editForm.course_id) return;
    const selectedCourse = courses.find(c => c.id === editForm.course_id);
    if (selectedCourse && typeof selectedCourse.student_count === 'number') {
      setEditForm((prev) => ({ ...prev, maxParticipants: selectedCourse.student_count }));
    }
  }, [editForm.course_id, courses]);

  const startEdit = (bookingType: BookingType) => {
    setEditingId(bookingType.id);
    setEditForm({ ...bookingType });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingId) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (!editForm.course_id || !editForm.session_date || !editForm.session_time) {
        alert('Please fill in Course, Date, and Time');
        return;
      }

      const scheduledAt = new Date(`${editForm.session_date}T${editForm.session_time}`).toISOString();

      const sessionData = {
        title: editForm.name || 'New Session',
        course_id: editForm.course_id,
        coach_id: user.id,
        scheduled_at: scheduledAt,
        duration_minutes: editForm.duration || 30,
        format: editForm.format || 'Online',
        price: editForm.price || 0,
        max_participants: editForm.maxParticipants || 1,
        status: editForm.status === 'Active' ? 'scheduled' : 'cancelled',
        updated_at: new Date().toISOString()
      };

      let result;
      if (editingId.startsWith('booking-')) {
        // New record
        result = await supabase.from('live_sessions').insert([sessionData]).select();
      } else {
        // Update record
        result = await supabase.from('live_sessions').update(sessionData).eq('id', editingId).select();
      }

      if (result.error) throw result.error;

      const savedSession = result.data[0];
      const updatedItem: BookingType = {
        id: savedSession.id,
        name: savedSession.title,
        duration: savedSession.duration_minutes,
        format: savedSession.format,
        price: savedSession.price,
        maxParticipants: savedSession.max_participants,
        status: savedSession.status === 'cancelled' ? 'Hidden' : 'Active',
        course_id: savedSession.course_id,
        session_date: editForm.session_date,
        session_time: editForm.session_time
      };

      const updated = editingId.startsWith('booking-') 
        ? [...bookingTypes.filter(bt => bt.id !== editingId), updatedItem]
        : bookingTypes.map((bt) => bt.id === editingId ? updatedItem : bt);
      
      onChange(updated);
      cancelEdit();
    } catch (err: any) {
      alert(`Error saving session: ${err.message}`);
    }
  };

  const duplicateBookingType = (bookingType: BookingType) => {
    const newBookingType: BookingType = {
      ...bookingType,
      id: `booking-${Date.now()}`,
      name: `${bookingType.name} (Copy)`,
    };
    onChange([...bookingTypes, newBookingType]);
    startEdit(newBookingType);
  };

  const archiveBookingType = async (id: string) => {
    if (id.startsWith('booking-')) {
      onChange(bookingTypes.filter(bt => bt.id !== id));
      return;
    }

    try {
      const { error } = await supabase
        .from('live_sessions')
        .update({ status: 'cancelled' })
        .eq('id', id);
      
      if (error) throw error;

      const updated = bookingTypes.map((bt) =>
        bt.id === id ? { ...bt, status: 'Hidden' as const } : bt
      );
      onChange(updated);
    } catch (err: any) {
      alert(`Error archiving session: ${err.message}`);
    }
  };

  const addNewBookingType = () => {
    const newBookingType: BookingType = {
      id: `booking-${Date.now()}`,
      name: 'New Booking Type',
      duration: 30,
      format: 'Online',
      price: 0,
      maxParticipants: 1,
      status: 'Active',
    };
    onChange([...bookingTypes, newBookingType]);
    startEdit(newBookingType);
  };

  const getFormatIcon = (format: string) => {
    return format === 'Online' ? '💻' : '🏢';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-[#111827]">Booking Types</h3>
          <p className="text-sm text-[#5F6473] mt-1">
            Configure booking types that students can select when scheduling with you
          </p>
        </div>
        <button
          onClick={addNewBookingType}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add booking type
        </button>
      </div>

      {/* Booking Types List */}
      <div className="space-y-4">
        {bookingTypes.map((bookingType) => (
          <div
            key={bookingType.id}
            className="bg-white rounded-2xl border border-[#EDF0FB] p-6 hover:border-[#304DB5] transition-colors"
          >
            {editingId === bookingType.id ? (
              /* Edit Mode */
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Course Selector */}
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-2">Course</label>
                    <select
                      value={editForm.course_id || ''}
                      onChange={e => setEditForm({ ...editForm, course_id: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5]"
                      disabled={coursesLoading}
                    >
                      <option value="" disabled>Select course</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>{course.title}</option>
                      ))}
                    </select>
                    {coursesError && <div className="text-xs text-red-500 mt-1">{coursesError}</div>}
                  </div>
                  {/* Date Picker */}
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-2">Session Date</label>
                    <input
                      type="date"
                      value={editForm.session_date || ''}
                      onChange={e => setEditForm({ ...editForm, session_date: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5]"
                    />
                  </div>
                  {/* Time Picker */}
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-2">Session Time</label>
                    <input
                      type="time"
                      value={editForm.session_time || ''}
                      onChange={e => setEditForm({ ...editForm, session_time: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-2">Name</label>
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-2">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={editForm.duration || 30}
                      onChange={(e) =>
                        setEditForm({ ...editForm, duration: parseInt(e.target.value) })
                      }
                      className="w-full px-4 py-2 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-2">Format</label>
                    <input
                      type="text"
                      value="Online"
                      disabled
                      className="w-full px-4 py-2 rounded-xl border border-[#EDF0FB] bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-2">
                      Price (₱)
                    </label>
                    <input
                      type="number"
                      value={editForm.price || 0}
                      onChange={(e) =>
                        setEditForm({ ...editForm, price: parseFloat(e.target.value) })
                      }
                      className="w-full px-4 py-2 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-2">
                      Max Participants
                    </label>
                    <input
                      type="number"
                      value={editForm.maxParticipants || 1}
                      onChange={(e) =>
                        setEditForm({ ...editForm, maxParticipants: parseInt(e.target.value) })
                      }
                      className="w-full px-4 py-2 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-2">Status</label>
                    <select
                      value={editForm.status || 'Active'}
                      onChange={(e) =>
                        setEditForm({ ...editForm, status: e.target.value as 'Active' | 'Hidden' })
                      }
                      className="w-full px-4 py-2 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5]"
                    >
                      <option value="Active">Active</option>
                      <option value="Hidden">Hidden</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={saveEdit}
                    className="px-6 py-2 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-md transition-all"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-6 py-2 text-[#5F6473] font-medium rounded-full hover:bg-[#F5F7FF] transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h4 className="text-lg font-bold text-[#111827]">{bookingType.name}</h4>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        bookingType.status === 'Active'
                          ? 'bg-[#22C55E] text-white'
                          : 'bg-gray-300 text-gray-700'
                      }`}
                    >
                      {bookingType.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-[#9CA3B5] text-xs mb-1">Duration</p>
                      <p className="font-medium text-[#111827]">{bookingType.duration} min</p>
                    </div>
                    <div>
                      <p className="text-[#9CA3B5] text-xs mb-1">Format</p>
                      <div className="flex items-center gap-1">
                        <span>{getFormatIcon(bookingType.format)}</span>
                        <p className="font-medium text-[#111827]">{bookingType.format}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[#9CA3B5] text-xs mb-1">Price</p>
                      <p className="font-medium text-[#111827]">
                        {bookingType.price === 0 ? 'Free' : `₱${bookingType.price.toLocaleString()}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#9CA3B5] text-xs mb-1">Max Participants</p>
                      <p className="font-medium text-[#111827]">{bookingType.maxParticipants}</p>
                    </div>
                    <div>
                      <p className="text-[#9CA3B5] text-xs mb-1">Type</p>
                      <p className="font-medium text-[#111827]">
                        {bookingType.maxParticipants > 1 ? 'Group' : '1:1'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => startEdit(bookingType)}
                    className="px-4 py-2 text-sm font-medium text-[#304DB5] hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => duplicateBookingType(bookingType)}
                    className="px-4 py-2 text-sm font-medium text-[#5F6473] hover:bg-[#F5F7FF] rounded-lg transition-colors"
                  >
                    Duplicate
                  </button>
                  {bookingType.status === 'Active' && (
                    <button
                      onClick={() => archiveBookingType(bookingType.id)}
                      className="px-4 py-2 text-sm font-medium text-[#F97316] hover:bg-orange-50 rounded-lg transition-colors"
                    >
                      Archive
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {bookingTypes.length === 0 && (
          <div className="bg-white rounded-2xl border-2 border-dashed border-[#EDF0FB] p-12 text-center">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-lg text-[#5F6473] mb-2">No booking types yet</p>
            <p className="text-sm text-[#9CA3B5]">
              Create your first booking type to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingTypesPanel;
