import React, { useState } from 'react';

interface BookingType {
  id: string;
  name: string;
  duration: number;
  format: 'Online' | 'In-person';
  price: number;
  maxParticipants: number;
  status: 'Active' | 'Hidden';
}

interface BookingTypesPanelProps {
  bookingTypes: BookingType[];
  onChange: (updatedBookingTypes: BookingType[]) => void;
}

const BookingTypesPanel: React.FC<BookingTypesPanelProps> = ({ bookingTypes, onChange }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<BookingType>>({});

  const startEdit = (bookingType: BookingType) => {
    setEditingId(bookingType.id);
    setEditForm({ ...bookingType });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = () => {
    if (!editingId) return;
    const updated = bookingTypes.map((bt) =>
      bt.id === editingId ? { ...bt, ...editForm } as BookingType : bt
    );
    onChange(updated);
    cancelEdit();
  };

  const duplicateBookingType = (bookingType: BookingType) => {
    const newBookingType: BookingType = {
      ...bookingType,
      id: `booking-${Date.now()}`,
      name: `${bookingType.name} (Copy)`,
    };
    onChange([...bookingTypes, newBookingType]);
  };

  const archiveBookingType = (id: string) => {
    const updated = bookingTypes.map((bt) =>
      bt.id === id ? { ...bt, status: 'Hidden' as const } : bt
    );
    onChange(updated);
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
                    <select
                      value={editForm.format || 'Online'}
                      onChange={(e) =>
                        setEditForm({ ...editForm, format: e.target.value as 'Online' | 'In-person' })
                      }
                      className="w-full px-4 py-2 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5]"
                    >
                      <option value="Online">Online</option>
                      <option value="In-person">In-person</option>
                    </select>
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
