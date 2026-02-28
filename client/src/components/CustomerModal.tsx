'use client';

import { useState, useEffect } from 'react';
import { customerApi } from '@/lib/api';
import { Customer, CreateCustomerInput } from '@/types';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  existingCustomer?: Customer;
}

export default function CustomerModal({
  isOpen,
  onClose,
  onSave,
  existingCustomer,
}: CustomerModalProps) {
  const [formData, setFormData] = useState<CreateCustomerInput>({
    name: '',
    address: '',
    contact: '',
    rate_per_litre: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (existingCustomer) {
      setFormData({
        name: existingCustomer.name,
        address: existingCustomer.address || '',
        contact: existingCustomer.contact || '',
        rate_per_litre: existingCustomer.rate_per_litre,
      });
    } else {
      setFormData({
        name: '',
        address: '',
        contact: '',
        rate_per_litre: 0,
      });
    }
    setError('');
    setDeleteConfirm(false);
  }, [existingCustomer, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || formData.rate_per_litre <= 0) {
      setError('Name and Rate per Litre are required');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (existingCustomer) {
        await customerApi.updateCustomer(existingCustomer.id, formData);
      } else {
        await customerApi.createCustomer(formData);
      }
      onSave();
    } catch (err: any) {
      setError(err.message || 'Failed to save customer');
      console.error('Error saving customer:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingCustomer) return;

    setLoading(true);
    setError('');

    try {
      await customerApi.deleteCustomer(existingCustomer.id);
      onSave();
    } catch (err: any) {
      setError(err.message || 'Failed to delete customer');
      console.error('Error deleting customer:', err);
    } finally {
      setLoading(false);
    }
  };

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
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="px-6 pt-5 pb-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                {existingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h3>

              {/* Name - Required */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input"
                  placeholder="Customer name"
                  required
                />
              </div>

              {/* Rate Per Litre - Required */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Rate per Litre (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.rate_per_litre || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rate_per_litre: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="input"
                  placeholder="e.g., 55.00"
                  required
                />
              </div>

              {/* Address - Optional */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Address <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="input"
                  rows={2}
                  placeholder="Customer address"
                />
              </div>

              {/* Contact - Optional */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Contact <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) =>
                    setFormData({ ...formData, contact: e.target.value })
                  }
                  className="input"
                  placeholder="Phone number"
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
              {existingCustomer && (
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
