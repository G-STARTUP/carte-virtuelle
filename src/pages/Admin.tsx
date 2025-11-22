import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContextPHP";
import { useNavigate, Link } from "react-router-dom";
import { apiGet, apiPut } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ArrowLeft, LogOut, Save, Search, Plus, Minus, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FeeSetting {
  id: string;
  setting_key: string;
  setting_value: number;
  description: string | null;
  currency: string | null;
}

interface UserWallet {
  id: string;
  user_id: string;
  currency: string;
  balance: number;
}

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

const Admin = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feeSettings, setFeeSettings] = useState<FeeSetting[]>([]);
  
  // User wallet management states
  const [searchEmail, setSearchEmail] = useState("");
  const [searchedUser, setSearchedUser] = useState<UserProfile | null>(null);
  const [userWallets, setUserWallets] = useState<UserWallet[]>([]);
  const [loadingUser, setLoadingUser] = useState(false);
  const [managingWallet, setManagingWallet] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    checkAdminStatus();
  }, [user, navigate]);

  const checkAdminStatus = async () => {
    try {
      if (user?.role !== 'admin') {
        toast.error("Accès refusé. Vous n'êtes pas administrateur.");
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
      await loadFeeSettings();
    } catch (error: any) {
      console.error("Error checking admin status:", error);
      toast.error("Erreur lors de la vérification des permissions");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadFeeSettings = async () => {
    try {
      const response = await apiGet('/admin?action=fees');
      if (!response.success) throw new Error(response.error);
      setFeeSettings(response.data?.fees || []);
    } catch (error: any) {
      console.error("Error loading fee settings:", error);
      toast.error("Erreur lors du chargement des paramètres");
    }
  };

  const handleUpdateSetting = async (settingId: string, newValue: number) => {
    setFeeSettings(prev =>
      prev.map(s => s.id === settingId ? { ...s, setting_value: newValue } : s)
    );
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const updates = feeSettings.map(setting => ({
        id: setting.id,
        setting_value: setting.setting_value,
        updated_at: new Date().toISOString()
      }));

      for (const setting of feeSettings) {
        const response = await apiPut('/admin?action=fees', {
          setting_key: setting.setting_key,
          setting_value: setting.setting_value
        });

        if (!response.success) throw new Error(response.error);
      }

      toast.success("Paramètres mis à jour avec succès");
      await loadFeeSettings();
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error("Erreur lors de la sauvegarde des paramètres");
    } finally {
      setSaving(false);
    }
  };

  const getSettingLabel = (key: string): string => {
    const labels: Record<string, string> = {
      card_creation_fixed_fee_usd: "Frais fixe création carte (USD)",
      card_creation_fixed_fee_xof: "Frais fixe création carte (XOF)",
      card_creation_percent_fee: "Frais % création carte",
      card_reload_fixed_fee_usd: "Frais fixe rechargement (USD)",
      card_reload_fixed_fee_xof: "Frais fixe rechargement (XOF)",
      card_reload_percent_fee: "Frais % rechargement",
      min_card_creation_usd: "Minimum création carte (USD)",
      min_card_creation_xof: "Minimum création carte (XOF)",
      min_card_reload_usd: "Minimum rechargement (USD)",
      min_card_reload_xof: "Minimum rechargement (XOF)"
    };
    return labels[key] || key;
  };

  const getCurrencySymbol = (currency: string | null): string => {
    switch (currency) {
      case "USD": return "$";
      case "XOF": return "FCFA";
      case "NGN": return "₦";
      case "PERCENT": return "%";
      default: return "";
    }
  };

  const handleSearchUser = async () => {
    if (!searchEmail.trim()) {
      toast.error("Veuillez entrer un email");
      return;
    }

    setLoadingUser(true);
    try {
      const response = await apiGet(`/admin?action=search_user&email=${encodeURIComponent(searchEmail.trim())}`);

      if (!response.success || !response.data) {
        toast.error("Utilisateur introuvable");
        setSearchedUser(null);
        setUserWallets([]);
        return;
      }

      setSearchedUser(response.data.user);
      setUserWallets(response.data.wallets || []);
      toast.success("Utilisateur trouvé");
    } catch (error: any) {
      console.error("Error searching user:", error);
      toast.error("Erreur lors de la recherche");
      setSearchedUser(null);
      setUserWallets([]);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleManageWallet = async (
    walletId: string,
    action: "add" | "subtract",
    amount: number,
    currency: string
  ) => {
    if (amount <= 0) {
      toast.error("Le montant doit être supérieur à 0");
      return;
    }

    setManagingWallet(true);
    try {
      const response = await apiPost('/admin?action=manage_wallet', {
        action,
        userId: searchedUser!.id,
        walletId,
        amount: amount.toString(),
        description: action === "add" 
          ? `Ajout admin: +${amount} ${currency}`
          : `Retrait admin: -${amount} ${currency}`
      });

      if (!response.success) {
        throw new Error(response.message || response.error);
      }

      toast.success(response.data?.message || 'Wallet mis à jour');

      // Refresh wallets
      const walletsResponse = await apiGet(`/admin?action=user_wallets&userId=${searchedUser!.id}`);
      if (walletsResponse.success) {
        setUserWallets(walletsResponse.data?.wallets || []);
      }
    } catch (error: any) {
      console.error("Error managing wallet:", error);
      toast.error(error.message || "Erreur lors de la gestion du wallet");
    } finally {
      setManagingWallet(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
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
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Administration
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
          <h1 className="text-3xl font-bold mb-2">Panneau d'Administration</h1>
          <p className="text-muted-foreground">
            Gérez les frais, les paramètres et les utilisateurs de la plateforme
          </p>
        </div>

        <Tabs defaultValue="fees" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="fees">Paramètres & Frais</TabsTrigger>
            <TabsTrigger value="wallets">Gestion des Soldes</TabsTrigger>
          </TabsList>

          <TabsContent value="fees" className="mt-6">

        <div className="grid md:grid-cols-2 gap-6">
          {/* Frais de Création de Carte */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Frais de Création de Carte</CardTitle>
              <CardDescription>
                Configuration des frais appliqués lors de la création d'une nouvelle carte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {feeSettings
                .filter(s => s.setting_key.includes("card_creation"))
                .map(setting => (
                  <div key={setting.id} className="space-y-2">
                    <Label htmlFor={setting.setting_key}>
                      {getSettingLabel(setting.setting_key)}
                    </Label>
                    <div className="relative">
                      <Input
                        id={setting.setting_key}
                        type="number"
                        step={setting.currency === "PERCENT" ? "0.01" : "0.01"}
                        min="0"
                        value={setting.setting_value}
                        onChange={(e) => handleUpdateSetting(setting.id, parseFloat(e.target.value))}
                      />
                      {setting.currency && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          {getCurrencySymbol(setting.currency)}
                        </span>
                      )}
                    </div>
                    {setting.description && (
                      <p className="text-xs text-muted-foreground">{setting.description}</p>
                    )}
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Frais de Rechargement */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Frais de Rechargement</CardTitle>
              <CardDescription>
                Configuration des frais appliqués lors du rechargement d'une carte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {feeSettings
                .filter(s => s.setting_key.includes("card_reload"))
                .map(setting => (
                  <div key={setting.id} className="space-y-2">
                    <Label htmlFor={setting.setting_key}>
                      {getSettingLabel(setting.setting_key)}
                    </Label>
                    <div className="relative">
                      <Input
                        id={setting.setting_key}
                        type="number"
                        step={setting.currency === "PERCENT" ? "0.01" : "0.01"}
                        min="0"
                        value={setting.setting_value}
                        onChange={(e) => handleUpdateSetting(setting.id, parseFloat(e.target.value))}
                      />
                      {setting.currency && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          {getCurrencySymbol(setting.currency)}
                        </span>
                      )}
                    </div>
                    {setting.description && (
                      <p className="text-xs text-muted-foreground">{setting.description}</p>
                    )}
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Montants Minimums - Création */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Montants Minimums - Création</CardTitle>
              <CardDescription>
                Définir les montants minimums requis pour créer une carte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {feeSettings
                .filter(s => s.setting_key.includes("min_card_creation"))
                .map(setting => (
                  <div key={setting.id} className="space-y-2">
                    <Label htmlFor={setting.setting_key}>
                      {getSettingLabel(setting.setting_key)}
                    </Label>
                    <div className="relative">
                      <Input
                        id={setting.setting_key}
                        type="number"
                        step="0.01"
                        min="0"
                        value={setting.setting_value}
                        onChange={(e) => handleUpdateSetting(setting.id, parseFloat(e.target.value))}
                      />
                      {setting.currency && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          {getCurrencySymbol(setting.currency)}
                        </span>
                      )}
                    </div>
                    {setting.description && (
                      <p className="text-xs text-muted-foreground">{setting.description}</p>
                    )}
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Montants Minimums - Rechargement */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Montants Minimums - Rechargement</CardTitle>
              <CardDescription>
                Définir les montants minimums requis pour recharger une carte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {feeSettings
                .filter(s => s.setting_key.includes("min_card_reload"))
                .map(setting => (
                  <div key={setting.id} className="space-y-2">
                    <Label htmlFor={setting.setting_key}>
                      {getSettingLabel(setting.setting_key)}
                    </Label>
                    <div className="relative">
                      <Input
                        id={setting.setting_key}
                        type="number"
                        step="0.01"
                        min="0"
                        value={setting.setting_value}
                        onChange={(e) => handleUpdateSetting(setting.id, parseFloat(e.target.value))}
                      />
                      {setting.currency && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          {getCurrencySymbol(setting.currency)}
                        </span>
                      )}
                    </div>
                    {setting.description && (
                      <p className="text-xs text-muted-foreground">{setting.description}</p>
                    )}
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleSaveSettings}
            disabled={saving}
            className="bg-gradient-primary shadow-glow"
            size="lg"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </div>
          </TabsContent>

          <TabsContent value="wallets" className="mt-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Gestion des Soldes Utilisateurs
                </CardTitle>
                <CardDescription>
                  Recherchez un utilisateur et ajoutez ou retirez du solde de ses wallets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search User */}
                <div className="space-y-4">
                  <Label htmlFor="search-email">Rechercher un utilisateur par email</Label>
                  <div className="flex gap-2">
                    <Input
                      id="search-email"
                      type="email"
                      placeholder="utilisateur@email.com"
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearchUser()}
                    />
                    <Button
                      onClick={handleSearchUser}
                      disabled={loadingUser}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      {loadingUser ? "Recherche..." : "Rechercher"}
                    </Button>
                  </div>
                </div>

                {/* User Info & Wallets */}
                {searchedUser && (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Informations de l'utilisateur</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Nom:</span>{" "}
                          <span className="font-medium">{searchedUser.first_name} {searchedUser.last_name}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Email:</span>{" "}
                          <span className="font-medium">{searchedUser.email}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Téléphone:</span>{" "}
                          <span className="font-medium">{searchedUser.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold">Wallets</h3>
                      {userWallets.length === 0 ? (
                        <p className="text-muted-foreground text-sm">Aucun wallet trouvé</p>
                      ) : (
                        <div className="grid gap-4">
                          {userWallets.map((wallet) => (
                            <WalletManagementCard
                              key={wallet.id}
                              wallet={wallet}
                              onManage={handleManageWallet}
                              disabled={managingWallet}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

// Wallet Management Card Component
interface WalletManagementCardProps {
  wallet: UserWallet;
  onManage: (walletId: string, action: "add" | "subtract", amount: number, currency: string) => void;
  disabled: boolean;
}

const WalletManagementCard = ({ wallet, onManage, disabled }: WalletManagementCardProps) => {
  const [amount, setAmount] = useState("");

  const getCurrencySymbol = (currency: string): string => {
    switch (currency) {
      case "USD": return "$";
      case "XOF": return "FCFA";
      case "NGN": return "₦";
      default: return "";
    }
  };

  const handleAction = (action: "add" | "subtract") => {
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast.error("Veuillez entrer un montant valide");
      return;
    }
    onManage(wallet.id, action, amountValue, wallet.currency);
    setAmount("");
  };

  return (
    <Card className="border-border/50">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Solde {wallet.currency}</p>
              <p className="text-2xl font-bold">
                {parseFloat(wallet.balance.toString()).toFixed(2)} {getCurrencySymbol(wallet.currency)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`amount-${wallet.id}`}>Montant à ajouter/retirer</Label>
            <Input
              id={`amount-${wallet.id}`}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={disabled}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => handleAction("add")}
              disabled={disabled || !amount}
              className="flex-1"
              variant="default"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
            <Button
              onClick={() => handleAction("subtract")}
              disabled={disabled || !amount}
              className="flex-1"
              variant="destructive"
            >
              <Minus className="w-4 h-4 mr-2" />
              Retirer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Admin;
