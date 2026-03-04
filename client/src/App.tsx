import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import LandingA from "@/pages/LandingA";
import LandingB from "@/pages/LandingB";
import LandingC from "@/pages/LandingC";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import PricingPage from "@/pages/PricingPage";
import TopicSettings from "@/pages/TopicSettings";
import NotFound from "@/pages/not-found";

function getSessionId(): string {
  let sid = localStorage.getItem("vnuchok_session_id");
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("vnuchok_session_id", sid);
  }
  return sid;
}

function getUtmParams(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content"]) {
    const val = params.get(key);
    if (val) {
      utm[key] = val;
      localStorage.setItem(`vnuchok_${key}`, val);
    } else {
      const saved = localStorage.getItem(`vnuchok_${key}`);
      if (saved) utm[key] = saved;
    }
  }
  return utm;
}

function trackEvent(variant: string, eventType: string, eventData?: string) {
  const utm = getUtmParams();
  fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: getSessionId(),
      variant,
      eventType,
      eventData,
      utmSource: utm.utm_source,
      utmMedium: utm.utm_medium,
      utmCampaign: utm.utm_campaign,
      utmContent: utm.utm_content,
    }),
  }).catch(() => {});
}

function MainLanding() {
  useEffect(() => {
    localStorage.setItem("vnuchok_ab_variant", "C");
    trackEvent("C", "landing_view");
  }, []);
  return <LandingC />;
}

function LandingAPage() {
  useEffect(() => {
    localStorage.setItem("vnuchok_ab_variant", "A");
    trackEvent("A", "landing_view");
  }, []);
  return <LandingA />;
}

function LandingBPage() {
  useEffect(() => {
    localStorage.setItem("vnuchok_ab_variant", "B");
    trackEvent("B", "landing_view");
  }, []);
  return <LandingB />;
}

function LandingCPage() {
  useEffect(() => {
    localStorage.setItem("vnuchok_ab_variant", "C");
    trackEvent("C", "landing_view");
  }, []);
  return <LandingC />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={MainLanding} />
      <Route path="/a" component={LandingAPage} />
      <Route path="/b" component={LandingBPage} />
      <Route path="/c" component={LandingCPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/settings/topics" component={TopicSettings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
