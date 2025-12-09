import React, { useState } from 'react';

interface KpiDetail {
  label: string;
  value: string;
  trend: string;
  icon: string;
  color: string;
  description: string;
  breakdown?: { label: string; value: string }[];
}

const CommunityKpiStrip: React.FC = () => {
  const [selectedKpi, setSelectedKpi] = useState<KpiDetail | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const kpis: KpiDetail[] = [
    { 
      label: 'Active Groups', 
      value: '15', 
      trend: '+2', 
      icon: '🏘️', 
      color: 'green',
      description: 'Total number of active community groups with recent activity',
      breakdown: [
        { label: 'Course Groups', value: '8' },
        { label: 'Cohort Groups', value: '4' },
        { label: 'General Groups', value: '3' },
      ]
    },
    { 
      label: 'Posts (7d)', 
      value: '243', 
      trend: '+18%', 
      icon: '💬', 
      color: 'blue',
      description: 'Total posts created in the last 7 days across all communities',
      breakdown: [
        { label: 'Questions', value: '89' },
        { label: 'Discussions', value: '112' },
        { label: 'Announcements', value: '42' },
      ]
    },
    { 
      label: 'Reported Posts', 
      value: '8', 
      trend: '-3', 
      icon: '🚨', 
      color: 'red',
      description: 'Posts flagged for review by community members',
      breakdown: [
        { label: 'Spam', value: '4' },
        { label: 'Inappropriate', value: '2' },
        { label: 'Off-topic', value: '2' },
      ]
    },
    { 
      label: 'Active Members', 
      value: '1,847', 
      trend: '+127', 
      icon: '👥', 
      color: 'purple',
      description: 'Members who posted or commented in the last 30 days',
      breakdown: [
        { label: 'New this month', value: '127' },
        { label: 'Returning', value: '892' },
        { label: 'Power users', value: '45' },
      ]
    },
    { 
      label: 'Engagement Rate', 
      value: '68%', 
      trend: '+5%', 
      icon: '📊', 
      color: 'teal',
      description: 'Percentage of members actively participating',
      breakdown: [
        { label: 'Posts per user', value: '2.3' },
        { label: 'Comments per post', value: '4.7' },
        { label: 'Avg. response time', value: '2.4h' },
      ]
    },
  ];

  const showFeedback = (message: string) => {
    setActionFeedback(message);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; trend: string; border: string }> = {
      green: { bg: 'bg-green-50', text: 'text-green-700', trend: 'text-green-600', border: 'border-green-200' },
      blue: { bg: 'bg-blue-50', text: 'text-blue-700', trend: 'text-blue-600', border: 'border-blue-200' },
      red: { bg: 'bg-red-50', text: 'text-red-700', trend: 'text-red-600', border: 'border-red-200' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-700', trend: 'text-purple-600', border: 'border-purple-200' },
      teal: { bg: 'bg-teal-50', text: 'text-teal-700', trend: 'text-teal-600', border: 'border-teal-200' },
    };
    return colors[color] || colors.green;
  };

  return (
    <>
      {/* Action Feedback Toast */}
      {actionFeedback && (
        <div className="fixed top-4 right-4 z-[60] px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 bg-green-500 text-white">
          <span className="text-lg">✅</span>
          <p className="text-sm font-medium">{actionFeedback}</p>
          <button onClick={() => setActionFeedback(null)} className="text-white/80 hover:text-white">×</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {kpis.map((kpi, index) => {
          const colorClasses = getColorClasses(kpi.color);
          return (
            <div
              key={index}
              className={`${colorClasses.bg} rounded-2xl p-6 border border-gray-100 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all`}
              onClick={() => setSelectedKpi(kpi)}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{kpi.icon}</span>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${colorClasses.trend} bg-white`}>
                  {kpi.trend}
                </span>
              </div>
              <p className="text-3xl font-bold mb-1 text-text-primary">{kpi.value}</p>
              <p className="text-xs text-text-muted font-medium">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* KPI Detail Modal */}
      {selectedKpi && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedKpi.icon}</span>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">{selectedKpi.label}</h3>
                    <p className="text-sm text-text-muted">{selectedKpi.description}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedKpi(null)} className="text-2xl text-text-muted hover:text-text-primary">×</button>
              </div>

              <div className={`p-4 ${getColorClasses(selectedKpi.color).bg} rounded-xl mb-4 text-center`}>
                <p className={`text-4xl font-bold ${getColorClasses(selectedKpi.color).text}`}>{selectedKpi.value}</p>
                <p className={`text-sm font-medium ${getColorClasses(selectedKpi.color).trend}`}>
                  {selectedKpi.trend} from last period
                </p>
              </div>

              {selectedKpi.breakdown && (
                <div className="space-y-2 mb-4">
                  <h4 className="text-sm font-semibold text-text-secondary">Breakdown</h4>
                  {selectedKpi.breakdown.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-text-primary">{item.label}</span>
                      <span className="text-sm font-bold text-text-primary">{item.value}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    showFeedback(`Opening detailed ${selectedKpi.label} analytics...`);
                    setSelectedKpi(null);
                  }}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 text-sm font-medium"
                >
                  View Full Report
                </button>
                <button
                  onClick={() => {
                    showFeedback(`Exporting ${selectedKpi.label} data...`);
                    setSelectedKpi(null);
                  }}
                  className="px-4 py-2 bg-white border border-gray-200 text-text-primary rounded-xl hover:bg-gray-50 text-sm font-medium"
                >
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CommunityKpiStrip;
