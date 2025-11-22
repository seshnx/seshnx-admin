import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Lock } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      setErr("Invalid admin credentials");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-700">
        <div className="flex justify-center mb-6 text-blue-500">
            <Lock size={48} />
        </div>
        <h2 className="text-2xl font-bold text-center text-white mb-6">SeshNx Admin</h2>
        {err && <div className="bg-red-500/20 text-red-200 p-3 rounded text-sm mb-4 text-center">{err}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email" 
            placeholder="Admin Email" 
            className="w-full p-3 bg-gray-700 rounded-lg text-white border border-gray-600 focus:border-blue-500 outline-none"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full p-3 bg-gray-700 rounded-lg text-white border border-gray-600 focus:border-blue-500 outline-none"
            value={pass}
            onChange={e => setPass(e.target.value)}
          />
          <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold transition">
            Access Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}
