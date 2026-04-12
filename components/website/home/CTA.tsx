import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Rocket } from "lucide-react";

export function CTA() {
  return (
    <section className="container pb-16 pt-8 md:pb-20 md:pt-10 lg:pb-24 lg:pt-12">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/50 shadow-[0_18px_44px_rgba(2,6,23,0.28)]">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-6 py-8 text-center md:px-8 md:py-10">
          <h2 className="text-2xl font-semibold leading-tight text-white md:text-3xl lg:text-4xl">
            Your tour is already live. Make it work harder.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-300 md:text-lg">
            <span className="inline-block lg:whitespace-nowrap">
              Add an AI guide to your virtual tour today. Free to start, fast to launch, and built for real visitor engagement.
            </span>
          </p>

          <div className="mx-auto mt-6 flex w-full max-w-sm flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:justify-center sm:gap-4">
            <Link href="/login" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                className="group h-11 w-full min-w-[190px] border border-brand-primary/30 bg-white px-8 text-slate-900 transition-colors duration-200 hover:border-brand-primary/45 hover:bg-slate-200 sm:w-auto"
              >
                <Rocket className="mr-2 h-4 w-4 transform-gpu transition-transform duration-200 ease-out motion-reduce:transform-none group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                Start Free
              </Button>
            </Link>
            <Link href="/demo" className="w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="lg"
                className="group h-11 w-full min-w-[190px] border-white/40 bg-white/[0.03] px-8 text-white transition-colors duration-200 hover:bg-white/10 hover:text-white sm:w-auto"
              >
                <Calendar className="mr-2 h-4 w-4 transform-gpu transition-transform duration-200 ease-out motion-reduce:transform-none group-hover:-translate-y-0.5" />
                Book a Demo
              </Button>
            </Link>
          </div>

          <div className="mx-auto mt-6 flex w-fit flex-col items-center gap-3 text-sm text-slate-300 sm:flex-row sm:justify-center sm:gap-8">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success-green" />
              <span>Free account, no card</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success-green" />
              <span>First space: £19.99/month</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success-green" />
              <span>Extra spaces: £14.99 each</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}