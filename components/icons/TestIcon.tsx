
import React from 'react';

export const TestIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    {...props}
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M18.36 5.64A9 9 0 0 1 5.64 18.36" />
    <path d="M12 12h.01" />
    <path d="M16 12h.01" />
    <path d="M12 16v.01" />
    <path d="M8 12h.01" />
    <path d="M12 8v.01" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="m4.93 19.07 1.41-1.41" />
    <path d="m17.66 6.34 1.41-1.41" />
    <path d="M12 22A10 10 0 1 0 12 2a10 10 0 0 0 0 20Z" />
  </svg>
);
