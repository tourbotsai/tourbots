"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

interface TourFullscreenContextType {
  isFullscreen: boolean;
  setIsFullscreen: (isFullscreen: boolean) => void;
}

const TourFullscreenContext = createContext<TourFullscreenContextType | undefined>(undefined);

export function TourFullscreenProvider({ children }: { children: ReactNode }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <TourFullscreenContext.Provider value={{ isFullscreen, setIsFullscreen }}>
      {children}
    </TourFullscreenContext.Provider>
  );
}

export function useTourFullscreen() {
  const context = useContext(TourFullscreenContext);
  if (context === undefined) {
    throw new Error('useTourFullscreen must be used within a TourFullscreenProvider');
  }
  return context;
} 