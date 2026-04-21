/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileText, CheckCircle2, AlertCircle, 
  Download, Trash2, FileSpreadsheet, Info,
  ChevronRight, ArrowRight, ShieldCheck, Database,
  Loader2, Zap
} from 'lucide-react';
import Papa from 'papaparse';

import { useData } from '../context/DataContext';

const DataUpload: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { resetData, lastUploadTime, recordCounts, updateMasterData, data, dataMode, staticData } = useData();

  const validateMasterData = (data: any[]): string | null => {
    if (data.length === 0) return 'The uploaded file is empty.';

    const firstRow = data[0];
    const headers = Object.keys(firstRow).map(h => h.toLowerCase().trim());

    const required = [
      'order_id', 'user_id', 'user_name', 'city', 'email', 
      'product_id', 'product_name', 'category', 'price', 
      'quantity', 'stock', 'order_date'
    ];
    
    const missing = required.filter(h => !headers.includes(h));
    if (missing.length > 0) {
      return `Invalid Master CSV format. Required columns missing: ${missing.join(', ')}`;
    }

    return null;
  };

  const handleBulkSync = async () => {
    // We always sync the Static (CSV) data to Supabase
    if (!staticData || !staticData.stats || !staticData.stats.orders.length) {
      setStatus({ type: 'error', message: 'No CSV data loaded to sync. Please upload a file in Static Mode first.' });
      return;
    }

    setSyncing(true);
    setStatus(null);

    const dataToSync = staticData.stats;

    try {
      const { supabase } = await import('../lib/supabase');
      
      // 1. Prepare Products (Unique)
      const uniqueProductsMap = new Map();
      dataToSync.products.forEach((p: any) => {
        uniqueProductsMap.set(p.product_id, {
          product_id: p.product_id,
          product_name: p.product_name,
          category: p.category,
          price: p.price,
          stock: p.stock
        });
      });
      const productsToSync = Array.from(uniqueProductsMap.values());

      // 2. Prepare Orders
      const ordersToSync = dataToSync.orders.map((o: any) => ({
        order_id: o.order_id,
        user_id: o.user_id,
        product_id: o.product_id,
        quantity: o.quantity,
        revenue: o.revenue,
        city: o.city,
        order_date: o.order_date,
        delivery_time_mins: o.delivery_time_mins,
        item_rating: (o as any).rating || (o as any).item_rating || 5, // Fallback
        metadata: o.raw || {} // Preserve all 47 columns
      }));

      // 3. Batch Insert Products
      const { error: pError } = await supabase.from('products').upsert(productsToSync, { onConflict: 'product_id' });
      if (pError) throw pError;

      // 4. Batch Sync Orders (Delete existing then Insert new to handle duplicates correctly)
      // This ensures the live database matches the uploaded CSV exactly
      const { error: delError } = await supabase.from('orders').delete().neq('order_id', '_FORCE_CLEAR_');
      if (delError) throw delError;

      const chunkSize = 100;
      for (let i = 0; i < ordersToSync.length; i += chunkSize) {
        const chunk = ordersToSync.slice(i, i + chunkSize);
        const { error: oError } = await supabase.from('orders').insert(chunk);
        if (oError) {
          console.error('Batch error:', oError);
          throw new Error(`Sync failed at row ${i}. Error: ${oError.message}. IMPORTANT: Make sure your "orders" table has the "metadata" column.`);
        }
      }

      setStatus({ type: 'success', message: `Database Synchronized! ${productsToSync.length} products and ${ordersToSync.length} orders saved to Supabase.` });
    } catch (err: any) {
      console.error('Sync error:', err);
      setStatus({ type: 'error', message: `Sync Failed: ${err.message || 'Unknown error'}` });
    } finally {
      setSyncing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setStatus(null);

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setStatus({ type: 'error', message: `Error parsing CSV: ${results.errors[0].message}` });
        } else {
          const validationError = validateMasterData(results.data);
          if (validationError) {
            setStatus({ type: 'error', message: validationError });
          } else {
            updateMasterData(results.data);
            setStatus({ type: 'success', message: `Successfully uploaded ${results.data.length} master records!` });
          }
        }
        setUploading(false);
        e.target.value = '';
      },
      error: (error) => {
        setStatus({ type: 'error', message: `Failed to read file: ${error.message}` });
        setUploading(false);
      }
    });
  };

  const downloadTemplate = () => {
    // Exact 47-column structure from Blinkit Master Dataset
    const headers = [
      'order_id', 'user_id', 'user_name', 'city', 'email', 'product_id', 'product_name', 'category', 'price', 'quantity', 'stock', 'order_date',
      'actual_delivery_time', 'promised_delivery_time', 'delivery_time_mins', 'rating', 'payment_method', 'store_id', 'store_name', 'store_type', 
      'item_weight', 'item_fat_content', 'item_visibility', 'item_type', 'item_mrp', 'outlet_identifier', 'outlet_establishment_year', 'outlet_size', 
      'outlet_location_type', 'outlet_type', 'total_discount', 'coupon_code', 'delivery_fee', 'tax_amount', 'referral_id', 'platform', 'device_type',
      'longitude', 'latitude', 'brand_name', 'is_seasonal', 'is_organic', 'shelf_life_days', 'storage_condition', 'packaging_type', 'return_status', 'is_active'
    ];
    
    const row = [
      'ORD_B_001', 'USR_99', 'Hammad Sunasra', 'Mumbai', 'hammad@example.com', 'PROD_M_01', 'Amul Gold Milk 1L', 'Milk & Dairy', '66', '2', '450', '2026-03-24T18:45:00',
      '2026-03-24T18:57:00', '2026-03-24T18:55:00', '12', '5', 'UPI', 'ST_09', 'Blinkit Mumbai Central', 'Grocery', '1kg', 'Full Cream', '0.012', 'Milk', '68', 'OUT_101', '2015', 'Large', 
      'Tier 1', 'Main Hub', '2.00', 'NO_COUPON', '15.00', '3.50', 'REF_001', 'Android', 'Mobile', '18.9750', '72.8258', 'Amul', 'No', 'Yes', '2', 'Refrigerated', 'Pouch', 'Delivered', 'True'
    ];

    const csv = [headers.join(','), row.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `blinkit_master_complete_47_cols.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
            Master Data Sync
          </h1>
          <p className="text-zinc-500 mt-2 font-medium">Single source of truth for your Minute Metrics analytics</p>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={resetData}
            className="px-6 py-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-500/20 transition-all flex items-center gap-2"
          >
            <Trash2 size={16} /> Reset Data
          </button>
          <div className="flex items-center gap-4 px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
            <Info size={18} className="text-blue-400" />
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Master CSV Format Only</p>
          </div>
        </div>
      </div>

      {/* Status Message */}
      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-6 rounded-[32px] border flex items-center gap-4 shadow-2xl ${
              status.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          >
            {status.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
            <span className="font-bold text-sm">{status.message}</span>
            <button onClick={() => setStatus(null)} className="ml-auto p-2 hover:bg-white/5 rounded-xl transition-all">
              <Trash2 size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Upload Area */}
        <div className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[40px] shadow-2xl space-y-8 relative overflow-hidden group h-full"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500 to-purple-500 opacity-5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:opacity-10 transition-all duration-500" />
            
            <div className="flex justify-between items-start relative z-10">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
                <Database size={24} className="text-white" />
              </div>
              <button 
                onClick={downloadTemplate}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-zinc-400 hover:text-white transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
              >
                <Download size={16} /> Template
              </button>
            </div>

            <div className="relative z-10">
              <h3 className="text-3xl font-black text-white tracking-tight">Upload Master CSV</h3>
              <p className="text-zinc-500 text-sm font-medium mt-2 leading-relaxed">
                Upload your unified dataset containing orders, users, and products. 
                The system will automatically clean and transform the data.
              </p>
            </div>

            <div className="relative z-10">
              <label className="block w-full">
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <div className={`w-full py-20 border-2 border-dashed border-white/10 rounded-[40px] flex flex-col items-center justify-center gap-6 cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group/upload ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="p-6 bg-white/5 rounded-full group-hover/upload:scale-110 group-hover/upload:bg-blue-500/10 transition-all">
                    <Upload size={32} className="text-zinc-500 group-hover/upload:text-blue-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-black text-white uppercase tracking-widest">
                      {uploading ? 'Processing Data...' : 'Drop Master CSV Here'}
                    </p>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-2">or click to browse files</p>
                  </div>
                </div>
              </label>
            </div>

            {/* Sync to Supabase Section */}
            {data && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pt-6 relative z-10"
              >
                <div className="p-6 bg-blue-600/10 border border-blue-500/20 rounded-[32px] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Zap className="text-blue-400" size={20} />
                      <h4 className="text-sm font-black text-white uppercase tracking-widest">Push to Live Database</h4>
                    </div>
                    <span className="text-[10px] font-black text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full border border-blue-400/20 uppercase tracking-widest">
                      Supabase Ready
                    </span>
                  </div>
                  <p className="text-[10px] font-medium text-zinc-400 leading-relaxed">
                    This will **replace** all data in your Supabase database with the CSV file currently uploaded above. Use this to update Live Mode with a new dataset.
                  </p>
                  <button 
                    onClick={handleBulkSync}
                    disabled={syncing}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {syncing ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Zap className="group-hover:scale-110 transition-transform" size={18} />
                    )}
                    {syncing ? 'Replacing Database Content...' : 'Overwrite Live Database with this CSV'}
                  </button>
                </div>
              </motion.div>
            )}

            <div className="pt-8 border-t border-white/10 flex items-center justify-between relative z-10">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${data ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-zinc-700'}`} />
                  <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                    {recordCounts.valid} Valid Records Sync'd
                  </span>
                </div>
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-6">
                  Last Sync: {lastUploadTime || 'Never'}
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Local Processing</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quality Score Sidebar */}
        <div className="lg:col-span-5 space-y-8">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[40px] shadow-2xl space-y-6"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-black text-white uppercase tracking-widest">Data Quality Score</h4>
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                (data?.quality?.score || 0) > 80 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
              }`}>
                {data?.quality?.score || 0}% Healthy
              </div>
            </div>

            <div className="relative h-4 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${data?.quality?.score || 0}%` }}
                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${
                  (data?.quality?.score || 0) > 80 ? 'from-emerald-500 to-teal-400' : 'from-amber-500 to-orange-400'
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Total Rows', value: recordCounts.total, color: 'text-white' },
                { label: 'Invalid Rows', value: recordCounts.invalid, color: 'text-rose-400' },
                { label: 'Missing Values', value: data?.quality?.missingValues || 0, color: 'text-amber-400' },
                { label: 'Duplicates', value: data?.quality?.duplicates || 0, color: 'text-purple-400' },
              ].map((stat, i) => (
                <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className={`text-xl font-black ${stat.color}`}>{stat.value.toLocaleString()}</p>
                </div>
              ))}
            </div>

            {data?.quality?.missingByField && Object.keys(data.quality.missingByField).length > 0 && (
              <div className="pt-6 border-t border-white/10 space-y-4">
                <h5 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <AlertCircle size={12} className="text-amber-400" /> Missing Values Breakdown
                </h5>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(data.quality.missingByField)
                    .sort(([, a], [, b]) => b - a)
                    .map(([field, count]) => (
                      <div key={field} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group/field hover:bg-white/10 transition-all">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest group-hover/field:text-white transition-colors">
                          {field.replace('_', ' ')}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            {count.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest leading-relaxed">
                  * System applied smart fallbacks (0, "Unknown", or current date) for these fields to maintain data integrity.
                </p>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 backdrop-blur-2xl border border-white/10 p-8 rounded-[40px] shadow-2xl space-y-6"
          >
            <h4 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Info size={18} className="text-blue-400" /> Format Guide
            </h4>
            <div className="space-y-3">
              {[
                'Full 47 dimensions supported',
                'Extra columns auto-preserved',
                'Dates: YYYY-MM-DD or ISO',
                'Prices & Stock must be numeric',
                'Unique order_id per row',
                'Empty rows auto-removed'
              ].map((rule, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                  <p className="text-xs font-bold text-zinc-400">{rule}</p>
                </div>
              ))}
            </div>
            <button 
              onClick={downloadTemplate}
              className="w-full py-4 bg-white/10 border border-white/10 rounded-2xl text-white font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2"
            >
              View Sample CSV <ChevronRight size={16} />
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default DataUpload;
