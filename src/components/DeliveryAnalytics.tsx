/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Truck, Clock, AlertTriangle, CheckCircle2, 
  TrendingUp, Activity, Navigation, Zap,
  BarChart3, LineChart as LineChartIcon, ShieldCheck
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { AnalyticsData } from '../types';

interface DeliveryAnalyticsProps {
  data: AnalyticsData;
}

const DeliveryAnalytics: React.FC<DeliveryAnalyticsProps> = ({ data }) => {
  const deliveryStats = useMemo(() => {
    if (!data?.orders || data.orders.length === 0) return { avgTime: 0, delayRate: 0, onTimePercent: 0 };
    
    const totalClampedTime = data.orders.reduce((acc, curr) => acc + Math.max(0, curr.delivery_time_mins || 0), 0);
    const avgTime = Math.round(totalClampedTime / data.orders.length);
    
    const delayRate = Math.round((data.orders.filter(o => (o.delivery_time_mins || 0) > 30).length / data.orders.length) * 100);
    const onTimePercent = 100 - delayRate;
    
    return { avgTime, delayRate, onTimePercent };
  }, [data?.orders]);

  const deliveryTimeTrend = useMemo(() => {
    return (data?.dailyStats || []).map(d => ({
      date: d.date,
      avgTime: Math.round(d.avgDeliveryTime || 0),
      orders: d.orders || 0
    }));
  }, [data?.dailyStats]);

  const renderChartFallback = (message: string) => (
    <div className="flex flex-col items-center justify-center h-full space-y-4 text-zinc-500">
      <Activity size={32} className="opacity-20" />
      <p className="text-sm font-bold uppercase tracking-widest opacity-50">{message}</p>
    </div>
  );

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
              <Truck size={24} className="text-white" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-400 to-zinc-600">
              Logistics & Delivery
            </h1>
          </div>
          <p className="text-zinc-500 mt-2 font-medium">Fleet performance, delivery efficiency, and operational bottlenecks</p>
        </div>

        <div className="flex items-center gap-4 px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
          <ShieldCheck size={18} className="text-emerald-400" />
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">System Status: Optimal</p>
        </div>
      </div>

      {/* Delivery KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Avg Delay Delivery Time', value: `${deliveryStats.avgTime}m`, icon: Clock, color: 'from-blue-500 to-cyan-500', sub: '-2m vs Last Week' },
          { label: 'Delay Rate', value: `${deliveryStats.delayRate}%`, icon: AlertTriangle, color: 'from-rose-500 to-pink-500', sub: '+0.4% vs Last Week' },
          { label: 'On-Time Delivery', value: `${deliveryStats.onTimePercent}%`, icon: CheckCircle2, color: 'from-emerald-500 to-teal-500', sub: 'Target: 95%' },
          { label: 'Fleet Efficiency', value: '94.2%', icon: Zap, color: 'from-amber-500 to-orange-500', sub: 'Optimal Utilization' },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[32px] shadow-2xl relative overflow-hidden group"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.color} opacity-10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:opacity-20 transition-all duration-500`} />
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-lg shadow-blue-500/20 mb-6`}>
              <card.icon size={24} />
            </div>
            <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">{card.label}</p>
            <p className="text-3xl font-black text-white tracking-tighter mt-1">{card.value}</p>
            <p className="text-xs text-zinc-400 font-bold mt-2">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="flex flex-col gap-8">
        {/* Delivery Time vs Orders */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[40px] shadow-2xl space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-white tracking-tight">Avg Delay vs Orders</h3>
            <LineChartIcon size={20} className="text-zinc-500" />
          </div>
          <div className="h-[400px] overflow-x-auto pb-4 custom-scrollbar">
            {deliveryTimeTrend.length > 0 ? (
              <div style={{ width: Math.max(1200, deliveryTimeTrend.length * 40) + 'px', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={deliveryTimeTrend}>
                    <defs>
                      <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 12, fill: '#71717a', fontWeight: 600}} 
                      tickFormatter={(val) => {
                        try {
                          return val.split('-')[2];
                        } catch (e) {
                          return val;
                        }
                      }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 12, fill: '#71717a', fontWeight: 600}}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#09090b', 
                        borderRadius: '16px', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(12px)'
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'avgTime') return [`${value.toFixed(1)} min`, 'Avg Delay'];
                        return [value, 'Orders'];
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="avgTime" 
                      stroke="#3b82f6" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorTime)" 
                      animationDuration={2000}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="orders" 
                      stroke="#ec4899" 
                      strokeWidth={4}
                      fillOpacity={0} 
                      animationDuration={2000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : renderChartFallback("No trend data available")}
          </div>
        </div>
      </div>

      {/* Delivery Risk Alert */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-gradient-to-r from-rose-500/10 to-orange-500/10 backdrop-blur-2xl border border-rose-500/20 p-8 rounded-[32px] flex items-center gap-6 shadow-2xl"
      >
        <div className="p-4 bg-rose-500/20 rounded-2xl border border-rose-500/20 animate-pulse">
          <AlertTriangle size={32} className="text-rose-400" />
        </div>
        <div>
          <h4 className="text-xl font-black text-white tracking-tight">High Delay Risk in Bangalore</h4>
          <p className="text-rose-200/60 font-medium mt-1">
            Traffic congestion in <span className="text-rose-400 font-bold">Indiranagar</span> is causing a 20-minute delay in 40% of orders. 
            Recommend rerouting 15 delivery partners to alternative hubs.
          </p>
        </div>
        <button className="ml-auto px-8 py-3 bg-rose-500 text-zinc-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-400 transition-all shadow-xl shadow-rose-500/20">
          Reroute Fleet
        </button>
      </motion.div>
    </motion.div>
  );
};

export default DeliveryAnalytics;
