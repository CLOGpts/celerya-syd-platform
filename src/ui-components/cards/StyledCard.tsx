import React from 'react';

interface StyledCardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

const StyledCard: React.FC<StyledCardProps> = ({
  children,
  className = '',
  hoverable = true,
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-gray-900 dark:bg-slate-800
        rounded-xl
        shadow-lg
        p-6
        border border-slate-800 dark:border-slate-700
        ${hoverable ? 'hover:shadow-xl transform hover:scale-105 cursor-pointer' : ''}
        transition-all duration-200
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default StyledCard;