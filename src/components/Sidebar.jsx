import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, ShoppingBag, LifeBuoy, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export default function Sidebar() {
  const links = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Overview' },
    { to: '/users', icon: <Users size={20} />, label: 'User Management' },
    { to: '/market', icon: <ShoppingBag size={20} />, label: 'Marketplace' },
    { to: '/support', icon: <LifeBuoy size={20} />, label: 'Service Desk' },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col">
      <div className="p-6 border-b dark:border-gray-700">
        <h1 className="text-xl font-black tracking-tighter text-blue-600">SeshNx<span className="text-gray-500 font-normal">Admin</span></h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {links.map(l => (
          <NavLink 
            key={l.to} 
            to={l.to}
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${isActive ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            {l.icon} {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t dark:border-gray-700">
        <button onClick={() => signOut(auth)} className="flex items-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 w-full px-4 py-2 rounded-lg transition">
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
