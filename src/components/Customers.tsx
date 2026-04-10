/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Download, Users, 
  ShoppingBag, IndianRupee, MapPin, 
  Calendar, ArrowUpRight, ArrowDownRight,
  User as UserIcon, Tag, ChevronLeft, ChevronRight
} from 'lucide-react';
import { AnalyticsData, JoinedOrder } from '../types';
import * as XLSX from 'xlsx';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { safeParseDate } from '../utils/dataProcessor';

interface CustomersProps {
  data: AnalyticsData;
}

const Customers: React.FC<CustomersProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const cities = useMemo(() => ['All', ...Array.from(new Set((data?.users || []).map(u => u.city).filter(Boolean)))], [data?.users]);
  const categories = useMemo(() => ['All', ...Array.from(new Set((data?.products || []).map(p => p.category).filter(Boolean)))], [data?.products]);

  const filteredOrders = useMemo(() => {
    if (!data?.orders) return [];
    return data.orders.filter(order => {
      const matchesSearch = (order.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (order.product_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCity = selectedCity === 'All' || order.city === selectedCity;
      const matchesCategory = selectedCategory === 'All' || order.category === selectedCategory;
      return matchesSearch && matchesCity && matchesCategory;
    });
  }, [data?.orders, searchTerm, selectedCity, selectedCategory]);

  const customerStats = useMemo(() => {
    const totalCustomers = data?.users?.length || 0;
    const activeCustomers = new Set((data?.orders || []).map(o => o.user_id)).size;
    
    const spenderMap = new Map<string, { name: string; total: number; orders: number }>();
    (data?.orders || []).forEach(o => {
      const current = spenderMap.get(o.user_id) || { name: o.user_name || 'Unknown', total: 0, orders: 0 };
      spenderMap.set(o.user_id, {
        name: o.user_name || 'Unknown',
        total: current.total + (o.revenue || 0),
        orders: current.orders + 1
      });
    });

    const topSpender = Array.from(spenderMap.values()).sort((a, b) => b.total - a.total)[0] || { name: 'N/A', total: 0 };
    const repeatCustomers = Array.from(spenderMap.values()).filter(s => s.orders > 1).length;

    return {
      totalCustomers,
      activeCustomers,
      topSpender,
      repeatCustomers
    };
  }, [data.users, data.orders]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const exportToExcel = () => {
    const exportData = filteredOrders.map(o => ({
      user_name: o.user_name,
      product_name: o.product_name,
      quantity: o.quantity,
      total: o.revenue,
      date: format(safeParseDate(o.order_date), 'yyyy-MM-dd HH:mm'),
      city: o.city
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, "Minute_Metrics_Customer_Orders.xlsx");
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
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-400 to-zinc-600">
            Customer Analytics
          </h1>
          <p className="text-zinc-500 mt-2 font-medium">Deep dive into customer behavior and order history</p>
        </div>

        <button 
          onClick={exportToExcel}
          className="flex items-center gap-2 px-8 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest text-zinc-400 hover:text-white transition-all shadow-xl"
        >
          <Download size={18} />
          Export Excel
        </button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Customers', value: customerStats.totalCustomers, icon: Users, color: 'from-blue-500 to-cyan-500' },
          { label: 'Active Customers', value: customerStats.activeCustomers, icon: UserIcon, color: 'from-purple-500 to-pink-500' },
          { label: 'Top Spender', value: `₹${(customerStats.topSpender.total / 1000).toFixed(1)}k`, icon: IndianRupee, color: 'from-amber-500 to-orange-500', sub: customerStats.topSpender.name },
          { label: 'Repeat Customers', value: customerStats.repeatCustomers, icon: ShoppingBag, color: 'from-emerald-500 to-teal-500' },
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
            {card.sub && <p className="text-xs text-zinc-400 font-bold mt-2 truncate">{card.sub}</p>}
          </motion.div>
        ))}
      </div>

      {/* Filters & Table */}
      <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-white/10 space-y-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                type="text" 
                placeholder="Search customer or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2">
                <MapPin size={18} className="text-zinc-500" />
                <select 
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="bg-transparent text-sm font-bold text-zinc-300 focus:outline-none appearance-none cursor-pointer"
                >
                  {cities.map(city => <option key={city} value={city} className="bg-zinc-900">{city}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2">
                <Tag size={18} className="text-zinc-500" />
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent text-sm font-bold text-zinc-300 focus:outline-none appearance-none cursor-pointer"
                >
                  {categories.map(cat => <option key={cat} value={cat} className="bg-zinc-900">{cat}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                {['User', 'Product', 'Category', 'Qty', 'Price', 'Total', 'Date', 'City'].map(head => (
                  <th key={head} className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {paginatedOrders.length > 0 ? (
                  paginatedOrders.map((order, i) => (
                    <motion.tr 
                      key={order.order_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-all group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-black text-xs">
                            {(order.user_name || 'U')[0]}
                          </div>
                          <span className="font-bold text-white text-sm">{order.user_name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm font-medium text-zinc-300">{order.product_name}</td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                          {order.category}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-sm font-black text-white">{order.quantity}</td>
                      <td className="px-8 py-6 text-sm font-bold text-zinc-400">₹{order.price}</td>
                      <td className="px-8 py-6 text-sm font-black text-emerald-400">₹{order.revenue}</td>
                      <td className="px-8 py-6 text-sm font-medium text-zinc-500">{format(safeParseDate(order.order_date), 'MMM dd, HH:mm')}</td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <MapPin size={14} className="text-zinc-600" />
                          <span className="text-sm font-bold">{order.city}</span>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 text-zinc-500">
                        <ShoppingBag size={48} className="opacity-20" />
                        <p className="text-sm font-bold uppercase tracking-widest opacity-50">No orders found matching your criteria</p>
                      </div>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-8 flex items-center justify-between border-t border-white/10">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
            Showing <span className="text-white">{paginatedOrders.length}</span> of <span className="text-white">{filteredOrders.length}</span> orders
          </p>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-3 bg-white/5 border border-white/10 rounded-xl text-zinc-400 hover:text-white disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white">{currentPage}</span>
              <span className="text-zinc-600">/</span>
              <span className="text-sm font-bold text-zinc-500">{totalPages}</span>
            </div>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-3 bg-white/5 border border-white/10 rounded-xl text-zinc-400 hover:text-white disabled:opacity-30 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Customers;
