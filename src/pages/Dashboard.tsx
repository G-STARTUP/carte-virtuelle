import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContextPHP";
import { apiGet } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wallet, CreditCard, Plus, ArrowUpRight, CheckCircle2, Shield, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStrowallet } from "@/hooks/useStrowallet";
import { toast } from "sonner";

interface WalletData {
  id: string;
  currency: string;
  balance: number;
}

interface ProfileData {
  kyc_status: string;
  first_name: string;
  last_name: string;
  email: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isKycVerifiedDialogOpen, setIsKycVerifiedDialogOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { getUserCustomer, createCard, loading: strowalletLoading } = useStrowallet();
  const [customer, setCustomer] = useState<any>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<"USD" | "XOF">("USD");
  const [hideBalance, setHideBalance] = useState<boolean>(() => {
    try {
      return localStorage.getItem("hideBalance") === "true";
    } catch { return false; }
  });
  
  // Create card form
  const [amount, setAmount] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch dashboard data (wallets, profile, and role)
        const response = await apiGet('/user?action=dashboard');

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to fetch dashboard data');
        }

        const dashboardData = response.data;

        // Set wallets
        setWallets(dashboardData.wallets || []);

        // Set profile
        setProfile({
          kyc_status: user.kyc_status || 'not_submitted',
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || '',
        });

        // Check if user is admin
        if (user.role === 'admin') {
          setIsAdmin(true);
        }

        // Fetch customer
        try {
          const customerData = await getUserCustomer();
          setCustomer(customerData);
        } catch (error) {
          // No customer yet
        }

        // Show dialog if KYC is verified
        if (user.kyc_status === "verified") {
          setIsKycVerifiedDialogOpen(true);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  const getCurrencyColor = (currency: string) => {
    switch (currency) {
      case "USD":
        return "from-blue-500 via-cyan-500 to-blue-600";
      case "XOF":
        return "from-purple-500 via-pink-500 to-purple-600";
      default:
        return "from-gray-500 via-slate-500 to-gray-600";
    }
  };

  const getSelectedWallet = () => {
    return wallets.find(w => w.currency === selectedCurrency);
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customer) {
      toast.error("Vous devez d'abord créer un profil client Strowallet");
      navigate("/customer-setup");
      return;
    }

    try {
      await createCard({
        amount: parseFloat(amount),
        customer_email: customer.customer_email,
        name_on_card: nameOnCard,
        currency: currency,
      });
      
      toast.success("Carte créée avec succès!");
      setIsKycVerifiedDialogOpen(false);
      setAmount("");
      setNameOnCard("");
      navigate("/cards");
    } catch (error: any) {
      console.error("Error creating card:", error);
      toast.error(error.message || "Erreur lors de la création de la carte");
    }
  };

  const formatBalance = (balance: number, currency: string) => {
    const formatter = new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const formatted = formatter.format(balance);

    switch (currency) {
      case "USD":
        return `$${formatted}`;
      case "NGN":
        return `₦${formatted}`;
      case "XOF":
        return `${formatted} FCFA`;
      default:
        return formatted;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-primary shadow-glow flex items-center justify-center mx-auto mb-4 animate-float">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent" />
          </div>
          <p className="text-muted-foreground font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* KYC Verified Dialog */}
      <Dialog open={isKycVerifiedDialogOpen} onOpenChange={setIsKycVerifiedDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <DialogTitle className="text-2xl">KYC Validé !</DialogTitle>
            </div>
            <DialogDescription className="text-base">
              Félicitations ! Votre identité a été vérifiée avec succès. Vous pouvez maintenant créer votre première carte virtuelle.
            </DialogDescription>
          </DialogHeader>

          {customer ? (
            <form onSubmit={handleCreateCard} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="nameOnCard">Nom sur la carte</Label>
                <Input
                  id="nameOnCard"
                  placeholder="ex: JOHN DOE"
                  value={nameOnCard}
                  onChange={(e) => setNameOnCard(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Montant initial</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min={currency === "XOF" ? "5000" : "10"}
                  placeholder={currency === "XOF" ? "Minimum 5000 FCFA" : "Minimum 10 USD"}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Montant minimum: {currency === "XOF" ? "5000 FCFA" : "10 USD"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Devise</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="XOF">XOF (FCFA)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsKycVerifiedDialogOpen(false)}
                  className="flex-1"
                >
                  Plus tard
                </Button>
                <Button
                  type="submit"
                  disabled={strowalletLoading}
                  className="flex-1 bg-gradient-primary shadow-glow"
                >
                  {strowalletLoading ? "Création..." : "Créer ma carte"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Vous devez d'abord créer un profil client Strowallet pour pouvoir créer une carte.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsKycVerifiedDialogOpen(false)}
                  className="flex-1"
                >
                  Plus tard
                </Button>
                <Button
                  onClick={() => {
                    setIsKycVerifiedDialogOpen(false);
                    navigate("/customer-setup");
                  }}
                  className="flex-1 bg-gradient-primary shadow-glow"
                >
                  Créer mon profil
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="space-y-6 md:space-y-8">
        {/* Wallet Section with Currency Switcher */}
        <section className="animate-slide-up">

          {/* Currency Switcher */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={selectedCurrency === "USD" ? "default" : "outline"}
              size="lg"
              onClick={() => setSelectedCurrency("USD")}
              className={`font-bold transition-all duration-300 ${
                selectedCurrency === "USD"
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-glow border-0"
                  : "border-2 border-border hover:border-primary/50"
              }`}
            >
              USD
            </Button>
            <Button
              variant={selectedCurrency === "XOF" ? "default" : "outline"}
              size="lg"
              onClick={() => setSelectedCurrency("XOF")}
              className={`font-bold transition-all duration-300 ${
                selectedCurrency === "XOF"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-glow border-0"
                  : "border-2 border-border hover:border-primary/50"
              }`}
            >
              FCFA
            </Button>
          </div>

          {/* Single Wallet Card */}
          {getSelectedWallet() ? (
            <Card
              className={`relative p-6 md:p-8 bg-gradient-to-br ${getCurrencyColor(selectedCurrency)} text-white border-0 shadow-floating overflow-hidden group hover:scale-[1.01] transition-all duration-300 max-w-2xl animate-scale-in`}
            >
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex flex-col gap-1">
                    <div className="w-16 h-12 bg-white/20 rounded-xl backdrop-blur-sm flex items-center justify-center">
                      <span className="text-sm font-bold">{selectedCurrency === "XOF" ? "FCFA" : selectedCurrency}</span>
                    </div>
                    <p className="text-xs opacity-70 mt-2 uppercase tracking-wide">Solde disponible</p>
                  </div>
                  <Wallet className="w-10 h-10 opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex items-start justify-between gap-4">
                  <p className="text-4xl md:text-5xl font-bold mb-8 tracking-tight select-none">
                    {hideBalance ? (selectedCurrency === 'XOF' ? '•••• FCFA' : '••••') : formatBalance(getSelectedWallet()!.balance, selectedCurrency)}
                  </p>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="mt-1 bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm"
                    onClick={() => {
                      setHideBalance(v => {
                        const next = !v;
                        try { localStorage.setItem("hideBalance", String(next)); } catch {}
                        return next;
                      });
                    }}
                    title={hideBalance ? "Afficher le solde" : "Masquer le solde"}
                    aria-label={hideBalance ? "Afficher le solde" : "Masquer le solde"}
                  >
                    {hideBalance ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </Button>
                </div>
                {hideBalance && (
                  <div className="-mt-6 mb-6 text-xs font-medium bg-white/15 inline-flex items-center px-2 py-1 rounded backdrop-blur-sm">
                    Solde masqué
                  </div>
                )}
                  <div className="flex gap-3">
                    <Button
                      size="lg"
                      variant="secondary"
                      className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm transition-all font-semibold"
                      onClick={() => navigate("/deposit")}
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Recharger
                    </Button>
                    <Button
                      size="lg"
                      variant="secondary"
                      className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm transition-all font-semibold"
                      onClick={() => navigate("/cards")}
                    >
                      <ArrowUpRight className="w-5 h-5 mr-2" />
                      Utiliser
                    </Button>
                  </div>
                </div>
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24 group-hover:scale-150 transition-transform duration-500" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -ml-20 -mb-20" />
              <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
            </Card>
          ) : (
            <Card className="glass p-8 border-border/50 text-center">
              <p className="text-muted-foreground">Aucun wallet {selectedCurrency} disponible</p>
            </Card>
          )}
        </section>

        {/* Quick Actions */}
        <section className="animate-slide-up">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center shadow-glow">
              <Plus className="w-4 h-4 text-white" />
            </div>
            Actions rapides
          </h2>
          <div className={`grid grid-cols-2 ${isAdmin ? 'md:grid-cols-3 lg:grid-cols-5' : 'md:grid-cols-2 lg:grid-cols-4'} gap-3 md:gap-4`}>
            <Card className="glass p-4 md:p-6 hover:shadow-elevated hover:scale-[1.02] transition-all duration-300 cursor-pointer border-border/50 group" onClick={() => navigate("/cards")}>
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mb-3 md:mb-4 shadow-glow group-hover:scale-110 transition-transform">
                <CreditCard className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h3 className="font-semibold mb-1 md:mb-2 text-sm md:text-base">Créer une carte</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Nouvelle carte virtuelle
              </p>
            </Card>

            <Card className="glass p-4 md:p-6 hover:shadow-elevated hover:scale-[1.02] transition-all duration-300 cursor-pointer border-border/50 group" onClick={() => navigate("/cards")}>
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-secondary flex items-center justify-center mb-3 md:mb-4 shadow-glow group-hover:scale-110 transition-transform">
                <Wallet className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h3 className="font-semibold mb-1 md:mb-2 text-sm md:text-base">Mes cartes</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Gérer mes cartes
              </p>
            </Card>

            <Card className="glass p-4 md:p-6 hover:shadow-elevated hover:scale-[1.02] transition-all duration-300 cursor-pointer border-border/50 group">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-accent flex items-center justify-center mb-3 md:mb-4 shadow-glow group-hover:scale-110 transition-transform">
                <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h3 className="font-semibold mb-1 md:mb-2 text-sm md:text-base">Transactions</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Voir l'historique
              </p>
            </Card>

            <Card className="glass p-4 md:p-6 hover:shadow-elevated hover:scale-[1.02] transition-all duration-300 cursor-pointer border-border/50 group">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-success flex items-center justify-center mb-3 md:mb-4 shadow-glow group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h3 className="font-semibold mb-1 md:mb-2 text-sm md:text-base">KYC</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Vérifier mon identité
              </p>
            </Card>

            {isAdmin && (
              <Card className="glass p-4 md:p-6 hover:shadow-elevated hover:scale-[1.02] transition-all duration-300 cursor-pointer border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 group" onClick={() => navigate("/admin")}>
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mb-3 md:mb-4 shadow-glow group-hover:scale-110 transition-transform">
                  <Shield className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-1 md:mb-2 text-sm md:text-base">Administration</h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Gérer la plateforme
                </p>
              </Card>
            )}
          </div>
        </section>
      </div>
    </>
  );
};

export default Dashboard;
