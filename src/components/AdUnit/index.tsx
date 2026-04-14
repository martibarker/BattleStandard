import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle: Record<string, unknown>[];
  }
}

interface AdUnitProps {
  slot: string;
  format?: 'auto' | 'horizontal' | 'vertical';
}

export default function AdUnit({ slot, format = 'auto' }: AdUnitProps) {
  const insRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;

    const el = insRef.current;
    if (!el) return;

    const tryPush = () => {
      if (pushed.current) return;
      if (el.offsetWidth === 0) return; // container not yet laid out
      pushed.current = true;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        // adsbygoogle script not yet loaded
      }
    };

    tryPush();
    if (pushed.current) return;

    // Wait for the container to gain width before pushing
    const ro = new ResizeObserver(() => {
      tryPush();
      if (pushed.current) ro.disconnect();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <ins
      ref={insRef}
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-client="ca-pub-9498637434144604"
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}
