import React, { useEffect, useState } from 'react';
import { Users, DollarSign, FileText, Activity, GraduationCap, TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { statsAPI } from '../utils/api';

const StatCard = ({ title, value, icon, color, subtitle, link }) => {
  const content = (
    <div className="bg-admin-card border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="text-gray-400 text-sm font-medium">{title}</div>
        <div className={color}>{icon}</div>
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value.toLocaleString()}</div>
      {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
    </div>
  );

  if (link) {
    return <Link to={link}>{content}</Link>;
  }
  return content;
};

export default function Dashboard() {
  const [stats, setStats] = useState({ users: 0, items: 0, posts: 0, bookings: 0, schools: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const result = await statsAPI.fetchStats();
      setStats({
        users: result.stats.totalUsers || 0,
        items: result.stats.totalMarketItems || 0,
        posts: result.stats.totalPosts || 0,
        bookings: result.stats.totalBookings || 0,
        schools: result.stats.totalSchools || 0
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Platform Overview</h2>
        <p className="text-gray-400 text-sm mt-1">Real-time metrics from the live production database</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard 
          title="Total Users" 
          value={stats.users} 
          icon={<Users size={24}/>} 
          color="text-blue-400"
          subtitle="Registered users"
          link="/users"
        />
        <StatCard 
          title="Schools" 
          value={stats.schools} 
          icon={<GraduationCap size={24}/>} 
          color="text-purple-400"
          subtitle="Active schools"
          link="/schools"
        />
        <StatCard 
          title="Market Items" 
          value={stats.items} 
          icon={<DollarSign size={24}/>} 
          color="text-green-400"
          subtitle="Marketplace listings"
        />
        <StatCard 
          title="Total Posts" 
          value={stats.posts} 
          icon={<FileText size={24}/>} 
          color="text-yellow-400"
          subtitle="User posts"
        />
        <StatCard 
          title="Bookings" 
          value={stats.bookings} 
          icon={<Activity size={24}/>} 
          color="text-orange-400"
          subtitle="Service bookings"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/analytics" className="bg-admin-card border border-gray-800 rounded-lg p-6 hover:border-admin-accent transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold mb-1">View Analytics</h3>
              <p className="text-gray-400 text-sm">Detailed metrics and insights</p>
            </div>
            <TrendingUp size={24} className="text-admin-accent" />
          </div>
        </Link>
        <Link to="/settings" className="bg-admin-card border border-gray-800 rounded-lg p-6 hover:border-admin-accent transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold mb-1">Platform Settings</h3>
              <p className="text-gray-400 text-sm">Configure platform options</p>
            </div>
            <ArrowRight size={24} className="text-admin-accent" />
          </div>
        </Link>
        <Link to="/audit-logs" className="bg-admin-card border border-gray-800 rounded-lg p-6 hover:border-admin-accent transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold mb-1">Audit Logs</h3>
              <p className="text-gray-400 text-sm">View admin activity logs</p>
            </div>
            <ArrowRight size={24} className="text-admin-accent" />
          </div>
        </Link>
      </div>
    </div>
  );
}
