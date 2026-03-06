import React from 'react';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import AIChatPanel from '../../components/ai/AIChatPanel';
import AIProgressRecommendations from '../../components/ai/AIProgressRecommendations';
import AIExplainSimplyCard from '../../components/ai/AIExplainSimplyCard';
import AIRevisionTasks from '../../components/ai/AIRevisionTasks';
import AIMilestoneNotifications from '../../components/ai/AIMilestoneNotifications';
import AIPersonalizedStudyPlan from '../../components/ai/AIPersonalizedStudyPlan';

// Mock student progress data
const studentProgress = {
  activeCourses: 3,
  completedLessons: 42,
  totalLessons: 120,
  weeklyHours: 8.5,
  streakDays: 5,
  upcomingDeadlines: 2,
  averageQuizScore: 82,
  currentCourse: 'UI Design Basics',
  completionPercentage: 35,
};

const AICoachHome: React.FC = () => {
  return (
    <StudentAppLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#E7F0FF] via-[#F9F0FF] to-[#E3F4FF] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-6 transition-colors">
        <div className="max-w-1xl">
          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">AI Student Coach</h1>
            <p className="text-slate-600 dark:text-slate-400">Personalized guidance based on your learning activity.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Content Area (Left 8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              <AIChatPanel />
              <AIPersonalizedStudyPlan />
            </div>

            {/* Sidebar Tools (Right 4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              <AIProgressRecommendations progress={studentProgress} />
              <AIRevisionTasks />
              <AIExplainSimplyCard />
              <AIMilestoneNotifications progress={studentProgress} />
            </div>
          </div>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default AICoachHome;
