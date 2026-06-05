import React, { useState, useEffect } from 'react';
import { Select } from '../ui/Select';

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
      <div className="flex gap-2">
        <Select
          value={month}
          placeholder="Month"
          onChange={(val) => { setMonth(val); handleUpdate(val, day, year); }}
          options={MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))}
          className="bg-base border border-border-subtle rounded-lg text-sm text-main w-[110px]"
        />
        <Select
          value={day}
          placeholder="Day"
          onChange={(val) => { setDay(val); handleUpdate(month, val, year); }}
          options={days.map(d => ({ value: String(d), label: String(d) }))}
          className="bg-base border border-border-subtle rounded-lg text-sm text-main w-[80px]"
        />
        <Select
          value={year}
          placeholder="Year"
          onChange={(val) => { setYear(val); handleUpdate(month, day, val); }}
          options={years.map(y => ({ value: String(y), label: String(y) }))}
          className="bg-base border border-border-subtle rounded-lg text-sm text-main w-[90px]"
        />
      </div>
  );
};
