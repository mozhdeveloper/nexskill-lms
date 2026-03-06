import React, { useState } from 'react';

const AIPersonalizedStudyPlan: React.FC = () => {
  const [completedDays, setCompletedDays] = useState<Set<string>>(new Set());

  const studyPlan = [
    {
      day: 'Today',
      dayId: 'day1',
      tasks: [
        'Watch 2 lessons from UI Design Basics (30 min)',
        'Complete JavaScript quiz 2 (15 min)',
        'Review notes for 10 minutes',
      ],
    },
    {
      day: 'Tomorrow',
      dayId: 'day2',
      tasks: [
        'Practice Figma prototyping exercises (25 min)',
        'Read React documentation chapter 3 (20 min)',
        'Do 5 coding challenges (15 min)',
      ],
    },
    {
      day: 'Day 3',
      dayId: 'day3',
      tasks: [
        'Watch advanced CSS Grid lesson (20 min)',
        'Build mini-project: Landing page (45 min)',
        'Join live study session at 7 PM',
      ],
    },
  ];

  const handleMarkDayDone = (dayId: string) => {
    setCompletedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dayId)) {
        newSet.delete(dayId);
      } else {
        newSet.add(dayId);
      }
      return newSet;
    });
  };

  const handleAdjustPlan = () => {
    console.log('Adjust plan clicked');
    alert('Plan adjustment feature coming soon! This would allow you to customize your learning schedule.');
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-6 transition-colors">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Personalized study plan</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">Based on your goals and recent activity</p>
      </div>

      {/* Plan overview */}
      <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">3-Day Micro-Plan</p>
            <p className="text-xs text-slate-600">~2 hours per day</p>
          </div>
          <div className="text-2xl">📚</div>
        </div>
      </div>

      {/* Daily plan sections with Timeline */}
      <div className="relative space-y-8 pl-4 mb-6">
        {/* Timeline Line */}
        <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-700" />

        {studyPlan.map((dayPlan, index) => {
          const isCompleted = completedDays.has(dayPlan.dayId);
          const isToday = dayPlan.day === 'Today';

          return (
            <div key={dayPlan.dayId} className="relative pl-8">
              {/* Timeline Node */}
              <div
                className={`absolute left-0.5 top-5 w-11 h-11 -ml-[22px] rounded-full border-4 border-white dark:border-slate-800 flex items-center justify-center transition-colors ${isCompleted
                  ? 'bg-green-500 text-white'
                  : isToday
                    ? 'bg-[#304DB5] text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-sm font-bold">{index + 1}</span>
                )}
              </div>

              {/* Card */}
              <div
                className={`rounded-2xl transition-all ${isToday
                  ? 'bg-white dark:bg-slate-800 ring-2 ring-[#304DB5]/20 shadow-lg'
                  : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700'
                  }`}
              >
                {/* Card Header */}
                <div className={`px-5 py-4 border-b ${isToday ? 'border-slate-100 dark:border-slate-700' : 'border-transparent'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`font-bold text-lg ${isToday ? 'text-[#304DB5] dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                        {dayPlan.day}
                      </h4>
                      {isToday && <span className="text-xs font-medium text-slate-500">Focus for today</span>}
                    </div>
                    {dayPlan.dayId === 'day1' && !isCompleted && (
                      <button
                        onClick={() => handleMarkDayDone(dayPlan.dayId)}
                        className="text-sm font-medium text-[#304DB5] hover:text-[#5E7BFF] transition-colors bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg"
                      >
                        Mark complete
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5">
                  <ul className="space-y-3">
                    {dayPlan.tasks.map((task, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm group">
                        <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${isCompleted ? 'bg-green-500' : 'bg-[#304DB5]'}`} />
                        <span className={`transition-colors ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-700 dark:text-slate-300 group-hover:text-[#304DB5]'}`}>
                          {task}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer actions */}
      <div className="flex gap-2 pt-4 border-t border-slate-200">
        <button
          onClick={handleAdjustPlan}
          className="flex-1 py-2.5 rounded-full font-medium text-slate-700 border-2 border-slate-300 hover:bg-slate-50 transition-all"
        >
          Adjust plan
        </button>
        <button
          onClick={() => handleMarkDayDone('day1')}
          className="flex-1 py-2.5 rounded-full font-medium bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white hover:shadow-lg transition-all"
        >
          {completedDays.has('day1') ? 'Undo today' : 'Mark today done'}
        </button>
      </div>
    </div>
  );
};

export default AIPersonalizedStudyPlan;
