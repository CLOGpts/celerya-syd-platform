import React from 'react';

export const PdfIcon: React.FC<{ className?: string }> = ({ className }) => (
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
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M9.5 14.5v-2a1 1 0 0 1 1-1h1" />
        <path d="M13 18v-1.5a.5.5 0 0 0-.5-.5h-2a.5.5 0 0 0-.5.5V18" />
        <path d="M16 18h2" />
        <path d="M18 12h-2v6" />
    </svg>
);
