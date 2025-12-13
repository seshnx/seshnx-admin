import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MapPin, Shield, Plus, X, Crown } from 'lucide-react';
import { usersAPI } from '../utils/api';

export default function UserManager() {
  const { isSuperAdmin, currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const result = await usersAPI.fetchUsers();
      setUsers(result.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Error loading users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async (userId, profilePath, role, add) => {
    try {
      const user = users.find(u => u.id === userId);
      const currentRoles = user?.accountTypes || [];
      
      // Only SuperAdmin can manage SuperAdmin role
      if (role === 'SuperAdmin' && !isSuperAdmin) {
        alert('Only Super Admins can manage Super Admin role');
        return;
      }
      
      // Prevent revoking SuperAdmin from self (safety check)
      if (role === 'SuperAdmin' && !add && userId === currentUser?.uid) {
        if (!confirm('Are you sure you want to revoke SuperAdmin from yourself? This action cannot be undone.')) {
          return;
        }
      }
      
      const action = add ? 'grant' : 'revoke';
      const result = await usersAPI.updateUserRole(userId, profilePath, role, action);
      
      // Update local state
      setUsers(users.map(u => 
        u.id === userId 
          ? { ...u, accountTypes: result.accountTypes }
          : u
      ));
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Error updating role: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">User Management</h2>
          <p className="text-gray-400 text-sm mt-1">Manage user roles and permissions</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading users...</div>
      ) : (
        <div className="bg-admin-card border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-900 border-b border-gray-800">
              <tr>
                <th className="p-4 font-bold text-gray-400 uppercase text-xs">User</th>
                <th className="p-4 font-bold text-gray-400 uppercase text-xs">Email</th>
                <th className="p-4 font-bold text-gray-400 uppercase text-xs">Location</th>
                <th className="p-4 font-bold text-gray-400 uppercase text-xs">Roles</th>
                <th className="p-4 font-bold text-gray-400 uppercase text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-800/50 transition">
                  <td className="p-4">
                    <div className="font-bold text-white">{u.firstName || 'N/A'} {u.lastName || ''}</div>
                    <div className="text-[10px] text-gray-500 font-mono mt-1">{u.id}</div>
                  </td>
                  <td className="p-4 text-gray-300">{u.email || 'N/A'}</td>
                  <td className="p-4">
                    {u.city && u.state ? (
                      <div className="flex items-center gap-1 text-gray-400">
                        <MapPin size={14} /> {u.city}, {u.state}
                      </div>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1 items-center">
                      {u.accountTypes?.map(role => (
                        <span 
                          key={role} 
                          className={`px-2 py-0.5 rounded text-xs font-bold border flex items-center gap-1 ${
                            role === 'SuperAdmin'
                              ? 'bg-yellow-900/40 text-yellow-300 border-yellow-700'
                              : role === 'GAdmin' 
                              ? 'bg-purple-900/30 text-purple-300 border-purple-800'
                              : role === 'EDUAdmin'
                              ? 'bg-blue-900/30 text-blue-300 border-blue-800'
                              : 'bg-gray-800 text-gray-300 border-gray-700'
                          }`}
                        >
                          {role === 'SuperAdmin' && <Crown size={12} />}
                          {role}
                        </span>
                      ))}
                      {(!u.accountTypes || u.accountTypes.length === 0) && (
                        <span className="text-gray-500 text-xs">No roles</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setEditingUser(editingUser === u.id ? null : u.id)}
                      className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs transition"
                    >
                      {editingUser === u.id ? 'Cancel' : 'Manage Roles'}
                    </button>
                  </td>
                </tr>
              ))}
              {editingUser && (
                <tr className="bg-gray-900/50">
                  <td colSpan={5} className="p-4">
                    <div className="flex flex-wrap gap-3">
                      {isSuperAdmin && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Crown size={14} className="text-yellow-400" /> SuperAdmin:
                          </span>
                          {users.find(u => u.id === editingUser)?.accountTypes?.includes('SuperAdmin') ? (
                            <button
                              onClick={() => toggleRole(editingUser, users.find(u => u.id === editingUser).profilePath, 'SuperAdmin', false)}
                              className="flex items-center gap-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 px-2 py-1 rounded text-xs"
                            >
                              <X size={12} /> Revoke
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleRole(editingUser, users.find(u => u.id === editingUser).profilePath, 'SuperAdmin', true)}
                              className="flex items-center gap-1 bg-yellow-900/40 hover:bg-yellow-900/60 text-yellow-300 px-2 py-1 rounded text-xs"
                            >
                              <Plus size={12} /> Grant
                            </button>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">GAdmin:</span>
                        {users.find(u => u.id === editingUser)?.accountTypes?.includes('GAdmin') ? (
                          <button
                            onClick={() => toggleRole(editingUser, users.find(u => u.id === editingUser).profilePath, 'GAdmin', false)}
                            className="flex items-center gap-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 px-2 py-1 rounded text-xs"
                          >
                            <X size={12} /> Revoke
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleRole(editingUser, users.find(u => u.id === editingUser).profilePath, 'GAdmin', true)}
                            className="flex items-center gap-1 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 px-2 py-1 rounded text-xs"
                          >
                            <Plus size={12} /> Grant
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">EDUAdmin:</span>
                        {users.find(u => u.id === editingUser)?.accountTypes?.includes('EDUAdmin') ? (
                          <button
                            onClick={() => toggleRole(editingUser, users.find(u => u.id === editingUser).profilePath, 'EDUAdmin', false)}
                            className="flex items-center gap-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 px-2 py-1 rounded text-xs"
                          >
                            <X size={12} /> Revoke
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleRole(editingUser, users.find(u => u.id === editingUser).profilePath, 'EDUAdmin', true)}
                            className="flex items-center gap-1 bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 px-2 py-1 rounded text-xs"
                          >
                            <Plus size={12} /> Grant
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
