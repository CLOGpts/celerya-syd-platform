import React from 'react';

const DashboardPage: React.FC = () => {
  const metrics = [
    { title: 'Total Operations', value: '1,284', trend: 12 },
    { title: 'System Uptime', value: '99.9%', subtitle: 'Last 30 days' },
    { title: 'Active Modules', value: '2/2', subtitle: 'All systems operational' },
    { title: 'Data Processed', value: '3.2TB', trend: 25 }
  ];

  const businessCards = [
    {
      title: 'Fornitori',
      description: 'Gestione fornitori aziendali',
      count: 0,
      icon: '📁',
      color: 'bg-yellow-400'
    },
    {
      title: 'Clienti',
      description: 'Gestione clienti e contratti',
      count: 0,
      icon: '📁',
      color: 'bg-yellow-400'
    }
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 dark:text-white">SYD Platform Overview</h1>
        <p className="text-slate-400 dark:text-slate-400 mt-2">Real-time monitoring and analytics</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, idx) => (
          <div key={idx} className="bg-gray-900 dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-800 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400 dark:text-slate-400">{metric.title}</span>
              {metric.trend && (
                <span className={`text-sm font-medium flex items-center gap-1 ${metric.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  <span>{metric.trend > 0 ? '📈' : '📉'}</span>
                  {metric.trend > 0 ? '+' : ''}{metric.trend}%
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-slate-100 dark:text-white">{metric.value}</div>
            {metric.subtitle && (
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{metric.subtitle}</div>
            )}
          </div>
        ))}
      </div>

      {/* Business Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {businessCards.map((card, idx) => (
          <div key={idx} className="bg-gray-900 dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-800 dark:border-slate-700 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-16 h-16 ${card.color} rounded-lg flex items-center justify-center`}>
                <span className="text-2xl">{card.icon}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-100 dark:text-white">{card.title}</h3>
                <p className="text-sm text-slate-400 dark:text-slate-400">{card.description}</p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-slate-100 dark:text-white">{card.count}</span>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Apri →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-900 dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-800 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-100 dark:text-white mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full mt-1.5 bg-black0" />
            <div className="flex-1">
              <p className="text-sm text-slate-300 dark:text-slate-300">Data synchronization completed</p>
              <span className="text-xs text-slate-500 dark:text-slate-400">Just now</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full mt-1.5 bg-black0" />
            <div className="flex-1">
              <p className="text-sm text-slate-300 dark:text-slate-300">Module health check: All systems operational</p>
              <span className="text-xs text-slate-500 dark:text-slate-400">10 min ago</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full mt-1.5 bg-black0" />
            <div className="flex-1">
              <p className="text-sm text-slate-300 dark:text-slate-300">Platform update available</p>
              <span className="text-xs text-slate-500 dark:text-slate-400">45 min ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;