import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle, Trophy, Play } from 'lucide-react';

export interface PreviousAttempt {
  id: string;
  attempt_number: number;
  score: number;
  max_score: number;
  passed: boolean | null;
  status: 'in_progress' | 'submitted' | 'graded';
  submitted_at: string | null;
  started_at: string;
  penalized_score?: number;
  requires_manual_grading?: boolean;
}

interface QuizAttemptHistoryProps {
  attempts: PreviousAttempt[];
  maxAttempts: number | null;
  passingScore: number;
  onRetake?: () => void;
  canRetake: boolean;
  attemptsRemaining: number | null;
  attemptsUsed: number;
  displayMaxAttempts: string | number;
  onStartAttempt?: () => void;
  timeLimitMinutes: number | null;
  courseId: string;
  lessonId: string | null;
}

const QuizAttemptHistory: React.FC<QuizAttemptHistoryProps> = ({
  attempts,
  maxAttempts,
  passingScore,
  onRetake,
  canRetake,
  attemptsRemaining,
  attemptsUsed,
  displayMaxAttempts,
  onStartAttempt,
  timeLimitMinutes,
  courseId,
  lessonId,
}) => {
  const navigate = useNavigate();

  // Calculate the next attempt number (e.g., 1 for first attempt, 2 for second, etc.)
  const nextAttemptNumber = attemptsUsed + 1;

  // Empty state — first-time taker
  if (attempts.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-text-primary mb-2">Ready to take this quiz?</h2>
          <p className="text-text-secondary">
            Review the details below and start your first attempt when you're ready.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 text-sm text-text-secondary mb-6">
          <div>
            <span className="font-semibold text-text-primary">Passing Score:</span>{' '}
            {passingScore}%
          </div>
          {timeLimitMinutes && (
            <div>
              <span className="font-semibold text-text-primary">Time Limit:</span>{' '}
              {timeLimitMinutes} minutes
            </div>
          )}
          <div>
            <span className="font-semibold text-text-primary">Attempts:</span>{' '}
            {attemptsRemaining === null ? 'Unlimited' : `${nextAttemptNumber} of ${maxAttempts}`}
          </div>
        </div>

        {onStartAttempt && (attemptsRemaining === null || attemptsRemaining > 0) && (
          <button
            onClick={onStartAttempt}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold bg-gradient-to-r from-brand-neon to-brand-electric text-white shadow-lg hover:shadow-xl transition-all"
          >
            <Play className="w-5 h-5" />
            Start Attempt {nextAttemptNumber} of {maxAttempts ?? '∞'}
          </button>
        )}
      </div>
    );
  }

  // Find best score
  const bestAttempt = attempts.reduce((best, current) => {
    const currentScorePercent = (current.score / current.max_score) * 100;
    const bestScorePercent = (best.score / best.max_score) * 100;
    return currentScorePercent > bestScorePercent ? current : best;
  }, attempts[0]);

  const formatScore = (score: number, maxScore: number) => {
    return Math.round((score / maxScore) * 100);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'In Progress';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (attempt: PreviousAttempt) => {
    if (attempt.status === 'in_progress') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
          <AlertCircle className="w-3 h-3" />
          In Progress
        </span>
      );
    }

    if (attempt.requires_manual_grading && attempt.status === 'submitted') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
          <AlertCircle className="w-3 h-3" />
          Pending Review
        </span>
      );
    }

    if (attempt.passed) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
          <CheckCircle className="w-3 h-3" />
          Pass
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
        <XCircle className="w-3 h-3" />
        Fail
      </span>
    );
  };

  const getScoreDisplay = (attempt: PreviousAttempt) => {
    const scorePercent = formatScore(attempt.score, attempt.max_score);

    if (attempt.penalized_score !== undefined && attempt.penalized_score !== attempt.score) {
      const penalizedPercent = formatScore(attempt.penalized_score, attempt.max_score);
      return (
        <div className="text-right">
          <span className="text-gray-400 dark:text-gray-500 line-through text-sm">{scorePercent}%</span>
          <div className="font-bold text-red-600 dark:text-red-400">{penalizedPercent}%</div>
          <div className="text-xs text-red-500">Late penalty</div>
        </div>
      );
    }

    const isBest = attempt.id === bestAttempt.id;
    return (
      <div className={`text-right ${isBest ? 'font-bold' : ''}`}>
        {scorePercent}%
        {isBest && attempts.length > 1 && (
          <div className="flex items-center justify-end gap-1 text-xs text-amber-600 dark:text-amber-400 mt-1">
            <Trophy className="w-3 h-3" />
            Best
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="glass-card rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-text-primary">Your Attempt History</h2>
        {attemptsRemaining !== null && attemptsRemaining <= 0 ? (
          <button
            onClick={() => {
              if (lessonId) {
                navigate(`/student/courses/${courseId}/lessons/${lessonId}`);
              } else {
                navigate(`/student/courses/${courseId}`);
              }
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm bg-gradient-to-r from-brand-neon to-brand-electric text-white shadow-lg hover:shadow-xl transition-all"
          >
            ← Back to Lesson
          </button>
        ) : (
          canRetake && onStartAttempt && (attemptsRemaining === null || attemptsRemaining > 0) && (
            <button
              onClick={onStartAttempt}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm bg-gradient-to-r from-brand-neon to-brand-electric text-white shadow-lg hover:shadow-xl transition-all"
            >
              <Play className="w-5 h-5" />
              Start Attempt {nextAttemptNumber} of {maxAttempts ?? '∞'}
            </button>
          )
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Attempt</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Score</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Date</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((attempt) => (
              <tr
                key={attempt.id}
                className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                  attempt.id === bestAttempt.id && attempts.length > 1
                    ? 'bg-amber-50 dark:bg-amber-900/10'
                    : ''
                }`}
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary">
                      {attempt.status === 'in_progress' ? 'Current' : `Attempt ${attempt.attempt_number}`}
                    </span>
                    {attempt.id === bestAttempt.id && attempts.length > 1 && (
                      <Trophy className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  {attempt.status === 'in_progress' && (
                    <div className="text-xs text-text-secondary mt-1">
                      Started: {formatDate(attempt.started_at)}
                    </div>
                  )}
                </td>
                <td className="py-4 px-4">{getScoreDisplay(attempt)}</td>
                <td className="py-4 px-4">{getStatusBadge(attempt)}</td>
                <td className="py-4 px-4 text-text-secondary">
                  {formatDate(attempt.submitted_at ?? attempt.started_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="text-sm text-text-secondary">
          <span>
            Attempt:{' '}
            <span className="font-bold text-text-primary">
              {attemptsRemaining === null
                ? 'Unlimited'
                : `${nextAttemptNumber}/${maxAttempts}`}
            </span>
          </span>
          {attempts.length > 0 && (
            <span className="ml-4">
              Best Score:{' '}
              <span className="font-bold text-text-primary">
                {formatScore(bestAttempt.score, bestAttempt.max_score)}%
              </span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-text-secondary">
          {timeLimitMinutes && (
            <span>
              Time Limit: <span className="font-bold text-text-primary">{timeLimitMinutes} minutes</span>
            </span>
          )}
          <span>
            Passing Score: <span className="font-bold text-text-primary">{passingScore}%</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default QuizAttemptHistory;
