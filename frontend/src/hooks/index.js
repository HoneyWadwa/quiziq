// ─── hooks/index.js — Shared custom hooks ────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from "react";

// ── useTimer ──────────────────────────────────────────────────────────────────
/**
 * Counts elapsed seconds. Pauses when active=false.
 * Returns { elapsed, reset }
 */
export const useTimer = (active) => {
  const [elapsed, setElapsed] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (active) {
      ref.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      clearInterval(ref.current);
    }
    return () => clearInterval(ref.current);
  }, [active]);

  const reset = useCallback(() => setElapsed(0), []);
  return { elapsed, reset };
};

// ── useLocalStorage ───────────────────────────────────────────────────────────
/**
 * useState backed by localStorage. Handles JSON serialisation automatically.
 */
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (err) {
        console.error("useLocalStorage error:", err);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
};

// ── useAsync ──────────────────────────────────────────────────────────────────
/**
 * Wraps an async function with loading/error/data state.
 * Usage: const { execute, loading, data, error } = useAsync(myApiCall)
 */
export const useAsync = (asyncFn) => {
  const [state, setState] = useState({ loading: false, data: null, error: null });

  const execute = useCallback(
    async (...args) => {
      setState({ loading: true, data: null, error: null });
      try {
        const data = await asyncFn(...args);
        setState({ loading: false, data, error: null });
        return data;
      } catch (err) {
        setState({ loading: false, data: null, error: err.message });
        throw err;
      }
    },
    [asyncFn]
  );

  return { ...state, execute };
};

// ── useDocumentTitle ──────────────────────────────────────────────────────────
export const useDocumentTitle = (title) => {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} — QuizIQ` : "QuizIQ";
    return () => { document.title = prev; };
  }, [title]);
};
