import { Home, CreditCard, UserCheck, LogOut, Wallet, ShieldCheck, Activity, Key, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContextPHP";
import { useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const userItems = [
  { title: "Tableau de bord", url: "/dashboard", icon: Home },
  { title: "Dépôt", url: "/deposit", icon: Wallet },
  { title: "Mes Cartes", url: "/cards", icon: CreditCard },
  { title: "Configuration KYC", url: "/customer-setup", icon: UserCheck },
];

const adminItems = [
  { title: "Vue d'ensemble", url: "/admin/overview", icon: ShieldCheck },
  { title: "Cartes", url: "/admin/cards", icon: CreditCard },
  { title: "Clients", url: "/admin/customers", icon: UserCheck },
  { title: "Clés API", url: "/admin/api-config", icon: Key },
  { title: "Paramètres", url: "/admin/settings", icon: Settings },
  { title: "Logs API", url: "/admin/api-logs", icon: Activity },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";
  const [isAdmin, setIsAdmin] = useState(false);

  // Vérification du rôle admin depuis le contexte utilisateur
  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    // Le rôle est déjà dans l'objet user du context
    setIsAdmin(user.role === 'admin');
  }, [user]);

  const renderItems = (items: typeof userItems) => (
    <SidebarMenu>
      {items.map((item) => {
        const active = currentPath === item.url;
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              isActive={active}
              tooltip={item.title}
              className={cn(
                active && "bg-muted text-primary font-medium",
                "transition-colors"
              )}
            >
              <NavLink
                to={item.url}
                end
                className="flex items-center"
                activeClassName=""
              >
                <item.icon className="h-4 w-4" />
                {!isCollapsed && <span>{item.title}</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );

  return (
    <Sidebar collapsible="icon" className="border-r bg-sidebar">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Mon Compte</SidebarGroupLabel>
          <SidebarGroupContent>{renderItems(userItems)}</SidebarGroupContent>
        </SidebarGroup>
        {isAdmin && (
          <SidebarGroup>
            <SidebarSeparator />
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>{renderItems(adminItems)}</SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start"
        >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Déconnexion</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
