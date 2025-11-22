import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Activity, RefreshCw, Clock, User, AlertCircle, Filter, Search } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface ApiLog {
  id: string;
  created_at: string;
  function_name: string;
  user_id: string | null;
  request_payload: any;
  response_data: any;
  status_code: number | null;
  duration_ms: number | null;
  error_message: string | null;
  ip_address: string | null;
}

const AdminApiLogs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ApiLog[]>([]);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  
  // Filtres
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [functionFilter, setFunctionFilter] = useState<string>("all");
  const [userSearch, setUserSearch] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    checkAdminStatus();
  }, [user, navigate]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error("Accès refusé. Vous n'êtes pas administrateur.");
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
      await loadLogs();
      subscribeToLogs();
    } catch (error: any) {
      console.error("Error checking admin status:", error);
      toast.error("Erreur lors de la vérification des permissions");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("strowallet_api_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      console.error("Error loading logs:", error);
      toast.error("Erreur lors du chargement des logs");
    }
  };

  // Appliquer les filtres côté client
  useEffect(() => {
    let filtered = [...logs];

    // Filtre par statut
    if (statusFilter !== "all") {
      if (statusFilter === "success") {
        filtered = filtered.filter(log => log.status_code && log.status_code >= 200 && log.status_code < 300);
      } else if (statusFilter === "error") {
        filtered = filtered.filter(log => !log.status_code || log.status_code >= 400);
      }
    }

    // Filtre par fonction
    if (functionFilter !== "all") {
      filtered = filtered.filter(log => log.function_name === functionFilter);
    }

    // Recherche par utilisateur
    if (userSearch.trim()) {
      filtered = filtered.filter(log => 
        log.user_id?.toLowerCase().includes(userSearch.toLowerCase())
      );
    }

    // Filtre par période
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter(log => new Date(log.created_at) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(log => new Date(log.created_at) <= toDate);
    }

    setFilteredLogs(filtered);
  }, [logs, statusFilter, functionFilter, userSearch, dateFrom, dateTo]);

  const subscribeToLogs = () => {
    const channel = supabase
      .channel('api-logs-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'strowallet_api_logs'
        },
        (payload) => {
          console.log('New log received:', payload);
          setLogs(prev => [payload.new as ApiLog, ...prev.slice(0, 199)]);
          toast.success("Nouveau log reçu", {
            description: `${(payload.new as ApiLog).function_name} - ${(payload.new as ApiLog).status_code || 'N/A'}`
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const resetFilters = () => {
    setStatusFilter("all");
    setFunctionFilter("all");
    setUserSearch("");
    setDateFrom("");
    setDateTo("");
  };

  // Obtenir les fonctions uniques pour le filtre
  const uniqueFunctions = Array.from(new Set(logs.map(log => log.function_name)));

  const getStatusBadge = (statusCode: number | null) => {
    if (!statusCode) return <Badge variant="secondary">N/A</Badge>;
    if (statusCode >= 200 && statusCode < 300) return <Badge variant="default" className="bg-green-500">✓ {statusCode}</Badge>;
    if (statusCode >= 400 && statusCode < 500) return <Badge variant="destructive">⚠ {statusCode}</Badge>;
    if (statusCode >= 500) return <Badge variant="destructive">✗ {statusCode}</Badge>;
    return <Badge variant="secondary">{statusCode}</Badge>;
  };

  const formatJson = (data: any) => {
    if (!data) return "N/A";
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin/settings">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold">Logs API Strowallet</span>
            </div>
          </div>

          <Button variant="outline" onClick={loadLogs}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Debug Mode - Logs en Temps Réel</h1>
          <p className="text-muted-foreground">
            Surveillance en temps réel des requêtes API Strowallet avec payload et réponses complètes
          </p>
          <div className="mt-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-muted-foreground">
              {filteredLogs.length} / {logs.length} logs - Mise à jour automatique activée
            </span>
          </div>
        </div>

        {/* Filtres */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                <CardTitle>Filtres de Recherche</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Réinitialiser
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Filtre Statut */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Statut</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="success">✓ Succès (2xx)</SelectItem>
                    <SelectItem value="error">✗ Erreurs (4xx, 5xx)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtre Fonction */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Fonction</label>
                <Select value={functionFilter} onValueChange={setFunctionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les fonctions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les fonctions</SelectItem>
                    {uniqueFunctions.map(func => (
                      <SelectItem key={func} value={func}>{func}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Recherche Utilisateur */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Utilisateur (ID)</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par ID..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Date de début */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Date de début</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              {/* Date de fin */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Date de fin</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {filteredLogs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {logs.length === 0 ? "Aucun log disponible" : "Aucun log ne correspond aux filtres"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredLogs.map((log) => (
              <Card key={log.id} className="border-border/50 hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold">
                        {log.function_name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: fr })}
                        </span>
                        {log.duration_ms && (
                          <span className="flex items-center gap-1">
                            ⚡ {log.duration_ms}ms
                          </span>
                        )}
                        {log.user_id && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {log.user_id.substring(0, 8)}...
                          </span>
                        )}
                        {log.ip_address && (
                          <span className="text-xs">
                            IP: {log.ip_address}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(log.status_code)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      >
                        {expandedLog === log.id ? "Masquer" : "Détails"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {expandedLog === log.id && (
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {log.error_message && (
                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                            <div className="flex-1">
                              <p className="font-semibold text-destructive mb-1">Erreur</p>
                              <p className="text-sm text-muted-foreground">{log.error_message}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          📤 Request Payload
                        </h4>
                        <ScrollArea className="h-64 w-full rounded-lg border bg-muted/30 p-4">
                          <pre className="text-xs font-mono">
                            {formatJson(log.request_payload)}
                          </pre>
                        </ScrollArea>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          📥 Response Data
                        </h4>
                        <ScrollArea className="h-64 w-full rounded-lg border bg-muted/30 p-4">
                          <pre className="text-xs font-mono">
                            {formatJson(log.response_data)}
                          </pre>
                        </ScrollArea>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-semibold">Timestamp:</span>
                          <p className="text-muted-foreground mt-1">
                            {new Date(log.created_at).toLocaleString('fr-FR')}
                          </p>
                        </div>
                        <div>
                          <span className="font-semibold">ID Log:</span>
                          <p className="text-muted-foreground mt-1 font-mono text-xs">
                            {log.id}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminApiLogs;
