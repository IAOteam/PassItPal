// frontend/src/components/ui/RangeSlider.tsx
import React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';

const RangeSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn('relative flex w-full touch-none select-none items-center group', className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-neutral-400 dark:bg-neutral-800">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    
    {/* First Thumb with Tooltip */}
    <SliderPrimitive.Thumb className="block h-5 w-5 bg-neutral-400 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <div className="relative hidden group-hover:block group-active:block">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-primary"></div>
          <div className="bg-primary text-primary-foreground text-xs rounded-md px-2 py-1 whitespace-nowrap">
            ₹{props.value?.[0].toLocaleString('en-IN')}
          </div>
        </div>
      </div>
    </SliderPrimitive.Thumb>
    
    {/* Second Thumb with Tooltip */}
    <SliderPrimitive.Thumb className="block h-5 w-5 bg-neutral-400 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <div className="relative hidden group-hover:block group-active:block">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-primary"></div>
            <div className="bg-primary text-primary-foreground text-xs rounded-md px-2 py-1 whitespace-nowrap">
               ₹{props.value?.[1].toLocaleString('en-IN')}
            </div>
          </div>
        </div>
    </SliderPrimitive.Thumb>
  </SliderPrimitive.Root>
));

RangeSlider.displayName = SliderPrimitive.Root.displayName;

export { RangeSlider };