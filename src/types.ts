/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  product_id: string;
  product_name: string;
  category: string;
  price: number;
  stock: number;
  image?: string;
}

export interface User {
  user_id: string;
  user_name: string;
  city: string;
  email?: string;
}

export interface Order {
  order_id: string;
  product_id: string;
  user_id: string;
  quantity: number;
  order_date: string; // ISO string
  city: string;
  delivery_time_mins: number;
  revenue?: number;
  rating?: number;
  payment_method?: string;
  comment?: string;
}

export interface JoinedOrder extends Order {
  product_name: string;
  category: string;
  price: number;
  user_name: string;
  revenue: number;
  raw?: any;
}

export interface DailyStats {
  date: string;
  orders: number;
  revenue: number;
  avgOrderValue: number;
  topCategory: string;
  topCity: string;
  avgDeliveryTime: number;
  lateDeliveryPercent: number;
  growthPercent?: number;
}

export interface CityStats {
  city: string;
  orders: number;
  revenue: number;
  avgDeliveryTime: number;
  delayRate: number;
}

export interface CategoryStats {
  category: string;
  orders: number;
  revenue: number;
}

export interface WeeklyStats {
  week: string;
  orders: number;
  revenue: number;
  growthPercent: number;
}

export interface MonthlyStats {
  month: string;
  orders: number;
  revenue: number;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  total_quantity: number;
  revenue: number;
}

export interface UserOrderFrequency {
  user_id: string;
  user_name: string;
  order_count: number;
  total_spent: number;
}

export interface CustomerInsight {
  user_id: string;
  user_name: string;
  segment: 'Loyal' | 'At Risk' | 'New' | 'Occasional';
  total_orders: number;
  total_spent: number;
  last_order_date: string;
}

export interface DataCompleteness {
  orders_count: number;
  products_count: number;
  users_count: number;
  missing_product_ids: string[];
  missing_user_ids: string[];
  users_without_orders: string[];
  is_sufficient: boolean;
}

export interface DataQuality {
  score: number;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  missingValues: number;
  missingByField: Record<string, number>;
  duplicates: number;
  correctedRows: number;
}

export interface AnalyticsData {
  orders: JoinedOrder[];
  products: Product[];
  users: User[];
  dailyStats: DailyStats[];
  weeklyStats: WeeklyStats[];
  monthlyStats: MonthlyStats[];
  cityStats: CityStats[];
  categoryStats: CategoryStats[];
  hourlyStats: { hour: number; orders: number; revenue: number }[];
  topProducts: TopProduct[];
  userFrequencies: UserOrderFrequency[];
  customerInsights: CustomerInsight[];
  completeness: DataCompleteness;
  totalRevenue: number;
  insights?: string[];
}

export interface BlinkitData {
  stats: AnalyticsData;
  products: Product[];
  orders: JoinedOrder[];
  users: User[];
  quality?: DataQuality;
}

export type UserRole = 'admin' | 'user';
