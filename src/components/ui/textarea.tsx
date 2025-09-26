
'use client';

import * as React from 'react';
import { useEffect, useRef } from 'react';

import {cn} from '@/lib/utils';

// Custom hook for autosizing textarea
const useAutosizeTextArea = (
  textAreaRef: HTMLTextAreaElement | null,
  value: string | number | readonly string[] | undefined
) => {
  useEffect(() => {
    if (textAreaRef) {
      // We need to reset the height momentarily to get the correct scrollHeight for shrinking
      textAreaRef.style.height = '0px';
      const scrollHeight = textAreaRef.scrollHeight;

      // We then set the height directly, outside of the render loop
      textAreaRef.style.height = scrollHeight + 'px';
    }
  }, [textAreaRef, value]);
};


const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({className, ...props}, ref) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    
    // Allow parent to pass a ref if needed, otherwise use internal ref
    const effectiveRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;

    useAutosizeTextArea(effectiveRef.current, props.value);

    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden resize-none',
          className
        )}
        ref={effectiveRef}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export {Textarea};
