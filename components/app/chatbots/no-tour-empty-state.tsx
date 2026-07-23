"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, ArrowLeft, Globe, Loader2 } from "lucide-react";

interface NoTourEmptyStateProps {
  description?: string;
  onCreateWebsiteChatbot?: () => void;
  isCreatingWebsiteChatbot?: boolean;
}

export function NoTourEmptyState({
  description = "Upload your Matterport tour first, then return here to configure your AI chatbot.",
  onCreateWebsiteChatbot,
  isCreatingWebsiteChatbot = false,
}: NoTourEmptyStateProps) {
  return (
    <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-input dark:bg-background">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="mb-6 rounded-full bg-slate-100 p-6 dark:border dark:border-input dark:bg-background">
          <Camera className="h-12 w-12 text-slate-500" />
        </div>
        <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
          No chatbot available
        </h3>
        <p className="mb-6 max-w-md text-center text-slate-600 dark:text-slate-400">
          {description}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            className="bg-slate-900 text-white hover:bg-slate-800 dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
          >
            <Link href="/app/tours">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Tour Setup
            </Link>
          </Button>
          {onCreateWebsiteChatbot ? (
            <Button
              variant="outline"
              onClick={onCreateWebsiteChatbot}
              disabled={isCreatingWebsiteChatbot}
              className="border-slate-200 bg-white dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
            >
              {isCreatingWebsiteChatbot ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Globe className="w-4 h-4 mr-2" />
              )}
              Create website chatbot instead
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
