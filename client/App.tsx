import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Study from "./pages/Study";
import Create from "./pages/Create";
import Edit from "./pages/Edit";
import Folders from "./pages/Folders";
import Test from "./pages/Test";
import Match from "./pages/Match";
import Progress from "./pages/Progress";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/study" element={<Study />} />
            <Route path="/study/:setId" element={<Study />} />
            <Route path="/create" element={<Create />} />
            <Route path="/edit/:id" element={<Edit />} />
            <Route path="/folders" element={<Folders />} />
            <Route path="/test" element={<Test />} />
            <Route path="/test/:setId" element={<Test />} />
            <Route path="/match" element={<Match />} />
            <Route path="/match/:setId" element={<Match />} />
            <Route path="/progress" element={<Progress />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
