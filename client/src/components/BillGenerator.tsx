'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { billApi, customerApi } from '@/lib/api';
import { Customer } from '@/types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';


interface BillGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BillGenerator({ isOpen, onClose }: BillGeneratorProps) {
  const user = useStore((state) => state.user);
  const customers = useStore((state) => state.customers);
  const setCustomers = useStore((state) => state.setCustomers);

  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [periodType, setPeriodType] = useState<'this_month' | 'custom' | 'this_year'>('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [billData, setBillData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!user || customers.length > 0) return;
      try {
        const data = await customerApi.getCustomers(user.username);
        setCustomers(data);
      } catch (err) {
        console.error('Error fetching customers:', err);
      }
    };
    fetchCustomers();
  }, [user]);

  // Set date range based on period type
  useEffect(() => {
    const now = new Date();
    if (periodType === 'this_month') {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
      setStartDate(`${year}-${month}-01`);
      setEndDate(`${year}-${month}-${lastDay}`);
    } else if (periodType === 'this_year') {
      const year = now.getFullYear();
      setStartDate(`${year}-01-01`);
      setEndDate(`${year}-12-31`);
    }
  }, [periodType]);

  const handleGenerate = async () => {
    if (!user) return;

    if (!startDate || !endDate) {
      setError('Please select start and end dates');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date must be before end date');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await billApi.generateBillData(
        user.username,
        selectedCustomer,
        startDate,
        endDate
      );
      setBillData(data);
      setShowPreview(true);
    } catch (err: any) {
      setError(err.message || 'Failed to generate bill');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!billData || !user) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    autoTable(doc, {
      body: [
        [
          {
            content: 'MILK DELIVERY BILL',
            styles: {
              halign: 'center',
              fontSize: 20,
              textColor: '#ffffff',
              fontStyle: 'bold'
            }
          }
        ]
      ],
      theme: 'plain',
      styles: {
        fillColor: '#3b82f6'
      }
    });

    // Bill Info
    autoTable(doc, {
      body: [
        [
          {
            content: 
              `Bill To: ${billData.user.name}\n` +
              `Address: ${billData.user.address}\n` +
              `Customer: ${billData.bill.customer_name}`,
            styles: { halign: 'left' }
          },
          {
            content: 
              `Bill Date: ${new Date().toLocaleDateString()}\n` +
              `Period: ${new Date(billData.bill.period_start).toLocaleDateString()} - ${new Date(billData.bill.period_end).toLocaleDateString()}\n` +
              `Bill #: ${Date.now()}`,
            styles: { halign: 'right' }
          }
        ]
      ],
      theme: 'plain'
    });

    // Deliveries Table
    if (billData.bill.deliveries.length > 0) {
      autoTable(doc, {
        head: [['Date', 'Quantity (L)', 'Rate (₹/L)', 'Amount (₹)']],
        body: billData.bill.deliveries.map((d: any) => [
          new Date(d.date).toLocaleDateString(),
          d.quantity.toFixed(2),
          d.rate.toFixed(2),
          d.amount.toFixed(2)
        ]),
        theme: 'striped',
        headStyles: {
          fillColor: '#3b82f6'
        },
        foot: [
          ['', '', 'Total:', `₹${billData.bill.summary.total_amount.toFixed(2)}`]
        ],
        footStyles: {
          fillColor: '#e5e7eb',
          textColor: '#000000',
          fontStyle: 'bold'
        }
      });
    }

    // Summary
    autoTable(doc, {
      body: [
        [
          {
            content: 'SUMMARY',
            styles: {
              halign: 'left',
              fontSize: 14,
              fontStyle: 'bold'
            }
          }
        ]
      ],
      theme: 'plain'
    });

    autoTable(doc, {
      body: [
        ['Total Litres Delivered:', `${billData.bill.summary.total_litres.toFixed(2)} L`],
        ['Total Delivered Days:', billData.bill.summary.total_delivered_days],
        ['Total Absent Days:', billData.bill.summary.total_absent_days],
        ['Average Rate per Litre:', `₹${billData.bill.summary.average_rate.toFixed(2)}`],
        ['', ''],
        ['TOTAL AMOUNT:', `₹${billData.bill.summary.total_amount.toFixed(2)}`]
      ],
      theme: 'plain',
      styles: {
        fontSize: 11
      },
      bodyStyles: (data:any) => {
        if (data.row.index === 5) {
          return {
            fontSize: 14,
            fontStyle: 'bold',
            textColor: '#3b82f6'
          };
        }
        return {};
      }
    });

    // Absent Days Section
    if (billData.bill.absent_days.length > 0) {
      autoTable(doc, {
        body: [
          [
            {
              content: `ABSENT DAYS (${billData.bill.absent_days.length})`,
              styles: {
                halign: 'left',
                fontSize: 12,
                fontStyle: 'bold'
              }
            }
          ]
        ],
        theme: 'plain'
      });

      const absentDates = billData.bill.absent_days
        .map((d: any) => new Date(d.date).toLocaleDateString())
        .join(', ');

      autoTable(doc, {
        body: [[absentDates]],
        theme: 'plain',
        styles: {
          fontSize: 9,
          textColor: '#dc2626'
        }
      });
    }

    // Footer
    autoTable(doc, {
      body: [
        [
          {
            content: 
              'Thank you for your business!\n' +
              'For queries, contact: support@milkmanager.com',
            styles: {
              halign: 'center',
              fontSize: 10,
              textColor: '#6b7280'
            }
          }
        ]
      ],
      theme: 'plain'
    });

    // Save PDF
    const filename = `bill-${billData.bill.customer_name.replace(/\s+/g, '-')}-${startDate}-to-${endDate}.pdf`;
    doc.save(filename);
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
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {!showPreview ? (
            // Bill Configuration Form
            <div className="px-6 pt-5 pb-4">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                💵 Generate Bill
              </h3>

              {/* Customer Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Select Customer
                </label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="input"
                >
                  <option value="all">All Customers</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Period Type Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Select Period
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPeriodType('this_month')}
                    className={`px-4 py-2 rounded-lg border ${
                      periodType === 'this_month'
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    This Month
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriodType('this_year')}
                    className={`px-4 py-2 rounded-lg border ${
                      periodType === 'this_year'
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    This Year
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriodType('custom')}
                    className={`px-4 py-2 rounded-lg border ${
                      periodType === 'custom'
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    Custom Range
                  </button>
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input"
                    disabled={periodType !== 'custom'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input"
                    disabled={periodType !== 'custom'}
                  />
                </div>
              </div>

              {error && (
                <div className="mb-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>
          ) : (
            // Bill Preview
            <div className="px-6 pt-5 pb-4 max-h-[70vh] overflow-y-auto">
              <h3 className="text-xl font-semibold mb-4 text-center text-gray-900 dark:text-gray-100">
                📄 Bill Preview
              </h3>

              {billData && (
                <div className="space-y-4">
                  {/* Bill Header */}
                  <div className="bg-primary-600 text-white p-4 rounded-lg">
                    <h2 className="text-2xl font-bold text-center">MILK DELIVERY BILL</h2>
                  </div>

                  {/* Bill Info */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="text-sm"><strong>Bill To:</strong> {billData.user.name}</p>
                      <p className="text-sm"><strong>Address:</strong> {billData.user.address}</p>
                      <p className="text-sm"><strong>Customer:</strong> {billData.bill.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm"><strong>Bill Date:</strong> {new Date().toLocaleDateString()}</p>
                      <p className="text-sm"><strong>Period:</strong> {new Date(billData.bill.period_start).toLocaleDateString()} - {new Date(billData.bill.period_end).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Deliveries Table */}
                  {billData.bill.deliveries.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Quantity (L)</th>
                            <th>Rate (₹/L)</th>
                            <th>Amount (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {billData.bill.deliveries.map((d: any, index: number) => (
                            <tr key={index}>
                              <td>{new Date(d.date).toLocaleDateString()}</td>
                              <td>{d.quantity.toFixed(2)}</td>
                              <td>{d.rate.toFixed(2)}</td>
                              <td>₹{d.amount.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                    <h4 className="font-semibold mb-2">SUMMARY</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Total Litres:</span>
                        <span>{billData.bill.summary.total_litres.toFixed(2)} L</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivered Days:</span>
                        <span>{billData.bill.summary.total_delivered_days}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Absent Days:</span>
                        <span className="text-red-600">{billData.bill.summary.total_absent_days}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average Rate:</span>
                        <span>₹{billData.bill.summary.average_rate.toFixed(2)}/L</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-blue-200 dark:border-blue-700 text-lg font-bold text-primary-600 dark:text-primary-400">
                        <span>TOTAL AMOUNT:</span>
                        <span>₹{billData.bill.summary.total_amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Absent Days */}
                  {billData.bill.absent_days.length > 0 && (
                    <div className="p-4 bg-red-50 dark:bg-red-900 rounded-lg">
                      <h4 className="font-semibold mb-2 text-red-700 dark:text-red-200">
                        ABSENT DAYS ({billData.bill.absent_days.length})
                      </h4>
                      <p className="text-sm text-red-600 dark:text-red-300">
                        {billData.bill.absent_days.map((d: any) => new Date(d.date).toLocaleDateString()).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-between">
            {!showPreview ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Generating...' : 'Generate Preview'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setShowPreview(false);
                    setBillData(null);
                  }}
                  className="btn-secondary"
                >
                  ← Back to Edit
                </button>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={downloadPDF}
                    className="btn-primary"
                  >
                    📥 Download PDF
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
