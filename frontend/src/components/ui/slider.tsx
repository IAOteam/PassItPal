import React, { useRef, useCallback, useState, useEffect } from "react";

interface DualRangeSliderProps {
  min?: number;
  max?: number;
  step?: number;
  value: [number, number]; // controlled value
  onValueChange: (newRange: [number, number]) => void; // controlled callback
  className?: string;
}

export function DualRangeSlider({
  min = 0,
  max = 1000,
  step = 1,
  value,
  onValueChange,
  className = "",
}: DualRangeSliderProps) {
  const [isDragging, setIsDragging] = useState<"min" | "max" | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [minValue, maxValue] = value;

  const getPercentage = (val: number) => ((val - min) / (max - min)) * 100;

  const getValueFromPosition = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return min;
      const rect = sliderRef.current.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const val = min + percentage * (max - min);
      return Math.round(val / step) * step;
    },
    [min, max, step]
  );

  const handleMouseDown = (handle: "min" | "max") => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(handle);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const newValue = getValueFromPosition(e.clientX);

      if (isDragging === "min") {
        const newMin = Math.min(newValue, maxValue - step);
        onValueChange([Math.max(min, newMin), maxValue]);
      } else {
        const newMax = Math.max(newValue, minValue + step);
        onValueChange([minValue, Math.min(max, newMax)]);
      }
    },
    [isDragging, getValueFromPosition, min, max, step, minValue, maxValue, onValueChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleTrackClick = (e: React.MouseEvent) => {
    if (isDragging) return;

    const clickedValue = getValueFromPosition(e.clientX);
    const distanceToMin = Math.abs(clickedValue - minValue);
    const distanceToMax = Math.abs(clickedValue - maxValue);

    if (distanceToMin < distanceToMax) {
      const newMin = Math.min(clickedValue, maxValue - step);
      onValueChange([Math.max(min, newMin), maxValue]);
    } else {
      const newMax = Math.max(clickedValue, minValue + step);
      onValueChange([minValue, Math.min(max, newMax)]);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-4 ">
        <h3 className="text-sm font-medium text-gray-800 dark:text-gray-300 mb-2">Price Range</h3>
        <div className="flex justify-between text-sm text-gray-800 dark:text-gray-300">
          <span>₹{minValue}</span>
          <span>₹{maxValue}</span>
        </div>
      </div>

      <div className="relative">
        {/* Track */}
        <div
          ref={sliderRef}
          className="relative h-2 bg-neutral-500 rounded-full cursor-pointer"
          onClick={handleTrackClick}
        >
          {/* Active range */}
          <div
            className="absolute h-2 bg-neutral-700 dark:bg-neutral-400 rounded-full"
            style={{
              left: `${getPercentage(minValue)}%`,
              width: `${getPercentage(maxValue) - getPercentage(minValue)}%`,
            }}
          />

          {/* Min handle */}
          <div
            className="absolute w-5 h-5 bg-black dark:bg-white rounded-full cursor-grab active:cursor-grabbing transform -translate-x-1/2 -translate-y-1/2 top-1/2 hover:scale-110 transition-transform"
            style={{ left: `${getPercentage(minValue)}%` }}
            onMouseDown={handleMouseDown("min")}
            role="slider"
            aria-valuemin={min}
            aria-valuemax={maxValue - step}
            aria-valuenow={minValue}
            aria-label="Minimum price"
            tabIndex={0}
          />

          {/* Max handle */}
          <div
            className="absolute w-5 h-5 bg-black dark:bg-white rounded-full cursor-grab active:cursor-grabbing transform -translate-x-1/2 -translate-y-1/2 top-1/2 hover:scale-110 transition-transform"
            style={{ left: `${getPercentage(maxValue)}%` }}
            onMouseDown={handleMouseDown("max")}
            role="slider"
            aria-valuemin={minValue + step}
            aria-valuemax={max}
            aria-valuenow={maxValue}
            aria-label="Maximum price"
            tabIndex={0}
          />
        </div>
      </div>
    </div>
  );
}
