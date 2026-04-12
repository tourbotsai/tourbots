"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HelpError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Help route error:", error);
  }, [error]);

  return (
    <div className="min-h-[320px] flex items-center justify-center">
      <div className="rounded-xl border border-red-200 bg-white p-6 dark:border-red-900/40 dark:bg-slate-950">
        <div className="mb-2 flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          <h2 className="font-semibold">Help Centre failed to load</h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Please retry loading support content.
        </p>
        <Button onClick={reset} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
