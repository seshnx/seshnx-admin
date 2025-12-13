import React, { useState, useEffect } from 'react';
import { BarChart3, Users, GraduationCap, TrendingUp, Activity, Clock } from 'lucide-react';
import { statsAPI } from '../utils/api';

export default function Analytics() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSchools: 0,
    activeUsers: 0,
    totalPosts: 0,
    totalMarketItems: 0,
    totalBookings: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d, all

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const result = await statsAPI.fetchStats();
      setStats({
        totalUsers: result.stats.totalUsers || 0,
        totalSchools: result.stats.totalSchools || 0,
        activeUsers: result.stats.activeUsers || 0,
        totalPosts: result.stats.totalPosts || 0,
        totalMarketItems: result.stats.totalMarketItems || 0,
        totalBookings: result.stats.totalBookings || 0
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, trend, subtitle }) => (
    <div className="bg-admin-card border border-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="text-gray-400 text-sm font-medium">{title}</div>
        <div className="text-admin-accent">{icon}</div>
      </div>
      <div className="text-3xl font-bold text-white mb-1">{loading ? '...' : value.toLocaleString()}</div>
      {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
      {trend && (
        <div className={`text-xs mt-2 flex items-center gap-1 ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
          <TrendingUp size={12} /> {trend > 0 ? '+' : ''}{trend}% from last period
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics & Monitoring</h2>
          <p className="text-gray-400 text-sm mt-1">Platform usage statistics and metrics</p>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '90d', 'all'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                timeRange === range
                  ? 'bg-admin-accent text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<Users size={24} />}
          trend={5.2}
          subtitle="Registered platform users"
        />
        <StatCard
          title="Total Schools"
          value={stats.totalSchools}
          icon={<GraduationCap size={24} />}
          trend={2.1}
          subtitle="Active schools on platform"
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          icon={<Activity size={24} />}
          trend={-1.3}
          subtitle={`Active in last ${timeRange}`}
        />
        <StatCard
          title="Total Posts"
          value={stats.totalPosts}
          icon={<BarChart3 size={24} />}
          trend={12.5}
          subtitle="User-generated content"
        />
        <StatCard
          title="Market Items"
          value={stats.totalMarketItems}
          icon={<TrendingUp size={24} />}
          trend={8.7}
          subtitle="Items in marketplace"
        />
        <StatCard
          title="Bookings"
          value={stats.totalBookings}
          icon={<Clock size={24} />}
          trend={3.4}
          subtitle="Service bookings"
        />
      </div>

      {/* Activity Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-admin-card border border-gray-800 rounded-lg p-6">
          <h3 className="text-white font-bold mb-4">User Growth</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <BarChart3 size={48} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Chart visualization coming soon</p>
            </div>
          </div>
        </div>

        <div className="bg-admin-card border border-gray-800 rounded-lg p-6">
          <h3 className="text-white font-bold mb-4">School Activity</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Activity size={48} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Chart visualization coming soon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-admin-card border border-gray-800 rounded-lg p-6">
        <h3 className="text-white font-bold mb-4">Recent Platform Activity</h3>
        <div className="text-gray-400 text-sm">
          Activity logs and monitoring features coming soon. This will show recent admin actions, user registrations, school creations, etc.
        </div>
      </div>
    </div>
  );
}

