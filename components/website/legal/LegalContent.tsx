"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Scale, Cookie } from "lucide-react";
import { PrivacyPolicy } from "./PrivacyPolicy";
import { TermsOfService } from "./TermsOfService";
import { CookiePolicy } from "./CookiePolicy";

export function LegalContent() {
  const [activeTab, setActiveTab] = useState("privacy");
  const searchParams = useSearchParams();
  const lastUpdated = "26/03/2026";

  useEffect(() => {
    if (searchParams) {
      const section = searchParams.get("section");
      if (section === "terms" || section === "privacy" || section === "cookies") {
        setActiveTab(section);
      }
    }
  }, [searchParams]);

  return (
    <section className="container pb-16 pt-6 md:pb-20 lg:pb-24 lg:pt-8">
      <div className="mx-auto max-w-5xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mx-auto mb-10 grid w-full max-w-xl grid-cols-3 rounded-2xl border border-slate-700/70 bg-slate-900/70 p-1">
            <TabsTrigger 
              value="privacy" 
              className="flex items-center space-x-2 rounded-xl text-slate-300 data-[state=active]:bg-white data-[state=active]:text-slate-900"
            >
              <Shield className="w-4 h-4" />
              <span>Privacy</span>
            </TabsTrigger>
            <TabsTrigger 
              value="terms"
              className="flex items-center space-x-2 rounded-xl text-slate-300 data-[state=active]:bg-white data-[state=active]:text-slate-900"
            >
              <Scale className="w-4 h-4" />
              <span>Terms</span>
            </TabsTrigger>
            <TabsTrigger 
              value="cookies"
              className="flex items-center space-x-2 rounded-xl text-slate-300 data-[state=active]:bg-white data-[state=active]:text-slate-900"
            >
              <Cookie className="w-4 h-4" />
              <span>Cookies</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="privacy">
            <Card className="rounded-2xl border border-slate-700/70 bg-slate-900/50 shadow-[0_18px_44px_rgba(2,6,23,0.28)]">
              <CardHeader className="pb-6 text-center">
                <CardTitle className="text-2xl text-white">
                  Our privacy policy
                </CardTitle>
                <p className="text-slate-300">
                  Last updated: {lastUpdated}
                </p>
              </CardHeader>
              <CardContent>
                <PrivacyPolicy />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="terms">
            <Card className="rounded-2xl border border-slate-700/70 bg-slate-900/50 shadow-[0_18px_44px_rgba(2,6,23,0.28)]">
              <CardHeader className="pb-6 text-center">
                <CardTitle className="text-2xl text-white">
                  Our service agreement
                </CardTitle>
                <p className="text-slate-300">
                  Last updated: {lastUpdated}
                </p>
              </CardHeader>
              <CardContent>
                <TermsOfService />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cookies">
            <Card className="rounded-2xl border border-slate-700/70 bg-slate-900/50 shadow-[0_18px_44px_rgba(2,6,23,0.28)]">
              <CardHeader className="pb-6 text-center">
                <CardTitle className="text-2xl text-white">
                  How we use cookies
                </CardTitle>
                <p className="text-slate-300">
                  Last updated: {lastUpdated}
                </p>
              </CardHeader>
              <CardContent>
                <CookiePolicy />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
} 