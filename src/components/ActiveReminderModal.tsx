import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pill, Clock, Bell, VolumeX, Volume2, Check, X, AlertOctagon } from 'lucide-react';
import { Medication } from '../types';
import { playAlertChime } from '../utils/audio';

interface ActiveReminderModalProps {
  dueMedications: Array<{ medication: Medication; time: string }>;
  onTake: (medicationId: string, time: string) => void;
  onSkip: (medicationId: string, time: string) => void;
  onSnooze: (medicationId: string, time: string) => void;
}

export function ActiveReminderModal({
  dueMedications,
  onTake,
  onSkip,
  onSnooze,
}: ActiveReminderModalProps) {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (dueMedications.length === 0) return;

    // Play initial alert chime
    if (!muted) {
      playAlertChime();
    }

    // Set an interval to ring periodically
    const interval = setInterval(() => {
      if (!muted) {
        playAlertChime();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [dueMedications.length, muted]);

  if (dueMedications.length === 0) return null;

  // Render the oldest due medication first to make it a clean queue
  const current = dueMedications[0];
  const { medication, time } = current;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md overflow-hidden bg-white dark:bg-slate-900 rounded-3xl border border-rose-100 dark:border-rose-950/30 shadow-2xl shadow-rose-200/20"
          id="due-alert-modal"
        >
          {/* Header Visual Stripe */}
          <div className="bg-rose-500 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              <span className="font-semibold tracking-wide text-sm font-sans">MEDICATION DUE NOW</span>
            </div>
            
            <button
              id="volume-toggle-btn"
              onClick={() => setMuted(!muted)}
              className="p-1 px-2.5 bg-rose-600 hover:bg-rose-700 text-rose-100 hover:text-white rounded-lg transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              title={muted ? "Unmute alarm" : "Mute alarm"}
            >
              {muted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  Muted
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  Sound On
                </>
              )}
            </button>
          </div>

          <div className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div 
                className={`p-4 rounded-2xl flex-shrink-0 bg-${medication.color}-500/10 text-${medication.color}-600`}
                style={{
                  backgroundColor: `var(--color-${medication.color}-500, #fee2e2)`,
                  color: `var(--color-${medication.color}-600, #dc2626)`
                }}
              >
                <Pill className="w-8 h-8 stroke-[2.25] text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-slate-950 truncate leading-tight">
                  {medication.name}
                </h3>
                <p className="text-sm font-semibold text-slate-500 mt-1">
                  Dosage: <span className="text-slate-800">{medication.dosage}</span>
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-rose-600 font-medium text-xs bg-rose-50 px-2 py-1 rounded-md w-max">
                  <Clock className="w-3.5 h-3.5" />
                  Scheduled for {time}
                </div>
              </div>
            </div>

            {medication.instructions && (
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 rounded-xl p-3.5 mb-6 text-xs text-slate-600 leading-relaxed">
                <span className="font-semibold text-slate-800 block mb-1">INSTRUCTIONS</span>
                {medication.instructions}
              </div>
            )}

            {/* Pill Stock Alert inside reminder */}
            {medication.pillsLeft !== undefined && (
              <div className="mb-6 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                <span>Pills count remaining:</span>
                <span className={`font-semibold ${medication.pillsLeft <= 5 ? 'text-amber-600' : 'text-slate-700'}`}>
                  {medication.pillsLeft} left
                </span>
              </div>
            )}

            {/* Grid of actions */}
            <div className="grid grid-cols-3 gap-3">
              <button
                id="btn-reminder-skip"
                onClick={() => onSkip(medication.id, time)}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition duration-150 flex flex-col items-center justify-center gap-1 cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-500" />
                Skip Dose
              </button>

              <button
                id="btn-reminder-snooze"
                onClick={() => onSnooze(medication.id, time)}
                className="py-3 px-4 bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-xs rounded-xl transition duration-150 border border-amber-200/50 flex flex-col items-center justify-center gap-1 cursor-pointer"
              >
                <Bell className="w-4 h-4 text-amber-500" />
                Snooze 5m
              </button>

              <button
                id="btn-reminder-take"
                onClick={() => onTake(medication.id, time)}
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition duration-150 flex flex-col items-center justify-center gap-1 shadow-md shadow-emerald-500/10 cursor-pointer"
              >
                <Check className="w-4 h-4 text-white" />
                Mark Taken
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
