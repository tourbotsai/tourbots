"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App segment error:", error);
  }, [error]);

  return (
    <div className="min-h-[420px] flex items-center justify-center">
      <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-8 shadow-sm dark:border-red-900/40 dark:bg-slate-950">
        <div className="mb-4 flex items-center gap-3 text-red-600">
          <AlertTriangle className="h-6 w-6" />
          <h2 className="text-xl font-semibold">Something went wrong</h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          We could not load this part of your workspace. Please try again.
        </p>
        <Button className="mt-6" onClick={reset}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
