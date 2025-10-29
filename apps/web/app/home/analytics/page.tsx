'use client';

/**
 * Analytics Dashboard - Historical Trends & Statistics
 * 
 * Features:
 * - Time-series defect trends
 * - Period comparisons
 * - Defect type distribution
 * - Quality metrics over time
 */

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  AlertTriangle, 
  CheckCircle,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

interface TrendData {
  date: string;
  total_inspections: number;
  defect_count: number;
  defect_rate: number;
  avg_confidence: number;
}

interface AnalyticsSummary {
  start_date: string;
  end_date: string;
  total_inspections: number;
  defect_rate: number;
  trends: TrendData[];
  defect_type_distribution: Record<string, number>;
  group_by: string;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [dateRange, setDateRange] = useState('30');
  const [groupBy, setGroupBy] = useState('day');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, groupBy]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));
      
      const response = await fetch(
        `http://localhost:8000/api/xai-qc/analytics/trends?` +
        `start_date=${startDate.toISOString().split('T')[0]}&` +
        `end_date=${endDate.toISOString().split('T')[0]}&` +
        `group_by=${groupBy}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getDefectRateTrend = () => {
    if (!analytics || analytics.trends.length < 2) return 'neutral';
    
    const recent = analytics.trends.slice(-7).reduce((sum, t) => sum + t.defect_rate, 0) / 7;
    const previous = analytics.trends.slice(-14, -7).reduce((sum, t) => sum + t.defect_rate, 0) / 7;
    
    if (recent < previous - 1) return 'improving';
    if (recent > previous + 1) return 'worsening';
    return 'stable';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingDown className="w-5 h-5 text-green-600" />;
    if (trend === 'worsening') return <TrendingUp className="w-5 h-5 text-red-600" />;
    return <Activity className="w-5 h-5 text-gray-600" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-900 font-semibold mb-2">Error Loading Analytics</h3>
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const trend = getDefectRateTrend();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Historical Analysis & Trends
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Quality metrics and defect trends over time
          </p>
        </div>
        
        {/* Controls */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Time Range:
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="180">Last 6 months</option>
              <option value="365">Last year</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Group By:
            </label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Inspections */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Inspections
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {analytics?.total_inspections || 0}
              </p>
            </div>
            <Calendar className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        {/* Defect Rate */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Defect Rate
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {analytics?.defect_rate.toFixed(1)}%
              </p>
              <div className="flex items-center mt-2 space-x-1">
                {getTrendIcon(trend)}
                <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {trend}
                </span>
              </div>
            </div>
            <AlertTriangle className="w-12 h-12 text-orange-600 dark:text-orange-400" />
          </div>
        </div>

        {/* Defect Count */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Defects Found
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {analytics?.trends.reduce((sum, t) => sum + t.defect_count, 0) || 0}
              </p>
            </div>
            <BarChart3 className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* Quality Score */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Quality Score
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {(100 - (analytics?.defect_rate || 0)).toFixed(0)}%
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Defect Rate Trend
          </h3>
          
          <div className="space-y-2">
            {analytics?.trends.slice(-10).map((trend, idx) => (
              <div key={idx} className="flex items-center space-x-3">
                <span className="text-xs text-gray-600 dark:text-gray-400 w-24">
                  {new Date(trend.date).toLocaleDateString()}
                </span>
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      trend.defect_rate > 10
                        ? 'bg-red-500'
                        : trend.defect_rate > 5
                        ? 'bg-orange-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(trend.defect_rate * 10, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white w-16 text-right">
                  {trend.defect_rate.toFixed(1)}%
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 w-12 text-right">
                  {trend.defect_count}/{trend.total_inspections}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Defect Type Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <PieChart className="w-5 h-5 mr-2" />
            Defect Type Distribution
          </h3>
          
          <div className="space-y-4">
            {Object.entries(analytics?.defect_type_distribution || {}).map(([type, count]) => {
              const total = Object.values(analytics?.defect_type_distribution || {}).reduce((a, b) => a + b, 0);
              const percentage = ((count / total) * 100).toFixed(1);
              
              const colors: Record<string, string> = {
                'LP': 'bg-red-500',
                'PO': 'bg-orange-500',
                'CR': 'bg-purple-500',
                'ND': 'bg-green-500',
              };
              
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {type === 'LP' ? 'Lack of Penetration' :
                       type === 'PO' ? 'Porosity' :
                       type === 'CR' ? 'Cracks' : type}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full ${colors[type] || 'bg-gray-400'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detailed Trends Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Detailed Trend Data
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Inspections
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Defects
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Defect Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Avg Confidence
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {analytics?.trends.slice(-20).reverse().map((trend, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {new Date(trend.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {trend.total_inspections}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {trend.defect_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      trend.defect_rate > 10
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : trend.defect_rate > 5
                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {trend.defect_rate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {(trend.avg_confidence * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
