import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';

interface TimeSlot {
  time: string;
  available: boolean;
  booked: boolean;
  coach?: string;
  sessionType?: string;
}

interface DayAvailability {
  day: string;
  date: string;
  slots: TimeSlot[];
}

const BrowseSchedule: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; time: string } | null>(null);

  // Mock data - in real app this would come from API
  const availabilityData: DayAvailability[] = [
    {
      day: 'Monday',
      date: 'Jan 20',
      slots: [
        { time: '09:00 AM', available: true, booked: false, coach: 'Sarah Johnson', sessionType: '1:1 Strategy Session' },
        { time: '11:00 AM', available: true, booked: false, coach: 'Mike Chen', sessionType: 'React Performance' },
        { time: '01:00 PM', available: false, booked: false },
        { time: '03:00 PM', available: true, booked: true, coach: 'Emma Wilson', sessionType: 'Typography Workshop' },
        { time: '05:00 PM', available: false, booked: false },
      ],
    },
    {
      day: 'Tuesday',
      date: 'Jan 21',
      slots: [
        { time: '09:00 AM', available: true, booked: false, coach: 'Alex Brown', sessionType: 'CSS Animations' },
        { time: '11:00 AM', available: true, booked: false, coach: 'Sarah Johnson', sessionType: 'Design Systems' },
        { time: '01:00 PM', available: true, booked: false, coach: 'Mike Chen', sessionType: 'JavaScript ES6+' },
        { time: '03:00 PM', available: false, booked: false },
        { time: '05:00 PM', available: true, booked: false, coach: 'Emma Wilson', sessionType: 'Color Theory' },
      ],
    },
    {
      day: 'Wednesday',
      date: 'Jan 22',
      slots: [
        { time: '09:00 AM', available: false, booked: false },
        { time: '11:00 AM', available: true, booked: false, coach: 'Mike Chen', sessionType: 'React Hooks' },
        { time: '01:00 PM', available: true, booked: false, coach: 'Sarah Johnson', sessionType: 'Figma Basics' },
        { time: '03:00 PM', available: true, booked: false, coach: 'Alex Brown', sessionType: 'UI Fundamentals' },
        { time: '05:00 PM', available: false, booked: false },
      ],
    },
    {
      day: 'Thursday',
      date: 'Jan 23',
      slots: [
        { time: '09:00 AM', available: true, booked: false, coach: 'Emma Wilson', sessionType: 'Typography' },
        { time: '11:00 AM', available: true, booked: true, coach: 'Mike Chen', sessionType: 'Performance' },
        { time: '01:00 PM', available: true, booked: false, coach: 'Sarah Johnson', sessionType: 'Design Review' },
        { time: '03:00 PM', available: true, booked: false, coach: 'Alex Brown', sessionType: 'Code Review' },
        { time: '05:00 PM', available: false, booked: false },
      ],
    },
    {
      day: 'Friday',
      date: 'Jan 24',
      slots: [
        { time: '09:00 AM', available: true, booked: false, coach: 'Mike Chen', sessionType: 'Debugging' },
        { time: '11:00 AM', available: true, booked: false, coach: 'Sarah Johnson', sessionType: 'Portfolio Review' },
        { time: '01:00 PM', available: false, booked: false },
        { time: '03:00 PM', available: false, booked: false },
        { time: '05:00 PM', available: false, booked: false },
      ],
    },
    {
      day: 'Saturday',
      date: 'Jan 25',
      slots: [
        { time: '09:00 AM', available: false, booked: false },
        { time: '11:00 AM', available: false, booked: false },
        { time: '01:00 PM', available: false, booked: false },
        { time: '03:00 PM', available: false, booked: false },
        { time: '05:00 PM', available: false, booked: false },
      ],
    },
    {
      day: 'Sunday',
      date: 'Jan 26',
      slots: [
        { time: '09:00 AM', available: false, booked: false },
        { time: '11:00 AM', available: false, booked: false },
        { time: '01:00 PM', available: false, booked: false },
        { time: '03:00 PM', available: false, booked: false },
        { time: '05:00 PM', available: false, booked: false },
      ],
    },
  ];

  const getSlotColor = (slot: TimeSlot) => {
    if (slot.booked) {
      return 'bg-green-100 text-green-800 border-green-300 cursor-not-allowed';
    }
    if (slot.available) {
      return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 cursor-pointer';
    }
    return 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed';
  };

  const handleSlotClick = (day: string, slot: TimeSlot) => {
    if (!slot.available || slot.booked) return;

    setSelectedSlot({ day, time: slot.time });
  };

  const handleBookSession = () => {
    if (!selectedSlot) return;

    // Find the slot details
    const dayData = availabilityData.find(d => d.day === selectedSlot.day);
    const slotData = dayData?.slots.find(s => s.time === selectedSlot.time);

    if (slotData) {
      alert(`🎉 Session Booked!\n\n${slotData.sessionType}\nwith ${slotData.coach}\n${selectedSlot.day} at ${selectedSlot.time}\n\nYou'll receive a confirmation email shortly.`);
      setSelectedSlot(null);
    }
  };

  const availableSlotsCount = availabilityData.reduce(
    (total, day) => total + day.slots.filter(slot => slot.available && !slot.booked).length,
    0
  );

  const bookedSlotsCount = availabilityData.reduce(
    (total, day) => total + day.slots.filter(slot => slot.booked).length,
    0
  );

  return (
    <StudentAppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-[#111827] mb-2">Browse Schedule</h1>
              <p className="text-lg text-[#5F6473]">
                Find and book coaching sessions with expert instructors
              </p>
            </div>
            <button
              onClick={() => navigate('/student/live-classes')}
              className="px-6 py-3 bg-[#304DB5] text-white font-semibold rounded-xl hover:bg-[#5E7BFF] transition-colors"
            >
              ← Back to Live Classes
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#304DB5] to-[#5E7BFF] rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm opacity-90">Available Sessions</p>
              <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-4xl font-bold">{availableSlotsCount}</p>
            <p className="text-xs opacity-80 mt-1">This week</p>
          </div>

          <div className="bg-white dark:bg-dark-background-card rounded-2xl border border-[#EDF0FB] dark:border-gray-700 p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-[#5F6473]">Booked Sessions</p>
              <svg className="w-8 h-8 text-[#22C55E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-4xl font-bold text-[#111827]">{bookedSlotsCount}</p>
            <p className="text-xs text-[#9CA3B5] mt-1">Already taken</p>
          </div>

          <div className="bg-white dark:bg-dark-background-card rounded-2xl border border-[#EDF0FB] dark:border-gray-700 p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-[#5F6473]">Expert Coaches</p>
              <svg className="w-8 h-8 text-[#F59E0B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-4xl font-bold text-[#111827]">4</p>
            <p className="text-xs text-[#9CA3B5] mt-1">Available coaches</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 p-4 bg-[#F5F7FF] rounded-xl mb-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-50 border-2 border-blue-200" />
            <span className="text-sm text-[#5F6473]">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-300" />
            <span className="text-sm text-[#5F6473]">Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-50 border-2 border-gray-200" />
            <span className="text-sm text-[#5F6473]">Unavailable</span>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-lg border border-[#EDF0FB] dark:border-gray-700 overflow-hidden">
          <div className="p-6 overflow-x-auto">
            <div className="min-w-[900px]">
              {/* Header Row */}
              <div className="grid grid-cols-8 gap-3 mb-4">
                <div className="text-xs font-semibold text-[#5F6473] uppercase">Time</div>
                {availabilityData.map((dayConfig) => (
                  <div key={dayConfig.day} className="text-center">
                    <div className="text-sm font-bold text-[#111827]">{dayConfig.day}</div>
                    <div className="text-xs text-[#5F6473]">{dayConfig.date}</div>
                  </div>
                ))}
              </div>

              {/* Time Slots Grid */}
              <div className="space-y-3">
                {availabilityData[0].slots.map((_, slotIndex) => (
                  <div key={slotIndex} className="grid grid-cols-8 gap-3">
                    {/* Time Label */}
                    <div className="flex items-center text-sm font-medium text-[#5F6473]">
                      {availabilityData[0].slots[slotIndex].time}
                    </div>

                    {/* Day Slots */}
                    {availabilityData.map((dayConfig, dayIndex) => {
                      const slot = dayConfig.slots[slotIndex];
                      const isSelected = selectedSlot?.day === dayConfig.day && selectedSlot?.time === slot.time;

                      return (
                        <button
                          key={`${dayIndex}-${slotIndex}`}
                          onClick={() => handleSlotClick(dayConfig.day, slot)}
                          disabled={!slot.available || slot.booked}
                          className={`h-16 rounded-lg border-2 transition-all hover:scale-105 ${getSlotColor(slot)} ${
                            isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                          }`}
                        >
                          <div className="text-xs text-center">
                            {slot.available && !slot.booked && (
                              <div>
                                <div className="font-semibold">{slot.coach?.split(' ')[0]}</div>
                                <div className="text-xs opacity-75 truncate px-1">
                                  {slot.sessionType?.split(' ').slice(0, 2).join(' ')}
                                </div>
                              </div>
                            )}
                            {slot.booked && <div className="font-semibold">Booked</div>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Booking Modal */}
        {selectedSlot && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-[#111827] mb-4">Book Session</h3>

              {(() => {
                const dayData = availabilityData.find(d => d.day === selectedSlot.day);
                const slotData = dayData?.slots.find(s => s.time === selectedSlot.time);
                return slotData ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="font-semibold text-blue-900">{slotData.sessionType}</div>
                      <div className="text-blue-700">with {slotData.coach}</div>
                      <div className="text-blue-600 text-sm">{selectedSlot.day} at {selectedSlot.time}</div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleBookSession}
                        className="flex-1 px-6 py-3 bg-[#304DB5] text-white font-semibold rounded-xl hover:bg-[#5E7BFF] transition-colors"
                      >
                        Confirm Booking
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSlot(null);

                        }}
                        className="px-6 py-3 text-[#5F6473] font-medium rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        )}
      </div>
    </StudentAppLayout>
  );
};

export default BrowseSchedule;