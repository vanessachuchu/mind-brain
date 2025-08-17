
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ThoughtDetail from "./pages/ThoughtDetail";

import SearchPage from "./pages/Search";
import SettingsPage from "./pages/Settings";
import AuthPage from "./pages/Auth";
import TodoPage from "./pages/Todo";

import TopNav from "./components/TopNav";
import BottomNav from "./components/BottomNav";
import { AuthProvider } from "./contexts/AuthContext";

const queryClient = new QueryClient();

export type PageType = 'home' | 'chat' | 'todo' | 'calendar' | 'mindmap' | 'tags' | 'search';

const App = () => {
  const [currentPage, setCurrentPage] = useState<PageType>('home');

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter basename={import.meta.env.PROD ? "/thought-spark-cards-main-2" : ""}>
            <div className="min-h-screen bg-background pb-16">
              <TopNav />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/thought/:id" element={<ThoughtDetail />} />
                
                <Route path="/todo" element={<TodoPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <BottomNav />
            </div>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
