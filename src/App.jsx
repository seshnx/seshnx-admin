import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register'; // NEW
import EnrollMfa from './pages/EnrollMfa';
import DataGrid from './pages/DataGrid';
import InviteManager from './pages/InviteManager'; // NEW
import { LayoutDashboard, Users, Database, Lock, Ticket } from 'lucide-react'; // Added Ticket

const Sidebar = () => (
    <div className="w-16 lg:w-64 bg-admin-dark border-r border-gray-800 flex flex-col h-screen">
        <div className="p-4 h-16 flex items-center justify-center lg:justify-start gap-3 border-b border-gray-800 text-admin-accent font-black tracking-tighter text-xl">
            <Lock size={24} /> <span className="hidden lg:block">SeshNx<span className="text-white font-thin">Admin</span></span>
        </div>
        <nav className="flex-1 py-4 space-y-1">
            <NavItem to="/" icon={<LayoutDashboard size={20}/>} label="Overview" />
            <NavItem to="/users" icon={<Users size={20}/>} label="User Database" />
            <NavItem to="/invites" icon={<Ticket size={20}/>} label="Access Keys" /> {/* NEW */}
        </nav>
        {/* ... UserInfo footer ... */}
    </div>
);

// Update NavItem to accept 'to' prop and use Link/Navigate logic
import { Link, useLocation } from 'react-router-dom';
const NavItem = ({ to, icon, label }) => {
    const location = useLocation();
    const active = location.pathname === to;
    return (
        <Link to={to} className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${active ? 'bg-admin-accent/10 text-admin-accent border-r-2 border-admin-accent' : 'text-gray-500 hover:bg-gray-900 hover:text-gray-300'}`}>
            {icon} <span className="hidden lg:block text-sm font-medium">{label}</span>
        </Link>
    );
};

// ... ProtectedRoute wrapper ...

export default function App() {
  return (
    <AuthProvider>
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} /> {/* Public Route */}
                
                {/* Protected Routes */}
                <Route path="/enroll-mfa" element={<ProtectedRoute><EnrollMfa /></ProtectedRoute>} />
                <Route path="/" element={<ProtectedRoute><DataGrid /></ProtectedRoute>} />
                <Route path="/invites" element={<ProtectedRoute><InviteManager /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    </AuthProvider>
  );
}
