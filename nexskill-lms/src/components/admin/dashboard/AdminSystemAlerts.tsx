import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

interface SystemAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
  resolved?: boolean;
}

interface AdminSystemAlertsProps {
  alerts: SystemAlert[];
}

const AdminSystemAlerts: React.FC<AdminSystemAlertsProps> = ({ alerts: initialAlerts }) => {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  // Sync with props when parent re-fetches
  useEffect(() => {
    setAlerts(initialAlerts);
  }, [initialAlerts]);

  const handleResolve = async (id: string) => {
    // If it's a real notification (UUID), update the database
    if (id.length > 20) {
      try {
        const { error } = await supabase.rpc('mark_admin_notification_read', { p_notif_id: id });
        if (error) throw error;
      } catch (err) {
        console.error('Error resolving notification:', err);
        return;
      }
    }

    // Update local UI immediately
    setAlerts((prev) =>
      prev.map((alert) => (alert.id === id ? { ...alert, resolved: true } : alert))
    );
    console.log('Resolved alert:', id);
  };

  const handleViewDetails = (alert: SystemAlert) => {
    console.log('View alert details:', alert);
    window.alert('Alert details would open in a modal or detail panel');
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (activeFilter === 'all') return true;
    return alert.severity === activeFilter;
  });

  const getSeverityConfig = (severity: SystemAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return {
          badge: 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]',
          icon: '🚨',
          label: 'Critical',
        };
      case 'warning':
        return {
          badge: 'bg-[#FEF3C7] text-[#D97706] border-[#FCD34D]',
          icon: '⚠️',
          label: 'Warning',
        };
      case 'info':
        return {
          badge: 'bg-[#DBEAFE] text-[#2563EB] border-[#93C5FD]',
          icon: 'ℹ️',
          label: 'Info',
        };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#EDF0FB] p-6 shadow-md">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#111827] mb-1">System Alerts</h2>
          <p className="text-sm text-[#5F6473]">Platform health and operational status</p>
        </div>
        <div className="flex gap-2">
          {(['all', 'critical', 'warning', 'info'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                activeFilter === filter
                  ? 'bg-[#304DB5] text-white'
                  : 'bg-[#F5F7FF] text-[#5F6473] hover:bg-[#EDF0FB]'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredAlerts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-[#9CA3B5] text-sm">No alerts in this category</p>
          </div>
        )}
        {filteredAlerts.map((alert, index) => {
          const config = getSeverityConfig(alert.severity);
          return (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border transition-all ${
                alert.resolved
                  ? 'bg-[#F9FAFB] border-[#E5E7EB] opacity-60'
                  : 'bg-gradient-to-r from-white to-[#FEFEFE] border-[#EDF0FB] hover:shadow-md'
              } ${index !== 0 ? 'border-t' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-2xl">{config.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${config.badge}`}
                      >
                        {config.label}
                      </span>
                      <span className="text-xs text-[#9CA3B5]">{alert.timestamp}</span>
                      {alert.resolved && (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-[#D1FAE5] text-[#059669] border border-[#6EE7B7]">
                          Resolved
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-[#111827] mb-1">{alert.title}</h3>
                    <p className="text-sm text-[#5F6473]">{alert.description}</p>
                  </div>
                </div>
                {!alert.resolved && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="px-4 py-2 bg-[#22C55E] text-white text-sm font-semibold rounded-full hover:bg-[#16A34A] transition-colors"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => handleViewDetails(alert)}
                      className="px-4 py-2 bg-[#F5F7FF] text-[#304DB5] text-sm font-semibold rounded-full hover:bg-[#EDF0FB] transition-colors"
                    >
                      Details
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminSystemAlerts;
