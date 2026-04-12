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
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Calendar, Clock, Camera, Send, X } from "lucide-react";

const bookingSchema = z.object({
  preferred_date: z.string().min(1, "Please select a preferred date"),
  preferred_time: z.string().min(1, "Please select a preferred time"),
  contact_phone: z.string().min(1, "Phone number is required"),
  additional_notes: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  venueName?: string;
}

export function BookTourModal({ isOpen, onClose, venueName }: BookTourModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      preferred_date: "",
      preferred_time: "",
      contact_phone: "",
      additional_notes: "",
    },
  });

  const handleSubmit = async (data: BookingFormData) => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/public/book-tour', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          venueName,
          ...data
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert("Tour booking request submitted! We'll contact you within 24 hours to confirm.");
        form.reset();
        onClose();
      } else {
        throw new Error(result.error || 'Booking failed');
      }
    } catch (error: any) {
      console.error('Error submitting booking:', error);
      alert(error.message || "Error submitting request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  // Get today's date for minimum date selection
  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg dark:border-input dark:bg-[#121923]/96">
        <DialogHeader>
          <DialogTitle className="flex items-center dark:text-slate-100">
            <Camera className="w-5 h-5 mr-2 text-brand-blue dark:text-slate-300" />
            Book Professional Tour Capture
          </DialogTitle>
          <DialogDescription>
            Schedule a professional Matterport 3D tour capture for {venueName || 'your venue'}. 
            This service is included in your monthly subscription.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="preferred_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Preferred Date *
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      min={today}
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark">
                    Select your preferred date for the tour capture
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferred_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Preferred Time *
                  </FormLabel>
                  <FormControl>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="">Select time</option>
                      <option value="9:00 AM">9:00 AM</option>
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="12:00 PM">12:00 PM</option>
                      <option value="1:00 PM">1:00 PM</option>
                      <option value="2:00 PM">2:00 PM</option>
                      <option value="3:00 PM">3:00 PM</option>
                      <option value="4:00 PM">4:00 PM</option>
                      <option value="5:00 PM">5:00 PM</option>
                      <option value="6:00 PM">6:00 PM</option>
                    </select>
                  </FormControl>
                  <p className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark">
                    Choose your preferred time slot
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Phone *</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="07123 456789"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark">
                    We'll call to confirm the booking details
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="additional_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any special requirements, access instructions, or specific areas to focus on..."
                      rows={3}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-brand-blue/5 border border-brand-blue/20 rounded-lg p-4 space-y-2 dark:border-input dark:bg-background">
              <h4 className="font-medium text-text-primary-light dark:text-text-primary-dark text-sm">
                What's Included:
              </h4>
              <ul className="text-xs text-text-secondary-light dark:text-text-secondary-dark space-y-1">
                <li>• Professional Matterport 3D capture</li>
                <li>• High-resolution 360° photography</li>
                <li>• Interactive floor plan generation</li>
                <li>• Integration with your AI chatbot</li>
                <li>• No additional cost - included in subscription</li>
              </ul>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-brand-blue hover:bg-brand-blue/90 dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Book Tour Capture
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 