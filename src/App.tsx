
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import RedirectIfAuthenticated from "@/components/RedirectIfAuthenticated";
import Index from "./pages/Index";
import Restaurant from "./pages/Restaurant";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import SavedList from "./pages/SavedList";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Root path redirects to home page if authenticated, auth page if not */}
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route 
              path="/home" 
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } 
            />
            <Route path="/restaurant/:id" element={
              <ProtectedRoute>
                <Restaurant />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/saved-list" element={
              <ProtectedRoute>
                <SavedList />
              </ProtectedRoute>
            } />
            <Route 
              path="/auth" 
              element={
                <RedirectIfAuthenticated>
                  <Auth />
                </RedirectIfAuthenticated>
              } 
            />
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
