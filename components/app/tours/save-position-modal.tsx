"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/app/shared/theme-provider";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { MapPin, Save, X } from "lucide-react";

const positionSchema = z.object({
  name: z.string().min(1, "Area name is required"),
});

type PositionFormData = z.infer<typeof positionSchema>;

interface SavePositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, position: any, sweep: any) => Promise<void>;
  currentPosition: any;
  currentSweep: any;
  isLoading?: boolean;
}

export function SavePositionModal({ 
  isOpen, 
  onClose, 
  onSave,
  currentPosition,
  currentSweep,
  isLoading = false 
}: SavePositionModalProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const form = useForm<PositionFormData>({
    resolver: zodResolver(positionSchema),
    defaultValues: {
      name: "",
    },
  });

  const handleSave = async (data: PositionFormData) => {
    await onSave(data.name, currentPosition, currentSweep);
    form.reset();
    onClose();
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={isDarkMode ? "sm:max-w-md rounded-xl border border-slate-700/80 bg-[#0f1117] shadow-sm text-slate-100" : "sm:max-w-md rounded-xl border border-slate-200 bg-white shadow-sm"}>
        <DialogHeader>
          <DialogTitle className={isDarkMode ? "flex items-center text-slate-100" : "flex items-center text-slate-900"}>
            <MapPin className={isDarkMode ? "mr-2 h-5 w-5 text-slate-300" : "mr-2 h-5 w-5 text-slate-700"} />
            Save Current Position
          </DialogTitle>
          <DialogDescription className={isDarkMode ? "text-slate-400" : "text-slate-600"}>
            Save your current position so visitors can navigate here with prompts like
            {" "}
            &quot;show me the reception area&quot;.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 dark:text-slate-300">Area Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Main Hall, Reception, Rooftop Terrace"
                      className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 dark:border-input dark:bg-background dark:text-slate-100"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Show current position data */}
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4 dark:border-input dark:bg-background">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Current Position:
              </p>
              {currentSweep && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Sweep ID:</p>
                  <p className="break-all rounded border border-slate-200 bg-white p-2 font-mono text-xs text-slate-500 dark:border-input dark:bg-background dark:text-slate-300">
                    {currentSweep.sid}
                  </p>
                </div>
              )}
              {currentPosition && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Position:</p>
                  <p className="break-all rounded border border-slate-200 bg-white p-2 font-mono text-xs text-slate-500 dark:border-input dark:bg-background dark:text-slate-300">
                    {JSON.stringify(currentPosition.position, null, 2)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-slate-900 text-white hover:bg-slate-800 dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Position
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
