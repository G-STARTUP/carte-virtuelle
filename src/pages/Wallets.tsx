import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContextPHP";
import { useNavigate, Link } from "react-router-dom";
import { apiGet, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Wallet, Plus, ArrowLeft, LogOut, ArrowUpRight, History } from "lucide-react";
import { toast } from "sonner";

interface WalletData {
  id: string;
  currency: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: string;
  wallet_id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

interface MonerooPayment {
  id: string;
  payment_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface FeeSetting {
  setting_key: string;
  setting_value: number;
  currency: string | null;
}

const Wallets = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monerooPayments, setMonerooPayments] = useState<MonerooPayment[]>([]);
  const [feeSettings, setFeeSettings] = useState<FeeSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositing, setDepositing] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    loadData();

    // Check for payment status in URL
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const paymentId = urlParams.get('paymentId');
    
    if (paymentStatus === 'success') {
      toast.success("Paiement réussi ! Votre wallet sera crédité sous peu.");
      // Clean up URL
      window.history.replaceState({}, document.title, "/wallets");
    } else if (paymentStatus === 'failed') {
      toast.error("Le paiement a échoué. Veuillez réessayer.");
      window.history.replaceState({}, document.title, "/wallets");
    }
  }, [user, navigate]);

  const loadData = async () => {
    try {
      const [walletsData, transactionsData, paymentsData, feesData] = await Promise.all([
        loadWallets(),
        loadTransactions(),
        loadMonerooPayments(),
        loadFeeSettings()
      ]);
      setWallets(walletsData || []);
      setTransactions(transactionsData || []);
      setMonerooPayments(paymentsData || []);
      setFeeSettings(feesData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadWallets = async () => {
    try {
      const response = await apiGet('/wallets');
      if (!response.success) throw new Error(response.error);
      return response.data?.wallets || [];
    } catch (error) {
      console.error("Error loading wallets:", error);
      return [];
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await apiGet('/user?action=transactions&limit=20');
      if (!response.success) throw new Error(response.error);
      return response.data?.transactions || [];
    } catch (error) {
      console.error("Error loading transactions:", error);
      return [];
    }
  };

  const loadMonerooPayments = async () => {
    try {
      const response = await apiGet('/user?action=moneroo_payments&limit=20');
      if (!response.success) throw new Error(response.error);
      return response.data?.payments || [];
    } catch (error) {
      console.error("Error loading Moneroo payments:", error);
      return [];
    }
  };

  const loadFeeSettings = async () => {
    try {
      const response = await apiGet('/admin?action=fees');
      if (!response.success) throw new Error(response.error);
      return response.data?.fees || [];
    } catch (error) {
      console.error("Error loading fee settings:", error);
      return [];
    }
  };

  const calculateFees = (amount: number, currency: string) => {
    if (!amount || amount <= 0) return { fixedFee: 0, percentFee: 0, totalFees: 0, totalAmount: 0 };

    const fixedFeeSetting = feeSettings.find(
      f => f.setting_key === `card_reload_fixed_fee_${currency.toLowerCase()}` && f.currency === currency
    );
    const percentFeeSetting = feeSettings.find(
      f => f.setting_key === "card_reload_percent_fee"
    );

    const fixedFee = fixedFeeSetting ? fixedFeeSetting.setting_value : 0;
    const percentFee = percentFeeSetting ? (amount * percentFeeSetting.setting_value / 100) : 0;
    const totalFees = fixedFee + percentFee;
    const totalAmount = amount + totalFees;

    return { fixedFee, percentFee, totalFees, totalAmount };
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedWallet || !depositAmount) return;

    setDepositing(true);
    try {
      const amount = parseFloat(depositAmount);
      if (amount <= 0) {
        toast.error("Le montant doit être supérieur à 0");
        return;
      }

      const fees = calculateFees(amount, selectedWallet.currency);

      // Initialize Moneroo payment with fees included
      const response = await apiPost('/payment?action=moneroo', {
        wallet_id: selectedWallet.id,
        amount: amount,
        currency: selectedWallet.currency,
        fees: fees.totalFees,
        total_amount: fees.totalAmount,
      });

      if (!response.success) {
        console.error("Error initializing payment:", response.error);
        throw new Error(response.message || "Erreur lors de l'initialisation du paiement");
      }

      // Redirect to Moneroo checkout
      if (response.data?.payment_url) {
        toast.success("Redirection vers la page de paiement...");
        window.location.href = response.data.payment_url;
      } else {
        throw new Error("URL de paiement non reçue");
      }

    } catch (error: any) {
      console.error("Error depositing funds:", error);
      toast.error(error.message || "Erreur lors du dépôt");
      setDepositing(false);
    }
  };

  const openDepositDialog = (wallet: WalletData) => {
    setSelectedWallet(wallet);
    setIsDepositDialogOpen(true);
  };

  const getCurrencyColor = (currency: string) => {
    switch (currency) {
      case "USD":
        return "from-blue-500 to-cyan-500";
      case "NGN":
        return "from-green-500 to-emerald-500";
      case "XOF":
        return "from-purple-500 to-pink-500";
      default:
        return "from-gray-500 to-slate-500";
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    const formatted = amount.toFixed(2);
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

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case "USD":
        return "$";
      case "NGN":
        return "₦";
      case "XOF":
        return "FCFA";
      default:
        return currency;
    }
  };

  const getWalletByCurrency = (currency: string) => {
    return wallets.find(w => w.currency === currency);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                VirtualPay
              </span>
            </div>
          </div>

          <Button variant="ghost" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mes Wallets</h1>
          <p className="text-muted-foreground">
            Gérez vos soldes et effectuez des dépôts
          </p>
        </div>

        {/* Wallets Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {wallets.filter(wallet => wallet.currency !== 'NGN').map((wallet) => (
            <Card
              key={wallet.id}
              className={`relative p-6 bg-gradient-to-br ${getCurrencyColor(wallet.currency)} text-white border-0 shadow-glow overflow-hidden`}
            >
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div className="w-12 h-8 bg-white/20 rounded backdrop-blur-sm flex items-center justify-center">
                    <span className="text-xs font-bold">{wallet.currency}</span>
                  </div>
                  <Wallet className="w-8 h-8 opacity-80" />
                </div>
                <div>
                  <p className="text-sm opacity-80 mb-1">Solde disponible</p>
                  <p className="text-3xl font-bold mb-4">
                    {formatCurrency(wallet.balance, wallet.currency)}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white/20 hover:bg-white/30 text-white border-0"
                      onClick={() => openDepositDialog(wallet)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Déposer
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white/20 hover:bg-white/30 text-white border-0"
                      onClick={() => navigate("/cards")}
                    >
                      <ArrowUpRight className="w-4 h-4 mr-1" />
                      Utiliser
                    </Button>
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
            </Card>
          ))}
        </div>

        {/* Moneroo Payments History */}
        <Card className="p-6 border-border/50 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Wallet className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Historique des paiements Moneroo</h2>
          </div>

          {monerooPayments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Aucun paiement Moneroo pour le moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {monerooPayments.map((payment) => {
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case 'completed':
                    case 'success':
                      return 'bg-green-500/20 text-green-500';
                    case 'pending':
                      return 'bg-yellow-500/20 text-yellow-500';
                    case 'failed':
                      return 'bg-red-500/20 text-red-500';
                    default:
                      return 'bg-gray-500/20 text-gray-500';
                  }
                };

                const getStatusLabel = (status: string) => {
                  switch (status) {
                    case 'completed':
                    case 'success':
                      return 'Réussi';
                    case 'pending':
                      return 'En attente';
                    case 'failed':
                      return 'Échoué';
                    default:
                      return status;
                  }
                };

                return (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <ArrowUpRight className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Recharge Moneroo</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(payment.created_at)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          ID: {payment.payment_id}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                          {getStatusLabel(payment.status)}
                        </div>
                        <p className="font-semibold text-lg">
                          {formatCurrency(payment.amount, payment.currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Transactions History */}
        <Card className="p-6 border-border/50">
          <div className="flex items-center gap-2 mb-6">
            <History className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Historique des transactions</h2>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Aucune transaction pour le moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => {
                const wallet = wallets.find(w => w.id === transaction.wallet_id);
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'deposit' ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}>
                        {transaction.type === 'deposit' ? (
                          <Plus className="w-5 h-5 text-green-500" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(transaction.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.type === 'deposit' ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {transaction.type === 'deposit' ? '+' : '-'}
                        {wallet ? formatCurrency(transaction.amount, wallet.currency) : transaction.amount}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Deposit Dialog */}
        <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Déposer des fonds</DialogTitle>
              <DialogDescription>
                Ajoutez des fonds à votre wallet {selectedWallet?.currency}
              </DialogDescription>
            </DialogHeader>

            {selectedWallet && (
              <form onSubmit={handleDeposit} className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Wallet</span>
                    <span className="text-sm font-medium">{selectedWallet.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Solde actuel</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(selectedWallet.balance, selectedWallet.currency)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="depositAmount">Montant à déposer</Label>
                  <div className="relative">
                    <Input
                      id="depositAmount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="100.00"
                      className="pr-12"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      {getCurrencySymbol(selectedWallet.currency)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💳 Vous serez redirigé vers Moneroo pour effectuer le paiement
                  </p>
                </div>

                {depositAmount && parseFloat(depositAmount) > 0 && (() => {
                  const fees = calculateFees(parseFloat(depositAmount), selectedWallet.currency);
                  return (
                    <>
                      <div className="bg-muted p-4 rounded-lg space-y-2">
                        <p className="text-sm font-medium mb-3">Détails de la transaction:</p>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Montant</span>
                          <span className="font-medium">
                            {formatCurrency(parseFloat(depositAmount), selectedWallet.currency)}
                          </span>
                        </div>
                        {fees.fixedFee > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Frais fixes</span>
                            <span className="font-medium text-orange-500">
                              +{formatCurrency(fees.fixedFee, selectedWallet.currency)}
                            </span>
                          </div>
                        )}
                        {fees.percentFee > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Frais (pourcentage)</span>
                            <span className="font-medium text-orange-500">
                              +{formatCurrency(fees.percentFee, selectedWallet.currency)}
                            </span>
                          </div>
                        )}
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-semibold">Montant total à payer</span>
                            <span className="text-base font-bold text-primary">
                              {formatCurrency(fees.totalAmount, selectedWallet.currency)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-primary/10 p-4 rounded-lg">
                        <p className="text-sm font-medium mb-2">Après rechargement:</p>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Nouveau solde</span>
                          <span className="text-sm font-medium">
                            {formatCurrency(
                              parseFloat(selectedWallet.balance.toString()) + parseFloat(depositAmount),
                              selectedWallet.currency
                            )}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          ℹ️ Les frais ne sont pas déduits de votre solde
                        </p>
                      </div>
                    </>
                  );
                })()}

                <Button
                  type="submit"
                  className="w-full bg-gradient-primary shadow-glow"
                  disabled={depositing || !depositAmount || parseFloat(depositAmount) <= 0}
                >
                  {depositing ? "Dépôt en cours..." : "Confirmer le dépôt"}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Wallets;
