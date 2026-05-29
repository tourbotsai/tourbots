"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  /** Renders the confirm action with destructive (red) styling. */
  destructive?: boolean;
  /**
   * Called when the user confirms. May be async — the dialog shows a loading
   * state while it resolves and closes automatically on success. If it throws,
   * the dialog stays open so the caller can surface an error.
   */
  onConfirm: () => void | Promise<void>;
  /** Optional secondary action, rendered as an outline button before confirm. */
  secondaryText?: string;
  onSecondary?: () => void | Promise<void>;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  destructive = false,
  onConfirm,
  secondaryText,
  onSecondary,
}: ConfirmDialogProps) {
  const [loadingAction, setLoadingAction] = React.useState<"confirm" | "secondary" | null>(null);
  const isLoading = loadingAction !== null;

  const runAction = async (
    action: "confirm" | "secondary",
    handler: () => void | Promise<void>
  ) => {
    try {
      setLoadingAction(action);
      await handler();
      onOpenChange(false);
    } catch {
      // Leave the dialog open so the caller can show its own error toast.
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (isLoading) return;
        onOpenChange(next);
      }}
    >
      <AlertDialogContent
        className={cn(
          "dark:border-input dark:bg-background",
          secondaryText && onSecondary && "sm:max-w-xl"
        )}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-start">
          <AlertDialogCancel disabled={isLoading}>{cancelText}</AlertDialogCancel>
          {secondaryText && onSecondary ? (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                runAction("secondary", onSecondary);
              }}
              disabled={isLoading}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              {loadingAction === "secondary" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {secondaryText}
            </button>
          ) : null}
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              runAction("confirm", onConfirm);
            }}
            disabled={isLoading}
            className={cn(destructive && buttonVariants({ variant: "destructive" }))}
          >
            {loadingAction === "confirm" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
