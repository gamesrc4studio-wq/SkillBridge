import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', showWordmark = true }) => {
  const iconSize = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-xl' : 'text-lg';

  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 select-none">
      <svg
        className={iconSize}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="8" fill="#0969DA" />
        <path
          d="M7 20C9.5 13.5 14 10.5 16 10.5C18 10.5 22.5 13.5 25 20"
          stroke="#FFFFFF"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path d="M16 10.5V22" stroke="#FACC15" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="7.5" cy="20.5" r="2.2" fill="#FFFFFF" />
        <circle cx="16" cy="10.5" r="2.4" fill="#FACC15" />
        <circle cx="24.5" cy="20.5" r="2.2" fill="#FFFFFF" />
      </svg>
      {showWordmark && (
        <span className={`font-bold tracking-tight text-[#1F2328] ${textSize}`}>
          SkillBridge
        </span>
      )}
    </span>
  );
};
