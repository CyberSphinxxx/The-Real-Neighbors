import React, { useState, useEffect } from 'react';

interface BirthdayPickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const BirthdayPicker: React.FC<BirthdayPickerProps> = ({ value, onChange }) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [year, setYear] = useState('');

  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split('-');
      setYear(y);
      setMonth(String(parseInt(m, 10)));
      setDay(String(parseInt(d, 10)));
    }
  }, [value]);

  const handleUpdate = (newMonth: string, newDay: string, newYear: string) => {
    if (newMonth && newDay && newYear) {
      const m = newMonth.padStart(2, '0');
      const d = newDay.padStart(2, '0');
      onChange(`${newYear}-${m}-${d}`);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={month}
        onChange={(e) => { setMonth(e.target.value); handleUpdate(e.target.value, day, year); }}
        className="bg-base border border-border-subtle rounded-lg px-2 py-1.5 text-sm text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer appearance-none min-w-[100px]"
      >
        <option value="" disabled>Month</option>
        {MONTHS.map((m, i) => (
          <option key={m} value={i + 1}>{m}</option>
        ))}
      </select>

      <select
        value={day}
        onChange={(e) => { setDay(e.target.value); handleUpdate(month, e.target.value, year); }}
        className="bg-base border border-border-subtle rounded-lg px-2 py-1.5 text-sm text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer appearance-none min-w-[60px]"
      >
        <option value="" disabled>Day</option>
        {days.map(d => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      <select
        value={year}
        onChange={(e) => { setYear(e.target.value); handleUpdate(month, day, e.target.value); }}
        className="bg-base border border-border-subtle rounded-lg px-2 py-1.5 text-sm text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer appearance-none min-w-[70px]"
      >
        <option value="" disabled>Year</option>
        {years.map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
};
