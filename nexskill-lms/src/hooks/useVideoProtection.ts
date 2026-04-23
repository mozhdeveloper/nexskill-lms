import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Prototype video content protection.
 * - PrintScreen / Win+Shift+S → black overlay (auto-dismisses when focus returns)
 * - DevTools open → black overlay (auto-clears when closed)
 * - Right-click, download, PiP disabled
 * - Keyboard shortcuts for DevTools/save blocked
 */
type BlackoutReason = 'printscreen' | 'devtools' | 'screenshare' | null;

export function useVideoProtection(containerRef: React.RefObject<HTMLElement | null>) {
  const [isBlackout, setIsBlackout] = useState(false);
  const blackoutReason = useRef<BlackoutReason>(null);
  const focusListenerRef = useRef<(() => void) | null>(null);

  const showBlackout = useCallback((reason: NonNullable<BlackoutReason>) => {
    blackoutReason.current = reason;
    setIsBlackout(true);

    // For screenshot blackouts, auto-dismiss when the user returns focus
    if (reason === 'printscreen') {
      // Remove any existing listener first
      if (focusListenerRef.current) {
        window.removeEventListener('focus', focusListenerRef.current);
      }
      const onFocusReturn = () => {
        // Small delay so the blackout is still visible during the transition back
        setTimeout(() => {
          if (blackoutReason.current === 'printscreen') {
            blackoutReason.current = null;
            setIsBlackout(false);
          }
        }, 500);
        window.removeEventListener('focus', onFocusReturn);
        focusListenerRef.current = null;
      };
      focusListenerRef.current = onFocusReturn;
      window.addEventListener('focus', onFocusReturn);
    }
  }, []);

  const hideBlackout = useCallback((reason: NonNullable<BlackoutReason>) => {
    if (blackoutReason.current === reason) {
      blackoutReason.current = null;
      setIsBlackout(false);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isPrintScreen = (e: KeyboardEvent) =>
      e.key === 'PrintScreen' || e.code === 'PrintScreen' || e.keyCode === 44;

    // --- 1. PrintScreen / Win+Shift+S → black overlay ---
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPrintScreen(e)) {
        e.preventDefault();
        showBlackout('printscreen');
        navigator.clipboard?.writeText?.('').catch(() => {});
      }
      // Win+Shift+S (Snipping Tool) — may not fire on all Windows versions
      if (e.key.toLowerCase() === 's' && e.shiftKey && (e.metaKey || e.getModifierState?.('OS'))) {
        showBlackout('printscreen');
      }
      // Block F12, Ctrl+S, Ctrl+U, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (
        e.key === 'F12' ||
        (e.ctrlKey && ['s', 'u', 'p'].includes(e.key.toLowerCase())) ||
        (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (isPrintScreen(e)) {
        showBlackout('printscreen');
        navigator.clipboard?.writeText?.('').catch(() => {});
      }
    };

    // --- 2. DevTools detection (Disabled as it may cause accidental blackouts) ---
    /*
    let devToolsOpen = false;
    const checkDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      const isOpen = widthThreshold || heightThreshold;

      if (isOpen && !devToolsOpen) {
        devToolsOpen = true;
        showBlackout('devtools');
      } else if (!isOpen && devToolsOpen) {
        devToolsOpen = false;
        hideBlackout('devtools');
      }
    };
    const devtoolsInterval = setInterval(checkDevTools, 1000);
    */

    // --- 3. Disable right-click ---
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // --- 4. Prevent drag ---
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    // --- 5. Disable PiP ---
    const videoEl = container.querySelector('video');
    if (videoEl) {
      videoEl.disablePictureInPicture = true;
    }

    // --- 6. Detect browser-based screen share/recording ---
    let mediaStreamCleanup: (() => void) | null = null;
    if (navigator.mediaDevices?.getDisplayMedia) {
      const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getDisplayMedia = async function (constraints?: DisplayMediaStreamOptions) {
        showBlackout('screenshare');
        const stream = await originalGetDisplayMedia(constraints);
        // When screen share/recording stops, remove blackout
        stream.getVideoTracks().forEach((track) => {
          track.addEventListener('ended', () => {
            hideBlackout('screenshare');
          });
        });
        return stream;
      };
      mediaStreamCleanup = () => {
        navigator.mediaDevices.getDisplayMedia = originalGetDisplayMedia;
      };
    }

    // Attach
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    container.addEventListener('contextmenu', handleContextMenu);
    container.addEventListener('dragstart', handleDragStart);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      container.removeEventListener('contextmenu', handleContextMenu);
      container.removeEventListener('dragstart', handleDragStart);
      // clearInterval(devtoolsInterval); // Disabled along with detection
      mediaStreamCleanup?.();
      if (focusListenerRef.current) {
        window.removeEventListener('focus', focusListenerRef.current);
      }
    };
  }, [containerRef, showBlackout, hideBlackout]);

  // Manual dismiss (fallback if auto-dismiss doesn't trigger)
  const dismissBlackout = useCallback(() => {
    if (blackoutReason.current === 'printscreen') {
      blackoutReason.current = null;
      setIsBlackout(false);
    }
  }, []);

  return { isBlackout, dismissBlackout };
}
