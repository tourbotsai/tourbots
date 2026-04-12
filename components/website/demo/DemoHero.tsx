import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Rocket } from "lucide-react";

export function DemoHero() {
  return (
    <section className="container pb-6 pt-10 md:pb-8 md:pt-14 lg:pb-10 lg:pt-20">
      <div className="mx-auto mb-8 flex max-w-5xl flex-col items-center space-y-6 text-center md:mb-10">
        <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
          <span className="sm:hidden">Book a demo</span>
          <span className="hidden sm:inline">Book a TourBots demo</span>
        </h1>
        <p className="max-w-5xl text-base leading-relaxed text-slate-300 sm:text-lg lg:whitespace-nowrap">
          <span className="sm:hidden">
            See how to launch AI in your virtual tour fast, with clear pricing and easy rollout.
          </span>
          <span className="hidden sm:inline">
            See how to launch AI in your virtual tour fast, then scale with clear pricing and easy rollout.
          </span>
        </p>
        <div className="grid w-full max-w-md grid-cols-2 gap-3 sm:flex sm:max-w-none sm:w-auto sm:flex-row sm:justify-center sm:gap-4">
          <a href="#demo-booking" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="group h-11 w-full border border-brand-primary/30 bg-white px-4 text-slate-900 transition-colors duration-200 hover:border-brand-primary/45 hover:bg-slate-200 sm:min-w-[190px] sm:px-8"
            >
              <Calendar className="mr-2 h-4 w-4 transform-gpu transition-transform duration-200 ease-out motion-reduce:transform-none group-hover:-translate-y-0.5" />
              Book a Demo
            </Button>
          </a>
          <Link href="/login" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="group h-11 w-full border-white/40 bg-white/[0.03] px-4 text-white transition-colors duration-200 hover:bg-white/10 hover:text-white sm:min-w-[190px] sm:px-8"
            >
              <Rocket className="mr-2 h-4 w-4 transform-gpu transition-transform duration-200 ease-out motion-reduce:transform-none group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              Start Free
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}