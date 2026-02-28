'use client';

import { useMemo, useState } from 'react';
import { Delivery, DeliveryStatus } from '@/types';
import {
  getCalendarDays,
  isCurrentMonth,
  formatDate,
  getStatusEmoji,
} from '@/utils/dateUtils';

interface CalendarProps {
  monthYear: string;
  deliveries: Delivery[];
  onDateClick: (dateString: string) => void;
  onQuickAdd: () => void;
}

const statusPriority: Record<DeliveryStatus, number> = {
  delivered: 1,
  mixed: 2,
  absent: 3,
  no_entry: 4,
};

export default function Calendar({
  monthYear,
  deliveries,
  onDateClick,
  onQuickAdd,
}: CalendarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const calendarDays = getCalendarDays(monthYear);
  const todayString = formatDate(new Date());

  const deliveryMap = useMemo(() => {
    const map = new Map<string, Delivery[]>();

    for (const delivery of deliveries) {
      const existing = map.get(delivery.delivery_date) || [];
      existing.push(delivery);
      map.set(delivery.delivery_date, existing);
    }

    for (const [key, values] of map) {
      values.sort((a, b) => {
        const p = statusPriority[a.status] - statusPriority[b.status];
        if (p !== 0) return p;
        if ((a.customer_name || '') < (b.customer_name || '')) return -1;
        if ((a.customer_name || '') > (b.customer_name || '')) return 1;
        return Number(b.quantity) - Number(a.quantity);
      });
      map.set(key, values);
    }

    return map;
  }, [deliveries]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const legendItems = [
    { emoji: '✅', label: 'Delivered', description: 'Milk delivered successfully' },
    { emoji: '❌', label: 'Absent', description: 'Customer not available' },
    { emoji: '⚪', label: 'Mixed', description: 'Partial or mixed status' },
    { emoji: '⏺', label: 'No Entry', description: 'No status recorded' },
  ];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Delivery Calendar
        </h3>

        <div className="flex items-center gap-2">
          <button type="button" onClick={onQuickAdd} className="btn-primary btn-sm">
            + Add Delivery
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="btn-secondary btn-sm"
          >
            {collapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
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

          <div className="grid grid-cols-7 gap-2 mb-6">
            {calendarDays.map((date, index) => {
              const dateString = formatDate(date);
              const dayDeliveries = deliveryMap.get(dateString) || [];
              const isToday = dateString === todayString;
              const isInCurrentMonth = isCurrentMonth(date, monthYear);
              const totalLitres = dayDeliveries
                .filter((d) => d.status === 'delivered')
                .reduce((sum, d) => sum + Number(d.quantity), 0);

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => onDateClick(dateString)}
                  className={`
                    group relative calendar-day
                    ${isInCurrentMonth ? 'calendar-day-current' : 'calendar-day-other-month'}
                    ${isToday ? 'calendar-day-today' : ''}
                    ${!isInCurrentMonth ? 'opacity-50' : ''}
                  `}
                >
                  <div className="text-sm font-medium mb-1">{date.getDate()}</div>

                  {dayDeliveries.length > 0 && (
                    <div className="flex flex-col items-center space-y-1">
                      <div className="flex items-center gap-1">
                        {dayDeliveries.slice(0, 2).map((delivery) => (
                          <span key={delivery.id} className="text-base">
                            {getStatusEmoji(delivery.status)}
                          </span>
                        ))}
                        {dayDeliveries.length > 2 && (
                          <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">
                            +{dayDeliveries.length - 2}
                          </span>
                        )}
                      </div>
                      {totalLitres > 0 && (
                        <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">
                          {totalLitres.toFixed(1)}L
                        </span>
                      )}
                    </div>
                  )}

                  {dayDeliveries.length > 0 && (
                    <div className="pointer-events-none absolute left-1/2 top-full z-30 hidden w-64 -translate-x-1/2 rounded-2xl border border-white/50 bg-white/90 p-3 text-left shadow-xl backdrop-blur-md group-hover:block dark:border-slate-700/70 dark:bg-slate-900/90">
                      <p className="mb-2 text-xs font-semibold text-gray-900 dark:text-gray-100">
                        {dateString} · {dayDeliveries.length} entr{dayDeliveries.length > 1 ? 'ies' : 'y'}
                      </p>
                      <div className="space-y-1.5">
                        {dayDeliveries.map((delivery) => (
                          <div
                            key={delivery.id}
                            className="rounded-xl bg-white/60 px-2 py-1 dark:bg-slate-800/70"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-gray-800 dark:text-gray-100">
                                {getStatusEmoji(delivery.status)} {delivery.customer_name || 'No customer'}
                              </span>
                              <span className="text-gray-600 dark:text-gray-300">
                                {Number(delivery.quantity).toFixed(1)}L
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">
              Status Guide
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {legendItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center space-x-3 p-3 rounded-2xl bg-white/30 dark:bg-white/5"
                >
                  <div className="flex-shrink-0">
                    <span className="text-2xl">{item.emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-900/30">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                Tip: Hover a day to see sorted details. Click a day to open delivery form.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
