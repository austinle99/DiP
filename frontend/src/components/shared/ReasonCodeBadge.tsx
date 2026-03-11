import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ReasonCodeBadgeProps {
  codes: string[];
  sparseDataMode?: boolean;
}

export const ReasonCodeBadge: React.FC<ReasonCodeBadgeProps> = ({ codes, sparseDataMode = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1 px-2 py-1 text-xs font-mono rounded border transition-colors",
          sparseDataMode 
            ? "bg-yellow-50 border-yellow-200 text-yellow-800" 
            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
        )}
      >
        <HelpCircle size={12} />
        {codes.length} Reason{codes.length !== 1 ? 's' : ''}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 left-0 w-64 p-3 bg-white border border-slate-200 shadow-lg rounded-md z-50">
          <h4 className="text-xs font-semibold text-slate-900 mb-2 uppercase tracking-wider">AI Drivers</h4>
          <ul className="space-y-1">
            {codes.map(code => (
              <li key={code} className="text-xs text-slate-600 font-mono bg-slate-50 p-1 rounded">
                {code}
              </li>
            ))}
          </ul>
          {sparseDataMode && (
            <div className="mt-2 p-1.5 bg-yellow-50 border border-yellow-100 rounded text-[10px] text-yellow-800 leading-tight">
              Warning: Fallback heuristics used. Insufficient historical data for deep prediction.
            </div>
          )}
        </div>
      )}
    </div>
  );
};