import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContextPHP";
import { useNavigate } from "react-router-dom";
import { useStrowallet } from "@/hooks/useStrowallet";
import { apiGet } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import CardPreview from "@/components/CardPreview";
import { CreditCard, Plus, LogOut, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const Cards = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { getUserCards, getUserCustomer, createCard, fundCard, loading } = useStrowallet();
  const [cards, setCards] = useState<any[]>([]);
  const [customer, setCustomer] = useState<any>(null);
  const [wallets, setWallets] = useState<any[]>([]);
  const [feeSettings, setFeeSettings] = useState<any>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isFundDialogOpen, setIsFundDialogOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<any>(null);

  // Create card form
  const [amount, setAmount] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [cardType, setCardType] = useState("visa");

  // Fund card form
  const [fundAmount, setFundAmount] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    loadData();
  }, [user, navigate]);

  // Pré-remplir le nom sur la carte et l'email avec les infos du customer
  useEffect(() => {
    if (customer && isCreateDialogOpen) {
      if (!nameOnCard) {
        const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim().toUpperCase();
        if (fullName) {
          setNameOnCard(fullName);
        }
      }
      if (!customerEmail) {
        setCustomerEmail(customer.customer_email || '');
      }
    }
  }, [customer, isCreateDialogOpen]);

  const loadData = async () => {
    try {
      const [cardsData, customerData, walletsData, feesData] = await Promise.all([
        getUserCards(),
        getUserCustomer(),
        loadWallets(),
        loadFeeSettings(),
      ]);
      setCards(cardsData || []);
      setCustomer(customerData);
      setWallets(walletsData || []);
      setFeeSettings(feesData || {});
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const loadWallets = async () => {
    try {
      const data = await apiGet('/wallets?action=list');
      return data.wallets || [];
    } catch (error) {
      console.error("Error loading wallets:", error);
      return [];
    }
  };

  const loadFeeSettings = async () => {
    try {
      const data = await apiGet('/admin?action=fees_settings');
      
      // Convert array to object for easy lookup
      const feesMap: any = {};
      data.fees?.forEach((fee: any) => {
        feesMap[fee.setting_key] = parseFloat(fee.setting_value);
      });
      return feesMap;
    } catch (error) {
      console.error("Error loading fee settings:", error);
      return {};
    }
  };

  const calculateFees = (amount: number, currency: string, type: 'creation' | 'reload') => {
    const amountNum = parseFloat(amount.toString());
    const key = type === 'creation' ? 'card_creation' : 'card_reload';
    
    const fixedFee = feeSettings[`${key}_fixed_fee_${currency.toLowerCase()}`] || 0;
    const percentFee = (amountNum * (feeSettings[`${key}_percent_fee`] || 0)) / 100;
    
    return {
      fixedFee,
      percentFee,
      totalFees: fixedFee + percentFee,
      totalAmount: amountNum + fixedFee + percentFee
    };
  };

  const getMinAmount = (currency: string, type: 'creation' | 'reload') => {
    const key = type === 'creation' ? 'min_card_creation' : 'min_card_reload';
    return feeSettings[`${key}_${currency.toLowerCase()}`] || (currency === 'XOF' ? 5000 : 10);
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customer) {
      alert("Vous devez d'abord créer un profil client Strowallet");
      return;
    }

    const amountNum = parseFloat(amount);
    const minAmount = getMinAmount(currency, 'creation');
    
    if (amountNum < minAmount) {
      alert(`Le montant minimum est de ${getCurrencySymbol(currency)}${minAmount}`);
      return;
    }

    const fees = calculateFees(amountNum, currency, 'creation');
    const walletBalance = getWalletBalance(currency);
    
    if (walletBalance < fees.totalAmount) {
      alert(`Solde insuffisant. Vous avez ${getCurrencySymbol(currency)}${walletBalance.toFixed(2)} mais ${getCurrencySymbol(currency)}${fees.totalAmount.toFixed(2)} sont nécessaires (montant + frais).`);
      return;
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      alert("Veuillez entrer une adresse email valide");
      return;
    }

    try {
      await createCard({
        amount: amountNum,
        customer_email: customerEmail,
        name_on_card: nameOnCard,
        currency: currency,
        card_type: cardType,
      });
      setIsCreateDialogOpen(false);
      setAmount("");
      setNameOnCard("");
      setCustomerEmail("");
      setCardType("visa");
      loadData();
    } catch (error) {
      console.error("Error creating card:", error);
    }
  };

  const handleFundCard = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCard) return;

    try {
      await fundCard(selectedCard.card_id, parseFloat(fundAmount));
      setIsFundDialogOpen(false);
      setFundAmount("");
      setSelectedCard(null);
      loadData();
    } catch (error) {
      console.error("Error funding card:", error);
    }
  };

  const openFundDialog = (card: any) => {
    setSelectedCard(card);
    setIsFundDialogOpen(true);
  };

  const getWalletBalance = (currency: string) => {
    const wallet = wallets.find(w => w.currency === currency);
    return wallet ? parseFloat(wallet.balance) : 0;
  };

  const toggleCVV = (cardId: string) => {
    // Removed - now handled by CardPreview component
  };

  const getCurrencySymbol = (curr: string) => {
    switch (curr) {
      case "USD": return "$";
      case "NGN": return "₦";
      case "XOF": return "FCFA";
      default: return curr;
    }
  };

  const formatCardNumber = (number: string) => {
    // Removed - now handled by CardPreview component
    return "";
  };

  const getCardColor = (type: string) => {
    // Removed - now handled by CardPreview component
    return "";
  };

  const stats = useMemo(() => {
    const active = cards.filter(c => c.status === 'active').length;
    const suspended = cards.filter(c => c.status === 'suspended').length;
    const totalUSD = cards.filter(c => c.currency === 'USD').reduce((s, c) => s + parseFloat(c.balance), 0);
    const totalXOF = cards.filter(c => c.currency === 'XOF').reduce((s, c) => s + parseFloat(c.balance), 0);
    return { active, suspended, totalUSD, totalXOF };
  }, [cards]);

  return (
    <div className="min-h-screen bg-background">
      {/* Sub Header */}
      <div className="border-b bg-card/60 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link to="/dashboard">
                <Button variant="outline" size="icon" className="hover:bg-muted" aria-label="Retour dashboard">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Mes Cartes Virtuelles</h1>
                <p className="text-sm text-muted-foreground">Gestion des cartes et rechargements ({cards.length}/10)</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {customer ? (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="bg-gradient-primary shadow-glow"
                      disabled={cards.length >= 10 || loading}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nouvelle carte {cards.length >= 10 && `(${cards.length}/10)`}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg h-[92vh] flex flex-col p-0">
                    <div className="flex-shrink-0 p-6 space-y-2 border-b">
                      <DialogTitle>Créer une carte virtuelle</DialogTitle>
                      <DialogDescription>Prévisualisez et confirmez les informations.</DialogDescription>
                    </div>
                    <div className="flex-shrink-0 px-6 pt-2 pb-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                      <CardPreview
                        brand={cardType as "visa" | "mastercard"}
                        nameOnCard={nameOnCard || "VOTRE NOM"}
                        last4="****"
                        expiry="MM/YY"
                        balance={amount ? parseFloat(amount) : 0}
                        currency={currency}
                        cardStatus="active"
                        sandbox={true}
                      />
                    </div>
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                      <form onSubmit={handleCreateCard} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="nameOnCard">Nom sur la carte *</Label>
                          <Input
                            id="nameOnCard"
                            value={nameOnCard}
                            onChange={(e) => setNameOnCard(e.target.value.toUpperCase())}
                            placeholder="JEAN DUPONT"
                            minLength={2}
                            maxLength={40}
                            required
                          />
                          <p className="text-xs text-muted-foreground">2-40 caractères</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="customerEmail">Email client *</Label>
                          <Input
                            id="customerEmail"
                            type="email"
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                            placeholder="exemple@email.com"
                            required
                          />
                          <p className="text-xs text-muted-foreground">Email associé à cette carte</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cardType">Type de carte *</Label>
                          <Select value={cardType} onValueChange={setCardType}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-popover z-50">
                              <SelectItem value="visa">VISA</SelectItem>
                              <SelectItem value="mastercard">Mastercard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="currency">Devise *</Label>
                          <Select value={currency} onValueChange={setCurrency}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-popover z-50">
                              <SelectItem value="USD">USD - Dollar américain</SelectItem>
                              <SelectItem value="XOF">XOF - Franc CFA (FCFA)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="amount">Montant initial *</Label>
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            min={getMinAmount(currency, 'creation')}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={getMinAmount(currency, 'creation').toString()}
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            Min: {getCurrencySymbol(currency)}{getMinAmount(currency, 'creation')} • 
                            Solde wallet: {getCurrencySymbol(currency)}{getWalletBalance(currency).toFixed(2)}
                          </p>
                          {amount && (
                            <div className="bg-muted p-3 rounded-md space-y-1 text-xs">
                              <div className="flex justify-between"><span>Montant carte</span><span className="font-medium">{getCurrencySymbol(currency)}{parseFloat(amount).toFixed(2)}</span></div>
                              <div className="flex justify-between"><span>Frais fixe</span><span className="font-medium">{getCurrencySymbol(currency)}{calculateFees(parseFloat(amount), currency, 'creation').fixedFee.toFixed(2)}</span></div>
                              <div className="flex justify-between"><span>Frais {feeSettings['card_creation_percent_fee'] || 0}%</span><span className="font-medium">{getCurrencySymbol(currency)}{calculateFees(parseFloat(amount), currency, 'creation').percentFee.toFixed(2)}</span></div>
                              <div className="h-px bg-border"></div>
                              <div className="flex justify-between font-semibold"><span>Total à débiter</span><span className="text-primary">{getCurrencySymbol(currency)}{calculateFees(parseFloat(amount), currency, 'creation').totalAmount.toFixed(2)}</span></div>
                            </div>
                          )}
                        </div>

                        <div className="bg-muted/50 p-3 rounded-md text-xs space-y-1">
                          <div className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">ℹ️</span>
                            <div>
                              <p className="font-medium mb-1">Informations importantes:</p>
                              <ul className="space-y-0.5 text-muted-foreground">
                                <li>• Les frais sont automatiquement débités de votre wallet</li>
                                <li>• La carte sera activée immédiatement</li>
                                <li>• Vous pouvez utiliser un email différent de celui de votre profil</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                        
                        <Button type="submit" className="w-full bg-gradient-primary shadow-glow" disabled={loading}>
                          {loading ? "Création..." : "Créer la carte"}
                        </Button>
                      </form>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <Link to="/customer-setup">
                  <Button className="bg-gradient-primary shadow-glow">Créer un profil client</Button>
                </Link>
              )}
              <Button variant="ghost" onClick={signOut} className="hidden md:inline-flex">
                <LogOut className="w-4 h-4 mr-2" /> Déconnexion
              </Button>
            </div>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-3 flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Cartes actives</span>
              <div className="text-lg font-semibold">{stats.active}</div>
            </Card>
            <Card className="p-3 flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Cartes suspendues</span>
              <div className="text-lg font-semibold">{stats.suspended}</div>
            </Card>
            <Card className="p-3 flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Solde USD</span>
              <div className="text-lg font-semibold">${stats.totalUSD.toFixed(2)}</div>
            </Card>
            <Card className="p-3 flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Solde XOF</span>
              <div className="text-lg font-semibold">{stats.totalXOF.toFixed(0)} FCFA</div>
            </Card>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 space-y-10">
        {loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-4 space-y-3">
                <Skeleton className="h-32 w-full rounded-md" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </Card>
            ))}
          </div>
        )}

        {!loading && cards.length === 0 && (
          <Card className="p-10 text-center border-dashed">
            <CreditCard className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
            <h3 className="text-2xl font-semibold mb-2">Aucune carte créée</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {customer ? "Créez votre première carte virtuelle pour commencer vos paiements en ligne sécurisés." : "Créez d'abord votre profil client pour démarrer la création de cartes virtuelles."}
            </p>
            {customer ? (
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-gradient-primary shadow-glow">
                <Plus className="w-4 h-4 mr-2" /> Créer une carte
              </Button>
            ) : (
              <Link to="/customer-setup">
                <Button className="bg-gradient-primary shadow-glow">Créer mon profil client</Button>
              </Link>
            )}
          </Card>
        )}

        {!loading && cards.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card) => (
              <div key={card.id} className="space-y-2">
                <CardPreview
                  brand={card.card_type}
                  nameOnCard={card.name_on_card}
                  last4={card.card_number}
                  expiry={card.expiry_month && card.expiry_year ? `${card.expiry_month}/${card.expiry_year}` : undefined}
                  balance={parseFloat(card.balance)}
                  currency={card.currency}
                  cardStatus={card.status}
                  cvv={card.cvv}
                  sandbox={true}
                  onFund={() => openFundDialog(card)}
                  onViewDetails={() => navigate(`/cards/${card.card_id}`)}
                />
                <div className="flex items-center justify-between text-xs">
                  <Badge variant={card.status === 'active' ? 'default' : 'secondary'}>{card.status}</Badge>
                  <span className="text-muted-foreground">{card.currency}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Fund Card Dialog */}
        <Dialog open={isFundDialogOpen} onOpenChange={setIsFundDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Recharger la carte</DialogTitle>
              <DialogDescription>Rechargez votre carte depuis votre wallet {selectedCard?.currency}</DialogDescription>
            </DialogHeader>
            {selectedCard && (
              <form onSubmit={handleFundCard} className="space-y-5">
                <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Carte</span><span className="font-medium">•••• {selectedCard.card_number}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Solde actuel</span><span className="font-medium">{getCurrencySymbol(selectedCard.currency)}{selectedCard.balance?.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Wallet disponible</span><span className="font-medium">{getCurrencySymbol(selectedCard.currency)}{getWalletBalance(selectedCard.currency).toFixed(2)}</span></div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fundAmount">Montant à ajouter</Label>
                  <Input
                    id="fundAmount"
                    type="number"
                    step="0.01"
                    min={getMinAmount(selectedCard.currency, 'reload')}
                    max={getWalletBalance(selectedCard.currency)}
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    placeholder={getMinAmount(selectedCard.currency, 'reload').toString()}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Minimum: {getCurrencySymbol(selectedCard.currency)}{getMinAmount(selectedCard.currency, 'reload')}</p>
                </div>
                {fundAmount && (
                  <>
                    <div className="bg-muted p-3 rounded-lg space-y-1 text-xs">
                      <div className="flex justify-between"><span>Montant</span><span className="font-medium">{getCurrencySymbol(selectedCard.currency)}{parseFloat(fundAmount).toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>Frais fixe</span><span className="font-medium">{getCurrencySymbol(selectedCard.currency)}{calculateFees(parseFloat(fundAmount), selectedCard.currency, 'reload').fixedFee.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>Frais {feeSettings['card_reload_percent_fee'] || 0}%</span><span className="font-medium">{getCurrencySymbol(selectedCard.currency)}{calculateFees(parseFloat(fundAmount), selectedCard.currency, 'reload').percentFee.toFixed(2)}</span></div>
                      <div className="h-px bg-border"></div>
                      <div className="flex justify-between font-semibold"><span>Total débité</span><span className="text-primary">{getCurrencySymbol(selectedCard.currency)}{calculateFees(parseFloat(fundAmount), selectedCard.currency, 'reload').totalAmount.toFixed(2)}</span></div>
                    </div>
                    <div className="bg-primary/10 p-4 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between"><span>Nouveau solde carte</span><span className="font-medium">{getCurrencySymbol(selectedCard.currency)}{(parseFloat(selectedCard.balance.toString()) + parseFloat(fundAmount)).toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>Nouveau solde wallet</span><span className="font-medium">{getCurrencySymbol(selectedCard.currency)}{(getWalletBalance(selectedCard.currency) - calculateFees(parseFloat(fundAmount), selectedCard.currency, 'reload').totalAmount).toFixed(2)}</span></div>
                    </div>
                  </>
                )}
                <Button
                  type="submit"
                  className="w-full bg-gradient-primary shadow-glow"
                  disabled={
                    loading ||
                    !fundAmount ||
                    parseFloat(fundAmount) < getMinAmount(selectedCard.currency, 'reload') ||
                    calculateFees(parseFloat(fundAmount), selectedCard.currency, 'reload').totalAmount > getWalletBalance(selectedCard.currency)
                  }
                >
                  {loading ? "Rechargement..." : "Recharger la carte"}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Cards;
