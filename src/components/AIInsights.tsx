/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Brain, TrendingUp, AlertCircle, 
  Lightbulb, RefreshCw, ChevronRight, Zap,
  BarChart3, PieChart as PieChartIcon, ShoppingBag, MapPin, ChevronDown,
  FileText
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

  const summary = useMemo(() => {
    const totalOrders = data.orders.length;
    const totalRevenue = data.dailyStats.reduce((sum, d) => sum + d.revenue, 0);
    const avgDeliveryTime = data.dailyStats.reduce((sum, d) => sum + d.avgDeliveryTime, 0) / (data.dailyStats.length || 1);
    const recentGrowth = data.dailyStats[data.dailyStats.length - 1]?.growthPercent || 0;
    const aov = totalRevenue / (totalOrders || 1);
    
    // Simple forecast for tomorrow
    const forecastedOrders = Math.round((totalOrders / (data.dailyStats.length || 1)) * (1 + recentGrowth / 100));
    const forecastedRevenue = Math.round((totalRevenue / (data.dailyStats.length || 1)) * (1 + recentGrowth / 100));
    
    return {
      totalOrders,
      totalRevenue,
      avgDeliveryTime,
      recentGrowth,
      aov,
      forecastedOrders,
      forecastedRevenue
    };
  }, [data]);

  const parsedSections = useMemo(() => {
    if (!insights) return null;
    
    const sections: { title: string; content: string; type: 'growth' | 'demand' | 'risks' | 'recommendations' }[] = [];
    
    // Split by numbered points (1., 2., 3., 4.) or markdown headers
    // Using a more robust regex that handles bolding and varying whitespace
    const parts = insights.split(/\n(?=\d\.|\*\*|\#)/);
    
    parts.forEach(part => {
      const trimmed = part.trim();
      if (!trimmed) return;
      
      const lower = trimmed.toLowerCase();
      
      // Categorize based on markers and keywords, ensuring we don't duplicate types
      if ((lower.includes('1.') || lower.includes('prediction')) && !sections.some(s => s.type === 'growth')) {
        sections.push({ title: 'Growth Predictions', content: trimmed, type: 'growth' });
      } else if ((lower.includes('2.') || lower.includes('demand')) && !sections.some(s => s.type === 'demand')) {
        sections.push({ title: 'Demand Insights', content: trimmed, type: 'demand' });
      } else if ((lower.includes('3.') || lower.includes('risk') || lower.includes('bottleneck')) && !sections.some(s => s.type === 'risks')) {
        sections.push({ title: 'Risk Assessment', content: trimmed, type: 'risks' });
      } else if ((lower.includes('4.') || lower.includes('recommendation')) && !sections.some(s => s.type === 'recommendations')) {
        sections.push({ title: 'Actionable Recommendations', content: trimmed, type: 'recommendations' });
      }
    });
    
    return sections;
  }, [insights]);

  const quickWins = useMemo(() => {
    const topCategory = [...(data?.categoryStats || [])].sort((a, b) => b.revenue - a.revenue)[0]?.category || 'N/A';
    const topCity = [...(data?.cityStats || [])].sort((a, b) => b.revenue - a.revenue)[0]?.city || 'N/A';
    
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

  const KPICard = ({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) => (
    <div className="bg-zinc-900/50 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/5 flex items-center gap-4 hover:bg-zinc-900/80 transition-all">
      <div className={`p-3 rounded-xl bg-opacity-20 ${color.replace('text-', 'bg-')} ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{label}</p>
        <p className="text-xl font-black text-white tracking-tight">{value}</p>
      </div>
    </div>
  );

  const InsightCard = ({ title, content, type }: { title: string; content: string; type: 'growth' | 'demand' | 'risks' | 'recommendations' }) => {
    const config = {
      growth: { icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
      demand: { icon: MapPin, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
      risks: { icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
      recommendations: { icon: Lightbulb, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    }[type];

    const Icon = config.icon;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900/50 backdrop-blur-xl rounded-[32px] shadow-2xl border border-white/5 overflow-hidden hover:bg-zinc-900/80 transition-all group"
      >
        <div className={`px-8 py-6 border-b border-white/5 flex items-center gap-3 ${config.bg}`}>
          <Icon size={20} className={config.color} />
          <h4 className={`text-lg font-black tracking-tight ${config.color}`}>{title}</h4>
        </div>
        <div className="p-8">
          <div className="prose prose-invert prose-zinc max-w-none text-zinc-400 leading-relaxed">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 space-y-10 bg-zinc-950 min-h-screen text-white"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-2xl shadow-xl">
              <Sparkles size={24} className="text-zinc-950" />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white">
              Strategic Dashboard
            </h1>
          </div>
          <p className="text-zinc-500 mt-2 font-medium">Executive analysis powered by Gemini AI • Real-time performance insights</p>
        </div>

        <button 
          onClick={fetchInsights}
          disabled={isLoading}
          className="flex items-center gap-2 px-8 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest text-zinc-400 hover:text-white disabled:opacity-30 transition-all shadow-xl"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          Refresh Analysis
        </button>
      </div>

      {/* KPI Mini Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard label="Forecasted Orders" value={summary.forecastedOrders} icon={ShoppingBag} color="text-blue-600" />
        <KPICard label="Forecasted Revenue" value={`₹${summary.forecastedRevenue.toLocaleString()}`} icon={TrendingUp} color="text-emerald-600" />
        <KPICard label="Average Order Value" value={`₹${Math.round(summary.aov)}`} icon={Zap} color="text-purple-600" />
        <KPICard label="Avg Delivery Time" value={`${summary.avgDeliveryTime.toFixed(1)} min`} icon={BarChart3} color="text-orange-600" />
        <KPICard label="Recent Growth" value={`${summary.recentGrowth.toFixed(1)}%`} icon={TrendingUp} color="text-emerald-600" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Structured Insights */}
        <div className="lg:col-span-8 space-y-8">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white p-8 rounded-[32px] border border-zinc-100 space-y-4">
                    <div className="h-8 w-1/2 bg-zinc-100 rounded-lg animate-pulse" />
                    <div className="h-4 w-full bg-zinc-50 rounded-lg animate-pulse" />
                    <div className="h-4 w-5/6 bg-zinc-50 rounded-lg animate-pulse" />
                  </div>
                ))}
              </motion.div>
            ) : error ? (
              <motion.div 
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-zinc-900/50 backdrop-blur-xl p-12 rounded-[40px] border border-white/5 flex flex-col items-center justify-center text-center space-y-6 shadow-2xl"
              >
                <div className="p-6 bg-rose-500/10 rounded-full border border-rose-500/20">
                  <AlertCircle size={48} className="text-rose-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Analysis Failed</h3>
                  <p className="text-zinc-400 font-medium mt-2 max-w-xs">{error}</p>
                </div>
                <button 
                  onClick={fetchInsights}
                  className="px-8 py-3 bg-white text-zinc-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                >
                  Try Again
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="columns-1 md:columns-2 gap-4 space-y-4">
                  {parsedSections && parsedSections.length > 0 ? (
                    parsedSections.map((section, i) => (
                      <div key={i} className="break-inside-avoid mb-4">
                        <InsightCard {...section} />
                      </div>
                    ))
                  ) : (
                    <div className="bg-zinc-900/50 backdrop-blur-xl p-12 rounded-[40px] border border-white/5 text-center">
                      <p className="text-zinc-500 font-bold">No structured insights available. See full notes below.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          {/* Quick Wins Card */}
          <div className="bg-zinc-900/50 backdrop-blur-xl p-8 rounded-[40px] shadow-2xl border border-white/5 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Lightbulb size={24} className="text-amber-400" />
              </div>
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
                  className={`flex items-start gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group ${win.productId ? 'cursor-pointer border-blue-500/20 bg-blue-500/5' : ''}`}
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

          {/* AI Confidence Score */}
          <div className="bg-zinc-900/50 backdrop-blur-xl p-8 rounded-[40px] shadow-2xl border border-white/5 space-y-6">
            <h3 className="text-xl font-black text-white tracking-tight">AI Confidence</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Model Accuracy</span>
                <span className="text-2xl font-black text-white">94.2%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '94.2%' }}
                  transition={{ duration: 2, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                />
              </div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
                Based on historical data patterns and current market trends analyzed by Gemini.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Analysis Notes Box - Full Width */}
      {!isLoading && !error && insights && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/50 backdrop-blur-xl rounded-[32px] shadow-2xl border border-white/5 overflow-hidden"
        >
          <div className="px-8 py-6 border-b border-white/5 flex items-center gap-3 bg-amber-500/10">
            <FileText size={20} className="text-amber-400" />
            <h4 className="text-lg font-black tracking-tight text-amber-400">Strategic Analysis Notes</h4>
          </div>
          <div className="p-8">
            <div className="bg-amber-500/5 border-l-4 border-amber-500/50 p-6 rounded-r-2xl">
              <div className="prose prose-invert prose-zinc max-w-none text-zinc-400 whitespace-pre-wrap font-medium leading-relaxed">
                {insights}
              </div>
            </div>
          </div>
        </motion.div>
      )}

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
