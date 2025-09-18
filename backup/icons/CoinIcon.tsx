import React from 'react';

export const CoinIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="8" />
    <path d="M12 18V6" />
    <path d="M16 14h-4-2" />
    <path d="M8 10h4" />
  </svg>
);
