import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { EventProvider } from "@/contexts/EventContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Events from "./pages/Events";
import Dashboard from "./pages/admin/Dashboard";
import AddEvent from "./pages/admin/AddEvent";
import ManageEvents from "./pages/admin/ManageEvents";
import Team from "./pages/admin/Team";
import Settings from "./pages/admin/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <EventProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/events" element={<Events />} />
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/add-event" element={<AddEvent />} />
            <Route path="/admin/manage-events" element={<ManageEvents />} />
            <Route path="/admin/team" element={<Team />} />
            <Route path="/admin/settings" element={<Settings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </EventProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
