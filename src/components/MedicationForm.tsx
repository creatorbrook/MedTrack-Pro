import React, { useState, useEffect } from 'react';
import { Pill, Plus, Trash2, Clock, Check, X, ShieldAlert } from 'lucide-react';
import { Medication } from '../types';

interface MedicationFormProps {
  medicationToEdit?: Medication | null;
  onSave: (medication: Omit<Medication, 'createdAt'> & { createdAt?: string }) => void;
  onCancel: () => void;
}

const COLOR_PALETTE = [
  { name: 'emerald', bg: 'bg-emerald-500', hover: 'hover:bg-emerald-600', text: 'text-emerald-500', hex: '#10b981' },
  { name: 'sky', bg: 'bg-sky-500', hover: 'hover:bg-sky-600', text: 'text-sky-500', hex: '#0ea5e9' },
  { name: 'indigo', bg: 'bg-indigo-500', hover: 'hover:bg-indigo-600', text: 'text-indigo-500', hex: '#6366f1' },
  { name: 'violet', bg: 'bg-violet-500', hover: 'hover:bg-violet-600', text: 'text-violet-500', hex: '#8b5cf6' },
  { name: 'pink', bg: 'bg-pink-500', hover: 'hover:bg-pink-600', text: 'text-pink-500', hex: '#ec4899' },
  { name: 'amber', bg: 'bg-amber-500', hover: 'hover:bg-amber-600', text: 'text-amber-500', hex: '#f59e0b' },
];

