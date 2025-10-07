'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { deliveryApi, customerApi } from '@/lib/api';
import { Delivery, DeliveryStatus, CreateDeliveryInput } from '@/types';
import { formatDate, formatDisplayDate } from '@/utils/dateUtils';

interface DeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  selectedDate: string | null;
  existingDelivery?: Delivery;
}

export default function DeliveryModal({
  isOpen,
  onClose,
  onSave,
  selectedDate,
  existingDelivery,
}: DeliveryModalProps) {
  const user = useStore((state) => state.user);
  const currentMonth = useStore((state) => state.currentMonth);
  const customers = useStore((state) => state.customers);
  const setCustomers = useStore((state) => state.setCustomers);

  const [formData, setFormData] = useState<CreateDeliveryInput>({
    delivery_date: selectedDate || formatDate(new Date()),
    quantity: 0,
    status: 'delivered',
    month_year: currentMonth,
    customer_id: undefined,
    rate_per_litre: undefined,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Fetch customers on mount
  useEffect(() => {
    const fetchCustomers = async () => {
      if (!user) return;
      try {
        const data = await customerApi.getCustomers(user.username);
        setCustomers(data);
      } catch (err) {
        console.error('Error fetching customers:', err);
      }
    };

    if (customers.length === 0) {
      fetchCustomers();
    }
  }, [user]);

  useEffect(() => {
    if (existingDelivery) {
      setFormData({
        delivery_date: existingDelivery.delivery_date,
        quantity: existingDelivery.quantity,
        status: existingDelivery.status,
        month_year: existingDelivery.month_year,
        customer_id: existingDelivery.customer_id || undefined,
        rate_per_litre: existingDelivery.rate_per_litre || undefined,
      });
    } else if (selectedDate) {
      setFormData({
        delivery_date: selectedDate,
        quantity: 0,
        status: 'delivered',
        month_year: currentMonth,
        customer_id: undefined,
        rate_per_litre: undefined,
      });
    }
  }, [existingDelivery, selectedDate, currentMonth]);

  // Auto-fill rate when customer is selected
  const handleCustomerChange = (customerId: string) => {
    const id = customerId ? parseInt(customerId) : undefined;
    setFormData({ ...formData, customer_id: id });

    if (id) {
      const customer = customers.find((c) => c.id === id);
      if (customer) {
        setFormData((prev) => ({
          ...prev,
          customer_id: id,
          rate_per_litre: customer.rate_per_litre,
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      await deliveryApi.createOrUpdateDelivery(user.username, formData);
      onSave();
    } catch (err: any) {
      setError(err.message || 'Failed to save delivery');
      console.error('Error saving delivery:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !existingDelivery) return;

    setLoading(true);
    setError('');

    try {
      await deliveryApi.deleteDelivery(user.username, existingDelivery.delivery_date);
      onSave();
    } catch (err: any) {
      setError(err.message || 'Failed to delete delivery');
      console.error('Error deleting delivery:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedCustomer = customers.find((c) => c.id === formData.customer_id);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="px-6 pt-5 pb-4">
              <h3 className="text-lg font-semibold mb-4">
                {existingDelivery ? 'Edit Delivery' : 'Add Delivery'}
              </h3>

              {/* Date Display */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Date</label>
                <div className="input bg-gray-100 dark:bg-gray-700">
                  {formatDisplayDate(formData.delivery_date)}
                </div>
              </div>

              {/* Customer Selection - NEW */}
              {customers.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Customer <span className="text-gray-500 text-xs">(Optional)</span>
                  </label>
                  <select
                    value={formData.customer_id || ''}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="input"
                  >
                    <option value="">-- No Customer --</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} (₹{Number(customer.rate_per_litre).toFixed(2)}/L)
                      </option>
                    ))}

                  </select>
                  {selectedCustomer && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Rate auto-filled: ₹{Number(selectedCustomer.rate_per_litre).toFixed(2)}/L
                    </p>
                  )}

                </div>
              )}

              {/* Status */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as DeliveryStatus })
                  }
                  className="input"
                  required
                >
                  <option value="delivered">✅ Delivered</option>
                  <option value="absent">❌ Absent</option>
                  <option value="mixed">⚪ Mixed</option>
                  <option value="no_entry">⏺ No Entry</option>
                </select>
              </div>

              {/* Quantity */}
              {formData.status === 'delivered' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Quantity (Litres)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })
                    }
                    className="input"
                    placeholder="e.g., 2.5"
                    required
                  />
                </div>
              )}

              {/* Rate Per Litre */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Rate per Litre (₹) <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.rate_per_litre || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rate_per_litre: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="input"
                  placeholder="e.g., 55.00"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex flex-col sm:flex-row justify-between gap-3">
              {/* Delete Button */}
              {existingDelivery && (
                <div>
                  {!deleteConfirm ? (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(true)}
                      className="btn-danger btn-sm"
                    >
                      Delete
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={loading}
                        className="btn-danger btn-sm"
                      >
                        Confirm Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(false)}
                        className="btn-secondary btn-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Save/Cancel Buttons */}
              <div className="flex space-x-3 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
