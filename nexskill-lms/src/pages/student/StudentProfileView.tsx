import React from 'react';
import { useNavigate } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import ProfileHeaderCard from '../../components/profile/ProfileHeaderCard';
import ProfileInterestsGoals from '../../components/profile/ProfileInterestsGoals';

// Dummy profile data
const dummyProfile = {
  name: 'Sarah Johnson',
  headline: 'Aspiring Product Designer',
  level: 'Intermediate',
  memberSince: '2025',
  streakDays: 12,
  bio:"I'm a career switcher passionate about creating user-centered digital experiences. Currently learning UI/UX design fundamentals and building my portfolio.",
  interests: ['Design', 'Business', 'Career'],
  goals: ['Get a job', 'Start a side project'],
  completedCourses: 8,
  certificates: 3,
  hoursLearned: 45,
};

const StudentProfileView: React.FC = () => {
  const navigate = useNavigate();

  return (
    <StudentAppLayout>
      <div className="flex-1 overflow-y-auto p-8">
        {/* Profile Header */}
        <ProfileHeaderCard
          profile={dummyProfile}
          onEditProfile={() => navigate('/student/profile/edit')}
        />

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Bio and Interests */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-3">About me</h2>
              <p className="text-slate-700 leading-relaxed">{dummyProfile.bio}</p>
            </div>

            {/* Interests & Goals */}
            <ProfileInterestsGoals
              mode="view"
              interests={dummyProfile.interests}
              goals={dummyProfile.goals}
              level={dummyProfile.level}
            />
          </div>

          {/* Right column - Metrics and Quick Actions */}
          <div className="space-y-6">
            {/* Learning Stats */}
            <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Learning stats</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-lg">📚</span>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600">Courses completed</div>
                      <div className="text-xl font-bold text-slate-900">
                        {dummyProfile.completedCourses}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-lg">🏆</span>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600">Certificates earned</div>
                      <div className="text-xl font-bold text-slate-900">
                        {dummyProfile.certificates}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-lg">⏱️</span>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600">Hours learned</div>
                      <div className="text-xl font-bold text-slate-900">
                        {dummyProfile.hoursLearned}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Quick actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/student/profile/edit')}
                  className="w-full py-3 px-4 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all text-left flex items-center justify-between"
                >
                  <span>Edit profile</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => navigate('/student/settings')}
                  className="w-full py-3 px-4 bg-white text-slate-700 font-medium rounded-full border-2 border-slate-200 hover:border-slate-300 transition-all text-left flex items-center justify-between"
                >
                  <span>Account settings</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => navigate('/student/settings/billing')}
                  className="w-full py-3 px-4 bg-white text-slate-700 font-medium rounded-full border-2 border-slate-200 hover:border-slate-300 transition-all text-left flex items-center justify-between"
                >
                  <span>Billing & payments</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default StudentProfileView;
