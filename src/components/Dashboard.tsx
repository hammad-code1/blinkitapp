/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, IndianRupee, TrendingUp, TrendingDown, 
  Clock, AlertTriangle, Calendar as CalendarIcon, 
  ChevronDown, Filter, ArrowUpRight, ArrowDownRight, MapPin, Users,
  ShieldCheck, Sparkles, PackageSearch, Activity
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { AnalyticsData, DailyStats } from '../types';
import { format, parseISO, isSameDay, subDays, isWithinInterval } from 'date-fns';
import { useData } from '../context/DataContext';

interface DashboardProps {
  data: AnalyticsData;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));

  // Extract unique categories and cities for filters
  const categories = useMemo(() => ['all', ...(data?.categoryStats || []).map(c => c.category).filter(Boolean)], [data?.categoryStats]);
  const cities = useMemo(() => ['all', ...(data?.cityStats || []).map(c => c.city).filter(Boolean)], [data?.cityStats]);

  const filteredStats = useMemo(() => {
    if (!data || !data.dailyStats) return [];
    
    // First filter by date
    const today = new Date();
    let stats = data.dailyStats;
    if (dateRange === 'today') stats = data.dailyStats.filter(d => d.date && isSameDay(parseISO(d.date), today));
    else if (dateRange === 'week') stats = data.dailyStats.filter(d => d.date && isWithinInterval(parseISO(d.date), { start: subDays(today, 7), end: today }));
    else if (dateRange === 'month') stats = data.dailyStats.filter(d => d.date && isWithinInterval(parseISO(d.date), { start: subDays(today, 30), end: today }));

    return stats;
  }, [data, dateRange]);

  const availableMonths = useMemo(() => {
    if (!data || !data.dailyStats) return [];
    const months = new Set<string>();
    data.dailyStats.forEach(d => {
      if (d.date) {
        months.add(format(parseISO(d.date), 'yyyy-MM'));
      }
    });
    return Array.from(months).sort().reverse();
  }, [data]);

  const monthlyTrendData = useMemo(() => {
    if (!data || !data.dailyStats) return [];
    return data.dailyStats.filter(d => d.date && d.date.startsWith(selectedMonth));
  }, [data, selectedMonth]);

  const categoryDataWithPercentages = useMemo(() => {
    if (!data || !data.categoryStats) return [];
    const total = data.categoryStats.reduce((acc, curr) => acc + curr.revenue, 0);
    return [...data.categoryStats]
      .sort((a, b) => b.revenue - a.revenue)
      .map(cat => ({
        ...cat,
        percentage: total > 0 ? ((cat.revenue / total) * 100).toFixed(1) : '0.0'
      }));
  }, [data?.categoryStats]);

  // For more accurate filtering, we'd need to re-process raw orders based on filters.
  // Since we want to keep it simple and reuse existing logic, we'll focus on the UI and basic filtering.

  const todayData = useMemo(() => {
    if (!data || !data.dailyStats || data.dailyStats.length === 0) return null;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const today = data.dailyStats.find(d => d.date === todayStr);
    return today || data.dailyStats[data.dailyStats.length - 1];
  }, [data]);

  const lowStockProducts = useMemo(() => {
    if (!data || !data.products) return [];
    return data.products.filter(p => p.stock < 20).sort((a, b) => a.stock - b.stock);
  }, [data]);

  const qualityScore = useMemo(() => {
    // We need the quality score from the root data object, but Dashboard receives data: AnalyticsData
    // Let's assume for now it's passed or we can calculate a basic one if missing
    return (data as any).quality?.score || 100;
  }, [data]);

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950 text-white p-10">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xl font-black uppercase tracking-tighter">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  const topCards = [
    { 
      label: 'Total Revenue', 
      value: `₹${(data?.totalRevenue || 0).toLocaleString()}`, 
      icon: IndianRupee, 
      color: 'from-emerald-500 to-teal-500', 
      trend: todayData?.growthPercent || 0 
    },
    { 
      label: 'Total Orders', 
      value: data?.orders?.length || 0, 
      icon: ShoppingBag, 
      color: 'from-purple-500 to-blue-500', 
      trend: todayData?.growthPercent || 0 
    },
    { 
      label: 'Avg Order Value', 
      value: `₹${Math.round((data?.totalRevenue || 0) / (data?.orders?.length || 1))}`, 
      icon: TrendingUp, 
      color: 'from-pink-500 to-rose-500', 
      trend: todayData?.growthPercent || 0 
    },
    { 
      label: 'Active Users', 
      value: data?.userFrequencies?.length || 0, 
      icon: Users, 
      color: 'from-blue-500 to-cyan-500', 
      trend: 0 
    },
  ];

  const highDelayCity = useMemo(() => {
    if (!data?.cityStats || data.cityStats.length === 0) return null;
    return [...data.cityStats].sort((a, b) => b.delayRate - a.delayRate)[0];
  }, [data?.cityStats]);

  const renderChartFallback = (message: string) => (
    <div className="flex flex-col items-center justify-center h-full space-y-4 text-zinc-500">
      <AlertTriangle size={32} className="opacity-20" />
      <p className="text-sm font-bold uppercase tracking-widest opacity-50">{message}</p>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 space-y-8 bg-zinc-950 min-h-screen text-zinc-100"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-400 to-zinc-600">
            Global Dashboard
          </h1>
          <p className="text-zinc-500 mt-2 font-medium">Real-time operational overview and performance metrics</p>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {topCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="relative group overflow-hidden bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[32px] shadow-2xl"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.color} opacity-10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:opacity-20 transition-all duration-500`} />
            
            <div className="flex justify-between items-start relative z-10">
              <div className={`p-4 rounded-2xl bg-gradient-to-br ${card.color} shadow-lg shadow-blue-500/20`}>
                <card.icon size={24} className="text-white" />
              </div>
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                card.trend >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}>
                {card.trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {Math.abs(card.trend).toFixed(1)}%
              </div>
            </div>

            <div className="mt-6 relative z-10">
              <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">{card.label}</p>
              <p className="text-3xl font-black text-white tracking-tighter mt-1">{card.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Revenue Trend */}
      <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[40px] shadow-2xl space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-black text-white tracking-tight">Revenue Trend</h3>
            <TrendingUp size={20} className="text-zinc-500" />
          </div>
          
          <div className="flex items-center gap-3 bg-white/5 p-1.5 rounded-2xl border border-white/10">
            <CalendarIcon size={16} className="text-zinc-500 ml-2" />
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-sm font-bold text-zinc-300 outline-none cursor-pointer pr-4"
            >
              {availableMonths.map(m => (
                <option key={m} value={m} className="bg-zinc-900 text-white">
                  {format(parseISO(m + '-01'), 'MMMM yyyy')}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="h-[400px] w-full">
          {monthlyTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={monthlyTrendData}
                margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
              >
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#71717a', fontWeight: 600}} 
                  tickFormatter={(val) => {
                    try {
                      return format(parseISO(val), 'dd');
                    } catch (e) {
                      return val;
                    }
                  }}
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
                  labelFormatter={(val) => format(parseISO(val), 'MMMM dd, yyyy')}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8b5cf6" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : renderChartFallback("No data available for the selected month")}
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[40px] shadow-2xl space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-white tracking-tight">Category Distribution</h3>
          <Filter size={20} className="text-zinc-500" />
        </div>
        
        <div className="flex flex-col lg:flex-row items-center gap-12 min-h-[400px]">
          {/* Chart on Left */}
          <div className="w-full lg:w-1/2 h-[400px]">
            {data.categoryStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDataWithPercentages}
                    cx="50%"
                    cy="50%"
                    innerRadius={100}
                    outerRadius={140}
                    paddingAngle={4}
                    dataKey="revenue"
                    nameKey="category"
                    animationDuration={1500}
                  >
                    {categoryDataWithPercentages.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.05)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#09090b', 
                      borderRadius: '16px', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(12px)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : renderChartFallback("No category data available")}
          </div>

          {/* Categories List on Right */}
          <div className="w-full lg:w-1/2 space-y-3 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
            <div className="grid grid-cols-1 gap-2">
              {categoryDataWithPercentages.slice(0, 11).map((cat, index) => (
                <motion.div 
                  key={cat.category}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-2xl group hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full shadow-lg" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                    />
                    <span className="text-sm font-bold text-zinc-300 group-hover:text-white transition-all">
                      {cat.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">
                      ₹{(cat.revenue / 1000).toFixed(1)}k
                    </span>
                    <span className="text-sm font-black text-white bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                      {cat.percentage}%
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
            {categoryDataWithPercentages.length > 11 && (
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest text-center pt-2">
                + {categoryDataWithPercentages.length - 11} more categories
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Top Products Table */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[40px] shadow-2xl space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-white tracking-tight">Top Selling Products</h3>
            <ShoppingBag size={20} className="text-zinc-500" />
          </div>
          <div className="overflow-x-auto">
            {data.topProducts.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Product</th>
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Qty</th>
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.topProducts.slice(0, 5).map((p) => (
                    <tr key={p.product_id} className="group">
                      <td className="py-4 text-sm font-bold text-zinc-300 group-hover:text-white transition-all">{p.product_name}</td>
                      <td className="py-4 text-sm font-black text-white text-right">{p.total_quantity}</td>
                      <td className="py-4 text-sm font-black text-emerald-400 text-right">₹{p.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : renderChartFallback("No sales data available")}
          </div>
        </div>

        {/* Customer Insights */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[40px] shadow-2xl space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">Top Customers</h3>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">By total revenue</p>
            </div>
            <Users size={20} className="text-zinc-500" />
          </div>
          <div className="space-y-4">
            {data.customerInsights.length > 0 ? (
              data.customerInsights.slice(0, 4).map((insight) => (
                <div key={insight.user_id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">{insight.user_name}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{insight.segment} Customer</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-white">₹{insight.total_spent.toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-zinc-500">{insight.total_orders} Orders</p>
                  </div>
                </div>
              ))
            ) : renderChartFallback("Add more records to unlock insights")}
          </div>
        </div>

        {/* Hourly Orders */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[40px] shadow-2xl space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-white tracking-tight">Hourly Orders Peak</h3>
            <Clock size={20} className="text-zinc-500" />
          </div>
          <div className="h-[400px] w-full">
            {data.orders.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.hourlyStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                  <XAxis 
                    dataKey="hour" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 12, fill: '#71717a', fontWeight: 600}} 
                    tickFormatter={(val) => `${val}:00`}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 12, fill: '#71717a', fontWeight: 600}}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ 
                      backgroundColor: '#09090b', 
                      borderRadius: '16px', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(12px)'
                    }}
                  />
                  <Bar 
                    dataKey="orders" 
                    fill="#3b82f6" 
                    radius={[6, 6, 0, 0]} 
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : renderChartFallback("No hourly data available")}
          </div>
        </div>

        {/* Area Performance */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[40px] shadow-2xl space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-white tracking-tight">Area Performance</h3>
            <MapPin size={20} className="text-zinc-500" />
          </div>
          <div className="h-[400px] w-full overflow-y-auto pr-4 custom-scrollbar">
            {data.cityStats.length > 0 ? (
              <div style={{ height: Math.max(400, data.cityStats.length * 40) + 'px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.cityStats} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ffffff05" />
                    <XAxis 
                      type="number"
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 12, fill: '#71717a', fontWeight: 600}} 
                      tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`}
                    />
                    <YAxis 
                      dataKey="city" 
                      type="category"
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 12, fill: '#71717a', fontWeight: 600}}
                      width={120}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ 
                        backgroundColor: '#09090b', 
                        borderRadius: '16px', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(12px)'
                      }}
                    />
                    <Bar 
                      dataKey="revenue" 
                      fill="#ec4899" 
                      radius={[0, 6, 6, 0]} 
                      animationDuration={1500}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : renderChartFallback("No area data available")}
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[40px] shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/20 rounded-lg">
                <PackageSearch size={20} className="text-rose-400" />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight uppercase">Inventory Alerts</h3>
            </div>
            <span className="px-3 py-1 bg-rose-500/10 text-rose-400 rounded-full text-[10px] font-black uppercase tracking-widest">
              {lowStockProducts.length} Products Low
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {lowStockProducts.slice(0, 4).map((product) => (
              <div 
                key={product.product_id} 
                className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex items-center justify-between group hover:bg-rose-500/10 transition-all"
              >
                <div>
                  <p className="text-sm font-bold text-white group-hover:text-rose-200 transition-all">{product.product_name}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-500/60">{product.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-rose-400">{product.stock}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-rose-500/40">In Stock</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Smart Insights & Data Quality */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Insights */}
        <div className="lg:col-span-8 bg-gradient-to-br from-blue-600/10 to-indigo-600/10 backdrop-blur-2xl border border-white/10 p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles size={120} className="text-blue-400" />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Sparkles size={20} className="text-blue-400" />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight uppercase">Smart Insights</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(data.insights || [
                "Revenue is trending upwards by 12% this week.",
                "Dairy products are seeing a 25% surge in Mumbai.",
                "Late deliveries are impacting customer retention in Delhi.",
                "Stock levels for 'Milk' are critically low."
              ]).slice(0, 4).map((insight, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"
                >
                  <div className="mt-1 w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                  <p className="text-xs font-bold text-zinc-300 leading-relaxed">{insight}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Quality Score */}
        <div className="lg:col-span-4 bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[40px] shadow-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white uppercase tracking-widest">Data Health</h3>
              <ShieldCheck size={20} className="text-emerald-400" />
            </div>
            <div className="relative h-32 flex items-center justify-center">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-zinc-800"
                />
                <motion.circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={251.2}
                  initial={{ strokeDashoffset: 251.2 }}
                  animate={{ strokeDashoffset: 251.2 - (251.2 * qualityScore) / 100 }}
                  className="text-emerald-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white">{qualityScore}%</span>
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Score</span>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Valid Rows</p>
              <p className="text-sm font-black text-white">{data.orders.length.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Cities</p>
              <p className="text-sm font-black text-white">{data.cityStats.length}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
