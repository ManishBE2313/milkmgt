'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { summaryApi } from '@/lib/api';
import { AnalyticsData } from '@/types';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getMonthName } from '@/utils/dateUtils';

export default function AnalyticsPage() {
  const router = useRouter();
  const user = useStore((state) => state.user);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) {
        router.push('/');
        return;
      }

      setLoading(true);
      setError('');

      try {
        console.log('Fetching analytics for user:', user.username);
        const data = await summaryApi.getAnalyticsReport(user.username);
        console.log('Analytics data received:', data);
        setAnalytics(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch analytics');
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user, router]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            📊 Analytics & Trends
          </h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-secondary"
          >
            ← Back
          </button>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="spinner mx-auto" style={{ width: '3rem', height: '3rem' }}></div>
            <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            📊 Analytics & Trends
          </h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-secondary"
          >
            ← Back
          </button>
        </div>
        <div className="card">
          <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics || !analytics.monthly_trends || analytics.monthly_trends.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            📊 Analytics & Trends
          </h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-secondary"
          >
            ← Back
          </button>
        </div>
        <div className="card">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
              No Analytics Data Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start tracking deliveries to see trends and insights.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-primary"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Prepare chart data with proper number conversion
  const chartData = analytics.monthly_trends.map((trend) => {
    const monthName = getMonthName(trend.month_year);
    return {
      month: monthName.split(' ')[0], // Just month name
      fullMonth: monthName,
      litres: Number(trend.total_litres.toFixed(1)),
      days: Number(trend.total_days),
      absent: Number(trend.absent_days),
      avgDaily: Number(trend.average_daily_delivery.toFixed(2)),
    };
  });

  console.log('Chart data prepared:', chartData);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          📊 Analytics & Trends
        </h1>
        <button
          onClick={() => router.push('/dashboard')}
          className="btn-secondary"
        >
          ← Back
        </button>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
            Total Deliveries
          </h3>
          <p className="text-4xl font-bold text-primary-600 dark:text-primary-400">
            {analytics.total_deliveries}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            All time records
          </p>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
            Total Litres Delivered
          </h3>
          <p className="text-4xl font-bold text-green-600 dark:text-green-400">
            {Number(analytics.total_litres).toFixed(1)} L
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Cumulative delivery
          </p>
        </div>
      </div>

      {/* Monthly Litres Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          📈 Monthly Milk Delivery Trend
        </h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
              <XAxis 
                dataKey="month" 
                className="text-gray-700 dark:text-gray-300"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis 
                className="text-gray-700 dark:text-gray-300"
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="litres"
                stroke="#0ea5e9"
                strokeWidth={3}
                name="Total Litres"
                dot={{ r: 5 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Delivery Days Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          📅 Delivery Days vs Absent Days
        </h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
              <XAxis 
                dataKey="month"
                className="text-gray-700 dark:text-gray-300"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis 
                className="text-gray-700 dark:text-gray-300"
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="days" fill="#10b981" name="Delivery Days" />
              <Bar dataKey="absent" fill="#ef4444" name="Absent Days" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Average Daily Delivery Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          📊 Average Daily Delivery
        </h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
              <XAxis 
                dataKey="month"
                className="text-gray-700 dark:text-gray-300"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis 
                className="text-gray-700 dark:text-gray-300"
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="avgDaily" fill="#8b5cf6" name="Avg Litres/Day" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Trends Table */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          📋 Monthly Breakdown
        </h3>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Total Litres</th>
                <th>Total Days</th>
                <th>Absent Days</th>
                <th>Avg Daily</th>
              </tr>
            </thead>
            <tbody>
              {analytics.monthly_trends.map((trend, index) => (
                <tr key={index}>
                  <td className="font-medium">{getMonthName(trend.month_year)}</td>
                  <td>{Number(trend.total_litres).toFixed(1)} L</td>
                  <td>{trend.total_days}</td>
                  <td>{trend.absent_days}</td>
                  <td>{Number(trend.average_daily_delivery).toFixed(2)} L</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
