import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContextPHP";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Search, Plus, Minus, Wallet } from "lucide-react";
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

const AdminSettings = () => {
  const { user } = useAuth();
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

  // API test states
  const [testingApi, setTestingApi] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    checkAdminStatus();
  }, [user, navigate]);

  const checkAdminStatus = async () => {
    try {
      // Le rôle est déjà vérifié dans AuthContextPHP
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

      for (const update of updates) {
        const { error } = await supabase
          .from("fees_settings")
          .update({ setting_value: update.setting_value })
          .eq("id", update.id);

        if (error) throw error;
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
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", searchEmail.trim())
        .maybeSingle();

      if (error) throw error;

      if (!profile) {
        toast.error("Utilisateur introuvable");
        setSearchedUser(null);
        setUserWallets([]);
        return;
      }

      setSearchedUser(profile);

      // Load user wallets
      const { data: wallets, error: walletsError } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", profile.id)
        .order("currency");

      if (walletsError) throw walletsError;

      setUserWallets(wallets || []);
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

  const handleTestStrowalletConnection = async () => {
    setTestingApi(true);
    setApiTestResult(null);
    
    try {
      const response = await apiGet('/admin?action=test_strowallet');

      setApiTestResult(response.data || response);
      
      if (response.success) {
        toast.success(response.data?.message || 'Connexion réussie');
      } else {
        toast.error(response.message || 'Connexion échouée');
      }
    } catch (error: any) {
      console.error("Error testing Strowallet connection:", error);
      toast.error("Erreur lors du test de connexion");
      setApiTestResult({
        success: false,
        error: error.message,
        status: 'error'
      });
    } finally {
      setTestingApi(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Paramètres & Gestion</h1>
        <p className="text-muted-foreground">
          Gérez les frais, les paramètres et les soldes utilisateurs de la plateforme
        </p>
      </div>

      <Tabs defaultValue="fees" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="fees">Paramètres & Frais</TabsTrigger>
          <TabsTrigger value="wallets">Gestion des Soldes</TabsTrigger>
          <TabsTrigger value="api-test">Test API</TabsTrigger>
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

        <TabsContent value="api-test" className="mt-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Test de Connexion Strowallet</CardTitle>
              <CardDescription>
                Vérifiez que vos clés API Strowallet sont correctement configurées et fonctionnelles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <Button
                  onClick={handleTestStrowalletConnection}
                  disabled={testingApi}
                  size="lg"
                >
                  {testingApi ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                      Test en cours...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Tester la connexion
                    </>
                  )}
                </Button>
              </div>

              {apiTestResult && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg border ${
                    apiTestResult.success 
                      ? 'bg-green-500/10 border-green-500/20' 
                      : 'bg-destructive/10 border-destructive/20'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${
                        apiTestResult.success ? 'bg-green-500' : 'bg-destructive'
                      }`}></div>
                      <h3 className="font-semibold">{apiTestResult.message}</h3>
                    </div>
                    
                    {apiTestResult.tests && apiTestResult.tests.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-medium">Résultats des tests:</h4>
                        {apiTestResult.tests.map((test: any, index: number) => (
                          <div key={index} className="text-sm p-3 bg-background/50 rounded border border-border/30">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{test.test}</span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                test.success 
                                  ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                                  : 'bg-destructive/20 text-destructive'
                              }`}>
                                {test.success ? '✓ Succès' : '✗ Échec'}
                              </span>
                            </div>
                            <div className="text-muted-foreground space-y-1">
                              <div>Variante: {test.key_variant}</div>
                              {test.status && <div>Status HTTP: {test.status}</div>}
                              {test.message && <div>Message: {test.message}</div>}
                              {test.balance !== undefined && (
                                <div className="text-primary font-medium">
                                  Solde Strowallet: {test.balance} USD
                                </div>
                              )}
                              {test.error && (
                                <div className="text-destructive">Erreur: {test.error}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {apiTestResult.recommendations && apiTestResult.recommendations.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-medium">Recommandations:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {apiTestResult.recommendations.map((rec: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
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

export default AdminSettings;
