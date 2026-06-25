import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ReservationProvider } from "@/contexts/ReservationContext";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Listing from "./pages/Listing";
import ReservationPage from "./pages/ReservationPage";
import MyReservations from "./pages/MyReservations";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/** Redireciona para Login se não autenticado. */
const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const { user, ready } = useAuth();
  if (!ready) return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Carregando sistema...</div>;
  if (!user) return <Login />;
  return <>{children}</>;
};

/** Redireciona para / se não for admin. */
const AdminGate = ({ children }: { children: React.ReactNode }) => {
  const { user, ready } = useAuth();
  if (!ready) return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Carregando sistema...</div>;
  if (!user) return <Login />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes = () => (
  <AuthGate>
    <ReservationProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/minhas-reservas" element={<MyReservations />} />
        <Route path="/:category/:id" element={<ReservationPage />} />
        <Route path="/:category" element={<Listing />} />
        <Route
          path="/admin"
          element={
            <AdminGate>
              <AdminPanel />
            </AdminGate>
          }
        />
        <Route path="/gerenciar" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ReservationProvider>
  </AuthGate>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
