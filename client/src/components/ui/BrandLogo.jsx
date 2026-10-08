import React from 'react';

const BrandLogo = ({ className = 'w-9 h-9', showText = false, textClassName = 'text-xl' }) => {
  return (
    <div className="flex items-center space-x-2.5 group">
      <svg
        viewBox="40 10 370 400"
        className={`${className} text-white transition-transform duration-200 group-hover:scale-105 shrink-0`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="brand-logo-cutout">
            <rect width="100%" height="100%" fill="white" />
            <rect x="244" y="112" width="22" height="22" rx="2" fill="black" />
          </mask>
        </defs>

        {/* Left Bracket: Theme Text color (Ivory/White) */}
        <path
          d="M 175,25 C 110,25 110,75 110,150 L 110,175 C 110,198 90,210 50,210 C 90,210 110,222 110,245 L 110,270 C 110,345 110,395 175,395 L 175,355 C 145,355 145,325 145,265 L 145,235 C 145,215 125,210 95,210 C 125,210 145,205 145,185 L 145,155 C 145,95 145,65 175,65 Z"
          fill="currentColor"
        />

        {/* Right Fragmented Bracket: Custom Khaki Gold #C0B283 */}
        <g fill="#C0B283">
          <path
            mask="url(#brand-logo-cutout)"
            d="M 210,395 C 275,395 275,345 275,270 L 275,245 C 275,222 295,210 335,210 C 295,210 275,198 275,175 L 275,150 C 275,115 255,95 210,95 L 210,135 C 238,135 240,148 240,170 L 240,185 C 240,205 260,210 290,210 C 260,210 240,215 240,235 L 240,265 C 240,325 240,355 210,355 Z"
          />

          {/* Disintegrated Pixel Burst (#C0B283) */}
          <rect x="242" y="44" width="38" height="38" rx="3" />
          <rect x="305" y="82" width="34" height="34" rx="3" />
          <rect x="305" y="140" width="26" height="26" rx="2.5" />
          <rect x="374" y="32" width="22" height="22" rx="2" />
        </g>
      </svg>

      {showText && (
        <span className={`font-extrabold text-white font-sans tracking-tight ${textClassName}`}>
          CodeInsight<span className="text-primary-400">.AI</span>
        </span>
      )}
    </div>
  );
};

export default BrandLogo;
