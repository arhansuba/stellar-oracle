import React from 'react';

interface InfoAlertProps {
  children: React.ReactNode;
  className?: string;
}

const InfoAlert: React.FC<InfoAlertProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-blue-500/10 border border-blue-500/30 text-blue-200 px-4 py-3 rounded-lg ${className}`}>
      <div className="flex items-start">
        <span className="mr-2 text-blue-400 text-lg">💡</span>
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default InfoAlert;
