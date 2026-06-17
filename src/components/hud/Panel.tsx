import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  solid?: boolean;
}

export function Panel({ children, className = '', solid = true }: Props) {
  const base = solid
    ? 'bg-panel/90 backdrop-blur-sm border border-edge rounded-lg'
    : 'border border-edge rounded-lg';
  return (
    <div className={`${base} ${className}`}>
      {children}
    </div>
  );
}
