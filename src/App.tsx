import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Dashboard from "./pages/admin/Dashboard";
import AddEvent from "./pages/admin/AddEvent";
import ManageEvents from "./pages/admin/ManageEvents";
import Categories from "./pages/admin/Categories";
import Team from "./pages/admin/Team";
import Settings from "./pages/admin/Settings";
import UserManagement from "./pages/admin/UserManagement";
import AdminSetup from "./pages/AdminSetup";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import MyJobs from "./pages/MyJobs";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/setup" element={<AdminSetup />} />
            <Route path="/events" element={<Events />} />
            <Route path="/event/:id" element={<EventDetail />} />
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/team-dashboard" element={<TeamDashboard />} />
            <Route path="/admin/add-event" element={<AddEvent />} />
            <Route path="/admin/manage-events" element={<ManageEvents />} />
            <Route path="/admin/categories" element={<Categories />} />
            <Route path="/admin/team" element={<Team />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-jobs" element={<MyJobs />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
