import React from 'react';

export const UserCogIcon: React.FC<{ className?: string }> = ({ className }) => (
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
    <circle cx="18" cy="15" r="3" />
    <circle cx="9" cy="7" r="4" />
    <path d="M12 15h-1a5 5 0 0 0-5 5v2" />
    <path d="m21.7 16.4-.9-.3" />
    <path d="m15.2 13.9-.9-.3" />
    <path d="m16.6 18.7.3-.9" />
    <path d="m19.1 12.2.3-.9" />
    <path d="m19.5 17.3-.4-1" />
    <path d="m14.3 12.9-.4-1" />
    <path d="m16.8 20.2.9.3" />
    <path d="m20.3 13.7.9.3" />
  </svg>
);
