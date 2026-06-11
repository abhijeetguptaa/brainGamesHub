import { useLayoutEffect } from 'react';

const useDynamicFontSize = (ref: React.RefObject<HTMLButtonElement>) => {
  useLayoutEffect(() => {
    let rafId = 0;
    let isMounted = true;
    const lastAppliedFontSizeRef = { current: '' };

    const adjustFontSize = () => {
      if (!isMounted) return;
      if (!ref.current) return;
      const button = ref.current;
      const span = button.querySelector('span');
      if (!span) return;

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return;

      const text = span.innerText;
      const containerWidth =
        button.clientWidth -
        parseInt(getComputedStyle(button).paddingLeft) -
        parseInt(getComputedStyle(button).paddingRight);

      // Start with the max font size from CSS
      const initialFontSize = parseFloat(getComputedStyle(button).fontSize);
      context.font = `${initialFontSize}px ${getComputedStyle(button).fontFamily}`;

      let measuredWidth = context.measureText(text).width;

      if (measuredWidth > containerWidth) {
        const newFontSize = (containerWidth / measuredWidth) * initialFontSize * 0.9;
        const nextFontSize = `${newFontSize}px`;
        if (lastAppliedFontSizeRef.current !== nextFontSize) {
          button.style.fontSize = nextFontSize;
          lastAppliedFontSizeRef.current = nextFontSize;
        }
      } else if (button.style.fontSize) {
        button.style.fontSize = '';
        lastAppliedFontSizeRef.current = '';
      }
    };

    rafId = requestAnimationFrame(adjustFontSize);
    window.addEventListener('resize', adjustFontSize);

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' && ref.current
        ? new ResizeObserver(() => {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(adjustFontSize);
          })
        : null;

    if (resizeObserver && ref.current) {
      resizeObserver.observe(ref.current);
    }

    return () => {
      isMounted = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', adjustFontSize);
      resizeObserver?.disconnect();
      if (ref.current) {
        ref.current.style.fontSize = '';
      }
    };
  }, [ref]);
};

export default useDynamicFontSize;
