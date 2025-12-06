import { useNavigate } from 'react-router-dom';
import SupportStaffAppLayout from '../../layouts/SupportStaffAppLayout';
import SupportKpiStrip from '../../components/support/SupportKpiStrip';
import { Ticket, TrendingUp, Clock, Award } from 'lucide-react';

const SupportDashboardPage = () => {
  const navigate = useNavigate();
  
  const recentActivity = [
    { type: 'ticket', message: 'New ticket opened by Sarah Chen', time: '5 minutes ago', priority: 'high' },
    { type: 'resolved', message: 'Ticket T-2398 resolved successfully', time: '15 minutes ago', priority: 'low' },
    { type: 'certificate', message: 'Certificate resent to Michael Brown', time: '1 hour ago', priority: 'medium' },
    { type: 'ticket', message: 'Urgent ticket from Emma Wilson', time: '2 hours ago', priority: 'urgent' },
  ];

  const quickStats = [
    { label: 'Tickets Today', value: '18', icon: Ticket, color: 'text-blue-600' },
    { label: 'Avg Resolution', value: '3.2h', icon: Clock, color: 'text-indigo-600' },
    { label: 'Satisfaction Rate', value: '94%', icon: TrendingUp, color: 'text-purple-600' },
    { label: 'Certificates Resent', value: '12', icon: Award, color: 'text-pink-600' },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <SupportStaffAppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Support Dashboard</h1>
          <p className="text-gray-600">Monitor tickets, student issues, and system status</p>
        </div>

        {/* KPI Strip */}
        <SupportKpiStrip />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {recentActivity.map((activity, idx) => (
                <div 
                  key={idx} 
                  onClick={() => {
                    if (activity.type === 'ticket') {
                      alert(`🎫 Support Ticket\n\n${activity.message}\n🕔 ${activity.time}\n⚡ Priority: ${activity.priority.toUpperCase()}\n\n📊 Quick Actions:\n• View ticket details\n• Assign to yourself\n• Send initial response\n• Escalate if needed\n\nClick 'View All Tickets' to take action.`);
                    } else if (activity.type === 'resolved') {
                      alert(`✅ Ticket Resolved\n\n${activity.message}\n🕔 ${activity.time}\n\n🎉 Resolution Details:\n• Resolution time: 2h 15m\n• Student satisfaction: 5/5\n• Issue: Technical support\n• Solution documented\n\nGreat work on maintaining quality support!`);
                    } else if (activity.type === 'certificate') {
                      alert(`🎓 Certificate Resent\n\n${activity.message}\n🕔 ${activity.time}\n\n📧 Delivery Details:\n• Format: PDF (Blockchain-verified)\n• Status: Delivered\n• Verification: Active\n• Student notified: Yes\n\nCertificate is now available in student's account.`);
                    }
                  }}
                  className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <div className={`w-2 h-2 rounded-full mt-2 ${getPriorityColor(activity.priority)}`} style={{ boxShadow: '0 0 8px currentColor' }} />
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium">{activity.message}</p>
                    <span className="text-sm text-gray-600">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Today's Stats</h2>
            <div className="space-y-4">
              {quickStats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div 
                    key={idx} 
                    onClick={() => {
                      if (stat.label === 'Tickets Today') {
                        alert(`🎫 Tickets Today: ${stat.value}\n\n📊 Breakdown:\n• Urgent: 3 tickets\n• High priority: 5 tickets\n• Medium priority: 7 tickets\n• Low priority: 3 tickets\n\n⏱️ Status:\n• Open: 12\n• In Progress: 4\n• Pending: 2\n\n🎯 Your assigned: 6 tickets\n\nView all tickets to manage your workload.`);
                      } else if (stat.label === 'Avg Resolution') {
                        alert(`⏱️ Average Resolution Time: ${stat.value}\n\n📊 Performance Metrics:\n• Today: 3.2 hours\n• This week: 3.5 hours\n• This month: 3.8 hours\n• Target: < 4 hours\n\n🎯 You're 20% faster than team average!\n\n📈 Keep up the excellent work maintaining quick response times.`);
                      } else if (stat.label === 'Satisfaction Rate') {
                        alert(`⭐ Customer Satisfaction: ${stat.value}\n\n📊 Rating Breakdown:\n• 5 stars: 78%\n• 4 stars: 16%\n• 3 stars: 4%\n• 2 stars: 1%\n• 1 star: 1%\n\n💬 Recent Feedback:\n"Alex was incredibly helpful and resolved my issue quickly!"\n\n🎉 You're exceeding our 90% target!`);
                      } else if (stat.label === 'Certificates Resent') {
                        alert(`🎓 Certificates Resent Today: ${stat.value}\n\n📊 Activity:\n• Resent: 12 certificates\n• Regenerated: 2 certificates\n• Bulk send: 1 batch\n• Issues resolved: 100%\n\n✅ All certificates delivered successfully\n📧 Students notified via email\n\nNo pending certificate requests.`);
                      }
                    }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                      <span className="text-sm text-gray-700">{stat.label}</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button 
              onClick={() => navigate('/support/tickets')}
              className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl font-semibold hover:shadow-lg transition-all"
            >
              View All Tickets
            </button>
            <button 
              onClick={() => navigate('/support/tech-status')}
              className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl font-semibold hover:shadow-lg transition-all"
            >
              Check Tech Status
            </button>
            <button 
              onClick={() => navigate('/support/knowledge-base')}
              className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-2xl font-semibold hover:shadow-lg transition-all"
            >
              Browse Knowledge Base
            </button>
            <button 
              onClick={() => navigate('/support/students')}
              className="p-4 bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-2xl font-semibold hover:shadow-lg transition-all"
            >
              Search Students
            </button>
          </div>
        </div>
      </div>
    </SupportStaffAppLayout>
  );
};

export default SupportDashboardPage;
