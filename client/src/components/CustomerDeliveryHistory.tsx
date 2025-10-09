'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { customerApi } from '@/lib/api';
import { Customer } from '@/types';
import { getCurrentMonthYear, getPreviousMonth, getMonthName } from '@/utils/dateUtils';

interface CustomerDeliveryHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
}

export default function CustomerDeliveryHistory({
  isOpen,
  onClose,
  customer,
}: CustomerDeliveryHistoryProps) {
  const user = useStore((state) => state.user);
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthYear());
  const [historyData, setHistoryData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Generate last 6 months options
  const getMonthOptions = () => {
    const options = [];
    let currentMonth = getCurrentMonthYear();
    for (let i = 0; i < 6; i++) {
      options.push(currentMonth);
      currentMonth = getPreviousMonth(currentMonth);
    }
    return options;
  };

  const monthOptions = getMonthOptions();

  const fetchHistory = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const data = await customerApi.getCustomerDeliveryHistory(
        user.username,
        customer.id,
        selectedMonth
      );
      setHistoryData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch delivery history');
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, selectedMonth]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="px-6 pt-5 pb-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  📊 Delivery History
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {customer.name} - ₹{Number(customer.rate_per_litre).toFixed(2)}/L
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            {/* Month Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Select Period
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="input"
              >
                {monthOptions.map((month) => (
                  <option key={month} value={month}>
                    {getMonthName(month)}
                  </option>
                ))}
              </select>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="spinner"></div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {/* History Data */}
            {!loading && historyData && (
              <div className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Litres</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {historyData.summary.total_litres.toFixed(1)} L
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 dark:bg-green-900 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Delivered Days</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {historyData.summary.total_delivered_days}
                    </p>
                  </div>

                  <div className="p-4 bg-red-50 dark:bg-red-900 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Absent Days</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {historyData.summary.total_absent_days}
                    </p>
                  </div>

                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Amount</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      ₹{historyData.summary.total_amount.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Deliveries Table */}
                {historyData.deliveries.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Quantity (L)</th>
                          <th>Rate (₹/L)</th>
                          <th>Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyData.deliveries.map((delivery: any, index: number) => (
                          <tr key={index}>
                            <td>{new Date(delivery.date).toLocaleDateString('en-IN')}</td>
                            <td>
                              {delivery.status === 'delivered' && (
                                <span className="status-delivered">✅ Delivered</span>
                              )}
                              {delivery.status === 'absent' && (
                                <span className="status-absent">❌ Absent</span>
                              )}
                            </td>
                            <td>{delivery.quantity.toFixed(2)}</td>
                            <td>₹{delivery.rate.toFixed(2)}</td>
                            <td className="font-semibold">₹{delivery.amount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-6xl mb-4">📦</div>
                    <p>No deliveries found for {getMonthName(selectedMonth)}</p>
                  </div>
                )}

                {/* Average Rate Info */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Average Rate (This Period)
                    </span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      ₹{historyData.summary.average_rate.toFixed(2)}/L
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
