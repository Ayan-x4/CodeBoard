import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function IconButton({ label, children, active, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode; active?: boolean }) {
  return <button type="button" title={label} aria-label={label} aria-pressed={active === undefined ? undefined : active} className={`icon-button ${active ? 'active' : ''} ${className}`} {...props}>{children}</button>;
}
