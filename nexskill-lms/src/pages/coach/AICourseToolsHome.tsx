import React, { useState } from 'react';
import CoachAppLayout from '../../layouts/CoachAppLayout';
import AICourseOutlineTool from '../../components/coach/ai/AICourseOutlineTool';
import AILessonCreatorTool from '../../components/coach/ai/AILessonCreatorTool';
import AIQuizGeneratorTool from '../../components/coach/ai/AIQuizGeneratorTool';
import AIVideoScriptTool from '../../components/coach/ai/AIVideoScriptTool';
import AISocialCaptionTool from '../../components/coach/ai/AISocialCaptionTool';
import AISalesPageCopyTool from '../../components/coach/ai/AISalesPageCopyTool';

type ActiveTool = 'outline' | 'lesson' | 'quiz' | 'video-script' | 'social-captions' | 'sales-page';

const AICourseToolsHome: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ActiveTool>('outline');

  const kpiCards = [
    {
      label: 'Drafts created this week',
      value: '0',
      icon: '📝',
      bgColor: 'from-blue-50 to-blue-100',
    },
    {
      label: 'Courses using AI tools',
      value: '0',
      icon: '🤖',
      bgColor: 'from-purple-50 to-purple-100',
    },
    {
      label: 'Estimated time saved',
      value: '0h',
      icon: '⏱️',
      bgColor: 'from-green-50 to-green-100',
    },
  ];

  const toolTabs = [
    { id: 'outline' as ActiveTool, label: 'Outline', icon: '📋' },
    { id: 'lesson' as ActiveTool, label: 'Lesson', icon: '📖' },
    { id: 'quiz' as ActiveTool, label: 'Quiz', icon: '❓' },
    { id: 'video-script' as ActiveTool, label: 'Video script', icon: '🎬' },
    { id: 'social-captions' as ActiveTool, label: 'Social captions', icon: '📱' },
    { id: 'sales-page' as ActiveTool, label: 'Sales page copy', icon: '📄' },
  ];

  return (
    <CoachAppLayout>
      <div className="flex-1 overflow-y-auto p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#111827] mb-2">AI Course Tools</h1>
          <p className="text-lg text-[#5F6473]">
            Speed up your course creation with AI-assisted workflows.
          </p>
        </div>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {kpiCards.map((kpi, index) => (
            <div
              key={index}
              className={`bg-gradient-to-br ${kpi.bgColor} rounded-2xl p-6 shadow-md`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">{kpi.icon}</span>
                <div className="text-4xl font-bold text-[#304DB5]">{kpi.value}</div>
              </div>
              <p className="text-sm font-medium text-[#5F6473]">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Tool Tabs */}
        <div className="flex flex-wrap gap-3 mb-6">
          {toolTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTool(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                activeTool === tab.id
                  ? 'bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white shadow-lg'
                  : 'bg-white text-[#5F6473] hover:bg-[#F5F7FF] dark:hover:bg-gray-800 dark:bg-gray-800 hover:text-[#304DB5] border border-[#EDF0FB] dark:border-gray-700'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tool Panel Container */}
        <div className="bg-white dark:bg-dark-background-card rounded-3xl shadow-xl p-8">
          {activeTool === 'outline' && <AICourseOutlineTool />}
          {activeTool === 'lesson' && <AILessonCreatorTool />}
          {activeTool === 'quiz' && <AIQuizGeneratorTool />}
          {activeTool === 'video-script' && <AIVideoScriptTool />}
          {activeTool === 'social-captions' && <AISocialCaptionTool />}
          {activeTool === 'sales-page' && <AISalesPageCopyTool />}
        </div>
      </div>
    </CoachAppLayout>
  );
};

export default AICourseToolsHome;
