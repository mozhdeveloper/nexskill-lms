import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import TimeSlotPicker from '../../components/coaching/TimeSlotPicker';
import BookingConfirmationCard from '../../components/coaching/BookingConfirmationCard';
import BookingPaymentForm from '../../components/coaching/BookingPaymentForm';
import { supabase } from '../../lib/supabaseClient';

// No coach_availability table yet — empty slot list
const availableDays: any[] = [];

const CoachingBooking: React.FC = () => {
  const { coachId } = useParams<{ coachId: string }>();
  const navigate = useNavigate();

  const [coach, setCoach] = useState<{ name: string; title: string } | null>(null);
  const [loadingCoach, setLoadingCoach] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!coachId) { setLoadingCoach(false); return; }
    const fetchCoach = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', coachId)
          .single();
        if (!profile) { setLoadingCoach(false); return; }

        const { data: cp } = await supabase
          .from('coach_profiles')
          .select('job_title')
          .eq('id', coachId)
          .single();

        setCoach({
          name: `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim(),
          title: cp?.job_title ?? 'Coach',
        });
      } catch {
        // profile not found
      } finally {
        setLoadingCoach(false);
      }
    };
    fetchCoach();
  }, [coachId]);

  if (loadingCoach) {
    return (
      <StudentAppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#304DB5]" />
        </div>
      </StudentAppLayout>
    );
  }

  if (!coach) {
    return (
      <StudentAppLayout>
        <div className="min-h-screen bg-gradient-to-br from-[#E7F0FF] via-[#F9F0FF] to-[#E3F4FF] pb-16">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
              <p className="text-lg text-slate-600 mb-4">Coach not found</p>
              <button
                onClick={() => navigate('/student/coaching')}
                className="px-6 py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all"
              >
                Browse all coaches
              </button>
            </div>
          </div>
        </div>
      </StudentAppLayout>
    );
  }

  const handleTimeSlotChange = (date: string, slot: string) => {
    setSelectedDate(date);
    setSelectedSlot(slot);
  };

  const handleConfirmBooking = () => {
    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      alert('Booking confirmed! You will receive a confirmation email shortly.');
      navigate('/student/coaching/sessions');
    }, 2000);
  };

  const selectedDay = availableDays.find((day) => day.date === selectedDate);

  return (
    <StudentAppLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#E7F0FF] via-[#F9F0FF] to-[#E3F4FF] pb-16">
        <div className="max-w-1xl px-6 py-8">
          {/* Back button */}
          <button
            onClick={() => navigate(`/student/coaching/coaches/${coachId}`)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to profile
          </button>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Book a session</h1>
            <p className="text-lg text-slate-600">
              with {coach.name} • {coach.title}
            </p>
          </div>

          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left column: Time slot picker */}
            <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-md border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Choose your time</h2>
              <TimeSlotPicker
                availableDays={availableDays}
                selectedDate={selectedDate}
                selectedSlot={selectedSlot}
                onChange={handleTimeSlotChange}
              />

              {/* Session details */}
              <div className="mt-6 pt-6 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Session duration</span>
                  <span className="font-semibold text-slate-900">60 minutes</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Format</span>
                  <span className="font-semibold text-slate-900">Video call (Zoom)</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Price</span>
                  <span className="font-semibold text-slate-900">$45</span>
                </div>
              </div>
            </div>

            {/* Right column: Confirmation and payment */}
            <div className="space-y-6">
              {/* Show confirmation card if time slot is selected */}
              {selectedDate && selectedSlot && selectedDay && (
                <>
                  <BookingConfirmationCard
                    coach={{ name: coach.name }}
                    date={selectedDay.label}
                    time={selectedSlot}
                    duration={60}
                    format="Video call (Zoom)"
                  />

                  <BookingPaymentForm
                    price={45}
                    onConfirm={handleConfirmBooking}
                    isProcessing={isProcessing}
                  />
                </>
              )}

              {/* Placeholder when no time slot selected */}
              {(!selectedDate || !selectedSlot) && (
                <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-md border border-slate-200 p-12 text-center">
                  <div className="text-slate-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-lg text-slate-600 mb-2">Select a time slot</p>
                  <p className="text-sm text-slate-500">Choose a date and time to continue with booking</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default CoachingBooking;
