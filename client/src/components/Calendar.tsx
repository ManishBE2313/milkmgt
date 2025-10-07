'use client';

import { Delivery, DeliveryStatus } from '@/types';
import {
  getCalendarDays,
  isCurrentMonth,
  formatDate,
  getStatusEmoji,
  getStatusColor,
} from '@/utils/dateUtils';

interface CalendarProps {
  monthYear: string;
  deliveries: Delivery[];
  onDateClick: (dateString: string) => void;
}

export default function Calendar({
  monthYear,
  deliveries,
  onDateClick,
}: CalendarProps) {
  const calendarDays = getCalendarDays(monthYear);
  const today = new Date();
  const todayString = formatDate(today);

  // Create a map of deliveries by date for quick lookup
  const deliveryMap = new Map<string, Delivery>();
  deliveries.forEach((delivery) => {
    deliveryMap.set(delivery.delivery_date, delivery);
  });

  const getDeliveryForDate = (date: Date): Delivery | undefined => {
    const dateString = formatDate(date);
    return deliveryMap.get(dateString);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const legendItems = [
    { emoji: '✅', label: 'Delivered', status: 'delivered' },
    { emoji: '❌', label: 'Absent', status: 'absent' },
    { emoji: '⚪', label: 'Mixed', status: 'mixed' },
    { emoji: '⏺', label: 'No Entry', status: 'no_entry' },
  ];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          📅 Delivery Calendar
        </h3>
        
        {/* Compact Legend for Desktop */}
        <div className="hidden md:flex items-center space-x-4 text-sm">
          {legendItems.map((item, index) => (
            <div key={index} className="flex items-center space-x-1">
              <span className="text-lg">{item.emoji}</span>
              <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Week Day Headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {calendarDays.map((date, index) => {
          const dateString = formatDate(date);
          const delivery = getDeliveryForDate(date);
          const isToday = dateString === todayString;
          const isInCurrentMonth = isCurrentMonth(date, monthYear);

          return (
            <button
              key={index}
              onClick={() => onDateClick(dateString)}
              className={`
                calendar-day
                ${isInCurrentMonth ? 'calendar-day-current' : 'calendar-day-other-month'}
                ${isToday ? 'calendar-day-today' : ''}
                ${!isInCurrentMonth ? 'opacity-50' : ''}
                hover:ring-2 hover:ring-primary-300 dark:hover:ring-primary-600
              `}
            >
              <div className="text-sm font-medium mb-1">
                {date.getDate()}
              </div>

              {delivery && (
                <div className="flex flex-col items-center space-y-1">
                  <span className="text-2xl">
                    {getStatusEmoji(delivery.status)}
                  </span>
                  {delivery.status === 'delivered' && delivery.quantity > 0 && (
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {delivery.quantity}L
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Detailed Legend Section */}
      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">
          📋 Status Legend
        </h4>
        
        {/* Legend Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {legendItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex-shrink-0">
                <span className="text-3xl">{item.emoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {item.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.status === 'delivered' && 'Milk delivered'}
                  {item.status === 'absent' && 'Customer absent'}
                  {item.status === 'mixed' && 'Partial delivery'}
                  {item.status === 'no_entry' && 'No data recorded'}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 dark:text-blue-400 text-sm">💡</span>
            <div className="flex-1">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <strong>Tip:</strong> Click on any date to add or edit delivery information. 
                Today's date is highlighted with a blue ring.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
