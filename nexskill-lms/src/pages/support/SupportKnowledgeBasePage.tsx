import { useState } from 'react';
import SupportStaffAppLayout from '../../layouts/SupportStaffAppLayout';
import KnowledgeBaseList from '../../components/support/KnowledgeBaseList';

const SupportKnowledgeBasePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newArticle, setNewArticle] = useState({
    title: '',
    category: 'technical',
    content: '',
    tags: ''
  });

  const handleViewArticle = (articleId: string) => {
    console.log('Viewing article:', articleId);
    setShowArticleModal(true);
  };

  const handleCreateArticle = () => {
    console.log('Creating article:', newArticle);
    alert('Article created successfully!');
    setShowCreateModal(false);
    setNewArticle({ title: '', category: 'technical', content: '', tags: '' });
  };

  const handleBookmark = (articleId: string) => {
    alert(`🔖 Article Bookmarked\n\nArticle ID: ${articleId}\n\n✅ Saved to Your Bookmarks:\n• Quick access from sidebar\n• Offline availability\n• Sync across devices\n\n📚 Your Bookmark Collections:\n• Technical Issues (12 articles)\n• Account Support (8 articles)\n• Billing & Payments (5 articles)\n• Course Access (15 articles)\n\nAccess all bookmarks from the 'My Bookmarks' section.`);
  };

  const handleRateArticle = (articleId: string, rating: number) => {
    alert(`⭐ Article Rated: ${rating} stars\n\nArticle ID: ${articleId}\n\n📊 Your Feedback:\n• Your rating: ${rating}/5 stars\n• Average rating: 4.2/5\n• Total ratings: 48\n\n✅ Impact:\n• Helps improve content quality\n• Guides future article updates\n• Assists other support staff\n\n💡 Tip: Add a comment to help the author understand your rating and improve the article further.`);
  };

  return (
    <SupportStaffAppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Knowledge Base</h1>
              <p className="text-gray-600">Search and browse support articles and troubleshooting guides</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full hover:shadow-lg transition-all font-semibold"
            >
              + New Article
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔍 Search articles by title, keywords, or tags..."
                className="w-full px-4 py-3 bg-gray-50 rounded-full text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 bg-gray-50 rounded-full text-sm text-gray-700 border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Categories</option>
              <option value="technical">Technical Issues</option>
              <option value="billing">Billing & Payments</option>
              <option value="account">Account Management</option>
              <option value="courses">Course Content</option>
              <option value="certificates">Certificates</option>
              <option value="general">General</option>
            </select>
          </div>

          {/* Quick Filters */}
          <div className="flex gap-2 flex-wrap">
            <button className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors">
              ⭐ Most Helpful
            </button>
            <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors">
              🆕 Recently Added
            </button>
            <button className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium hover:bg-green-200 transition-colors">
              📚 Frequently Viewed
            </button>
            <button className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium hover:bg-yellow-200 transition-colors">
              🔖 My Bookmarks
            </button>
          </div>
        </div>

        {/* Knowledge Base List */}
        <KnowledgeBaseList 
          onViewArticle={handleViewArticle}
          onBookmark={handleBookmark}
        />
      </div>

      {/* View Article Modal */}
      {showArticleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">How to Reset Student Password</h2>
              <button
                onClick={() => setShowArticleModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">Account Management</span>
                <span className="text-sm text-gray-600">Updated Nov 25, 2024</span>
                <span className="text-sm text-gray-600">• 324 views</span>
              </div>

              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  This guide explains how to reset a student's password when they cannot access their account...
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mt-4">Step 1: Verify Student Identity</h3>
                <p className="text-gray-700">Before resetting a password, verify the student's identity by...</p>
                <h3 className="text-lg font-semibold text-gray-900 mt-4">Step 2: Navigate to Student Accounts</h3>
                <p className="text-gray-700">Go to the Support Dashboard and select "Student Accounts"...</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Was this article helpful?</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRateArticle('article-1', star)}
                        className="text-2xl hover:scale-110 transition-transform"
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => handleBookmark('article-1')}
                  className="px-4 py-2 bg-purple-50 text-purple-700 font-medium rounded-lg hover:bg-purple-100 transition-colors"
                >
                  🔖 Bookmark
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Article Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create New Article</h2>
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
                  Article Title
                </label>
                <input
                  type="text"
                  value={newArticle.title}
                  onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                  placeholder="Clear, descriptive title"
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={newArticle.category}
                  onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="technical">Technical Issues</option>
                  <option value="billing">Billing & Payments</option>
                  <option value="account">Account Management</option>
                  <option value="courses">Course Content</option>
                  <option value="certificates">Certificates</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  rows={10}
                  value={newArticle.content}
                  onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                  placeholder="Write your article content here..."
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={newArticle.tags}
                  onChange={(e) => setNewArticle({ ...newArticle, tags: e.target.value })}
                  placeholder="password, reset, account, login"
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateArticle}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  Publish Article
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SupportStaffAppLayout>
  );
};

export default SupportKnowledgeBasePage;
