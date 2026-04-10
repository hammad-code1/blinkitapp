/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Customers from './components/Customers';
import AIInsights from './components/AIInsights';
import DataUpload from './components/DataUpload';
import CityAnalytics from './components/CityAnalytics';
import DeliveryAnalytics from './components/DeliveryAnalytics';
import Reviews from './components/Reviews';
import Workflows from './components/Workflows';
import DataExplorer from './components/DataExplorer';
import NotificationCenter from './components/NotificationCenter';
import Login from './components/Login';
import { DataProvider, useData } from './context/DataContext';
import { AnalyticsData, UserRole, Product, MinuteMetricsData } from './types';
import { AlertCircle, Loader2, Sparkles, Menu, Upload, Database } from 'lucide-react';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { 
    data, 
    isLoading, 
    isDataLoaded, 
    error, 
    recordCounts, 
    fetchGitHubData, 
    isFetchingGitHub,
    role,
    user,
    signOut
  } = useData();

  // Handle redirection based on role
  useEffect(() => {
    if (role === 'admin') {
      setActiveTab('dashboard');
    } else if (role === 'user') {
      setActiveTab('dashboard'); // Both go to dashboard but with different data
    }
  }, [role]);

  const handleLogout = async () => {
    await signOut();
    setActiveTab('dashboard');
  };

  const handleAddProduct = (product: Product) => {
    // In master CSV mode, adding a product manually is disabled or would require a different flow
    console.warn('Manual product addition is disabled in Master CSV mode.');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white space-y-6">
        <div className="relative">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-500 animate-pulse" size={24} />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-black tracking-tighter uppercase">Initializing Minute Metrics</h2>
          <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">Verifying secure session...</p>
        </div>
      </div>
    );
  }

  if (!role) {
    return <Login />;
  }

  const renderContent = () => {
    if (isFetchingGitHub) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] bg-zinc-950 text-white space-y-6">
          <div className="relative">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-500 animate-pulse" size={24} />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-black tracking-tighter uppercase">
              {isFetchingGitHub ? 'Fetching GitHub Data' : 'Initializing Minute Metrics'}
            </h2>
            <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">
              {isFetchingGitHub ? 'Connecting to hammad-dc/mini-project...' : 'Processing real-time operational data...'}
            </p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] bg-zinc-950 text-white p-8">
          <div className="p-6 bg-rose-500/10 rounded-full border border-rose-500/20 mb-6">
            <AlertCircle size={48} className="text-rose-400" />
          </div>
          <h2 className="text-2xl font-black tracking-tighter uppercase mb-2">System Error</h2>
          <p className="text-zinc-500 font-bold text-sm max-w-md text-center mb-8">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-white text-zinc-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
          >
            Reload Application
          </button>
        </div>
      );
    }

    if ((!isDataLoaded || !data) && activeTab !== 'upload') {
      if (role === 'user') {
        return (
          <div className="flex flex-col items-center justify-center min-h-[80vh] text-white p-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-10 bg-blue-600/10 rounded-[40px] border border-blue-500/20 mb-8 group hover:bg-blue-600/20 transition-all duration-500 shadow-2xl shadow-blue-500/10"
            >
              <Upload size={64} className="text-blue-400 group-hover:scale-110 transition-transform duration-500" />
            </motion.div>
            
            <h2 className="text-4xl font-black tracking-tighter uppercase mb-4 text-center">
              Upload CSV to start analysis
            </h2>
            <p className="text-zinc-500 font-bold text-sm max-w-md text-center mb-10 leading-relaxed">
              Please upload your CSV file to view analysis
            </p>
            
            <div className="w-full max-w-md p-8 border-2 border-dashed border-white/10 rounded-[32px] flex flex-col items-center gap-6 bg-white/5 backdrop-blur-sm hover:border-blue-500/30 transition-colors">
               <div className="text-center">
                 <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">
                   Supported format
                 </p>
                 <p className="text-xs font-bold text-white">.csv (Minute Metrics Master Data)</p>
               </div>
               
               <button 
                onClick={() => setActiveTab('upload')}
                className="w-full py-4 bg-white text-zinc-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/10 flex items-center justify-center gap-2"
              >
                <Upload size={16} />
                Select CSV File
              </button>
              
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                Drag and drop your file here
              </p>
            </div>
          </div>
        );
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-white p-8">
          <div className="p-6 bg-blue-500/10 rounded-full border border-blue-500/20 mb-6">
            <Database size={48} className="text-blue-400" />
          </div>
          <h2 className="text-3xl font-black tracking-tighter uppercase mb-2">Master Data Required</h2>
          <p className="text-zinc-500 font-bold text-sm max-w-md text-center mb-4">
            Please upload the Master CSV file to generate real-time analytics.
          </p>
          {recordCounts.total === 0 && (
            <div className="flex flex-col items-center gap-2 mb-8">
              <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                No Data Loaded
              </span>
            </div>
          )}
          <button 
            onClick={() => setActiveTab('upload')}
            className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20"
          >
            Go to Master Sync
          </button>
        </div>
      );
    }

    const stats = data?.stats;
    if (!stats && activeTab !== 'upload') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] bg-zinc-950 text-white space-y-6">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
          <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">Finalizing data processing...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard data={stats!} />;
      case 'products': return <Products data={stats!} onAddProduct={handleAddProduct} />;
      case 'customers': return <Customers data={stats!} />;
      case 'city': return <CityAnalytics data={stats!} />;
      case 'delivery': return <DeliveryAnalytics data={stats!} />;
      case 'reviews': return <Reviews data={stats!} />;
      case 'workflows': return <Workflows data={stats!} />;
      case 'ai': return <AIInsights data={stats!} />;
      case 'explorer': return <DataExplorer data={stats!} />;
      case 'upload': return <DataUpload />;
      default: return <Dashboard data={stats!} />;
    }
  };

  return (
    <div className="flex bg-zinc-950 min-h-screen font-sans selection:bg-blue-500/30 selection:text-blue-200">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        role={role!}
        user={user}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 lg:ml-72 overflow-x-hidden">
        {/* Header Actions */}
        <div className="hidden lg:flex items-center justify-end p-6 sticky top-0 z-30 pointer-events-none">
          <div className="pointer-events-auto">
            <NotificationCenter />
          </div>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden p-4 flex items-center justify-between border-b border-white/10 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
              M
            </div>
            <span className="font-bold text-white tracking-tight text-sm">Minute Metrics</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-zinc-400 hover:text-white transition-all"
          >
            <Menu size={24} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
};

export default App;
