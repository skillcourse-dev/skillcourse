import { useEffect, useRef, useState } from 'react';

export type FetchState<T> =
  | { status: 'loading'; data?: undefined; error?: undefined }
  | { status: 'ok'; data: T; error?: undefined }
  | { status: 'error'; data?: undefined; error: Error };

/**
 * Minimal data-fetching hook for read-only Plan 4 surfaces. Re-fetches when `key`
 * changes (typically a slug or composite string). No request cancellation in v0.1.
 *
 * CONTRACT: `key` must encode every value that `fn`'s closure captures. The hook
 * stores `fn` in a ref so it always invokes the LATEST closure, but only re-fetches
 * when `key` changes.
 */
export function useFetch<T>(key: string, fn: () => Promise<T>): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({ status: 'loading' });
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    fnRef.current().then(
      (data) => {
        if (!cancelled) setState({ status: 'ok', data });
      },
      (err: unknown) => {
        if (!cancelled) setState({ status: 'error', error: err instanceof Error ? err : new Error(String(err)) });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [key]);

  return state;
}
