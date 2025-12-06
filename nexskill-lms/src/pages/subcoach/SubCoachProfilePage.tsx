import React, { useState } from 'react';
import SubCoachAppLayout from '../../layouts/SubCoachAppLayout';

const SubCoachProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'courses' | 'preferences'>('profile');

  // Dummy profile data
  const profile = {
    name: 'Jordan Thompson',
    email: 'jordan.thompson@nexskill.com',
    role: 'Sub-Coach',
    supervisingCoach: 'Dr. Sarah Williams',
    joinedDate: 'January 2024',
    bio: 'Passionate educator with 5 years of experience in design and technology education.',
  };

  // Dummy courses
  const assignedCourses = [
    {
      id: '1',
      name: 'UI Design Fundamentals',
      studentsAssigned: 18,
      role: 'Support grading and Q&A',
    },
    {
      id: '2',
      name: 'JavaScript Mastery',
      studentsAssigned: 12,
      role: 'Support grading, Q&A, and group sessions',
    },
    {
      id: '3',
      name: 'Product Management',
      studentsAssigned: 9,
      role: 'Support grading',
    },
  ];

  return (
    <SubCoachAppLayout>
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#EDF0FB]">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-text-primary mb-2">My Profile</h1>
          <p className="text-sm text-text-secondary">Manage your profile and preferences</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Card */}
          <div className="bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl p-8 text-white">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold backdrop-blur">
                JT
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">{profile.name}</h2>
                <p className="text-cyan-100 text-sm mb-3">{profile.email}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="px-3 py-1 bg-white/20 rounded-lg backdrop-blur">
                    {profile.role}
                  </span>
                  <span className="text-cyan-100">Joined {profile.joinedDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl border border-[#EDF0FB]">
            <div className="border-b border-[#EDF0FB] px-6 pt-6">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-700 border-b-2 border-teal-500'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Profile Info
                </button>
                <button
                  onClick={() => setActiveTab('courses')}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    activeTab === 'courses'
                      ? 'bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-700 border-b-2 border-teal-500'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  My Courses
                </button>
                <button
                  onClick={() => setActiveTab('preferences')}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    activeTab === 'preferences'
                      ? 'bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-700 border-b-2 border-teal-500'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Preferences
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* Bio */}
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-2">
                      Bio
                    </label>
                    <textarea
                      rows={4}
                      defaultValue={profile.bio}
                      className="w-full px-4 py-3 border border-[#EDF0FB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none"
                    />
                  </div>

                  {/* Supervising Coach */}
                  <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-xl p-4 border border-cyan-200">
                    <div className="text-xs font-medium text-text-secondary mb-1">
                      Supervising Coach
                    </div>
                    <div className="text-sm font-semibold text-text-primary">
                      {profile.supervisingCoach}
                    </div>
                    <p className="text-xs text-text-secondary mt-2">
                      Contact your supervising coach for course access or permission questions
                    </p>
                  </div>

                  {/* Contact Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        defaultValue={profile.name}
                        className="w-full px-4 py-2 border border-[#EDF0FB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        defaultValue={profile.email}
                        className="w-full px-4 py-2 border border-[#EDF0FB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                      />
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <button 
                      onClick={() => {
                        console.log('Save profile changes');
                        alert('✅ Profile updated successfully!');
                      }}
                      className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 rounded-xl transition-all"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'courses' && (
                <div className="space-y-4">
                  <p className="text-sm text-text-secondary mb-4">
                    You're currently supporting {assignedCourses.length} courses
                  </p>
                  {assignedCourses.map((course) => (
                    <div
                      key={course.id}
                      className="bg-gray-50 rounded-xl p-5 border border-gray-200"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-base font-bold text-text-primary mb-1">
                            {course.name}
                          </h4>
                          <p className="text-xs text-text-secondary mb-2">{course.role}</p>
                          <div className="text-xs text-text-secondary">
                            <span className="font-medium">{course.studentsAssigned}</span> students assigned
                          </div>
                        </div>
                        <button 
                          onClick={() => console.log('View course:', course.id)}
                          className="px-4 py-2 text-xs font-medium text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                        >
                          View Course
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border-2 border-dashed border-amber-300 mt-6">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-lg flex-shrink-0">
                        📚
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-text-primary mb-1">
                          Course Assignment
                        </h5>
                        <p className="text-xs text-text-secondary">
                          Your supervising coach manages which courses you support. Contact them to request changes to your course assignments.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  {/* Notification Preferences */}
                  <div>
                    <h4 className="text-sm font-bold text-text-primary mb-4">
                      Notification Preferences
                    </h4>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                        <div>
                          <div className="text-sm font-medium text-text-primary">
                            Assignment Submissions
                          </div>
                          <div className="text-xs text-text-secondary">
                            Get notified when students submit assignments
                          </div>
                        </div>
                        <input type="checkbox" defaultChecked className="w-5 h-5 text-teal-500" />
                      </label>

                      <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                        <div>
                          <div className="text-sm font-medium text-text-primary">
                            Student Questions
                          </div>
                          <div className="text-xs text-text-secondary">
                            Get notified when students ask questions
                          </div>
                        </div>
                        <input type="checkbox" defaultChecked className="w-5 h-5 text-teal-500" />
                      </label>

                      <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                        <div>
                          <div className="text-sm font-medium text-text-primary">
                            Session Reminders
                          </div>
                          <div className="text-xs text-text-secondary">
                            Reminders 24 hours before group sessions
                          </div>
                        </div>
                        <input type="checkbox" defaultChecked className="w-5 h-5 text-teal-500" />
                      </label>

                      <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                        <div>
                          <div className="text-sm font-medium text-text-primary">
                            Weekly Summary
                          </div>
                          <div className="text-xs text-text-secondary">
                            Weekly email with activity summary
                          </div>
                        </div>
                        <input type="checkbox" defaultChecked className="w-5 h-5 text-teal-500" />
                      </label>
                    </div>
                  </div>

                  {/* Display Preferences */}
                  <div>
                    <h4 className="text-sm font-bold text-text-primary mb-4">
                      Display Preferences
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-2">
                          Dashboard View
                        </label>
                        <select className="w-full px-4 py-2 border border-[#EDF0FB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500">
                          <option>Compact View</option>
                          <option>Detailed View</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-2">
                          Students Per Page
                        </label>
                        <select className="w-full px-4 py-2 border border-[#EDF0FB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500">
                          <option>10</option>
                          <option>25</option>
                          <option>50</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <button 
                      onClick={() => {
                        console.log('Save notification preferences');
                        alert('✅ Notification preferences saved successfully!');
                      }}
                      className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 rounded-xl transition-all"
                    >
                      Save Preferences
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SubCoachAppLayout>
  );
};

export default SubCoachProfilePage;
