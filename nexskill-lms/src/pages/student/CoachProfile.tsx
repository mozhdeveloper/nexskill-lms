import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';

// Dummy coach data (should match the ID from CoachingCalendar)
const coachesData: Record<string, any> = {
  '1': {
    id: '1',
    name: 'Dr. Emily Chen',
    title: 'Career Strategy Coach',
    rating: 4.9,
    sessionsCount: 245,
    tags: ['Career Growth', 'Interview Prep', 'Resume Review'],
    bio:"With over 15 years of experience in career development and executive coaching, I've helped hundreds of professionals navigate career transitions, land dream jobs, and develop leadership skills. My approach combines practical strategies with empathetic guidance tailored to your unique journey.",
    expertise: ['Career Transitions', 'Leadership Development', 'Personal Branding', 'Salary Negotiation'],
    education: ['PhD in Organizational Psychology, Stanford University', 'Certified Executive Coach (ICF)'],
    experience: [
      'Former VP of Talent at TechCorp (2015-2020)',
      'Senior Career Advisor at LinkedIn (2010-2015)',
      'Published author of"Navigate Your Career"',
    ],
    testimonials: [
      {
        name: 'Sarah M.',
        text: 'Emily helped me transition from engineering to product management. Her insights were invaluable!',
        rating: 5,
      },
      {
        name: 'John K.',
        text: 'Best coach I\'ve worked with. She really understands the tech industry and gave practical advice.',
        rating: 5,
      },
    ],
  },
  '2': {
    id: '2',
    name: 'Michael Rodriguez',
    title: 'Tech Skills Mentor',
    rating: 5.0,
    sessionsCount: 189,
    tags: ['JavaScript', 'React', 'Full Stack'],
    bio: 'As a full-stack developer with 12+ years of industry experience, I specialize in helping aspiring developers master modern web technologies. My teaching style is hands-on and project-focused, ensuring you build real-world skills.',
    expertise: ['React & Next.js', 'Node.js & APIs', 'System Design', 'Code Review & Best Practices'],
    education: ['BS Computer Science, MIT', 'Full Stack Web Development Bootcamp Instructor'],
    experience: [
      'Senior Engineer at Meta (2018-2023)',
      'Tech Lead at Startup Inc. (2015-2018)',
      'Open source contributor with 10k+ GitHub stars',
    ],
    testimonials: [
      {
        name: 'Alex T.',
        text: 'Michael is an exceptional mentor. He simplified complex React concepts and my code quality improved dramatically.',
        rating: 5,
      },
    ],
  },
  '3': {
    id: '3',
    name: 'Sarah Thompson',
    title: 'Data Science Advisor',
    rating: 4.8,
    sessionsCount: 312,
    tags: ['Machine Learning', 'Python', 'Analytics'],
    bio: 'Data science expert with extensive experience in AI/ML projects across finance and healthcare. I guide students through the entire data science pipeline from problem formulation to model deployment.',
    expertise: ['Machine Learning', 'Deep Learning', 'Statistical Analysis', 'Python & R'],
    education: ['MS Data Science, UC Berkeley', 'PhD Candidate in Applied Statistics'],
    experience: [
      'Lead Data Scientist at HealthTech Co. (2019-Present)',
      'ML Engineer at Financial Services (2016-2019)',
      'Kaggle Competition Master',
    ],
    testimonials: [
      {
        name: 'David L.',
        text: 'Sarah\'s guidance helped me build my first ML model and understand the math behind it. Highly recommend!',
        rating: 5,
      },
    ],
  },
};

const CoachProfile: React.FC = () => {
  const { coachId } = useParams<{ coachId: string }>();
  const navigate = useNavigate();

  const coach = coachId ? coachesData[coachId] : null;

  if (!coach) {
    return (
      <StudentAppLayout>
        <div className="min-h-screen bg-gradient-to-br from-[#E7F0FF] via-[#F9F0FF] to-[#E3F4FF] pb-16">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
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

  return (
    <StudentAppLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#E7F0FF] via-[#F9F0FF] to-[#E3F4FF] pb-16">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Back button */}
          <button
            onClick={() => navigate('/student/coaching')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to coaches
          </button>

          {/* Header card */}
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-8 mb-6">
            <div className="flex items-start gap-6 mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#304DB5] to-[#5E7BFF] flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">
                {coach.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">{coach.name}</h1>
                <p className="text-lg text-slate-600 mb-3">{coach.title}</p>
                <div className="flex items-center gap-4 text-sm mb-4">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500 text-xl">★</span>
                    <span className="font-semibold text-slate-900 text-lg">{coach.rating}</span>
                  </div>
                  <div className="text-slate-600">{coach.sessionsCount} sessions completed</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {coach.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-[#304DB5] text-sm font-medium rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate(`/student/coaching/coaches/${coach.id}/book`)}
              className="w-full py-3 px-6 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all"
            >
              Book a session with {coach.name.split(' ')[0]}
            </button>
          </div>

          {/* About */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-3">About</h2>
            <p className="text-slate-700 leading-relaxed">{coach.bio}</p>
          </div>

          {/* Expertise */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-3">Areas of expertise</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {coach.expertise.map((item: string, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#304DB5]" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Education & Experience */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-3">Education</h2>
              <ul className="space-y-2">
                {coach.education.map((item: string, index: number) => (
                  <li key={index} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="text-[#304DB5] mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-3">Experience</h2>
              <ul className="space-y-2">
                {coach.experience.map((item: string, index: number) => (
                  <li key={index} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="text-[#304DB5] mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Testimonials */}
          {coach.testimonials && coach.testimonials.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">What students say</h2>
              <div className="space-y-4">
                {coach.testimonials.map((testimonial: any, index: number) => (
                  <div key={index} className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="font-semibold text-slate-900">{testimonial.name}</div>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                          <span key={i} className="text-yellow-500 text-sm">★</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 italic">"{testimonial.text}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default CoachProfile;
