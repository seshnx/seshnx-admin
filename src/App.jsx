import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import EnrollMfa from './pages/EnrollMfa';
import DataGrid from './pages/DataGrid';
import UserManager from './pages/UserManager';
import InviteManager from './pages/InviteManager';
import SchoolManager from './pages/SchoolManager';
import { LayoutDashboard, Users, Lock, Ticket, GraduationCap, LogOut, Crown } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';

const Sidebar = () => {
  const { currentUser, isSuperAdmin } = useAuth();
  return (
    <div className="w-16 lg:w-64 bg-admin-dark border-r border-gray-800 flex flex-col h-screen">
      <div className="p-4 h-16 flex items-center justify-center lg:justify-start gap-3 border-b border-gray-800 text-admin-accent font-black tracking-tighter text-xl">
        <Lock size={24} /> <span className="hidden lg:block">SeshNx<span className="text-white font-thin">Admin</span></span>
        {isSuperAdmin && <Crown size={16} className="text-yellow-400 hidden lg:block" title="Super Admin" />}
      </div>
      <nav className="flex-1 py-4 space-y-1">
        <NavItem to="/" icon={<LayoutDashboard size={20}/>} label="Overview" />
        <NavItem to="/users" icon={<Users size={20}/>} label="Users" />
        <NavItem to="/schools" icon={<GraduationCap size={20}/>} label="Schools" />
        <NavItem to="/invites" icon={<Ticket size={20}/>} label="Access Keys" />
      </nav>
      <div className="p-4 border-t border-gray-800">
        <div className="text-xs text-gray-500 mb-2 hidden lg:block px-4 flex items-center gap-2">
          {currentUser?.email}
          {isSuperAdmin && <Crown size={12} className="text-yellow-400" title="Super Admin" />}
        </div>
        <button onClick={() => signOut(auth)} className="w-full flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-900/20 rounded transition-colors text-sm">
          <LogOut size={18} /> <span className="hidden lg:block">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

const NavItem = ({ to, icon, label }) => {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link to={to} className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${active ? 'bg-admin-accent/10 text-admin-accent border-r-2 border-admin-accent' : 'text-gray-500 hover:bg-gray-900 hover:text-gray-300'}`}>
      {icon} <span className="hidden lg:block text-sm font-medium">{label}</span>
    </Link>
  );
};

const Layout = ({ children }) => (
  <div className="flex h-screen bg-admin-dark">
    <Sidebar />
    <main className="flex-1 overflow-auto p-6">
      {children}
    </main>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { currentUser, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-admin-dark flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!currentUser || !isAdmin) {
    return <Navigate to="/login" />;
  }

  return <Layout>{children}</Layout>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/enroll-mfa" element={<ProtectedRoute><EnrollMfa /></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute><DataGrid /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><UserManager /></ProtectedRoute>} />
          <Route path="/schools" element={<ProtectedRoute><SchoolManager /></ProtectedRoute>} />
          <Route path="/invites" element={<ProtectedRoute><InviteManager /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
