import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContextPHP";
import { useNavigate } from "react-router-dom";
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
import { Wallet, Plus, ArrowUpRight, History, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface WalletData {
  id: string;
  currency: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

interface MonerooPayment {
  id: string;
  payment_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
  metadata?: any;
}

interface NowPaymentsTransaction {
  id: string;
  transfer_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  sub_partner_id: string;
}

interface FeeSetting {
  setting_key: string;
  setting_value: number;
  currency: string | null;
}

const Deposit = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [monerooPayments, setMonerooPayments] = useState<MonerooPayment[]>([]);
  const [nowpaymentsTransactions, setNowpaymentsTransactions] = useState<NowPaymentsTransaction[]>([]);
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
    
    if (paymentStatus === 'success') {
      toast.success("Paiement réussi ! Votre wallet sera crédité sous peu.");
      window.history.replaceState({}, document.title, "/deposit");
    } else if (paymentStatus === 'failed') {
      toast.error("Le paiement a échoué. Veuillez réessayer.");
      window.history.replaceState({}, document.title, "/deposit");
    }
  }, [user, navigate]);

  const loadData = async () => {
    try {
      const [walletsData, paymentsData, nowpaymentsData, feesData] = await Promise.all([
        loadWallets(),
        loadMonerooPayments(),
        loadNowpaymentsTransactions(),
        loadFeeSettings()
      ]);
      setWallets(walletsData || []);
      setMonerooPayments(paymentsData || []);
      setNowpaymentsTransactions(nowpaymentsData || []);
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

  const loadNowpaymentsTransactions = async () => {
    try {
      const response = await apiGet('/user?action=nowpayments_transactions&limit=20');
      if (!response.success) throw new Error(response.error);
      return response.data?.transactions || [];
    } catch (error) {
      console.error("Error loading NOWPayments transactions:", error);
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

    if (!selectedWallet || !depositAmount) {
      toast.error("Veuillez sélectionner un wallet et entrer un montant");
      return;
    }

    setDepositing(true);

    try {
      const amount = parseFloat(depositAmount);
      
      // USD uses NOWPayments, XOF uses Moneroo
      if (selectedWallet.currency === "USD") {
        // NOWPayments deposit
        const response = await apiPost('/payment?action=nowpayments', {
          amount: amount,
          wallet_id: selectedWallet.id,
          currency: selectedWallet.currency,
        });

        if (!response.success) {
          throw new Error(response.message || "Erreur lors de l'initialisation du dépôt");
        }

        toast.success("Dépôt USDT initié avec succès!");
        setIsDepositDialogOpen(false);
        setDepositAmount("");
        await loadData();
      } else if (selectedWallet.currency === "XOF") {
        // Moneroo payment (existing logic)
        const fees = calculateFees(amount, selectedWallet.currency);
        const totalAmount = amount + fees.fixedFee + fees.percentFee;

        const response = await apiPost('/payment?action=moneroo', {
          amount: totalAmount,
          currency: selectedWallet.currency,
          wallet_id: selectedWallet.id,
          base_amount: amount,
          fees: fees.fixedFee + fees.percentFee,
        });

        if (!response.success) {
          throw new Error(response.message || "Erreur lors de l'initialisation du paiement");
        }

        if (response.data?.payment_url) {
          window.location.href = response.data.payment_url;
        } else {
          throw new Error("URL de paiement non reçue");
        }
      }
    } catch (error: any) {
      console.error("Error initiating deposit:", error);
      toast.error(error.message || "Erreur lors de l'initialisation du dépôt");
    } finally {
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
        return "from-blue-500 via-cyan-500 to-blue-600";
      case "XOF":
        return "from-purple-500 via-pink-500 to-purple-600";
      default:
        return "from-gray-500 via-slate-500 to-gray-600";
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    const formatted = amount.toFixed(2);
    switch (currency) {
      case "USD":
        return `$${formatted}`;
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
      case "XOF":
        return "FCFA";
      default:
        return currency;
    }
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

  const getStatusIcon = (status: string) => {
    const normalizedStatus = status.toUpperCase();
    switch (normalizedStatus) {
      case 'FINISHED':
      case 'COMPLETED':
      case 'SUCCESS':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'WAITING':
      case 'CREATED':
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'REJECTED':
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toUpperCase();
    switch (normalizedStatus) {
      case 'FINISHED':
      case 'COMPLETED':
      case 'SUCCESS':
        return 'bg-green-500/20 text-green-500';
      case 'WAITING':
      case 'CREATED':
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'REJECTED':
      case 'FAILED':
        return 'bg-red-500/20 text-red-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    const normalizedStatus = status.toUpperCase();
    switch (normalizedStatus) {
      case 'FINISHED':
      case 'COMPLETED':
      case 'SUCCESS':
        return 'Réussi';
      case 'WAITING':
      case 'CREATED':
        return 'En attente';
      case 'PENDING':
        return 'En cours';
      case 'REJECTED':
      case 'FAILED':
        return 'Échoué';
      default:
        return status;
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
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      <div className="mb-6 md:mb-8 animate-slide-up">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
          Dépôt de fonds
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Rechargez vos wallets USD en USDT (TRC20/BEP20) ou XOF via Moneroo
        </p>
      </div>

      {/* Wallets Grid */}
      <section className="animate-slide-up">
        <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 flex items-center gap-2">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Wallet className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          Choisissez votre wallet
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {wallets.filter(wallet => wallet.currency !== 'NGN').map((wallet, index) => (
            <Card
              key={wallet.id}
              className={`relative p-6 bg-gradient-to-br ${getCurrencyColor(wallet.currency)} text-white border-0 shadow-floating overflow-hidden group hover:scale-[1.02] transition-all duration-300 cursor-pointer`}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => openDepositDialog(wallet)}
            >
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex flex-col gap-1">
                    <div className="w-14 h-10 bg-white/20 rounded-lg backdrop-blur-sm flex items-center justify-center">
                      <span className="text-xs font-bold">{wallet.currency}</span>
                    </div>
                    <p className="text-xs opacity-70 mt-2">Solde disponible</p>
                  </div>
                  <Wallet className="w-8 h-8 opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <p className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">
                    {formatCurrency(wallet.balance, wallet.currency)}
                  </p>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm transition-all"
                    onClick={() => openDepositDialog(wallet)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Recharger maintenant
                  </Button>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-500" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -ml-16 -mb-16" />
            </Card>
          ))}
        </div>
      </section>

      {/* NOWPayments Transactions History */}
      {nowpaymentsTransactions.length > 0 && (
        <section className="animate-slide-up">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 flex items-center gap-2">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-secondary flex items-center justify-center shadow-glow">
              <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            Historique des dépôts USDT
          </h2>
          
          <Card className="glass p-6 border-border/50 shadow-card">
            <div className="space-y-3">
              {nowpaymentsTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl glass hover:shadow-elevated transition-all duration-300 gap-3 md:gap-4"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-secondary/20 flex items-center justify-center flex-shrink-0">
                      {getStatusIcon(tx.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold mb-1">Dépôt USDT</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(tx.created_at)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        ID: {tx.transfer_id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-3 md:gap-4">
                    <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                      {getStatusLabel(tx.status)}
                    </div>
                    <p className="font-bold text-lg whitespace-nowrap">
                      {formatCurrency(tx.amount, "USD")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}

      {/* Moneroo Payments History */}
      {monerooPayments.length > 0 && (
        <section className="animate-slide-up">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 flex items-center gap-2">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-accent flex items-center justify-center shadow-glow">
              <History className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            Historique des paiements Moneroo
          </h2>
        
        <Card className="glass p-6 border-border/50 shadow-card">
          {monerooPayments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium mb-2">Aucun dépôt pour le moment</p>
              <p className="text-sm text-muted-foreground">
                Rechargez votre wallet pour commencer
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {monerooPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl glass hover:shadow-elevated transition-all duration-300 gap-3 md:gap-4"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-primary/20 flex items-center justify-center flex-shrink-0">
                      {getStatusIcon(payment.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold mb-1">Recharge Moneroo</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(payment.created_at)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        ID: {payment.payment_id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-3 md:gap-4">
                    <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {getStatusLabel(payment.status)}
                    </div>
                    <p className="font-bold text-lg whitespace-nowrap">
                      {formatCurrency(payment.amount, payment.currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
      )}

      {/* Deposit Dialog */}
      <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl">Déposer des fonds</DialogTitle>
            <DialogDescription>
              {selectedWallet?.currency === "USD" 
                ? "Entrez le montant en USDT (TRC20/BEP20) que vous souhaitez déposer."
                : "Ajoutez des fonds à votre wallet via Moneroo"
              }
            </DialogDescription>
          </DialogHeader>

          {selectedWallet && (
            <form onSubmit={handleDeposit} className="space-y-5">
              <Card className="glass p-4 border-border/50">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Wallet</span>
                  <span className="text-sm font-semibold">{selectedWallet.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Solde actuel</span>
                  <span className="text-sm font-semibold">
                    {formatCurrency(selectedWallet.balance, selectedWallet.currency)}
                  </span>
                </div>
              </Card>

              <div className="space-y-2">
                <Label htmlFor="depositAmount" className="text-base">Montant à déposer</Label>
                <div className="relative">
                  <Input
                    id="depositAmount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="100.00"
                    className="pr-20 h-12 text-base"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                    {getCurrencySymbol(selectedWallet.currency)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {selectedWallet.currency === "USD" 
                    ? "💳 Dépôt en USDT (TRC20/BEP20) via NOWPayments" 
                    : "💳 Vous serez redirigé vers Moneroo pour effectuer le paiement"
                  }
                </p>
              </div>

              {depositAmount && parseFloat(depositAmount) > 0 && selectedWallet.currency === "XOF" && (() => {
                const fees = calculateFees(parseFloat(depositAmount), selectedWallet.currency);
                return (
                  <>
                    <Card className="glass p-4 border-border/50 space-y-3">
                      <p className="text-sm font-semibold mb-2">Détails de la transaction:</p>
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
                      <div className="border-t border-border/50 pt-3 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold">Total à payer</span>
                          <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                            {formatCurrency(fees.totalAmount, selectedWallet.currency)}
                          </span>
                        </div>
                      </div>
                    </Card>

                    <Card className="glass p-4 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                      <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        Après rechargement:
                      </p>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Nouveau solde</span>
                        <span className="text-sm font-bold text-primary">
                          {formatCurrency(
                            parseFloat(selectedWallet.balance.toString()) + parseFloat(depositAmount),
                            selectedWallet.currency
                          )}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        ℹ️ Les frais ne sont pas déduits de votre solde
                      </p>
                    </Card>
                  </>
                );
              })()}

              <Button
                type="submit"
                className="w-full h-12 text-base bg-gradient-primary shadow-glow hover:shadow-floating transition-all"
                disabled={depositing || !depositAmount || parseFloat(depositAmount) <= 0}
              >
                {depositing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Redirection en cours...
                  </>
                 ) : (
                  <>
                    <ArrowUpRight className="w-5 h-5 mr-2" />
                    {selectedWallet.currency === "USD" 
                      ? "Initier le dépôt USDT" 
                      : "Confirmer le dépôt"
                    }
                  </>
                 )}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Deposit;
