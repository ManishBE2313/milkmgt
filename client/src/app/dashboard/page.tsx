'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { deliveryApi, summaryApi, customerApi } from '@/lib/api';
import Calendar from '@/components/Calendar';
import MonthlySummary from '@/components/MonthlySummary';
import DeliveryModal from '@/components/DeliveryModal';
import BillGenerator from '@/components/BillGenerator';
import {
  getCurrentMonthYear,
  getMonthName,
  getPreviousMonth,
  getNextMonth,
} from '@/utils/dateUtils';

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

  const fetchData = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      if (customers.length === 0) {
        const customersData = await customerApi.getCustomers();
        setCustomers(customersData);
      }

      const deliveriesData = await deliveryApi.getDeliveries(currentMonth);
      setDeliveries(deliveriesData);

      const summaryData = await summaryApi.getMonthlySummary(currentMonth);
      setMonthlySummary(summaryData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentMonth, user]);

  const handlePreviousMonth = () => setCurrentMonth(getPreviousMonth(currentMonth));
  const handleNextMonth = () => setCurrentMonth(getNextMonth(currentMonth));
  const handleToday = () => setCurrentMonth(getCurrentMonthYear());

  const handleDateClick = (dateString: string) => {
    setSelectedDate(dateString);
    setIsModalOpen(true);
  };

  const handleQuickAdd = () => {
    setSelectedDate(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
  };

  const handleDeliverySaved = () => {
    fetchData();
    handleModalClose();
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
      <div className="card">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary-600">Current Period</p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {getMonthName(currentMonth)}
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <button onClick={handlePreviousMonth} className="btn-secondary btn-sm">
              Previous
            </button>

            <button onClick={handleToday} className="btn-primary btn-sm">
              Current
            </button>

            <button onClick={handleNextMonth} className="btn-secondary btn-sm">
              Next
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-100/70 dark:bg-red-900/60 text-red-700 dark:text-red-200 px-4 py-3">
          {error}
        </div>
      )}

      {customers.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Customers
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {customers.length} Customer{customers.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard/customers')}
              className="btn-secondary btn-sm"
            >
              Manage
            </button>
          </div>
        </div>
      )}

      <MonthlySummary summary={monthlySummary} loading={loading} onRateUpdated={fetchData} />

      <Calendar
        monthYear={currentMonth}
        deliveries={deliveries}
        onDateClick={handleDateClick}
        onQuickAdd={handleQuickAdd}
      />

      <div className="card">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <button
            onClick={() => {
              handleQuickAdd();
            }}
            className="btn-primary"
          >
            Add Delivery
          </button>

          <button
            onClick={() => setIsBillModalOpen(true)}
            className="btn-primary"
          >
            Generate Bill
          </button>

          <button
            onClick={() => router.push('/dashboard/customers')}
            className="btn-secondary"
          >
            Customers
          </button>

          <button
            onClick={() => router.push('/dashboard/analytics')}
            className="btn-secondary"
          >
            Analytics
          </button>

          <button
            onClick={() => router.push('/dashboard/export')}
            className="btn-secondary"
          >
            Export Data
          </button>
        </div>
      </div>

      {isModalOpen && (
        <DeliveryModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSave={handleDeliverySaved}
          selectedDate={selectedDate}
          existingDelivery={
            selectedDate
              ? (() => {
                  const dayDeliveries = deliveries.filter(
                    (d) => d.delivery_date === selectedDate
                  );
                  return dayDeliveries.length === 1 ? dayDeliveries[0] : undefined;
                })()
              : undefined
          }
        />
      )}

      {isBillModalOpen && (
        <BillGenerator
          isOpen={isBillModalOpen}
          onClose={() => setIsBillModalOpen(false)}
        />
      )}
    </div>
  );
}
