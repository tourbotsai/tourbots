"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Send, Mail, CheckCircle, Loader2, AlertCircle } from "lucide-react";

export function ContactEnquirySection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    venueName: "",
    helpTopic: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setFeedbackMessage("");

    try {
      const response = await fetch("/api/public/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus("success");
        setFeedbackMessage("Thank you. We will get back to you shortly.");
        setFormData({ name: "", email: "", phone: "", message: "", venueName: "", helpTopic: "" });
      } else {
        setStatus("error");
        setFeedbackMessage(result.error || "An error occurred. Please try again.");
      }
    } catch {
      setStatus("error");
      setFeedbackMessage("An unexpected error occurred. Please check your connection and try again.");
    }
  };

  const faqs = [
    {
      question: "How do I get a VR tour to use?",
      answer:
        "You can upload your Matterport tour directly into TourBots. If you do not have a tour yet, contact us and we can recommend an approved tour capture specialist.",
    },
    {
      question: "How quickly can we launch?",
      answer:
        "Most businesses can connect a tour and go live quickly once core content, FAQs, and assistant settings are in place.",
    },
    {
      question: "What does setup involve?",
      answer:
        "Setup is straightforward: connect your tour, add business content, set assistant behaviour, and publish with one embed line.",
    },
    {
      question: "Can we white-label the experience?",
      answer:
        "Yes. White-label is available as an add-on for businesses that want a fully branded client-facing experience.",
    },
    {
      question: "How is pricing structured?",
      answer:
        "You can start free for testing, then move to Pro for live use. You can add extra spaces, message top-ups, and white-label as needed.",
    },
    {
      question: "Can I use across multiple spaces?",
      answer:
        "Yes. You can manage one or many spaces from a single account, with separate setup and reporting at space level.",
    },
  ];

  return (
    <section className="container pb-16 pt-8 md:pb-20 md:pt-10 lg:pb-24 lg:pt-12">
      <div className="mx-auto grid max-w-6xl items-stretch gap-6 lg:grid-cols-2">
        <Card className="h-full rounded-2xl border border-slate-700/70 bg-slate-900/50 shadow-[0_18px_44px_rgba(2,6,23,0.28)]">
          <CardHeader>
            <CardTitle className="text-xl text-white md:text-2xl">Send an enquiry</CardTitle>
            <CardDescription className="text-slate-300">
              Tell us what you are planning and we will follow up with the right next step.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Full name *</Label>
                  <Input
                    id="name"
                    placeholder="John Smith"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    disabled={status === "loading"}
                    className="border-slate-700/70 bg-slate-900/70 text-slate-100 placeholder-slate-500 focus-visible:border-brand-primary focus-visible:ring-1 focus-visible:ring-brand-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@company.co.uk"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    disabled={status === "loading"}
                    className="border-slate-700/70 bg-slate-900/70 text-slate-100 placeholder-slate-500 focus-visible:border-brand-primary focus-visible:ring-1 focus-visible:ring-brand-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="venueName" className="text-white">Company name *</Label>
                  <Input
                    id="venueName"
                    placeholder="Your company"
                    required
                    value={formData.venueName}
                    onChange={handleChange}
                    disabled={status === "loading"}
                    className="border-slate-700/70 bg-slate-900/70 text-slate-100 placeholder-slate-500 focus-visible:border-brand-primary focus-visible:ring-1 focus-visible:ring-brand-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white">Phone number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+44 ..."
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={status === "loading"}
                    className="border-slate-700/70 bg-slate-900/70 text-slate-100 placeholder-slate-500 focus-visible:border-brand-primary focus-visible:ring-1 focus-visible:ring-brand-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="helpTopic" className="text-white">Enquiry type *</Label>
                <Select
                  onValueChange={(value) => handleSelectChange("helpTopic", value)}
                  value={formData.helpTopic}
                  disabled={status === "loading"}
                >
                  <SelectTrigger className="border-slate-700/70 bg-slate-900/70 text-slate-100 focus:border-brand-primary focus:ring-brand-primary">
                    <SelectValue placeholder="Select enquiry type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pricing">Pricing and plans</SelectItem>
                    <SelectItem value="demo">Book a demo</SelectItem>
                    <SelectItem value="partnership">Partner enquiry</SelectItem>
                    <SelectItem value="support">Technical support</SelectItem>
                    <SelectItem value="general">General enquiry</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-white">Message *</Label>
                <Textarea
                  id="message"
                  placeholder="Tell us what you are looking to achieve."
                  required
                  minLength={10}
                  value={formData.message}
                  onChange={handleChange}
                  disabled={status === "loading"}
                  className="border-slate-700/70 bg-slate-900/70 text-slate-100 placeholder-slate-500 focus-visible:border-brand-primary focus-visible:ring-1 focus-visible:ring-brand-primary"
                />
              </div>

              <Button type="submit" className="w-full bg-white text-slate-900 hover:bg-slate-200" disabled={status === "loading"}>
                {status === "loading" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send message
                  </>
                )}
              </Button>

              {status === "success" && (
                <div className="flex items-center rounded-md border border-success-green/30 bg-success-green/12 p-3 text-sm text-success-green">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {feedbackMessage}
                </div>
              )}

              {status === "error" && (
                <div className="flex items-center rounded-md border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-300">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  {feedbackMessage}
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        <div className="flex h-full flex-col space-y-4">
          <Card className="flex-1 rounded-2xl border border-slate-700/70 bg-slate-900/50 shadow-[0_18px_44px_rgba(2,6,23,0.28)]">
            <CardHeader>
              <CardTitle className="text-xl text-white md:text-2xl">Frequently asked questions</CardTitle>
              <p className="text-sm text-slate-300">Quick answers before we speak.</p>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={faq.question} value={`item-${index}`} className="border-slate-700/70">
                    <AccordionTrigger className="text-left text-sm text-white hover:text-white">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-slate-300">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-700/70 bg-slate-900/50 shadow-[0_18px_44px_rgba(2,6,23,0.28)]">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white">Prefer direct contact?</h3>
              <p className="mt-2 text-sm text-slate-300">
                Send your enquiry context directly and we will route it to the right person.
              </p>
              <a href="mailto:hello@tourbots.ai" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:underline">
                <Mail className="h-4 w-4" />
                hello@tourbots.ai
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
