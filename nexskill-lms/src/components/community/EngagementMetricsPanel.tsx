import React, { useState } from 'react';

interface TopCommunity {
  name: string;
  engagement: number;
  posts: number;
  comments: number;
}

interface Contributor {
  name: string;
  posts: number;
  comments: number;
  helpfulVotes: number;
  avatar?: string;
  email?: string;
  joinedDate?: string;
}

const EngagementMetricsPanel: React.FC = () => {
  const [selectedCommunity, setSelectedCommunity] = useState<TopCommunity | null>(null);
  const [selectedContributor, setSelectedContributor] = useState<Contributor | null>(null);
  const [selectedDay, setSelectedDay] = useState<{ day: string; posts: number; comments: number } | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const topCommunities: TopCommunity[] = [
    { name: 'General Discussion', engagement: 78, posts: 67, comments: 234 },
    { name: 'JavaScript Mastery', engagement: 72, posts: 45, comments: 189 },
    { name: 'Career Development', engagement: 62, posts: 34, comments: 156 },
    { name: 'UI/UX Designers Hub', engagement: 68, posts: 38, comments: 167 },
  ];

  const topContributors: Contributor[] = [
    { name: 'Sarah Martinez', posts: 23, comments: 89, helpfulVotes: 156, email: 'sarah.m@example.com', joinedDate: '6 months ago' },
    { name: 'John Chen', posts: 18, comments: 67, helpfulVotes: 134, email: 'john.c@example.com', joinedDate: '1 year ago' },
    { name: 'Emma Wilson', posts: 15, comments: 54, helpfulVotes: 98, email: 'emma.w@example.com', joinedDate: '3 months ago' },
    { name: 'Mike Johnson', posts: 12, comments: 43, helpfulVotes: 87, email: 'mike.j@example.com', joinedDate: '8 months ago' },
    { name: 'Lisa Davis', posts: 11, comments: 39, helpfulVotes: 76, email: 'lisa.d@example.com', joinedDate: '4 months ago' },
  ];

  const dailyMetrics = [
    { day: 'Mon', posts: 45, comments: 178 },
    { day: 'Tue', posts: 52, comments: 201 },
    { day: 'Wed', posts: 48, comments: 189 },
    { day: 'Thu', posts: 61, comments: 234 },
    { day: 'Fri', posts: 58, comments: 212 },
    { day: 'Sat', posts: 32, comments: 134 },
    { day: 'Sun', posts: 28, comments: 98 },
  ];

  const maxPosts = Math.max(...dailyMetrics.map(d => d.posts));

  const showFeedback = (message: string) => {
    setActionFeedback(message);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  return (
    <>
      {/* Action Feedback Toast */}
      {actionFeedback && (
        <div className="fixed top-4 right-4 z-[60] px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 bg-green-500 text-white">
          <span className="text-lg">✅</span>
          <p className="text-sm font-medium">{actionFeedback}</p>
          <button onClick={() => setActionFeedback(null)} className="text-white/80 hover:text-white">×</button>
        </div>
      )}

      <div className="space-y-6">
        {/* Daily Activity Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-text-primary">Daily Activity (Last 7 Days)</h3>
            <button
              onClick={() => showFeedback('Exporting weekly report...')}
              className="text-xs px-3 py-1 text-green-600 hover:bg-green-50 rounded-lg font-medium transition-colors"
            >
              Export Report
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-end gap-2 h-48">
              {dailyMetrics.map((metric, idx) => (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center gap-2 cursor-pointer group"
                  onClick={() => setSelectedDay(metric)}
                >
                  <div className="w-full flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-gradient-to-t from-green-500 to-teal-500 rounded-t-lg transition-all group-hover:from-green-600 group-hover:to-teal-600 group-hover:shadow-lg"
                      style={{ height: `${(metric.posts / maxPosts) * 150}px` }}
                    ></div>
                    <span className="text-xs font-semibold text-green-600">{metric.posts}</span>
                  </div>
                  <span className="text-xs text-text-muted font-medium group-hover:text-green-600 transition-colors">{metric.day}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-br from-green-500 to-teal-500 rounded"></div>
                <span className="text-text-secondary">Posts per day (click bar for details)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Communities */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <h3 className="text-base font-bold text-text-primary mb-4">Top Communities by Engagement</h3>
            <div className="space-y-3">
              {topCommunities.map((community, idx) => (
                <div
                  key={idx}
                  className="cursor-pointer hover:bg-gray-50 rounded-xl p-2 -mx-2 transition-colors"
                  onClick={() => setSelectedCommunity(community)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-text-primary hover:text-green-600 transition-colors">
                      {community.name}
                    </span>
                    <span className="text-sm font-bold text-green-600">{community.engagement}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                    <div
                      className="bg-gradient-to-r from-green-500 to-teal-500 h-2 rounded-full transition-all"
                      style={{ width: `${community.engagement}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-muted">
                    <span>📝 {community.posts} posts</span>
                    <span>💬 {community.comments} comments</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Contributors */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-text-primary">Top Contributors</h3>
              <button
                onClick={() => showFeedback('Opening contributor leaderboard...')}
                className="text-xs px-3 py-1 text-green-600 hover:bg-green-50 rounded-lg font-medium transition-colors"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {topContributors.map((contributor, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setSelectedContributor(contributor)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-teal-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        #{idx + 1}
                      </div>
                      <span className="text-sm font-semibold text-text-primary hover:text-green-600 transition-colors">
                        {contributor.name}
                      </span>
                    </div>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
                      ⭐ {contributor.helpfulVotes}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-muted ml-10">
                    <span>📝 {contributor.posts} posts</span>
                    <span>💬 {contributor.comments} comments</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-6 border border-green-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-text-primary">Weekly Summary</h3>
            <button
              onClick={() => showFeedback('Generating detailed weekly analysis...')}
              className="text-xs px-3 py-1 bg-white text-green-600 hover:bg-green-50 rounded-lg font-medium transition-colors border border-green-200"
            >
              Generate Report
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div
              className="text-center cursor-pointer hover:bg-white/50 rounded-xl p-2 transition-colors"
              onClick={() => showFeedback('Viewing all 324 posts from this week...')}
            >
              <p className="text-3xl font-bold text-green-700">324</p>
              <p className="text-xs text-text-muted mt-1">Total Posts</p>
            </div>
            <div
              className="text-center cursor-pointer hover:bg-white/50 rounded-xl p-2 transition-colors"
              onClick={() => showFeedback('Viewing all 1,246 comments from this week...')}
            >
              <p className="text-3xl font-bold text-teal-700">1,246</p>
              <p className="text-xs text-text-muted mt-1">Total Comments</p>
            </div>
            <div
              className="text-center cursor-pointer hover:bg-white/50 rounded-xl p-2 transition-colors"
              onClick={() => showFeedback('Viewing 847 active users...')}
            >
              <p className="text-3xl font-bold text-blue-700">847</p>
              <p className="text-xs text-text-muted mt-1">Active Users</p>
            </div>
            <div
              className="text-center cursor-pointer hover:bg-white/50 rounded-xl p-2 transition-colors"
              onClick={() => showFeedback('Opening engagement analytics...')}
            >
              <p className="text-3xl font-bold text-purple-700">68%</p>
              <p className="text-xs text-text-muted mt-1">Avg Engagement</p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Detail Modal */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-text-primary">{selectedDay.day} Activity</h3>
                  <p className="text-sm text-text-muted">Detailed breakdown</p>
                </div>
                <button onClick={() => setSelectedDay(null)} className="text-2xl text-text-muted hover:text-text-primary">×</button>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-green-50 rounded-xl text-center">
                  <p className="text-3xl font-bold text-green-600">{selectedDay.posts}</p>
                  <p className="text-sm text-text-muted">Posts</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl text-center">
                  <p className="text-3xl font-bold text-blue-600">{selectedDay.comments}</p>
                  <p className="text-sm text-text-muted">Comments</p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl mb-4">
                <p className="text-sm text-text-secondary">
                  <strong>Engagement Rate:</strong> {Math.round((selectedDay.comments / selectedDay.posts) * 10) / 10} comments per post
                </p>
                <p className="text-sm text-text-secondary mt-1">
                  <strong>Peak Hours:</strong> 10am - 2pm, 7pm - 9pm
                </p>
              </div>
              <button
                onClick={() => {
                  showFeedback(`Viewing ${selectedDay.day} detailed analytics...`);
                  setSelectedDay(null);
                }}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 text-sm font-medium"
              >
                View Full Analytics
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Community Detail Modal */}
      {selectedCommunity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-text-primary">{selectedCommunity.name}</h3>
                <button onClick={() => setSelectedCommunity(null)} className="text-2xl text-text-muted hover:text-text-primary">×</button>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="p-3 bg-green-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-green-600">{selectedCommunity.engagement}%</p>
                  <p className="text-xs text-text-muted">Engagement</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-blue-600">{selectedCommunity.posts}</p>
                  <p className="text-xs text-text-muted">Posts</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-purple-600">{selectedCommunity.comments}</p>
                  <p className="text-xs text-text-muted">Comments</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    showFeedback(`Opening ${selectedCommunity.name}...`);
                    setSelectedCommunity(null);
                  }}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 text-sm font-medium"
                >
                  Visit Community
                </button>
                <button
                  onClick={() => {
                    showFeedback(`Opening analytics for ${selectedCommunity.name}...`);
                    setSelectedCommunity(null);
                  }}
                  className="px-4 py-2 bg-white border border-gray-200 text-text-primary rounded-xl hover:bg-gray-50 text-sm font-medium"
                >
                  Analytics
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contributor Detail Modal */}
      {selectedContributor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-400 rounded-full flex items-center justify-center text-white text-lg font-bold">
                    {selectedContributor.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">{selectedContributor.name}</h3>
                    <p className="text-xs text-text-muted">Member since {selectedContributor.joinedDate}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedContributor(null)} className="text-2xl text-text-muted hover:text-text-primary">×</button>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="p-3 bg-blue-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-blue-600">{selectedContributor.posts}</p>
                  <p className="text-xs text-text-muted">Posts</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-purple-600">{selectedContributor.comments}</p>
                  <p className="text-xs text-text-muted">Comments</p>
                </div>
                <div className="p-3 bg-green-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-green-600">{selectedContributor.helpfulVotes}</p>
                  <p className="text-xs text-text-muted">Helpful</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    showFeedback(`Viewing ${selectedContributor.name}'s profile...`);
                    setSelectedContributor(null);
                  }}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 text-sm font-medium"
                >
                  View Profile
                </button>
                <button
                  onClick={() => {
                    showFeedback(`Sending message to ${selectedContributor.name}...`);
                    setSelectedContributor(null);
                  }}
                  className="px-4 py-2 bg-white border border-gray-200 text-text-primary rounded-xl hover:bg-gray-50 text-sm font-medium"
                >
                  Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EngagementMetricsPanel;
