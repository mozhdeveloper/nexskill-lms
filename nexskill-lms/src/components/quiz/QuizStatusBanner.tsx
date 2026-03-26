import React, { useEffect, useState } from 'react';
import { AlertCircle, Clock, Lock, Calendar, AlertTriangle } from 'lucide-react';

interface QuizStatusBannerProps {
  availableFrom: string | null;
  dueDate: string | null;
  lateSubmissionAllowed: boolean;
  latePenaltyPercent: number;
  attemptsRemaining: number | null;
  maxAttempts: number | null;
  isPublished: boolean;
  onQuizAvailable?: () => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const calculateTimeRemaining = (targetDate: string): TimeRemaining | null => {
  const target = new Date(targetDate).getTime();
  const now = new Date().getTime();
  const diff = target - now;

  if (diff <= 0) return null;

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
};

const QuizStatusBanner: React.FC<QuizStatusBannerProps> = ({
  availableFrom,
  dueDate,
  lateSubmissionAllowed,
  latePenaltyPercent,
  attemptsRemaining,
  maxAttempts,
  isPublished,
  onQuizAvailable,
}) => {
  const [availableCountdown, setAvailableCountdown] = useState<TimeRemaining | null>(null);
  const [dueCountdown, setDueCountdown] = useState<TimeRemaining | null>(null);

  useEffect(() => {
    // Update available countdown
    if (availableFrom) {
      const updateAvailableCountdown = () => {
        const remaining = calculateTimeRemaining(availableFrom);
        setAvailableCountdown(remaining);
        
        // If countdown just finished, notify parent
        if (!remaining && availableCountdown) {
          onQuizAvailable?.();
        }
      };
      
      updateAvailableCountdown();
      const interval = setInterval(updateAvailableCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [availableFrom]);

  useEffect(() => {
    // Update due countdown
    if (dueDate) {
      const updateDueCountdown = () => {
        const remaining = calculateTimeRemaining(dueDate);
        setDueCountdown(remaining);
      };
      
      updateDueCountdown();
      const interval = setInterval(updateDueCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [dueDate]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCountdown = (time: TimeRemaining) => {
    const parts = [];
    if (time.days > 0) parts.push(`${time.days}d`);
    if (time.hours > 0) parts.push(`${time.hours}h`);
    if (time.minutes > 0) parts.push(`${time.minutes}m`);
    parts.push(`${time.seconds}s`);
    return parts.join(' ');
  };

  // Quiz not published
  if (!isPublished) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-gray-500" />
          <div>
            <p className="font-semibold text-gray-700 dark:text-gray-300">Quiz Not Available</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">This quiz has not been published yet.</p>
          </div>
        </div>
      </div>
    );
  }

  // Quiz not yet available
  if (availableFrom && availableCountdown) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div className="flex-1">
            <p className="font-semibold text-blue-800 dark:text-blue-300">Quiz Opens Soon</p>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Available on {formatDate(availableFrom)}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 rounded-full">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="font-mono font-bold text-blue-700 dark:text-blue-300">
              {formatCountdown(availableCountdown)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Quiz closed (past due date, no late submission)
  if (dueDate && !dueCountdown && !lateSubmissionAllowed) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-red-600 dark:text-red-400" />
          <div>
            <p className="font-semibold text-red-800 dark:text-red-300">Quiz Closed</p>
            <p className="text-sm text-red-600 dark:text-red-400">
              This quiz closed on {formatDate(dueDate)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Late submission warning
  if (dueDate && !dueCountdown && lateSubmissionAllowed) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800 dark:text-amber-300">Late Submission</p>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              The due date ({formatDate(dueDate)}) has passed. A {latePenaltyPercent}% penalty will be applied to your score.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Due soon warning (less than 24 hours)
  if (dueDate && dueCountdown && dueCountdown.days === 0 && dueCountdown.hours < 24) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800 dark:text-amber-300">Due Soon</p>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Due on {formatDate(dueDate)}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-amber-100 dark:bg-amber-800/50 px-4 py-2 rounded-full">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="font-mono font-bold text-amber-700 dark:text-amber-300">
              {formatCountdown(dueCountdown)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Attempts remaining info
  if (attemptsRemaining !== null && attemptsRemaining <= 0) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-red-600 dark:text-red-400" />
          <div>
            <p className="font-semibold text-red-800 dark:text-red-300">No Attempts Remaining</p>
            <p className="text-sm text-red-600 dark:text-red-400">
              You have used all {maxAttempts} attempt{maxAttempts !== 1 ? 's' : ''}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Attempts remaining warning (last attempt)
  if (attemptsRemaining !== null && attemptsRemaining === 1) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-300">Last Attempt</p>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              This is your final attempt for this quiz.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default QuizStatusBanner;
