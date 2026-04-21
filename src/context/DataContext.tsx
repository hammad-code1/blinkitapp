/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Order, Product, User, MinuteMetricsData, UserRole } from '../types';
import { processAnalyticsData } from '../utils/dataProcessor';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface DataContextType {
  data: MinuteMetricsData | null;
  isLoading: boolean;
  isDataLoaded: boolean;
  error: string | null;
  updateMasterData: (rawData: any[]) => void;
  updateProductStock: (productId: string, newStock: number) => void;
  resetData: () => void;
  fetchGitHubData: () => Promise<void>;
  lastUploadTime: string | null;
  isFetchingGitHub: boolean;
  dataMode: 'static' | 'live';
  setDataMode: (mode: 'static' | 'live') => void;
  fetchLiveData: () => Promise<void>;
  staticData: MinuteMetricsData | null;
  recordCounts: {
    total: number;
    valid: number;
    invalid: number;
  };
  role: UserRole | null;
  user: SupabaseUser | null;
  signOut: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  
  // Store data separately for each role
  const [roleData, setRoleData] = useState<Record<string, {
    data: MinuteMetricsData | null;
    rawData: any[];
    isDataLoaded: boolean;
    lastUploadTime: string | null;
    recordCounts: { total: number; valid: number; invalid: number };
  }>>({
    admin: { data: null, rawData: [], isDataLoaded: false, lastUploadTime: null, recordCounts: { total: 0, valid: 0, invalid: 0 } },
    user: { data: null, rawData: [], isDataLoaded: false, lastUploadTime: null, recordCounts: { total: 0, valid: 0, invalid: 0 } }
  });

  const [isLoading, setIsLoading] = useState(true); // Start as loading to check session
  const [error, setError] = useState<string | null>(null);
  const [isFetchingGitHub, setIsFetchingGitHub] = useState(false);
  const [dataMode, setDataMode] = useState<'static' | 'live'>(() => {
    return (localStorage.getItem('minute_metrics_mode') as 'static' | 'live') || 'static';
  });
  const [liveData, setLiveData] = useState<MinuteMetricsData | null>(null);
  const [isLiveLoading, setIsLiveLoading] = useState(false);

  const currentRoleData = role ? roleData[role] : null;

  // Persist mode
  useEffect(() => {
    localStorage.setItem('minute_metrics_mode', dataMode);
    if (dataMode === 'live' && !liveData && !isLiveLoading) {
      fetchLiveData();
    }
  }, [dataMode]);

  const fetchLiveData = async () => {
    if (!isSupabaseConfigured) return;
    setIsLiveLoading(true);
    try {
      // 1. Fetch Products
      const { data: dbProducts, error: pError } = await supabase.from('products').select('*');
      if (pError) throw pError;

      // 2. Fetch Orders with pagination to bypass the 1000 row default limit
      let allOrders: any[] = [];
      let from = 0;
      const step = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .range(from, from + step - 1);
        
        if (error) throw error;
        if (data && data.length > 0) {
          allOrders = [...allOrders, ...data];
          from += step;
          if (data.length < step) hasMore = false; // Last page
        } else {
          hasMore = false;
        }
        
        // Safety break if it's getting too huge
        if (allOrders.length > 15000) hasMore = false;
      }

      const dbOrders = allOrders;

      // 3. Fetch Users/Profiles
      const { data: dbProfiles, error: prError } = await supabase.from('profiles').select('*');
      if (prError) throw prError;

      // Transform into the flat format expected by processAnalyticsData
      // We merge everything while preserving original CSV aliases in metadata
      const flatRawData = dbOrders.map(order => {
        const product = dbProducts?.find(p => p.product_id === order.product_id);
        const profile = dbProfiles?.find(p => p.id === order.user_id);
        const metadata = order.metadata || {}; 
        
        // Merge order, product into a base object
        // But keep metadata (original CSV) as the primary source for processRow
        return {
          ...metadata, // original CSV columns (Order ID, customer_name, etc.)
          ...product,  // product info
          ...order,    // supabase order data
          
          // Use the same aliases processRow looks for to ensure a match
          // This prevents "Unknown User" or incorrect stats
          order_id: order.order_id,
          product_id: order.product_id,
          user_id: order.user_id,
          
          // Ensure we don't break the cleaning logic in processRow
          // If metadata has "Price", and we set "price: undefined", getVal might fail
          // So only set these if they actually exist in the DB columns
          ...(order.quantity !== undefined && { quantity: order.quantity }),
          ...(order.revenue !== undefined && { revenue: order.revenue }),
          ...(order.order_date && { order_date: order.order_date }),
          ...(order.city && { city: order.city }),
          ...(order.delivery_time_mins !== undefined && { delivery_time_mins: order.delivery_time_mins }),
          
          // Fallback for user name if not in metadata
          user_name: metadata.user_name || metadata.UserName || metadata['User Name'] || 
                     metadata.customer_name || metadata.customer || metadata.name ||
                     profile?.email?.split('@')[0] || 'Unknown User',

          raw: {
            ...metadata,
            ...order,
            ...product
          }
        };
      });

      const { stats, quality } = processAnalyticsData(flatRawData);
      setLiveData({
        stats,
        products: (dbProducts || []) as Product[],
        orders: stats.orders,
        users: (dbProfiles || []).map(p => ({
          user_id: p.id,
          user_name: p.email?.split('@')[0] || 'Unknown',
          city: 'Unknown', // We could add city to profiles
          email: p.email
        })) as User[],
        quality
      });
    } catch (err) {
      console.error('Error fetching live data:', err);
      setError('Failed to fetch live data from Supabase.');
    } finally {
      setIsLiveLoading(false);
    }
  };

  // Real-time subscriptions
  useEffect(() => {
    if (!isSupabaseConfigured || dataMode !== 'live') return;

    const productsChannel = supabase
      .channel('live-changes')
      .on('postgres_changes' as any, { event: '*', table: 'products', schema: 'public' }, () => fetchLiveData())
      .on('postgres_changes' as any, { event: '*', table: 'orders', schema: 'public' }, () => fetchLiveData())
      .subscribe();

    // High frequency polling backup
    const interval = setInterval(() => {
      if (dataMode === 'live') fetchLiveData();
    }, 10000);

    return () => {
      supabase.removeChannel(productsChannel);
      clearInterval(interval);
    };
  }, [dataMode]);

  // Handle Supabase Auth State
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session error:', error.message);
        if (error.message.includes('Refresh Token Not Found') || error.message.includes('invalid_grant')) {
          signOut();
        } else {
          setIsLoading(false);
        }
        return;
      }
      handleAuthStateChange(session?.user ?? null);
    }).catch(err => {
      console.error('Unexpected session error:', err);
      setIsLoading(false);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        handleAuthStateChange(session?.user ?? null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        handleAuthStateChange(session?.user ?? null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthStateChange = async (supabaseUser: SupabaseUser | null) => {
    setUser(supabaseUser);
    if (supabaseUser) {
      // First, try to get role from profile
      let userRole: UserRole = supabaseUser.email === 'admindemo0@gmail.com' ? 'admin' : 'user';
      
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', supabaseUser.id)
          .single();
        
        if (profile && profile.role) {
          userRole = profile.role as UserRole;
        } else {
          // If no profile, ensure one exists with the default role
          await ensureProfile(supabaseUser, userRole);
        }
      } catch (err) {
        console.error('Error fetching profile role:', err);
        await ensureProfile(supabaseUser, userRole);
      }
      
      setRole(userRole);

      // For users, check local storage for session data
      if (userRole === 'user') {
        const savedData = localStorage.getItem(`minute_metrics_user_data_${supabaseUser.id}`);
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            processAndSetData(parsed, false); // Don't save to Supabase for user session
          } catch (e) {
            console.error('Error loading session data:', e);
          }
        }
      }
    } else {
      setRole(null);
    }
    setIsLoading(false);
  };

  const ensureProfile = async (supabaseUser: SupabaseUser, userRole: string) => {
    if (!isSupabaseConfigured) return;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (!profile) {
        await supabase.from('profiles').insert({
          id: supabaseUser.id,
          email: supabaseUser.email,
          role: userRole
        });
      }
    } catch (err) {
      console.error('Profile sync error:', err);
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setRole(null);
    setUser(null);
    // Clear session data on sign out if desired, but user said "each user session"
    // We'll keep it in local storage for the specific user ID
  };

  // Load data from Supabase on role change - ONLY FOR ADMIN
  useEffect(() => {
    if (role === 'admin' && user) {
      loadFromSupabase();
    }
  }, [role, user]);

  const loadFromSupabase = async () => {
    if (role !== 'admin' || !isSupabaseConfigured) return;
    setIsLoading(true);
    try {
      const { data: dbData, error } = await supabase
        .from('master_data')
        .select('data')
        .eq('role', role)
        .limit(1000);

      if (error) throw error;

      if (dbData && dbData.length > 0) {
        const rows = dbData.map(item => item.data);
        processAndSetData(rows, false);
      }
    } catch (err) {
      console.error('Supabase Load Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const processAndSetData = (dataToProcess: any[], saveToDb = true) => {
    if (!role) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const { stats, quality } = processAnalyticsData(dataToProcess);
      const newData = {
        stats,
        products: stats.products,
        orders: stats.orders,
        users: stats.users,
        quality
      };

      setRoleData(prev => ({
        ...prev,
        [role]: {
          data: newData,
          rawData: dataToProcess,
          isDataLoaded: true,
          lastUploadTime: new Date().toLocaleString(),
          recordCounts: {
            total: quality.totalRows,
            valid: quality.validRows,
            invalid: quality.invalidRows
          }
        }
      }));

      // Role-based persistence
      if (role === 'admin' && saveToDb && isSupabaseConfigured) {
        saveToSupabase(dataToProcess);
      } else if (role === 'user' && user) {
        // Store user data in local storage for the session
        localStorage.setItem(`minute_metrics_user_data_${user.id}`, JSON.stringify(dataToProcess));
      }
    } catch (err) {
      setError('Data processing failed. Please check your CSV format.');
      console.error("Processing Error:", err);
      setRoleData(prev => ({
        ...prev,
        [role]: { ...prev[role], isDataLoaded: false }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const saveToSupabase = async (rows: any[]) => {
    if (!role || !isSupabaseConfigured) return;
    try {
      // Clear existing data for this role
      await supabase.from('master_data').delete().eq('role', role);
      
      // Batch insert new data
      const toInsert = rows.map(row => ({
        role,
        data: row
      }));

      // Supabase has limits on batch size, we'll chunk it if it's large
      const chunkSize = 100;
      for (let i = 0; i < toInsert.length; i += chunkSize) {
        const chunk = toInsert.slice(i, i + chunkSize);
        const { error } = await supabase.from('master_data').insert(chunk);
        if (error) throw error;
      }
    } catch (err) {
      console.error('Supabase Save Error:', err);
    }
  };

  const updateProductStock = (productId: string, newStock: number) => {
    if (!role || !roleData[role].rawData.length) return;
    
    const updatedRawData = roleData[role].rawData.map(row => {
      const pidKeys = ['product_id', 'ProductId', 'Product ID', 'pid', 'item_id'];
      const rowPid = pidKeys.find(key => row[key] !== undefined) ? row[pidKeys.find(key => row[key] !== undefined)!] : null;
      
      if (String(rowPid) === productId) {
        const stockKeys = ['stock', 'Stock', 'inventory', 'available', 'qty_available'];
        const stockKey = stockKeys.find(key => row[key] !== undefined) || 'stock';
        return { ...row, [stockKey]: newStock };
      }
      return row;
    });

    processAndSetData(updatedRawData);
  };

  const fetchGitHubData = async () => {
    if (!role) return;
    setIsFetchingGitHub(true);
    setError(null);
    try {
      const response = await fetch('https://raw.githubusercontent.com/hammad-dc/mini-project/main/Blinkit_Master_Data.csv');
      if (!response.ok) throw new Error('Failed to fetch data from GitHub');
      
      const csvText = await response.text();
      const Papa = (await import('papaparse')).default;
      
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data.length === 0) {
            setError('The CSV file is empty.');
            setIsFetchingGitHub(false);
            return;
          }
          processAndSetData(results.data);
          setIsFetchingGitHub(false);
        },
        error: (err: any) => {
          setError(`CSV Parsing Error: ${err.message}`);
          setIsFetchingGitHub(false);
        }
      });
    } catch (err) {
      console.error("GitHub Fetch Error:", err);
      setError('Could not load data from GitHub. Please check your connection.');
      setIsFetchingGitHub(false);
    }
  };

  const updateMasterData = (rawData: any[]) => {
    processAndSetData(rawData);
  };

  const resetData = async () => {
    if (!role) return;
    
    if (isSupabaseConfigured) {
      try {
        await supabase.from('master_data').delete().eq('role', role);
      } catch (err) {
        console.error('Supabase Delete Error:', err);
      }
    }

    // Clear local storage for user
    if (role === 'user' && user) {
      localStorage.removeItem(`minute_metrics_user_data_${user.id}`);
    }

    setRoleData(prev => ({
      ...prev,
      [role]: {
        data: null,
        rawData: [],
        isDataLoaded: false,
        lastUploadTime: null,
        recordCounts: { total: 0, valid: 0, invalid: 0 }
      }
    }));
    setError(null);
  };

  // Auto-fetch GitHub data for admin role only if no data is loaded
  useEffect(() => {
    const adminData = roleData.admin;
    if (role === 'admin' && !adminData.isDataLoaded && !isFetchingGitHub && adminData.recordCounts.total === 0) {
      fetchGitHubData();
    }
  }, [role, roleData.admin.isDataLoaded, isFetchingGitHub, roleData.admin.recordCounts.total, fetchGitHubData]);

  return (
    <DataContext.Provider value={{ 
      data: dataMode === 'live' ? liveData : (currentRoleData?.data || null), 
      isLoading: isLoading || (dataMode === 'live' && isLiveLoading && !liveData), 
      isDataLoaded: dataMode === 'live' ? !!liveData : (currentRoleData?.isDataLoaded || false),
      error, 
      updateMasterData, 
      updateProductStock,
      resetData, 
      fetchGitHubData, 
      lastUploadTime: dataMode === 'live' ? 'Real-time Sync' : (currentRoleData?.lastUploadTime || null),
      isFetchingGitHub,
      dataMode,
      setDataMode,
      fetchLiveData,
      staticData: currentRoleData?.data || null, // Export static (CSV) data
      recordCounts: dataMode === 'live' ? {
        total: liveData?.quality?.totalRows || 0,
        valid: liveData?.quality?.validRows || 0,
        invalid: liveData?.quality?.invalidRows || 0
      } : (currentRoleData?.recordCounts || { total: 0, valid: 0, invalid: 0 }),
      role,
      user,
      signOut
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
