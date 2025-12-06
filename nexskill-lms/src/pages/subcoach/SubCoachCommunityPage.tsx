import React, { useState } from 'react';
import SubCoachAppLayout from '../../layouts/SubCoachAppLayout';

const SubCoachCommunityPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'recent' | 'reported'>('recent');
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showReportedModal, setShowReportedModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [moderationNote, setModerationNote] = useState('');


  // Dummy recent posts
  const recentPosts = [
    {
      id: '1',
      author: 'Alex Martinez',
      courseName: 'UI Design Fundamentals',
      content: 'Can someone explain the difference between RGB and CMYK color models?',
      timestamp: '10 minutes ago',
      replies: 3,
      likes: 5,
    },
    {
      id: '2',
      author: 'Emma Wilson',
      courseName: 'JavaScript Mastery',
      content: 'Just finished the async/await module. This is a game changer!',
      timestamp: '45 minutes ago',
      replies: 8,
      likes: 12,
    },
    {
      id: '3',
      author: 'David Lee',
      courseName: 'Product Management',
      content: 'Looking for feedback on my product roadmap assignment. Anyone willing to review?',
      timestamp: '2 hours ago',
      replies: 2,
      likes: 4,
    },
  ];

  // Dummy reported content
  const reportedContent = [
    {
      id: '1',
      author: 'Anonymous User',
      courseName: 'UI Design Fundamentals',
      content: '[Potentially inappropriate content flagged by student]',
      reportedBy: 'Sarah Johnson',
      reportReason: 'Off-topic spam',
      timestamp: '1 hour ago',
      status: 'Pending' as const,
    },
    {
      id: '2',
      author: 'Another User',
      courseName: 'JavaScript Mastery',
      content: '[Content under review]',
      reportedBy: 'Michael Chen',
      reportReason: 'Inappropriate language',
      timestamp: '3 hours ago',
      status: 'Under Review' as const,
    },
  ];

  const handleReplyToPost = (postId: string) => {
    setSelectedPost(postId);
    setShowReplyModal(true);
  };

  const handleSubmitReply = () => {
    const post = recentPosts.find((p) => p.id === selectedPost);
    window.alert(`✅ Reply Posted Successfully\n\nOriginal Post: ${post?.content.substring(0, 50)}...\nAuthor: ${post?.author}\n\n💬 Your Reply:\n${replyText}\n\n📊 Engagement:\n• Visibility: Public\n• Notifications: Sent to author\n• Thread: Updated\n\n📧 Author Notification:\n• Email: Sent\n• In-app: Delivered\n• Can reply directly\n\n💡 Your reply helps foster discussion and supports student learning. Continue engaging with the community!`);
    setShowReplyModal(false);
    setReplyText('');
    setSelectedPost(null);
  };

  const handleRemovePost = (postId: string) => {
    const item = reportedContent.find((i) => i.id === postId);
    window.alert(`❌ Post Removed Successfully\n\nAuthor: ${item?.author}\nReported by: ${item?.reportedBy}\nReason: ${item?.reportReason}\n\n📝 Moderation Note:\n${moderationNote || 'Violated community guidelines'}\n\n📊 Actions Taken:\n• Post removed from community\n• Author notified via email\n• Supervising coach informed\n• Incident logged\n\n⚠️ Author Impact:\n• Warning issued: Yes\n• Account status: Under review\n• Future violations: Will escalate\n\n💡 Clear moderation helps maintain a safe and respectful learning environment.`);
    setShowReportedModal(false);
    setModerationNote('');
  };

  const handleApprovePost = (postId: string) => {
    const item = reportedContent.find((i) => i.id === postId);
    window.alert(`✅ Post Approved\n\nAuthor: ${item?.author}\nReported by: ${item?.reportedBy}\nOriginal reason: ${item?.reportReason}\n\n📋 Review Decision:\n• Content reviewed: Compliant\n• Community guidelines: Met\n• Educational value: Positive\n• Post status: Approved\n\n📊 Actions Taken:\n• Post remains visible\n• Report dismissed\n• Author notified\n• Reporter informed of decision\n\n💡 The post contributes positively to the learning community and does not violate guidelines.`);
    setShowReportedModal(false);
  };

  const handleEscalate = (postId: string) => {
    const item = reportedContent.find((i) => i.id === postId);
    window.alert(`⬆️ Escalated to Supervising Coach\n\nAuthor: ${item?.author}\nReported by: ${item?.reportedBy}\nReason: ${item?.reportReason}\n\n📝 Your Note:\n${moderationNote || 'Requires coach review'}\n\n📊 Escalation Details:\n• Priority: High\n• Coach notified: Yes\n• Case ID: ESC-${Date.now()}\n• Response time: 24-48 hours\n\n⚙️ Next Steps:\n• Coach will review the case\n• Final decision will be made\n• You'll be notified of outcome\n• Post temporarily hidden\n\n💡 Escalate when you need guidance or the issue requires higher authority.`);
    setShowReportedModal(false);
    setModerationNote('');
  };

  return (
    <SubCoachAppLayout>
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#EDF0FB]">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Community Moderation</h1>
          <p className="text-sm text-text-secondary">
            Monitor and moderate community discussions
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-[#EDF0FB]">
              <div className="text-2xl font-bold text-text-primary">{recentPosts.length}</div>
              <div className="text-xs text-text-secondary mt-1">Recent Posts (24h)</div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-5 border border-amber-200">
              <div className="text-2xl font-bold text-amber-700">{reportedContent.length}</div>
              <div className="text-xs text-amber-600 mt-1">Reported Content</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-200">
              <div className="text-2xl font-bold text-green-700">
                {recentPosts.reduce((sum, post) => sum + post.replies, 0)}
              </div>
              <div className="text-xs text-green-600 mt-1">Total Replies</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl border border-[#EDF0FB]">
            <div className="border-b border-[#EDF0FB] px-6 pt-6">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('recent')}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    activeTab === 'recent'
                      ? 'bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-700 border-b-2 border-teal-500'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Recent Posts
                </button>
                <button
                  onClick={() => setActiveTab('reported')}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    activeTab === 'reported'
                      ? 'bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-700 border-b-2 border-teal-500'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Reported Content
                  {reportedContent.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
                      {reportedContent.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'recent' && (
                <div className="space-y-4">
                  {recentPosts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-teal-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-sm font-semibold text-text-primary">{post.author}</div>
                          <div className="text-xs text-text-secondary">{post.courseName}</div>
                        </div>
                        <div className="text-xs text-text-secondary">{post.timestamp}</div>
                      </div>
                      <p className="text-sm text-text-primary mb-3">{post.content}</p>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => {
                            window.alert(`💬 View Replies

Post by: ${post.author}
Replies: ${post.replies}

📊 Thread Activity:
• Total replies: ${post.replies}
• Unique participants: ${Math.floor(post.replies * 0.7)}
• Latest reply: 2 hours ago
• Thread engagement: High

🎯 Popular Replies:
• Most helpful: 12 likes
• Most recent: Just now
• Your replies: ${Math.floor(Math.random() * 3)}

💡 Engaging with student discussions strengthens community and enhances learning outcomes.`);
                          }}
                          className="text-xs text-text-secondary hover:text-teal-600 flex items-center gap-1"
                        >
                          💬 {post.replies} replies
                        </button>
                        <button 
                          onClick={() => {
                            window.alert(`👍 Post Liked

Author: ${post.author}
Current likes: ${post.likes + 1}

💡 Engagement Impact:
• Author notified
• Encourages participation
• Boosts visibility
• Positive reinforcement

📊 Community Effect:
• Post ranking: Increased
• Student morale: Boosted
• Quality signal: Sent

✨ Your engagement as a sub-coach helps students feel valued and encourages quality contributions!`);
                          }}
                          className="text-xs text-text-secondary hover:text-teal-600 flex items-center gap-1"
                        >
                          ❤️ {post.likes} likes
                        </button>
                        <button 
                          onClick={() => handleReplyToPost(post.id)}
                          className="text-xs text-teal-600 hover:text-teal-700 font-medium ml-auto"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'reported' && (
                <div className="space-y-4">
                  {reportedContent.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-3">✅</div>
                      <p className="text-sm text-text-secondary">No reported content at this time</p>
                    </div>
                  ) : (
                    reportedContent.map((item) => (
                      <div
                        key={item.id}
                        className="bg-amber-50 rounded-xl p-4 border-2 border-amber-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="text-sm font-semibold text-text-primary">{item.author}</div>
                            <div className="text-xs text-text-secondary">{item.courseName}</div>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-lg ${
                              item.status === 'Pending'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <p className="text-sm text-text-primary mb-3 italic">{item.content}</p>
                        <div className="text-xs text-text-secondary mb-3">
                          Reported by <span className="font-medium">{item.reportedBy}</span> • Reason:{' '}
                          <span className="font-medium">{item.reportReason}</span> • {item.timestamp}
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => {
                              setSelectedPost(item.id);
                              setShowReportedModal(true);
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 rounded-lg transition-all"
                          >
                            Review
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Moderation Guidelines */}
          <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-2xl p-6 border-2 border-dashed border-cyan-300">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center text-xl flex-shrink-0">
                👥
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary mb-2">Moderation Guidelines</h4>
                <ul className="space-y-1 text-xs text-text-secondary">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-600">•</span>
                    <span>Monitor discussions in your assigned courses for off-topic or inappropriate content</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-600">•</span>
                    <span>Respond to student questions promptly to encourage engagement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-600">•</span>
                    <span>Review reported content within 24 hours and take appropriate action</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-600">•</span>
                    <span>Escalate serious issues (harassment, threats, etc.) to your supervising coach immediately</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-600">•</span>
                    <span>Foster a positive learning environment by encouraging helpful discussions</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Access Notice */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-lg flex-shrink-0">
                🔒
              </div>
              <div>
                <h5 className="text-xs font-bold text-text-primary mb-1">Limited Moderation Access</h5>
                <p className="text-xs text-text-secondary">
                  You can moderate posts in courses assigned to you. For platform-wide moderation or policy changes, contact your supervising coach or the community manager.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reply Modal */}
      {showReplyModal && selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full">
            <div className="p-6 border-b border-[#EDF0FB]">
              <h3 className="text-xl font-bold text-text-primary">Reply to Post</h3>
            </div>

            <div className="p-6 space-y-4">
              {(() => {
                const post = recentPosts.find((p) => p.id === selectedPost);
                return post ? (
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <div className="text-sm font-semibold text-text-primary mb-1">{post.author}</div>
                    <p className="text-sm text-text-secondary">{post.content}</p>
                  </div>
                ) : null;
              })()}

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  Your Reply
                </label>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write your reply..."
                  className="w-full px-4 py-2 border border-[#EDF0FB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-[#EDF0FB] flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowReplyModal(false);
                  setReplyText('');
                }}
                className="px-6 py-2 text-sm font-medium text-text-secondary hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReply}
                className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 rounded-xl transition-all"
              >
                Post Reply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reported Content Review Modal */}
      {showReportedModal && selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#EDF0FB] flex items-center justify-between">
              <h3 className="text-xl font-bold text-text-primary">Review Reported Content</h3>
              <button
                onClick={() => setShowReportedModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {(() => {
                const item = reportedContent.find((i) => i.id === selectedPost);
                if (!item) return null;
                return (
                  <>
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold text-text-primary">{item.author}</div>
                        <span className="px-2 py-1 text-xs font-medium rounded-lg bg-amber-100 text-amber-700">
                          {item.status}
                        </span>
                      </div>
                      <div className="text-xs text-text-secondary mb-2">{item.courseName}</div>
                      <p className="text-sm text-text-primary italic">{item.content}</p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="text-xs font-medium text-text-secondary mb-2">Report Details</div>
                      <div className="text-sm text-text-primary">
                        <div><strong>Reported by:</strong> {item.reportedBy}</div>
                        <div><strong>Reason:</strong> {item.reportReason}</div>
                        <div><strong>Time:</strong> {item.timestamp}</div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-2">
                        Moderation Note (optional)
                      </label>
                      <textarea
                        rows={3}
                        value={moderationNote}
                        onChange={(e) => setModerationNote(e.target.value)}
                        placeholder="Add notes about your decision..."
                        className="w-full px-4 py-2 border border-[#EDF0FB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none"
                      />
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="p-6 border-t border-[#EDF0FB] flex justify-between">
              <button
                onClick={() => handleEscalate(selectedPost)}
                className="px-4 py-2 text-sm font-medium text-amber-600 border border-amber-600 hover:bg-amber-50 rounded-xl transition-all"
              >
                ⬆️ Escalate to Coach
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => handleRemovePost(selectedPost)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all"
                >
                  ❌ Remove Post
                </button>
                <button
                  onClick={() => handleApprovePost(selectedPost)}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-xl transition-all"
                >
                  ✅ Approve Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SubCoachAppLayout>
  );
};

export default SubCoachCommunityPage;
