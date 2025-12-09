import React, { useState } from 'react';

interface Group {
  id: number;
  name: string;
  linkedCourse: string;
  members: number;
  moderators: string[];
  status: 'Active' | 'Archived';
  postsCount: number;
  description?: string;
  createdAt?: string;
}

interface Post {
  id: number;
  title: string;
  author: string;
  date: string;
  likes: number;
  comments: number;
}

const CommunityGroupsList: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([
    { id: 1, name: 'React Hooks Study Group', linkedCourse: 'JavaScript Mastery', members: 45, moderators: ['Coach Sarah', 'CM Alex'], status: 'Active', postsCount: 128, description: 'A dedicated space for learning and discussing React Hooks patterns.', createdAt: '3 months ago' },
    { id: 2, name: 'Figma Design Challenge', linkedCourse: 'UI/UX Design', members: 38, moderators: ['Coach Mike'], status: 'Active', postsCount: 95, description: 'Weekly design challenges using Figma.', createdAt: '2 months ago' },
    { id: 3, name: 'Product Case Studies', linkedCourse: 'Product Management', members: 29, moderators: ['Coach Lisa', 'SubCoach Tom'], status: 'Active', postsCount: 67, description: 'Analyzing real-world product decisions.', createdAt: '4 months ago' },
    { id: 4, name: 'SQL Practice Group', linkedCourse: 'Data Analytics', members: 22, moderators: ['Coach John'], status: 'Active', postsCount: 54, description: 'SQL query practice and optimization tips.', createdAt: '1 month ago' },
    { id: 5, name: 'Python Beginners', linkedCourse: 'Python Fundamentals', members: 56, moderators: ['Coach Emma', 'CM Alex'], status: 'Active', postsCount: 142, description: 'Beginner-friendly Python learning community.', createdAt: '6 months ago' },
    { id: 6, name: 'Career Prep Circle', linkedCourse: 'General', members: 73, moderators: ['CM Alex'], status: 'Active', postsCount: 201, description: 'Resume reviews, interview prep, and career advice.', createdAt: '5 months ago' },
    { id: 7, name: 'Mobile Dev Q&A', linkedCourse: 'Mobile Development', members: 31, moderators: ['Coach Dan'], status: 'Active', postsCount: 78, description: 'Questions and answers about mobile development.', createdAt: '2 months ago' },
    { id: 8, name: 'Alumni Network', linkedCourse: 'General', members: 89, moderators: ['CM Alex', 'Coach Sarah'], status: 'Active', postsCount: 267, description: 'Connect with course graduates.', createdAt: '1 year ago' },
  ]);

  const [viewPostsModal, setViewPostsModal] = useState<Group | null>(null);
  const [settingsModal, setSettingsModal] = useState<Group | null>(null);
  const [settingsForm, setSettingsForm] = useState({ name: '', description: '', status: 'Active' as 'Active' | 'Archived' });
  const [actionFeedback, setActionFeedback] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Mock posts for the view posts modal
  const mockPosts: Post[] = [
    { id: 1, title: 'How to use useEffect properly?', author: 'John Smith', date: '2 hours ago', likes: 12, comments: 5 },
    { id: 2, title: 'My project showcase - feedback welcome!', author: 'Emma Wilson', date: '5 hours ago', likes: 28, comments: 14 },
    { id: 3, title: 'Best resources for learning?', author: 'Mike Johnson', date: '1 day ago', likes: 45, comments: 23 },
    { id: 4, title: 'Weekly challenge solution thread', author: 'Sarah Davis', date: '2 days ago', likes: 67, comments: 34 },
    { id: 5, title: 'Introducing myself - new member!', author: 'Alex Brown', date: '3 days ago', likes: 19, comments: 8 },
  ];

  const showFeedback = (message: string, type: 'success' | 'info' = 'success') => {
    setActionFeedback({ message, type });
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleOpenSettings = (group: Group) => {
    setSettingsForm({
      name: group.name,
      description: group.description || '',
      status: group.status,
    });
    setSettingsModal(group);
  };

  const handleSaveSettings = () => {
    if (settingsModal) {
      setGroups(prev => prev.map(g => 
        g.id === settingsModal.id 
          ? { ...g, name: settingsForm.name, description: settingsForm.description, status: settingsForm.status }
          : g
      ));
      showFeedback(`Group "${settingsForm.name}" settings updated`);
      setSettingsModal(null);
    }
  };

  const handleAddModerator = (groupId: number) => {
    const newModerator = prompt('Enter moderator name:');
    if (newModerator) {
      setGroups(prev => prev.map(g => 
        g.id === groupId 
          ? { ...g, moderators: [...g.moderators, newModerator] }
          : g
      ));
      showFeedback(`${newModerator} added as moderator`);
    }
  };

  const handleRemoveModerator = (groupId: number, moderator: string) => {
    setGroups(prev => prev.map(g => 
      g.id === groupId 
        ? { ...g, moderators: g.moderators.filter(m => m !== moderator) }
        : g
    ));
    showFeedback(`${moderator} removed from moderators`, 'info');
  };

  return (
    <>
      {/* Action Feedback Toast */}
      {actionFeedback && (
        <div className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 ${
          actionFeedback.type === 'success' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
        }`}>
          <span className="text-lg">{actionFeedback.type === 'success' ? '✅' : 'ℹ️'}</span>
          <p className="text-sm font-medium">{actionFeedback.message}</p>
          <button onClick={() => setActionFeedback(null)} className="text-white/80 hover:text-white">×</button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Group</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Linked Course</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Members</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Moderators</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Posts</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {groups.map((group) => (
                <tr key={group.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">👥</span>
                      <div>
                        <span className="text-sm font-medium text-text-primary block">{group.name}</span>
                        {group.description && (
                          <span className="text-xs text-text-muted line-clamp-1">{group.description}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-text-secondary">{group.linkedCourse}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-text-primary">{group.members}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {group.moderators.slice(0, 2).map((mod, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded">
                          {mod}
                        </span>
                      ))}
                      {group.moderators.length > 2 && (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                          +{group.moderators.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-text-secondary">{group.postsCount}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                      group.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {group.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setViewPostsModal(group)}
                        className="text-xs px-3 py-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors font-medium"
                      >
                        View Posts
                      </button>
                      <button
                        onClick={() => handleOpenSettings(group)}
                        className="text-xs px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                      >
                        Settings
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Posts Modal */}
      {viewPostsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-text-primary mb-1">
                    {viewPostsModal.name}
                  </h3>
                  <p className="text-sm text-text-muted">
                    {viewPostsModal.postsCount} posts • {viewPostsModal.members} members
                  </p>
                </div>
                <button
                  onClick={() => setViewPostsModal(null)}
                  className="text-2xl text-text-muted hover:text-text-primary"
                >×</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <h4 className="text-sm font-semibold text-text-secondary mb-3">Recent Posts</h4>
              <div className="space-y-3">
                {mockPosts.map((post) => (
                  <div key={post.id} className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                    <h5 className="text-sm font-medium text-text-primary mb-2">{post.title}</h5>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <span>by {post.author}</span>
                        <span>•</span>
                        <span>{post.date}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-red-500">
                          ❤️ {post.likes}
                        </span>
                        <span className="flex items-center gap-1 text-blue-500">
                          💬 {post.comments}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  showFeedback('Opening full post list...', 'info');
                  setViewPostsModal(null);
                }}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 text-sm font-medium"
              >
                View All {viewPostsModal.postsCount} Posts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {settingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-text-primary">Group Settings</h3>
                <button
                  onClick={() => setSettingsModal(null)}
                  className="text-2xl text-text-muted hover:text-text-primary"
                >×</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Group Name</label>
                  <input
                    type="text"
                    value={settingsForm.name}
                    onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                  <textarea
                    value={settingsForm.description}
                    onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
                  <select
                    value={settingsForm.status}
                    onChange={(e) => setSettingsForm({ ...settingsForm, status: e.target.value as 'Active' | 'Archived' })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-text-secondary">Moderators</label>
                    <button
                      onClick={() => handleAddModerator(settingsModal.id)}
                      className="text-xs text-green-600 hover:text-green-700 font-medium"
                    >
                      + Add Moderator
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {groups.find(g => g.id === settingsModal.id)?.moderators.map((mod, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs"
                      >
                        {mod}
                        <button
                          onClick={() => handleRemoveModerator(settingsModal.id, mod)}
                          className="text-green-600 hover:text-red-500 ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-text-muted mb-1">Linked Course: {settingsModal.linkedCourse}</p>
                  <p className="text-xs text-text-muted">Created: {settingsModal.createdAt}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => setSettingsModal(null)}
                  className="px-4 py-2 bg-white border border-gray-200 text-text-primary rounded-xl hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 text-sm font-medium"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CommunityGroupsList;
