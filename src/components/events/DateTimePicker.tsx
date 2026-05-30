import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface DateTimePickerProps {
  dateValue: string; // YYYY-MM-DD
  timeValue: string; // HH:mm (24hr)
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const DateTimePicker: React.FC<DateTimePickerProps> = ({ dateValue, timeValue, onDateChange, onTimeChange }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (dateValue) {
      const [y, m] = dateValue.split('-').map(Number);
      setCurrentMonth(new Date(y, m - 1, 1));
    } else {
      const today = new Date();
      onDateChange(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
      setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    }
  }, []);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const isToday = (d: number) => {
    const today = new Date();
    return d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const isSelected = (d: number) => {
    if (!dateValue) return false;
    const [y, m, day] = dateValue.split('-').map(Number);
    return d === day && month === m - 1 && year === y;
  };

  const handleDateClick = (d: number) => {
    onDateChange(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  };

  // Time Handler
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');
  const [ampm, setAmpm] = useState('PM');

  useEffect(() => {
    if (timeValue) {
      let [h, min] = timeValue.split(':').map(Number);
      const isPM = h >= 12;
      setAmpm(isPM ? 'PM' : 'AM');
      if (h === 0) h = 12;
      else if (h > 12) h -= 12;
      setHour(String(h));
      setMinute(String(min).padStart(2, '0'));
    }
  }, [timeValue]);

  const handleTimeChange = (h: string, m: string, a: string) => {
    if (!h && !m) {
      onTimeChange('');
      return;
    }
    const safeH = h || '12';
    const safeM = m || '00';
    let h24 = parseInt(safeH, 10);
    if (a === 'PM' && h24 !== 12) h24 += 12;
    if (a === 'AM' && h24 === 12) h24 = 0;
    onTimeChange(`${String(h24).padStart(2, '0')}:${safeM}`);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Calendar inline */}
      <div className="bg-surface border border-border-subtle rounded-xl p-4 shadow-sm select-none">
        <div className="flex items-center justify-between mb-4">
          <button type="button" onClick={handlePrevMonth} className="p-1.5 rounded-lg hover:bg-base text-muted hover:text-main transition-colors">
            <ChevronLeft size={18} />
          </button>
          <span className="font-bold text-main">{MONTHS[month]} {year}</span>
          <button type="button" onClick={handleNextMonth} className="p-1.5 rounded-lg hover:bg-base text-muted hover:text-main transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {DAYS.map(day => (
            <div key={day} className="text-xs font-semibold text-muted py-1">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => (
            <div key={i} className="aspect-square flex items-center justify-center">
              {d ? (
                <button
                  type="button"
                  onClick={() => handleDateClick(d)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    isSelected(d) 
                      ? 'bg-primary text-on-primary shadow-md hover:bg-primary-hover' 
                      : isToday(d)
                      ? 'text-primary bg-primary/10 hover:bg-primary/20'
                      : 'text-main hover:bg-base'
                  }`}
                >
                  {d}
                </button>
              ) : <div />}
            </div>
          ))}
        </div>
      </div>

      {/* Inline Time Picker (no dropdowns) */}
      <div className="flex items-center gap-3 bg-surface border border-border-subtle rounded-xl p-3 shadow-sm">
        <Clock size={18} className="text-muted ml-1" />
        <div className="flex items-center gap-1.5 flex-1">
          <input 
            type="number" 
            placeholder="12" 
            value={hour} 
            onChange={(e) => {
              let val = e.target.value;
              if (parseInt(val) > 12) val = '12';
              if (parseInt(val) < 0) val = '1';
              setHour(val);
              handleTimeChange(val, minute, ampm);
            }}
            onBlur={() => {
              if (hour && parseInt(hour) < 1) setHour('1');
            }}
            className="w-12 bg-base border border-border-subtle rounded-lg px-2 py-1.5 text-center text-sm text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
          <span className="font-bold text-main">:</span>
          <input 
            type="number" 
            placeholder="00" 
            value={minute} 
            onChange={(e) => {
              let val = e.target.value;
              if (parseInt(val) > 59) val = '59';
              if (parseInt(val) < 0) val = '0';
              setMinute(val);
              handleTimeChange(hour, val, ampm);
            }}
            onBlur={() => {
              if (minute.length === 1) setMinute('0' + minute);
            }}
            className="w-12 bg-base border border-border-subtle rounded-lg px-2 py-1.5 text-center text-sm text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>
        <div className="flex bg-base border border-border-subtle rounded-lg p-0.5">
          <button 
            type="button"
            onClick={() => { setAmpm('AM'); handleTimeChange(hour, minute, 'AM'); }}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${ampm === 'AM' ? 'bg-surface shadow text-main' : 'text-muted hover:text-main'}`}
          >
            AM
          </button>
          <button 
            type="button"
            onClick={() => { setAmpm('PM'); handleTimeChange(hour, minute, 'PM'); }}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${ampm === 'PM' ? 'bg-surface shadow text-main' : 'text-muted hover:text-main'}`}
          >
            PM
          </button>
        </div>
      </div>
    </div>
  );
};
