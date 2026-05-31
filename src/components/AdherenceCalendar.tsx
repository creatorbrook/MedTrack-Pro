// Handcrafting date helpers is extremely clean, highly performant, and reliable!
const isSameDay = (d1: Date, d2: Date) => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

import { Calendar, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { IntakeLog, Medication } from '../types';

interface AdherenceCalendarProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  logs: IntakeLog[];
  medications: Medication[];
}

// Visual calendar generator
export function AdherenceCalendar({
  selectedDate,
  setSelectedDate,
  logs,
  medications,
}: AdherenceCalendarProps) {
  // Generate 7 days of the relative week to show
  const getDaysOfWeek = () => {
    const today = new Date();
    const days: Date[] = [];
    
    // Start of current week (Monday)
    const current = new Date(today);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(current.setDate(diff));

    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      days.push(nextDay);
    }
    return days;
  };

  const days = getDaysOfWeek();

  // Helper formatting
  const formatDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getDayShortName = (date: Date) => {
    const daysArr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return daysArr[date.getDay()];
  };

  // Compute status metrics for a specific date
  const getDateStatusMetrics = (targetDate: Date) => {
    const dateStr = formatDateString(targetDate);
    const activeMeds = medications.filter(m => m.active);
    
    if (activeMeds.length === 0) return 'none';

    // Calculate total scheduled dose instances for this date
    let totalScheduledDoses = 0;
    activeMeds.forEach(m => {
      totalScheduledDoses += m.times.length;
    });

    if (totalScheduledDoses === 0) return 'none';

    // Find logs of this date
    const dateLogs = logs.filter(l => l.date === dateStr);
    const takenCount = dateLogs.filter(l => l.status === 'taken').length;
    const missedCount = dateLogs.filter(l => l.status === 'missed').length;

    if (takenCount === totalScheduledDoses) return 'all-taken';
    if (takenCount > 0) return 'partial';
    if (missedCount > 0) return 'missed';
    return 'pending';
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  return (
    <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-6" id="adherence-calendar-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h4 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-indigo-500" />
            Adherence Journey
          </h4>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-wider">
            CHOOSE DATE TO VIEW HISTORIC LOGS
          </p>
        </div>

        {/* Calendar legend */}
        <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-500 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 opacity-80 inline-block"></span> Taken
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 opacity-80 inline-block"></span> Partial
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 opacity-80 inline-block"></span> Missed
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200 inline-block"></span> Scheduled
          </span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
        {days.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const metricsStatus = getDateStatusMetrics(day);
          
          let ringColor = 'border-transparent';
          let statusBg = 'bg-slate-100/50 text-slate-600 hover:bg-slate-100';

          if (metricsStatus === 'all-taken') {
            statusBg = 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100';
          } else if (metricsStatus === 'partial') {
            statusBg = 'bg-amber-50 text-amber-700 border border-amber-200/50 hover:bg-amber-100';
          } else if (metricsStatus === 'missed') {
            statusBg = 'bg-rose-50 text-rose-700 border border-rose-200/30 hover:bg-rose-100';
          } else if (metricsStatus === 'pending') {
            statusBg = 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-150';
          }

          if (isSelected) {
            ringColor = 'ring-2 ring-indigo-500 ring-offset-2';
          }

          return (
            <button
               id={`calendar-day-${day.getDate()}`}
              key={day.toISOString()}
              onClick={() => handleDateClick(day)}
              className={`flex flex-col items-center py-3.5 rounded-2xl transition duration-150 relative cursor-pointer ${statusBg} ${ringColor}`}
            >
              <span className="text-[10px] font-bold tracking-tight text-slate-500">
                {getDayShortName(day)}
              </span>
              <span className="text-base font-black mt-1.5 leading-none">
                {day.getDate()}
              </span>

              {/* Little Today Indicator Dot */}
              {isToday && (
                <span className="absolute bottom-2.5 w-1.5 h-1.5 rounded-full bg-indigo-650"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
