import React from 'react';

export const ItalyFlagIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" className={className}>
    <rect width="900" height="600" fill="#fff"/>
    <rect width="300" height="600" fill="#009246"/>
    <rect x="600" width="300" height="600" fill="#ce2b37"/>
  </svg>
);
