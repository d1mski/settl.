interface Props {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function HairRule({ orientation = 'horizontal', className = '' }: Props) {
  if (orientation === 'vertical') {
    return <span className={`inline-block w-px h-4 bg-edge ${className}`} />;
  }
  return <div className={`h-px bg-edge ${className}`} />;
}
