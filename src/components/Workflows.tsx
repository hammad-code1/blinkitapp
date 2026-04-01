/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Bell, ArrowRight, Plus, Trash2, 
  Play, Pause, Settings, AlertTriangle, CheckCircle2,
  Package, Truck, Users, TrendingUp, LucideIcon, X
} from 'lucide-react';
import { AnalyticsData } from '../types';

interface Workflow {
  id: string;
  name: string;
  trigger: string;
  action: string;
  status: 'active' | 'paused';
  icon: LucideIcon;
  color: string;
}

interface LogEntry {
  id: string;
  time: string;
  msg: string;
  type: 'warning' | 'success' | 'info';
}

interface WorkflowsProps {
  data: AnalyticsData | null;
}

const Workflows: React.FC<WorkflowsProps> = ({ data }) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    trigger: '',
    action: '',
    type: 'Package' as 'Package' | 'Truck' | 'Users' | 'TrendingUp'
  });

  const realWorkflows = useMemo(() => {
    if (!data) return [];

    const list: Workflow[] = [];

    // 1. Low Stock Alert (Real Data)
    const lowStockProducts = data.products.filter(p => p.stock < 50);
    if (lowStockProducts.length > 0) {
      const count = lowStockProducts.length;
      list.push({
        id: 'low-stock',
        name: 'Low Stock Alert',
        trigger: `${count} products < 50 units`,
        action: count === 1 
          ? `Notify Procurement for ${lowStockProducts[0].product_name}`
          : `Restock ${count} low inventory items`,
        status: 'active',
        icon: Package,
        color: 'from-amber-500 to-orange-500'
      });
    }

    // 2. High Demand Re-routing (Real Data)
    const topCity = [...data.cityStats].sort((a, b) => b.orders - a.orders)[0];
    if (topCity) {
      list.push({
        id: 'high-demand',
        name: 'High Demand Re-routing',
        trigger: `Orders in ${topCity.city} > ${Math.floor(topCity.orders / 10)}/hr`,
        action: `Scale fleet in ${topCity.city}`,
        status: 'active',
        icon: Truck,
        color: 'from-blue-500 to-cyan-500'
      });
    }

    // 3. Churn Prevention (Real Data)
    const atRiskUsers = data.customerInsights.filter(u => u.segment === 'At Risk');
    if (atRiskUsers.length > 0) {
      list.push({
        id: 'churn',
        name: 'Churn Prevention',
        trigger: `${atRiskUsers.length} users inactive > 30 days`,
        action: 'Send Discount Coupons',
        status: 'active',
        icon: Users,
        color: 'from-purple-500 to-pink-500'
      });
    }

    // 4. Revenue Milestone (Real Data)
    const maxDailyRev = Math.max(...data.dailyStats.map(d => d.revenue), 0);
    if (maxDailyRev > 0) {
      list.push({
        id: 'revenue',
        name: 'Revenue Milestone',
        trigger: `Daily Revenue > ₹${(maxDailyRev * 0.8).toFixed(0)}`,
        action: 'Notify Management',
        status: 'active',
        icon: TrendingUp,
        color: 'from-emerald-500 to-teal-500'
      });
    }

    return list;
  }, [data]);

  // Initialize workflows and logs from real data once loaded
  useEffect(() => {
    if (realWorkflows.length > 0 && workflows.length === 0) {
      setWorkflows(realWorkflows);
      
      // Initial logs
      const initialLogs: LogEntry[] = [];
      if (realWorkflows.some(w => w.id === 'low-stock')) {
        const lowStockProd = data?.products.find(p => p.stock < 50);
        if (lowStockProd) initialLogs.push({ id: 'l1', time: '2 mins ago', msg: `Low Stock Alert triggered for "${lowStockProd.product_name}"`, type: 'warning' });
      }
      const topCity = [...(data?.cityStats || [])].sort((a, b) => b.orders - a.orders)[0];
      if (topCity) initialLogs.push({ id: 'l2', time: '15 mins ago', msg: `Fleet re-routed to ${topCity.city} due to surge`, type: 'success' });
      
      setLogs(initialLogs);
    }
  }, [realWorkflows, workflows.length, data]);

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950 text-zinc-500">
        <p className="font-black uppercase tracking-widest">Loading workflow data...</p>
      </div>
    );
  }

  const activeCount = workflows.filter(w => w.status === 'active').length;
  const totalTriggers = (data.orders.length * 0.05).toFixed(0); 
  const efficiency = 24.5;

  const toggleStatus = (id: string) => {
    setWorkflows(prev => prev.map(w => 
      w.id === id ? { ...w, status: w.status === 'active' ? 'paused' : 'active' } : w
    ));
  };

  const deleteWorkflow = (id: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== id));
  };

  const clearLogs = () => setLogs([]);

  const handleCreateWorkflow = () => {
    const icons = { Package, Truck, Users, TrendingUp };
    const colors = {
      Package: 'from-amber-500 to-orange-500',
      Truck: 'from-blue-500 to-cyan-500',
      Users: 'from-purple-500 to-pink-500',
      TrendingUp: 'from-emerald-500 to-teal-500'
    };

    const workflow: Workflow = {
      id: Math.random().toString(36).substr(2, 9),
      name: newWorkflow.name || 'New Workflow',
      trigger: newWorkflow.trigger || 'Custom Condition',
      action: newWorkflow.action || 'Custom Action',
      status: 'active',
      icon: icons[newWorkflow.type],
      color: colors[newWorkflow.type]
    };

    setWorkflows(prev => [workflow, ...prev]);
    setIsModalOpen(false);
    setNewWorkflow({ name: '', trigger: '', action: '', type: 'Package' });
    
    // Add a log for creation
    setLogs(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      time: 'Just now',
      msg: `New workflow "${workflow.name}" created and activated`,
      type: 'info'
    }, ...prev]);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 space-y-8 bg-zinc-950 min-h-screen text-zinc-100"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl shadow-xl shadow-blue-500/20">
              <Zap size={24} className="text-white" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-400 to-zinc-600">
              Automation Workflows
            </h1>
          </div>
          <p className="text-zinc-500 mt-2 font-medium">Smart business rules that trigger automatically based on real-time data</p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-8 py-3 bg-white text-zinc-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-white/10"
        >
          <Plus size={18} />
          Create Workflow
        </button>
      </div>

      {/* Create Workflow Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-[40px] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
              
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-white tracking-tight">New Workflow</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                  <X size={20} className="text-zinc-500" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Workflow Name</label>
                  <input 
                    type="text" 
                    value={newWorkflow.name}
                    onChange={e => setNewWorkflow(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. High Value Order Alert"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Trigger Condition</label>
                    <input 
                      type="text" 
                      value={newWorkflow.trigger}
                      onChange={e => setNewWorkflow(prev => ({ ...prev, trigger: e.target.value }))}
                      placeholder="e.g. Order > ₹5000"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Action</label>
                    <input 
                      type="text" 
                      value={newWorkflow.action}
                      onChange={e => setNewWorkflow(prev => ({ ...prev, action: e.target.value }))}
                      placeholder="e.g. Email CEO"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Icon Type</label>
                  <div className="grid grid-cols-4 gap-3">
                    {(['Package', 'Truck', 'Users', 'TrendingUp'] as const).map(type => {
                      const Icon = { Package, Truck, Users, TrendingUp }[type];
                      return (
                        <button
                          key={type}
                          onClick={() => setNewWorkflow(prev => ({ ...prev, type }))}
                          className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                            newWorkflow.type === type 
                              ? 'bg-blue-500/10 border-blue-500 text-blue-400' 
                              : 'bg-white/5 border-white/10 text-zinc-500 hover:border-white/20'
                          }`}
                        >
                          <Icon size={20} />
                          <span className="text-[8px] font-bold uppercase">{type}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button 
                  onClick={handleCreateWorkflow}
                  className="w-full py-4 bg-white text-zinc-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/10 mt-4"
                >
                  Activate Workflow
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Active Rules</p>
          <p className="text-3xl font-black text-white">{activeCount}</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Triggers Today</p>
          <p className="text-3xl font-black text-white">{totalTriggers}</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Efficiency Gain</p>
          <p className="text-3xl font-black text-emerald-400">+{efficiency}%</p>
        </div>
      </div>

      {/* Workflow List */}
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence>
          {workflows.map((workflow, index) => (
            <motion.div
              key={workflow.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.1 }}
              className="group bg-white/5 hover:bg-white/[0.08] border border-white/10 rounded-[32px] p-6 flex flex-col lg:flex-row items-center justify-between gap-6 transition-all"
            >
              <div className="flex items-center gap-6 flex-1">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${workflow.color} flex items-center justify-center text-white shadow-lg shadow-black/20`}>
                  <workflow.icon size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">{workflow.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Trigger:</span>
                    <span className="text-sm font-medium text-zinc-300">{workflow.trigger}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-black/20 p-4 rounded-2xl border border-white/5">
                <div className="text-right">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Action</p>
                  <p className="text-sm font-bold text-blue-400">{workflow.action}</p>
                </div>
                <ArrowRight size={20} className="text-zinc-700" />
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => toggleStatus(workflow.id)}
                  className={`p-4 rounded-2xl transition-all ${
                    workflow.status === 'active' 
                      ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' 
                      : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                  }`}
                >
                  {workflow.status === 'active' ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <button className="p-4 bg-white/5 text-zinc-400 hover:text-white rounded-2xl transition-all">
                  <Settings size={20} />
                </button>
                <button 
                  onClick={() => deleteWorkflow(workflow.id)}
                  className="p-4 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-2xl transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Automation Logs */}
      <div className="bg-white/5 border border-white/10 rounded-[40px] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell size={20} className="text-blue-500" />
            <h3 className="text-xl font-black text-white tracking-tight">Recent Activity Log</h3>
          </div>
          <button 
            onClick={clearLogs}
            className="text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-all"
          >
            Clear Logs
          </button>
        </div>
        <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
          {logs.length > 0 ? (
            logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-4 hover:bg-white/5 rounded-2xl transition-all group">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${
                    log.type === 'warning' ? 'bg-amber-500' : 
                    log.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                  }`} />
                  <p className="text-sm font-medium text-zinc-300 group-hover:text-white transition-all">{log.msg}</p>
                </div>
                <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest">{log.time}</span>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">No recent workflow activity</p>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-white/10 text-center">
          <button 
            onClick={() => setIsHistoryModalOpen(true)}
            className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-all"
          >
            View Full History
          </button>
        </div>
      </div>

      {/* Full History Modal */}
      <AnimatePresence>
        {isHistoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-[40px] p-8 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <Bell size={24} className="text-blue-500" />
                  <h3 className="text-2xl font-black text-white tracking-tight">Full Activity History</h3>
                </div>
                <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                  <X size={20} className="text-zinc-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-2">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${
                          log.type === 'warning' ? 'bg-amber-500' : 
                          log.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                        }`} />
                        <p className="text-sm font-medium text-zinc-300">{log.msg}</p>
                      </div>
                      <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{log.time}</span>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center">
                    <p className="text-zinc-500 font-black uppercase tracking-widest">History is empty</p>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
                <button 
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Close History
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Workflows;
