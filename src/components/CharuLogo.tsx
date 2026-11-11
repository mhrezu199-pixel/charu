/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Charu HCM — Official CAHR (CHARU HR) Brand Logo Component
 *
 * Enforces strict brand color rules requested by the user:
 * - On Black background ('on-black'): Font is WHITE, Icon (person, 3D diamond, growth arrow) is RED.
 * - On Red background ('on-red'): Entire logo (Font + Icon) is pure WHITE.
 * - On Light/White background ('on-light'): Font is BLACK, Icon is RED.
 */

import React from 'react';

export type LogoThemeVariant = 'on-black' | 'on-red' | 'on-light' | 'white';

interface CharuLogoProps {
  variant?: LogoThemeVariant;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'splash';
  animated?: boolean;
  snakeAnimated?: boolean;
  pureWhiteIcon?: boolean;
  showCompanySubtitle?: boolean;
  className?: string;
}

export const LOGO_ASSET_URL = '/assets/aistudio/CAHR_Human_Resources_Growth_Logo_5512a83b.png';

export const CharuLogo: React.FC<CharuLogoProps> = ({
  variant = 'on-black',
  size = 'md',
  animated = false,
  snakeAnimated = false,
  pureWhiteIcon = false,
  showCompanySubtitle = false,
  className = '',
}) => {
  const heightClasses: Record<NonNullable<CharuLogoProps['size']>, string> = {
    xs: 'h-6',
    sm: 'h-8',
    md: 'h-11',
    lg: 'h-14',
    xl: 'h-20',
    splash: 'h-24 sm:h-32 md:h-40',
  };

  // Determine font and icon colors based on variant
  const isLight = variant === 'on-light';
  const isAllWhite = variant === 'on-red' || variant === 'white' || pureWhiteIcon;

  const fontColor = isLight ? '#0D0D0D' : '#FFFFFF';
  const iconColor = isAllWhite ? '#FFFFFF' : '#EC1C24';
  const diamondTop = isAllWhite ? '#FFFFFF' : '#FF2A32';
  const diamondLeft = isAllWhite ? '#EEEEEE' : '#EC1C24';
  const diamondBottom = isAllWhite ? '#DDDDDD' : '#C4141B';
  const diamondRight = isAllWhite ? '#CCCCCC' : '#9E0D14';

  // If snakeAnimated is requested (for the clean Loading Splash screen), render the vector SVG with staggered letter delays
  if (snakeAnimated || isLight) {
    return (
      <div className={`inline-flex flex-col items-center select-none ${className}`}>
        <svg
          viewBox="0 0 600 200"
          className={`${heightClasses[size]} w-auto drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 1. Letter C (Snake delay 0.08s) */}
          <g
            className={snakeAnimated ? 'animate-letter-snake' : ''}
            style={{ animationDelay: '0.08s' }}
          >
            <path
              d="M150 45 H88 C52 45 30 68 30 100 C30 132 52 155 88 155 H150 V130 H92 C70 130 58 118 58 100 C58 82 70 70 92 70 H150 V45 Z"
              fill={fontColor}
            />
          </g>

          {/* 2. Executive Person Icon inside C (Snake delay 0.22s) */}
          <g
            className={snakeAnimated ? 'animate-letter-snake' : ''}
            style={{ animationDelay: '0.22s' }}
          >
            <circle cx="112" cy="78" r="12" fill={iconColor} />
            <path
              d="M84 112 C84 98 96 94 103 94 L108 122 L112 98 L116 122 L121 94 C128 94 140 98 140 112 C140 122 128 126 112 126 C96 126 84 122 84 112 Z"
              fill={iconColor}
            />
          </g>

          {/* 3. 4-Faceted 3D Diamond between C and A (Snake delay 0.36s) */}
          <g
            className={snakeAnimated ? 'animate-letter-snake' : ''}
            style={{ animationDelay: '0.36s' }}
          >
            <polygon points="178,76 202,100 178,100" fill={diamondTop} />
            <polygon points="178,76 154,100 178,100" fill={diamondLeft} />
            <polygon points="154,100 178,124 178,100" fill={diamondBottom} />
            <polygon points="202,100 178,124 178,100" fill={diamondRight} />
          </g>

          {/* 4. Letter A (Snake delay 0.50s) */}
          <g
            className={snakeAnimated ? 'animate-letter-snake' : ''}
            style={{ animationDelay: '0.50s' }}
          >
            <path
              d="M255 45 L210 155 H240 L249 130 H289 L298 155 H328 L283 45 H255 Z M257 106 L269 72 L281 106 H257 Z"
              fill={fontColor}
            />
          </g>

          {/* 5. Letter H (Snake delay 0.64s) */}
          <g
            className={snakeAnimated ? 'animate-letter-snake' : ''}
            style={{ animationDelay: '0.64s' }}
          >
            <path
              d="M342 45 V155 H370 V112 H418 V155 H446 V45 H418 V86 H370 V45 H342 Z"
              fill={fontColor}
            />
          </g>

          {/* 6. Letter R (Snake delay 0.78s) */}
          <g
            className={snakeAnimated ? 'animate-letter-snake' : ''}
            style={{ animationDelay: '0.78s' }}
          >
            <path
              d="M464 45 V155 H492 V114 H514 L538 155 H570 L542 110 C556 104 564 92 564 78 C564 58 548 45 522 45 H464 Z M492 68 H518 C530 68 536 72 536 80 C536 88 530 92 518 92 H492 V68 Z"
              fill={fontColor}
            />
          </g>

          {/* 7. Sweeping Growth Arrow across A & H (Snake delay 0.94s) */}
          <g
            className={snakeAnimated ? 'animate-arrow-swoop' : ''}
            style={{ animationDelay: '0.94s' }}
          >
            <path
              d="M225 130 Q305 95 365 40 L350 36 L396 22 L376 64 L372 49 Q308 108 225 130 Z"
              fill={iconColor}
            />
          </g>

          {/* 8. Subtitle: — CHARU HR — (Snake delay 1.12s) */}
          <g
            className={snakeAnimated ? 'animate-letter-snake' : ''}
            style={{ animationDelay: '1.12s' }}
          >
            <line
              x1="65"
              y1="180"
              x2="165"
              y2="180"
              stroke={fontColor}
              strokeWidth="2.5"
              strokeOpacity="0.45"
            />
            <text
              x="300"
              y="185"
              textAnchor="middle"
              fill={fontColor}
              fontSize="16"
              fontWeight="800"
              letterSpacing="10"
            >
              CHARU HR
            </text>
            <line
              x1="435"
              y1="180"
              x2="535"
              y2="180"
              stroke={fontColor}
              strokeWidth="2.5"
              strokeOpacity="0.45"
            />
          </g>
        </svg>

        {showCompanySubtitle && (
          <span
            className={`text-[10px] font-extrabold tracking-[0.22em] uppercase mt-2 text-center ${
              isLight ? 'text-[#2A1A1B]' : 'text-white/80'
            } ${snakeAnimated ? 'animate-letter-snake' : ''}`}
            style={{ animationDelay: '1.25s' }}
          >
            CHARU CERAMIC INDUSTRIES LTD.
          </span>
        )}
      </div>
    );
  }

  // Standard Image rendering for headers and badges
  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <div className="relative flex items-center justify-center">
        <img
          src={LOGO_ASSET_URL}
          alt="CAHR — CHARU HR (Charu Ceramic Industries Ltd.)"
          className={`${heightClasses[size]} w-auto object-contain transition-all duration-300 ${
            variant === 'on-red'
              ? 'brightness-0 invert drop-shadow-md'
              : 'drop-shadow-[0_4px_16px_rgba(236,28,36,0.28)]'
          } ${animated ? 'animate-logo-float' : ''}`}
        />
      </div>

      {showCompanySubtitle && (
        <div
          className={`text-[10px] sm:text-xs font-bold tracking-[0.22em] uppercase mt-2 text-center ${
            variant === 'on-red' ? 'text-white/90' : 'text-white/75'
          }`}
        >
          CHARU CERAMIC INDUSTRIES LTD.
        </div>
      )}
    </div>
  );
};

