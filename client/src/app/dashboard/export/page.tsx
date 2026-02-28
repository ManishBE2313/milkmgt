'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { exportApi } from '@/lib/api';
import { downloadFile, downloadJSON } from '@/utils/dateUtils';

export default function ExportPage() {
  const user = useStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);

  const handleExportJSON = async () => {
    if (!user) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await exportApi.exportAsJSON();
      const filename = `milk-data-${user.username}-${new Date().toISOString().split('T')[0]}.json`;
      downloadJSON(data, filename);
      setSuccess(`Data exported successfully! Includes ${data.deliveries.length} deliveries and ${data.customers.length} customers.`);
    } catch (err: any) {
      setError(err.message || 'Failed to export data');
      console.error('Error exporting JSON:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (!user) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const blob = await exportApi.exportAsCSV();
      const filename = `milk-data-${user.username}-${new Date().toISOString().split('T')[0]}.csv`;
      downloadFile(blob, filename);
      setSuccess('Data exported successfully as CSV!');
    } catch (err: any) {
      setError(err.message || 'Failed to export data');
      console.error('Error exporting CSV:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/json') {
        setError('Please select a valid JSON file');
        return;
      }
      setImportFile(file);
      setError('');
    }
  };

  const handleImport = async () => {
    if (!user || !importFile) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const fileContent = await importFile.text();
      const data = JSON.parse(fileContent);

      if (!data.deliveries || !Array.isArray(data.deliveries)) {
        throw new Error('Invalid file format. Expected { deliveries: [], customers: [] }');
      }

      const result = await exportApi.importFromJSON({
        deliveries: data.deliveries,
        customers: data.customers || [],
      });

      setSuccess(
        `Import completed! ${result.imported} created, ${result.updated} updated, ${result.errors} errors`
      );
      setImportFile(null);
    } catch (err: any) {
      setError(err.message || 'Failed to import data');
      console.error('Error importing data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          💾 Export & Import Data
        </h1>
        <button
          onClick={() => window.history.back()}
          className="btn-secondary"
        >
          ← Back
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Export Section */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">📤 Export Data</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Download your delivery and customer data in JSON or CSV format for backup or analysis.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleExportJSON}
            disabled={loading}
            className="btn-primary btn-lg flex items-center justify-center"
          >
            {loading ? (
              <span className="spinner mr-2"></span>
            ) : (
              <span className="mr-2">📄</span>
            )}
            Export as JSON
          </button>

          <button
            onClick={handleExportCSV}
            disabled={loading}
            className="btn-primary btn-lg flex items-center justify-center"
          >
            {loading ? (
              <span className="spinner mr-2"></span>
            ) : (
              <span className="mr-2">📊</span>
            )}
            Export as CSV
          </button>
        </div>

        <div className="mt-6 bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            💡 Export Formats
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>
              <strong>JSON:</strong> Complete data backup with user info, customers, and all deliveries
            </li>
            <li>
              <strong>CSV:</strong> Spreadsheet format for Excel or Google Sheets (deliveries with customer info)
            </li>
          </ul>
        </div>
      </div>

      {/* Import Section */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">📥 Import Data</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Import delivery and customer data from a JSON file. Existing entries will be updated.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Select JSON File
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="input"
            />
            {importFile && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Selected: {importFile.name}
              </p>
            )}
          </div>

          <button
            onClick={handleImport}
            disabled={loading || !importFile}
            className="btn-primary btn-lg w-full"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <span className="spinner mr-2"></span>
                Importing...
              </span>
            ) : (
              'Import Data'
            )}
          </button>
        </div>

        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg">
          <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
            ⚠️ Important Notes
          </h4>
          <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
            <li>• Only JSON files exported from this app are supported</li>
            <li>• Both customers and deliveries will be imported</li>
            <li>• Existing entries for the same dates/names will be updated</li>
            <li>• New entries will be created automatically</li>
            <li>• Make sure to backup your data before importing</li>
          </ul>
        </div>
      </div>

      {/* Info Section */}
      <div className="card bg-gray-50 dark:bg-gray-700">
        <h3 className="text-lg font-semibold mb-3">📋 Data Management Tips</h3>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li>✅ Export your data regularly for backup</li>
          <li>✅ Use CSV format for data analysis in spreadsheet apps</li>
          <li>✅ Use JSON format for complete backup with all metadata</li>
          <li>✅ Keep exported files in a safe location</li>
          <li>✅ Import can be used to restore data or migrate between devices</li>
          <li>✅ Customer data is included in exports for complete backup</li>
        </ul>
      </div>
    </div>
  );
}
