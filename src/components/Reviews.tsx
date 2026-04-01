/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, Search, Filter, MessageSquare, 
  ThumbsUp, ThumbsDown, User, Calendar,
  TrendingUp, Smile, Frown, Meh
} from 'lucide-react';
import { AnalyticsData } from '../types';

interface ReviewsProps {
  data: AnalyticsData;
}

const Reviews: React.FC<ReviewsProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRating, setSelectedRating] = useState<number | 'All'>('All');

  const mockReviews = useMemo(() => {
    return data.orders.slice(0, 50).map((order, i) => ({
      id: `r${i}`,
      userName: order.user_name,
      productName: order.product_name,
      rating: Math.floor(Math.random() * 3) + 3, // 3-5 stars
      comment: [
        "Great quality and fast delivery!",
        "The milk was fresh, very happy.",
        "A bit late but the product is good.",
        "Always reliable, best service.",
        "Packaging could be better, but product is fine."
      ][Math.floor(Math.random() * 5)],
      date: order.order_date,
      sentiment: ['positive', 'neutral', 'positive'][Math.floor(Math.random() * 3)]
    }));
  }, [data.orders]);

  const filteredReviews = useMemo(() => {
    return mockReviews.filter(r => {
      const matchesSearch = r.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           r.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           r.comment.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRating = selectedRating === 'All' || r.rating === selectedRating;
      return matchesSearch && matchesRating;
    });
  }, [mockReviews, searchTerm, selectedRating]);

  const stats = useMemo(() => {
    const avgRating = mockReviews.reduce((acc, curr) => acc + curr.rating, 0) / mockReviews.length;
    const totalReviews = mockReviews.length;
    const positivePercent = (mockReviews.filter(r => r.sentiment === 'positive').length / totalReviews) * 100;
    
    return { avgRating, totalReviews, positivePercent };
  }, [mockReviews]);

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
            Customer Feedback
          </h1>
          <p className="text-zinc-500 mt-2 font-medium">Sentiment analysis and product reviews from your customers</p>
        </div>

        <div className="flex items-center gap-4 px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
          <TrendingUp size={18} className="text-emerald-400" />
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">94% Positive Sentiment</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Average Rating', value: stats.avgRating.toFixed(1), icon: Star, color: 'from-amber-500 to-orange-500', sub: 'Out of 5.0' },
          { label: 'Total Reviews', value: stats.totalReviews, icon: MessageSquare, color: 'from-blue-500 to-cyan-500', sub: 'Last 30 Days' },
          { label: 'Positive Sentiment', value: `${Math.round(stats.positivePercent)}%`, icon: Smile, color: 'from-emerald-500 to-teal-500', sub: 'AI Analyzed' },
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

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-6 bg-white/5 backdrop-blur-2xl border border-white/10 p-6 rounded-[32px] shadow-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="Search reviews, products or users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          {['All', 5, 4, 3].map(rating => (
            <button
              key={rating}
              onClick={() => setSelectedRating(rating as any)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                selectedRating === rating 
                  ? 'bg-white text-zinc-950 shadow-xl scale-105' 
                  : 'bg-white/5 text-zinc-500 hover:text-zinc-200 hover:bg-white/10'
              }`}
            >
              {rating === 'All' ? 'All Ratings' : <><Star size={14} fill={selectedRating === rating ? 'currentColor' : 'none'} /> {rating}</>}
            </button>
          ))}
        </div>
      </div>

      {/* Review List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredReviews.map((review, i) => (
            <motion.div
              key={review.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[32px] shadow-2xl space-y-6 group hover:bg-white/10 transition-all"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-white font-black text-lg border border-white/10">
                    {review.userName[0]}
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white tracking-tight">{review.userName}</h4>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">Ordered: {review.productName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={14} 
                      className={i < review.rating ? 'text-amber-400' : 'text-zinc-800'} 
                      fill={i < review.rating ? 'currentColor' : 'none'} 
                    />
                  ))}
                </div>
              </div>

              <p className="text-zinc-300 font-medium leading-relaxed italic">"{review.comment}"</p>

              <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    review.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-400'
                  }`}>
                    {review.sentiment === 'positive' ? <Smile size={12} /> : <Meh size={12} />}
                    {review.sentiment}
                  </div>
                  <div className="flex items-center gap-2 text-zinc-600">
                    <Calendar size={12} />
                    <span className="text-[10px] font-black uppercase tracking-widest">2h ago</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button className="text-zinc-600 hover:text-emerald-400 transition-all"><ThumbsUp size={16} /></button>
                  <button className="text-zinc-600 hover:text-rose-400 transition-all"><ThumbsDown size={16} /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Reviews;
