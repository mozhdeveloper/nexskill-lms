import { useEffect, useRef, useCallback } from 'react';

/**
 * Best-effort video content protection (without DRM).
 * Deters casual screenshots, screen recording, and screen sharing
 * by blurring the video container when capture is detected.
 *
 * NOT a substitute for DRM — determined users can bypass this.
 */
export function useVideoProtection(containerRef: React.RefObject<HTMLElement | null>) {
  const isProtecting = useRef(false);

  const blurVideo = useCallback(() => {
    if (containerRef.current && !isProtecting.current) {
      isProtecting.current = true;
      containerRef.current.style.filter = 'blur(30px)';
      containerRef.current.style.transition = 'filter 0.1s';
    }
  }, [containerRef]);

  const unblurVideo = useCallback(() => {
    if (containerRef.current && isProtecting.current) {
      isProtecting.current = false;
      containerRef.current.style.filter = 'none';
    }
  }, [containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- 1. Block PrintScreen key (Windows) ---
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen
      if (e.key === 'PrintScreen') {
        blurVideo();
        // Attempt to clear clipboard
        navigator.clipboard?.writeText?.('').catch(() => {});
        setTimeout(unblurVideo, 1500);
      }
      // Snipping Tool shortcuts (Win+Shift+S)
      if (e.key === 's' && e.shiftKey && e.metaKey) {
        blurVideo();
        setTimeout(unblurVideo, 3000);
      }
      // macOS screenshot shortcuts (Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5)
      if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
        blurVideo();
        setTimeout(unblurVideo, 3000);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        // Double-clear clipboard on key release too
        navigator.clipboard?.writeText?.('').catch(() => {});
      }
    };

    // --- 2. Visibility change (tab switch / alt-tab) ---
    const handleVisibilityChange = () => {
      if (document.hidden) {
        blurVideo();
      } else {
        // Small delay before unblurring to catch quick switch-back screenshots
        setTimeout(unblurVideo, 300);
      }
    };

    // --- 3. Blur on window focus loss ---
    const handleBlur = () => blurVideo();
    const handleFocus = () => setTimeout(unblurVideo, 300);

    // --- 4. Disable right-click on the video container ---
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // --- 5. Prevent drag (stops drag-to-desktop save) ---
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // --- 6. Detect screen capture / recording APIs ---
    // When screen sharing starts via getDisplayMedia, blur
    let mediaStreamCleanup: (() => void) | null = null;

    const detectScreenCapture = () => {
      // Override getDisplayMedia to detect when screen sharing starts
      if (navigator.mediaDevices?.getDisplayMedia) {
        const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
        navigator.mediaDevices.getDisplayMedia = async function (constraints?: DisplayMediaStreamOptions) {
          blurVideo();
          const stream = await originalGetDisplayMedia(constraints);
          // When screen share stops, unblur
          stream.getVideoTracks().forEach((track) => {
            track.addEventListener('ended', () => {
              unblurVideo();
            });
          });
          return stream;
        };
        mediaStreamCleanup = () => {
          navigator.mediaDevices.getDisplayMedia = originalGetDisplayMedia;
        };
      }
    };

    // --- 7. DevTools detection (resize-based heuristic) ---
    let devToolsOpen = false;
    const checkDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      const isOpen = widthThreshold || heightThreshold;

      if (isOpen && !devToolsOpen) {
        devToolsOpen = true;
        blurVideo();
      } else if (!isOpen && devToolsOpen) {
        devToolsOpen = false;
        unblurVideo();
      }
    };
    const devtoolsInterval = setInterval(checkDevTools, 1000);

    // --- 8. Detect Picture-in-Picture (prevents PiP recording) ---
    const handlePipEnter = () => blurVideo();
    const handlePipLeave = () => unblurVideo();

    const videoEl = container.querySelector('video');
    if (videoEl) {
      videoEl.addEventListener('enterpictureinpicture', handlePipEnter);
      videoEl.addEventListener('leavepictureinpicture', handlePipLeave);
      // Disable PiP entirely
      videoEl.disablePictureInPicture = true;
    }

    // Attach listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    container.addEventListener('contextmenu', handleContextMenu);
    container.addEventListener('dragstart', handleDragStart);
    detectScreenCapture();

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      container.removeEventListener('contextmenu', handleContextMenu);
      container.removeEventListener('dragstart', handleDragStart);
      clearInterval(devtoolsInterval);
      mediaStreamCleanup?.();

      if (videoEl) {
        videoEl.removeEventListener('enterpictureinpicture', handlePipEnter);
        videoEl.removeEventListener('leavepictureinpicture', handlePipLeave);
      }
    };
  }, [containerRef, blurVideo, unblurVideo]);
}
