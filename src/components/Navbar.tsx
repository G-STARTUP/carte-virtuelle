import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContextPHP";

const Navbar = () => {
  const { user } = useAuth();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            VirtualPay
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <Link to="/dashboard">
              <Button className="bg-gradient-primary shadow-glow">
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="ghost">Connexion</Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-gradient-primary shadow-glow">
                  Commencer
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
