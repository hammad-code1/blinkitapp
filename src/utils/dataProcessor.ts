/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Order, Product, User, JoinedOrder, AnalyticsData, 
  DailyStats, CityStats, CategoryStats, WeeklyStats, 
  MonthlyStats, TopProduct, UserOrderFrequency, 
  CustomerInsight, DataCompleteness, DataQuality 
} from '../types';
import { format, parseISO, startOfWeek, getHours, startOfMonth, isValid } from 'date-fns';

// --- Helper Functions ---

export const safeParseDate = (dateStr: any): Date => {
  if (!dateStr) return new Date();
  
  // If it's already a Date object
  if (dateStr instanceof Date) {
    return isValid(dateStr) ? dateStr : new Date();
  }

  // If it's a Firebase Timestamp (has toDate method)
  if (dateStr && typeof dateStr.toDate === 'function') {
    try {
      const d = dateStr.toDate();
      if (isValid(d)) return d;
    } catch (e) {}
  }

  const str = String(dateStr).trim();
  
  // Try native Date constructor first
  let date = new Date(str);
  if (isValid(date)) return date;
  
  // Try cleaning the string (remove timezone name in parentheses like "(India Standard Time)")
  const cleanedDateStr = str.replace(/\s*\([^)]+\)$/, '');
  date = new Date(cleanedDateStr);
  if (isValid(date)) return date;
  
  // Try ISO first
  const isoDate = parseISO(str);
  if (isValid(isoDate)) return isoDate;

  // Manual parsing for "Wed Mar 20 2024 15:30:00 GMT+0530" format as a last resort
  const parts = str.split(' ');
  if (parts.length >= 4) {
    const monthMap: Record<string, number> = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };
    
    const month = monthMap[parts[1]];
    const day = parseInt(parts[2]);
    const year = parseInt(parts[3]);
    const time = parts[4];
    
    if (month !== undefined && !isNaN(day) && !isNaN(year)) {
      const d = new Date(year, month, day);
      if (time) {
        const tParts = time.split(':');
        const h = parseInt(tParts[0]);
        const m = parseInt(tParts[1]);
        const s = parseInt(tParts[2]);
        if (!isNaN(h)) d.setHours(h);
        if (!isNaN(m)) d.setMinutes(m);
        if (!isNaN(s)) d.setSeconds(s);
      }
      if (isValid(d)) return d;
    }
  }
  
  // If all fails, return a default date instead of throwing to prevent app crash
  console.warn(`[safeParseDate] Could not parse date: "${dateStr}". Using current date.`);
  return new Date();
};

const cleanString = (val: any): string => {
  if (val === null || val === undefined || String(val).trim() === '') return 'Unknown';
  return String(val).trim();
};

const cleanNumber = (val: any, fallback = 0): number => {
  if (val === null || val === undefined) return fallback;
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  return isNaN(num) ? fallback : num;
};

const isValidEmail = (email: any): boolean => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
};

/**
 * Processes raw data from a single Master CSV into structured analytics.
 */
