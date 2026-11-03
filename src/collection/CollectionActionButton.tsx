import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type CollectionActionIconName = 'add' | 'generate' | 'refresh' | 'lock' | 'unlock' | 'delete';

function CollectionActionIcon({ name }: { name: CollectionActionIconName }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const
  };

  switch (name) {
    case 'add':
      return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
    case 'generate':
      return <svg {...common}><path d="M4 7h3l10 10h3M17 17h3v-3M4 17h3L17 7h3M17 4h3v3" /></svg>;
    case 'refresh':
      return <svg {...common}><path d="M20 11a8 8 0 0 0-14-5L4 8M4 4v4h4M4 13a8 8 0 0 0 14 5l2-2M16 16h4v4" /></svg>;
    case 'lock':
      return <svg {...common}><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></svg>;
    case 'unlock':
      return <svg {...common}><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 7-2.6M12 14v3" /></svg>;
    case 'delete':
      return <svg {...common}><path d="M4 7h16M10 4h4M6 7l1 13h10l1-13M10 11v5M14 11v5" /></svg>;
  }
}

interface CollectionActionButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: CollectionActionIconName;
  tone?: 'primary' | 'secondary' | 'lock' | 'danger';
  children: ReactNode;
}

export function CollectionActionButton({
  icon,
  tone = 'secondary',
  children,
  className = '',
  type = 'button',
  ...rest
}: CollectionActionButtonProps) {
  return (
    <button
      type={type}
      className={['collection-action', 'collection-action--' + tone, className].filter(Boolean).join(' ')}
      {...rest}
    >
      <CollectionActionIcon name={icon} />
      <span>{children}</span>
    </button>
  );
}
