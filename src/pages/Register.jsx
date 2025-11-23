import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, APP_ID } from '../firebase';
import { Shield, UserPlus, ArrowRight, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const [formData, setFormData] = useState({ email: '', password: '', inviteCode: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Verify Invite Code
      // We assume codes are stored in an 'invites' collection where ID = code
      const inviteRef = doc(db, 'invites', formData.inviteCode);
      const inviteSnap = await getDoc(inviteRef);

      if (!inviteSnap.exists()) {
        throw new Error("Invalid or expired invite code.");
      }

      const inviteData = inviteSnap.data();
      if (inviteData.used) {
        throw new Error("This invite code has already been used.");
      }

      // 2. Create Authentication User
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 3. Create Admin Record (Grants Access)
      // We copy the role/permissions defined in the invite to the admin doc
      await setDoc(doc(db, 'admins', user.uid), {
        email: user.email,
        role: inviteData.role || 'admin', // 'super_admin' or 'admin'
        createdAt: serverTimestamp(),
        createdBy: inviteData.createdBy,
        status: 'active'
      });

      // 4. Invalidate Invite Code
      await updateDoc(inviteRef, {
        used: true,
        usedBy: user.uid,
        usedAt: serverTimestamp()
      });

      // 5. Redirect to MFA Setup
      navigate('/enroll-mfa');

    } catch (err) {
      console.error(err);
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-admin-dark flex items-center justify-center p-4 text-white">
      <div className="w-full max-w-md bg-admin-card p-8 rounded-xl border border-gray-800 shadow-2xl">
        <div className="flex justify-center mb-6 text-admin-accent">
            <UserPlus size={64} strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-bold text-center mb-2">Admin Access</h2>
        <p className="text-center text-gray-400 text-sm mb-6">
          Registration is restricted. Enter your invite code.
        </p>

        {error && <div className="bg-red-900/30 text-red-400 p-3 rounded mb-4 text-center text-xs">{error}</div>}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Invite Code</label>
            <input 
                className="w-full bg-black border border-gray-700 rounded p-3 text-white font-mono tracking-wider focus:border-admin-accent outline-none uppercase"
                placeholder="XXXX-XXXX"
                value={formData.inviteCode}
                onChange={e => setFormData({...formData, inviteCode: e.target.value.toUpperCase()})}
                required
            />
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <input 
                className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-admin-accent outline-none"
                type="email" 
                placeholder="Email Address"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                required
            />
            <input 
                className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-admin-accent outline-none"
                type="password" 
                placeholder="Create Password"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                required
            />
          </div>

          <button 
            disabled={loading}
            className="w-full bg-admin-accent hover:bg-blue-600 text-white py-3 rounded font-bold transition flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Start Setup <ArrowRight size={18}/></>}
          </button>
        </form>

        <div className="mt-6 text-center">
            <Link to="/login" className="text-xs text-gray-500 hover:text-white transition">
                Already have an account? Login
            </Link>
        </div>
      </div>
    </div>
  );
}
