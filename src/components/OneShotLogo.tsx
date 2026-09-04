import React from 'react';

/* ─────────────────────────────────────────────────────────────
   ONE SHOT FMGE — brand mark
   A sage medallion: the outer ring reads as the "O" / ONE SHOT
   scope, enclosing a geometric monoline "S". Clean, precise,
   recognizable from 16px up. Works on light and dark.
   ───────────────────────────────────────────────────────────── */

type OneShotLogoVariant = 'icon' | 'compact' | 'full';

interface OneShotLogoProps {
  variant?: OneShotLogoVariant;
  inverse?: boolean;
  className?: string;
}

const SAGE = '#006B63';
const IVORY = '#F5F2EB';

function Mark({ inverse, className = '' }: { inverse?: boolean; className?: string }) {
  const tile = inverse ? IVORY : SAGE;
  const stroke = inverse ? SAGE : IVORY;
  return (
    <svg
      viewBox="0 0 48 48"
      className={`block shrink-0 ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="48" height="48" rx="12" fill={tile} />
      <circle
        cx="24"
        cy="24"
        r="15.6"
        fill="none"
        stroke={stroke}
        strokeWidth="3"
      />
      <path
        d="M30 15.5C28.4 13.6 26.3 12.8 24.2 12.8C20.6 12.8 18.2 14.4 18.2 16.9C18.2 19.1 19.7 20.6 21.9 21.7C24.9 23.2 27.9 24.6 27.9 27.6C27.9 29.9 26 31.7 23.4 31.7C21.1 31.7 19.1 30.4 18.2 28.7"
        fill="none"
        stroke={stroke}
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Wordmark({ inverse, className = '' }: { inverse?: boolean; className?: string }) {
  return (
    <span className={`flex items-center gap-1.5 ${className}`}>
      <span className={`font-['Newsreader'] font-semibold tracking-tight ${inverse ? 'text-[#F5F2EB]' : 'text-[#4a3b32]'}`}>
        ONE SHOT
      </span>
      <span className="font-mono font-bold px-1.5 py-0.5 rounded-sm bg-[#F5F7F8] text-[#006B63] tracking-wider">
        FMGE
      </span>
    </span>
  );
}

export default function OneShotLogo({
  variant = 'icon',
  inverse = false,
  className = '',
}: OneShotLogoProps) {
  if (variant === 'icon') {
    return <Mark inverse={inverse} className={className} />;
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <Mark inverse={inverse} className="h-7 w-7" />
        <Wordmark inverse={inverse} />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Mark inverse={inverse} className="h-10 w-10" />
      <div className="flex flex-col leading-tight">
        <span className={`font-['Newsreader'] font-semibold tracking-tight ${inverse ? 'text-[#F5F2EB]' : 'text-[#4a3b32]'}`}>
          ONE SHOT
        </span>
        <span className="text-[10px] font-medium tracking-tight text-[#877867]">
          FMGE Preparation Platform
        </span>
      </div>
    </div>
  );
}
