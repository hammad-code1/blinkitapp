/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Order, Product, User, BlinkitData } from '../types';
import { processAnalyticsData } from '../utils/dataProcessor';

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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<BlinkitData | null>(null);
  const [rawData, setRawData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUploadTime, setLastUploadTime] = useState<string | null>(null);
  const [recordCounts, setRecordCounts] = useState({ total: 0, valid: 0, invalid: 0 });
  const [isFetchingGitHub, setIsFetchingGitHub] = useState(false);

  const processAndSetData = (dataToProcess: any[]) => {
    setIsLoading(true);
    setError(null);
    try {
      setRawData(dataToProcess);
      const { stats, quality } = processAnalyticsData(dataToProcess);
      setData({
        stats,
        products: stats.products,
        orders: stats.orders,
        users: stats.users,
        quality
      });
      setRecordCounts({
        total: quality.totalRows,
        valid: quality.validRows,
        invalid: quality.invalidRows
      });
      setIsDataLoaded(true);
      setLastUploadTime(new Date().toLocaleString());
    } catch (err) {
      setError('Data processing failed. Please check your CSV format.');
      console.error("Processing Error:", err);
      setIsDataLoaded(false);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProductStock = (productId: string, newStock: number) => {
    if (!rawData.length) return;
    
    // Update all rows in rawData that match this product_id
    // Note: In a real app, we'd have a separate products table, 
    // but here we derive everything from the master CSV.
    const updatedRawData = rawData.map(row => {
      // We need to check multiple possible column names for product_id
      const pidKeys = ['product_id', 'ProductId', 'Product ID', 'pid', 'item_id'];
      const rowPid = pidKeys.find(key => row[key] !== undefined) ? row[pidKeys.find(key => row[key] !== undefined)!] : null;
      
      if (String(rowPid) === productId) {
        // Find the stock key
        const stockKeys = ['stock', 'Stock', 'inventory', 'available', 'qty_available'];
        const stockKey = stockKeys.find(key => row[key] !== undefined) || 'stock';
        return { ...row, [stockKey]: newStock };
      }
      return row;
    });

    processAndSetData(updatedRawData);
  };

  const fetchGitHubData = async () => {
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
            return;
          }
          processAndSetData(results.data);
        },
        error: (err: any) => {
          setError(`CSV Parsing Error: ${err.message}`);
        }
      });
    } catch (err) {
      console.error("GitHub Fetch Error:", err);
      setError('Could not load data from GitHub. Please check your connection.');
    } finally {
      setIsFetchingGitHub(false);
    }
  };

  const updateMasterData = (rawData: any[]) => {
    processAndSetData(rawData);
  };

  const resetData = () => {
    setData(null);
    setRecordCounts({ total: 0, valid: 0, invalid: 0 });
    setLastUploadTime(null);
    setError(null);
    setIsDataLoaded(false);
  };

  return (
    <DataContext.Provider value={{ 
      data, 
      isLoading, 
      isDataLoaded,
      error, 
      updateMasterData, 
      updateProductStock,
      resetData, 
      fetchGitHubData,
      lastUploadTime,
      isFetchingGitHub,
      recordCounts
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
