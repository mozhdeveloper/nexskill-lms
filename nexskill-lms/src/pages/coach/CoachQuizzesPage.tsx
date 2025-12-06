import React, { useState } from 'react';
import CoachAppLayout from '../../layouts/CoachAppLayout';
import { Search, Plus, Edit, Copy, Trash2, BarChart3, Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface Quiz {
  id: string;
  title: string;
  course: string;
  questions: number;
  passingScore: number;
  timeLimit?: number;
  attempts: number;
  avgScore: number;
  completionRate: number;
  status: 'published' | 'draft' | 'archived';
  createdDate: string;
  lastModified: string;
  totalAttempts: number;
}

const CoachQuizzesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [quizzes, setQuizzes] = useState<Quiz[]>([
    {
      id: 'quiz-1',
      title: 'JavaScript Fundamentals - Final Assessment',
      course: 'JavaScript Mastery',
      questions: 25,
      passingScore: 70,
      timeLimit: 45,
      attempts: 142,
      avgScore: 78,
      completionRate: 89,
      status: 'published',
      createdDate: '2024-01-15',
      lastModified: '2024-01-20',
      totalAttempts: 159,
    },
    {
      id: 'quiz-2',
      title: 'React Hooks Deep Dive Quiz',
      course: 'React Fundamentals',
      questions: 15,
      passingScore: 75,
      timeLimit: 30,
      attempts: 98,
      avgScore: 82,
      completionRate: 94,
      status: 'published',
      createdDate: '2024-01-10',
      lastModified: '2024-01-18',
      totalAttempts: 104,
    },
    {
      id: 'quiz-3',
      title: 'Python Data Structures Assessment',
      course: 'Python for Data Science',
      questions: 20,
      passingScore: 70,
      timeLimit: 40,
      attempts: 67,
      avgScore: 74,
      completionRate: 82,
      status: 'published',
      createdDate: '2024-01-08',
      lastModified: '2024-01-22',
      totalAttempts: 82,
    },
    {
      id: 'quiz-4',
      title: 'HTML/CSS Basics Quiz',
      course: 'Web Development Bootcamp',
      questions: 12,
      passingScore: 65,
      timeLimit: 20,
      attempts: 189,
      avgScore: 85,
      completionRate: 96,
      status: 'published',
      createdDate: '2023-12-20',
      lastModified: '2024-01-05',
      totalAttempts: 197,
    },
    {
      id: 'quiz-5',
      title: 'Advanced TypeScript Concepts',
      course: 'JavaScript Mastery',
      questions: 18,
      passingScore: 80,
      timeLimit: 35,
      attempts: 0,
      avgScore: 0,
      completionRate: 0,
      status: 'draft',
      createdDate: '2024-01-25',
      lastModified: '2024-01-25',
      totalAttempts: 0,
    },
    {
      id: 'quiz-6',
      title: 'Node.js Fundamentals Quiz (Old)',
      course: 'Web Development Bootcamp',
      questions: 15,
      passingScore: 70,
      timeLimit: 30,
      attempts: 245,
      avgScore: 79,
      completionRate: 91,
      status: 'archived',
      createdDate: '2023-10-15',
      lastModified: '2023-12-01',
      totalAttempts: 269,
    },
  ]);

  const handleCreateQuiz = () => {
    setShowCreateModal(false);
    window.alert(`✅ Quiz Created Successfully\n\n📝 Quiz Setup:\n• Questions: Start adding\n• Status: Draft\n• Auto-save: Enabled\n\n🎯 Next Steps:\n1. Add questions\n2. Set passing score\n3. Configure time limit\n4. Add feedback messages\n5. Preview quiz\n6. Publish to students\n\n💡 You can save progress and return anytime.`);
  };

  const handleEditQuiz = (quiz: Quiz) => {
    window.alert(`✏️ Edit Quiz\n\nQuiz: ${quiz.title}\nCourse: ${quiz.course}\n\n📝 Edit Options:\n• Question editor\n• Settings & timing\n• Passing criteria\n• Feedback messages\n• Attempts allowed\n• Grade weighting\n\n📊 Current Stats:\n• Attempts: ${quiz.totalAttempts}\n• Avg Score: ${quiz.avgScore}%\n• Completion: ${quiz.completionRate}%\n\n💡 Changes will be saved as a new version. Current attempts will continue using the existing version.`);
  };

  const handleDuplicateQuiz = (quiz: Quiz) => {
    const newQuiz: Quiz = {
      ...quiz,
      id: `quiz-${Date.now()}`,
      title: `${quiz.title} (Copy)`,
      status: 'draft',
      attempts: 0,
      avgScore: 0,
      completionRate: 0,
      totalAttempts: 0,
      createdDate: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0],
    };
    setQuizzes([...quizzes, newQuiz]);
    window.alert(`📋 Quiz Duplicated\n\nOriginal: ${quiz.title}\nNew Copy: ${newQuiz.title}\n\n✅ Duplicated Elements:\n• All questions and answers\n• Quiz settings\n• Time limits\n• Passing criteria\n\n📝 Status: Draft\n💡 Review and modify before publishing.`);
  };

  const handleDeleteQuiz = (quiz: Quiz) => {
    if (quiz.totalAttempts > 0) {
      window.alert(`⚠️ Cannot Delete Quiz\n\nQuiz: ${quiz.title}\n\n❌ Reason:\n• Has ${quiz.totalAttempts} student attempts\n• Student records would be lost\n\n✅ Alternatives:\n• Archive this quiz\n• Create a new version\n• Disable further attempts\n\n💡 Archiving preserves student data while hiding the quiz from active lists.`);
    } else {
      setQuizzes(quizzes.filter(q => q.id !== quiz.id));
      window.alert(`🗑️ Quiz Deleted\n\nQuiz: ${quiz.title}\n\n✅ Deleted Successfully:\n• No student attempts found\n• Safe to remove\n\n📝 This action cannot be undone.\n\n💡 Consider duplicating quizzes before major changes to preserve your work.`);
    }
  };

  const handleViewAnalytics = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setShowDetailModal(true);
  };

  const handlePublishQuiz = (quiz: Quiz) => {
    const updatedQuizzes = quizzes.map(q =>
      q.id === quiz.id ? { ...q, status: 'published' as const } : q
    );
    setQuizzes(updatedQuizzes);
    window.alert(`🚀 Quiz Published\n\nQuiz: ${quiz.title}\nCourse: ${quiz.course}\n\n✅ Published Successfully:\n• Visible to all enrolled students\n• Available in course curriculum\n• Progress tracking: Active\n• Notifications sent: Yes\n\n📊 Quiz Details:\n• Questions: ${quiz.questions}\n• Time limit: ${quiz.timeLimit} minutes\n• Passing score: ${quiz.passingScore}%\n• Attempts allowed: ${quiz.attempts}\n\n📧 Students Notified:\n• Email: Sent\n• In-app: Delivered\n• Course dashboard: Updated\n\n💡 Monitor analytics to track student performance and identify difficult questions.`);
  };

  const handleArchiveQuiz = (quiz: Quiz) => {
    const updatedQuizzes = quizzes.map(q =>
      q.id === quiz.id ? { ...q, status: 'archived' as const } : q
    );
    setQuizzes(updatedQuizzes);
    window.alert(`📦 Quiz Archived\n\nQuiz: ${quiz.title}\n\n✅ Archived Successfully:\n• Removed from active quizzes\n• Student data: Preserved\n• Can be restored anytime\n• No new attempts allowed\n\n💾 Data Retention:\n• All ${quiz.totalAttempts} attempts saved\n• Analytics still available\n• Scores maintained\n\n🔄 To Restore:\n• Change status back to published\n• Students can resume access\n\n💡 Archive old quizzes to keep your dashboard organized while preserving historical data.`);
  };

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch =
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.course.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || quiz.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalQuizzes = quizzes.length;
  const publishedQuizzes = quizzes.filter(q => q.status === 'published').length;
  const totalAttempts = quizzes.reduce((sum, q) => sum + q.totalAttempts, 0);
  const avgCompletionRate = Math.round(
    quizzes.filter(q => q.status === 'published').reduce((sum, q) => sum + q.completionRate, 0) /
      publishedQuizzes || 0
  );

  return (
    <CoachAppLayout>
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white dark:bg-dark-background-card border-b border-slate-200 dark:border-gray-700 px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-dark-text-primary mb-2">
                Quizzes & Assessments
              </h1>
              <p className="text-slate-600 dark:text-dark-text-secondary">
                Create and manage quizzes for your courses
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-semibold"
            >
              <Plus className="w-5 h-5" />
              Create Quiz
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-4">
              <div className="text-sm text-slate-600 dark:text-dark-text-secondary mb-1">Total Quizzes</div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totalQuizzes}</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-4">
              <div className="text-sm text-slate-600 dark:text-dark-text-secondary mb-1">Published</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{publishedQuizzes}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-4">
              <div className="text-sm text-slate-600 dark:text-dark-text-secondary mb-1">Total Attempts</div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{totalAttempts}</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-2xl p-4">
              <div className="text-sm text-slate-600 dark:text-dark-text-secondary mb-1">Avg Completion</div>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{avgCompletionRate}%</div>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="px-8 py-6 bg-slate-50 dark:bg-dark-background border-b border-slate-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search quizzes by title or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-dark-background-card rounded-lg border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 bg-white dark:bg-dark-background-card border border-slate-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Quizzes Grid */}
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredQuizzes.map(quiz => (
              <div
                key={quiz.id}
                className="bg-white dark:bg-dark-background-card rounded-2xl border border-slate-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-dark-text-primary mb-1">
                      {quiz.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-dark-text-secondary">{quiz.course}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      quiz.status === 'published'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : quiz.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {quiz.status}
                  </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-dark-text-secondary">
                    <AlertCircle className="w-4 h-4" />
                    <span>{quiz.questions} questions</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-dark-text-secondary">
                    <Clock className="w-4 h-4" />
                    <span>{quiz.timeLimit ? `${quiz.timeLimit} min` : 'No limit'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-dark-text-secondary">
                    <Users className="w-4 h-4" />
                    <span>{quiz.totalAttempts} attempts</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-dark-text-secondary">
                    <CheckCircle className="w-4 h-4" />
                    <span>{quiz.passingScore}% to pass</span>
                  </div>
                </div>

                {/* Stats */}
                {quiz.status === 'published' && quiz.totalAttempts > 0 && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                      <div className="text-xs text-slate-600 dark:text-dark-text-secondary mb-1">Avg Score</div>
                      <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{quiz.avgScore}%</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                      <div className="text-xs text-slate-600 dark:text-dark-text-secondary mb-1">Completion</div>
                      <div className="text-xl font-bold text-green-600 dark:text-green-400">{quiz.completionRate}%</div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-slate-200 dark:border-gray-700">
                  {quiz.status === 'draft' ? (
                    <button
                      onClick={() => handlePublishQuiz(quiz)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Publish
                    </button>
                  ) : quiz.status === 'published' ? (
                    <>
                      <button
                        onClick={() => handleViewAnalytics(quiz)}
                        className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                      >
                        <BarChart3 className="w-4 h-4" />
                        Analytics
                      </button>
                      <button
                        onClick={() => handleArchiveQuiz(quiz)}
                        className="px-3 py-2 bg-slate-100 text-slate-700 dark:bg-gray-800 dark:text-dark-text-primary rounded-lg hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                      >
                        Archive
                      </button>
                    </>
                  ) : null}
                  <button
                    onClick={() => handleEditQuiz(quiz)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4 text-slate-600 dark:text-dark-text-secondary" />
                  </button>
                  <button
                    onClick={() => handleDuplicateQuiz(quiz)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4 text-slate-600 dark:text-dark-text-secondary" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuiz(quiz)}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Quiz Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-background-card rounded-2xl max-w-lg w-full p-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-dark-text-primary mb-4">Create New Quiz</h2>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-dark-text-primary mb-2">
                  Quiz Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., JavaScript Fundamentals Quiz"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-dark-text-primary mb-2">
                  Select Course
                </label>
                <select className="w-full px-4 py-2 bg-slate-50 dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>JavaScript Mastery</option>
                  <option>React Fundamentals</option>
                  <option>Python for Data Science</option>
                  <option>Web Development Bootcamp</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-dark-text-primary rounded-lg hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateQuiz}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showDetailModal && selectedQuiz && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-background-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-dark-text-primary mb-1">
                    {selectedQuiz.title}
                  </h2>
                  <p className="text-slate-600 dark:text-dark-text-secondary">{selectedQuiz.course}</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-dark-text-primary"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                  <div className="text-sm text-slate-600 dark:text-dark-text-secondary mb-1">Total Attempts</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedQuiz.totalAttempts}</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                  <div className="text-sm text-slate-600 dark:text-dark-text-secondary mb-1">Avg Score</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{selectedQuiz.avgScore}%</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                  <div className="text-sm text-slate-600 dark:text-dark-text-secondary mb-1">Completion</div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {selectedQuiz.completionRate}%
                  </div>
                </div>
              </div>

              {/* Quiz Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-gray-700">
                  <span className="text-slate-600 dark:text-dark-text-secondary">Questions</span>
                  <span className="font-semibold text-slate-900 dark:text-dark-text-primary">{selectedQuiz.questions}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-gray-700">
                  <span className="text-slate-600 dark:text-dark-text-secondary">Time Limit</span>
                  <span className="font-semibold text-slate-900 dark:text-dark-text-primary">
                    {selectedQuiz.timeLimit ? `${selectedQuiz.timeLimit} minutes` : 'No limit'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-gray-700">
                  <span className="text-slate-600 dark:text-dark-text-secondary">Passing Score</span>
                  <span className="font-semibold text-slate-900 dark:text-dark-text-primary">{selectedQuiz.passingScore}%</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-gray-700">
                  <span className="text-slate-600 dark:text-dark-text-secondary">Created</span>
                  <span className="font-semibold text-slate-900 dark:text-dark-text-primary">{selectedQuiz.createdDate}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-slate-600 dark:text-dark-text-secondary">Last Modified</span>
                  <span className="font-semibold text-slate-900 dark:text-dark-text-primary">{selectedQuiz.lastModified}</span>
                </div>
              </div>

              {/* Insights */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">📊 Quick Insights</h3>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
                  <li>
                    • {selectedQuiz.avgScore >= 80 ? '✅' : selectedQuiz.avgScore >= 70 ? '⚠️' : '❌'} Average score is{' '}
                    {selectedQuiz.avgScore >= 80 ? 'excellent' : selectedQuiz.avgScore >= 70 ? 'good' : 'below target'}
                  </li>
                  <li>
                    • {selectedQuiz.completionRate >= 90 ? '✅' : '⚠️'} {selectedQuiz.completionRate}% completion rate
                  </li>
                  <li>• 📈 {selectedQuiz.totalAttempts} students have taken this quiz</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </CoachAppLayout>
  );
};

export default CoachQuizzesPage;
