// User related types
export interface User {
  id: number;
  username: string;
  fullname: string;
  address: string;
  created_at: string;
}

export interface CreateUserInput {
  username: string;
  fullname: string;
  address: string;
  password: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Customer related types (NEW)
export interface Customer {
  id: number;
  user_id: number;
  name: string;
  address: string | null;
  contact: string | null;
  rate_per_litre: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerInput {
  name: string;
  address?: string;
  contact?: string;
  rate_per_litre: number;
}

export interface UpdateCustomerInput {
  name?: string;
  address?: string;
  contact?: string;
  rate_per_litre?: number;
}

// Delivery related types
export interface Delivery {
  id: number;
  user_id: number;
  customer_id: number | null;
  customer_name?: string;
  delivery_date: string;
  quantity: number;
  status: DeliveryStatus;
  month_year: string;
  rate_per_litre: number | null;
  created_at: string;
  updated_at: string;
}

export type DeliveryStatus = 'delivered' | 'absent' | 'mixed' | 'no_entry';

export interface CreateDeliveryInput {
  customer_id?: number;
  delivery_date: string;
  quantity: number;
  status: DeliveryStatus;
  month_year: string;
  rate_per_litre?: number;
}

// Monthly summary types
export interface MonthlySummary {
  month_year: string;
  total_litres: number;
  total_delivered_days: number;
  total_absent_days: number;
  average_rate: number;
  total_bill: number;
}

// Analytics/Report types
export interface MonthlyReport {
  month_year: string;
  total_litres: number;
  total_days: number;
  absent_days: number;
  average_daily_delivery: number;
}

export interface AnalyticsData {
  monthly_trends: MonthlyReport[];
  total_deliveries: number;
  total_litres: number;
}

// Export/Import types
export interface ExportData {
  user: User;
  deliveries: Delivery[];
  customers: Customer[];
  exported_at: string;
}

export interface CustomerDeliveryHistory {
  customer_id: number;
  customer_name: string;
  period: string;
  deliveries: Array<{
    id: number;
    date: string;
    quantity: number;
    rate: number;
    amount: number;
    status: string;
  }>;
  summary: {
    total_litres: number;
    total_delivered_days: number;
    total_absent_days: number;
    total_amount: number;
    average_rate: number;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Calendar day type
export interface CalendarDay {
  date: Date;
  dateString: string;
  status: DeliveryStatus;
  quantity: number;
  isCurrentMonth: boolean;
}
