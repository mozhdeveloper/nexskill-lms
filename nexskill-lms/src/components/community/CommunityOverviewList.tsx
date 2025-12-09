import React, { useState } from 'react';

interface Community {
  id: number;
  name: string;
  type: string;
  members: number;
  postsPerWeek: number;
  engagementRate: number;
  status: 'Active' | 'Quiet' | 'Growing';
  description?: string;
  topContributors?: string[];
  recentTopics?: string[];
}

interface CommunityOverviewListProps {
  limit?: number;
}

const CommunityOverviewList: React.FC<CommunityOverviewListProps> = ({ limit }) => {
  const [communities] = useState<Community[]>([
    { id: 1, name: 'JavaScript Mastery Community', type: 'Course', members: 342, postsPerWeek: 45, engagementRate: 72, status: 'Active', description: 'Learn and discuss JavaScript concepts, patterns, and best practices.', topContributors: ['Sarah M.', 'John C.', 'Emma W.'], recentTopics: ['React Hooks', 'TypeScript', 'Node.js'] },
    { id: 2, name: 'UI/UX Designers Hub', type: 'Course', members: 289, postsPerWeek: 38, engagementRate: 68, status: 'Active', description: 'Share designs, get feedback, and learn about UI/UX principles.', topContributors: ['Mike J.', 'Lisa D.', 'Alex B.'], recentTopics: ['Figma Tips', 'User Research', 'Design Systems'] },
    { id: 3, name: 'Product Management Circle', type: 'Course', members: 156, postsPerWeek: 22, engagementRate: 55, status: 'Growing', description: 'Product strategy, roadmaps, and PM career discussions.', topContributors: ['Tom W.', 'Jenny L.'], recentTopics: ['Roadmapping', 'User Stories', 'Metrics'] },
    { id: 4, name: 'Data Analytics Cohort', type: 'Cohort', members: 98, postsPerWeek: 12, engagementRate: 48, status: 'Quiet', description: 'Current cohort for the Data Analytics bootcamp.', topContributors: ['David K.'], recentTopics: ['SQL Queries', 'Python Pandas'] },
    { id: 5, name: 'General Discussion', type: 'General', members: 512, postsPerWeek: 67, engagementRate: 78, status: 'Active', description: 'Open forum for all members to connect and discuss various topics.', topContributors: ['Sarah M.', 'CM Alex', 'Coach Sarah'], recentTopics: ['Introductions', 'Career Advice', 'Study Tips'] },
    { id: 6, name: 'Career Development', type: 'General', members: 423, postsPerWeek: 34, engagementRate: 62, status: 'Active', description: 'Resume reviews, interview prep, and job search strategies.', topContributors: ['Coach Lisa', 'HR Team'], recentTopics: ['Resume Tips', 'Interview Prep', 'LinkedIn'] },
    { id: 7, name: 'Python Developers', type: 'Course', members: 267, postsPerWeek: 29, engagementRate: 58, status: 'Growing', description: 'Python programming community for learners of all levels.', topContributors: ['Coach Emma', 'Mike P.'], recentTopics: ['Decorators', 'OOP', 'Django'] },
    { id: 8, name: 'Mobile Dev Community', type: 'Course', members: 189, postsPerWeek: 18, engagementRate: 52, status: 'Quiet', description: 'iOS and Android development discussions.', topContributors: ['Coach Dan'], recentTopics: ['React Native', 'Swift', 'Flutter'] },
  ]);

  const [viewModal, setViewModal] = useState<Community | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ message: string } | null>(null);

  const displayCommunities = limit ? communities.slice(0, limit) : communities;

  const showFeedback = (message: string) => {
    setActionFeedback({ message });
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'Growing': return 'bg-blue-100 text-blue-700';
      case 'Quiet': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Course': return '📚';
      case 'Cohort': return '🎓';
      case 'General': return '💬';
      default: return '🏘️';
    }
  };

  return (
    <>
      {/* Action Feedback Toast */}
      {actionFeedback && (
        <div className="fixed top-4 right-4 z-[60] px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 bg-green-500 text-white">
          <span className="text-lg">✅</span>
          <p className="text-sm font-medium">{actionFeedback.message}</p>
          <button onClick={() => setActionFeedback(null)} className="text-white/80 hover:text-white">×</button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="p-6 space-y-3">
          {displayCommunities.map((community) => (
            <div
              key={community.id}
              className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
              onClick={() => setViewModal(community)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-2xl">{getTypeIcon(community.type)}</span>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-text-primary mb-1 hover:text-green-600 transition-colors">
                      {community.name}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                        {community.type}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded font-medium ${getStatusColor(community.status)}`}>
                        {community.status}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewModal(community);
                  }}
                  className="text-xs px-3 py-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors font-medium"
                >
                  View Details
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-text-primary">{community.members}</p>
                  <p className="text-xs text-text-muted">Members</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-text-primary">{community.postsPerWeek}</p>
                  <p className="text-xs text-text-muted">Posts/week</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-600">{community.engagementRate}%</p>
                  <p className="text-xs text-text-muted">Engagement</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* View Community Details Modal */}
      {viewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{getTypeIcon(viewModal.type)}</span>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">{viewModal.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">{viewModal.type}</span>
                      <span className={`text-xs px-2 py-1 rounded font-medium ${getStatusColor(viewModal.status)}`}>
                        {viewModal.status}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setViewModal(null)}
                  className="text-2xl text-text-muted hover:text-text-primary"
                >×</button>
              </div>

              {viewModal.description && (
                <p className="text-sm text-text-secondary mb-4">{viewModal.description}</p>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-text-primary">{viewModal.members}</p>
                  <p className="text-xs text-text-muted">Members</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-text-primary">{viewModal.postsPerWeek}</p>
                  <p className="text-xs text-text-muted">Posts/week</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{viewModal.engagementRate}%</p>
                  <p className="text-xs text-text-muted">Engagement</p>
                </div>
              </div>

              {/* Top Contributors */}
              {viewModal.topContributors && viewModal.topContributors.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-text-secondary mb-2">Top Contributors</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewModal.topContributors.map((contributor, idx) => (
                      <span key={idx} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                        ⭐ {contributor}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Topics */}
              {viewModal.recentTopics && viewModal.recentTopics.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-text-secondary mb-2">Trending Topics</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewModal.recentTopics.map((topic, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                        #{topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    showFeedback(`Navigating to ${viewModal.name}...`);
                    setViewModal(null);
                  }}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 text-sm font-medium"
                >
                  Visit Community
                </button>
                <button
                  onClick={() => {
                    showFeedback(`Opening analytics for ${viewModal.name}...`);
                    setViewModal(null);
                  }}
                  className="px-4 py-2 bg-white border border-gray-200 text-text-primary rounded-xl hover:bg-gray-50 text-sm font-medium"
                >
                  View Analytics
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CommunityOverviewList;
