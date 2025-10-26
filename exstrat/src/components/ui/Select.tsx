'use client';

import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface SelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectItemProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

interface SelectValueProps {
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
  children,
  value,
  onValueChange,
  placeholder,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState(value || '');
  const selectRef = React.useRef<HTMLDivElement>(null);

  const handleSelect = (newValue: string) => {
    setSelectedValue(newValue);
    onValueChange?.(newValue);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        `}
      >
        <div className="flex items-center justify-between">
          <span className={selectedValue ? 'text-gray-900' : 'text-gray-500'}>
            {selectedValue || placeholder}
          </span>
          <ChevronDownIcon className="h-4 w-4 text-gray-400" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-xl max-h-60 overflow-y-auto">
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === SelectContent) {
              return React.cloneElement(child as React.ReactElement<any>, { onSelect: handleSelect });
            }
            return child;
          })}
        </div>
      )}
    </div>
  );
};

export const SelectTrigger: React.FC<SelectTriggerProps> = ({ children, className = '' }) => {
  return <div className={className}>{children}</div>;
};

export const SelectContent: React.FC<SelectContentProps & { onSelect?: (value: string) => void }> = ({
  children,
  className = '',
  onSelect,
}) => {
  return (
    <div className={`py-1 ${className}`}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === SelectItem) {
          return React.cloneElement(child as React.ReactElement<any>, { onSelect });
        }
        return child;
      })}
    </div>
  );
};

export const SelectItem: React.FC<SelectItemProps & { onSelect?: (value: string) => void }> = ({
  children,
  value,
  className = '',
  onSelect,
}) => {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(value)}
      className={`
        w-full px-3 py-2 text-left text-sm text-gray-900 hover:bg-gray-100
        focus:outline-none focus:bg-gray-100
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  return <span>{placeholder}</span>;
};
