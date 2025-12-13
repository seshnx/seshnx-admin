import React, { useEffect, useState } from 'react';
import { Search, ShieldAlert, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usersAPI, userActionsAPI } from '../utils/api';

// Modal for Super Admin Actions
const SuperActionModal = ({ action, onConfirm, onCancel }) => {
    const [code, setCode] = useState('');
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-admin-card border border-red-500/50 p-6 rounded-xl max-w-sm w-full">
                <div className="text-red-500 flex justify-center mb-4"><ShieldAlert size={48} /></div>
                <h3 className="text-white font-bold text-center text-lg mb-2">Super Admin Authorization</h3>
                <p className="text-gray-400 text-center text-xs mb-4">You are about to perform: <strong className="text-white">{action}</strong>. Confirm via Authenticator.</p>
                <input className="w-full bg-black border border-gray-700 rounded p-3 text-center text-white tracking-widest font-mono mb-4" placeholder="000000" value={code} onChange={e => setCode(e.target.value)} autoFocus />
                <div className="flex gap-2">
                    <button onClick={onCancel} className="flex-1 bg-gray-800 text-white py-2 rounded text-xs font-bold">Cancel</button>
                    <button onClick={() => onConfirm(code)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded text-xs font-bold">EXECUTE</button>
                </div>
            </div>
        </div>
    );
};

export default function DataGrid() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [superAction, setSuperAction] = useState(null); // { type: 'ban', targetId: 'xyz' }
  const { reauthenticateAdmin } = useAuth();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await usersAPI.fetchUsers();
      setUsers(result.users || []);
    } catch (error) {
      console.error('DataGrid fetch error:', error);
      setUsers([]); // Show empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSuperExecution = async (code) => {
      const authorized = await reauthenticateAdmin(code);
      if (!authorized) {
          alert("Invalid Authenticator Code");
          return;
      }

      try {
          const user = users.find(u => u.id === superAction.targetId);
          const profilePath = user?.profilePath || `artifacts/seshnx-db/users/${superAction.targetId}/profiles/main`;

          if (superAction.type === 'ban') {
              await userActionsAPI.banUser(superAction.targetId, profilePath);
          }
          if (superAction.type === 'delete') {
              await userActionsAPI.deleteUser(superAction.targetId, profilePath);
          }
          fetchUsers();
          setSuperAction(null);
      } catch (error) {
          alert("Action failed: " + error.message);
      }
  };

  return (
    <div className="bg-admin-card rounded-lg border border-gray-800 overflow-hidden flex flex-col h-[calc(100vh-100px)]">
      {/* Toolbar */}
      <div className="p-2 border-b border-gray-800 flex justify-between items-center bg-admin-dark">
        <div className="flex items-center gap-2 bg-gray-900 px-2 py-1 rounded border border-gray-800 w-96">
            <Search size={14} className="text-gray-500"/>
            <input className="bg-transparent border-none outline-none text-xs text-white w-full" placeholder="Search GUID, Email, or Name..." />
        </div>
        <div className="text-xs text-gray-500 font-mono">
            Records: {users.length} | Latency: 24ms
        </div>
      </div>

      {/* Dense Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
            <thead className="bg-gray-900 sticky top-0 z-10">
                <tr>
                    {['GUID', 'Identity', 'Roles', 'Location', 'Rating', 'Status', 'Created', 'Actions'].map(h => (
                        <th key={h} className="px-3 py-2 text-xxs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-800">{h}</th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
                {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-800/50 transition-colors group">
                        <td className="px-3 py-1 text-xxs text-gray-600 font-mono truncate max-w-[80px]" title={u.id}>{u.id}</td>
                        <td className="px-3 py-1">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded bg-gray-800 flex items-center justify-center text-xxs font-bold text-white">{u.firstName?.[0]}</div>
                                <div>
                                    <div className="text-xs text-white font-medium">{u.firstName} {u.lastName}</div>
                                    <div className="text-xxs text-gray-500">{u.email}</div>
                                </div>
                            </div>
                        </td>
                        <td className="px-3 py-1">
                            <div className="flex gap-1">
                                {u.accountTypes?.map(r => (
                                    <span key={r} className="text-xxs bg-blue-900/30 text-blue-400 px-1 rounded border border-blue-900/50">{r}</span>
                                ))}
                            </div>
                        </td>
                        <td className="px-3 py-1 text-xs text-gray-400">{u.city}, {u.state}</td>
                        <td className="px-3 py-1 text-xs font-mono text-yellow-500">{u.rating || 'N/A'}</td>
                        <td className="px-3 py-1">
                            {u.isBanned ? 
                                <span className="text-xxs bg-red-900/20 text-red-500 px-1 py-0.5 rounded font-bold">BANNED</span> : 
                                <span className="text-xxs text-green-500">Active</span>
                            }
                        </td>
                        <td className="px-3 py-1 text-xxs text-gray-500">{u.createdAt ? new Date(u.createdAt.toMillis()).toLocaleDateString() : '-'}</td>
                        <td className="px-3 py-1 text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-1 hover:bg-blue-900/30 text-blue-500 rounded"><Eye size={14}/></button>
                                <button 
                                    onClick={() => setSuperAction({ type: 'ban', targetId: u.id })}
                                    className="p-1 hover:bg-red-900/30 text-red-500 rounded" title="Ban User"
                                >
                                    <ShieldAlert size={14}/>
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
      
      {superAction && (
          <SuperActionModal 
            action={`${superAction.type.toUpperCase()} USER ${superAction.targetId}`} 
            onConfirm={handleSuperExecution} 
            onCancel={() => setSuperAction(null)} 
          />
      )}
    </div>
  );
}
