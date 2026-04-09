/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Order, Product, User, BlinkitData, UserRole } from '../types';
import { processAnalyticsData } from '../utils/dataProcessor';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface DataContextType {
  data: BlinkitData | null;
  isLoading: boolean;
  isDataLoaded: boolean;
  error: string | null;
  updateMasterData: (rawData: any[]) => void;
  updateProductStock: (productId: string, newStock: number) => void;
  resetData: () => void;
  fetchGitHubData: () => Promise<void>;
  lastUploadTime: string | null;
  isFetchingGitHub: boolean;
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
    data: BlinkitData | null;
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

  const currentRoleData = role ? roleData[role] : null;

  // Handle Supabase Auth State
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthStateChange(session?.user ?? null);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthStateChange(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthStateChange = async (supabaseUser: SupabaseUser | null) => {
    setUser(supabaseUser);
    if (supabaseUser) {
      // Determine role: hardcoded admin or from profile
      const userRole = supabaseUser.email === 'admin@blinkit.com' ? 'admin' : 'user';
      setRole(userRole);
      
      // Ensure profile exists in DB
      await ensureProfile(supabaseUser, userRole);
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
  };

  // Load data from Supabase on role change
  useEffect(() => {
    if (role && user) {
      loadFromSupabase();
    }
  }, [role, user]);

  const loadFromSupabase = async () => {
    if (!role || !isSupabaseConfigured) return;
    setIsLoading(true);
    try {
      const { data: dbData, error } = await supabase
        .from('master_data')
        .select('data')
        .eq('role', role)
        .limit(1000); // Add a limit just in case

      if (error) throw error;

      if (dbData && dbData.length > 0) {
        const rows = dbData.map(item => item.data);
        processAndSetData(rows, false); // false = don't save back to DB
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

      if (saveToDb && isSupabaseConfigured) {
        saveToSupabase(dataToProcess);
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

  return (
    <DataContext.Provider value={{ 
      data: currentRoleData?.data || null, 
      isLoading, 
      isDataLoaded: currentRoleData?.isDataLoaded || false,
      error, 
      updateMasterData, 
      updateProductStock,
      resetData, 
      fetchGitHubData,
      lastUploadTime: currentRoleData?.lastUploadTime || null,
      isFetchingGitHub,
      recordCounts: currentRoleData?.recordCounts || { total: 0, valid: 0, invalid: 0 },
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
