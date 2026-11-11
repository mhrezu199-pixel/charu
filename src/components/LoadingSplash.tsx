/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Charu HCM — Minimalist Sequential Letter-Animated Loading Splash
 *
 * Implements user's exact specification:
 * 1. Entire background is Pure Solid Black (#000000) with NO gradient or scaling circle behind the logo.
 * 2. Only the elegant White CAHR Logo appears in the center.
 * 3. Individual letters and emblem elements glide in sequentially step-by-step with a smooth snake wave transition.
 * 4. Minimal, non-intrusive bottom dots indicator.
 */

import React, { useState, useEffect } from 'react';
import { CharuLogo } from './CharuLogo';
import { Locale } from '../types';
import { RotateCcw, X } from 'lucide-react';

export type SplashBgTheme = 'black' | 'red';

interface LoadingSplashProps {
  isOpen: boolean;
  initialTheme?: SplashBgTheme;
  statusText?: string;
  locale?: Locale;
  allowThemeSwitch?: boolean;
  onDismiss?: () => void;
}

export const LoadingSplash: React.FC<LoadingSplashProps> = ({
  isOpen,
  statusText,
  locale = 'bn',
  allowThemeSwitch = true,
  onDismiss,
}) => {
  const [animationKey, setAnimationKey] = useState<number>(0);
  const [step, setStep] = useState<number>(0);
  const [iconMode, setIconMode] = useState<'pure-white' | 'brand-accent'>('pure-white');

  // Re-trigger letter snake animation whenever splash opens
  useEffect(() => {
    if (isOpen) {
      setAnimationKey(prev => prev + 1);
    }
  }, [isOpen]);

  // Animate the bottom pill-and-dots indicator
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setStep(prev => (prev + 1) % 3);
    }, 450);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-between py-12 px-6 select-none bg-[#000000] text-white transition-opacity duration-300"
    >
      {/* Top Controls: Replay Animation & Dismiss */}
      <div className="w-full flex items-center justify-end gap-2 relative z-20">
        {allowThemeSwitch && (
          <div className="inline-flex items-center gap-1.5 bg-[#141414] p-1 rounded-full border border-white/10 text-[11px] font-bold text-white/80">
            <button
              onClick={e => {
                e.stopPropagation();
                setIconMode(prev => (prev === 'pure-white' ? 'brand-accent' : 'pure-white'));
                setAnimationKey(k => k + 1);
              }}
              className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 transition text-white"
              title="Toggle White Logo vs Brand Red Accent Icon"
            >
              {iconMode === 'pure-white'
                ? locale === 'bn'
                  ? 'সাদা লোগো (সক্রিয়)'
                  : 'Pure White Logo'
                : locale === 'bn'
                ? 'লাল আইকন অ্যাকসেন্ট'
                : 'Red Accent Icon'}
            </button>

            <button
              onClick={e => {
                e.stopPropagation();
                setAnimationKey(k => k + 1);
              }}
              className="p-1 rounded-full hover:bg-white/15 text-white/80 hover:text-white transition"
              title={locale === 'bn' ? 'অ্যানিমেশন পুনরায় দেখুন' : 'Replay Snake Animation'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {onDismiss && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  onDismiss();
                }}
                className="ml-1 px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white transition"
                title="Close Splash"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Center Stage: Minimalist Pure Black Background with Sequential Snake Letter Animation */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-xl mx-auto relative z-10">
        {/* CAHR Logo with step-by-step snake transition */}
        <div key={animationKey} className="flex flex-col items-center justify-center">
          <CharuLogo
            variant={iconMode === 'pure-white' ? 'white' : 'on-black'}
            pureWhiteIcon={iconMode === 'pure-white'}
            size="splash"
            snakeAnimated={true}
            showCompanySubtitle={true}
          />
        </div>
      </div>

      {/* Bottom Stage: Sleek Minimalist Indicator Dots */}
      <div className="flex flex-col items-center gap-2.5 pb-4 relative z-20">
        <div className="flex items-center justify-center gap-2.5 h-5">
          {[0, 1, 2].map(idx => {
            const isActive = step === idx;
            return (
              <span
                key={idx}
                className={`transition-all duration-300 rounded-full ${
                  isActive
                    ? 'w-9 h-2.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]'
                    : 'w-2.5 h-2.5 bg-white/25'
                }`}
              />
            );
          })}
        </div>

        {statusText && (
          <p className="text-[11px] font-medium tracking-widest text-white/50 uppercase">
            {statusText}
          </p>
        )}
      </div>
    </div>
  );
};

