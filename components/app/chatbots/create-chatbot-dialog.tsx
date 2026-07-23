"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Globe, Camera, ChevronLeft, ChevronRight, UploadCloud, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tour } from "@/lib/types";

interface CreateChatbotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing primary tour locations the venue can link a tour chatbot to. */
  tours: Tour[];
  /** Creates a website chatbot and resolves once it's ready to be selected. */
  onCreateWebsiteChatbot: () => void | Promise<void>;
  isCreatingWebsiteChatbot?: boolean;
  /** Switches the page to an existing tour's chatbot slot (may or may not have a saved config yet). */
  onSelectTour: (tourId: string) => void;
}

type Step = "choose" | "pick-tour";

/**
 * "Create new chatbot" chooser: website vs. tour, and, for tour, which tour to link.
 * A tour location always has a chatbot "slot" the moment it exists (the actual
 * `chatbot_configs` row is only created once Settings is saved), so picking a tour here
 * just switches the page to that tour's slot rather than calling a create API itself.
 */
export function CreateChatbotDialog({
  open,
  onOpenChange,
  tours,
  onCreateWebsiteChatbot,
  isCreatingWebsiteChatbot = false,
  onSelectTour,
}: CreateChatbotDialogProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("choose");

  // Always land back on the first step when the dialog is reopened.
  useEffect(() => {
    if (open) setStep("choose");
  }, [open]);

  const handleUploadNewTour = () => {
    onOpenChange(false);
    router.push("/app/tours");
  };

  const handleWebsiteClick = async () => {
    await onCreateWebsiteChatbot();
    onOpenChange(false);
  };

  const handleTourClick = (tourId: string) => {
    onSelectTour(tourId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isCreatingWebsiteChatbot && onOpenChange(next)}>
      <DialogContent className="dark:border-input dark:bg-background sm:max-w-lg">
        {step === "choose" ? (
          <>
            <DialogHeader>
              <DialogTitle>What chatbot do you want to make?</DialogTitle>
              <DialogDescription>
                Choose whether this new chatbot lives on your website, or guides visitors through a specific virtual tour.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setStep("pick-tour")}
                className="group flex flex-col items-start gap-2 rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-slate-900 hover:bg-slate-50 dark:border-input dark:bg-background dark:hover:border-slate-400 dark:hover:bg-neutral-800"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-slate-200">
                  <Camera className="h-4.5 w-4.5" />
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Tour chatbot</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Linked to one of your virtual tours, answering questions and guiding visitors through it.
                </span>
                <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-slate-700 group-hover:underline dark:text-slate-300">
                  Choose a tour
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </button>

              <button
                type="button"
                onClick={handleWebsiteClick}
                disabled={isCreatingWebsiteChatbot}
                className="group flex flex-col items-start gap-2 rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-input dark:bg-background dark:hover:border-slate-400 dark:hover:bg-neutral-800"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-slate-200">
                  <Globe className="h-4.5 w-4.5" />
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Website chatbot</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Not tied to any particular tour, just answering general questions anywhere on your site.
                </span>
                <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                  {isCreatingWebsiteChatbot ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Creating…
                    </>
                  ) : (
                    <>
                      Create it
                      <ChevronRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </span>
              </button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <button
                type="button"
                onClick={() => setStep("choose")}
                className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Back
              </button>
              <DialogTitle>Which tour should this chatbot guide?</DialogTitle>
              <DialogDescription>
                {tours.length > 0
                  ? "Link an existing tour, or upload a new one first."
                  : "You don't have any tours yet, so upload one first, then come back here."}
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[280px] space-y-1.5 overflow-y-auto pr-1">
              {tours.map((tour) => (
                <button
                  key={tour.id}
                  type="button"
                  onClick={() => handleTourClick(tour.id)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left text-sm transition-colors hover:border-slate-900 hover:bg-slate-50 dark:border-input dark:bg-background dark:hover:border-slate-400 dark:hover:bg-neutral-800"
                >
                  <span className="flex items-center gap-2 truncate font-medium text-slate-800 dark:text-slate-100">
                    <Camera className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{tour.title}</span>
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleUploadNewTour}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-3 text-sm font-medium text-slate-600 transition-colors hover:border-slate-900 hover:bg-slate-50 dark:border-neutral-600 dark:text-slate-300 dark:hover:border-slate-400 dark:hover:bg-neutral-800",
                tours.length === 0 && "border-solid bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
              )}
            >
              <UploadCloud className="h-4 w-4" />
              {tours.length === 0 ? "Upload your first tour" : "Don't see it? Upload a new tour"}
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
