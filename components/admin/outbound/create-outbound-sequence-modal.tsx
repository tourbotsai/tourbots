"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ArrowDown, CalendarClock, Info, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface OutboundSequenceStepForm {
  step_number: number;
  scheduled_date: string;
  scheduled_time: string;
  scheduled_timezone: string;
  email_subject: string;
  email_body: string;
  is_active: boolean;
}

export interface OutboundSequenceFormPayload {
  name: string;
  description?: string;
  steps: OutboundSequenceStepForm[];
}

interface CreateOutboundSequenceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: OutboundSequenceFormPayload) => Promise<void>;
  isSubmitting: boolean;
  mode?: "create" | "edit";
  initialData?: {
    name: string;
    description?: string | null;
    steps: OutboundSequenceStepForm[];
  } | null;
}

function getNewStep(stepNumber: number): OutboundSequenceStepForm {
  return {
    step_number: stepNumber,
    scheduled_date: "",
    scheduled_time: "",
    scheduled_timezone: "Europe/London",
    email_subject: "",
    email_body: "",
    is_active: true,
  };
}

export function CreateOutboundSequenceModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  mode = "create",
  initialData = null,
}: CreateOutboundSequenceModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<OutboundSequenceStepForm[]>([getNewStep(1)]);

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setSteps(
        initialData.steps.length > 0
          ? [...initialData.steps].sort((a, b) => a.step_number - b.step_number)
          : [getNewStep(1)]
      );
      return;
    }

    setName("");
    setDescription("");
    setSteps([getNewStep(1)]);
  }, [open, mode, initialData]);

  const addStep = () => {
    setSteps((prev) => [...prev, getNewStep(prev.length + 1)]);
  };

  const removeStep = (index: number) => {
    setSteps((prev) =>
      prev
        .filter((_, idx) => idx !== index)
        .map((step, idx) => ({ ...step, step_number: idx + 1 }))
    );
  };

  const updateStep = (index: number, field: keyof OutboundSequenceStepForm, value: string | boolean) => {
    setSteps((prev) =>
      prev.map((step, idx) =>
        idx === index
          ? {
              ...step,
              [field]: value,
            }
          : step
      )
    );
  };

  const isValid = name.trim().length > 0 && steps.every((step) => {
    return (
      step.scheduled_date &&
      step.scheduled_time &&
      step.email_subject.trim().length > 0 &&
      step.email_body.trim().length > 0
    );
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValid) return;

    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      steps: steps.map((step, idx) => ({
        ...step,
        step_number: idx + 1,
        email_subject: step.email_subject.trim(),
        email_body: step.email_body.trim(),
      })),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[62rem] max-h-[90vh] overflow-visible flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit automated sequence" : "Create automated sequence"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto px-1 pb-1">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="sequence-name">Sequence name</Label>
              <Input
                id="sequence-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Agency onboarding outreach"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sequence-description">Description</Label>
              <Input
                id="sequence-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Brief purpose of this sequence"
              />
            </div>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
            <div className="flex gap-2">
              <Info className="mt-0.5 h-4 w-4 text-blue-700 dark:text-blue-300" />
              <div className="space-y-1 text-sm text-blue-900 dark:text-blue-200">
                <p className="font-medium">Personalisation codes</p>
                <p className="text-xs">Use these placeholders in subject/body for each lead:</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <code>{`{first_name}`}</code>
                  <code>{`{last_name}`}</code>
                  <code>{`{full_name}`}</code>
                  <code>{`{company_name}`}</code>
                  <code>{`{email}`}</code>
                  <code>{`{website}`}</code>
                  <code>{`{phone}`}</code>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Sequence steps</h3>
              <Button type="button" variant="outline" onClick={addStep}>
                <Plus className="mr-2 h-4 w-4" />
                Add step
              </Button>
            </div>

            {steps.map((step, index) => {
              const hasSchedule = Boolean(step.scheduled_date && step.scheduled_time);
              return (
                <Card key={`${step.step_number}-${index}`} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Step {index + 1}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {hasSchedule
                            ? format(new Date(`${step.scheduled_date}T${step.scheduled_time}`), "dd/MM/yyyy 'at' HH:mm")
                            : "Set date and time"}
                        </span>
                      </div>
                      {steps.length > 1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeStep(index)}
                          title="Remove step"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label>Send date</Label>
                        <Input
                          type="date"
                          value={step.scheduled_date}
                          min={new Date().toISOString().split("T")[0]}
                          onChange={(event) => updateStep(index, "scheduled_date", event.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Send time</Label>
                        <Input
                          type="time"
                          value={step.scheduled_time}
                          onChange={(event) => updateStep(index, "scheduled_time", event.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Timezone</Label>
                        <Input
                          value={step.scheduled_timezone}
                          onChange={(event) => updateStep(index, "scheduled_timezone", event.target.value)}
                          placeholder="Europe/London"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Email subject</Label>
                      <Input
                        value={step.email_subject}
                        onChange={(event) => updateStep(index, "email_subject", event.target.value)}
                        placeholder="Quick idea for {company_name}"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email body</Label>
                      <Textarea
                        value={step.email_body}
                        onChange={(event) => updateStep(index, "email_body", event.target.value)}
                        rows={6}
                        placeholder={"Hi {first_name},\n\n..."}
                        required
                      />
                    </div>
                  </CardContent>
                  {index < steps.length - 1 ? (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border bg-background p-1">
                      <ArrowDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ) : null}
                </Card>
              );
            })}
          </div>

          <div className="rounded-lg border p-3 dark:border-input dark:bg-background">
            <p className="inline-flex items-center gap-2 text-sm font-medium">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              Scheduling notes
            </p>
            <ul className="mt-2 list-disc pl-5 text-xs text-muted-foreground space-y-1">
              <li>Each step is scheduled at an exact date/time.</li>
              <li>If a step date/time is already in the past when a lead is enrolled, it is skipped.</li>
              <li>Sequence emails send via Resend as plain-text messages.</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting
                ? mode === "edit"
                  ? "Saving..."
                  : "Creating..."
                : mode === "edit"
                ? "Save changes"
                : "Create sequence"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
