import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContextPHP";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPut } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Key, Save, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ApiConfig {
  id: number;
  config_key: string;
  config_value: string;
  config_value_masked: string;
  description: string;
  is_sensitive: number;
}

const AdminApiConfig = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configs, setConfigs] = useState<ApiConfig[]>([]);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (user.role !== 'admin') {
      toast.error("Accès refusé");
      navigate("/dashboard");
      return;
    }

    loadConfigs();
  }, [user, navigate]);

  const loadConfigs = async () => {
    try {
      const response = await apiGet('/admin?action=api_config');
      if (!response.success) throw new Error(response.error);
      
      setConfigs(response.data?.configs || []);
      
      // Initialiser les valeurs éditées avec les valeurs actuelles
      const initialValues: Record<string, string> = {};
      response.data?.configs.forEach((config: ApiConfig) => {
        initialValues[config.config_key] = config.config_value;
      });
      setEditedValues(initialValues);
    } catch (error: any) {
      console.error("Error loading configs:", error);
      toast.error("Erreur lors du chargement de la configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (configKey: string) => {
    setSaving(true);
    try {
      const response = await apiPut('/admin?action=api_config', {
        config_key: configKey,
        config_value: editedValues[configKey]
      });

      if (!response.success) {
        throw new Error(response.message || response.error);
      }

      toast.success("Configuration mise à jour");
      await loadConfigs();
    } catch (error: any) {
      console.error("Error saving config:", error);
      toast.error(error.message || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const toggleShowSensitive = (key: string) => {
    setShowSensitive(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getConfigIcon = (key: string) => {
    if (key.includes('STROWALLET')) return '💳';
    if (key.includes('MONEROO')) return '📱';
    if (key.includes('NOWPAYMENTS')) return '₿';
    return '🔑';
  };

  const getConfigColor = (key: string) => {
    if (key.includes('STROWALLET')) return 'from-blue-500 to-cyan-500';
    if (key.includes('MONEROO')) return 'from-purple-500 to-pink-500';
    if (key.includes('NOWPAYMENTS')) return 'from-orange-500 to-amber-500';
    return 'from-gray-500 to-slate-500';
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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
          <Key className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Configuration API</h1>
          <p className="text-muted-foreground">Gérez vos clés API et webhooks</p>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important :</strong> Les clés API sont sensibles. Ne les partagez jamais et assurez-vous qu'elles proviennent de sources officielles.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {/* Strowallet */}
        <Card className="glass border-blue-500/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getConfigColor('STROWALLET')} flex items-center justify-center text-2xl shadow-lg`}>
                💳
              </div>
              <div>
                <CardTitle>Strowallet API</CardTitle>
                <CardDescription>Configuration pour les cartes virtuelles</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {configs.filter(c => c.config_key.includes('STROWALLET')).map((config) => (
              <div key={config.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={config.config_key} className="flex items-center gap-2">
                    {config.description || config.config_key}
                    {config.is_sensitive === 1 && (
                      <Badge variant="secondary" className="text-xs">Sensible</Badge>
                    )}
                  </Label>
                  {config.config_value && (
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                      Configuré
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id={config.config_key}
                      type={config.is_sensitive && !showSensitive[config.config_key] ? "password" : "text"}
                      value={editedValues[config.config_key] || ''}
                      onChange={(e) => setEditedValues(prev => ({
                        ...prev,
                        [config.config_key]: e.target.value
                      }))}
                      placeholder={`Entrez ${config.description}`}
                      className="pr-10"
                    />
                    {config.is_sensitive === 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => toggleShowSensitive(config.config_key)}
                      >
                        {showSensitive[config.config_key] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  <Button
                    onClick={() => handleSave(config.config_key)}
                    disabled={saving || editedValues[config.config_key] === config.config_value}
                    className="bg-gradient-primary shadow-glow"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Moneroo */}
        <Card className="glass border-purple-500/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getConfigColor('MONEROO')} flex items-center justify-center text-2xl shadow-lg`}>
                📱
              </div>
              <div>
                <CardTitle>Moneroo API</CardTitle>
                <CardDescription>Configuration pour Mobile Money (XOF)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {configs.filter(c => c.config_key.includes('MONEROO')).map((config) => (
              <div key={config.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={config.config_key} className="flex items-center gap-2">
                    {config.description || config.config_key}
                    {config.is_sensitive === 1 && (
                      <Badge variant="secondary" className="text-xs">Sensible</Badge>
                    )}
                  </Label>
                  {config.config_value && (
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                      Configuré
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id={config.config_key}
                      type={config.is_sensitive && !showSensitive[config.config_key] ? "password" : "text"}
                      value={editedValues[config.config_key] || ''}
                      onChange={(e) => setEditedValues(prev => ({
                        ...prev,
                        [config.config_key]: e.target.value
                      }))}
                      placeholder={`Entrez ${config.description}`}
                      className="pr-10"
                    />
                    {config.is_sensitive === 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => toggleShowSensitive(config.config_key)}
                      >
                        {showSensitive[config.config_key] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  <Button
                    onClick={() => handleSave(config.config_key)}
                    disabled={saving || editedValues[config.config_key] === config.config_value}
                    className="bg-gradient-primary shadow-glow"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* NowPayments */}
        <Card className="glass border-orange-500/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getConfigColor('NOWPAYMENTS')} flex items-center justify-center text-2xl shadow-lg`}>
                ₿
              </div>
              <div>
                <CardTitle>NowPayments API</CardTitle>
                <CardDescription>Configuration pour paiements crypto (USD)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {configs.filter(c => c.config_key.includes('NOWPAYMENTS')).map((config) => (
              <div key={config.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={config.config_key} className="flex items-center gap-2">
                    {config.description || config.config_key}
                    {config.is_sensitive === 1 && (
                      <Badge variant="secondary" className="text-xs">Sensible</Badge>
                    )}
                  </Label>
                  {config.config_value && (
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                      Configuré
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id={config.config_key}
                      type={config.is_sensitive && !showSensitive[config.config_key] ? "password" : "text"}
                      value={editedValues[config.config_key] || ''}
                      onChange={(e) => setEditedValues(prev => ({
                        ...prev,
                        [config.config_key]: e.target.value
                      }))}
                      placeholder={`Entrez ${config.description}`}
                      className="pr-10"
                    />
                    {config.is_sensitive === 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => toggleShowSensitive(config.config_key)}
                      >
                        {showSensitive[config.config_key] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  <Button
                    onClick={() => handleSave(config.config_key)}
                    disabled={saving || editedValues[config.config_key] === config.config_value}
                    className="bg-gradient-primary shadow-glow"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Autres configurations */}
        {configs.filter(c => !c.config_key.includes('STROWALLET') && !c.config_key.includes('MONEROO') && !c.config_key.includes('NOWPAYMENTS')).length > 0 && (
          <Card className="glass">
            <CardHeader>
              <CardTitle>Autres configurations</CardTitle>
              <CardDescription>Paramètres généraux de l'application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {configs.filter(c => !c.config_key.includes('STROWALLET') && !c.config_key.includes('MONEROO') && !c.config_key.includes('NOWPAYMENTS')).map((config) => (
                <div key={config.id} className="space-y-2">
                  <Label htmlFor={config.config_key}>
                    {config.description || config.config_key}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id={config.config_key}
                      type="text"
                      value={editedValues[config.config_key] || ''}
                      onChange={(e) => setEditedValues(prev => ({
                        ...prev,
                        [config.config_key]: e.target.value
                      }))}
                      placeholder={`Entrez ${config.description}`}
                    />
                    <Button
                      onClick={() => handleSave(config.config_key)}
                      disabled={saving || editedValues[config.config_key] === config.config_value}
                      className="bg-gradient-primary shadow-glow"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Sauvegarder
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminApiConfig;
