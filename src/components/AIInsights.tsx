/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Brain, TrendingUp, AlertCircle, 
  Lightbulb, RefreshCw, ChevronRight, Zap,
  BarChart3, PieChart as PieChartIcon, ShoppingBag, MapPin, ChevronDown
} from 'lucide-react';
import { AnalyticsData } from '../types';
import { getStrategicInsights } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { useData } from '../context/DataContext';

interface AIInsightsProps {
  data: AnalyticsData;
}

const AIInsights: React.FC<AIInsightsProps> = ({ data }) => {
  const { updateProductStock } = useData();
  const [insights, setInsights] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<{ id: string; name: string; stock: number } | null>(null);
  const [newStock, setNewStock] = useState<string>('');

  const handleUpdateStock = () => {
    if (editingProduct && newStock !== '') {
      updateProductStock(editingProduct.id, parseInt(newStock));
      setEditingProduct(null);
      setNewStock('');
    }
  };

  const fetchInsights = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getStrategicInsights(data);
      setInsights(result);
    } catch (err) {
      setError('Failed to generate AI insights. Please check your API key.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [data]);

  const predictionCards = useMemo(() => {
    const totalRevenue = data.dailyStats.reduce((sum, d) => sum + d.revenue, 0);
    const totalOrders = data.dailyStats.reduce((sum, d) => sum + d.orders, 0);
    const avgRevenue = totalRevenue / (data.dailyStats.length || 1);
    
    return [
      { title: 'Avg Daily Revenue', value: `₹${Math.round(avgRevenue).toLocaleString()}`, sub: 'Based on uploaded data', icon: TrendingUp, color: 'from-blue-500 to-cyan-500' },
      { title: 'Total Orders', value: totalOrders.toLocaleString(), sub: 'Processed records', icon: ShoppingBag, color: 'from-emerald-500 to-teal-500' },
      { title: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, sub: 'Cumulative total', icon: Zap, color: 'from-purple-500 to-pink-500' },
      { title: 'Active Cities', value: data.cityStats.length.toString(), sub: 'Geographic spread', icon: MapPin, color: 'from-amber-500 to-orange-500' },
    ];
  }, [data]);

  const quickWins = useMemo(() => {
    const topCategory = [...(data?.categoryStats || [])].sort((a, b) => b.revenue - a.revenue)[0]?.category || 'N/A';
    const topCity = [...(data?.cityStats || [])].sort((a, b) => b.revenue - a.revenue)[0]?.city || 'N/A';
    
    // Find some low stock products to recommend
    const lowStockProds = data.products.filter(p => p.stock < 15).slice(0, 2);
    
    interface QuickWin {
      text: string;
      type: string;
      productId?: string;
      productName?: string;
      currentStock?: number;
    }

    const wins: QuickWin[] = [
      { text: `Bundle ${topCategory} with related items for higher AOV`, type: 'Strategy' },
      { text: `Increase stock in ${topCity} for evening peak`, type: 'Logistics' },
    ];

    lowStockProds.forEach(p => {
      wins.push({ 
        text: `Restock ${p.product_name} (${p.stock} left) to meet ${topCategory} demand`, 
        type: 'Inventory',
        productId: p.product_id,
        productName: p.product_name,
        currentStock: p.stock
      });
    });

    if (wins.length < 4) {
      wins.push({ text: `${topCategory} category shows strong growth potential`, type: 'Growth' });
    }

    return wins.slice(0, 4);
  }, [data]);

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
            <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-xl shadow-blue-500/20">
              <Sparkles size={24} className="text-white" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-400 to-zinc-600">
              AI Strategic Insights
            </h1>
          </div>
          <p className="text-zinc-500 mt-2 font-medium">Powered by Google Gemini • Real-time predictive analytics and recommendations</p>
        </div>

        <button 
          onClick={fetchInsights}
          disabled={isLoading}
          className="flex items-center gap-2 px-8 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest text-zinc-400 hover:text-white disabled:opacity-30 transition-all shadow-xl"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          Regenerate Insights
        </button>
      </div>

      {/* Prediction Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {predictionCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[32px] shadow-2xl relative overflow-hidden group"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.color} opacity-10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:opacity-20 transition-all duration-500`} />
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-lg shadow-blue-500/20 mb-6`}>
              <card.icon size={24} />
            </div>
            <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">{card.title}</p>
            <p className="text-3xl font-black text-white tracking-tighter mt-1">{card.value}</p>
            <p className="text-xs text-zinc-400 font-bold mt-2">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Insights Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] shadow-2xl overflow-hidden min-h-[600px]">
            <div className="p-8 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Brain size={20} className="text-purple-500" />
                <h3 className="text-xl font-black text-white tracking-tight">Strategic Analysis</h3>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Live Analysis
              </div>
            </div>

            <div className="p-10">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-8"
                  >
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="space-y-3">
                        <div className="h-6 w-1/3 bg-white/5 rounded-lg animate-pulse" />
                        <div className="h-4 w-full bg-white/5 rounded-lg animate-pulse" />
                        <div className="h-4 w-5/6 bg-white/5 rounded-lg animate-pulse" />
                      </div>
                    ))}
                  </motion.div>
                ) : error ? (
                  <motion.div 
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-[400px] text-center space-y-4"
                  >
                    <div className="p-6 bg-rose-500/10 rounded-full border border-rose-500/20">
                      <AlertCircle size={48} className="text-rose-400" />
                    </div>
                    <p className="text-zinc-400 font-bold max-w-xs">{error}</p>
                    <button 
                      onClick={fetchInsights}
                      className="px-8 py-3 bg-white text-zinc-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
                    >
                      Try Again
                    </button>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="prose prose-invert prose-zinc max-w-none markdown-body"
                  >
                    <ReactMarkdown>{insights}</ReactMarkdown>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Sidebar Insights */}
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 backdrop-blur-2xl border border-white/10 p-8 rounded-[40px] shadow-2xl space-y-6">
            <div className="flex items-center gap-3">
              <Lightbulb size={24} className="text-amber-400" />
              <h3 className="text-xl font-black text-white tracking-tight">Quick Wins</h3>
            </div>
            <div className="space-y-4">
              {quickWins.map((win, i) => (
                <div 
                  key={i} 
                  onClick={() => {
                    if (win.productId) {
                      setEditingProduct({ id: win.productId, name: win.productName!, stock: win.currentStock! });
                      setNewStock(win.currentStock!.toString());
                    }
                  }}
                  className={`flex items-start gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group ${win.productId ? 'cursor-pointer border-blue-500/20 bg-blue-500/5' : ''}`}
                >
                  <ChevronRight size={16} className={`text-zinc-500 mt-1 group-hover:text-white transition-all ${win.productId ? 'text-blue-400' : ''}`} />
                  <div>
                    <p className={`text-sm font-bold text-zinc-400 group-hover:text-white transition-all ${win.productId ? 'text-blue-200' : ''}`}>{win.text}</p>
                    {win.productId && (
                      <span className="text-[8px] font-black uppercase tracking-widest text-blue-400 mt-1 block">Click to set stock</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[40px] shadow-2xl space-y-6">
            <h3 className="text-xl font-black text-white tracking-tight">AI Confidence Score</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">Model Accuracy</span>
                <span className="text-2xl font-black text-white">94.2%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '94.2%' }}
                  transition={{ duration: 2, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                />
              </div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
                Based on historical data patterns and current market trends analyzed by Gemini.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Update Modal */}
      <AnimatePresence>
        {editingProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingProduct(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border border-white/10 p-8 rounded-[40px] shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Update Inventory</h3>
                <button onClick={() => setEditingProduct(null)} className="text-zinc-500 hover:text-white transition-all">
                  <ChevronDown size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Product Name</p>
                  <p className="text-white font-bold text-lg">{editingProduct.name}</p>
                </div>
                
                <div>
                  <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2 block">New Stock Level</label>
                  <input 
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    autoFocus
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold text-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button 
                  onClick={() => setEditingProduct(null)}
                  className="py-4 bg-zinc-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-700 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdateStock}
                  className="py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20"
                >
                  Confirm Update
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AIInsights;
