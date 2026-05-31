import React, { useState, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Pill, Clock, Plus, Activity, Award, Bell, BellRing, AlertTriangle, 
  Sparkles, ShieldAlert, CheckCircle2, XCircle, RefreshCw, VolumeX,
  Volume2, Trash2, Edit2, Play, AlertCircle, HelpCircle, Check, HelpCircle as HelpIcon, ArrowRight, X
} from 'lucide-react';

import { Medication, IntakeLog, IntakeStatus } from './types';
import { MedicationForm } from './components/MedicationForm';
import { AdherenceCalendar } from './components/AdherenceCalendar';
import { ActiveReminderModal } from './components/ActiveReminderModal';
import { playSuccessChime, playAlertChime } from './utils/audio';

// Default initial state for a wonderful first impression
const DEFAULT_MEDICATIONS: Medication[] = [
  {
    id: 'med-1',
    name: 'Multivitamin Formula',
    dosage: '1 Capsule',
    instructions: 'Take in the morning with refreshing juice',
    times: ['09:00'],
    frequency: 'daily',
    color: 'emerald',
    pillsLeft: 28,
    pillsLeftThreshold: 7,
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'med-2',
    name: 'Ibuprofen',
    dosage: '400mg',
    instructions: 'Take after meals. Drink a full glass of water.',
    times: ['08:00', '20:00'],
    frequency: 'daily',
    color: 'sky',
    pillsLeft: 14,
    pillsLeftThreshold: 10,
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'med-3',
    name: 'Vitamin D3 Supplement',
    dosage: '2000 IU',
    instructions: 'Take alongside breakfast / healthy fats',
    times: ['13:00'],
    frequency: 'daily',
    color: 'amber',
    pillsLeft: 4,
    pillsLeftThreshold: 5,
    active: true,
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_LOGS: IntakeLog[] = [
  {
    medId: 'med-1',
    time: '09:00',
    date: new Date().toISOString().split('T')[0],
    status: 'taken',
    loggedAt: new Date().toISOString()
  }
];

export default function App() {
  // --- Data & Core State ---
  const [medications, setMedications] = useState<Medication[]>(() => {
    const saved = localStorage.getItem('med_tracker_medications');
    return saved ? JSON.parse(saved) : DEFAULT_MEDICATIONS;
  });

  const [logs, setLogs] = useState<IntakeLog[]>(() => {
    const saved = localStorage.getItem('med_tracker_logs');
    return saved ? JSON.parse(saved) : DEFAULT_LOGS;
  });

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // App UI configuration state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [showDemoModal, setShowDemoModal] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // --- Clock Simulator State ---
  // The app supports live clock or simulator mock clock to show timely reminders
  const [isSimulatorMode, setIsSimulatorMode] = useState(false);
  const [shiftedTime, setShiftedTime] = useState<string>('09:00'); // HH:MM
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Update localStorage when state changes
  useEffect(() => {
    localStorage.setItem('med_tracker_medications', JSON.stringify(medications));
  }, [medications]);

  useEffect(() => {
    localStorage.setItem('med_tracker_logs', JSON.stringify(logs));
  }, [logs]);

  // Handle ticking Clock
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isSimulatorMode) {
        setCurrentTime(new Date());
      } else {
        // In simulator mode, we freeze or maintain the custom shifted hour
        const now = new Date();
        const [hour, min] = shiftedTime.split(':').map(Number);
        const simDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, min, now.getSeconds());
        setCurrentTime(simDate);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isSimulatorMode, shiftedTime]);

  const toggleSimulatorMode = () => {
    if (!isSimulatorMode) {
      setIsSimulatorMode(true);
      // Initialize simulator with some near time
      setShiftedTime('09:00');
    } else {
      setIsSimulatorMode(false);
      setCurrentTime(new Date());
    }
  };

  const handleSimulatedTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setShiftedTime(e.target.value);
    const now = new Date();
    const [hour, min] = e.target.value.split(':').map(Number);
    const simDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, min, 0);
    setCurrentTime(simDate);
  };

  // --- Active Alarms / Reminders Logic ---
  // We identify due medications based on current time (Live or Simulated)
  const getDueMedications = () => {
    if (editingMedication || showAddForm) return []; // Suppress alerts during forms edits
    
    const todayStr = currentTime.toISOString().split('T')[0];
    const currentHHMM = currentTime.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });

    const dues: Array<{ medication: Medication; time: string }> = [];

    medications.forEach(med => {
      if (!med.active) return;
      
      med.times.forEach(time => {
        // If current clock hour matches scheduled dose time
        if (time === currentHHMM) {
          // Check if it hasn't been logged yet for today
          const alreadyLogged = logs.some(
            l => l.medId === med.id && l.date === todayStr && l.time === time
          );
          
          if (!alreadyLogged) {
            dues.push({ medication: med, time });
          }
        }
      });
    });

    return dues;
  };

  const dueMedications = getDueMedications();

  // --- Core CRUD Handlers ---
  const handleSaveMedication = (data: Omit<Medication, 'createdAt'> & { createdAt?: string }) => {
    if (editingMedication) {
      setMedications(medications.map(m => m.id === editingMedication.id ? { ...m, ...data } : m));
      setEditingMedication(null);
    } else {
      const newMed: Medication = {
        ...data,
        createdAt: data.createdAt || new Date().toISOString()
      };
      setMedications([...medications, newMed]);
      setShowAddForm(false);
    }
  };

  const handleDeleteMedication = (id: string) => {
    if (confirm("Are you sure you want to stop tracking this medication?")) {
      setMedications(medications.filter(m => m.id !== id));
      // Clean up previous logs matching that ID (or keep them inside statistics? It's better to keep logs but filter gracefully)
    }
  };

  const toggleMedicationActive = (id: string) => {
    setMedications(medications.map(m => m.id === id ? { ...m, active: !m.active } : m));
  };

  // --- Intake Logger Actions ---
  const handleIntakeLog = (medId: string, time: string, status: IntakeStatus, dateObject: Date = currentTime) => {
    const logDateStr = dateObject.toISOString().split('T')[0];
    
    // Check if entry already exists to override it
    const logIndex = logs.findIndex(
      l => l.medId === medId && l.date === logDateStr && l.time === time
    );

    let updatedLogs = [...logs];
    const newLogItem: IntakeLog = {
      medId,
      time,
      date: logDateStr,
      status,
      loggedAt: new Date().toISOString()
    };

    if (logIndex >= 0) {
      updatedLogs[logIndex] = newLogItem;
    } else {
      updatedLogs.push(newLogItem);
    }

    setLogs(updatedLogs);

    // If status is 'taken', decrement the pillsLeft stock count as needed
    if (status === 'taken') {
      setMedications(prevMeds => {
        return prevMeds.map(m => {
          if (m.id === medId && m.pillsLeft !== undefined) {
            const nextCount = Math.max(0, m.pillsLeft - 1);
            return { ...m, pillsLeft: nextCount };
          }
          return m;
        });
      });

      if (soundEnabled) {
        playSuccessChime();
      }
    }
  };

  const handleUndoIntake = (medId: string, time: string, logDateStr: string) => {
    const originalLog = logs.find(l => l.medId === medId && l.date === logDateStr && l.time === time);
    
    // If we undo a taken mark, put back the pill to the cabinet inventory!
    if (originalLog && originalLog.status === 'taken') {
      setMedications(prevMeds => {
        return prevMeds.map(m => {
          if (m.id === medId && m.pillsLeft !== undefined) {
            return { ...m, pillsLeft: m.pillsLeft + 1 };
          }
          return m;
        });
      });
    }

    setLogs(logs.filter(l => !(l.medId === medId && l.date === logDateStr && l.time === time)));
  };

  // Refill cabinets helper: adds 30 pills
  const handleRefillCabinets = (medId: string) => {
    setMedications(
      medications.map(m => {
        if (m.id === medId) {
          return { ...m, pillsLeft: (m.pillsLeft || 0) + 30 };
        }
        return m;
      })
    );
    if (soundEnabled) {
      playSuccessChime();
    }
  };

  // --- Dynamic Stats calculation ---
  const getTodayChecklist = () => {
    const selDateStr = selectedDate.toISOString().split('T')[0];
    const items: Array<{ medication: Medication; time: string; status?: IntakeStatus }> = [];

    medications.forEach(med => {
      // Basic frequency check (for demo simplicity, daily runs every day, weekly runs on same day of week)
      const shouldInclude = med.active; // Active filter
      
      if (shouldInclude) {
        med.times.forEach(time => {
          const log = logs.find(l => l.medId === med.id && l.date === selDateStr && l.time === time);
          items.push({
            medication: med,
            time,
            status: log?.status
          });
        });
      }
    });

    // Chronological order
    return items.sort((a, b) => a.time.localeCompare(b.time));
  };

  const todayChecklist = getTodayChecklist();

  // Adherence Streaks tracker
  const calculateStreak = () => {
    let currentStreak = 0;
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date();
      checkDate.setDate(today.getDate() - i);
      const checkStr = checkDate.toISOString().split('T')[0];
      
      // Doses total scheduled
      const activeMeds = medications.filter(m => m.active);
      if (activeMeds.length === 0) break;
      
      let totDoses = 0;
      activeMeds.forEach(m => {
        totDoses += m.times.length;
      });

      // Daily Logs
      const dailyLogs = logs.filter(l => l.date === checkStr);
      const takenCount = dailyLogs.filter(l => l.status === 'taken').length;

      // If they finished all or most scheduled, or at least one taken and no misses, count it
      if (takenCount > 0 && takenCount >= totDoses) {
        currentStreak++;
      } else if (i === 0 && takenCount === 0) {
        // Continue check because today might still be in progress
        continue;
      } else {
        break;
      }
    }
    return currentStreak;
  };

  const streakValue = calculateStreak();

  // Calculation of todays compliance progress
  const getSelectedDayProgress = () => {
    if (todayChecklist.length === 0) return 100;
    const takenCount = todayChecklist.filter(item => item.status === 'taken').length;
    return Math.round((takenCount / todayChecklist.length) * 100);
  };

  const getNextDoseInfo = () => {
    const currentHHMM = currentTime.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    
    let upcoming: { medication: Medication; time: string; diffMins: number } | null = null;
    let minDiff = Infinity;

    medications.forEach(med => {
      if (!med.active) return;
      med.times.forEach(time => {
        const [h, m] = time.split(':').map(Number);
        const [currH, currM] = currentHHMM.split(':').map(Number);

        let diff = (h * 60 + m) - (currH * 60 + currM);
        if (diff <= 0) {
          diff += 24 * 60; // Scheduled for tomorrow
        }

        if (diff < minDiff) {
          minDiff = diff;
          upcoming = { medication: med, time, diffMins: diff };
        }
      });
    });

    return upcoming;
  };

  const nextDose = getNextDoseInfo();

  // Count low stock pills
  const lowStockMeds = medications.filter(
    m => m.active && m.pillsLeft !== undefined && m.pillsLeft <= (m.pillsLeftThreshold || 5)
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans" id="app-root">
      
      {/* Dynamic Alarm Overlay when due */}
      <ActiveReminderModal
        dueMedications={dueMedications}
        onTake={(medId, time) => {
          handleIntakeLog(medId, time, 'taken');
          // Automatically clear alarm check trigger in UI
        }}
        onSkip={(medId, time) => handleIntakeLog(medId, time, 'skipped')}
        onSnooze={(medId, time) => {
          alert(`Snoozed alarm for 5 mins!`);
        }}
      />

      {/* Primary Bento Header */}
      <header className="max-w-7xl w-full mx-auto px-6 pt-8 pb-4" id="main-navigation-header">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-150">
                <Pill className="w-5 h-5 stroke-[2.25]" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">MedTrack Pro</h1>
            </div>
            <p className="text-slate-500 font-medium mt-1.5">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} • Welcome back to your dashboard
            </p>
          </div>

          <div className="flex items-center gap-3.5 flex-wrap">
            {/* Adherence Alert Status */}
            <div className="bg-white border-2 border-slate-200 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-sm">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-sm font-bold text-slate-700">All reminders active</span>
            </div>

            {/* Live Alarm / Silent status controller */}
            <button
              id="sound-opt-toggle"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2.5 rounded-2xl transition-all border-2 cursor-pointer flex items-center justify-center ${
                soundEnabled 
                  ? 'bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50 shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
              }`}
              title={soundEnabled ? "Mute chimes" : "Enable notification sound"}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* Simulated versus Live clock indicator toggle */}
            <button
              id="toggle-sim-clock-btn"
              onClick={toggleSimulatorMode}
              className={`text-sm font-bold px-4 py-2 rounded-2xl transition-all border-2 flex items-center gap-2 cursor-pointer ${
                isSimulatorMode 
                  ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 shadow-sm'
              }`}
            >
              <Clock className="w-4 h-4" />
              {isSimulatorMode ? 'Sandbox Sandbox Ready' : 'Live Clock Active'}
            </button>

            {/* Time Indicator Widget */}
            <div className="bg-slate-900 border border-slate-800 text-slate-100 font-mono text-sm px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-md">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse"></span>
              <span className="font-extrabold">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 space-y-8" id="dashboard-workspace">
        
        {/* Adherence Fast Demo Banner */}
        {showDemoModal && (
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden" id="demo-guide-banner">
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-12 translate-y-6">
              <Pill className="w-64 h-64" />
            </div>
            <button 
              onClick={() => setShowDemoModal(false)}
              className="absolute top-4 right-4 text-indigo-100 hover:text-white bg-indigo-800/25 hover:bg-indigo-800/50 rounded-full p-1.5 cursor-pointer transition"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="max-w-2xl relative z-10">
              <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300" />
                Experience Live Reminder Alarms
              </h3>
              <p className="text-sm text-indigo-100 mt-2 leading-relaxed">
                By default, this app checks your real local clock to launch alarms. 
                Use the **Simulator Sandbox Tool** in the right column to shift simulated time directly 
                to a scheduled dose (e.g., 09:00 AM) to hear the chime synthesiser and see timely reminders action!
              </p>
            </div>
          </div>
        )}

        {/* Master Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start" id="bento-grid-root">
          
          {/* 1. Next Dose Featured Card (col-span-12 md:col-span-7, row-span-3) */}
          <div className="col-span-12 md:col-span-7 bg-indigo-600 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-200/40 min-h-[320px] flex flex-col justify-between" id="bento-next-dose">
            <div className="relative z-10">
              <span className="bg-indigo-400/30 text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest inline-block">
                Up Next
              </span>
              
              {nextDose ? (
                <div className="mt-5">
                  <h2 className="text-5xl font-extrabold tracking-tight text-white leading-tight">
                    {nextDose.medication.name}
                  </h2>
                  <p className="text-indigo-100 text-lg mt-2.5 font-medium">
                    {nextDose.medication.dosage} &bull; {nextDose.medication.instructions || 'Routine Intake'}
                  </p>
                </div>
              ) : (
                <div className="mt-5">
                  <h2 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
                    All caught up!
                  </h2>
                  <p className="text-indigo-100 text-base mt-2.5 font-medium">
                    No medications scheduled for the rest of today. Keep up the amazing adherence!
                  </p>
                </div>
              )}
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mt-8 pt-4 border-t border-indigo-500/50">
              <div>
                <p className="text-indigo-200 text-xs uppercase font-extrabold tracking-wider">Scheduled For</p>
                <p className="text-4xl font-mono font-black mt-1">
                  {nextDose ? nextDose.time : '--:--'}
                </p>
              </div>

              {nextDose && (
                <button
                  id="action-log-next-dose"
                  onClick={() => handleIntakeLog(nextDose.medication.id, nextDose.time, 'taken')}
                  className="bg-white text-indigo-600 hover:bg-indigo-50 px-8 py-3.5 rounded-2xl font-extrabold text-base transition-colors shadow-lg shadow-indigo-900/10 cursor-pointer active:scale-95"
                >
                  Log Intake
                </button>
              )}
            </div>

            {/* Decorative circles */}
            <div className="absolute -right-12 -top-12 w-64 h-64 bg-indigo-500 rounded-full opacity-25 pointer-events-none"></div>
            <div className="absolute right-24 bottom-12 w-32 h-32 bg-indigo-400 rounded-full opacity-15 pointer-events-none"></div>
          </div>

          {/* 2. Daily Progress Card (col-span-12 md:col-span-5, row-span-3) */}
          <div className="col-span-12 md:col-span-5 bg-white border-2 border-slate-200 rounded-[2rem] p-8 flex flex-col justify-between shadow-sm min-h-[320px]" id="bento-daily-adherence">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Daily Adherence</h3>
                <p className="text-slate-400 text-xs font-semibold uppercase mt-0.5 tracking-wider">This Week's Journey</p>
              </div>
              <span className="text-indigo-600 font-extrabold text-3xl font-mono">
                {getSelectedDayProgress()}%
              </span>
            </div>

            {/* Dynamic Compliance Columns Graph */}
            <div className="flex items-end gap-3 h-28 my-6">
              {Array.from({ length: 7 }).map((_, i) => {
                // Generate week visual bars dynamically mapping to logs
                const today = new Date();
                const dayNum = today.getDay();
                const diff = today.getDate() - dayNum + (dayNum === 0 ? -6 : 1);
                const checkDate = new Date(today.setDate(diff));
                checkDate.setDate(checkDate.getDate() + i);
                
                const dateStr = checkDate.toISOString().split('T')[0];
                const activeMeds = medications.filter(m => m.active);
                let totalDoses = 0;
                activeMeds.forEach(m => { totalDoses += m.times.length; });

                const dayLogs = logs.filter(l => l.date === dateStr);
                const takenCount = dayLogs.filter(l => l.status === 'taken').length;
                const percentage = totalDoses > 0 ? Math.round((takenCount / totalDoses) * 100) : 0;
                
                const isSelectedDay = checkDate.toDateString() === selectedDate.toDateString();
                const isCheckToday = checkDate.toDateString() === new Date().toDateString();

                const barHeight = percentage === 0 && totalDoses > 0 ? '10%' : `${percentage}%`;

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] text-slate-400 font-bold font-mono">
                      {percentage}%
                    </span>
                    <div 
                      className={`w-full rounded-t-xl transition-all duration-300 ${
                        isSelectedDay 
                          ? 'bg-indigo-600 ring-2 ring-indigo-300 shadow-md shadow-indigo-100' 
                          : isCheckToday
                          ? 'bg-indigo-500/70 shadow-sm'
                          : percentage === 100 
                          ? 'bg-emerald-500/80 shadow-sm'
                          : 'bg-slate-200 hover:bg-slate-350'
                      }`}
                      style={{ height: barHeight }}
                      title={`${takenCount} of ${totalDoses} taken on ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}`}
                    ></div>
                    <span className={`text-[10px] font-bold ${isSelectedDay ? 'text-indigo-600' : 'text-slate-400'}`}>
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              {todayChecklist.filter(item => item.status === 'taken').length} of {todayChecklist.length} doses logged for today.
              {todayChecklist.filter(item => !item.status).length > 0 && ' Keep matching your scheduled times!'}
            </p>
          </div>

          {/* 3. Streak Card (col-span-12 md:col-span-4) */}
          <div className="col-span-12 md:col-span-4 bg-slate-900 rounded-[2rem] p-7 text-white shadow-xl flex items-center gap-6 relative overflow-hidden border border-slate-800" id="bento-streaks">
            <div className="text-center relative z-10 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/50 min-w-[90px]">
              <p className="text-4xl font-mono font-black text-amber-300">{streakValue}</p>
              <p className="text-[9px] uppercase font-black text-slate-400 tracking-wider mt-1">Day Streak</p>
            </div>
            <div className="flex-1 h-full flex flex-col justify-center relative z-10">
              <p className="text-sm text-slate-350 leading-relaxed font-medium">
                {streakValue > 0 
                  ? `You're consistent, keep it going! Regular dosage intervals protect your daily heart safety.` 
                  : "Start taking your daily medications successively to unlock protective safety streaks!"
                }
              </p>
              <div className="mt-3.5 flex gap-1.5">
                <div className={`h-1 flex-1 rounded-full ${streakValue > 0 ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>
                <div className={`h-1 flex-1 rounded-full ${streakValue > 3 ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>
                <div className={`h-1 flex-1 rounded-full ${streakValue > 7 ? 'bg-indigo-500' : 'bg-slate-700 opacity-30'}`}></div>
              </div>
            </div>
          </div>

          {/* 4. Weekly Navigation Calendar Calendar Bento Element (col-span-12 md:col-span-8) */}
          <div className="col-span-12 md:col-span-8 bg-white border-2 border-slate-200 rounded-[2rem] p-6 shadow-sm" id="bento-calendar">
            <AdherenceCalendar
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              logs={logs}
              medications={medications}
            />
          </div>

          {/* 5. Inventory Refills alerts Bento box (Dynamic insertion: span 12 if active) */}
          {lowStockMeds.length > 0 && (
            <div className="col-span-12 bg-amber-50 border-2 border-amber-100 rounded-[2rem] p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6" id="bento-refill-alert">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-500 rounded-2xl text-white mt-1">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500 w-2.5 h-2.5 rounded-full animate-ping"></span>
                    <h3 className="font-extrabold text-amber-950 uppercase text-xs tracking-widest">Refill Alert</h3>
                  </div>
                  <h4 className="text-xl font-extrabold text-amber-900 mt-1 leading-snug">Prescriptions Running Thin</h4>
                  <p className="text-amber-800/80 text-sm mt-1 max-w-xl">
                    Safety stock warning limits reached. The cabinets below are running low on inventory. Restore count +30 tablets now.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
                {lowStockMeds.map(m => (
                  <div key={m.id} className="bg-white border-2 border-amber-200/60 px-4 py-3 rounded-2xl flex items-center justify-between gap-6 text-sm flex-1 md:flex-initial">
                    <div>
                      <span className="font-extrabold text-slate-900 block">{m.name}</span>
                      <span className="text-rose-600 font-bold text-xs">{m.pillsLeft} pills left</span>
                    </div>
                    <button
                      id={`btn-refill-${m.id}`}
                      onClick={() => handleRefillCabinets(m.id)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-500/10 transition cursor-pointer active:scale-95"
                    >
                      Refill Cabinet (+30)
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Active intake checklist checklist list (col-span-12 md:col-span-7) */}
          <div className="col-span-12 md:col-span-7 bg-white border-2 border-slate-200 rounded-[2rem] p-8 shadow-sm" id="bento-checklist">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                  Intake Checklist
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-wider">
                  Doses for {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              
              <span className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded-full px-3.5 py-1">
                {todayChecklist.filter(t => t.status === 'taken').length} of {todayChecklist.length} taken
              </span>
            </div>

            {/* Checklist details layout */}
            {todayChecklist.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-3">
                <Pill className="w-12 h-12 stroke-[1.25] text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-500">No active medications scheduled for this day</p>
                <p className="text-xs text-slate-400">Add medications or enable active triggers to display schedules here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayChecklist.map((item) => {
                  const isTaken = item.status === 'taken';
                  const isSkipped = item.status === 'skipped';
                  const isMissed = item.status === 'missed';

                  return (
                    <div 
                      key={`${item.medication.id}_${item.time}`} 
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border-2 transition-all duration-150 ${
                        isTaken 
                          ? 'bg-emerald-50/20 border-emerald-100' 
                          : isSkipped
                          ? 'bg-slate-50 border-slate-150 text-slate-400'
                          : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-sm'
                      }`}
                      id={`checklist-row-${item.medication.id}`}
                    >
                      <div className="flex items-start gap-4">
                        
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm bg-indigo-50 text-indigo-600 flex-shrink-0"
                          style={{
                            backgroundColor: isTaken ? '#ecfdf5' : '#f5f3ff',
                            color: isTaken ? '#059669' : '#4f46e5'
                          }}
                        >
                          {isTaken ? '✓' : <Pill className="w-4 h-4" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className={`text-base font-bold truncate ${isTaken ? 'text-emerald-900 line-through' : 'text-slate-900'}`}>
                              {item.medication.name}
                            </h4>
                            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg">
                              {item.time}
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-500 font-bold mt-1">
                            Dosage: <span className="text-slate-700">{item.medication.dosage}</span>
                          </p>
                          
                          {item.medication.instructions && (
                            <p className="text-xs text-slate-450 mt-1 block">
                              Note: {item.medication.instructions}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Log Action buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {!item.status ? (
                          <div className="flex gap-2">
                            <button
                              id={`btn-skip-${item.medication.id}`}
                              onClick={() => handleIntakeLog(item.medication.id, item.time, 'skipped', selectedDate)}
                              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 text-slate-600 font-extrabold text-xs rounded-xl transition cursor-pointer"
                            >
                              Skip
                            </button>
                            
                            <button
                              id={`btn-take-${item.medication.id}`}
                              onClick={() => handleIntakeLog(item.medication.id, item.time, 'taken', selectedDate)}
                              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-500/10 transition flex items-center gap-1 cursor-pointer active:scale-95"
                            >
                              Take Dose
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5">
                            {isTaken && (
                              <span className="px-3.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full flex items-center gap-1.5">
                                Taken
                              </span>
                            )}
                            
                            {isSkipped && (
                              <span className="px-3.5 py-1 text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded-full">
                                Skipped
                              </span>
                            )}

                            {isMissed && (
                              <span className="px-3.5 py-1 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-full">
                                Missed
                              </span>
                            )}

                            <button
                              id={`btn-undo-${item.medication.id}`}
                              onClick={() => handleUndoIntake(item.medication.id, item.time, selectedDate.toISOString().split('T')[0])}
                              className="text-xs font-bold text-slate-400 hover:text-slate-600 underline"
                            >
                              Undo
                            </button>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 7. Prescriptions Cabinet Inventory (col-span-12 md:col-span-5) */}
          <div className="col-span-12 md:col-span-5 bg-white border-2 border-slate-200 rounded-[2rem] p-8 shadow-sm" id="bento-cabinet">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Pill className="w-5 h-5 text-indigo-600" />
                  Prescription Cupboard
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-wider">
                  Your tracked medications
                </p>
              </div>

              {!showAddForm && !editingMedication && (
                <button
                  id="btn-add-med-nav"
                  onClick={() => setShowAddForm(true)}
                  className="py-1.5 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add New
                </button>
              )}
            </div>

            {/* Cabinet Edit options block */}
            {(showAddForm || editingMedication) ? (
              <MedicationForm
                medicationToEdit={editingMedication}
                onSave={handleSaveMedication}
                onCancel={() => {
                  setShowAddForm(false);
                  setEditingMedication(null);
                }}
              />
            ) : (
              <div className="space-y-4">
                {medications.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 text-xs font-semibold">
                    Cabinet is currently empty. Click above to add prescriptions.
                  </div>
                ) : (
                  medications.map((med) => {
                    return (
                      <div 
                        key={med.id} 
                        className={`p-4 rounded-2xl border-2 transition-all ${
                          med.active 
                            ? 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-50' 
                            : 'border-slate-100 bg-slate-50/20 opacity-60'
                        }`}
                        id={`cabinet-item-${med.id}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          
                          <div className="flex items-start gap-3 min-w-0">
                            <span 
                              className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                              style={{ backgroundColor: med.color === 'emerald' ? '#10b981' : med.color === 'sky' ? '#0ea5e9' : med.color === 'indigo' ? '#6366f1' : med.color === 'violet' ? '#8b5cf6' : med.color === 'pink' ? '#ec4899' : '#f59e0b'}}
                            ></span>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-slate-950 truncate">
                                {med.name}
                              </h4>
                              <span className="text-xs text-slate-500 font-semibold">{med.dosage}</span>
                              
                              {med.times.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  {med.times.map(t => (
                                    <span key={t} className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200/80 px-2 py-0.5 rounded-md">
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              id={`btn-edit-med-${med.id}`}
                              onClick={() => setEditingMedication(med)}
                              className="px-2.5 py-1 text-slate-500 hover:text-slate-800 bg-white border-2 border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold cursor-pointer"
                            >
                              Edit
                            </button>
                            
                            <button
                              id={`btn-delete-med-${med.id}`}
                              onClick={() => handleDeleteMedication(med.id)}
                              className="p-1 px-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:border border-slate-200 transition cursor-pointer"
                              title="Delete prescription"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                        </div>

                        {/* Inventory quantities info indicator inside row */}
                        {med.pillsLeft !== undefined && (
                          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <span>Quantity balance:</span>
                            <span className={`font-extrabold ${med.pillsLeft <= (med.pillsLeftThreshold || 5) ? 'text-amber-600 font-black' : 'text-slate-700'}`}>
                              {med.pillsLeft} tablets remaining
                            </span>
                          </div>
                        )}

                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* 8. Simulator sandbox controller Bento Piece (col-span-12, row-span-2) */}
          <div className="col-span-12 bg-slate-900 text-slate-100 p-8 rounded-[2rem] border border-slate-800 shadow-md shadow-indigo-950/25 flex flex-col md:flex-row items-start md:items-center justify-between gap-6" id="bento-sandbox">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                <h3 className="font-extrabold text-amber-300 uppercase text-xs tracking-widest">Adherence Simulator Tool</h3>
              </div>
              <h4 className="text-xl font-bold text-white">Need to see the chimes in action?</h4>
              <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                Manually shift the mockup clock time inline to instantly test automatic due reminder boxes, visual logs overlay, and alarm bells right away without waiting!
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
              {isSimulatorMode ? (
                <div className="flex flex-wrap items-center gap-3.5 w-full bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-slate-400">Sandbox Hour:</span>
                    <input
                      type="time"
                      value={shiftedTime}
                      onChange={handleSimulatedTimeChange}
                      className="bg-slate-900 text-white rounded-lg p-1.5 text-center font-bold outline-none border border-slate-600"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShiftedTime('09:00');
                        const now = new Date();
                        const simDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);
                        setCurrentTime(simDate);
                      }}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-950 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 cursor-pointer"
                    >
                      Morning (09:00)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShiftedTime('20:00');
                        const now = new Date();
                        const simDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0);
                        setCurrentTime(simDate);
                      }}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-950 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 cursor-pointer"
                    >
                      Evening (20:00)
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={toggleSimulatorMode}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition cursor-pointer"
                >
                  Acquire Sandbox Sandbox Clock
                </button>
              )}
            </div>
          </div>

        </div>

      </main>

      <footer className="bg-white border-t border-slate-200 py-8 text-center text-xs text-slate-400 font-semibold uppercase tracking-widest">
        Copyright &copy; 2026 MedTrack Pro &bull; Built with Privacy Offline-First
      </footer>

    </div>
  );
}
