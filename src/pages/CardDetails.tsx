import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CardPreview from "@/components/CardPreview";
import { ArrowLeft, Lock, Unlock, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CardData {
  id: string;
  card_id: string;
  card_number: string | null;
  card_type: string | null;
  name_on_card: string | null;
  balance: number;
  currency: string | null;
  status: string;
  expiry_month: string | null;
  expiry_year: string | null;
  created_at: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string | null;
  merchant_name: string | null;
  description: string | null;
  status: string | null;
  created_at: string;
}

const CardDetails = () => {
  const { cardId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [card, setCard] = useState<CardData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!user || !cardId) {
      navigate("/auth");
      return;
    }

    fetchCardDetails();
    fetchTransactions();
  }, [user, cardId, navigate]);

  const fetchCardDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("strowallet_cards")
        .select("*")
        .eq("card_id", cardId)
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;
      setCard(data);
    } catch (error) {
      console.error("Error fetching card details:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails de la carte",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("card_transactions")
        .select("*")
        .eq("card_id", cardId)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const handleBlockUnblock = async (action: "block" | "unblock") => {
    if (!card) return;

    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "block-strowallet-card",
        {
          body: { card_id: cardId, action },
        }
      );

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Succès",
          description: data.message,
        });
        fetchCardDetails();
      } else {
        throw new Error(data.message || "Opération échouée");
      }
    } catch (error: any) {
      console.error("Error blocking/unblocking card:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'effectuer l'opération",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "default";
      case "blocked":
        return "destructive";
      case "inactive":
        return "secondary";
      default:
        return "outline";
    }
  };

  const formatAmount = (amount: number, currency: string | null) => {
    const formatter = new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const formatted = formatter.format(amount);
    
    switch (currency) {
      case "USD":
        return `$${formatted}`;
      case "NGN":
        return `₦${formatted}`;
      case "XOF":
        return `${formatted} F`;
      default:
        return formatted;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/cards")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux cartes
        </Button>
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Carte introuvable</p>
        </Card>
      </div>
    );
  }

  const cardPreviewData = {
    card_type: card.card_type || "visa",
    last4: card.card_number?.slice(-4) || "****",
    card_number: card.card_number,
    balance: card.balance,
    currency: card.currency || "USD",
    card_status: card.status,
    name_on_card: card.name_on_card || "CARD HOLDER",
    expiry: card.expiry_month && card.expiry_year 
      ? `${card.expiry_month}/${card.expiry_year}` 
      : "--/--",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/cards")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux cartes
        </Button>
        <Badge variant={getStatusBadgeVariant(card.status)}>
          {card.status.toUpperCase()}
        </Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Détails de la carte</h2>
          <div className="flex justify-center mb-6">
            <CardPreview 
              brand={cardPreviewData.card_type}
              nameOnCard={cardPreviewData.name_on_card}
              last4={cardPreviewData.last4}
              expiry={cardPreviewData.expiry}
              balance={cardPreviewData.balance}
              currency={cardPreviewData.currency}
              cardStatus={cardPreviewData.card_status}
              sandbox={false}
            />
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID Carte:</span>
              <span className="font-mono">{card.card_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Créée le:</span>
              <span>{formatDate(card.created_at)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-y-3">
            {card.status === "active" ? (
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => handleBlockUnblock("block")}
                disabled={actionLoading}
              >
                <Lock className="w-4 h-4 mr-2" />
                Bloquer la carte
              </Button>
            ) : card.status === "blocked" ? (
              <Button
                variant="default"
                className="w-full"
                onClick={() => handleBlockUnblock("unblock")}
                disabled={actionLoading}
              >
                <Unlock className="w-4 h-4 mr-2" />
                Débloquer la carte
              </Button>
            ) : null}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                fetchCardDetails();
                fetchTransactions();
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Historique des transactions</h2>
        {transactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Aucune transaction pour le moment
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Marchand</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-sm">
                    {new Date(tx.created_at).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{tx.type}</Badge>
                  </TableCell>
                  <TableCell>{tx.merchant_name || "-"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {tx.description || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        tx.status === "completed" ? "default" : "secondary"
                      }
                    >
                      {tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatAmount(tx.amount, tx.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default CardDetails;
