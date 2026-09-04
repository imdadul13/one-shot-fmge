import React from 'react';

interface DoctorMountainArtProps {
  className?: string;
  quote?: string;
}

export const DoctorMountainArt: React.FC<DoctorMountainArtProps> = ({
  className = '',
  quote = "“Discipline today builds the doctor you'll be tomorrow.”",
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-50/70 via-sky-50/50 to-teal-50/80 border border-teal-100/60 p-5 sm:p-6 flex flex-col justify-between ${className}`}
    >
      {/* Soft Ambient Mountain & Sunrise Vector Graphic */}
      <div className="absolute right-0 bottom-0 top-0 w-64 sm:w-80 pointer-events-none opacity-90 select-none overflow-hidden">
        <svg
          viewBox="0 0 320 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover object-right-bottom"
          preserveAspectRatio="xMaxYMax slice"
        >
          <defs>
            {/* Sunrise radial glow */}
            <radialGradient id="sunGlow" cx="220" cy="50" r="100" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDE68A" stopOpacity="0.45" />
              <stop offset="0.6" stopColor="#BAE6FD" stopOpacity="0.25" />
              <stop offset="1" stopColor="#E0F2FE" stopOpacity="0" />
            </radialGradient>
            {/* Mountain 1 Far */}
            <linearGradient id="mtnFar" x1="160" y1="50" x2="160" y2="180" gradientUnits="userSpaceOnUse">
              <stop stopColor="#93C5FD" stopOpacity="0.35" />
              <stop offset="1" stopColor="#BAE6FD" stopOpacity="0.6" />
            </linearGradient>
            {/* Mountain 2 Mid */}
            <linearGradient id="mtnMid" x1="200" y1="70" x2="200" y2="180" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38BDF8" stopOpacity="0.45" />
              <stop offset="1" stopColor="#0284C7" stopOpacity="0.65" />
            </linearGradient>
            {/* Mountain 3 Fore */}
            <linearGradient id="mtnFore" x1="240" y1="90" x2="240" y2="180" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0D9488" stopOpacity="0.55" />
              <stop offset="1" stopColor="#042F2E" stopOpacity="0.85" />
            </linearGradient>
          </defs>

          {/* Background Sun Glow */}
          <circle cx="230" cy="65" r="55" fill="url(#sunGlow)" />

          {/* Distant Mountain Ridge */}
          <path
            d="M80 180L150 78L190 120L250 55L320 125V180H80Z"
            fill="url(#mtnFar)"
          />

          {/* Midground Mountain Ridge */}
          <path
            d="M130 180L195 90L235 130L285 75L330 135V180H130Z"
            fill="url(#mtnMid)"
          />

          {/* Foreground Mountain Peak */}
          <path
            d="M170 180L240 108L280 145L330 98V180H170Z"
            fill="url(#mtnFore)"
          />

          {/* Stylized Doctor Silhouette Looking Toward Horizon */}
          <g transform="translate(252, 78) scale(0.65)">
            {/* Head & Hair */}
            <ellipse cx="26" cy="16" rx="9" ry="11" fill="#0F172A" />
            <path
              d="M17 14C17 8 21 5 28 5C33 5 36 9 35 14C32 12 28 12 24 14C20 16 18 18 17 21Z"
              fill="#1E293B"
            />
            {/* Neck */}
            <rect x="23" y="24" width="7" height="6" fill="#F8FAFC" />
            {/* Stethoscope around neck */}
            <path
              d="M19 28C19 36 21 44 26 47C31 44 33 36 33 28"
              stroke="#0284C7"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="26" cy="49" r="3.5" fill="#0284C7" />
            {/* White Coat Shoulders & Back */}
            <path
              d="M13 32C15 28 20 27 26 27C32 27 37 28 40 32L44 85H8L13 32Z"
              fill="#FFFFFF"
              stroke="#CBD5E1"
              strokeWidth="1.2"
            />
            {/* Coat collar lapels */}
            <path
              d="M19 28L24 45L26 36L28 45L33 28"
              stroke="#94A3B8"
              strokeWidth="1.2"
              fill="none"
            />
            {/* Back seam & arm folds */}
            <path d="M26 36V75" stroke="#E2E8F0" strokeWidth="1.2" />
            <path d="M15 42L11 65" stroke="#E2E8F0" strokeWidth="1.2" />
            <path d="M37 42L41 65" stroke="#E2E8F0" strokeWidth="1.2" />
          </g>
        </svg>
      </div>

      {/* Quote callout content on left */}
      <div className="relative z-10 max-w-sm sm:max-w-md pr-16 sm:pr-24">
        <div className="inline-flex items-center gap-1.5 text-[#006B63] font-semibold text-xs mb-1 font-mono uppercase tracking-wider">
          <span className="h-1.5 w-1.5 rounded-full bg-[#006B63]" />
          Doctor's Creed
        </div>
        <p className="text-sm sm:text-base font-display font-medium text-slate-800 leading-snug">
          {quote}
        </p>
      </div>
    </div>
  );
};
