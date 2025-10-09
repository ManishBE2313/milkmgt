'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { customerApi } from '@/lib/api';
import CustomerModal from '@/components/CustomerModal';
import CustomerDeliveryHistory from '@/components/CustomerDeliveryHistory';
import { Customer } from '@/types';

export default function CustomersPage() {
  const router = useRouter();
  const user = useStore((state) => state.user);
  const customers = useStore((state) => state.customers);
  const setCustomers = useStore((state) => state.setCustomers);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);

  const fetchCustomers = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const data = await customerApi.getCustomers(user.username);
      setCustomers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch customers');
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [user]);

  const handleAddCustomer = () => {
    setSelectedCustomer(undefined);
    setIsModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleViewHistory = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    setSelectedCustomer(customer);
    setIsHistoryModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedCustomer(undefined);
  };

  const handleHistoryModalClose = () => {
    setIsHistoryModalOpen(false);
    setSelectedCustomer(undefined);
  };

  const handleCustomerSaved = () => {
    fetchCustomers();
    handleModalClose();
  };

  if (loading && customers.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          👥 Customer Management
        </h1>
        <button
          onClick={() => router.push('/dashboard')}
          className="btn-secondary"
        >
          ← Back
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Add Customer Button */}
      <div className="card">
        <button
          onClick={handleAddCustomer}
          className="btn-primary w-full sm:w-auto"
        >
          ➕ Add New Customer
        </button>
      </div>

      {/* Customers List */}
      {customers.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
              No Customers Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Add your first customer to start tracking deliveries with custom rates.
            </p>
            <button onClick={handleAddCustomer} className="btn-primary">
              Add First Customer
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="card card-hover cursor-pointer"
              onClick={() => handleEditCustomer(customer)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    {customer.name}
                  </h3>
                  <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    ₹{Number(customer.rate_per_litre).toFixed(2)}/L
                  </p>
                </div>
                <div className="text-4xl">👤</div>
              </div>

              {customer.address && (
                <div className="mb-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                    <span className="mr-2">📍</span>
                    <span className="line-clamp-2">{customer.address}</span>
                  </p>
                </div>
              )}

              {customer.contact && (
                <div className="mb-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    <span className="mr-2">📞</span>
                    <span>{customer.contact}</span>
                  </p>
                </div>
              )}

              {/* Delivery History Button */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={(e) => handleViewHistory(customer, e)}
                  className="btn-secondary btn-sm w-full"
                >
                  📊 View Delivery History
                </button>
              </div>

              <div className="mt-2">
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Added {new Date(customer.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {customers.length > 0 && (
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            📊 Customer Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {customers.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ₹
                {(
                  customers.reduce((sum, c) => sum + Number(c.rate_per_litre), 0) /
                  customers.length
                ).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Lowest Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ₹{Math.min(...customers.map((c) => Number(c.rate_per_litre))).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Highest Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ₹{Math.max(...customers.map((c) => Number(c.rate_per_litre))).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Customer Modal */}
      {isModalOpen && (
        <CustomerModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSave={handleCustomerSaved}
          existingCustomer={selectedCustomer}
        />
      )}

      {/* Delivery History Modal */}
      {isHistoryModalOpen && selectedCustomer && (
        <CustomerDeliveryHistory
          isOpen={isHistoryModalOpen}
          onClose={handleHistoryModalClose}
          customer={selectedCustomer}
        />
      )}
    </div>
  );
}
