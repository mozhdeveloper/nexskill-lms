import React, { useState } from 'react';
import SubCoachAppLayout from '../../layouts/SubCoachAppLayout';
import GradingQueueList from '../../components/subcoach/GradingQueueList';

const SubCoachGradingPage: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCourse, setFilterCourse] = useState('all');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [gradeData, setGradeData] = useState({ score: '', feedback: '' });

  // Dummy grading queue data
  const allGradingItems = [
    {
      id: '1',
      studentName: 'Emma Wilson',
      courseName: 'UI Design Fundamentals',
      lessonTitle: 'Assignment: Portfolio Website',
      submittedAt: '1 hour ago',
      status: 'Submitted' as const,
    },
    {
      id: '2',
      studentName: 'David Lee',
      courseName: 'JavaScript Mastery',
      lessonTitle: 'Final Project',
      submittedAt: '3 hours ago',
      status: 'Submitted' as const,
    },
    {
      id: '3',
      studentName: 'Sophie Turner',
      courseName: 'UI Design Fundamentals',
      lessonTitle: 'Quiz: Color Theory',
      submittedAt: '5 hours ago',
      status: 'In Review' as const,
    },
    {
      id: '4',
      studentName: 'James Rodriguez',
      courseName: 'Product Management',
      lessonTitle: 'Assignment: User Story Map',
      submittedAt: '1 day ago',
      status: 'Submitted' as const,
    },
    {
      id: '5',
      studentName: 'Lisa Anderson',
      courseName: 'JavaScript Mastery',
      lessonTitle: 'Assignment: Async Project',
      submittedAt: '2 days ago',
      status: 'Graded' as const,
    },
    {
      id: '6',
      studentName: 'Alex Martinez',
      courseName: 'UI Design Fundamentals',
      lessonTitle: 'Assignment: Mobile App Design',
      submittedAt: '3 days ago',
      status: 'Graded' as const,
    },
  ];

  // Filter items
  const filteredItems = allGradingItems.filter((item) => {
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesCourse = filterCourse === 'all' || item.courseName === filterCourse;
    return matchesStatus && matchesCourse;
  });

  // Get unique courses
  const courses = Array.from(new Set(allGradingItems.map((i) => i.courseName)));

  // Statistics
  const submittedCount = allGradingItems.filter((i) => i.status === 'Submitted').length;
  const inReviewCount = allGradingItems.filter((i) => i.status === 'In Review').length;
  const gradedCount = allGradingItems.filter((i) => i.status === 'Graded').length;

  const handleGrade = (id: string) => {
    setSelectedItem(id);
  };

  const handleSubmitGrade = () => {
    const item = allGradingItems.find((i) => i.id === selectedItem);
    window.alert(`✅ Grade Submitted Successfully\n\nStudent: ${item?.studentName}\nAssignment: ${item?.lessonTitle}\nScore: ${gradeData.score}/100\n\n📝 Feedback Provided:\n${gradeData.feedback}\n\n📊 Grading Details:\n• Submission reviewed: Yes\n• Rubric applied: Standard\n• Late penalty: None\n• Grade weight: 20%\n\n📧 Student Notification:\n• Email: Sent\n• In-app alert: Delivered\n• Feedback accessible: Yes\n\n🔄 The grade has been recorded in the gradebook and the supervising coach has been notified.`);
    setSelectedItem(null);
    setGradeData({ score: '', feedback: '' });
  };

  return (
    <SubCoachAppLayout>
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#EDF0FB]">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Grading Queue</h1>
          <p className="text-sm text-text-secondary">
            Review and grade student submissions
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-[#EDF0FB]">
              <div className="text-2xl font-bold text-text-primary">{allGradingItems.length}</div>
              <div className="text-xs text-text-secondary mt-1">Total Submissions</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200">
              <div className="text-2xl font-bold text-blue-700">{submittedCount}</div>
              <div className="text-xs text-blue-600 mt-1">Awaiting Review</div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-5 border border-amber-200">
              <div className="text-2xl font-bold text-amber-700">{inReviewCount}</div>
              <div className="text-xs text-amber-600 mt-1">In Review</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-200">
              <div className="text-2xl font-bold text-green-700">{gradedCount}</div>
              <div className="text-xs text-green-600 mt-1">Graded</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl p-6 border border-[#EDF0FB]">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Filter by Status */}
              <div className="flex-1">
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  Filter by Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-[#EDF0FB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                >
                  <option value="all">All Status</option>
                  <option value="Submitted">Submitted</option>
                  <option value="In Review">In Review</option>
                  <option value="Graded">Graded</option>
                </select>
              </div>

              {/* Filter by Course */}
              <div className="flex-1">
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  Filter by Course
                </label>
                <select
                  value={filterCourse}
                  onChange={(e) => setFilterCourse(e.target.value)}
                  className="w-full px-4 py-2 border border-[#EDF0FB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
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

            <div className="mt-3 text-xs text-text-secondary">
              Showing {filteredItems.length} of {allGradingItems.length} submissions
            </div>
          </div>

          {/* Grading Queue List */}
          <div className="bg-white rounded-2xl p-6 border border-[#EDF0FB]">
            <h3 className="text-lg font-bold text-text-primary mb-4">Submissions</h3>
            <GradingQueueList items={filteredItems} onGrade={handleGrade} />
          </div>

          {/* Help Section */}
          <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-2xl p-6 border-2 border-dashed border-cyan-300">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center text-xl flex-shrink-0">
                📝
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary mb-2">Grading Guidelines</h4>
                <ul className="space-y-1 text-xs text-text-secondary">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-600">•</span>
                    <span>Review each submission carefully before assigning a grade</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-600">•</span>
                    <span>Provide constructive feedback to help students improve</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-600">•</span>
                    <span>Check the lesson rubric for grading criteria</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-600">•</span>
                    <span>Aim to grade submissions within 48 hours to keep students engaged</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-600">•</span>
                    <span>Contact your supervising coach if you're unsure about a submission</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grading Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#EDF0FB]">
              <h3 className="text-xl font-bold text-text-primary">Grade Submission</h3>
            </div>

            <div className="p-6 space-y-4">
              {/* Student Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-xs text-text-secondary mb-1">Student</div>
                <div className="text-sm font-semibold text-text-primary">
                  {allGradingItems.find((i) => i.id === selectedItem)?.studentName}
                </div>
                <div className="text-xs text-text-secondary mt-2">Assignment</div>
                <div className="text-sm font-medium text-text-primary">
                  {allGradingItems.find((i) => i.id === selectedItem)?.lessonTitle}
                </div>
              </div>

              {/* Submission Preview */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  Submission
                </label>
                <div className="border border-[#EDF0FB] rounded-xl p-4 bg-gray-50">
                  <p className="text-sm text-text-secondary italic">
                    [Student submission content would be displayed here]
                  </p>
                </div>
              </div>

              {/* Score Input */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  Score (out of 100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={gradeData.score}
                  onChange={(e) => setGradeData({ ...gradeData, score: e.target.value })}
                  placeholder="Enter score..."
                  className="w-full px-4 py-2 border border-[#EDF0FB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                />
              </div>

              {/* Feedback */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  Feedback
                </label>
                <textarea
                  rows={5}
                  value={gradeData.feedback}
                  onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                  placeholder="Provide constructive feedback for the student..."
                  className="w-full px-4 py-2 border border-[#EDF0FB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-[#EDF0FB] flex justify-end gap-3">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-6 py-2 text-sm font-medium text-text-secondary hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitGrade}
                className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 rounded-xl transition-all"
              >
                Submit Grade
              </button>
            </div>
          </div>
        </div>
      )}
    </SubCoachAppLayout>
  );
};

export default SubCoachGradingPage;
