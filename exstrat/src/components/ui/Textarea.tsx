'use client';

import React from 'react';

interface TextareaProps {
  id?: string;
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  id,
  name,
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled = false,
  required = false,
  className = '',
}) => {
  return (
    <textarea
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      required={required}
      className={`
        w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
        dark:bg-gray-800 dark:border-gray-600 dark:text-white
        ${className}
      `}
    />
  );
};
