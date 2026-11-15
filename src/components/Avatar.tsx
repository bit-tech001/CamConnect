import { useState } from 'react';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ name, src, size = 'md' }: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  const sizeClass =
    size === 'sm'
      ? 'w-8 h-8 text-xs'
      : size === 'lg'
        ? 'w-14 h-14 text-base'
        : 'w-10 h-10 text-sm';

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={`${name} portrait`}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={`${sizeClass} rounded-full object-cover border border-slate-200 bg-slate-50 shrink-0`}
      />
    );
  }

  return (
    <div
      aria-label={name}
      className={`${sizeClass} rounded-full border border-slate-200 bg-slate-100 text-slate-700 font-display font-semibold flex items-center justify-center shrink-0`}
    >
      {initials || 'CC'}
    </div>
  );
}
