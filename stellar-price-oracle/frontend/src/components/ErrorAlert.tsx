import React from 'react';

interface ErrorAlertProps {
  children: React.ReactNode;
  className?: string;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg ${className}`}>
      <div className="flex items-start">
        <span className="mr-2 text-red-400 text-lg">⚠️</span>
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ErrorAlert;
