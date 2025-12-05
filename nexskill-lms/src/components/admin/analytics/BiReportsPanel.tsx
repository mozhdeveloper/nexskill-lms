import React, { useState } from 'react';

interface BiReport {
  id: string;
  name: string;
  category: 'Engagement' | 'Revenue' | 'Learning' | 'Operations';
  description: string;
  lastGeneratedAt?: string;
  schedule: 'none' | 'daily' | 'weekly' | 'monthly';
  format: 'table' | 'chart' | 'mixed';
}

interface RecentExport {
  id: string;
  reportName: string;
  generatedAt: string;
  generatedBy: string;
  format: 'CSV' | 'XLSX' | 'PDF';
  status: 'ready' | 'processing' | 'failed';
}

interface BiReports {
  availableReports: BiReport[];
  recentExports: RecentExport[];
}

interface BiReportsPanelProps {
  data: BiReports;
}

const BiReportsPanel: React.FC<BiReportsPanelProps> = ({ data: initialData }) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [data, setData] = useState<BiReports>(initialData);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredReports = data.availableReports.filter((report) => {
    const matchesCategory = categoryFilter === 'All' || report.category === categoryFilter;
    const matchesSearch =
      searchQuery === '' || report.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleGenerateNow = (reportId: string) => {
    const report = data.availableReports.find((r) => r.id === reportId);
    if (!report) return;

    const now = new Date().toISOString();
    setData({
      ...data,
      availableReports: data.availableReports.map((r) =>
        r.id === reportId ? { ...r, lastGeneratedAt: now } : r
      ),
      recentExports: [
        {
          id: `export-${Date.now()}`,
          reportName: report.name,
          generatedAt: now,
          generatedBy: 'Admin User',
          format: 'PDF',
          status: 'processing',
        },
        ...data.recentExports,
      ],
    });

    showNotification(`Generating"${report.name}"...`);
    console.log(`[BI Reports] Generate now: ${report.name}`);

    // Simulate completion after 2 seconds
    setTimeout(() => {
      setData((prev) => ({
        ...prev,
        recentExports: prev.recentExports.map((exp) =>
          exp.reportName === report.name && exp.status === 'processing'
            ? { ...exp, status: 'ready' }
            : exp
        ),
      }));
    }, 2000);
  };

  const handleScheduleChange = (reportId: string, newSchedule: BiReport['schedule']) => {
    setData({
      ...data,
      availableReports: data.availableReports.map((r) =>
        r.id === reportId ? { ...r, schedule: newSchedule } : r
      ),
    });
    showNotification(`Schedule updated to"${newSchedule}"`);
    console.log(`[BI Reports] Schedule changed for ${reportId}: ${newSchedule}`);
  };

  const handleDownload = (exportId: string) => {
    const exp = data.recentExports.find((e) => e.id === exportId);
    showNotification(`Download simulated: ${exp?.reportName} (${exp?.format})`);
    console.log(`[BI Reports] Download: ${exportId}`);
  };

  const handleOpenReport = (reportId: string) => {
    const report = data.availableReports.find((r) => r.id === reportId);
    showNotification(`Opening"${report?.name}"...`);
    console.log(`[BI Reports] Open report: ${reportId}`);
  };

  const getCategoryBadgeColor = (category: BiReport['category']) => {
    switch (category) {
      case 'Engagement':
        return 'bg-blue-100 text-blue-700';
      case 'Revenue':
        return 'bg-green-100 text-green-700';
      case 'Learning':
        return 'bg-purple-100 text-purple-700';
      case 'Operations':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusBadgeColor = (status: RecentExport['status']) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-700';
      case 'processing':
        return 'bg-yellow-100 text-yellow-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">BI Reports</h2>
        <p className="text-gray-600">Access predefined, board-ready analytics views.</p>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="bg-[#304DB5] text-white rounded-2xl p-4 shadow-md animate-fade-in">
          <p className="text-sm font-medium">{notification}</p>
        </div>
      )}

      {/* Available Reports Section */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Available Reports</h3>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#304DB5] focus:border-transparent"
            >
              <option value="All">All</option>
              <option value="Engagement">Engagement</option>
              <option value="Revenue">Revenue</option>
              <option value="Learning">Learning</option>
              <option value="Operations">Operations</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports by name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#304DB5] focus:border-transparent"
            />
          </div>
        </div>

        {/* Report List */}
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-base font-bold text-gray-900">{report.name}</h4>
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${getCategoryBadgeColor(
                        report.category
                      )}`}
                    >
                      {report.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>
                      Last generated:{' '}
                      {report.lastGeneratedAt
                        ? new Date(report.lastGeneratedAt).toLocaleString()
                        : 'Never run'}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
                      Schedule: {report.schedule === 'none' ? 'None' : report.schedule}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleOpenReport(report.id)}
                    className="px-4 py-2 bg-[#304DB5] text-white rounded-full text-sm font-medium hover:bg-[#253a8a] transition-colors"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => handleGenerateNow(report.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    Generate Now
                  </button>
                  <select
                    value={report.schedule}
                    onChange={(e) =>
                      handleScheduleChange(report.id, e.target.value as BiReport['schedule'])
                    }
                    className="px-4 py-2 border border-gray-300 rounded-full text-sm font-medium focus:ring-2 focus:ring-[#304DB5] focus:border-transparent"
                  >
                    <option value="none">No Schedule</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
          {filteredReports.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No reports match your current filters.
            </div>
          )}
        </div>
      </div>

      {/* Recent Exports Section */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Exports</h3>
        {data.recentExports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No exports yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-sm font-semibold text-gray-700 pb-3">
                    Report Name
                  </th>
                  <th className="text-left text-sm font-semibold text-gray-700 pb-3">
                    Generated At
                  </th>
                  <th className="text-left text-sm font-semibold text-gray-700 pb-3">
                    Generated By
                  </th>
                  <th className="text-left text-sm font-semibold text-gray-700 pb-3">Format</th>
                  <th className="text-left text-sm font-semibold text-gray-700 pb-3">Status</th>
                  <th className="text-left text-sm font-semibold text-gray-700 pb-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.recentExports.map((exp) => (
                  <tr key={exp.id} className="border-b border-gray-100">
                    <td className="py-3 text-sm text-gray-900">{exp.reportName}</td>
                    <td className="py-3 text-sm text-gray-600">
                      {new Date(exp.generatedAt).toLocaleString()}
                    </td>
                    <td className="py-3 text-sm text-gray-600">{exp.generatedBy}</td>
                    <td className="py-3 text-sm text-gray-600">{exp.format}</td>
                    <td className="py-3">
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusBadgeColor(
                          exp.status
                        )}`}
                      >
                        {exp.status}
                      </span>
                    </td>
                    <td className="py-3">
                      {exp.status === 'ready' && (
                        <button
                          onClick={() => handleDownload(exp.id)}
                          className="text-sm text-[#304DB5] hover:underline font-medium"
                        >
                          Download
                        </button>
                      )}
                      {exp.status === 'processing' && (
                        <span className="text-sm text-gray-400">Processing...</span>
                      )}
                      {exp.status === 'failed' && (
                        <span className="text-sm text-red-600">Failed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BiReportsPanel;
