import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface RevealProps {
  as?: React.ElementType;
  threshold?: number;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

const Reveal: React.FC<RevealProps> = ({ as: Tag = 'div', threshold = 0.2, className, children, ...rest }) => {
  const ref = useRef<any>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible');
          observer.unobserve(el);
        }
      });
    }, { threshold });
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const Component = Tag as any;
  
  return (
    <Component ref={ref} className={cn('reveal', className)} {...rest}>
      {children}
    </Component>
  );
};

export default Reveal;
