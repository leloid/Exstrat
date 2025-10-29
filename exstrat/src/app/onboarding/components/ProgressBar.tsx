'use client';

import React from 'react';
import { XMarkIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { ONBOARDING_STEPS } from '../constants';

interface ProgressBarProps {
  currentStep: number;
  onSkip: () => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, onSkip }) => {
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <img 
              src="/Full_logo.svg" 
              alt="exStrat Logo" 
              className="h-8 w-auto"
            />
          </div>
          <button
            onClick={onSkip}
            className="flex items-center space-x-2 text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="w-5 h-5" />
            <span>Passer</span>
          </button>
        </div>
        <div className="flex items-center justify-between mb-2">
          {ONBOARDING_STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center space-x-2 ${
                index <= currentStep ? 'text-blue-600' : 'text-gray-400'
              }`}>
                <step.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{step.name}</span>
              </div>
              {index < ONBOARDING_STEPS.length - 1 && (
                <ArrowRightIcon className="w-4 h-4 text-gray-300 mx-4" />
              )}
            </div>
          ))}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

