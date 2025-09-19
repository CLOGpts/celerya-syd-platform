import React from 'react';

interface DashboardData {
  title?: string;
  subtitle?: string;
  stats?: {
    totalATECO?: number;
    riskAssessments?: number;
    reportsGenerated?: number;
  };
  recentActivities?: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
}

interface DashboardContainerProps {
  data?: DashboardData;
  onRefresh?: () => void;
  isLoading?: boolean;
}

/**
 * Wrapper per DashboardPage
 * Prepara props per componenti UI
 * Interface per i dati da passare
 */
export const DashboardContainer: React.FC<DashboardContainerProps> = ({
  data = {} as DashboardData,
  onRefresh,
  isLoading = false
}) => {
  const {
    title = 'Dashboard SYD Cyber',
    subtitle = 'Sistema di Analisi ATECO e Risk Management',
    stats = {},
    recentActivities = []
  } = data;

  return (
    <div className="p-6">
      {/* Dashboard header container */}
      <div id="dashboard-header" data-title={title} data-subtitle={subtitle} />

      {/* Stats cards container */}
      <div id="stats-container" className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div data-stat="ateco" data-value={stats.totalATECO || 0} />
        <div data-stat="risk" data-value={stats.riskAssessments || 0} />
        <div data-stat="reports" data-value={stats.reportsGenerated || 0} />
      </div>

      {/* Activities container */}
      <div id="activities-container" className="mt-8">
        {recentActivities.map(activity => (
          <div
            key={activity.id}
            data-activity-id={activity.id}
            data-activity-type={activity.type}
            data-activity-description={activity.description}
            data-activity-timestamp={activity.timestamp}
          />
        ))}
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div id="loading-overlay" className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
        </div>
      )}
    </div>
  );
};

export default DashboardContainer;