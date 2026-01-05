import React from 'react';

// Basic tooltip implementation since we don't have the original component
export const TooltipComponent: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
    return (
        <div className="group relative inline-block">
            {children}
            <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-white dark:text-black">
                {text}
            </div>
        </div>
    );
};
