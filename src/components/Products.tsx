/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Plus, Download, Package, 
  TrendingUp, IndianRupee, ShoppingBag, X, 
  Image as ImageIcon, Trash2, Edit3, ArrowUpRight,
  Lightbulb, Zap, ChevronDown
} from 'lucide-react';
import { AnalyticsData, Product } from '../types';
import * as XLSX from 'xlsx';
import { useData } from '../context/DataContext';

interface ProductsProps {
  data: AnalyticsData;
  onAddProduct: (product: Product) => void;
}

const PRODUCT_IMAGES: Record<string, string> = {
  "Pet Treats": "https://images.unsplash.com/photo-1583511655826-05700d52f4d9?auto=format&fit=crop&w=400&q=60",
  "Orange Juice": "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=400&q=60",
  "Eggs": "https://images.unsplash.com/photo-1518569656558-1f25e69d93d7?auto=format&fit=crop&w=400&q=60",
  "Nuts": "https://images.unsplash.com/photo-1536510233921-8e5043fce771?auto=format&fit=crop&w=400&q=60",
  "Mango Drink": "https://images.unsplash.com/photo-1622597467836-f3285f2131b5?auto=format&fit=crop&w=400&q=60",
  "Vitamins": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=60",
  "Bread": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=60",
  "Lotion": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=400&q=60",
  "Shampoo": "https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=400&q=60",
  "Popcorn": "https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=400&q=60",
  "Rice": "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=60",
  "Detergent": "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=400&q=60",
  "Frozen Pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=60",
  "Cough Syrup": "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=400&q=60",
  "Potatoes": "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&q=60",
  "Cheese": "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=400&q=60",
  "Butter": "https://images.unsplash.com/photo-1589985270958-b8c1f4f0a9f5?auto=format&fit=crop&w=400&q=60",
  "Wheat Flour": "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&w=400&q=60",
  "Toothpaste": "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=400&q=60",
  "Curd": "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=400&q=60",
  "Iced Tea": "https://images.unsplash.com/photo-1499638673689-79a0b5115d87?auto=format&fit=crop&w=400&q=60",
  "Pulses": "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=400&q=60",
  "Toilet Cleaner": "https://images.unsplash.com/photo-1584622781564-1d9876a13d00?auto=format&fit=crop&w=400&q=60",
  "Dish Soap": "https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=400&q=60",
  "Baby Food": "https://images.unsplash.com/photo-1596265307520-8e9d01d6ca68?auto=format&fit=crop&w=400&q=60",
  "Pain Reliever": "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=400&q=60",
  "Baby Wipes": "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=400&q=60",
  "Diapers": "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=400&q=60",
  "Soap": "https://images.unsplash.com/photo-1607006483225-7b3d7f4d7d22?auto=format&fit=crop&w=400&q=60",
  "Biscuits": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=60",
  "Tomatoes": "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=400&q=60",
  "Mangoes": "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=400&q=60",
  "Salt": "https://images.unsplash.com/photo-1518110925495-5fe2fda0442e?auto=format&fit=crop&w=400&q=60",
  "Ice Cream": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=400&q=60",
  "Cereal": "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=400&q=60",
  "Sugar": "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=400&q=60",
  "Onions": "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&q=60",
  "Cookies": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=400&q=60",
  "Bananas": "https://images.unsplash.com/photo-1574226516831-e1dff420e37f?auto=format&fit=crop&w=400&q=60",
  "Cola": "https://images.unsplash.com/photo-1581636625402-29b2a704ef13?auto=format&fit=crop&w=400&q=60",
  "Frozen Biryani": "https://images.unsplash.com/photo-1563379091339-03246963d29d?auto=format&fit=crop&w=400&q=60",
  "Carrots": "https://images.unsplash.com/photo-1447175008436-054170c2e979?auto=format&fit=crop&w=400&q=60",
  "Spinach": "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=400&q=60",
  "Cat Food": "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=400&q=60",
  "Dog Food": "https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?auto=format&fit=crop&w=400&q=60",
  "Milk": "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=60",
  "Instant Noodles": "https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=400&q=60",
  "Chips": "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=60",
  "Frozen Vegetables": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=60",
  "Chocolates": "https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=400&q=60",
  "Lemonade": "https://images.unsplash.com/photo-1523371054106-bbf80586c38c?auto=format&fit=crop&w=400&q=60"
};

const getProductImage = (name: string) => {
  const normalized = name.trim();
  return PRODUCT_IMAGES[normalized] || `https://source.unsplash.com/featured/?${encodeURIComponent(normalized)},grocery,product`;
};

