import React from 'react';

interface Course {
  id: string;
  title: string;
  instructorName: string;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  qualityScore: number;
  qualityMetrics: {
    contentCompleteness: number;
    engagementPotential: number;
    productionQuality: number;
    policyCompliance: number;
  };
  qualityFlags: string[];
}

interface CourseQualityScorePanelProps {
  selectedCourse?: Course;
}

const CourseQualityScorePanel: React.FC<CourseQualityScorePanelProps> = ({ selectedCourse }) => {
  const getScoreGrade = (score: number) => {
    if (score >= 80) {
      return {
        label: 'High Quality',
        color: 'text-[#059669]',
        bg: 'bg-gradient-to-br from-[#D1FAE5] to-[#A7F3D0]',
      };
    } else if (score >= 60) {
      return {
        label: 'Medium Quality',
        color: 'text-[#D97706]',
        bg: 'bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A]',
      };
    } else {
      return {
        label: 'Needs Review',
        color: 'text-[#DC2626]',
        bg: 'bg-gradient-to-br from-[#FEE2E2] to-[#FECACA]',
      };
    }
  };

  const getStatusConfig = (status: Course['status']) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending',
          bg: 'bg-[#DBEAFE]',
          text: 'text-[#1E40AF]',
        };
      case 'approved':
        return {
          label: 'Approved',
          bg: 'bg-[#D1FAE5]',
          text: 'text-[#059669]',
        };
      case 'rejected':
        return {
          label: 'Rejected',
          bg: 'bg-[#FEE2E2]',
          text: 'text-[#DC2626]',
        };
      case 'changes_requested':
        return {
          label: 'Changes Req.',
          bg: 'bg-amber-100',
          text: 'text-amber-700',
        };
    }
  };

  const getMetricColor = (score: number) => {
    if (score >= 80) return 'from-[#22C55E] to-[#10B981]';
    if (score >= 60) return 'from-[#F59E0B] to-[#D97706]';
    return 'from-[#EF4444] to-[#DC2626]';
  };

  if (!selectedCourse) {
    return (
      <div className="bg-white rounded-2xl border border-[#EDF0FB] p-6 shadow-md">
        <h2 className="text-lg font-bold text-[#111827] mb-4">Quality Score</h2>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-sm text-[#5F6473]">
            Select a course from the queue to view its quality breakdown
          </p>
        </div>
      </div>
    );
  }

  const scoreGrade = getScoreGrade(selectedCourse.qualityScore);
  const statusConfig = getStatusConfig(selectedCourse.status);

  const metrics = [
    {
      label: 'Content Completeness',
      score: selectedCourse.qualityMetrics.contentCompleteness,
      icon: '📝',
    },
    {
      label: 'Engagement Potential',
      score: selectedCourse.qualityMetrics.engagementPotential,
      icon: '🎯',
    },
    {
      label: 'Production Quality',
      score: selectedCourse.qualityMetrics.productionQuality,
      icon: '🎬',
    },
    {
      label: 'Policy Compliance',
      score: selectedCourse.qualityMetrics.policyCompliance,
      icon: '✅',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#EDF0FB] p-6 shadow-md">
      <h2 className="text-lg font-bold text-[#111827] mb-4">Quality Score</h2>

      {/* Course Summary */}
      <div className="mb-6 p-4 bg-gradient-to-br from-[#F5F7FF] to-white rounded-xl border border-[#EDF0FB]">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <p className="font-semibold text-[#111827] text-sm mb-1">
              {selectedCourse.title}
            </p>
            <p className="text-xs text-[#9CA3B5]">by {selectedCourse.instructorName}</p>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}
          >
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Score Display */}
      <div className={`mb-6 p-6 rounded-2xl ${scoreGrade.bg} text-center`}>
        <div className="text-5xl font-bold text-[#111827] mb-2">
          {selectedCourse.qualityScore}
          <span className="text-2xl text-[#5F6473]">/100</span>
        </div>
        <p className={`text-sm font-semibold ${scoreGrade.color}`}>{scoreGrade.label}</p>
      </div>

      {/* Metrics Breakdown */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-[#111827] mb-3">Quality Breakdown</h3>
        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{metric.icon}</span>
                  <span className="text-sm font-medium text-[#111827]">{metric.label}</span>
                </div>
                <span className="text-sm font-bold text-[#111827]">{metric.score}/100</span>
              </div>
              <div className="w-full bg-[#EDF0FB] rounded-full h-2">
                <div
                  className={`bg-gradient-to-r ${getMetricColor(metric.score)} h-2 rounded-full transition-all`}
                  style={{ width: `${metric.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quality Flags */}
      {selectedCourse.qualityFlags.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-[#111827] mb-3">Quality Flags</h3>
          <div className="space-y-2">
            {selectedCourse.qualityFlags.map((flag, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-3 bg-[#FEF3C7] border border-[#FCD34D] rounded-xl"
              >
                <span className="text-[#D97706] mt-0.5">⚠️</span>
                <p className="text-xs text-[#92400E] font-medium">{flag}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedCourse.qualityFlags.length === 0 && (
        <div className="p-4 bg-[#D1FAE5] border border-[#6EE7B7] rounded-xl">
          <div className="flex items-center gap-2">
            <span className="text-[#059669]">✓</span>
            <p className="text-xs text-[#047857] font-semibold">No quality issues detected</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseQualityScorePanel;
