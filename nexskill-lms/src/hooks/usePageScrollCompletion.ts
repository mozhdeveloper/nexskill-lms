import { useEffect, useRef } from 'react';

interface UsePageScrollCompletionOptions {
  onComplete: () => void;
  enabled?: boolean;
  resetKey?: unknown;
}

export const usePageScrollCompletion = ({
  onComplete,
  enabled = true,
  resetKey,
}: UsePageScrollCompletionOptions) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const hasTriggeredRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    console.log('[usePageScrollCompletion] Effect ran', { enabled, resetKey, hasElement: !!triggerRef.current });

    hasTriggeredRef.current = false;

    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (!enabled) {
      console.log('[usePageScrollCompletion] Disabled, skipping observer setup');
      return;
    }

    const attach = (el: HTMLDivElement) => {
      console.log('[usePageScrollCompletion] Attaching IntersectionObserver to element:', el);
      const observer = new IntersectionObserver(
        (entries) => {
          console.log('[usePageScrollCompletion] IntersectionObserver fired', { 
            isIntersecting: entries[0].isIntersecting, 
            hasTriggered: hasTriggeredRef.current,
            intersectionRatio: entries[0].intersectionRatio,
          });
          if (hasTriggeredRef.current) return;
          if (entries[0].isIntersecting) {
            console.log('[usePageScrollCompletion] TRIGGERING onComplete');
            hasTriggeredRef.current = true;
            observer.disconnect();
            observerRef.current = null;
            onCompleteRef.current();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(el);
      observerRef.current = observer;
    };

    if (triggerRef.current) {
      console.log('[usePageScrollCompletion] Element already in DOM, attaching immediately');
      attach(triggerRef.current);
      return;
    }

    console.log('[usePageScrollCompletion] Element not in DOM yet, polling...');
    const poll = setInterval(() => {
      console.log('[usePageScrollCompletion] Polling...', { hasElement: !!triggerRef.current });
      if (triggerRef.current) {
        clearInterval(poll);
        console.log('[usePageScrollCompletion] Found element after polling, attaching');
        attach(triggerRef.current);
      }
    }, 50);

    return () => {
      clearInterval(poll);
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [enabled, resetKey]);

  return { triggerRef };
};

export default usePageScrollCompletion;