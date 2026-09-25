"use client";

import { useCallback, useEffect, useState } from "react";
import type { AvailabilityGridResult } from "@/lib/scheduling";

export function useAvailability(date: string) {
  const [result, setResult] = useState<{
    date: string;
    data?: AvailabilityGridResult;
    error?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setResult(null);
    async function load() {
      try {
        const response = await fetch(
          `/api/availability?date=${encodeURIComponent(date)}`,
          { signal: controller.signal, cache: "no-store" },
        );
        const json: {
          success: boolean;
          data?: AvailabilityGridResult;
          error?: string;
        } = await response.json();
        if (!response.ok || !json.success || !json.data)
          throw new Error("Jadwal belum dapat dimuat.");
        if (!controller.signal.aborted) setResult({ date, data: json.data });
      } catch {
        if (!controller.signal.aborted)
          setResult({
            date,
            error: "Jadwal belum dapat dimuat. Periksa koneksi lalu coba lagi.",
          });
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [date, revision]);

  const current = result?.date === date ? result : null;
  return {
    data: current?.data,
    error: current?.error,
    loading: loading || !current,
    refresh,
  };
}
