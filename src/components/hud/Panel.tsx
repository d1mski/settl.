import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  brackets?: boolean;
  solid?: boolean;
}

export function Panel({ children, className = '', brackets = true, solid = true }: Props) {
  const base = solid
    ? 'bg-panel/90 backdrop-blur-sm border border-edge'
    : 'border border-edge';
  return (
    <div className={`${base} ${brackets ? 'hud-brackets-full' : ''} ${className}`}>
      {brackets && (
        <>
          <span className="bracket tl" />
          <span className="bracket tr" />
          <span className="bracket bl" />
          <span className="bracket br" />
        </>
      )}
      {children}
    </div>
  );
}
