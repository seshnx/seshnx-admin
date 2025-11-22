import React, { useEffect, useState } from 'react';
import { collection, query, limit, getDocs, orderBy } from 'firebase/firestore';
import { db, COLLECTIONS } from '../firebase';
import { MapPin, Shield } from 'lucide-react';

export default function UserManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      // Query 'public/data/profiles' which aggregates essential user info
      const q = query(collection(db, COLLECTIONS.PROFILES), limit(50));
      const snap = await getDocs(q);
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetchUsers();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">User Directory</h2>
        <div className="bg-white dark:bg-gray-800 px-3 py-1 rounded-md border dark:border-gray-700 text-sm">
            Showing first 50 users
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
            <tr>
              <th className="p-4 font-bold text-gray-500 uppercase">User</th>
              <th className="p-4 font-bold text-gray-500 uppercase">Location</th>
              <th className="p-4 font-bold text-gray-500 uppercase">Roles</th>
              <th className="p-4 font-bold text-gray-500 uppercase text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                <td className="p-4">
                  <div className="font-bold dark:text-white">{u.firstName} {u.lastName}</div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                  <div className="text-[10px] text-gray-400 font-mono mt-1">{u.id}</div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                    <MapPin size={14} /> {u.city}, {u.state}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {u.accountTypes?.map(role => (
                      <span key={role} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-bold border border-blue-200 dark:border-blue-800">
                        {role}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-4 text-right">
                   <button className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1 rounded font-medium text-xs transition">
                      Ban User
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="p-8 text-center text-gray-500">Loading directory...</div>}
      </div>
    </div>
  );
}
