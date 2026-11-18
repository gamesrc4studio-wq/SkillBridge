import React, { useState } from 'react';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'w-6 h-6 text-[11px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
};

const PALETTES = [
  'bg-[#DDF4FF] text-[#0969DA] border-[#B6E3FF]',
  'bg-[#DAFBE1] text-[#1A7F37] border-[#ACEEBB]',
  'bg-[#FFF8C5] text-[#9A6700] border-[#FAE17D]',
  'bg-[#F6F8FA] text-[#1F2328] border-[#D1D9E0]',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'SB';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getPaletteIndex(name: string): number {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return sum % PALETTES.length;
}

export const Avatar: React.FC<AvatarProps> = ({ name, src, size = 'md' }) => {
  const [imgError, setImgError] = useState(false);
  const sizeClass = SIZE_CLASSES[size];

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={`${name} avatar`}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={`${sizeClass} rounded-full object-cover border border-[#D1D9E0] shrink-0 bg-[#F6F8FA]`}
      />
    );
  }

  const palette = PALETTES[getPaletteIndex(name)];
  return (
    <div
      aria-label={`${name} initials`}
      className={`${sizeClass} ${palette} rounded-full border font-semibold inline-flex items-center justify-center shrink-0 select-none`}
    >
      {getInitials(name)}
    </div>
  );
};
