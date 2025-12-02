import { useState, useEffect } from "react";

/**
 * Custom hook for debouncing values
 * @param {any} value - The value to debounce
 * @param {number} delay - The delay in milliseconds
 * @returns {any} The debounced value
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer if value changes before delay is reached
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Custom hook for debouncing callbacks
 * @param {Function} callback - The callback function to debounce
 * @param {number} delay - The delay in milliseconds
 * @param {Array} deps - Dependencies array
 * @returns {Function} The debounced callback
 */
export const useDebounceCallback = (callback, delay, deps = []) => {
  const [debouncedCallback, setDebouncedCallback] = useState(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCallback(() => callback);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [...deps, delay]);

  return debouncedCallback;
};

/**
 * Custom hook for debouncing with immediate execution option
 * @param {any} value - The value to debounce
 * @param {number} delay - The delay in milliseconds
 * @param {boolean} immediate - Whether to execute immediately on first call
 * @returns {any} The debounced value
 */
export const useDebounceWithImmediate = (value, delay, immediate = false) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const [isFirstCall, setIsFirstCall] = useState(true);

  useEffect(() => {
    if (immediate && isFirstCall) {
      setDebouncedValue(value);
      setIsFirstCall(false);
      return;
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay, immediate, isFirstCall]);

  return debouncedValue;
};

export default useDebounce;
