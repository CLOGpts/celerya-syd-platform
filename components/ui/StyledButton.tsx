import React from 'react';
import { SydDesign } from '../../src/styles/SydDesignSystem';

type ButtonVariant = 'blue' | 'green' | 'red' | 'purple' | 'teal';

interface StyledButtonProps {
  variant: ButtonVariant;
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const StyledButton: React.FC<StyledButtonProps> = ({
  variant,
  onClick,
  children,
  disabled = false,
  className = '',
  type = 'button'
}) => {
  const classes = [
    SydDesign.buttons.height,
    SydDesign.buttons.padding,
    SydDesign.buttons.borderRadius,
    SydDesign.buttons.shadow,
    SydDesign.buttons.transform,
    SydDesign.buttons.transition,
    SydDesign.buttons.gradients[variant],
    disabled ? SydDesign.buttons.disabled : '',
    'text-white font-medium',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {children}
    </button>
  );
};

export default StyledButton;