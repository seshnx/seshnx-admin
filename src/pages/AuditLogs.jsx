import React, { useState, useEffect } from 'react';
import { FileText, Search, Filter, Calendar } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: 'all', user: '' });

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    setLoading(true);
    // TODO: Fetch from Firestore audit_logs collection via API
    // For now, placeholder data
    setTimeout(() => {
      setLogs([
        {
          id: '1',
          action: 'user_role_granted',
          user: 'admin@example.com',
          target: 'user@example.com',
          details: 'Granted GAdmin role',
          timestamp: new Date(),
          ip: '192.168.1.1'
        },
        {
          id: '2',
          action: 'school_created',
          user: 'admin@example.com',
          target: 'New School',
          details: 'Created school "Test School"',
          timestamp: new Date(Date.now() - 3600000),
          ip: '192.168.1.1'
        }
      ]);
      setLoading(false);
    }, 500);
  };

  const getActionColor = (action) => {
    if (action.includes('granted') || action.includes('created')) return 'text-green-400';
    if (action.includes('revoked') || action.includes('deleted')) return 'text-red-400';
    return 'text-blue-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Audit Logs</h2>
          <p className="text-gray-400 text-sm mt-1">Track all administrative actions and changes</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search logs..."
              className="bg-gray-900 border border-gray-700 rounded pl-10 pr-4 py-2 text-white text-sm focus:border-admin-accent outline-none"
            />
          </div>
          <select
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            className="bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white text-sm focus:border-admin-accent outline-none"
          >
            <option value="all">All Actions</option>
            <option value="user_role">User Roles</option>
            <option value="school">School Management</option>
            <option value="settings">Settings Changes</option>
          </select>
        </div>
      </div>

      <div className="bg-admin-card border border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-900 border-b border-gray-800">
            <tr>
              <th className="p-4 font-bold text-gray-400 uppercase text-xs">Timestamp</th>
              <th className="p-4 font-bold text-gray-400 uppercase text-xs">Action</th>
              <th className="p-4 font-bold text-gray-400 uppercase text-xs">Admin</th>
              <th className="p-4 font-bold text-gray-400 uppercase text-xs">Target</th>
              <th className="p-4 font-bold text-gray-400 uppercase text-xs">Details</th>
              <th className="p-4 font-bold text-gray-400 uppercase text-xs">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">Loading logs...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">No logs found</td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-800/50 transition">
                  <td className="p-4 text-gray-400 font-mono text-xs">
                    {log.timestamp.toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span className={`font-medium ${getActionColor(log.action)}`}>
                      {log.action.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-gray-300">{log.user}</td>
                  <td className="p-4 text-gray-300">{log.target}</td>
                  <td className="p-4 text-gray-400">{log.details}</td>
                  <td className="p-4 text-gray-500 font-mono text-xs">{log.ip}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && logs.length > 0 && (
        <div className="text-center text-gray-400 text-sm">
          Showing {logs.length} log entries
        </div>
      )}
    </div>
  );
}

