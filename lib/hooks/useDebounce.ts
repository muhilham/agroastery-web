import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  // Use lazy initializer to preserve function values without invoking them
  const [debouncedValue, setDebouncedValue] = useState<T>(() => value as T);

  useEffect(() => {
    const handler = setTimeout(() => {
      // If value is a function, wrap in a function to avoid functional-updater semantics
      if (typeof value === 'function') {
        setDebouncedValue(() => value as T);
      } else {
        setDebouncedValue(value as T);
      }
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
