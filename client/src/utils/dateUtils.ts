import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addDays, subDays } from 'date-fns';
import { CalendarDay, DeliveryStatus } from '../types';

// Format date to YYYY-MM-DD
export const formatDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

// Format date to display format (e.g., "Jan 15, 2025")
export const formatDisplayDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MMM dd, yyyy');
};

// Get current month in YYYY-MM format
export const getCurrentMonthYear = (): string => {
  return format(new Date(), 'yyyy-MM');
};

// Parse month-year string to Date
export const parseMonthYear = (monthYear: string): Date => {
  const [year, month] = monthYear.split('-');
  return new Date(parseInt(year), parseInt(month) - 1, 1);
};

// Get month name from YYYY-MM
export const getMonthName = (monthYear: string): string => {
  const date = parseMonthYear(monthYear);
  return format(date, 'MMMM yyyy');
};

// Get all days in a month for calendar view
export const getCalendarDays = (monthYear: string): Date[] => {
  const date = parseMonthYear(monthYear);
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  
  // Get all days in the month
  const daysInMonth = eachDayOfInterval({ start, end });
  
  // Add padding days from previous month to start on Sunday
  const firstDayOfWeek = getDay(start);
  const paddingStart: Date[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    paddingStart.unshift(subDays(start, i + 1));
  }
  
  // Add padding days from next month to complete the last week
  const lastDayOfWeek = getDay(end);
  const paddingEnd: Date[] = [];
  for (let i = 1; i < 7 - lastDayOfWeek; i++) {
    paddingEnd.push(addDays(end, i));
  }
  
  return [...paddingStart, ...daysInMonth, ...paddingEnd];
};

// Check if date is in current month
export const isCurrentMonth = (date: Date, monthYear: string): boolean => {
  return format(date, 'yyyy-MM') === monthYear;
};

// Get delivery status emoji
export const getStatusEmoji = (status: DeliveryStatus): string => {
  switch (status) {
    case 'delivered':
      return '✅';
    case 'absent':
      return '❌';
    case 'mixed':
      return '⚪';
    case 'no_entry':
      return '⏺';
    default:
      return '⏺';
  }
};

// Get status color for Tailwind classes
export const getStatusColor = (status: DeliveryStatus): string => {
  switch (status) {
    case 'delivered':
      return 'bg-green-500';
    case 'absent':
      return 'bg-red-500';
    case 'mixed':
      return 'bg-yellow-500';
    case 'no_entry':
      return 'bg-gray-400';
    default:
      return 'bg-gray-400';
  }
};

// Get previous month in YYYY-MM format
export const getPreviousMonth = (monthYear: string): string => {
  const date = parseMonthYear(monthYear);
  date.setMonth(date.getMonth() - 1);
  return format(date, 'yyyy-MM');
};

// Get next month in YYYY-MM format
export const getNextMonth = (monthYear: string): string => {
  const date = parseMonthYear(monthYear);
  date.setMonth(date.getMonth() + 1);
  return format(date, 'yyyy-MM');
};

// Download file helper
export const downloadFile = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

// Download JSON data
export const downloadJSON = (data: any, filename: string): void => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  downloadFile(blob, filename);
};
