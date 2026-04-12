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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { MessageSquare, Send, Loader2, CheckCircle, AlertCircle, User, Mail, Phone, Building, MessageCircle } from "lucide-react";

const salesContactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  venueName: z.string().min(2, "Venue name is required"),
  planType: z.enum(["essential", "professional"]),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type SalesContactFormData = z.infer<typeof salesContactSchema>;

interface SalesContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: 'essential' | 'professional';
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  venueName?: string;
}

export function SalesContactModal({
  isOpen,
  onClose,
  selectedPlan,
  userName = '',
  userEmail = '',
  userPhone = '',
  venueName = ''
}: SalesContactModalProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const form = useForm<SalesContactFormData>({
    resolver: zodResolver(salesContactSchema),
    defaultValues: {
      name: userName,
      email: userEmail,
      phone: userPhone,
      venueName: venueName,
      planType: selectedPlan,
      message: `Hi! I'm interested in learning more about the ${selectedPlan === 'essential' ? 'AI Essentials' : 'All-in-One'} plan for my venue. Could we schedule a call to discuss pricing and implementation?`,
    },
  });

  // Update form when selectedPlan changes
  useState(() => {
    form.setValue('planType', selectedPlan);
    const currentMessage = form.getValues('message');
    if (currentMessage.includes('AI Essentials') || currentMessage.includes('All-in-One')) {
      form.setValue('message', 
        `Hi! I'm interested in learning more about the ${selectedPlan === 'essential' ? 'AI Essentials' : 'All-in-One'} plan for my venue. Could we schedule a call to discuss pricing and implementation?`
      );
    }
  });

  const handleSubmit = async (data: SalesContactFormData) => {
    try {
      setStatus('loading');

      const response = await fetch('/api/public/sales-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus('success');
        toast({
          title: "Message Sent!",
          description: "Thank you for your enquiry! We'll get back to you within 24 hours.",
        });
        // Reset form but keep pre-filled data
        form.setValue('message', '');
        setTimeout(() => {
          onClose();
          setStatus('idle');
        }, 2000);
      } else {
        setStatus('error');
        toast({
          title: "Error",
          description: result.error || 'Failed to send message. Please try again.',
          variant: "destructive",
        });
      }
    } catch (error) {
      setStatus('error');
      toast({
        title: "Error",
        description: 'An unexpected error occurred. Please try again.',
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    if (status !== 'loading') {
      form.reset({
        name: userName,
        email: userEmail,
        phone: userPhone,
        venueName: venueName,
        planType: selectedPlan,
        message: '',
      });
      setStatus('idle');
      onClose();
    }
  };

  const getPlanDisplayName = (plan: string) => {
    return plan === 'essential' ? 'AI Essentials' : 'All-in-One';
  };

  const getPlanPrice = (plan: string) => {
    return plan === 'essential' ? '£99' : '£199';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-neutral-900/95 backdrop-blur-md border-neutral-700/60">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-brand-blue/10 rounded-lg">
              <MessageSquare className="h-5 w-5 text-brand-blue" />
            </div>
            <Badge className="bg-brand-blue/20 text-brand-blue border-brand-blue/30">
              Sales Enquiry
            </Badge>
          </div>
          <DialogTitle className="text-xl text-white">
            Talk to Sales
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Interested in {getPlanDisplayName(selectedPlan)} ({getPlanPrice(selectedPlan)}/month)? 
            Let's discuss how we can help grow your venue.
          </DialogDescription>
        </DialogHeader>

        {status === 'success' ? (
          <div className="py-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-success-green/10 rounded-full">
                <CheckCircle className="h-8 w-8 text-success-green" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Message Sent Successfully!
            </h3>
            <p className="text-gray-300">
              We'll be in touch within 24 hours to discuss your requirements.
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Full Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="John Smith"
                            className="bg-neutral-800/80 border-neutral-700/60 text-white placeholder-gray-400 focus:border-brand-blue focus:ring-brand-blue pl-10"
                            disabled={status === 'loading'}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            type="email"
                            placeholder="john@example.com"
                            className="bg-neutral-800/80 border-neutral-700/60 text-white placeholder-gray-400 focus:border-brand-blue focus:ring-brand-blue pl-10"
                            disabled={status === 'loading'}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="venueName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Venue name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Elite Fitness Centre"
                            className="bg-neutral-800/80 border-neutral-700/60 text-white placeholder-gray-400 focus:border-brand-blue focus:ring-brand-blue pl-10"
                            disabled={status === 'loading'}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Phone (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            type="tel"
                            placeholder="07123 456789"
                            className="bg-neutral-800/80 border-neutral-700/60 text-white placeholder-gray-400 focus:border-brand-blue focus:ring-brand-blue pl-10"
                            disabled={status === 'loading'}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Plan Type Display */}
              <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-brand-blue" />
                    <span className="text-sm font-medium text-white">Selected Plan:</span>
                  </div>
                  <Badge className="bg-brand-blue/20 text-brand-blue border-brand-blue/30">
                    {getPlanDisplayName(selectedPlan)} - {getPlanPrice(selectedPlan)}/month
                  </Badge>
                </div>
              </div>

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about your requirements, questions, or how we can help..."
                        rows={4}
                        className="bg-neutral-800/80 border-neutral-700/60 text-white placeholder-gray-400 focus:border-brand-blue focus:ring-brand-blue resize-none"
                        disabled={status === 'loading'}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClose}
                  disabled={status === 'loading'}
                  className="flex-1 text-gray-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={status === 'loading'}
                  className="flex-1 bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold"
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Enquiry
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
} 