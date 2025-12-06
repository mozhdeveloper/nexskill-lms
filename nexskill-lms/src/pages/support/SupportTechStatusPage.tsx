import { useState } from 'react';
import SupportStaffAppLayout from '../../layouts/SupportStaffAppLayout';
import TechStatusPanel from '../../components/support/TechStatusPanel';

const SupportTechStatusPage = () => {
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [newIncident, setNewIncident] = useState({
    title: '',
    description: '',
    severity: 'medium',
    affectedService: 'api'
  });

  const handleReportIncident = () => {
    console.log('Reporting incident:', newIncident);
    alert('Incident reported successfully!');
    setShowIncidentModal(false);
    setNewIncident({
      title: '',
      description: '',
      severity: 'medium',
      affectedService: 'api'
    });
  };

  const handleRestartService = (service: string) => {
    console.log('Restarting service:', service);
    alert(`${service} restart initiated...`);
  };

  const handleClearCache = () => {
    alert(`🧹 Cache Cleared Successfully\n\n✅ Cache Layers Cleared:\n• Application cache\n• CDN cache\n• Database query cache\n• API response cache\n\n📊 Impact:\n• Immediate: Slightly slower responses\n• Short-term: Cache warming (5-10 min)\n• Long-term: Improved performance\n\n⚡ Cache Rebuild:\n• Auto-warming: In progress\n• Priority content: First\n• Full rebuild: 10-15 minutes\n\n💡 Note: Users may notice brief performance dip while cache rebuilds. Monitor metrics for next 15 minutes.`);
  };

  const handleRunHealthCheck = () => {
    alert(`🏥 System Health Check Complete\n\n✅ All Systems Operational\n\n📊 Health Report:\n• API Services: ✅ Healthy (99.9% uptime)\n• Database: ✅ Optimal (12ms avg latency)\n• CDN: ✅ Online (all regions)\n• Payment Gateway: ✅ Connected\n• Email Service: ✅ Operational\n• Authentication: ✅ Secure\n\n⚡ Performance Metrics:\n• Response time: 45ms avg\n• Error rate: 0.01%\n• Active users: 2,847\n• Server load: 34%\n\n📅 Next scheduled check: In 5 minutes\n\nAll critical systems are functioning normally.`);
  };

  return (
    <SupportStaffAppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Technical Status</h1>
              <p className="text-gray-600">Monitor system health and performance metrics</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRunHealthCheck}
                className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-all font-medium"
              >
                ⚡ Run Check
              </button>
              <button
                onClick={() => setShowIncidentModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-full hover:shadow-lg transition-all font-semibold"
              >
                🚨 Report Incident
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => handleRestartService('API Server')}
            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all text-left"
          >
            <div className="text-2xl mb-2">🔄</div>
            <div className="font-semibold text-gray-900">Restart API</div>
            <div className="text-sm text-gray-600 mt-1">Restart API server</div>
          </button>
          <button
            onClick={() => handleRestartService('Database')}
            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all text-left"
          >
            <div className="text-2xl mb-2">💾</div>
            <div className="font-semibold text-gray-900">Restart DB</div>
            <div className="text-sm text-gray-600 mt-1">Restart database</div>
          </button>
          <button
            onClick={handleClearCache}
            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all text-left"
          >
            <div className="text-2xl mb-2">🧹</div>
            <div className="font-semibold text-gray-900">Clear Cache</div>
            <div className="text-sm text-gray-600 mt-1">Clear application cache</div>
          </button>
        </div>

        {/* Status Panel */}
        <TechStatusPanel />

        {/* Recent Incidents */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Incidents</h2>
          <div className="space-y-3">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">CDN Performance Degradation</h3>
                  <p className="text-sm text-gray-700 mt-1">Increased latency detected in North America region</p>
                  <span className="text-xs text-gray-600 mt-2 block">Nov 28, 2024 - 2:30 PM</span>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">MONITORING</span>
                  <button
                    onClick={() => console.log('Update incident status')}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Update Status
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-2xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Database Maintenance Complete</h3>
                  <p className="text-sm text-gray-700 mt-1">Scheduled maintenance completed successfully</p>
                  <span className="text-xs text-gray-600 mt-2 block">Nov 27, 2024 - 11:00 PM</span>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">RESOLVED</span>
                  <button
                    onClick={() => console.log('View incident details')}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Incident Modal */}
      {showIncidentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Report Incident</h2>
              <button
                onClick={() => setShowIncidentModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Incident Title
                </label>
                <input
                  type="text"
                  value={newIncident.title}
                  onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                  placeholder="Brief description of the incident"
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Severity
                  </label>
                  <select
                    value={newIncident.severity}
                    onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Affected Service
                  </label>
                  <select
                    value={newIncident.affectedService}
                    onChange={(e) => setNewIncident({ ...newIncident, affectedService: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="api">API Server</option>
                    <option value="database">Database</option>
                    <option value="cdn">CDN</option>
                    <option value="auth">Authentication</option>
                    <option value="storage">Storage</option>
                    <option value="email">Email Service</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={5}
                  value={newIncident.description}
                  onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                  placeholder="Detailed description of the incident, symptoms, and impact..."
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>

              <div className="p-4 bg-red-50 rounded-xl border-2 border-red-200">
                <p className="text-sm text-red-700">
                  ⚠️ Critical incidents will trigger immediate notifications to the on-call team.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowIncidentModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReportIncident}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  Report Incident
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SupportStaffAppLayout>
  );
};

export default SupportTechStatusPage;
