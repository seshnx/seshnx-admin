import React, { useEffect, useState } from 'react';
import { collection, getCountFromServer } from 'firebase/firestore';
import { db, COLLECTIONS } from '../firebase';
import { Users, DollarSign, FileText, Activity } from 'lucide-react';

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700 flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-3xl font-extrabold">{value}</h3>
    </div>
    <div className={`p-3 rounded-full ${color} text-white`}>{icon}</div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState({ users: 0, items: 0, posts: 0, bookings: 0 });

  useEffect(() => {
    // Note: Aggregation queries count documents without downloading them (Cost efficient)
    const fetchStats = async () => {
      try {
        const [usersSnap, marketSnap, postsSnap, bookSnap] = await Promise.all([
          getCountFromServer(collection(db, COLLECTIONS.PROFILES)),
          getCountFromServer(collection(db, COLLECTIONS.MARKET)),
          getCountFromServer(collection(db, COLLECTIONS.POSTS)),
          getCountFromServer(collection(db, COLLECTIONS.BOOKINGS))
        ]);

        setStats({
          users: usersSnap.data().count,
          items: marketSnap.data().count,
          posts: postsSnap.data().count,
          bookings: bookSnap.data().count
        });
      } catch (e) {
        console.error("Admin stats error:", e);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Platform Overview</h2>
        <p className="text-gray-500">Real-time metrics from the live production database.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats.users} icon={<Users size={24}/>} color="bg-blue-500" />
        <StatCard title="Market Items" value={stats.items} icon={<DollarSign size={24}/>} color="bg-green-500" />
        <StatCard title="Total Posts" value={stats.posts} icon={<FileText size={24}/>} color="bg-purple-500" />
        <StatCard title="Bookings" value={stats.bookings} icon={<Activity size={24}/>} color="bg-orange-500" />
      </div>

      {/* Placeholder for Graphs */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border dark:border-gray-700 h-96 flex items-center justify-center text-gray-400">
        Chart integration would go here (Recharts or similar)
      </div>
    </div>
  );
}
