import { useEffect, useRef, useState, useCallback } from 'react';

interface UseScrollCompletionOptions {
  onComplete: () => void;
  enabled?: boolean;
}

/**
 * Hook that detects when user scrolls to the bottom of a container.
 * Automatically completes if content is not scrollable (short content).
 */
export const useScrollCompletion = ({ onComplete, enabled = true }: UseScrollCompletionOptions) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const hasTriggeredRef = useRef(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, []);

  // Check if content is scrollable after it renders
  useEffect(() => {
    if (!enabled || !containerRef.current || hasTriggeredRef.current) {
      console.log('[useScrollCompletion] Effect skipped', { enabled, hasRef: containerRef.current, triggered: hasTriggeredRef.current });
      return;
    }

    console.log('[useScrollCompletion] Starting scroll checks...');

    const checkScrollable = () => {
      const element = containerRef.current;
      if (!element || hasTriggeredRef.current) {
        console.log('[useScrollCompletion] checkScrollable early exit', { hasElement: !!element, triggered: hasTriggeredRef.current });
        return;
      }

      // Re-read DOM values fresh each time this runs
      const scrollHeight = element.scrollHeight;
      const clientHeight = element.clientHeight;
      
      // Add 5px buffer for rounding errors
      const scrollable = scrollHeight > clientHeight + 5;
      
      console.log('[useScrollCompletion] checkScrollable result', { scrollHeight, clientHeight, scrollable });
      
      setIsScrollable(scrollable);

      // If not scrollable, mark complete immediately
      if (!scrollable) {
        console.log('[useScrollCompletion] Content not scrollable, marking complete');
        hasTriggeredRef.current = true;
        onComplete();
      }
    };

    // Check multiple times as content renders
    const delays = [0, 100, 250, 500, 1000];
    
    delays.forEach(delay => {
      const timeout = setTimeout(checkScrollable, delay);
      timeoutsRef.current.push(timeout);
    });

  }, [enabled, onComplete]);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!containerRef.current || hasTriggeredRef.current) return;

    const element = containerRef.current;
    const { scrollTop, scrollHeight, clientHeight } = element;

    // Check if scrolled to bottom (with 50px threshold)
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50;

    if (isAtBottom) {
      setHasScrolledToBottom(true);
      hasTriggeredRef.current = true;
      onComplete();
    }
  }, [onComplete]);

  return {
    containerRef,
    isScrollable,
    hasScrolledToBottom,
    handleScroll,
  };
};

export default useScrollCompletion;
