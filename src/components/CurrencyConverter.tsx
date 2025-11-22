import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// Taux de change USD vers XOF (FCFA)
// Note: En production, utiliser une API comme exchangerate-api.com pour les taux en temps réel
const USD_TO_XOF_RATE = 600; // 1 USD = ~600 FCFA

const CurrencyConverter = () => {
  const [usdAmount, setUsdAmount] = useState("");
  const [xofAmount, setXofAmount] = useState("");
  const [lastEdited, setLastEdited] = useState<"usd" | "xof">("usd");

  const handleUsdChange = (value: string) => {
    setUsdAmount(value);
    setLastEdited("usd");
    
    if (value === "") {
      setXofAmount("");
      return;
    }
    
    const usd = parseFloat(value);
    if (!isNaN(usd)) {
      const xof = (usd * USD_TO_XOF_RATE).toFixed(2);
      setXofAmount(xof);
    }
  };

  const handleXofChange = (value: string) => {
    setXofAmount(value);
    setLastEdited("xof");
    
    if (value === "") {
      setUsdAmount("");
      return;
    }
    
    const xof = parseFloat(value);
    if (!isNaN(xof)) {
      const usd = (xof / USD_TO_XOF_RATE).toFixed(2);
      setUsdAmount(usd);
    }
  };

  const swapAmounts = () => {
    const tempUsd = usdAmount;
    const tempXof = xofAmount;
    setUsdAmount(tempXof);
    setXofAmount(tempUsd);
    setLastEdited(lastEdited === "usd" ? "xof" : "usd");
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5 text-primary" />
          Convertisseur de Devises
        </CardTitle>
        <CardDescription>
          Convertissez instantanément entre USD et FCFA (XOF)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="usd-input">Dollar Américain (USD)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              $
            </span>
            <Input
              id="usd-input"
              type="number"
              step="0.01"
              min="0"
              value={usdAmount}
              onChange={(e) => handleUsdChange(e.target.value)}
              placeholder="0.00"
              className="pl-8"
            />
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={swapAmounts}
            className="rounded-full hover:bg-primary/10 hover:text-primary"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="xof-input">Franc CFA (FCFA / XOF)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              F
            </span>
            <Input
              id="xof-input"
              type="number"
              step="0.01"
              min="0"
              value={xofAmount}
              onChange={(e) => handleXofChange(e.target.value)}
              placeholder="0.00"
              className="pl-8"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            Taux de change: 1 USD = {USD_TO_XOF_RATE} FCFA
          </p>
          <p className="text-xs text-muted-foreground text-center mt-1">
            Les taux peuvent varier selon les marchés
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrencyConverter;
