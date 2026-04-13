import { useEffect, useRef, useCallback, useState } from 'react';

interface UsePageScrollCompletionOptions {
  onComplete: () => void;
  enabled?: boolean;
}

export const usePageScrollCompletion = ({
  onComplete,
  enabled = true,
}: UsePageScrollCompletionOptions) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const hasTriggeredRef = useRef(false);
  const [elementReady, setElementReady] = useState(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!enabled) return;
    if (triggerRef.current) {
      console.log('[usePageScrollCompletion] Element ready immediately');
      setElementReady(true);
      return;
    }
    const poll = setInterval(() => {
      if (triggerRef.current) {
        clearInterval(poll);
        console.log('[usePageScrollCompletion] Element ready after polling');
        setElementReady(true);
      }
    }, 100);
    return () => clearInterval(poll);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !elementReady) {
      console.log('[usePageScrollCompletion] Not setting up listener:', { enabled, elementReady });
      return;
    }

    const el = triggerRef.current;
    if (!el) {
      console.log('[usePageScrollCompletion] Element ref is null');
      return;
    }

    console.log('[usePageScrollCompletion] Setting up scroll listener');

    const checkVisibility = () => {
      if (hasTriggeredRef.current) return false;

      const currentEl = triggerRef.current;
      if (!currentEl) {
        console.log('[usePageScrollCompletion] Element lost');
        return false;
      }

      const rect = currentEl.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const isVisible = rect.top >= 0 && rect.top <= viewportHeight;

      console.log('[usePageScrollCompletion] Visibility check:', {
        rectTop: rect.top,
        viewportHeight,
        isVisible,
        rect,
      });

      if (isVisible) {
        console.log('[usePageScrollCompletion] Next Lesson button visible, marking lesson complete');
        hasTriggeredRef.current = true;
        onCompleteRef.current();
        return true;
      }
      return false;
    };

    const handleScroll = () => {
      console.log('[usePageScrollCompletion] Scroll event fired');
      checkVisibility();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    const scrollParents: HTMLElement[] = [];
    let parent = el.parentElement;
    while (parent) {
      const style = window.getComputedStyle(parent);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        parent.addEventListener('scroll', handleScroll, { passive: true });
        scrollParents.push(parent);
        console.log('[usePageScrollCompletion] Attached to parent scroll container');
      }
      parent = parent.parentElement;
    }

    setTimeout(checkVisibility, 200);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      scrollParents.forEach(p => p.removeEventListener('scroll', handleScroll));
    };
  }, [enabled, elementReady]);

  return { triggerRef };
};

export default usePageScrollCompletion;
