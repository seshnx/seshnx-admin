import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserManager from './pages/UserManager';
import MarketplaceAdmin from './pages/MarketplaceAdmin';
import SupportDesk from './pages/SupportDesk';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      // In a real app, you would check u.email against a list of approved admins
      // or check a custom claim here.
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-900 text-white">Loading Admin...</div>;

  if (!user) return <Login />;

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<UserManager />} />
            <Route path="/market" element={<MarketplaceAdmin />} />
            <Route path="/support" element={<SupportDesk />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
