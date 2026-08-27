'use client';
import { useState, useEffect, useCallback, RefObject } from 'react';

export interface DeviceDetectionState {
  isPhone: boolean;
  isTablet: boolean;
  isMobile: boolean;
  windowWidth: number;
  isLandscape: boolean;
  isFullscreen: boolean;
  layoutLandscape: boolean;
  handleToggleFullscreen: () => Promise<void>;
}

export function useDeviceDetection(containerRef: RefObject<HTMLDivElement | null>): DeviceDetectionState {
  const [isPhone, setIsPhone] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1024);
  const [isLandscape, setIsLandscape] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    const lowercaseUa = ua.toLowerCase();

    const isPhoneDevice =
      /iphone|ipod/.test(lowercaseUa) ||
      (/android/.test(lowercaseUa) && /mobile/.test(lowercaseUa)) ||
      /blackberry|iemobile|opera mini/i.test(lowercaseUa);

    const isTabletDevice =
      /ipad/.test(lowercaseUa) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
      (/android/.test(lowercaseUa) && !/mobile/.test(lowercaseUa)) ||
      /tablet|playbook|silk/i.test(lowercaseUa);

    setIsPhone(isPhoneDevice);
    setIsTablet(isTabletDevice);

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const landscape = width > height;

      setIsLandscape(landscape);
      setWindowWidth(width);

      const isPortraitTablet = isTabletDevice && !landscape;
      const isSmallScreen = width < 768;
      setIsMobile(isPhoneDevice || isPortraitTablet || isSmallScreen);
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);
      if (!isCurrentlyFullscreen) {
        const orientation = (screen as any).orientation;
        if (orientation && typeof orientation.unlock === 'function') {
          try {
            orientation.unlock();
          } catch (err) {
            // ignore
          }
        }
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleToggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        const orientation = (screen as any).orientation;
        if (orientation && typeof orientation.lock === 'function') {
          await orientation.lock('landscape').catch(() => {});
        }
      } else {
        await document.exitFullscreen();
        const orientation = (screen as any).orientation;
        if (orientation && typeof orientation.unlock === 'function') {
          try {
            orientation.unlock();
          } catch (err) {
            // ignore
          }
        }
      }
    } catch (err) {
      console.error('Fullscreen/Orientation lock error:', err);
    }
  }, [containerRef]);

  const layoutLandscape = isLandscape || isFullscreen;

  return {
    isPhone,
    isTablet,
    isMobile,
    windowWidth,
    isLandscape,
    isFullscreen,
    layoutLandscape,
    handleToggleFullscreen,
  };
}
