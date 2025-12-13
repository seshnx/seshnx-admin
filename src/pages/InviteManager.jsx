import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs, doc, setDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Ticket, Copy, Plus, RefreshCw } from 'lucide-react';

export default function InviteManager() {
  const { currentUser, reauthenticateAdmin } = useAuth();
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInvites = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'invites'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setInvites(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      // Expected: Firestore permission errors are normal - admin operations should use API routes
      if (e.code && e.code.includes('permission')) {
        console.warn('InviteManager: Firestore permission denied. Use API routes for admin operations.');
        setInvites([]); // Show empty state
      } else {
        console.error('Error fetching invites:', e);
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchInvites(); }, []);

  const generateInvite = async () => {
    // SECURITY: Require MFA to generate an invite (prevent rogue admins from adding backdoors)
    const code = prompt("Enter your TOTP code to authorize invite generation:");
    const isAuth = await reauthenticateAdmin(code);
    if (!isAuth) return alert("Authorization Failed");

    const inviteCode = 'ADM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    try {
      await setDoc(doc(db, 'invites', inviteCode), {
        code: inviteCode,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        used: false,
        role: 'admin' // Default role
      });
      fetchInvites();
    } catch (e) {
      if (e.code && e.code.includes('permission')) {
        alert('Permission denied. Admin operations should use API routes.');
      } else {
        alert('Error creating invite: ' + e.message);
      }
    }
  };

  return (
    <div className="bg-admin-card rounded-lg border border-gray-800 overflow-hidden h-full flex flex-col">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-admin-dark">
        <h2 className="font-bold flex items-center gap-2"><Ticket size={20} className="text-admin-accent"/> Invite Management</h2>
        <button onClick={generateInvite} className="bg-admin-accent hover:bg-blue-600 text-white px-4 py-2 rounded text-xs font-bold flex items-center gap-2">
            <Plus size={14}/> Generate Code
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {invites.map(inv => (
                <div key={inv.id} className={`p-4 rounded border ${inv.used ? 'border-gray-800 bg-gray-900 opacity-50' : 'border-green-900/50 bg-green-900/10'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <span className="font-mono text-lg font-bold text-white">{inv.id}</span>
                        {inv.used ? <span className="text-xxs bg-gray-800 px-2 py-1 rounded">USED</span> : <span className="text-xxs bg-green-600 text-white px-2 py-1 rounded animate-pulse">ACTIVE</span>}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                        Created: {inv.createdAt?.toDate().toLocaleDateString()}
                    </div>
                    {!inv.used && (
                        <button 
                            onClick={() => navigator.clipboard.writeText(inv.id)}
                            className="w-full flex items-center justify-center gap-2 bg-black hover:bg-gray-800 py-2 rounded text-xs transition"
                        >
                            <Copy size={12}/> Copy Code
                        </button>
                    )}
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
