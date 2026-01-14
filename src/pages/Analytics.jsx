import React, { useState, useEffect } from 'react';
import { BarChart3, Users, GraduationCap, TrendingUp, Activity, Clock, AlertTriangle, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import RefreshButton from '../components/RefreshButton';
import RealtimeIndicator from '../components/RealtimeIndicator';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function Analytics() {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSchools: 0,
    activeUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    flaggedContent: 0,
    totalMarketItems: 0,
    totalBookings: 0,
    totalStudents: 0,
    totalEnrollments: 0,
    newUsersThisWeek: 0,
    newUsersThisMonth: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d, all
  const [userGrowthData, setUserGrowthData] = useState([]);
  const [contentData, setContentData] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch overview stats
      const overviewResponse = await fetch('/api/admin/analytics/overview', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Fetch user analytics with time range
      const userGrowthDays = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const usersResponse = await fetch(`/api/admin/analytics/users?days=${userGrowthDays}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Fetch content stats
      const contentResponse = await fetch('/api/admin/analytics/content', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Fetch school stats
      const schoolsResponse = await fetch('/api/admin/analytics/schools', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Fetch recent audit logs
      const auditResponse = await fetch('/api/admin/settings/audit-log?limit=10', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (overviewResponse.ok) {
        const overviewData = await overviewResponse.json();
        setStats({
          totalUsers: overviewData.totalUsers || 0,
          totalSchools: overviewData.totalSchools || 0,
          activeUsers: overviewData.activeUsers || 0,
          totalPosts: overviewData.totalPosts || 0,
          totalComments: overviewData.totalComments || 0,
          flaggedContent: overviewData.flaggedContent || 0,
          totalMarketItems: overviewData.totalMarketItems || 0,
          totalBookings: overviewData.totalBookings || 0,
          totalStudents: overviewData.totalStudents || 0,
          totalEnrollments: overviewData.totalEnrollments || 0,
          newUsersThisWeek: overviewData.newUsersThisWeek || 0,
          newUsersThisMonth: overviewData.newUsersThisMonth || 0
        });
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUserGrowthData(usersData.growth || []);
      }

      if (contentResponse.ok) {
        const contentData = await contentResponse.json();
        setContentData(contentData.breakdown || []);
      }

      if (auditResponse.ok) {
        const auditData = await auditResponse.json();
        setAuditLogs(auditData.logs || []);
      }

      setLastUpdate(Date.now());
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, trend, subtitle, color }) => (
    <div className="bg-admin-card border border-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="text-gray-400 text-sm font-medium">{title}</div>
        <div className={color ? color : 'text-admin-accent'}>{icon}</div>
      </div>
      <div className="text-3xl font-bold text-white mb-1">{loading ? '...' : value.toLocaleString()}</div>
      {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
      {trend !== undefined && (
        <div className={`text-xs mt-2 flex items-center gap-1 ${trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-gray-400'}`}>
          <TrendingUp size={12} /> {trend > 0 ? '+' : trend < 0 ? '' : '±'}{Math.abs(trend)}% from last period
        </div>
      )}
    </div>
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionColor = (action) => {
    const colors = {
      'USER_ROLE_GRANT': 'text-green-400',
      'USER_ROLE_REVOKE': 'text-orange-400',
      'USER_BAN': 'text-red-400',
      'USER_UNBAN': 'text-green-400',
      'USER_DELETE': 'text-red-600',
      'CONTENT_DELETE': 'text-red-400',
      'CONTENT_APPROVE': 'text-green-400',
      'SCHOOL_CREATE': 'text-blue-400',
      'SCHOOL_UPDATE': 'text-yellow-400',
      'SCHOOL_DELETE': 'text-red-400',
      'SETTING_UPDATE': 'text-purple-400'
    };
    return colors[action] || 'text-gray-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics & Monitoring</h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-gray-400 text-sm">Platform usage statistics and metrics</p>
            <RealtimeIndicator lastUpdate={lastUpdate} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton onRefresh={fetchAnalytics} disabled={loading} />
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
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<Users size={24} />}
          trend={stats.newUsersThisWeek > 0 ? ((stats.newUsersThisWeek / stats.totalUsers) * 100).toFixed(1) : 0}
          subtitle={`${stats.newUsersThisWeek} new this week`}
        />
        <StatCard
          title="Total Schools"
          value={stats.totalSchools}
          icon={<GraduationCap size={24} />}
          trend={2.1}
          subtitle={`${stats.totalStudents} enrolled students`}
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
          subtitle={`${stats.totalComments} comments`}
        />
        <StatCard
          title="Flagged Content"
          value={stats.flaggedContent}
          icon={<AlertTriangle size={24} />}
          color="text-yellow-400"
          trend={-5.2}
          subtitle="Requires review"
        />
        <StatCard
          title="Bookings"
          value={stats.totalBookings}
          icon={<Clock size={24} />}
          trend={3.4}
          subtitle="Service bookings"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-admin-card border border-gray-800 rounded-lg p-6">
          <h3 className="text-white font-bold mb-4">User Growth Over Time</h3>
          {loading || userGrowthData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 size={48} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Loading chart data...</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={userGrowthData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                  tick={{ fill: '#9ca3af' }}
                />
                <YAxis
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                  tick={{ fill: '#9ca3af' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorUsers)"
                  strokeWidth={2}
                  name="Users"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Content Distribution */}
        <div className="bg-admin-card border border-gray-800 rounded-lg p-6">
          <h3 className="text-white font-bold mb-4">Content Activity Distribution</h3>
          {loading || contentData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Activity size={48} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Loading chart data...</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={contentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {contentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-admin-card border border-gray-800 rounded-lg p-6">
        <h3 className="text-white font-bold mb-4">Platform Activity Timeline</h3>
        {loading || userGrowthData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Activity size={48} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Loading chart data...</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#9ca3af' }}
              />
              <YAxis
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#9ca3af' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend
                wrapperStyle={{ color: '#fff' }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={{ fill: '#60a5fa', r: 3 }}
                name="New Users"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Content Breakdown Bar Chart */}
      <div className="bg-admin-card border border-gray-800 rounded-lg p-6">
        <h3 className="text-white font-bold mb-4">Content Breakdown</h3>
        {loading || contentData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <BarChart3 size={48} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Loading chart data...</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={contentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="name"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#9ca3af' }}
              />
              <YAxis
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#9ca3af' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {contentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent Admin Activity */}
      <div className="bg-admin-card border border-gray-800 rounded-lg p-6">
        <h3 className="text-white font-bold mb-4">Recent Admin Activity</h3>
        {loading ? (
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare size={48} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Loading activity logs...</p>
            </div>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="text-gray-500 text-sm py-8 text-center">
            No recent admin activity
          </div>
        ) : (
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 bg-admin-dark/30 rounded border border-gray-800">
                <div className={`w-2 h-2 rounded-full mt-2 ${log.action.includes('DELETE') || log.action.includes('BAN') ? 'bg-red-500' : log.action.includes('CREATE') || log.action.includes('GRANT') ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-medium text-sm">{log.admin_email}</span>
                    <span className={`text-xs font-mono ${getActionColor(log.action)}`}>{log.action.replace(/_/g, ' ')}</span>
                    {log.target_type && (
                      <span className="text-xs text-gray-500">
                        {log.target_type}{log.target_id && `: ${log.target_id.slice(0, 8)}...`}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDate(log.created_at)}
                    {log.reason && <span className="ml-2 text-gray-400">Reason: {log.reason}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
