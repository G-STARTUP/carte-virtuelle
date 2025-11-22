import React, { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface BalanceData {
  success: boolean;
  balance: number;
  currency: string;
  message: string;
}

const AdminOverview: React.FC = () => {
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBalance = async () => {
    setLoading(true);
    try {
      const response = await apiGet('/admin?action=stats');
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch stats');
      }
      
      // Le backend PHP retourne les stats, on simule le format Strowallet
      setBalanceData({
        success: true,
        balance: response.data?.total_balance || 0,
        currency: 'USD',
        message: 'Balance retrieved successfully'
      });
    } catch (error: any) {
      console.error('Error fetching balance:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer le solde",
        variant: "destructive",
      });
      setBalanceData({
        success: false,
        balance: 0,
        currency: 'USD',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Administration - Vue d'ensemble</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Solde Strowallet
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {loading ? (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Chargement...</span>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    ${formatBalance(balanceData?.balance || 0)}
                  </div>
                  {balanceData && (
                    <Badge variant={balanceData.success ? "default" : "destructive"}>
                      {balanceData.message}
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchBalance}
                    className="mt-2"
                  >
                    <RefreshCw className="h-3 w-3 mr-2" />
                    Actualiser
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-muted-foreground text-sm max-w-prose">
        Ajoutez ici d'autres métriques globales: volume de cartes, utilisateurs actifs, incidents.
      </p>
    </div>
  );
};

export default AdminOverview;
