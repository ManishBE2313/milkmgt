import axios from 'axios';
import {
  User,
  CreateUserInput,
  LoginInput,
  AuthResponse,
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  Delivery,
  CreateDeliveryInput,
  MonthlySummary,
  AnalyticsData,
  ExportData,
  ApiResponse,
  CustomerDeliveryHistory,
} from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token: string | null): void => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export const authApi = {
  register: async (userData: CreateUserInput): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', userData);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to register');
    }
    return response.data.data;
  },

  login: async (loginData: LoginInput): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', loginData);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to login');
    }
    return response.data.data;
  },
};

export const userApi = {
  getMe: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/user/me');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch user profile');
    }
    return response.data.data;
  },
};

export const customerApi = {
  getCustomers: async (): Promise<Customer[]> => {
    const response = await api.get<ApiResponse<Customer[]>>('/customers');
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch customers');
    }
    return response.data.data || [];
  },

  createCustomer: async (customerData: CreateCustomerInput): Promise<Customer> => {
    const response = await api.post<ApiResponse<Customer>>('/customers', customerData);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to create customer');
    }
    return response.data.data;
  },

  updateCustomer: async (
    customerId: number,
    customerData: UpdateCustomerInput
  ): Promise<Customer> => {
    const response = await api.put<ApiResponse<Customer>>(
      `/customers/${customerId}`,
      customerData
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to update customer');
    }
    return response.data.data;
  },

  deleteCustomer: async (customerId: number): Promise<void> => {
    const response = await api.delete<ApiResponse>(`/customers/${customerId}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete customer');
    }
  },

  getCustomerDeliveryHistory: async (
    customerId: number,
    monthYear?: string
  ): Promise<CustomerDeliveryHistory> => {
    const params = monthYear ? { month_year: monthYear } : {};
    const response = await api.get<ApiResponse<CustomerDeliveryHistory>>(
      `/customers/${customerId}/history`,
      { params }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch delivery history');
    }
    return response.data.data;
  },
};

export const deliveryApi = {
  getDeliveries: async (monthYear?: string): Promise<Delivery[]> => {
    const params = monthYear ? { month_year: monthYear } : {};
    const response = await api.get<ApiResponse<Delivery[]>>('/deliveries', { params });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch deliveries');
    }
    return response.data.data || [];
  },

  createOrUpdateDelivery: async (deliveryData: CreateDeliveryInput): Promise<Delivery> => {
    const response = await api.post<ApiResponse<Delivery>>('/deliveries', deliveryData);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to save delivery');
    }
    return response.data.data;
  },

  deleteDelivery: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse>(`/deliveries/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete delivery');
    }
  },
};

export const summaryApi = {
  getMonthlySummary: async (monthYear: string): Promise<MonthlySummary> => {
    const response = await api.get<ApiResponse<MonthlySummary>>(`/summary/${monthYear}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch summary');
    }
    return response.data.data;
  },

  updateMonthlyRate: async (monthYear: string, ratePerLitre: number): Promise<void> => {
    const response = await api.put<ApiResponse>(`/summary/${monthYear}/rate`, {
      rate_per_litre: ratePerLitre,
    });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to update rate');
    }
  },

  getAnalyticsReport: async (): Promise<AnalyticsData> => {
    const response = await api.get<ApiResponse<AnalyticsData>>('/summary/report');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch analytics');
    }
    return response.data.data;
  },
};

export const exportApi = {
  exportAsJSON: async (): Promise<ExportData> => {
    const response = await api.get<ApiResponse<ExportData>>('/export/json');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to export data');
    }
    return response.data.data;
  },

  exportAsCSV: async (): Promise<Blob> => {
    const response = await api.get('/export/csv', { responseType: 'blob' });
    return response.data;
  },

  importFromJSON: async (data: {
    deliveries: CreateDeliveryInput[];
    customers?: CreateCustomerInput[];
  }): Promise<{ imported: number; updated: number; errors: number }> => {
    const response = await api.post<ApiResponse<{ imported: number; updated: number; errors: number }>>(
      '/export/import',
      data
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to import data');
    }
    return response.data.data;
  },
};

export const billApi = {
  generateBillData: async (
    customerId: string | number,
    periodStart: string,
    periodEnd: string
  ): Promise<any> => {
    const params = {
      customer_id: customerId,
      period_start: periodStart,
      period_end: periodEnd,
    };
    const response = await api.get<ApiResponse<any>>('/bill', { params });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to generate bill');
    }
    return response.data.data;
  },
};

export default api;
