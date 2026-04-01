/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, X, AlertTriangle, CheckCircle2, 
  Info, Zap, Clock, ChevronRight 
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'success' | 'info' | 'error';
  time: string;
  read: boolean;
}

const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    { 
      id: '1', 
      title: 'High Delay Risk', 
      message: 'Mumbai Central is experiencing 45% delivery delays.', 
      type: 'warning', 
      time: '2m ago',
      read: false
    },
    { 
      id: '2', 
      title: 'Stock Alert', 
      message: 'Amul Milk 500ml is below safety stock level (12 units).', 
      type: 'error', 
      time: '15m ago',
      read: false
    },
    { 
      id: '3', 
      title: 'Revenue Milestone', 
      message: 'Daily revenue has crossed ₹10,00,000!', 
      type: 'success', 
      time: '1h ago',
      read: true
    },
    { 
      id: '4', 
      title: 'System Update', 
      message: 'Fleet optimization algorithm updated to v2.4.', 
      type: 'info', 
      time: '3h ago',
      read: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group"
      >
        <Bell size={20} className="text-zinc-400 group-hover:text-white transition-all" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-zinc-950">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-96 bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap size={18} className="text-blue-500" />
                  <h3 className="text-lg font-black text-white tracking-tight">System Alerts</h3>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={markAllAsRead}
                    className="text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-all"
                  >
                    Mark all read
                  </button>
                  <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="max-h-[480px] overflow-y-auto p-4 space-y-2">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 size={32} className="text-zinc-700" />
                    </div>
                    <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">All caught up!</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <motion.div
                      key={n.id}
                      layout
                      className={`p-4 rounded-2xl border transition-all group relative ${
                        n.read ? 'bg-white/5 border-white/5' : 'bg-white/[0.08] border-white/10 shadow-lg'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`mt-1 p-2 rounded-xl ${
                          n.type === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                          n.type === 'error' ? 'bg-rose-500/10 text-rose-500' :
                          n.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                          'bg-blue-500/10 text-blue-500'
                        }`}>
                          {n.type === 'warning' && <AlertTriangle size={16} />}
                          {n.type === 'error' && <Zap size={16} />}
                          {n.type === 'success' && <CheckCircle2 size={16} />}
                          {n.type === 'info' && <Info size={16} />}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-sm font-black tracking-tight ${n.read ? 'text-zinc-400' : 'text-white'}`}>
                              {n.title}
                            </h4>
                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-1">
                              <Clock size={10} />
                              {n.time}
                            </span>
                          </div>
                          <p className={`text-xs font-medium leading-relaxed ${n.read ? 'text-zinc-500' : 'text-zinc-400'}`}>
                            {n.message}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeNotification(n.id)}
                        className="absolute top-2 right-2 p-1 text-zinc-700 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X size={14} />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-white/10">
                <button className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all">
                  View All History
                  <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
