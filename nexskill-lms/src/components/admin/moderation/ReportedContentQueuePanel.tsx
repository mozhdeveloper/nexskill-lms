import React, { useState } from 'react';

interface Report {
  id: string;
  courseId: string;
  courseTitle: string;
  reporterType: 'student' | 'coach' | 'system';
  reasonCategory: string;
  reasonSnippet: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  createdAt: string;
}

interface ReportedContentQueuePanelProps {
  reports: Report[];
  onInvestigate: (reportId: string) => void;
  onResolve: (reportId: string) => void;
  onDismiss: (reportId: string) => void;
}

const ReportedContentQueuePanel: React.FC<ReportedContentQueuePanelProps> = ({
  reports,
  onInvestigate,
  onResolve,
  onDismiss,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const getSeverityConfig = (severity: Report['severity']) => {
    switch (severity) {
      case 'critical':
        return {
          label: 'Critical',
          bg: 'bg-[#FEE2E2]',
          text: 'text-[#991B1B]',
          border: 'border-[#FCA5A5]',
          icon: '🚨',
        };
      case 'high':
        return {
          label: 'High',
          bg: 'bg-[#FED7AA]',
          text: 'text-[#9A3412]',
          border: 'border-[#FDBA74]',
          icon: '⚠️',
        };
      case 'medium':
        return {
          label: 'Medium',
          bg: 'bg-[#FEF3C7]',
          text: 'text-[#92400E]',
          border: 'border-[#FCD34D]',
          icon: '⚡',
        };
      case 'low':
        return {
          label: 'Low',
          bg: 'bg-[#DBEAFE]',
          text: 'text-[#1E40AF]',
          border: 'border-[#93C5FD]',
          icon: 'ℹ️',
        };
    }
  };

  const getStatusConfig = (status: Report['status']) => {
    switch (status) {
      case 'open':
        return {
          label: 'Open',
          bg: 'bg-[#DBEAFE]',
          text: 'text-[#1E40AF]',
        };
      case 'investigating':
        return {
          label: 'Investigating',
          bg: 'bg-[#FEF3C7]',
          text: 'text-[#92400E]',
        };
      case 'resolved':
        return {
          label: 'Resolved',
          bg: 'bg-[#D1FAE5]',
          text: 'text-[#047857]',
        };
      case 'dismissed':
        return {
          label: 'Dismissed',
          bg: 'bg-[#F3F4F6]',
          text: 'text-[#4B5563]',
        };
    }
  };

  const getReporterIcon = (reporterType: Report['reporterType']) => {
    switch (reporterType) {
      case 'student':
        return '👤';
      case 'coach':
        return '🎓';
      case 'system':
        return '🤖';
    }
  };

  const filteredReports = reports.filter((report) => {
    if (filterStatus !== 'all' && report.status !== filterStatus) return false;
    if (filterSeverity !== 'all' && report.severity !== filterSeverity) return false;
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-[#EDF0FB] p-6 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-[#111827]">Reported Content</h2>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FEE2E2] text-[#991B1B]">
          {filteredReports.filter((r) => r.status === 'open').length} Open
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-xs border border-[#E5E7EB] rounded-full px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>

        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="text-xs border border-[#E5E7EB] rounded-full px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
        >
          <option value="all">All Severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {(filterStatus !== 'all' || filterSeverity !== 'all') && (
          <button
            onClick={() => {
              setFilterStatus('all');
              setFilterSeverity('all');
            }}
            className="text-xs text-[#304DB5] hover:text-[#5E7BFF] font-semibold"
          >
            Reset
          </button>
        )}
      </div>

      {/* Reports List */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">✅</div>
            <p className="text-sm font-semibold text-[#111827] mb-1">No reports found</p>
            <p className="text-xs text-[#9CA3B5]">No content reports match your filters</p>
          </div>
        )}

        {filteredReports.map((report) => {
          const severityConfig = getSeverityConfig(report.severity);
          const statusConfig = getStatusConfig(report.status);

          return (
            <div
              key={report.id}
              className={`p-4 rounded-xl border ${severityConfig.border} bg-gradient-to-br ${severityConfig.bg} to-white`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{severityConfig.icon}</span>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${severityConfig.bg} ${severityConfig.text}`}
                      >
                        {severityConfig.label}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-[#9CA3B5]">{report.createdAt}</span>
              </div>

              {/* Course & Category */}
              <div className="mb-2">
                <p className="text-sm font-bold text-[#111827] mb-1">{report.courseTitle}</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{getReporterIcon(report.reporterType)}</span>
                  <span className="text-xs text-[#5F6473] capitalize">
                    {report.reporterType} report
                  </span>
                  <span className="text-xs text-[#9CA3B5]">•</span>
                  <span className="text-xs text-[#5F6473]">{report.reasonCategory}</span>
                </div>
              </div>

              {/* Reason Snippet */}
              <p className="text-xs text-[#5F6473] mb-3 line-clamp-2">
"{report.reasonSnippet}"
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#E5E7EB]/50">
                {report.status === 'open' && (
                  <>
                    <button
                      onClick={() => onInvestigate(report.id)}
                      className="text-xs font-semibold text-[#304DB5] hover:text-[#5E7BFF] transition-colors"
                    >
                      Investigate
                    </button>
                    <span className="text-[#E5E7EB]">|</span>
                    <button
                      onClick={() => onResolve(report.id)}
                      className="text-xs font-semibold text-[#059669] hover:text-[#10B981] transition-colors"
                    >
                      Resolve
                    </button>
                    <span className="text-[#E5E7EB]">|</span>
                    <button
                      onClick={() => onDismiss(report.id)}
                      className="text-xs font-semibold text-[#9CA3B5] hover:text-[#5F6473] transition-colors"
                    >
                      Dismiss
                    </button>
                  </>
                )}

                {report.status === 'investigating' && (
                  <>
                    <button
                      onClick={() => onResolve(report.id)}
                      className="text-xs font-semibold text-[#059669] hover:text-[#10B981] transition-colors"
                    >
                      Resolve
                    </button>
                    <span className="text-[#E5E7EB]">|</span>
                    <button
                      onClick={() => onDismiss(report.id)}
                      className="text-xs font-semibold text-[#9CA3B5] hover:text-[#5F6473] transition-colors"
                    >
                      Dismiss
                    </button>
                  </>
                )}

                {(report.status === 'resolved' || report.status === 'dismissed') && (
                  <span className="text-xs text-[#9CA3B5] italic">
                    No actions available
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReportedContentQueuePanel;
