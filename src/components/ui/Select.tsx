import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps {
  value: string | number;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const Select: React.FC<SelectProps> = ({ 
  value, 
  onChange, 
  options, 
  className = '',
  placeholder,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => String(o.value) === String(value));

  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 99999
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // Also check if the click was inside the portal
        const target = event.target as HTMLElement;
        if (!target.closest('.select-dropdown-portal')) {
          setIsOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className="w-full h-full min-h-[32px] bg-transparent flex items-center justify-between gap-2 px-3 py-1.5 focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="truncate whitespace-nowrap">{selectedOption?.label || placeholder || 'Select...'}</span>
        <ChevronDown size={14} className={`text-muted shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && createPortal(
        <div 
          className="select-dropdown-portal bg-surface border border-border-subtle rounded-lg shadow-xl overflow-hidden py-1 max-h-60 overflow-y-auto custom-scrollbar"
          style={dropdownStyle}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(String(option.value));
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors truncate ${
                String(value) === String(option.value)
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'text-main hover:bg-elevated'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};