export function MedicationForm({ medicationToEdit, onSave, onCancel }: MedicationFormProps) {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [times, setTimes] = useState<string[]>(['09:00']);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [selectedColor, setSelectedColor] = useState('indigo');
  const [trackStock, setTrackStock] = useState(false);
  const [pillsLeft, setPillsLeft] = useState<number>(30);
  const [pillsThreshold, setPillsThreshold] = useState<number>(5);

  // Suggested meds for quick click autofills
  const quickSuggs = [
    { name: 'Vitamin D3', dosage: '1000 IU', instructions: 'Take with morning food', color: 'amber' },
    { name: 'Ibuprofen', dosage: '400mg', instructions: 'Take after meals', color: 'indigo' },
    { name: 'Multivitamin', dosage: '1 tablet', instructions: 'Take with general breakfast', color: 'emerald' },
    { name: 'Atorvastatin', dosage: '20mg', instructions: 'Take before sleep', color: 'violet' },
  ];

  useEffect(() => {
    if (medicationToEdit) {
      setName(medicationToEdit.name);
      setDosage(medicationToEdit.dosage);
      setInstructions(medicationToEdit.instructions);
      setTimes(medicationToEdit.times);
      setFrequency(medicationToEdit.frequency);
      setSelectedColor(medicationToEdit.color || 'indigo');
      if (medicationToEdit.pillsLeft !== undefined) {
        setTrackStock(true);
        setPillsLeft(medicationToEdit.pillsLeft);
        setPillsThreshold(medicationToEdit.pillsLeftThreshold || 5);
      } else {
        setTrackStock(false);
      }
    }
  }, [medicationToEdit]);

  const addTime = () => {
    setTimes([...times, '09:00']);
  };

  const updateTime = (index: number, value: string) => {
    const updated = [...times];
    updated[index] = value;
    setTimes(updated);
  };

  const removeTime = (index: number) => {
    if (times.length <= 1) return; // Must have at least one dose scheduled
    setTimes(times.filter((_, i) => i !== index));
  };

  const handleQuickSuggClick = (sugg: typeof quickSuggs[0]) => {
    setName(sugg.name);
    setDosage(sugg.dosage);
    setInstructions(sugg.instructions);
    setSelectedColor(sugg.color);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Filter unique times, then sort chronologically
    const sortedUniqueTimes = (Array.from(new Set(times)) as string[]).sort();

    onSave({
      id: medicationToEdit ? medicationToEdit.id : Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      dosage: dosage.trim() || '1 Dose',
      instructions: instructions.trim(),
      times: sortedUniqueTimes,
      frequency,
      color: selectedColor,
      pillsLeft: trackStock ? pillsLeft : undefined,
      pillsLeftThreshold: trackStock ? pillsThreshold : undefined,
      active: medicationToEdit ? medicationToEdit.active : true,
      ...(medicationToEdit?.createdAt ? { createdAt: medicationToEdit.createdAt } : {}),
    });
  };

  return (
    <div className="bg-white border-2 border-slate-200 rounded-3xl p-6" id="medication-form-container">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Pill className="w-5 h-5 text-indigo-600" />
          {medicationToEdit ? 'Edit Medication Schedule' : 'Schedule New Medication'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 rounded-full p-1.5 hover:bg-slate-50 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Quick Suggestions for rapid workflow */}
        {!medicationToEdit && (
          <div className="space-y-2">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">QUICK AUTO-FILL TEMPLATES</span>
            <div className="flex flex-wrap gap-2">
              {quickSuggs.map((sugg) => (
                <button
                  type="button"
                  key={sugg.name}
                  onClick={() => handleQuickSuggClick(sugg)}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-full transition text-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Pill className="w-3 h-3 text-indigo-400" />
                  {sugg.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Name and Dosage fields in row grid for desktop optimization */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Medication Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Lipitor, Multivitamin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm border-2 border-slate-200 outline-none focus:border-indigo-600 bg-slate-50/50 rounded-2xl px-4 py-3 transition"
              id="input-med-name"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Dosage *</label>
            <input
              type="text"
              required
              placeholder="e.g. 10mg, 1 Capsule, 2 Puffs"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              className="w-full text-sm border-2 border-slate-200 outline-none focus:border-indigo-600 bg-slate-50/50 rounded-2xl px-4 py-3 transition"
              id="input-med-dosage"
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">Instructions & Notes (Optional)</label>
          <input
            type="text"
            placeholder="e.g. Take with warm food, avoid dairy"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full text-sm border-2 border-slate-200 outline-none focus:border-indigo-600 bg-slate-50/50 rounded-2xl px-4 py-3 transition"
            id="input-med-instructions"
          />
        </div>

        {/* Dose times scheduler */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Daily Schedule Times *
            </label>
            <button
              type="button"
              onClick={addTime}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
              id="btn-add-dose-time"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Another Dose
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 align-middle">
            {times.map((time, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-50 border-2 border-slate-205 rounded-xl px-3 py-2">
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => updateTime(idx, e.target.value)}
                  className="bg-transparent text-sm w-full outline-none font-semibold text-slate-800"
                />
                {times.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTime(idx)}
                    className="text-slate-400 hover:text-rose-500 p-1 rounded hover:bg-slate-100 transition cursor-pointer"
                    title="Remove this dose time"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Aesthetic Color & Frequency selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 block">Frequency Accent Palette</span>
            <div className="flex items-center gap-2">
              {COLOR_PALETTE.map((color) => (
                <button
                  type="button"
                  key={color.name}
                  onClick={() => setSelectedColor(color.name)}
                  className={`w-8 h-8 rounded-full ${color.bg} transition-transform transform active:scale-95 flex items-center justify-center relative border border-white/20 cursor-pointer`}
                  style={{ backgroundColor: color.hex }}
                  title={`${color.name} theme`}
                >
                  {selectedColor === color.name && (
                    <span className="absolute inset-0 m-1.5 rounded-full border border-white bg-white/40 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white stroke-[3.5]" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Frequency Repeat Cycle</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFrequency('daily')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl text-center border-2 transition cursor-pointer ${
                  frequency === 'daily'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Every Day
              </button>
              <button
                type="button"
                onClick={() => setFrequency('weekly')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl text-center border-2 transition cursor-pointer ${
                  frequency === 'weekly'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Weekly Loop
              </button>
            </div>
          </div>
        </div>

        {/* Stock tracking & alerts */}
        <div className="border-t border-slate-100 pt-4 space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={trackStock}
              onChange={(e) => setTrackStock(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 w-4 h-4 cursor-pointer"
              id="chk-track-stock"
            />
            <span className="text-xs font-bold text-slate-800">Track Remaining Stock & Auto-Refill Warnings</span>
          </label>

          {trackStock && (
            <div className="grid grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-xl border-2 border-slate-150 transition duration-150 animate-fadeIn">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500">Current Pills Left</span>
                <input
                  type="number"
                  min="0"
                  value={pillsLeft}
                  onChange={(e) => setPillsLeft(parseInt(e.target.value) || 0)}
                  className="w-full text-xs font-bold border-2 border-slate-200 bg-white rounded-lg px-2.5 py-1.5"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-600 flex items-center gap-1 text-amber-655">
                  <ShieldAlert className="w-3.5 h-3.5 inline text-amber-550" /> Warning Level
                </span>
                <input
                  type="number"
                  min="1"
                  value={pillsThreshold}
                  onChange={(e) => setPillsThreshold(parseInt(e.target.value) || 5)}
                  className="w-full text-xs font-bold border-2 border-slate-200 bg-white rounded-lg px-2.5 py-1.5"
                  title="Prompt warning when pills drop below this count"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex gap-3 justify-end border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="py-2.5 px-4 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="py-2.5 px-6 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-600/10 cursor-pointer"
            id="btn-save-medication"
          >
            {medicationToEdit ? 'Save Changes' : 'Schedule Medication'}
          </button>
        </div>
      </form>
    </div>
  );
}
