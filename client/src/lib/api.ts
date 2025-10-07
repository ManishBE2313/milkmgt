import axios from 'axios';
import {
  User,
  CreateUserInput,
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  Delivery,
  CreateDeliveryInput,
  MonthlySummary,
  AnalyticsData,
  ExportData,
  ApiResponse,
} from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// User API calls
export const userApi = {
  createOrGetUser: async (userData: CreateUserInput): Promise<User> => {
    const response = await api.post<ApiResponse<User>>('/user', userData);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to create/get user');
    }
    return response.data.data;
  },

  getUserByUsername: async (username: string): Promise<User> => {
    const response = await api.get<ApiResponse<User>>(`/user/${username}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'User not found');
    }
    return response.data.data;
  },
};

// Customer API calls (NEW)
export const customerApi = {
  getCustomers: async (username: string): Promise<Customer[]> => {
    const response = await api.get<ApiResponse<Customer[]>>(
      `/customers/${username}`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch customers');
    }
    return response.data.data || [];
  },

  createCustomer: async (
    username: string,
    customerData: CreateCustomerInput
  ): Promise<Customer> => {
    const response = await api.post<ApiResponse<Customer>>(
      `/customers/${username}`,
      customerData
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to create customer');
    }
    return response.data.data;
  },

  updateCustomer: async (
    username: string,
    customerId: number,
    customerData: UpdateCustomerInput
  ): Promise<Customer> => {
    const response = await api.put<ApiResponse<Customer>>(
      `/customers/${username}/${customerId}`,
      customerData
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to update customer');
    }
    return response.data.data;
  },

  deleteCustomer: async (username: string, customerId: number): Promise<void> => {
    const response = await api.delete<ApiResponse>(
      `/customers/${username}/${customerId}`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete customer');
    }
  },
};

// Delivery API calls
export const deliveryApi = {
  getDeliveries: async (
    username: string,
    monthYear?: string
  ): Promise<Delivery[]> => {
    const params = monthYear ? { month_year: monthYear } : {};
    const response = await api.get<ApiResponse<Delivery[]>>(
      `/deliveries/${username}`,
      { params }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch deliveries');
    }
    return response.data.data || [];
  },

  createOrUpdateDelivery: async (
    username: string,
    deliveryData: CreateDeliveryInput
  ): Promise<Delivery> => {
    const response = await api.post<ApiResponse<Delivery>>(
      `/deliveries/${username}`,
      deliveryData
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to save delivery');
    }
    return response.data.data;
  },

  deleteDelivery: async (username: string, date: string): Promise<void> => {
    const response = await api.delete<ApiResponse>(
      `/deliveries/${username}/${date}`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete delivery');
    }
  },
};

// Summary API calls
export const summaryApi = {
  getMonthlySummary: async (
    username: string,
    monthYear: string
  ): Promise<MonthlySummary> => {
    const response = await api.get<ApiResponse<MonthlySummary>>(
      `/summary/${username}/${monthYear}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch summary');
    }
    return response.data.data;
  },

  updateMonthlyRate: async (
    username: string,
    monthYear: string,
    ratePerLitre: number
  ): Promise<void> => {
    const response = await api.put<ApiResponse>(
      `/summary/${username}/${monthYear}/rate`,
      { rate_per_litre: ratePerLitre }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to update rate');
    }
  },

  getAnalyticsReport: async (username: string): Promise<AnalyticsData> => {
    const response = await api.get<ApiResponse<AnalyticsData>>(
      `/report/${username}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch analytics');
    }
    return response.data.data;
  },
};

// Export/Import API calls
export const exportApi = {
  exportAsJSON: async (username: string): Promise<ExportData> => {
    const response = await api.get<ApiResponse<ExportData>>(
      `/export/${username}/json`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to export data');
    }
    return response.data.data;
  },

  exportAsCSV: async (username: string): Promise<Blob> => {
    const response = await api.get(`/export/${username}/csv`, {
      responseType: 'blob',
    });
    return response.data;
  },

  importFromJSON: async (
    username: string,
    data: { deliveries: CreateDeliveryInput[]; customers?: CreateCustomerInput[] }
  ): Promise<{ imported: number; updated: number; errors: number }> => {
    const response = await api.post<ApiResponse<any>>(
      `/import/${username}`,
      data
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to import data');
    }
    return response.data.data;
  },
};
// Bill API calls (NEW)
export const billApi = {
  generateBillData: async (
    username: string,
    customerId: string | number,
    periodStart: string,
    periodEnd: string
  ): Promise<any> => {
    const params = {
      customer_id: customerId,
      period_start: periodStart,
      period_end: periodEnd,
    };
    const response = await api.get<ApiResponse<any>>(
      `/bill/${username}`,
      { params }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to generate bill');
    }
    return response.data.data;
  },
};

export default api;
