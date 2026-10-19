import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const badgeDimensions = {
    sm: 'w-6 h-6 text-xs rounded-md',
    md: 'w-8 h-8 text-sm rounded-lg',
    lg: 'w-10 h-10 text-base rounded-xl',
  }[size];

  const textSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }[size];

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* 10X Icon: Black background, white 10, emerald bold X */}
      <div
        className={`${badgeDimensions} bg-black flex items-center justify-center font-black tracking-tight shadow-xs border border-white/10 shrink-0`}
        aria-label="10X"
      >
        <span className="text-white font-extrabold">10</span>
        <span className="text-emerald-500 font-black">X</span>
      </div>

      {showText && (
        <span className={`font-black tracking-tight ${textSize} text-white`}>
          10X <span className="text-emerald-500 font-extrabold">RESULTS</span>
        </span>
      )}
    </div>
  );
};
