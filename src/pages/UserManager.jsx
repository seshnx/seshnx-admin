import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, Plus, X, Crown, Search } from 'lucide-react';

export default function UserManager() {
  const navigate = useNavigate();
  const { isSuperAdmin, currentUser, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '100',
        offset: '0',
        role: roleFilter === 'all' ? '' : roleFilter,
        status: statusFilter
      });

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Error loading users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async (userId, role, add) => {
    try {
      const user = users.find(u => u.id === userId);
      const currentRoles = user?.account_types || [];

      // Only SuperAdmin can manage SuperAdmin role
      if (role === 'SuperAdmin' && !isSuperAdmin) {
        alert('Only Super Admins can manage Super Admin role');
        return;
      }

      // Prevent revoking SuperAdmin from self (safety check)
      if (role === 'SuperAdmin' && !add && userId === currentUser?.id) {
        if (!confirm('Are you sure you want to revoke SuperAdmin from yourself? This action cannot be undone.')) {
          return;
        }
      }

      const action = add ? 'grant' : 'revoke';
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, role, action })
      });

      if (response.ok) {
        const result = await response.json();
        // Update local state
        setUsers(users.map(u =>
          u.id === userId
            ? { ...u, account_types: result.accountTypes }
            : u
        ));
        setEditingUser(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Error updating role: ' + error.message);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.username?.toLowerCase().includes(searchLower) ||
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower) ||
      user.display_name?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">User Management</h2>
          <p className="text-gray-400 text-sm">Manage user roles and permissions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Search users..."
            className="w-full bg-admin-dark border border-gray-800 rounded-lg pl-10 pr-4 py-2 text-white focus:border-admin-accent outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="bg-admin-dark border border-gray-800 rounded-lg px-4 py-2 text-white focus:border-admin-accent outline-none"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="GAdmin">GAdmin</option>
          <option value="SuperAdmin">SuperAdmin</option>
          <option value="EDUAdmin">EDUAdmin</option>
          <option value="Talent">Talent</option>
          <option value="Engineer">Engineer</option>
          <option value="Producer">Producer</option>
          <option value="Student">Student</option>
        </select>
        <select
          className="bg-admin-dark border border-gray-800 rounded-lg px-4 py-2 text-white focus:border-admin-accent outline-none"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="active">Active</option>
          <option value="banned">Banned</option>
          <option value="all">All</option>
        </select>
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
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-gray-800/50 transition">
                  <td className="p-4">
                    <div className="font-bold text-white">
                      {u.display_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'N/A'}
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono mt-1">{u.username || u.id}</div>
                  </td>
                  <td className="p-4 text-gray-300">{u.email || 'N/A'}</td>
                  <td className="p-4">
                    {u.location?.city && u.location?.state ? (
                      <div className="flex items-center gap-1 text-gray-400">
                        <MapPin size={14} /> {u.location.city}, {u.location.state}
                      </div>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1 items-center">
                      {u.account_types?.map(role => (
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
                      {(!u.account_types || u.account_types.length === 0) && (
                        <span className="text-gray-500 text-xs">No roles</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => navigate(`/users/${u.id}`)}
                        className="bg-admin-accent hover:bg-blue-600 text-white px-3 py-1 rounded text-xs transition"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => setEditingUser(editingUser === u.id ? null : u.id)}
                        className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs transition"
                      >
                        {editingUser === u.id ? 'Cancel' : 'Manage Roles'}
                      </button>
                    </div>
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
                          {users.find(u => u.id === editingUser)?.account_types?.includes('SuperAdmin') ? (
                            <button
                              onClick={() => toggleRole(editingUser, 'SuperAdmin', false)}
                              className="flex items-center gap-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 px-2 py-1 rounded text-xs"
                            >
                              <X size={12} /> Revoke
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleRole(editingUser, 'SuperAdmin', true)}
                              className="flex items-center gap-1 bg-yellow-900/40 hover:bg-yellow-900/60 text-yellow-300 px-2 py-1 rounded text-xs"
                            >
                              <Plus size={12} /> Grant
                            </button>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">GAdmin:</span>
                        {users.find(u => u.id === editingUser)?.account_types?.includes('GAdmin') ? (
                          <button
                            onClick={() => toggleRole(editingUser, 'GAdmin', false)}
                            className="flex items-center gap-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 px-2 py-1 rounded text-xs"
                          >
                            <X size={12} /> Revoke
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleRole(editingUser, 'GAdmin', true)}
                            className="flex items-center gap-1 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 px-2 py-1 rounded text-xs"
                          >
                            <Plus size={12} /> Grant
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">EDUAdmin:</span>
                        {users.find(u => u.id === editingUser)?.account_types?.includes('EDUAdmin') ? (
                          <button
                            onClick={() => toggleRole(editingUser, 'EDUAdmin', false)}
                            className="flex items-center gap-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 px-2 py-1 rounded text-xs"
                          >
                            <X size={12} /> Revoke
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleRole(editingUser, 'EDUAdmin', true)}
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
