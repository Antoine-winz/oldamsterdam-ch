import { Switch, Route } from "wouter";
import { lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import DocumentHead from "@/components/DocumentHead";
import LanguageRedirect from "@/components/LanguageRedirect";
import LanguageHome from "@/pages/LanguageHome";
import NotFound from "@/pages/not-found";

const AdminLogin = lazy(() => import("@/pages/AdminLogin"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const NectraGateway = lazy(() => import("@/pages/NectraGateway"));

function AdminFallback() {
  return <div className="flex items-center justify-center h-screen bg-black text-white">Loading...</div>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LanguageRedirect}/>
      <Route path="/en" component={() => <LanguageHome lang="en" />}/>
      <Route path="/en/" component={() => <LanguageHome lang="en" />}/>
      <Route path="/fr" component={() => <LanguageHome lang="fr" />}/>
      <Route path="/fr/" component={() => <LanguageHome lang="fr" />}/>
      <Route path="/de" component={() => <LanguageHome lang="de" />}/>
      <Route path="/de/" component={() => <LanguageHome lang="de" />}/>
      <Route path="/it" component={() => <LanguageHome lang="it" />}/>
      <Route path="/it/" component={() => <LanguageHome lang="it" />}/>
      <Route path="/gateway">
        <Suspense fallback={<AdminFallback />}><NectraGateway /></Suspense>
      </Route>
      <Route path="/admin">
        <Suspense fallback={<AdminFallback />}><AdminLogin /></Suspense>
      </Route>
      <Route path="/admin/dashboard">
        <Suspense fallback={<AdminFallback />}><AdminDashboard /></Suspense>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <DocumentHead />
          <Toaster />
          <Router />
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
