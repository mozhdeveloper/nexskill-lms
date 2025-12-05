import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import CoachCard from '../../components/coaching/CoachCard';

// Dummy coaches data
const allCoaches = [
  {
    id: '1',
    name: 'Dr. Emily Chen',
    title: 'Career Strategy Coach',
    rating: 4.9,
    sessionsCount: 245,
    tags: ['Career Growth', 'Interview Prep', 'Resume Review'],
    expertise: ['Career Transitions', 'Leadership Development'],
  },
  {
    id: '2',
    name: 'Michael Rodriguez',
    title: 'Tech Skills Mentor',
    rating: 5.0,
    sessionsCount: 189,
    tags: ['JavaScript', 'React', 'Full Stack'],
    expertise: ['Web Development', 'Code Review'],
  },
  {
    id: '3',
    name: 'Sarah Thompson',
    title: 'Data Science Advisor',
    rating: 4.8,
    sessionsCount: 312,
    tags: ['Machine Learning', 'Python', 'Analytics'],
    expertise: ['Data Analysis', 'AI/ML Projects'],
  },
  {
    id: '4',
    name: 'James Park',
    title: 'Product & UX Coach',
    rating: 4.9,
    sessionsCount: 156,
    tags: ['Product Management', 'UX Design', 'User Research'],
    expertise: ['Product Strategy', 'Design Thinking'],
  },
  {
    id: '5',
    name: 'Linda Martinez',
    title: 'Business Analytics Coach',
    rating: 4.7,
    sessionsCount: 201,
    tags: ['Excel', 'SQL', 'Tableau'],
    expertise: ['Business Intelligence', 'Data Visualization'],
  },
  {
    id: '6',
    name: 'David Kim',
    title: 'DevOps & Cloud Mentor',
    rating: 5.0,
    sessionsCount: 98,
    tags: ['AWS', 'Docker', 'CI/CD'],
    expertise: ['Cloud Architecture', 'System Design'],
  },
];

const CoachingCalendar: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState('All');

  // Filter logic
  const filteredCoaches = allCoaches.filter((coach) => {
    const matchesSearch =
      searchTerm === '' ||
      coach.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coach.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coach.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesExpertise =
      selectedExpertise === 'All' ||
      coach.tags.some((tag) => tag.includes(selectedExpertise)) ||
      coach.expertise.some((exp) => exp.includes(selectedExpertise));

    return matchesSearch && matchesExpertise;
  });

  return (
    <StudentAppLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#E7F0FF] via-[#F9F0FF] to-[#E3F4FF] pb-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-3">1:1 Coaching</h1>
            <p className="text-lg text-slate-600">
              Book personalized coaching sessions with industry experts to accelerate your learning
            </p>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="text-3xl font-bold text-[#304DB5] mb-1">20+</div>
              <div className="text-sm text-slate-600">Expert coaches</div>
            </div>
            <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="text-3xl font-bold text-[#304DB5] mb-1">$15</div>
              <div className="text-sm text-slate-600">Coaching credit available</div>
            </div>
            <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="text-3xl font-bold text-[#304DB5] mb-1">3</div>
              <div className="text-sm text-slate-600">Upcoming sessions</div>
            </div>
          </div>

          {/* My Sessions button */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/student/coaching/sessions')}
              className="px-6 py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all"
            >
              View my sessions →
            </button>
          </div>

          {/* Search and filter */}
          <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search input */}
              <div className="flex-1 relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, expertise, or skills..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Expertise filter */}
              <select
                value={selectedExpertise}
                onChange={(e) => setSelectedExpertise(e.target.value)}
                className="px-6 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100 font-medium"
              >
                <option value="All">All expertise</option>
                <option value="Career">Career</option>
                <option value="JavaScript">JavaScript</option>
                <option value="Python">Python</option>
                <option value="Machine Learning">Machine Learning</option>
                <option value="Product">Product</option>
                <option value="Cloud">Cloud</option>
              </select>
            </div>
          </div>

          {/* Coaches grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900">Available coaches</h2>
              <div className="text-sm text-slate-600">
                {filteredCoaches.length} {filteredCoaches.length === 1 ? 'coach' : 'coaches'} found
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCoaches.map((coach) => (
                <CoachCard key={coach.id} coach={coach} />
              ))}
            </div>

            {filteredCoaches.length === 0 && (
              <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                <div className="text-slate-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <p className="text-lg text-slate-600 mb-2">No coaches found</p>
                <p className="text-sm text-slate-500">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default CoachingCalendar;
