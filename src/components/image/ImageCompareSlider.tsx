import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Columns, SplitSquareVertical } from 'lucide-react';

interface ImageCompareSliderProps {
  originalUrl: string;
  modifiedUrl: string;
  originalLabel?: string;
  modifiedLabel?: string;
  aspectRatioClass?: string;
}

export const ImageCompareSlider: React.FC<ImageCompareSliderProps> = ({
  originalUrl,
  modifiedUrl,
  originalLabel = 'Original / Seed',
  modifiedLabel = 'Modified / Remixed',
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 to 100
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const clamped = Math.max(0, Math.min(rect.width, x));
    const percent = (clamped / rect.width) * 100;
    setSliderPos(percent);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  }, [isDragging, handleMove]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  return (
    <div
      ref={containerRef}
      id="image-compare-container"
      className="relative w-full h-full max-h-[75vh] flex items-center justify-center select-none overflow-hidden rounded-md border border-[#222228] bg-[#070709] cursor-ew-resize"
      onMouseDown={(e) => {
        setIsDragging(true);
        handleMove(e.clientX);
      }}
      onTouchStart={(e) => {
        setIsDragging(true);
        if (e.touches.length > 0) handleMove(e.touches[0].clientX);
      }}
    >
      {/* Modified Image (Full Background) */}
      <img
        src={modifiedUrl}
        alt="Modified"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        referrerPolicy="no-referrer"
      />

      {/* Original Image (Clipped overlay) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ width: `${sliderPos}%` }}
      >
        <img
          src={originalUrl}
          alt="Original"
          className="absolute inset-0 w-full h-full object-contain max-w-none"
          style={{ width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%' }}
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Divider Bar */}
      <div
        className="absolute top-0 bottom-0 z-10 w-0.5 bg-[var(--color-accent)] pointer-events-none shadow-[0_0_10px_rgba(197,164,126,0.6)]"
        style={{ left: `${sliderPos}%` }}
      >
        {/* Handle Knob */}
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#121216] border-2 border-[var(--color-accent)] flex items-center justify-center text-[var(--color-accent)] shadow-xl">
          <SplitSquareVertical className="w-4 h-4 rotate-90" />
        </div>
      </div>

      {/* Badges */}
      <div className="absolute top-3 left-3 px-2 py-1 bg-[#0a0a0e]/80 backdrop-blur-md rounded border border-[#26262e] text-[10px] font-mono text-[#a3a3a3] pointer-events-none">
        {originalLabel}
      </div>
      <div className="absolute top-3 right-3 px-2 py-1 bg-[#0a0a0e]/80 backdrop-blur-md rounded border border-[#26262e] text-[10px] font-mono text-[var(--color-accent)] pointer-events-none">
        {modifiedLabel}
      </div>
    </div>
  );
};
