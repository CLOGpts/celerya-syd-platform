import React from 'react';
import { SydDesign } from '../../src/styles/SydDesignSystem';

interface StyledCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const StyledCard: React.FC<StyledCardProps> = ({
  children,
  className = '',
  hover = false
}) => {
  const classes = [
    SydDesign.cards.background,
    SydDesign.cards.borderRadius,
    SydDesign.cards.padding,
    SydDesign.cards.shadow,
    SydDesign.cards.border,
    hover ? `${SydDesign.cards.transform} ${SydDesign.cards.transition}` : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {children}
    </div>
  );
};

export default StyledCard;