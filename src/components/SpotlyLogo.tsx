import React from 'react';

interface SpotlyLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
}

export const SpotlyLogo: React.FC<SpotlyLogoProps> = ({
  size = 'md',
  showWordmark = true,
}) => {
  const iconDimensions =
    size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  const textClass =
    size === 'sm'
      ? 'text-lg'
      : size === 'lg'
        ? 'text-2xl'
        : 'text-xl';

  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 select-none">
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${iconDimensions} shrink-0`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="spotlyPinGrad" x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F43F5E" />
            <stop offset="55%" stopColor="#E11D48" />
            <stop offset="100%" stopColor="#FB7185" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="36" height="36" rx="11" fill="url(#spotlyPinGrad)" />
        <path
          d="M20 8.5C15.0294 8.5 11 12.4624 11 17.35C11 23.38 18.234 30.23 19.442 31.32C19.76 31.607 20.24 31.607 20.558 31.32C21.766 30.23 29 23.38 29 17.35C29 12.4624 24.9706 8.5 20 8.5Z"
          fill="white"
        />
        <path
          d="M20 12.4L21.55 15.85L25 17.4L21.55 18.95L20 22.4L18.45 18.95L15 17.4L18.45 15.85L20 12.4Z"
          fill="#E11D48"
        />
      </svg>
      {showWordmark && (
        <span
          className={`font-display font-extrabold tracking-tight text-slate-900 dark:text-white ${textClass}`}
        >
          Spotly
        </span>
      )}
    </span>
  );
};
