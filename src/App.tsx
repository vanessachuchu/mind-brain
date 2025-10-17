
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ThoughtDetail from "./pages/ThoughtDetail";
import CalendarPage from "./pages/Calendar";

import SearchPage from "./pages/Search";
import SettingsPage from "./pages/Settings";
import NotionCallback from "./pages/NotionCallback";

import TopNav from "./components/TopNav";
import BottomNav from "./components/BottomNav";
import { AuthProvider } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

export type PageType = 'home' | 'chat' | 'calendar' | 'mindmap' | 'tags' | 'search';

const App = () => {
  const [currentPage, setCurrentPage] = useState<PageType>('home');

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter basename={import.meta.env.PROD ? "/mind-brain" : ""}>
              <div className="min-h-screen bg-background pb-16">
                <TopNav />
                <ErrorBoundary>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/thought/:id" element={<ThoughtDetail />} />
                    <Route path="/todo" element={<Navigate to="/" replace />} />
                    <Route path="/calendar" element={<CalendarPage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/auth/notion/callback" element={<NotionCallback />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </ErrorBoundary>
                <BottomNav />
              </div>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
