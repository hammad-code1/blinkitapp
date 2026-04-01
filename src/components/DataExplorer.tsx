/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, Filter, ChevronLeft, ChevronRight, Database, Table } from 'lucide-react';
import { AnalyticsData } from '../types';

interface DataExplorerProps {
  data: AnalyticsData;
}

const DataExplorer: React.FC<DataExplorerProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const allColumns = useMemo(() => {
    if (data.orders.length === 0) return [];
    const firstRaw = data.orders[0].raw || {};
    return Object.keys(firstRaw);
  }, [data.orders]);

  const filteredData = useMemo(() => {
    return data.orders.filter(order => {
      const searchStr = searchTerm.toLowerCase();
      return (
        order.order_id.toLowerCase().includes(searchStr) ||
        order.user_name.toLowerCase().includes(searchStr) ||
        order.product_name.toLowerCase().includes(searchStr) ||
        order.city.toLowerCase().includes(searchStr) ||
        order.category.toLowerCase().includes(searchStr)
      );
    });
  }, [data.orders, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDownload = () => {
    if (data.orders.length === 0) return;
    
    const headers = allColumns.join(',');
    const rows = data.orders.map(order => {
      return allColumns.map(col => {
        const val = order.raw ? order.raw[col] : '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',');
    });
    
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `blinkit_master_data_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white flex items-center gap-3">
            <Table className="text-blue-500" size={32} />
            Master Data Explorer
          </h1>
          <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest mt-1">
            Viewing all columns from the master dataset
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-white/10 rounded-xl text-white font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text"
            placeholder="Search by Order ID, Customer, Product, City..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Database className="text-blue-400" size={20} />
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Total Records</p>
              <p className="text-white font-bold">{filteredData.length.toLocaleString()}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Columns</p>
            <p className="text-white font-bold">{allColumns.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-800/50 border-b border-white/5">
                {allColumns.map(col => (
                  <th key={col} className="px-6 py-4 text-zinc-400 font-black text-[10px] uppercase tracking-widest whitespace-nowrap">
                    {col.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((order, idx) => (
                <tr key={order.order_id + idx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  {allColumns.map(col => (
                    <td key={col} className="px-6 py-4 text-zinc-300 text-sm font-medium whitespace-nowrap">
                      {order.raw ? String(order.raw[col]) : 'N/A'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div className="p-20 text-center">
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">No records found matching your search</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-6 border-t border-white/5 flex items-center justify-between">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length}
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-zinc-800 rounded-lg text-white disabled:opacity-30 hover:bg-zinc-700 transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = currentPage;
                  if (totalPages > 5) {
                    if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;
                  } else {
                    pageNum = i + 1;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        currentPage === pageNum ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 bg-zinc-800 rounded-lg text-white disabled:opacity-30 hover:bg-zinc-700 transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataExplorer;
