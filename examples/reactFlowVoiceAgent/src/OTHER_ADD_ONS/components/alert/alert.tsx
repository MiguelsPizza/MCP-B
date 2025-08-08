import React from 'react';

interface AlertProps {
  variant?: 'default' | 'destructive';
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ 
  variant = 'default', 
  children, 
  className = '' 
}) => {
  const baseClass = 'p-4 rounded-lg';
  const variantClass = variant === 'destructive' ? 'bg-red-100 text-red-900' : 'bg-gray-100';
  
  return (
    <div className={`${baseClass} ${variantClass} ${className}`}>
      {children}
    </div>
  );
};

export const AlertDescription: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="ml-2 inline-block">{children}</div>
); 