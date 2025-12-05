import React, { useState } from 'react';
import OrgOwnerAppLayout from '../../layouts/OrgOwnerAppLayout';
import OrgAnalyticsOverview from '../../components/org/OrgAnalyticsOverview';

const OrgAnalyticsPage: React.FC = () => {
  const [timeframe, setTimeframe] = useState('30');
  const [selectedCourse, setSelectedCourse] = useState('all');

  const courses = [
    'JavaScript Fundamentals',
    'Product Management Basics',
    'Data Analytics with Python',
    'UI/UX Design Principles',
  ];

  const handleDownloadReport = () => {
    console.log('Downloading analytics report...');
    alert('Analytics report download started!');
  };

  return (
    <OrgOwnerAppLayout>
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#EDF0FB]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-1">Organization Analytics</h1>
            <p className="text-sm text-text-secondary">
              Analytics specific to your organization's learners and performance
            </p>
          </div>
          <button 
            onClick={handleDownloadReport}
            className="px-4 py-2 bg-white border border-gray-200 text-text-primary rounded-xl hover:bg-gray-50 transition-all text-sm font-medium"
          >
            📥 Download Report
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-primary">Filters:</span>
              </div>
              
              {/* Timeframe Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-text-secondary">Timeframe:</label>
                <div className="flex gap-2">
                  {['30', '90', '365'].map((days) => (
                    <button
                      key={days}
                      onClick={() => setTimeframe(days)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        timeframe === days
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                          : 'bg-gray-100 text-text-primary hover:bg-gray-200'
                      }`}
                    >
                      {days === '30' ? '30 Days' : days === '90' ? '90 Days' : '12 Months'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Course Filter */}
              <div className="flex items-center gap-2 ml-auto">
                <label className="text-sm text-text-secondary">Course:</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                >
                  <option value="all">All Courses</option>
                  {courses.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
                  ✅
                </div>
                <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded-full">
                  ↑ 12%
                </span>
              </div>
              <p className="text-sm text-text-muted mb-1">Completion Rate</p>
              <p className="text-3xl font-bold text-text-primary">78%</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
                  ⏱️
                </div>
                <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                  ↑ 8%
                </span>
              </div>
              <p className="text-sm text-text-muted mb-1">Avg Time to Complete</p>
              <p className="text-3xl font-bold text-text-primary">6.2</p>
              <p className="text-xs text-text-muted">weeks</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">
                  🎯
                </div>
                <span className="text-xs font-semibold px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                  ↑ 15%
                </span>
              </div>
              <p className="text-sm text-text-muted mb-1">Engagement Score</p>
              <p className="text-3xl font-bold text-text-primary">8.4</p>
              <p className="text-xs text-text-muted">out of 10</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl">
                  ⭐
                </div>
                <span className="text-xs font-semibold px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                  ↑ 3%
                </span>
              </div>
              <p className="text-sm text-text-muted mb-1">Satisfaction Rate</p>
              <p className="text-3xl font-bold text-text-primary">4.7</p>
              <p className="text-xs text-text-muted">out of 5</p>
            </div>
          </div>

          {/* Analytics Overview */}
          <OrgAnalyticsOverview compact={false} />

          {/* Additional Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Learning Hours */}
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
              <h3 className="text-base font-bold text-text-primary mb-4">Total Learning Hours</h3>
              <div className="flex items-end justify-between gap-2 h-48">
                {[
                  { month: 'Jul', hours: 320 },
                  { month: 'Aug', hours: 380 },
                  { month: 'Sep', hours: 350 },
                  { month: 'Oct', hours: 420 },
                  { month: 'Nov', hours: 460 },
                  { month: 'Dec', hours: 510 },
                ].map((item, index) => {
                  const maxHours = 510;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex items-end justify-center" style={{ height: '150px' }}>
                        <div
                          className="w-full bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t-lg transition-all hover:opacity-80 relative group"
                          style={{ height: `${(item.hours / maxHours) * 100}%` }}
                        >
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                              {item.hours}h
                            </div>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-text-muted font-medium">{item.month}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Total this period:</span>
                  <span className="text-lg font-bold text-blue-600">2,440 hours</span>
                </div>
              </div>
            </div>

            {/* Certification Rate */}
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
              <h3 className="text-base font-bold text-text-primary mb-4">Certification Distribution</h3>
              <div className="space-y-4 mb-6">
                {[
                  { name: 'JavaScript Fundamentals', certified: 28, total: 34, color: 'from-blue-500 to-cyan-400' },
                  { name: 'Product Management', certified: 22, total: 28, color: 'from-green-500 to-emerald-400' },
                  { name: 'Data Analytics', certified: 18, total: 31, color: 'from-purple-500 to-pink-400' },
                  { name: 'UI/UX Design', certified: 19, total: 26, color: 'from-orange-500 to-red-400' },
                ].map((course, index) => {
                  const percentage = (course.certified / course.total) * 100;
                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-text-primary">{course.name}</span>
                        <span className="text-sm font-bold text-text-primary">
                          {course.certified}/{course.total}
                        </span>
                      </div>
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${course.color} rounded-full transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Overall certification rate:</span>
                  <span className="text-lg font-bold text-orange-600">73%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                🎯
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-text-primary mb-3">Key Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/80 rounded-xl p-4">
                    <p className="text-sm font-semibold text-green-800 mb-1">✓ Strong Performance</p>
                    <p className="text-xs text-text-secondary">
                      Your completion rate is 12% higher than the platform average
                    </p>
                  </div>
                  <div className="bg-white/80 rounded-xl p-4">
                    <p className="text-sm font-semibold text-blue-800 mb-1">📈 Growth Trend</p>
                    <p className="text-xs text-text-secondary">
                      Active learners increased by 8 this month, maintaining upward momentum
                    </p>
                  </div>
                  <div className="bg-white/80 rounded-xl p-4">
                    <p className="text-sm font-semibold text-orange-800 mb-1">⚠️ Attention Needed</p>
                    <p className="text-xs text-text-secondary">
                      8 learners haven't logged in for 5+ days - consider re-engagement
                    </p>
                  </div>
                  <div className="bg-white/80 rounded-xl p-4">
                    <p className="text-sm font-semibold text-purple-800 mb-1">🏆 Top Course</p>
                    <p className="text-xs text-text-secondary">
"JavaScript Fundamentals" has the highest completion rate at 92%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </OrgOwnerAppLayout>
  );
};

export default OrgAnalyticsPage;
