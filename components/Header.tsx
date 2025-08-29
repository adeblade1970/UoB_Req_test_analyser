
import React from 'react';

const DocumentScanIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M12 22h6a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v10" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M3 15v2a2 2 0 0 0 2 2h2" />
    <path d="M21 15v2a2 2 0 0 1-2 2h-2" />
    <path d="M3 9V7a2 2 0 0 1 2-2h2" />
    <path d="M21 9V7a2 2 0 0 0-2-2h-2" />
  </svg>
);


export const Header: React.FC = () => {
  return (
    <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 max-w-5xl">
        <div className="flex items-center gap-3">
          <DocumentScanIcon className="h-8 w-8 text-teal-400" />
          <h1 className="text-xl font-bold text-white">University of Birmingham QA Analyser</h1>
        </div>
      </div>
    </header>
  );
};