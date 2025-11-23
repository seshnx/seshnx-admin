import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import DataGrid from './pages/DataGrid';
import { LayoutDashboard, Users, Database, Lock } from 'lucide-react';
import EnrollMfa from './pages/EnrollMfa';

const Sidebar = () => (
    <div className="w-16 lg:w-64 bg-admin-dark border-r border-gray-800 flex flex-col h-screen">
        <div className="p-4 h-16 flex items-center justify-center lg:justify-start gap-3 border-b border-gray-800 text-admin-accent font-black tracking-tighter text-xl">
            <Lock size={24} /> <span className="hidden lg:block">SeshNx<span className="text-white font-thin">Admin</span></span>
        </div>
        <nav className="flex-1 py-4 space-y-1">
            <NavItem icon={<LayoutDashboard size={20}/>} label="Overview" active />
            <NavItem icon={<Users size={20}/>} label="User Database" />
            <NavItem icon={<Database size={20}/>} label="Firestore Raw" />
        </nav>
        <div className="p-4 border-t border-gray-800">
            <UserInfo />
        </div>
    </div>
);

const NavItem = ({ icon, label, active }) => (
    <div className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${active ? 'bg-admin-accent/10 text-admin-accent border-r-2 border-admin-accent' : 'text-gray-500 hover:bg-gray-900 hover:text-gray-300'}`}>
        {icon} <span className="hidden lg:block text-sm font-medium">{label}</span>
    </div>
);

const UserInfo = () => {
    const { logout, currentUser } = useAuth();
    return (
        <button onClick={logout} className="text-xs text-red-500 hover:text-red-400 font-bold w-full text-left">
            LOGOUT: {currentUser?.email?.split('@')[0]}
        </button>
    );
};

const ProtectedRoute = ({ children }) => {
    const { currentUser, isAdmin } = useAuth();
    if (!currentUser || !isAdmin) return <Navigate to="/login" />;
    return <div className="flex h-screen bg-admin-dark text-white"><Sidebar /><main className="flex-1 p-4 overflow-hidden">{children}</main></div>;
};

export default function App() {
  return (
    <AuthProvider>
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                {/* Add Enrollment Route - Keep it protected so only logged-in admins can set it up */}
                <Route path="/enroll-mfa" element={<ProtectedRoute><EnrollMfa /></ProtectedRoute>} />
                <Route path="/" element={<ProtectedRoute><DataGrid /></ProtectedRoute>} />
            </Routes>
        </BrowserRouter>
    </AuthProvider>
  );
}
