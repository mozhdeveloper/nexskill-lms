import { useState } from 'react';
import SupportStaffAppLayout from '../../layouts/SupportStaffAppLayout';
import { Bell, Mail, Clock, Award } from 'lucide-react';

const SupportProfilePage = () => {
  const [preferences, setPreferences] = useState({
    newTicketAlerts: true,
    emailNotifications: true,
    slaReminders: true,
    performanceUpdates: false
  });

  const handleSavePreferences = () => {
    alert(`✅ Preferences Saved Successfully\n\n🔔 Notification Settings Updated:\n• New Ticket Alerts: ${preferences.newTicketAlerts ? 'ON' : 'OFF'}\n• Email Notifications: ${preferences.emailNotifications ? 'ON' : 'OFF'}\n• SLA Reminders: ${preferences.slaReminders ? 'ON' : 'OFF'}\n• Performance Updates: ${preferences.performanceUpdates ? 'ON' : 'OFF'}\n\n💬 Your preferences will take effect immediately.\n\n📧 You'll receive a confirmation email within 5 minutes.`);
  };

  const handleTogglePreference = (key: keyof typeof preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };
  return (
    <SupportStaffAppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Support Staff Profile</h1>
          <p className="text-gray-600">Manage your preferences and view performance metrics</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Info */}
            <div className="bg-white rounded-3xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Full Name</label>
                    <p className="text-lg text-gray-900 mt-1">Alex Johnson</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Role</label>
                    <p className="text-lg text-gray-900 mt-1">Support Staff</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Email</label>
                    <p className="text-lg text-gray-900 mt-1">alex.johnson@nexskill.com</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Employee ID</label>
                    <p className="text-lg text-gray-900 mt-1">EMP-3024</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white rounded-3xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Notification Preferences</h2>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-blue-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-blue-600" />
                    <div>
                      <span className="font-medium text-gray-900 block">New Ticket Alerts</span>
                      <span className="text-sm text-gray-600">Get notified when new tickets are assigned</span>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={preferences.newTicketAlerts}
                    onChange={() => handleTogglePreference('newTicketAlerts')}
                    className="w-5 h-5 text-blue-600 rounded" 
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-blue-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div>
                      <span className="font-medium text-gray-900 block">Email Notifications</span>
                      <span className="text-sm text-gray-600">Receive urgent ticket updates via email</span>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={preferences.emailNotifications}
                    onChange={() => handleTogglePreference('emailNotifications')}
                    className="w-5 h-5 text-blue-600 rounded" 
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-blue-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <span className="font-medium text-gray-900 block">SLA Reminders</span>
                      <span className="text-sm text-gray-600">Alert when tickets are approaching SLA deadline</span>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={preferences.slaReminders}
                    onChange={() => handleTogglePreference('slaReminders')}
                    className="w-5 h-5 text-blue-600 rounded" 
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-blue-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-blue-600" />
                    <div>
                      <span className="font-medium text-gray-900 block">Performance Updates</span>
                      <span className="text-sm text-gray-600">Weekly summary of your support metrics</span>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={preferences.performanceUpdates}
                    onChange={() => handleTogglePreference('performanceUpdates')}
                    className="w-5 h-5 text-blue-600 rounded" 
                  />
                </label>
              </div>
              <div className="mt-6">
                <button
                  onClick={handleSavePreferences}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>

          {/* Performance Stats */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">This Month</h2>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl">
                  <span className="text-sm text-gray-600">Tickets Resolved</span>
                  <p className="text-3xl font-bold text-blue-600 mt-1">142</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl">
                  <span className="text-sm text-gray-600">Avg Response Time</span>
                  <p className="text-3xl font-bold text-indigo-600 mt-1">2.1h</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl">
                  <span className="text-sm text-gray-600">Satisfaction Rate</span>
                  <p className="text-3xl font-bold text-purple-600 mt-1">96%</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl">
                  <span className="text-sm text-gray-600">Certificates Resent</span>
                  <p className="text-3xl font-bold text-pink-600 mt-1">38</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-3xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Top Performer</h3>
              <p className="text-blue-100 text-sm mb-4">You are in the top 10% of support staff this month!</p>
              <div className="flex items-center gap-2">
                <Award className="w-8 h-8" />
                <span className="text-2xl font-bold">⭐</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SupportStaffAppLayout>
  );
};

export default SupportProfilePage;