const Products: React.FC<ProductsProps> = ({ data, onAddProduct }) => {
  const { updateProductStock } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<{ id: string; name: string; stock: number } | null>(null);
  const [newStock, setNewStock] = useState<string>('');
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    product_name: '',
    category: 'Milk & Dairy',
    price: 0,
    stock: 0
  });

  const productStats = useMemo(() => {
    const stats = new Map<string, { units: number; revenue: number }>();
    (data?.orders || []).forEach(order => {
      const current = stats.get(order.product_id) || { units: 0, revenue: 0 };
      stats.set(order.product_id, {
        units: current.units + (order.quantity || 0),
        revenue: current.revenue + (order.revenue || 0)
      });
    });
    return stats;
  }, [data?.orders]);

  const filteredProducts = useMemo(() => {
    return (data?.products || []).filter(p => {
      const matchesSearch = (p.product_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [data?.products, searchTerm, selectedCategory]);

  const categories = useMemo(() => ['All', ...Array.from(new Set((data?.products || []).map(p => p.category).filter(Boolean)))], [data?.products]);

  const recommendations = useMemo(() => {
    const products = data?.products || [];
    const lowStock = products
      .filter(p => p.stock < 30)
      .map(p => ({ ...p, reason: 'Low Stock', priority: 'high' }));
    
    const highDemand = products
      .filter(p => (productStats.get(p.product_id)?.units || 0) > 100)
      .map(p => ({ ...p, reason: 'High Demand', priority: 'medium' }));

    return [...lowStock, ...highDemand].slice(0, 5);
  }, [data?.products, productStats]);

  const exportToExcel = () => {
    const exportData = filteredProducts.map(p => ({
      product_name: p.product_name,
      price: p.price,
      id: p.product_id,
      units_sold: productStats.get(p.product_id)?.units || 0,
      revenue: productStats.get(p.product_id)?.revenue || 0
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "Blinkit_Products_Analytics.xlsx");
  };

  const handleAddProduct = () => {
    if (newProduct.product_name && newProduct.price && newProduct.stock) {
      onAddProduct({
        ...newProduct as Product,
        product_id: `p${data.products.length + 1}`,
        image: getProductImage(newProduct.product_name!)
      });
      setIsModalOpen(false);
      setNewProduct({ product_name: '', category: 'Milk & Dairy', price: 0, stock: 0 });
    }
  };

  const handleUpdateStock = () => {
    if (editingProduct && newStock !== '') {
      updateProductStock(editingProduct.id, parseInt(newStock));
      setEditingProduct(null);
      setNewStock('');
    }
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
            Product Management
          </h1>
          <p className="text-zinc-500 mt-2 font-medium">Manage catalog, track inventory, and analyze performance</p>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl font-bold text-zinc-400 hover:text-white transition-all"
          >
            <Download size={18} />
            Export Excel
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-blue-500/20"
          >
            <Plus size={18} />
            Add Product
          </button>
        </div>
      </div>

      {/* Smart Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Lightbulb size={20} className="text-amber-500" />
            <h3 className="text-lg font-black text-white tracking-tight uppercase tracking-widest text-xs">Smart Recommendations</h3>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
            {recommendations.map((rec, i) => (
              <motion.div
                key={`${rec.product_id}-${i}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex-shrink-0 w-80 bg-white/5 backdrop-blur-2xl border border-white/10 p-6 rounded-[32px] flex flex-col gap-4 group hover:bg-white/10 transition-all cursor-pointer"
                onClick={() => {
                  setEditingProduct({ id: rec.product_id, name: rec.product_name, stock: rec.stock });
                  setNewStock(rec.stock.toString());
                }}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${rec.priority === 'high' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    <Package size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold text-sm line-clamp-1">{rec.product_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${rec.priority === 'high' ? 'text-rose-400' : 'text-blue-400'}`}>
                        {rec.reason}
                      </span>
                      <span className="text-zinc-500 text-[10px] font-bold">• Stock: {rec.stock}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Action Required</span>
                  <button className={`px-4 py-2 bg-${rec.priority === 'high' ? 'rose' : 'blue'}-500 text-zinc-950 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all`}>
                    Set Stock
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-6 bg-white/5 backdrop-blur-2xl border border-white/10 p-6 rounded-[32px] shadow-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="Search by product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                selectedCategory === cat 
                  ? 'bg-white text-zinc-950 shadow-xl scale-105' 
                  : 'bg-white/5 text-zinc-500 hover:text-zinc-200 hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredProducts.map((product, i) => {
            const stats = productStats.get(product.product_id) || { units: 0, revenue: 0 };
            return (
              <motion.div
                key={product.product_id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -5 }}
                className="group relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] overflow-hidden shadow-2xl cursor-pointer"
                onClick={() => {
                  setEditingProduct({ id: product.product_id, name: product.product_name, stock: product.stock });
                  setNewStock(product.stock.toString());
                }}
              >
                <div className="h-48 relative overflow-hidden">
                  <img
                    src={getProductImage(product.product_name)}
                    alt={product.product_name}
                    className="w-full h-full object-cover bg-white transition-all duration-700 group-hover:scale-125"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button className="p-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl text-white hover:bg-white/20 transition-all">
                      <Edit3 size={16} />
                    </button>
                    <button className="p-2 bg-rose-500/10 backdrop-blur-md border border-rose-500/20 rounded-xl text-rose-400 hover:bg-rose-500/20 transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <span className="px-3 py-1 bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-blue-500/20">
                      {product.category}
                    </span>
                  </div>
                </div>

                <div className="p-8 space-y-6">
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight line-clamp-1">{product.product_name}</h3>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">ID: {product.product_id}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Price</p>
                      <p className="text-lg font-black text-white">₹{product.price}</p>
                    </div>
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Stock</p>
                      <p className={`text-lg font-black ${product.stock < 50 ? 'text-rose-400' : 'text-emerald-400'}`}>{product.stock}</p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/10 grid grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-zinc-500">
                        <ShoppingBag size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Units Sold</span>
                      </div>
                      <p className="text-xl font-black text-white">{stats.units}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-zinc-500">
                        <IndianRupee size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Revenue</span>
                      </div>
                      <p className="text-xl font-black text-white">₹{(stats.revenue / 1000).toFixed(1)}k</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Add Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-zinc-900 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-10 space-y-8">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-black text-white tracking-tight">Add New Product</h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 text-zinc-500 hover:text-white transition-all">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">Product Name</label>
                    <input 
                      type="text" 
                      value={newProduct.product_name}
                      onChange={(e) => setNewProduct({...newProduct, product_name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      placeholder="Enter product name..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">Category</label>
                      <select 
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
                      >
                        {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">Price (₹)</label>
                      <input 
                        type="number" 
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">Initial Stock</label>
                    <input 
                      type="number" 
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({...newProduct, stock: Number(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-white/5 text-zinc-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddProduct}
                    className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-blue-500/20"
                  >
                    Save Product
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

export default Products;
