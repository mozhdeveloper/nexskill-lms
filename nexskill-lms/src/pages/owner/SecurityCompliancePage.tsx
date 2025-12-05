import React, { useState } from 'react';
import PlatformOwnerAppLayout from '../../layouts/PlatformOwnerAppLayout';

interface SecurityAlert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timestamp: string;
  status: 'active' | 'resolved';
}

interface AccessLog {
  id: string;
  user: string;
  action: string;
  resource: string;
  timestamp: string;
  status: 'success' | 'failed';
  ipAddress: string;
}

const SecurityCompliancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'logs' | 'compliance'>('overview');

  // Dummy security metrics
  const securityMetrics = {
    activeUsers: 12847,
    failedLoginAttempts: 23,
    suspendedAccounts: 7,
    twoFactorEnabled: 8234,
    twoFactorPercentage: 64,
    lastSecurityScan: '2 hours ago',
    vulnerabilities: 2,
  };

  // Dummy security alerts
  const securityAlerts: SecurityAlert[] = [
    {
      id: 'alert-1',
      severity: 'critical',
      title: 'Multiple failed login attempts detected',
      description: 'User account john.doe@example.com has 15 failed login attempts in the last hour from IP 192.168.1.100',
      timestamp: '1 hour ago',
      status: 'active',
    },
    {
      id: 'alert-2',
      severity: 'high',
      title: 'Unusual API access pattern',
      description: 'API key"prod_key_123" making requests at 10x normal rate',
      timestamp: '3 hours ago',
      status: 'active',
    },
    {
      id: 'alert-3',
      severity: 'medium',
      title: 'SSL certificate expiring soon',
      description: 'Certificate for api.nexskill.com expires in 15 days',
      timestamp: '1 day ago',
      status: 'active',
    },
    {
      id: 'alert-4',
      severity: 'low',
      title: 'New admin account created',
      description: 'Admin account"sarah.johnson@nexskill.com" was created by Platform Owner',
      timestamp: '2 days ago',
      status: 'resolved',
    },
  ];

  // Dummy access logs
  const accessLogs: AccessLog[] = [
    {
      id: 'log-1',
      user: 'alice@nexskill.com',
      action: 'User account suspended',
      resource: 'user_12345',
      timestamp: '5 minutes ago',
      status: 'success',
      ipAddress: '203.0.113.1',
    },
    {
      id: 'log-2',
      user: 'bob@nexskill.com',
      action: 'Viewed financial reports',
      resource: 'billing_dashboard',
      timestamp: '15 minutes ago',
      status: 'success',
      ipAddress: '203.0.113.2',
    },
    {
      id: 'log-3',
      user: 'unknown',
      action: 'Failed admin login',
      resource: 'admin_portal',
      timestamp: '1 hour ago',
      status: 'failed',
      ipAddress: '192.168.1.100',
    },
    {
      id: 'log-4',
      user: 'carol@nexskill.com',
      action: 'Updated system settings',
      resource: 'global_config',
      timestamp: '2 hours ago',
      status: 'success',
      ipAddress: '203.0.113.3',
    },
    {
      id: 'log-5',
      user: 'david@nexskill.com',
      action: 'Exported user data',
      resource: 'user_export',
      timestamp: '3 hours ago',
      status: 'success',
      ipAddress: '203.0.113.4',
    },
  ];

  // Compliance checklist
  const complianceItems = [
    { id: 1, category: 'Data Protection', item: 'GDPR compliance', status: 'compliant', lastCheck: 'Nov 28, 2025' },
    { id: 2, category: 'Data Protection', item: 'CCPA compliance', status: 'compliant', lastCheck: 'Nov 28, 2025' },
    { id: 3, category: 'Security', item: 'SOC 2 Type II certification', status: 'compliant', lastCheck: 'Oct 15, 2025' },
    { id: 4, category: 'Security', item: 'ISO 27001 certification', status: 'in-progress', lastCheck: 'Dec 1, 2025' },
    { id: 5, category: 'Payments', item: 'PCI DSS compliance', status: 'compliant', lastCheck: 'Nov 20, 2025' },
    { id: 6, category: 'Accessibility', item: 'WCAG 2.1 Level AA', status: 'needs-review', lastCheck: 'Sep 10, 2025' },
  ];

  return (
    <PlatformOwnerAppLayout>
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#EDF0FB]">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Security & Compliance</h1>
          <p className="text-sm text-text-secondary">
            Access control, authentication, and security monitoring
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-[#EDF0FB]">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'text-brand-primary border-b-2 border-brand-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'alerts'
                  ? 'text-brand-primary border-b-2 border-brand-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Security Alerts
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'logs'
                  ? 'text-brand-primary border-b-2 border-brand-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Access Logs
            </button>
            <button
              onClick={() => setActiveTab('compliance')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'compliance'
                  ? 'text-brand-primary border-b-2 border-brand-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Compliance
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Security Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-6 border border-[#EDF0FB]">
                  <span className="text-2xl mb-2 block">👥</span>
                  <p className="text-2xl font-bold text-text-primary mb-1">
                    {securityMetrics.activeUsers.toLocaleString()}
                  </p>
                  <p className="text-xs text-text-muted">Active Users</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-[#EDF0FB]">
                  <span className="text-2xl mb-2 block">⚠️</span>
                  <p className="text-2xl font-bold text-amber-600 mb-1">
                    {securityMetrics.failedLoginAttempts}
                  </p>
                  <p className="text-xs text-text-muted">Failed Logins (24h)</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-[#EDF0FB]">
                  <span className="text-2xl mb-2 block">🔒</span>
                  <p className="text-2xl font-bold text-text-primary mb-1">
                    {securityMetrics.twoFactorPercentage}%
                  </p>
                  <p className="text-xs text-text-muted">2FA Enabled</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-[#EDF0FB]">
                  <span className="text-2xl mb-2 block">🛡️</span>
                  <p className="text-2xl font-bold text-green-600 mb-1">
                    {securityMetrics.vulnerabilities}
                  </p>
                  <p className="text-xs text-text-muted">Open Vulnerabilities</p>
                </div>
              </div>

              {/* Active Alerts Summary */}
              <div className="bg-white rounded-2xl p-6 border border-[#EDF0FB]">
                <h3 className="text-lg font-bold text-text-primary mb-4">Active Security Alerts</h3>
                <div className="space-y-3">
                  {securityAlerts.filter(a => a.status === 'active').slice(0, 3).map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-xl border-l-4 ${
                        alert.severity === 'critical'
                          ? 'bg-red-50 border-red-500'
                          : alert.severity === 'high'
                          ? 'bg-orange-50 border-orange-500'
                          : 'bg-yellow-50 border-yellow-500'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-text-primary">{alert.title}</p>
                          <p className="text-xs text-text-secondary mt-1">{alert.description}</p>
                          <p className="text-xs text-text-muted mt-2">{alert.timestamp}</p>
                        </div>
                        <span
                          className={`text-xs font-medium px-3 py-1 rounded-full ${
                            alert.severity === 'critical'
                              ? 'bg-red-200 text-red-800'
                              : alert.severity === 'high'
                              ? 'bg-orange-200 text-orange-800'
                              : 'bg-yellow-200 text-yellow-800'
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setActiveTab('alerts')}
                  className="w-full mt-4 py-3 bg-brand-primary-soft text-brand-primary rounded-xl font-medium text-sm hover:bg-brand-primary hover:text-white transition-colors"
                >
                  View All Alerts →
                </button>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => console.log('Run security scan')}
                  className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200 text-left hover:shadow-lg transition-shadow"
                >
                  <span className="text-2xl mb-3 block">🔍</span>
                  <h4 className="text-lg font-bold text-text-primary mb-2">Run Security Scan</h4>
                  <p className="text-sm text-text-secondary">
                    Last scan: {securityMetrics.lastSecurityScan}
                  </p>
                </button>

                <button
                  onClick={() => console.log('View audit logs')}
                  className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200 text-left hover:shadow-lg transition-shadow"
                >
                  <span className="text-2xl mb-3 block">📋</span>
                  <h4 className="text-lg font-bold text-text-primary mb-2">Audit Logs</h4>
                  <p className="text-sm text-text-secondary">
                    View comprehensive system activity logs
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              {securityAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`bg-white rounded-2xl p-6 border ${
                    alert.status === 'active' ? 'border-[#EDF0FB]' : 'border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          alert.severity === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : alert.severity === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : alert.severity === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          alert.status === 'active'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {alert.status}
                      </span>
                    </div>
                    <span className="text-xs text-text-muted">{alert.timestamp}</span>
                  </div>
                  <h4 className="text-base font-bold text-text-primary mb-2">{alert.title}</h4>
                  <p className="text-sm text-text-secondary mb-4">{alert.description}</p>
                  {alert.status === 'active' && (
                    <button
                      onClick={() => console.log('Investigate alert:', alert.id)}
                      className="text-sm text-brand-primary hover:text-brand-primary-dark font-medium"
                    >
                      Investigate →
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className="bg-white rounded-2xl border border-[#EDF0FB] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F5F7FF]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-text-primary uppercase">
                        Timestamp
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-text-primary uppercase">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-text-primary uppercase">
                        Action
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-text-primary uppercase">
                        Resource
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-text-primary uppercase">
                        IP Address
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-text-primary uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDF0FB]">
                    {accessLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#F5F7FF] transition-colors">
                        <td className="px-6 py-4 text-sm text-text-secondary">{log.timestamp}</td>
                        <td className="px-6 py-4 text-sm font-medium text-text-primary">
                          {log.user}
                        </td>
                        <td className="px-6 py-4 text-sm text-text-secondary">{log.action}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary font-mono">
                          {log.resource}
                        </td>
                        <td className="px-6 py-4 text-sm text-text-secondary font-mono">
                          {log.ipAddress}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                              log.status === 'success'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Compliance Tab */}
          {activeTab === 'compliance' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-[#EDF0FB]">
                <h3 className="text-lg font-bold text-text-primary mb-4">Compliance Status</h3>
                <div className="space-y-4">
                  {complianceItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-[#EDF0FB] hover:bg-[#F5F7FF] transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-xs font-medium text-text-muted bg-[#F5F7FF] px-2 py-1 rounded">
                            {item.category}
                          </span>
                          <h4 className="text-sm font-semibold text-text-primary">{item.item}</h4>
                        </div>
                        <p className="text-xs text-text-muted">Last checked: {item.lastCheck}</p>
                      </div>
                      <span
                        className={`px-4 py-2 rounded-full text-xs font-medium ${
                          item.status === 'compliant'
                            ? 'bg-green-100 text-green-800'
                            : item.status === 'in-progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.status === 'compliant' ? '✓ Compliant' : item.status === 'in-progress' ? '⏳ In Progress' : '⚠️ Needs Review'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PlatformOwnerAppLayout>
  );
};

export default SecurityCompliancePage;
