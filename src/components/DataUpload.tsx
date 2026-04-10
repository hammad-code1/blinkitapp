/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileText, CheckCircle2, AlertCircle, 
  Download, Trash2, FileSpreadsheet, Info,
  ChevronRight, ArrowRight, ShieldCheck, Database
} from 'lucide-react';
import Papa from 'papaparse';

import { useData } from '../context/DataContext';

const DataUpload: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { resetData, lastUploadTime, recordCounts, updateMasterData, data } = useData();

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
    const csv = 'order_id,user_id,user_name,city,email,product_id,product_name,category,price,quantity,stock,order_date\nORD101,USER001,Amit Sharma,Mumbai,amit@gmail.com,PROD001,Milk,Dairy,45,2,100,2026-03-19';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `minute_metrics_master_template.csv`);
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
                'Strict column order required',
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
