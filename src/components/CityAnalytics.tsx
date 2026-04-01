/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, TrendingUp, Clock, ShoppingBag, 
  IndianRupee, Globe, Navigation, ArrowUpRight,
  BarChart3, PieChart as PieChartIcon, Activity,
  Calendar as CalendarIcon, Search
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, ReferenceLine
} from 'recharts';
import { AnalyticsData } from '../types';
import { format, parseISO } from 'date-fns';

interface CityAnalyticsProps {
  data: AnalyticsData;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];

const CityAnalytics: React.FC<CityAnalyticsProps> = ({ data }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('All Time');
  const [searchTerm, setSearchTerm] = useState('');

  const availableMonths = useMemo(() => {
    if (!data || !data.dailyStats) return ['All Time'];
    const months = new Set<string>();
    data.dailyStats.forEach(d => {
      if (d.date) {
        months.add(format(parseISO(d.date), 'yyyy-MM'));
      }
    });
    return ['All Time', ...Array.from(months).sort().reverse()];
  }, [data]);

  const monthlyCityStats = useMemo(() => {
    if (!data || !data.orders) return [];
    if (selectedMonth === 'All Time') return data.cityStats;
    
    const cityMap = new Map<string, { city: string; revenue: number; orders: number; avgDeliveryTime: number; delayRate: number; totalDelays: number }>();
    
    data.orders.forEach(order => {
      const orderMonth = format(parseISO(order.order_date), 'yyyy-MM');
      if (orderMonth === selectedMonth) {
        const city = order.city || 'Unknown';
        const current = cityMap.get(city) || { city, revenue: 0, orders: 0, avgDeliveryTime: 0, delayRate: 0, totalDelays: 0 };
        
        current.revenue += order.revenue || 0;
        current.orders += 1;
        current.avgDeliveryTime += Math.max(0, order.delivery_time_mins || 0);
        if ((order.delivery_time_mins || 0) > 30) {
          current.totalDelays += 1;
        }
        
        cityMap.set(city, current);
      }
    });
    
    return Array.from(cityMap.values()).map(c => ({
      ...c,
      avgDeliveryTime: Number((c.avgDeliveryTime / c.orders).toFixed(1)),
      delayRate: Math.round((c.totalDelays / c.orders) * 100)
    })).sort((a, b) => b.revenue - a.revenue);
  }, [data, selectedMonth]);

  const sortedCities = useMemo(() => {
    return monthlyCityStats.length > 0 ? monthlyCityStats : [...(data?.cityStats || [])].sort((a, b) => b.revenue - a.revenue);
  }, [monthlyCityStats, data?.cityStats]);

  const topCity = sortedCities[0] || { city: 'N/A', revenue: 0, orders: 0, avgDeliveryTime: 0 };
  const avgDeliveryTimeGlobal = useMemo(() => {
    if (!data?.orders || data.orders.length === 0) return 0;
    const totalClampedTime = data.orders.reduce((acc, curr) => acc + Math.max(0, curr.delivery_time_mins || 0), 0);
    return Number((totalClampedTime / data.orders.length).toFixed(1));
  }, [data?.orders]);

  const chartData = useMemo(() => {
    return monthlyCityStats.length > 0 ? monthlyCityStats : data.cityStats;
  }, [monthlyCityStats, data.cityStats]);

  const filteredChartData = useMemo(() => {
    if (!searchTerm.trim()) return chartData;
    return chartData.filter(c => 
      c.city.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [chartData, searchTerm]);

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
            <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl shadow-xl shadow-emerald-500/20">
              <Globe size={24} className="text-white" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-400 to-zinc-600">
              Geospatial Analytics
            </h1>
          </div>
          <p className="text-zinc-500 mt-2 font-medium">Regional performance, area-wise distribution, and logistics efficiency</p>
        </div>

        <div className="flex items-center gap-4 px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
          <Navigation size={18} className="text-emerald-400" />
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Active in {data.cityStats.length} Areas</p>
        </div>
      </div>

      {/* Top City Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Top Performing Area', value: topCity.city, icon: MapPin, color: 'from-blue-500 to-cyan-500', sub: `₹${((topCity.revenue || 0) / 1000).toFixed(1)}k Revenue` },
          { label: 'Avg Delay Delivery Time', value: `${avgDeliveryTimeGlobal}m`, icon: Clock, color: 'from-purple-500 to-pink-500', sub: 'Global Average' },
          { label: 'Total Regional Orders', value: (data?.cityStats || []).reduce((acc, curr) => acc + (curr.orders || 0), 0), icon: ShoppingBag, color: 'from-emerald-500 to-teal-500', sub: 'All Areas' },
          { label: 'Regional Growth', value: '+12.4%', icon: TrendingUp, color: 'from-amber-500 to-orange-500', sub: 'vs Last Month' },
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
      <div className="space-y-8">
        {/* Revenue by Area */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[40px] shadow-2xl space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-black text-white tracking-tight">Revenue Distribution</h3>
              <TrendingUp size={20} className="text-zinc-500" />
            </div>

            <div className="flex items-center gap-3 bg-white/5 p-1.5 rounded-2xl border border-white/10">
              <CalendarIcon size={16} className="text-zinc-500 ml-2" />
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-sm font-bold text-zinc-300 outline-none cursor-pointer pr-4"
              >
                  <option value="All Time" className="bg-zinc-900 text-white">All Time</option>
                  {availableMonths.filter(m => m !== 'All Time').map(m => (
                    <option key={m} value={m} className="bg-zinc-900 text-white">
                      {format(parseISO(m + '-01'), 'MMMM yyyy')}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="h-[400px] overflow-x-auto pb-4 custom-scrollbar">
            {sortedCities.length > 0 ? (
              <div style={{ width: Math.max(800, sortedCities.length * 80) + 'px', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={sortedCities}
                    margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
                  >
                    <defs>
                      <linearGradient id="colorAreaRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                    <XAxis 
                      dataKey="city" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 10, fill: '#71717a', fontWeight: 600}} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 600}}
                      tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#09090b', 
                        borderRadius: '16px', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(12px)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#ec4899" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorAreaRev)" 
                      animationDuration={2000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : renderChartFallback("No regional data available for the selected month")}
          </div>
        </div>

        {/* Avg Delay Delivery Time (min) */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[40px] shadow-2xl space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-black text-white tracking-tight">Avg Delay Delivery Time (min)</h3>
              <Clock size={20} className="text-zinc-500" />
            </div>

            <div className="relative group">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
              <input 
                type="text"
                placeholder="Search Area..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all w-full sm:w-64"
              />
            </div>
          </div>
          <div className="h-[400px] overflow-x-auto pb-4 custom-scrollbar">
            {filteredChartData.length > 0 ? (
              <div style={{ width: Math.max(800, filteredChartData.length * 80) + 'px', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={filteredChartData}
                    margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                    <XAxis 
                      dataKey="city" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 12, fill: '#71717a', fontWeight: 600}} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 12, fill: '#71717a', fontWeight: 600}}
                      unit="m"
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ 
                        backgroundColor: '#09090b', 
                        borderRadius: '16px', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(12px)'
                      }}
                      formatter={(value: number) => [`${value} min`, 'Avg Delay Delivery Time']}
                    />
                    <Bar 
                      dataKey="avgDeliveryTime" 
                      fill="#8b5cf6" 
                      radius={[4, 4, 0, 0]} 
                      animationDuration={1500}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : renderChartFallback(searchTerm ? `No results for "${searchTerm}"` : "No delivery data available")}
          </div>
        </div>

        {/* City Ranking Table */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] shadow-2xl overflow-hidden">
          <div className="p-8 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 size={20} className="text-blue-500" />
              <h3 className="text-xl font-black text-white tracking-tight">Area Performance Ranking</h3>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest">
              <Activity size={12} />
              Real-time Data
            </div>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  {['Rank', 'Area', 'Revenue', 'Orders', 'Avg Delay (min)', 'Growth'].map(head => (
                    <th key={head} className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedCities.map((city, i) => (
                  <motion.tr 
                    key={city.city}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-all group"
                  >
                    <td className="px-8 py-6">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-zinc-400">
                        #{i + 1}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-black text-xs">
                          {(city.city || 'C')[0]}
                        </div>
                        <span className="font-bold text-white text-sm">{city.city}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm font-black text-white">₹{(city.revenue / 1000).toFixed(1)}k</td>
                    <td className="px-8 py-6 text-sm font-bold text-zinc-400">{city.orders}</td>
                    <td className="px-8 py-6 text-sm font-medium text-zinc-500">{city.avgDeliveryTime} min</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                        <ArrowUpRight size={12} />
                        Stable
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CityAnalytics;
