import React from 'react';
import { useNavigate } from 'react-router-dom';

interface PlatformOwnerOverviewKpiStripProps {
  stats: {
    totalUsers: number;
    totalCoaches: number;
    totalStudents: number;
    monthlyRecurringRevenue: number;
    activeCourses: number;
    aiRequestsThisMonth: number;
  };
}

const PlatformOwnerOverviewKpiStrip: React.FC<PlatformOwnerOverviewKpiStripProps> = ({ stats }) => {
  const navigate = useNavigate();

  const kpiTiles = [
    {
      label: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: '👥',
      color: 'from-blue-500 to-blue-600',
      route: '/owner/users',
    },
    {
      label: 'Coaches',
      value: stats.totalCoaches.toLocaleString(),
      icon: '👨‍🏫',
      color: 'from-green-500 to-green-600',
      route: '/owner/users',
    },
    {
      label: 'Students',
      value: stats.totalStudents.toLocaleString(),
      icon: '🎓',
      color: 'from-purple-500 to-purple-600',
      route: '/owner/users',
    },
    {
      label: 'MRR',
      value: `₱${(stats.monthlyRecurringRevenue / 1000).toFixed(0)}K`,
      icon: '💰',
      color: 'from-amber-500 to-amber-600',
      route: '/owner/billing',
    },
    {
      label: 'Active Courses',
      value: stats.activeCourses.toLocaleString(),
      icon: '📚',
      color: 'from-indigo-500 to-indigo-600',
      route: '/owner/users',
    },
    {
      label: 'AI Requests',
      value: `${(stats.aiRequestsThisMonth / 1000).toFixed(1)}K`,
      icon: '🤖',
      color: 'from-pink-500 to-pink-600',
      route: '/owner/ai-governance',
    },
  ];

  const handleTileClick = (route: string) => {
    console.log(`Navigating to: ${route}`);
    // Navigate if route exists, otherwise just log
    if (route) {
      navigate(route);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {kpiTiles.map((tile, index) => (
        <button
          key={index}
          onClick={() => handleTileClick(tile.route)}
          className="bg-white rounded-2xl p-5 border border-[#EDF0FB] hover:shadow-lg transition-all text-left group"
        >
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tile.color} flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform`}>
            {tile.icon}
          </div>
          <p className="text-2xl font-bold text-text-primary mb-1">{tile.value}</p>
          <p className="text-xs text-text-muted">{tile.label}</p>
        </button>
      ))}
    </div>
  );
};

export default PlatformOwnerOverviewKpiStrip;
