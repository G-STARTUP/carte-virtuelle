import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { CreditCard } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-surface">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className="h-16 border-b border-border/50 glass-strong sticky top-0 z-40 flex items-center px-4 gap-4 md:gap-6">
            <SidebarTrigger />
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow shrink-0">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg md:text-xl font-bold bg-gradient-primary bg-clip-text text-transparent truncate">
                VirtualPay
              </span>
            </div>
          </header>
          <div className="flex-1 p-4 md:p-6 lg:p-8 animate-fade-in">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </div>
        </main>
      </div>
      {/* Barre d'action rapide mobile (bottom bar) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur bg-background/90 border-t border-border flex justify-evenly h-12">
        <a href="/cards" className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors">
          <CreditCard className="h-4 w-4" />
          Cartes
        </a>
        <a href="/deposit" className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors">
          <span className="h-4 w-4 flex items-center justify-center rounded-sm bg-gradient-primary text-white text-[9px] font-bold">$</span>
          Dépôt
        </a>
        <a href="/customer-setup" className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors">
          <span className="h-4 w-4 flex items-center justify-center rounded-sm bg-secondary text-secondary-foreground text-[9px] font-bold">KYC</span>
          Profil
        </a>
      </nav>
    </SidebarProvider>
  );
}
