import React from 'react';

interface Quiz {
  id: string;
  title: string;
  averageScore: number;
  completionRate: number;
  totalAttempts: number;
}

interface StudentScoresPanelProps {
  quizzes?: Quiz[];
}

const StudentScoresPanel: React.FC<StudentScoresPanelProps> = ({
  quizzes = [],
}) => {
  // Calculate aggregate metrics from real database data
  const totalAttempts = quizzes.reduce((sum, q) => sum + q.totalAttempts, 0);
  const averageScore =
    quizzes.length > 0
      ? Math.round(
          quizzes.reduce((sum, q) => sum + q.averageScore, 0) / quizzes.length
        )
      : 0;
  const belowThreshold = quizzes.filter((q) => q.averageScore < 60 && q.totalAttempts > 0).length;

  const needsAttention = (score: number) => score < 60;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-[#22C55E]';
    if (score >= 60) return 'text-[#F97316]';
    return 'text-[#EF4444]';
  };

  const handleViewDetails = (quizId: string) => {
    console.log('View detailed results for quiz:', quizId);
    // TODO: Navigate to quiz detail page or open modal with student-by-student breakdown
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h3 className="text-xl font-bold text-[#111827] mb-6">Scores & Quiz Results</h3>

      {/* KPI Row - Real-time data from database */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-[#304DB5] mb-1">{averageScore}%</div>
          <p className="text-xs text-[#5F6473]">Average quiz score</p>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-[#5F6473] mb-1">{totalAttempts}</div>
          <p className="text-xs text-[#5F6473]">Total attempts</p>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-[#EF4444] mb-1">{belowThreshold}</div>
          <p className="text-xs text-[#5F6473]">Below 60%</p>
        </div>
      </div>

      {/* Quiz Breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-[#111827]">Quiz Performance</h4>

        <div className="space-y-2">
          {quizzes.length > 0 ? (
            quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="p-4 bg-[#F5F7FF] rounded-xl border border-[#EDF0FB] hover:border-[#304DB5] transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-[#111827] text-sm mb-1">{quiz.title}</h5>
                    <div className="flex items-center gap-3 text-xs text-[#5F6473]">
                      <span>
                        {quiz.totalAttempts} attempt{quiz.totalAttempts !== 1 ? 's' : ''}
                      </span>
                      <span>•</span>
                      <span>{quiz.completionRate}% completion</span>
                    </div>
                  </div>
                  {needsAttention(quiz.averageScore) && quiz.totalAttempts > 0 && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full whitespace-nowrap ml-2">
                      Needs attention
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#9CA3B5]">Avg score:</span>
                    <span className={`text-lg font-bold ${getScoreColor(quiz.averageScore)}`}>
                      {quiz.averageScore}%
                    </span>
                  </div>
                  <button
                    onClick={() => handleViewDetails(quiz.id)}
                    className="text-xs text-[#304DB5] hover:text-[#5E7BFF] font-medium transition-colors"
                  >
                    View details →
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 h-2 bg-white rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      quiz.averageScore >= 80
                        ? 'bg-[#22C55E]'
                        : quiz.averageScore >= 60
                        ? 'bg-[#F97316]'
                        : 'bg-[#EF4444]'
                    }`}
                    style={{ width: `${quiz.averageScore}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-[#5F6473]">
              <p>No quizzes available for this course yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Insights */}
      {belowThreshold > 0 && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <p className="text-sm font-semibold text-red-900 mb-1">
                {belowThreshold} quiz{belowThreshold !== 1 ? 'zes' : ''} below threshold
              </p>
              <p className="text-xs text-red-700">
                Consider reviewing quiz content or providing additional support materials for these
                topics.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Data freshness indicator */}
      <div className="mt-4 pt-4 border-t border-[#EDF0FB]">
        <p className="text-xs text-[#9CA3B5] text-center">
          🔄 Real-time data from quiz attempts
        </p>
      </div>
    </div>
  );
};

export default StudentScoresPanel;