export const processAnalyticsData = (rawData: any[]): { stats: AnalyticsData; quality: DataQuality } => {
  const quality: DataQuality = {
    score: 0,
    totalRows: rawData.length,
    validRows: 0,
    invalidRows: 0,
    missingValues: 0,
    missingByField: {},
    duplicates: 0,
    correctedRows: 0
  };

  const orderIds = new Set<string>();
  const cleanedRows: any[] = [];

  // 1. Data Cleaning & Validation
  rawData.forEach((row, idx) => {
    let isCorrected = false;
    let isInvalid = false;

    // Helper to get value from row with flexible key matching
    const getVal = (row: any, keys: string[], fallback: any = null) => {
      for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null) return row[key];
        // Try case-insensitive and space-insensitive match
        const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        for (const actualKey in row) {
          if (actualKey.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedKey) {
            return row[actualKey];
          }
        }
      }
      return fallback;
    };

    // Check for missing critical fields
    const criticalFields = [
      { key: 'order_id', aliases: ['order_id', 'OrderId', 'Order ID', 'id', 'oid', 'orderid'] },
      { key: 'user_id', aliases: ['user_id', 'UserId', 'User ID', 'uid', 'customer_id'] },
      { key: 'product_id', aliases: ['product_id', 'ProductId', 'Product ID', 'pid', 'item_id'] },
      { key: 'price', aliases: ['price', 'Price', 'unit_price', 'rate', 'mrp'] },
      { key: 'quantity', aliases: ['quantity', 'Quantity', 'qty', 'units', 'count'] },
      { key: 'category', aliases: ['category', 'Category', 'department', 'dept', 'type'] },
      { key: 'city', aliases: ['area', 'Area', 'city', 'City', 'location', 'town', 'address', 'region'] },
      { key: 'order_date', aliases: ['order_date', 'OrderDate', 'Order Date', 'date', 'timestamp', 'created_at'] }
    ];

    criticalFields.forEach(field => {
      const val = getVal(row, field.aliases);
      if (val === null || val === undefined || String(val).trim() === '') {
        quality.missingValues++;
        quality.missingByField[field.key] = (quality.missingByField[field.key] || 0) + 1;
        isCorrected = true;
      }
    });

    const orderId = cleanString(getVal(row, ['order_id', 'OrderId', 'Order ID', 'id', 'oid', 'orderid']));
    if (orderId === 'Unknown') {
      isInvalid = true;
      console.warn(`Row ${idx + 1}: Missing order_id. Skipping.`);
    } else if (orderIds.has(orderId)) {
      quality.duplicates++;
      isInvalid = true;
      console.warn(`Row ${idx + 1}: Duplicate order_id ${orderId}. Skipping.`);
    }

    if (isInvalid) {
      quality.invalidRows++;
      return;
    }

    orderIds.add(orderId);
    quality.validRows++;
    if (isCorrected) quality.correctedRows++;

    const actualVal = getVal(row, ['actual_delivery_time', 'actual_time', 'actual']);
    const promisedVal = getVal(row, ['promised_delivery_time', 'promised_time', 'promised']);
    
    let deliveryTimeMins = 0;
    if (actualVal !== null && promisedVal !== null && String(actualVal).trim() !== '' && String(promisedVal).trim() !== '') {
      const sActual = String(actualVal);
      const sPromised = String(promisedVal);
      
      // Check if they are simple numbers (minutes)
      const isNumeric = (val: string) => /^-?\d+(\.\d+)?$/.test(val.trim());
      
      if (isNumeric(sActual) && isNumeric(sPromised)) {
        const delay = parseFloat(sActual) - parseFloat(sPromised);
        deliveryTimeMins = Math.max(0, delay);
      } else {
        // Try parsing as dates
        const dActual = safeParseDate(actualVal);
        const dPromised = safeParseDate(promisedVal);
        
        // Check if we got valid dates that aren't just the default "now" fallback
        // safeParseDate returns new Date() on failure. We check if they are valid and different from a very recent "now"
        // or just check if the strings look like dates
        const looksLikeDate = (s: string) => s.includes('-') || s.includes(':') || s.includes('/');
        
        if (looksLikeDate(sActual) && looksLikeDate(sPromised)) {
          const diffMs = dActual.getTime() - dPromised.getTime();
          deliveryTimeMins = Math.max(0, Math.round(diffMs / 60000)); // ms to minutes
        } else {
          // Fallback to numeric parsing if date parsing seems inappropriate
          const delay = cleanNumber(actualVal) - cleanNumber(promisedVal);
          deliveryTimeMins = Math.max(0, delay);
        }
      }
    } else {
      deliveryTimeMins = Math.max(0, cleanNumber(getVal(row, ['delivery_time_mins', 'delivery_time', 'time_taken', 'delivery_min', 'minutes', 'duration', 'delivery_time_minutes', 'elivery_time_minutes']), 0));
    }

    // Clean and transform the row
    const cleanedRow = {
      ...row,
      order_id: orderId,
      user_id: cleanString(getVal(row, ['user_id', 'UserId', 'User ID', 'uid', 'customer_id'])),
      user_name: cleanString(getVal(row, ['user_name', 'UserName', 'User Name', 'customer_name', 'customer', 'name'])),
      city: cleanString(getVal(row, ['area', 'Area', 'city', 'City', 'location', 'town', 'address', 'region'])),
      email: isValidEmail(getVal(row, ['email', 'Email'])) ? String(getVal(row, ['email', 'Email'])).trim() : 'Not Provided',
      product_id: cleanString(getVal(row, ['product_id', 'ProductId', 'Product ID', 'pid', 'item_id'])),
      product_name: cleanString(getVal(row, ['product_name', 'ProductName', 'Product Name', 'item_name', 'item', 'product'])),
      category: cleanString(getVal(row, ['category', 'Category', 'department', 'dept', 'type'])),
      price: cleanNumber(getVal(row, ['price', 'Price', 'unit_price', 'rate', 'mrp'])),
      quantity: cleanNumber(getVal(row, ['quantity', 'Quantity', 'qty', 'units', 'count']), 1),
      stock: cleanNumber(getVal(row, ['stock', 'Stock', 'inventory', 'available', 'qty_available']), 0),
      order_date: safeParseDate(getVal(row, ['order_date', 'OrderDate', 'Order Date', 'date', 'timestamp', 'created_at'])).toISOString(),
      delivery_time_mins: deliveryTimeMins,
      rating: cleanNumber(getVal(row, ['rating', 'Rating', 'stars', 'score', 'feedback']), 0),
      payment_method: cleanString(getVal(row, ['payment_method', 'Payment', 'method', 'pay_mode', 'payment'])),
      raw: row // Keep original row for "All Columns" view
    };

    cleanedRows.push(cleanedRow);
  });

  // Calculate Quality Score (0-100)
  if (quality.totalRows > 0) {
    const baseScore = (quality.validRows / quality.totalRows) * 100;
    const missingPenalty = (quality.missingValues / (quality.totalRows * 10)) * 100;
    quality.score = Math.max(0, Math.min(100, Math.round(baseScore - missingPenalty)));
  }

  // 2. Derive Entities
  const productsMap = new Map<string, Product>();
  const usersMap = new Map<string, User>();
  const orders: JoinedOrder[] = [];

  cleanedRows.forEach(row => {
    // Products
    if (!productsMap.has(row.product_id)) {
      productsMap.set(row.product_id, {
        product_id: row.product_id,
        product_name: row.product_name,
        category: row.category,
        price: row.price,
        stock: row.stock
      });
    }

    // Users
    if (!usersMap.has(row.user_id)) {
      usersMap.set(row.user_id, {
        user_id: row.user_id,
        user_name: row.user_name,
        city: row.city,
        email: row.email
      });
    }

    // Orders (Joined)
    const revenue = row.price * row.quantity;
    orders.push({
      order_id: row.order_id,
      product_id: row.product_id,
      user_id: row.user_id,
      quantity: row.quantity,
      order_date: row.order_date,
      city: row.city,
      delivery_time_mins: row.delivery_time_mins,
      revenue,
      product_name: row.product_name,
      category: row.category,
      price: row.price,
      user_name: row.user_name,
      raw: row.raw
    });
  });

  const products = Array.from(productsMap.values());
  const users = Array.from(usersMap.values());

  // 3. Aggregations
  const totalRevenue = orders.reduce((sum, o) => sum + o.revenue, 0);
  const totalOrders = orders.length;
  const totalCustomers = users.length;

  // Daily Stats
  const dailyMap = new Map<string, { orders: number; revenue: number; deliveryTimes: number[] }>();
  orders.forEach(o => {
    const date = format(parseISO(o.order_date), 'yyyy-MM-dd');
    const current = dailyMap.get(date) || { orders: 0, revenue: 0, deliveryTimes: [] };
    current.orders += 1;
    current.revenue += o.revenue;
    current.deliveryTimes.push(Math.max(0, o.delivery_time_mins));
    dailyMap.set(date, current);
  });

  const dailyStats: DailyStats[] = Array.from(dailyMap.entries()).map(([date, data]) => ({
    date,
    orders: data.orders,
    revenue: data.revenue,
    avgOrderValue: data.orders > 0 ? data.revenue / data.orders : 0,
    avgDeliveryTime: data.deliveryTimes.length > 0 ? data.deliveryTimes.reduce((a, b) => a + b, 0) / data.deliveryTimes.length : 0,
    topCategory: 'N/A', // Simplified
    topCity: 'N/A',     // Simplified
    lateDeliveryPercent: (data.deliveryTimes.filter(t => t > 45).length / data.deliveryTimes.length) * 100
  })).sort((a, b) => a.date.localeCompare(b.date));

  // Validation: Show calculation for the first date in the dataset
  if (dailyStats.length > 0) {
    const firstDate = dailyStats[0];
    const rawDataForDate = dailyMap.get(firstDate.date);
    console.log(`[Validation] Date: ${firstDate.date}`);
    console.log(`[Validation] Total Orders: ${firstDate.orders}`);
    console.log(`[Validation] Sum of Delays: ${rawDataForDate?.deliveryTimes.reduce((a, b) => a + b, 0)}`);
    console.log(`[Validation] Avg Delay: ${firstDate.avgDeliveryTime.toFixed(2)} (Sum / Total)`);
  }

  // City Stats
  const cityMap = new Map<string, { orders: number; revenue: number; deliveryTimes: number[] }>();
  orders.forEach(o => {
    const current = cityMap.get(o.city) || { orders: 0, revenue: 0, deliveryTimes: [] };
    current.orders += 1;
    current.revenue += o.revenue;
    current.deliveryTimes.push(Math.max(0, o.delivery_time_mins));
    cityMap.set(o.city, current);
  });

  const cityStats: CityStats[] = Array.from(cityMap.entries())
    .map(([city, data]) => ({
      city,
      orders: data.orders,
      revenue: data.revenue,
      avgDeliveryTime: Number((data.deliveryTimes.length > 0 ? data.deliveryTimes.reduce((a, b) => a + b, 0) / data.deliveryTimes.length : 0).toFixed(1)),
      delayRate: (data.deliveryTimes.filter(t => t > 45).length / data.deliveryTimes.length) * 100
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // Category Stats
  const catMap = new Map<string, { orders: number; revenue: number }>();
  orders.forEach(o => {
    const current = catMap.get(o.category) || { orders: 0, revenue: 0 };
    current.orders += 1;
    current.revenue += o.revenue;
    catMap.set(o.category, current);
  });

  const categoryStats: CategoryStats[] = Array.from(catMap.entries())
    .map(([category, data]) => ({
      category,
      orders: data.orders,
      revenue: data.revenue
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // Hourly Stats
  const hourlyMap = new Map<number, { orders: number; revenue: number }>();
  orders.forEach(o => {
    const hour = getHours(parseISO(o.order_date));
    const current = hourlyMap.get(hour) || { orders: 0, revenue: 0 };
    current.orders += 1;
    current.revenue += o.revenue;
    hourlyMap.set(hour, current);
  });

  const hourlyStats = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    orders: hourlyMap.get(i)?.orders || 0,
    revenue: hourlyMap.get(i)?.revenue || 0
  }));

  // Top Products
  const prodPerfMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  orders.forEach(o => {
    const current = prodPerfMap.get(o.product_id) || { name: o.product_name, quantity: 0, revenue: 0 };
    current.quantity += o.quantity;
    current.revenue += o.revenue;
    prodPerfMap.set(o.product_id, current);
  });

  const topProducts: TopProduct[] = Array.from(prodPerfMap.entries())
    .map(([id, data]) => ({
      product_id: id,
      product_name: data.name,
      total_quantity: data.quantity,
      revenue: data.revenue
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Customer Insights
  const userPerfMap = new Map<string, { name: string; orders: number; spent: number; lastDate: string }>();
  orders.forEach(o => {
    const current = userPerfMap.get(o.user_id) || { name: o.user_name, orders: 0, spent: 0, lastDate: o.order_date };
    current.orders += 1;
    current.spent += o.revenue;
    if (new Date(o.order_date) > new Date(current.lastDate)) {
      current.lastDate = o.order_date;
    }
    userPerfMap.set(o.user_id, current);
  });

  const customerInsights: CustomerInsight[] = Array.from(userPerfMap.entries())
    .map(([id, data]) => {
      let segment: CustomerInsight['segment'] = 'New';
      if (data.orders > 5) segment = 'Loyal';
      else if (data.orders > 2) segment = 'Occasional';
      
      // Simple "At Risk" logic: no order in last 30 days (mocked)
      const lastDate = parseISO(data.lastDate);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (lastDate < thirtyDaysAgo) segment = 'At Risk';

      return {
        user_id: id,
        user_name: data.name,
        segment,
        total_orders: data.orders,
        total_spent: data.spent,
        last_order_date: data.lastDate
      };
    })
    .sort((a, b) => b.total_spent - a.total_spent);

  const userFrequencies: UserOrderFrequency[] = customerInsights.map(c => ({
    user_id: c.user_id,
    user_name: c.user_name,
    order_count: c.total_orders,
    total_spent: c.total_spent
  }));

  // Smart Insights
  const insights: string[] = [];
  if (cityStats.length > 0) {
    const topCity = [...cityStats].sort((a, b) => b.revenue - a.revenue)[0];
    insights.push(`Top performing city is ${topCity.city} with ₹${topCity.revenue.toLocaleString()} revenue.`);
  }
  if (categoryStats.length > 0) {
    const topCat = [...categoryStats].sort((a, b) => b.revenue - a.revenue)[0];
    insights.push(`Most popular category is ${topCat.category}.`);
  }
  const lowStock = products.filter(p => p.stock < 10).length;
  if (lowStock > 0) {
    insights.push(`${lowStock} products are running low on stock (< 10 units).`);
  }
  if (quality.score < 80) {
    insights.push(`Data quality is low (${quality.score}%). Consider cleaning your CSV.`);
  }

  return {
    stats: {
      orders,
      products,
      users,
      dailyStats,
      weeklyStats: [], // Simplified
      monthlyStats: [], // Simplified
      cityStats,
      categoryStats,
      hourlyStats,
      topProducts,
      userFrequencies,
      customerInsights,
      completeness: {
        orders_count: orders.length,
        products_count: products.length,
        users_count: users.length,
        missing_product_ids: [],
        missing_user_ids: [],
        users_without_orders: [],
        is_sufficient: orders.length > 0
      },
      totalRevenue,
      insights
    },
    quality
  };
};
