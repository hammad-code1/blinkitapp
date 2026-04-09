/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, X, AlertTriangle, CheckCircle2, 
  Info, Zap, Clock, ChevronRight 
} from 'lucide-react';
import { useData } from '../context/DataContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'success' | 'info' | 'error';
  time: string;
  read: boolean;
}

const NotificationCenter: React.FC = () => {
  const { data, isDataLoaded, lastUploadTime } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const notifications = useMemo(() => {
    const alerts: Notification[] = [];

    if (!isDataLoaded || !data) {
      return [
        {
          id: 'no-data',
          title: 'No Data Loaded',
          message: 'Please upload a CSV file or fetch data to see system alerts.',
          type: 'info',
          time: 'Now',
          read: false
        }
      ];
    }

    // 1. Low Stock Alerts
    const lowStockProducts = data.products.filter(p => p.stock < 20).slice(0, 3);
    lowStockProducts.forEach((p, i) => {
      alerts.push({
        id: `stock-${p.product_id}`,
        title: 'Low Stock Alert',
        message: `${p.product_name} is running low (${p.stock} units remaining).`,
        type: 'error',
        time: 'Just now',
        read: readIds.has(`stock-${p.product_id}`)
      });
    });

    // 2. Revenue Milestone
    const totalRevenue = data.orders.reduce((sum, o) => sum + (o.revenue || 0), 0);
    if (totalRevenue > 0) {
      const milestone = totalRevenue > 1000000 ? '₹10L' : totalRevenue > 500000 ? '₹5L' : '₹1L';
      alerts.push({
        id: 'revenue-milestone',
        title: 'Revenue Milestone',
        message: `Total revenue has crossed ${milestone}! Current: ₹${(totalRevenue / 100000).toFixed(1)}L`,
        type: 'success',
        time: '1h ago',
        read: readIds.has('revenue-milestone')
      });
    }

    // 3. Data Load Info
    if (lastUploadTime) {
      alerts.push({
        id: 'data-update',
        title: 'Data Synchronized',
        message: `System data was successfully updated at ${lastUploadTime}.`,
        type: 'info',
        time: 'Today',
        read: readIds.has('data-update')
      });
    }

    // 4. High Demand Alert
    const topProduct = [...data.products].sort((a, b) => {
      const aSales = data.orders.filter(o => o.product_id === a.product_id).length;
      const bSales = data.orders.filter(o => o.product_id === b.product_id).length;
      return bSales - aSales;
    })[0];

    if (topProduct) {
      alerts.push({
        id: 'high-demand',
        title: 'High Demand Detected',
        message: `${topProduct.product_name} is trending with high order volume.`,
        type: 'warning',
        time: '30m ago',
        read: readIds.has('high-demand')
      });
    }

    return alerts.filter(n => !removedIds.has(n.id));
  }, [data, isDataLoaded, lastUploadTime, readIds, removedIds]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    const allIds = new Set(readIds);
    notifications.forEach(n => allIds.add(n.id));
    setReadIds(allIds);
  };

  const removeNotification = (id: string) => {
    const newRemoved = new Set(removedIds);
    newRemoved.add(id);
    setRemovedIds(newRemoved);
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
