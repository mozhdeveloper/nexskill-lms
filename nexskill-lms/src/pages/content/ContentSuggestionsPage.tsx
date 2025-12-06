import React, { useState } from 'react';
import ContentEditorLayout from '../../layouts/ContentEditorLayout';
import ContentSuggestionsList from '../../components/content/ContentSuggestionsList';

const ContentSuggestionsPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSuggestion, setNewSuggestion] = useState({
    course: '',
    title: '',
    description: '',
    priority: 'medium',
    category: 'content'
  });

  const handleCreateSuggestion = () => {
    console.log('Creating suggestion:', newSuggestion);
    alert('Suggestion submitted successfully!');
    setShowCreateModal(false);
    setNewSuggestion({ course: '', title: '', description: '', priority: 'medium', category: 'content' });
  };

  return (
    <ContentEditorLayout>
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#EDF0FB]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-1">Content Suggestions</h1>
            <p className="text-sm text-text-secondary">
              Track suggestions you have submitted to coaches
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:shadow-lg transition-all text-sm font-semibold"
            >
              ✏️ New Suggestion
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-muted">Total Suggestions</span>
                <span className="text-2xl">💡</span>
              </div>
              <p className="text-2xl font-bold text-text-primary">23</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-muted">Pending</span>
                <span className="text-2xl">⏳</span>
              </div>
              <p className="text-2xl font-bold text-amber-600">8</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-muted">Accepted</span>
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-2xl font-bold text-green-600">12</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-muted">Acceptance Rate</span>
                <span className="text-2xl">📊</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">52%</p>
            </div>
          </div>

          {/* Suggestions List */}
          <ContentSuggestionsList />

          {/* Suggestion Impact */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <h3 className="text-base font-bold text-text-primary mb-4">Your Impact</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🎯</span>
                  <span className="text-sm text-text-muted">Courses Improved</span>
                </div>
                <p className="text-2xl font-bold text-green-700">8</p>
                <p className="text-xs text-text-muted mt-1">Your suggestions enhanced 8 courses</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">👥</span>
                  <span className="text-sm text-text-muted">Learners Reached</span>
                </div>
                <p className="text-2xl font-bold text-blue-700">1,240</p>
                <p className="text-xs text-text-muted mt-1">Students benefiting from changes</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">⭐</span>
                  <span className="text-sm text-text-muted">Quality Score</span>
                </div>
                <p className="text-2xl font-bold text-purple-700">4.7</p>
                <p className="text-xs text-text-muted mt-1">Average coach rating</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <h3 className="text-base font-bold text-text-primary mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {[
                { action: 'Accepted', course: 'JavaScript Mastery', suggestion: 'Add real-world debugging examples', time: '2 hours ago', type: 'success' },
                { action: 'Under Review', course: 'UI/UX Design', suggestion: 'Include Figma prototyping tutorial', time: '5 hours ago', type: 'pending' },
                { action: 'Accepted', course: 'Product Management', suggestion: 'Update sprint planning module', time: '1 day ago', type: 'success' },
                { action: 'Feedback Received', course: 'Data Analytics', suggestion: 'Expand SQL advanced topics', time: '2 days ago', type: 'info' },
              ].map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <span className="text-xl">
                    {activity.type === 'success' ? '✅' : activity.type === 'pending' ? '⏳' : '💬'}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{activity.suggestion}</p>
                    <p className="text-xs text-text-muted">{activity.course} • {activity.action} • {activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips Section */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                💡
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary mb-2">Writing Great Suggestions</h3>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">•</span>
                    <span>Be specific about what needs to change and why</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">•</span>
                    <span>Include data or learner feedback when available</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">•</span>
                    <span>Suggest concrete improvements rather than just pointing out issues</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">•</span>
                    <span>Consider the learner perspective and overall course flow</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Suggestion Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">New Content Suggestion</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course
                </label>
                <select
                  value={newSuggestion.course}
                  onChange={(e) => setNewSuggestion({ ...newSuggestion, course: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Select a course</option>
                  <option value="JavaScript Mastery">JavaScript Mastery</option>
                  <option value="UI/UX Design">UI/UX Design</option>
                  <option value="Product Management">Product Management</option>
                  <option value="Data Analytics">Data Analytics</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suggestion Title
                </label>
                <input
                  type="text"
                  value={newSuggestion.title}
                  onChange={(e) => setNewSuggestion({ ...newSuggestion, title: e.target.value })}
                  placeholder="Brief, clear title for your suggestion"
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={newSuggestion.category}
                    onChange={(e) => setNewSuggestion({ ...newSuggestion, category: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="content">Content Improvement</option>
                    <option value="structure">Course Structure</option>
                    <option value="resources">Additional Resources</option>
                    <option value="quiz">Quiz/Assessment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={newSuggestion.priority}
                    onChange={(e) => setNewSuggestion({ ...newSuggestion, priority: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Description
                </label>
                <textarea
                  rows={6}
                  value={newSuggestion.description}
                  onChange={(e) => setNewSuggestion({ ...newSuggestion, description: e.target.value })}
                  placeholder="Explain your suggestion in detail. Include why it would improve the course and how it benefits learners..."
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border-2 border-amber-200">
                <p className="text-sm text-amber-800">
                  💡 <strong>Tip:</strong> Great suggestions are specific, actionable, and explain the benefit to learners.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSuggestion}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  Submit Suggestion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ContentEditorLayout>
  );
};

export default ContentSuggestionsPage;
