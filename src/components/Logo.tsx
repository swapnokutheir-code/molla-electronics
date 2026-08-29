import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function Logo({ size = 'md', showText = true, className = '', onClick }: LogoProps) {
  const [isHovered, setIsHovered] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-11 h-11 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-4xl',
  };

  return (
    <div 
      className={`inline-flex items-center gap-3 select-none ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* SVG Colorful Logo */}
      <div 
        className={`relative ${sizeClasses[size]} shrink-0 transition-all duration-550 ease-out transform ${
          isHovered ? 'scale-110 rotate-6' : 'scale-100 rotate-0'
        }`}
      >
        {/* Colorful Glow Background */}
        <div className="absolute inset-x-0 inset-y-0 bg-gradient-to-tr from-pink-500 via-amber-400 to-cyan-400 rounded-2xl blur-md opacity-75 animate-pulse" />
        
        {/* Core Vector Logo Frame */}
        <div className="relative w-full h-full bg-slate-950 rounded-2xl border border-white/20 p-1.5 flex items-center justify-center overflow-hidden shadow-xl ring-2 ring-white/10">
          <svg 
            viewBox="0 0 100 100" 
            className="w-full h-full drop-shadow-[0_2px_8px_rgba(236,72,153,0.5)]"
          >
            <defs>
              {/* Vibrant colorful gradients */}
              <linearGradient id="logo-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff007f" />
                <stop offset="50%" stopColor="#ffb700" />
                <stop offset="100%" stopColor="#00f3ff" />
              </linearGradient>
              <linearGradient id="logo-circle-grad" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#00f2fe" />
                <stop offset="100%" stopColor="#4facfe" />
              </linearGradient>
            </defs>

            {/* Circuit Background lines (tech indicator) */}
            <path 
              d="M15 50h20 L45 35M15 35h15M15 65h15 L40 75" 
              stroke="url(#logo-grad-1)" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              fill="none" 
              opacity="0.35" 
            />
            <path 
              d="M85 50h-15 L55 65M85 35h-15M85 65h-15" 
              stroke="url(#logo-grad-1)" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              fill="none" 
              opacity="0.35" 
            />

            {/* Glowing Smart Circle Ring */}
            <circle 
              cx="50" 
              cy="50" 
              r="34" 
              stroke="url(#logo-circle-grad)" 
              strokeWidth="5" 
              strokeDasharray="160 55"
              fill="none" 
              className="animate-spin"
              style={{ transformOrigin: '50px 50px', animationDuration: '8s' }}
            />

            {/* Interactive Outer Ring Particles */}
            <circle cx="50" cy="16" r="3.5" fill="#00f3ff" className="animate-ping" style={{ transformOrigin: '50px 50px', animationDuration: '3s' }} />
            <circle cx="50" cy="84" r="3.5" fill="#ff007f" />

            {/* High Tech Stylized "M" Lettering representing "Molla" */}
            <path 
              d="M 28 68 L 28 32 L 44 56 L 50 48 L 56 56 L 72 32 L 72 68" 
              stroke="url(#logo-grad-1)" 
              strokeWidth="8.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              fill="none" 
            />

            {/* Central Node glow */}
            <circle cx="50" cy="48" r="4.5" fill="#ffffff" className="animate-pulse" />
          </svg>
        </div>
      </div>

      {/* Branded text logo with color gradient */}
      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1">
            <span className={`font-black ${textSizes[size]} tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-amber-500 to-cyan-500 flex items-center gap-1.5`}>
              মোল্লা ইলেকট্রনিক্স
            </span>
            {size === 'sm' ? null : <Sparkles className="w-4 h-4 text-amber-400 animate-bounce" />}
          </div>
          <span className="text-[10px] sm:text-xs text-slate-450 font-semibold tracking-wider uppercase leading-none mt-0.5">
            মোবাইল ও স্মার্ট গ্যাজেট পোর্টাল
          </span>
        </div>
      )}
    </div>
  );
}
