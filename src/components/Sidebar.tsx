/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Package, Users, BrainCircuit, Upload, 
  LogOut, MapPin, Truck, ChevronRight, X, Zap, Table
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  role: 'admin' | 'user';
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, role, isOpen, onClose, onLogout }) => {

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin'] },
    { id: 'city', label: 'City Analytics', icon: MapPin, roles: ['admin'] },
    { id: 'products', label: 'Products', icon: Package, roles: ['admin'] },
    { id: 'customers', label: 'Customers', icon: Users, roles: ['admin'] },
    { id: 'delivery', label: 'Delivery', icon: Truck, roles: ['admin'] },
    { id: 'workflows', label: 'Workflows', icon: Zap, roles: ['admin'] },
    { id: 'ai', label: 'AI Insights', icon: BrainCircuit, roles: ['admin'] },
    { id: 'explorer', label: 'Data Explorer', icon: Table, roles: ['admin'] },
    { id: 'upload', label: 'Data Upload', icon: Upload, roles: ['admin', 'user'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(role));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <motion.div 
        initial={false}
        animate={{ 
          x: isOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024 ? -320 : 0),
          opacity: 1
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          "fixed top-0 left-0 w-72 h-screen z-50 flex flex-col transition-transform duration-300 lg:translate-x-0",
          !isOpen && "-translate-x-full lg:translate-x-0",
          "bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950",
          "border-r border-white/10 shadow-2xl shadow-black/50"
        )}
      >
        {/* Header */}
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
              B
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
              Blinkit
            </span>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 text-zinc-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* User Card */}
        <div className="px-6 mb-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400">
                <Users size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-white capitalize">{role}</p>
                <p className="text-xs text-zinc-500">Active Session</p>
              </div>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                onClose();
              }}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all group",
                activeTab === item.id 
                  ? "bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-pink-500/20 text-white border border-white/10" 
                  : "text-zinc-500 hover:text-white hover:bg-white/5"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} />
                <span>{item.label}</span>
              </div>

              <ChevronRight size={16} className="opacity-50 group-hover:opacity-100" />
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;