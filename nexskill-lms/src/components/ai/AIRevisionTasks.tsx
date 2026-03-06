import React, { useState } from 'react';

interface Task {
  id: string;
  title: string;
  duration: string;
  course: string;
  completed: boolean;
}

const AIRevisionTasks: React.FC = () => {
  const taskSets = {
    set1: [
      { id: 't1', title: 'Re-watch Lesson 3: Color theory basics', duration: '15 min', course: 'UI Design', completed: false },
      { id: 't2', title: 'Do 5 practice questions from JavaScript Fundamentals', duration: '10 min', course: 'JavaScript', completed: false },
      { id: 't3', title: 'Review your notes on responsive layouts', duration: '8 min', course: 'CSS', completed: false },
      { id: 't4', title: 'Complete the React Hooks quiz', duration: '20 min', course: 'React', completed: false },
      { id: 't5', title: 'Practice Figma prototyping exercises', duration: '25 min', course: 'UI Design', completed: false },
    ],
    set2: [
      { id: 't6', title: 'Revisit TypeScript generics lesson', duration: '18 min', course: 'TypeScript', completed: false },
      { id: 't7', title: 'Practice CSS Grid layout challenges', duration: '12 min', course: 'CSS', completed: false },
      { id: 't8', title: 'Review state management patterns', duration: '15 min', course: 'React', completed: false },
      { id: 't9', title: 'Complete accessibility best practices quiz', duration: '10 min', course: 'UI Design', completed: false },
      { id: 't10', title: 'Study API integration examples', duration: '20 min', course: 'JavaScript', completed: false },
    ],
  };

  const [currentSet, setCurrentSet] = useState<'set1' | 'set2'>('set1');
  const [tasks, setTasks] = useState<Task[]>(taskSets.set1);

  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task))
    );
  };

  const handleRegenerate = () => {
    const newSet = currentSet === 'set1' ? 'set2' : 'set1';
    setCurrentSet(newSet);
    setTasks(taskSets[newSet]);
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-5 transition-colors max-h-[300px] flex flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Revision tasks</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">Smart to-do list for your next study block</p>
        </div>
        {/* Circular Progress */}
        <div className="relative w-12 h-12 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="none" className="text-slate-100 dark:text-slate-700" />
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray={125.6}
              strokeDashoffset={125.6 - (125.6 * completedCount) / tasks.length}
              className="text-[#304DB5] transition-all duration-1000 ease-out"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#304DB5]">
            {Math.round((completedCount / tasks.length) * 100)}%
          </div>
        </div>
      </div>

      {/* Tasks list */}
      <div className="space-y-3 mb-4 flex-1 overflow-y-auto">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`group flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${task.completed
              ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-[#304DB5] hover:shadow-md'
              }`}
            onClick={() => handleToggleTask(task.id)}
          >
            <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-[#304DB5] border-[#304DB5]' : 'border-slate-300 dark:border-slate-500 group-hover:border-[#304DB5]'
              }`}>
              {task.completed && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium mb-1 transition-colors ${task.completed ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'
                  }`}
              >
                {task.title}
              </p>
              <div className="flex items-center gap-3 text-xs">
                <span className={`flex items-center gap-1 ${task.completed ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {task.duration}
                </span>
                <span className={`px-2 py-0.5 rounded-full font-medium ${task.completed
                  ? 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                  : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  }`}>
                  {task.course}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <button
        onClick={handleRegenerate}
        className="w-full py-2.5 rounded-xl font-medium text-[#304DB5] border border-[#304DB5] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center justify-center gap-2 group"
      >
        <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Regenerate tasks
      </button>
    </div>
  );
};

export default AIRevisionTasks;
