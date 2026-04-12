import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  const quickLinks = [
    {
      href: "/",
      label: "Homepage",
      description: "Return to the main TourBots site",
    },
    {
      href: "/features",
      label: "Features",
      description: "See the agency delivery platform",
    },
    {
      href: "/demo",
      label: "Book Demo",
      description: "Book a personalised walkthrough",
    },
    {
      href: "/resources/blogs",
      label: "Resources",
      description: "Read practical implementation guidance",
    },
  ];

  return (
    <main className="container flex min-h-screen items-center justify-center py-12">
      <div className="w-full max-w-5xl text-center">
        <div className="mx-auto mb-12 max-w-3xl">
          <h1 className="text-7xl font-semibold tracking-tight text-white md:text-8xl">404</h1>
          <h2 className="mt-4 text-3xl font-semibold text-white md:text-4xl">
            Page not found
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
            The page you requested does not exist or may have been moved.
            Use one of the links below to continue.
          </p>
        </div>

        <div className="mb-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Link href="/">
            <Button size="lg" className="min-w-[180px] bg-white px-7 text-slate-900 hover:bg-slate-200">
              <Home className="mr-2 h-4 w-4" />
              Go to homepage
            </Button>
          </Link>
          <Link href="/contact">
            <Button
              variant="outline"
              size="lg"
              className="min-w-[180px] border-slate-600 bg-transparent px-7 text-white hover:bg-slate-800"
            >
              Contact support
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => {
            return (
              <Link key={link.label} href={link.href}>
                <Card className="h-full rounded-2xl border border-slate-700/70 bg-slate-900/50 shadow-[0_18px_44px_rgba(2,6,23,0.28)] transition-colors duration-200 hover:border-brand-primary/35 hover:bg-slate-900/65">
                  <CardContent className="p-5 text-left">
                    <h3 className="text-lg font-semibold text-white">{link.label}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">{link.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 text-sm text-slate-400">
          <ArrowLeft className="h-4 w-4" />
          <Link href="/" className="hover:text-white">
            Back to homepage
          </Link>
        </div>
      </div>
    </main>
  );
} 