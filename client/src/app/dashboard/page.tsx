'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { deliveryApi, summaryApi, customerApi } from '@/lib/api';
import Calendar from '@/components/Calendar';
import MonthlySummary from '@/components/MonthlySummary';
import DeliveryModal from '@/components/DeliveryModal';
import BillGenerator from '@/components/BillGenerator';
import { Delivery } from '@/types';
import { getCurrentMonthYear, getMonthName, getPreviousMonth, getNextMonth } from '@/utils/dateUtils';

export default function DashboardPage() {
  const router = useRouter();
  const user = useStore((state) => state.user);
  const currentMonth = useStore((state) => state.currentMonth);
  const setCurrentMonth = useStore((state) => state.setCurrentMonth);
  const deliveries = useStore((state) => state.deliveries);
  const setDeliveries = useStore((state) => state.setDeliveries);
  const monthlySummary = useStore((state) => state.monthlySummary);
  const setMonthlySummary = useStore((state) => state.setMonthlySummary);
  const customers = useStore((state) => state.customers);
  const setCustomers = useStore((state) => state.setCustomers);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);

  // Fetch deliveries, summary, and customers
  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Fetch customers if not loaded
      if (customers.length === 0) {
        const customersData = await customerApi.getCustomers(user.username);
        setCustomers(customersData);
      }

      // Fetch deliveries for current month
      const deliveriesData = await deliveryApi.getDeliveries(
        user.username,
        currentMonth
      );
      setDeliveries(deliveriesData);

      // Fetch monthly summary
      const summaryData = await summaryApi.getMonthlySummary(
        user.username,
        currentMonth
      );
      setMonthlySummary(summaryData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentMonth, user]);

  const handlePreviousMonth = () => {
    setCurrentMonth(getPreviousMonth(currentMonth));
  };

  const handleNextMonth = () => {
    setCurrentMonth(getNextMonth(currentMonth));
  };

  const handleToday = () => {
    setCurrentMonth(getCurrentMonthYear());
  };

  const handleDateClick = (dateString: string) => {
    setSelectedDate(dateString);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
  };

  const handleDeliverySaved = () => {
    fetchData(); // Refresh data after save
    handleModalClose();
  };

  const handleBillModalClose = () => {
    setIsBillModalOpen(false);
  };

  if (loading && deliveries.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Month Navigation */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {getMonthName(currentMonth)}
          </h2>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePreviousMonth}
              className="btn-secondary btn-sm"
            >
              ← Previous
            </button>
            
            <button
              onClick={handleToday}
              className="btn-primary btn-sm"
            >
              Today
            </button>
            
            <button
              onClick={handleNextMonth}
              className="btn-secondary btn-sm"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Customer Quick Info */}
      {customers.length > 0 && (
        <div className="card bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                👥 Active Customers
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {customers.length} Customer{customers.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard/customers')}
              className="btn-secondary btn-sm"
            >
              Manage →
            </button>
          </div>
        </div>
      )}

      {/* Monthly Summary */}
      <MonthlySummary summary={monthlySummary} loading={loading} />

      {/* Calendar */}
      <Calendar
        monthYear={currentMonth}
        deliveries={deliveries}
        onDateClick={handleDateClick}
      />

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">⚡ Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <button
            onClick={() => {
              setSelectedDate(null);
              setIsModalOpen(true);
            }}
            className="btn-primary flex items-center justify-center"
          >
            <span className="mr-2">➕</span>
            Add Delivery
          </button>
          
          <button
            onClick={() => setIsBillModalOpen(true)}
            className="btn-primary flex items-center justify-center bg-green-600 hover:bg-green-700"
          >
            <span className="mr-2">💵</span>
            Generate Bill
          </button>
          
          <button
            onClick={() => router.push('/dashboard/customers')}
            className="btn-secondary flex items-center justify-center"
          >
            <span className="mr-2">👥</span>
            Customers
          </button>
          
          <button
            onClick={() => router.push('/dashboard/analytics')}
            className="btn-secondary flex items-center justify-center"
          >
            <span className="mr-2">📊</span>
            Analytics
          </button>
          
          <button
            onClick={() => router.push('/dashboard/export')}
            className="btn-secondary flex items-center justify-center"
          >
            <span className="mr-2">💾</span>
            Export Data
          </button>
        </div>
      </div>

      {/* Delivery Modal */}
      {isModalOpen && (
        <DeliveryModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSave={handleDeliverySaved}
          selectedDate={selectedDate}
          existingDelivery={
            selectedDate
              ? deliveries.find((d) => d.delivery_date === selectedDate)
              : undefined
          }
        />
      )}

      {/* Bill Generator Modal */}
      {isBillModalOpen && (
        <BillGenerator
          isOpen={isBillModalOpen}
          onClose={handleBillModalClose}
        />
      )}
    </div>
  );
}
