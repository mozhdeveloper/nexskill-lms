import React from 'react';

interface Progress {
  activeCourses: number;
  completedLessons: number;
  totalLessons: number;
  weeklyHours: number;
  streakDays: number;
  upcomingDeadlines: number;
  averageQuizScore: number;
  currentCourse: string;
  completionPercentage: number;
}

interface AIMilestoneNotificationsProps {
  progress: Progress;
}

const AIMilestoneNotifications: React.FC<AIMilestoneNotificationsProps> = ({ progress }) => {
  const milestones = [
    {
      id: 1,
      icon: '🎉',
      text: `You completed ${progress.completionPercentage}% of '${progress.currentCourse}'.`,
      tag: 'Today',
      tagColor: 'bg-blue-100 text-blue-700',
    },
    {
      id: 2,
      icon: '⭐',
      text:"You're 2 quizzes away from the 'Frontend Beginner' badge.",
      tag: 'Upcoming',
      tagColor: 'bg-purple-100 text-purple-700',
    },
    {
      id: 3,
      icon: '⏰',
      text: `Your ${progress.streakDays}-day learning streak hits ${progress.streakDays + 1} days tomorrow – don't break it!`,
      tag: 'Upcoming',
      tagColor: 'bg-orange-100 text-orange-700',
    },
    {
      id: 4,
      icon: '🏆',
      text: 'You earned the"Quick Learner" achievement for completing 10 lessons in a week!',
      tag: 'Achieved',
      tagColor: 'bg-green-100 text-green-700',
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-md p-5">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-900">Milestones</h3>
      </div>

      {/* Milestones list */}
      <div className="space-y-3">
        {milestones.map((milestone) => (
          <div key={milestone.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
            <div className="flex-shrink-0 text-2xl">{milestone.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700 leading-relaxed mb-2">{milestone.text}</p>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${milestone.tagColor}`}>
                {milestone.tag}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIMilestoneNotifications;
