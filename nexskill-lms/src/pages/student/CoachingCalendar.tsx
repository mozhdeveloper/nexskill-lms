import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import CoachCard from '../../components/coaching/CoachCard';
import { supabase } from '../../lib/supabaseClient';

interface CoachRow {
  id: string;
  name: string;
  title: string;
  rating: number;
  sessionsCount: number;
  tags: string[];
}

const CoachingCalendar: React.FC = () => {
  const navigate = useNavigate();
  const [coaches, setCoaches] = useState<CoachRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState('All');

  useEffect(() => {
    const fetchCoaches = async () => {
      setLoading(true);
      try {
        // Fetch all coach profiles with profile names
        const { data: profiles, error: profileErr } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('role', 'coach');

        if (profileErr || !profiles) {
          console.error('[CoachingCalendar] profiles error:', profileErr);
          return;
        }

        const ids = profiles.map((p) => p.id);
        const { data: coachData, error: cpErr } = await supabase
          .from('coach_profiles')
          .select('id, job_title, content_areas')
          .in('id', ids);

        if (cpErr) {
          console.error('[CoachingCalendar] coach_profiles error:', cpErr);
        }

        const cpMap: Record<string, { job_title: string; content_areas: string[] }> = {};
        for (const cp of coachData ?? []) {
          cpMap[cp.id] = cp;
        }

        const rows: CoachRow[] = profiles.map((p) => ({
          id: p.id,
          name: `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'Coach',
          title: cpMap[p.id]?.job_title ?? 'Instructor',
          rating: 0,
          sessionsCount: 0,
          tags: cpMap[p.id]?.content_areas ?? [],
        }));

        setCoaches(rows);
      } finally {
        setLoading(false);
      }
    };

    fetchCoaches();
  }, []);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    coaches.forEach((c) => c.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).slice(0, 8);
  }, [coaches]);

  const filteredCoaches = useMemo(
    () =>
      coaches.filter((coach) => {
        const lower = searchTerm.toLowerCase();
        const matchesSearch =
          searchTerm === '' ||
          coach.name.toLowerCase().includes(lower) ||
          coach.title.toLowerCase().includes(lower) ||
          coach.tags.some((tag) => tag.toLowerCase().includes(lower));

        const matchesExpertise =
          selectedExpertise === 'All' ||
          coach.tags.some((tag) => tag.toLowerCase().includes(selectedExpertise.toLowerCase()));

        return matchesSearch && matchesExpertise;
      }),
    [coaches, searchTerm, selectedExpertise]
  );

  return (
    <StudentAppLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#E7F0FF] via-[#F9F0FF] to-[#E3F4FF] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-16 transition-colors">
        <div className="max-w-1xl px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">1:1 Coaching</h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Book personalized coaching sessions with industry experts to accelerate your learning
            </p>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-6">
              <div className="text-3xl font-bold text-[#304DB5] dark:text-blue-400 mb-1">
                {loading ? '�' : coaches.length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Expert coaches</div>
            </div>
            <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-6">
              <div className="text-3xl font-bold text-[#304DB5] dark:text-blue-400 mb-1">0</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Your upcoming sessions</div>
            </div>
          </div>

          {/* My Sessions button */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/student/coaching/sessions')}
              className="px-6 py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all"
            >
              View my sessions ?
            </button>
          </div>

          {/* Search and filter */}
          <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search input */}
              <div className="flex-1 relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, expertise, or skills..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-600 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100 dark:text-white"
                />
              </div>

              {/* Expertise filter */}
              <select
                value={selectedExpertise}
                onChange={(e) => setSelectedExpertise(e.target.value)}
                className="px-6 py-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-600 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100 font-medium dark:text-white"
              >
                <option value="All">All expertise</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Coaches grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Available coaches</h2>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {loading ? 'Loading...' : `${filteredCoaches.length} ${filteredCoaches.length === 1 ? 'coach' : 'coaches'} found`}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#304DB5]" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCoaches.map((coach) => (
                    <CoachCard key={coach.id} coach={coach} />
                  ))}
                </div>

                {filteredCoaches.length === 0 && (
                  <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-12 text-center">
                    <div className="text-slate-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <p className="text-lg text-slate-600 dark:text-slate-400 mb-2">No coaches found</p>
                    <p className="text-sm text-slate-500 dark:text-slate-500">Try adjusting your search or filter criteria</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default CoachingCalendar;
