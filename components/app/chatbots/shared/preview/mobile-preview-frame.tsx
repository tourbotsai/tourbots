"use client";

import React, { FC, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MobilePreviewFrameProps {
  children: ReactNode;
  className?: string;
  deviceType?: 'iphone' | 'android';
  showNotch?: boolean;
}

const MobilePreviewFrame: FC<MobilePreviewFrameProps> = ({
  children,
  className,
  deviceType = 'iphone',
  showNotch = true
}) => {
  return (
    <div className={cn("flex justify-center items-center", className)}>
      {/* Device Frame */}
      <div className="relative">
        {/* Outer Frame */}
        <div
          className="border-4 border-gray-900 rounded-3xl relative bg-black shadow-2xl dark:border-input"
          style={{
            width: '350px',
            height: '720px',
            padding: '10px'
          }}
        >
          {/* Screen */}
          <div className="w-full h-full bg-white dark:border dark:border-input dark:bg-background rounded-2xl overflow-hidden relative">
            {/* Notch (iPhone style) */}
            {showNotch && deviceType === 'iphone' && (
              <div 
                className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10"
                style={{
                  width: '120px',
                  height: '28px',
                  background: '#000',
                  borderRadius: '0 0 16px 16px'
                }}
              />
            )}
            
            {/* Status Bar */}
            <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-gray-100 to-transparent dark:from-neutral-800 dark:to-transparent z-10 flex items-center justify-between px-4 pt-2">
              <div className="flex items-center gap-1">
                <div className="text-xs font-medium text-gray-900 dark:text-gray-100">9:41</div>
              </div>
              <div className="flex items-center gap-1">
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-black dark:bg-white rounded-full"></div>
                  <div className="w-1 h-1 bg-black dark:bg-white rounded-full"></div>
                  <div className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <div className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                </div>
                <div className="w-6 h-3 border border-black dark:border-white rounded-sm relative ml-1">
                  <div className="w-2 h-1 bg-black dark:bg-white rounded-xs absolute right-0 top-0.5"></div>
                </div>
              </div>
            </div>
            
            {/* Content Area */}
            <div className="absolute inset-0 pt-12">
              {children}
            </div>
          </div>
        </div>
        
        {/* Home Indicator */}
        <div 
          className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-36 h-1.5 bg-gray-600 rounded-full"
        />
      </div>
    </div>
  );
};

export default MobilePreviewFrame; 