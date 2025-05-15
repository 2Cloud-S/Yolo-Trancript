'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownProps {
  label: string;
  value: string | number | undefined;
  onChange: (value: string) => void;
  options: {
    value: string | number;
    label: string;
  }[];
  disabled?: boolean;
  className?: string;
}

export default function Dropdown({
  label,
  value,
  onChange,
  options,
  disabled = false,
  className = '',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find the selected option's label
  const selectedOption = value !== undefined ? options.find(option => option.value === value) : undefined;
  const displayValue = selectedOption ? selectedOption.label : 'Select an option';

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue.toString());
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        className={`flex justify-between items-center w-full rounded-md border px-3 py-2 text-sm ${
          disabled 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
            : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
        } ${className}`}
      >
        <span className="truncate">{displayValue}</span>
        <ChevronDown className={`ml-2 h-4 w-4 transition-transform duration-150 ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 max-h-60 overflow-auto">
          <ul className="py-1">
            {options.map((option) => (
              <li
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`cursor-pointer px-3 py-2 text-sm ${
                  option.value === value 
                    ? 'bg-indigo-50 text-indigo-600 font-medium' 
                    : 'text-gray-900 hover:bg-gray-100'
                }`}
              >
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 