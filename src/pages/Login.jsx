import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Key } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Login() {
  const { login, mfaNeeded, verifyMfaLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState('');

  const handleBasicLogin = async (e) => {
    e.preventDefault();
    setError('');
    try { await login(email, pass); } 
    catch (err) { setError("Invalid credentials or unauthorized."); }
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    try { await verifyMfaLogin(mfaCode, mfaNeeded); } 
    catch (err) { setError("Invalid Authenticator Code."); }
  };

  if (mfaNeeded) {
    return (
      <div className="min-h-screen bg-admin-dark flex items-center justify-center text-white p-4">
        <div className="w-full max-w-md bg-admin-card p-8 rounded-xl border border-gray-800 shadow-2xl">
          <div className="flex justify-center mb-6 text-admin-accent"><Shield size={64} strokeWidth={1.5} /></div>
          <h2 className="text-2xl font-bold text-center mb-2">Security Check</h2>
          <p className="text-center text-gray-400 text-sm mb-6">Enter the 6-digit code from your Authenticator App.</p>
          {error && <div className="bg-red-900/30 text-red-400 p-3 rounded mb-4 text-center text-xs">{error}</div>}
          <form onSubmit={handleMfaSubmit} className="space-y-4">
            <div className="relative">
                <Key className="absolute left-3 top-3 text-gray-500" size={18} />
                <input 
                    className="w-full bg-black border border-gray-700 rounded p-3 pl-10 text-white text-center tracking-[0.5em] font-mono text-xl focus:border-admin-accent outline-none"
                    placeholder="000000"
                    maxLength={6}
                    value={mfaCode}
                    onChange={e => setMfaCode(e.target.value.replace(/\D/g,''))}
                    autoFocus
                />
            </div>
            <button className="w-full bg-admin-accent hover:bg-blue-600 text-white py-3 rounded font-bold transition">Verify Identity</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-admin-dark flex items-center justify-center text-white p-4">
      <div className="w-full max-w-md bg-admin-card p-8 rounded-xl border border-gray-800 shadow-2xl">
        <div className="flex justify-center mb-6 text-gray-600"><Lock size={64} strokeWidth={1.5} /></div>
        <h1 className="text-xl font-bold text-center mb-6 uppercase tracking-widest">SeshNx <span className="text-admin-accent">Admin</span></h1>
        {error && <div className="bg-red-900/30 text-red-400 p-3 rounded mb-4 text-center text-xs">{error}</div>}
        <form onSubmit={handleBasicLogin} className="space-y-4">
          <input className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-admin-accent outline-none" type="email" placeholder="Admin Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-admin-accent outline-none" type="password" placeholder="Password" value={pass} onChange={e=>setPass(e.target.value)} />
          <button className="w-full bg-white text-black py-3 rounded font-bold hover:bg-gray-200 transition">Proceed</button>
        </form>
        <div className="mt-6 text-center space-y-2">
            <Link to="/register" className="text-xs text-admin-accent hover:text-blue-400 transition underline">
                Make an account (Testing)
            </Link>
            <p className="text-xxs text-gray-600">
                Access is restricted to authorized personnel.<br/>
                All actions are logged and monitored.
            </p>
        </div>
      </div>
    </div>
  );
}
