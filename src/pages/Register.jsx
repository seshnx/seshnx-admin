import React, { useState } from 'react';
import { Shield, UserPlus, ArrowRight, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { registerAPI } from '../utils/api';

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
      // Use API for registration (handles both auth and admin record creation)
      try {
        const role = formData.inviteCode.trim().length > 0 
          ? 'GAdmin' // If invite code provided, use it (TODO: verify invite code via API)
          : 'GAdmin'; // Default role for temp accounts
        
        await registerAPI.register(formData.email, formData.password, role);
        
        // Redirect to login (account created, can now login)
        navigate('/login');
      } catch (err) {
        if (err.message && err.message.includes('already exists')) {
          setError('Account already exists. Please login instead.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        throw err;
      }

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
        <h2 className="text-2xl font-bold text-center mb-2">Create Admin Account</h2>
        <p className="text-center text-gray-400 text-sm mb-6">
          {formData.inviteCode ? 'Using invite code' : 'Create account for testing (invite code optional)'}
        </p>

        {error && <div className="bg-red-900/30 text-red-400 p-3 rounded mb-4 text-center text-xs">{error}</div>}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Invite Code (Optional)</label>
            <input 
                className="w-full bg-black border border-gray-700 rounded p-3 text-white font-mono tracking-wider focus:border-admin-accent outline-none uppercase"
                placeholder="XXXX-XXXX (leave blank for testing)"
                value={formData.inviteCode}
                onChange={e => setFormData({...formData, inviteCode: e.target.value.toUpperCase()})}
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
