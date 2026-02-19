import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

interface TauriCommandState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useTauriCommand<T>(command: string, args?: Record<string, unknown>) {
  const [state, setState] = useState<TauriCommandState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (overrideArgs?: Record<string, unknown>) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const result = await invoke<T>(command, overrideArgs ?? args);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err) {
        const errorMsg = String(err);
        setState({ data: null, loading: false, error: errorMsg });
        throw err;
      }
    },
    [command, args]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}
