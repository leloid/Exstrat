'use client';

import React from 'react';

interface LabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
  required?: boolean;
}

export const Label: React.FC<LabelProps> = ({
  children,
  htmlFor,
  className = '',
  required = false,
}) => {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${className}`}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
};
