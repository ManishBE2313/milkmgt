import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Delivery, Customer, MonthlySummary } from '../types';

interface AppState {
  // User state
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;

  // Current month state
  currentMonth: string; // YYYY-MM format
  setCurrentMonth: (month: string) => void;

  // Customers state (NEW)
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  removeCustomer: (customerId: number) => void;

  // Deliveries state
  deliveries: Delivery[];
  setDeliveries: (deliveries: Delivery[]) => void;
  addDelivery: (delivery: Delivery) => void;
  updateDelivery: (delivery: Delivery) => void;
  removeDelivery: (deliveryId: number) => void;

  // Summary state
  monthlySummary: MonthlySummary | null;
  setMonthlySummary: (summary: MonthlySummary | null) => void;

  // UI state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Reset all state
  resetState: () => void;
}

// Get current month in YYYY-MM format
const getCurrentMonth = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      token: null,
      currentMonth: getCurrentMonth(),
      customers: [],
      deliveries: [],
      monthlySummary: null,
      isLoading: false,

      // User actions
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),

      // Month actions
      setCurrentMonth: (month) => set({ currentMonth: month }),

      // Customer actions (NEW)
      setCustomers: (customers) => set({ customers }),
      
      addCustomer: (customer) =>
        set((state) => ({
          customers: [...state.customers, customer],
        })),

      updateCustomer: (customer) =>
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customer.id ? customer : c
          ),
        })),

      removeCustomer: (customerId) =>
        set((state) => ({
          customers: state.customers.filter((c) => c.id !== customerId),
        })),

      // Deliveries actions
      setDeliveries: (deliveries) => set({ deliveries }),
      
      addDelivery: (delivery) =>
        set((state) => ({
          deliveries: [delivery, ...state.deliveries],
        })),

      updateDelivery: (delivery) =>
        set((state) => ({
          deliveries: state.deliveries.map((d) =>
            d.id === delivery.id ? delivery : d
          ),
        })),

      removeDelivery: (deliveryId) =>
        set((state) => ({
          deliveries: state.deliveries.filter((d) => d.id !== deliveryId),
        })),

      // Summary actions
      setMonthlySummary: (summary) => set({ monthlySummary: summary }),

      // UI actions
      setIsLoading: (loading) => set({ isLoading: loading }),

      // Reset state
      resetState: () =>
        set({
          user: null,
          token: null,
          currentMonth: getCurrentMonth(),
          customers: [],
          deliveries: [],
          monthlySummary: null,
          isLoading: false,
        }),
    }),
    {
      name: 'milk-manager-storage',
      partialize: (state) => ({
        currentMonth: state.currentMonth,
      }),
    }
  )
);
