import React from 'react';

interface StyledButtonProps {
  variant: 'blue' | 'green' | 'red' | 'purple' | 'teal';
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

const StyledButton: React.FC<StyledButtonProps> = ({
  variant,
  onClick,
  children,
  disabled = false,
  className = ''
}) => {
  const gradients = {
    blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    red: 'from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700',
    purple: 'from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700',
    teal: 'from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        h-10 px-4
        bg-gradient-to-r ${gradients[variant]}
        text-white font-medium
        rounded-lg
        shadow-md hover:shadow-lg
        transform hover:scale-105
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        disabled:transform-none disabled:shadow-none
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export default StyledButton;