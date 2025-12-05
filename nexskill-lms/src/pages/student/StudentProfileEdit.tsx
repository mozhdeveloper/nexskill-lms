import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import ProfileInterestsGoals from '../../components/profile/ProfileInterestsGoals';

const StudentProfileEdit: React.FC = () => {
  const navigate = useNavigate();

  // Local state for form
  const [formData, setFormData] = useState({
    firstName: 'Sarah',
    lastName: 'Johnson',
    displayName: 'Sarah Johnson',
    headline: 'Aspiring Product Designer',
    bio:"I'm a career switcher passionate about creating user-centered digital experiences. Currently learning UI/UX design fundamentals and building my portfolio.",
  });

  const [interestsGoals, setInterestsGoals] = useState({
    interests: ['Design', 'Business', 'Career'],
    goals: ['Get a job', 'Start a side project'],
    level: 'Intermediate',
  });

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleSave = () => {
    // Simulate save
    console.log('Saving profile:', { ...formData, ...interestsGoals });
    setShowSuccessMessage(true);
    setTimeout(() => {
      navigate('/student/profile');
    }, 1500);
  };

  return (
    <StudentAppLayout>
      <div className="flex-1 overflow-y-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Edit profile</h1>
          <p className="text-lg text-slate-600">Update your personal details and learning goals</p>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-green-700 font-medium">Profile saved successfully!</span>
          </div>
        )}

        {/* Main Form Card */}
        <div className="bg-white rounded-3xl shadow-md border border-slate-200 p-8 mb-6">
          {/* Avatar Section */}
          <div className="mb-8 pb-8 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Profile photo</h2>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#304DB5] to-[#5E7BFF] flex items-center justify-center text-white font-bold text-4xl">
                {formData.firstName.charAt(0)}
              </div>
              <button
                onClick={() => alert('Photo upload coming soon!')}
                className="px-6 py-2.5 text-sm font-medium text-[#304DB5] border-2 border-[#304DB5] rounded-full hover:bg-blue-50 transition-all"
              >
                Change photo
              </button>
            </div>
          </div>

          {/* Personal Information */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Personal information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">First name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Last name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Display name</label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <p className="mt-2 text-xs text-slate-500">This is how your name appears to others</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Headline
              </label>
              <input
                type="text"
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                placeholder="What are you focusing on?"
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                placeholder="Tell us a bit about yourself and your learning journey"
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
              />
            </div>
          </div>

          {/* Interests & Goals */}
          <div className="mb-8">
            <ProfileInterestsGoals
              mode="edit"
              interests={interestsGoals.interests}
              goals={interestsGoals.goals}
              level={interestsGoals.level}
              onChange={(updated) => setInterestsGoals(updated)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-6 border-t border-slate-200">
            <button
              onClick={handleSave}
              className="px-8 py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all"
            >
              Save changes
            </button>
            <button
              onClick={() => navigate('/student/profile')}
              className="px-8 py-3 text-slate-700 font-medium rounded-full border-2 border-slate-200 hover:border-slate-300 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default StudentProfileEdit;
