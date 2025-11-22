import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

interface CardPreviewProps {
  brand?: string;
  nameOnCard?: string;
  last4?: string;
  expiry?: string;
  balance?: number;
  currency?: string;
  cardStatus?: string;
  cvv?: string;
  sandbox?: boolean;
  onFund?: () => void;
  onViewDetails?: () => void;
}

const getBrandStyle = (brand?: string) => {
  switch (brand?.toLowerCase()) {
    case 'visa':
      return {
        background: 'linear-gradient(135deg, #1a4dd9, #4779ff)',
        color: '#fff',
      };
    case 'mastercard':
      return {
        background: 'linear-gradient(135deg, #ff8800, #ff2d55)',
        color: '#fff',
      };
    default:
      return {
        background: 'linear-gradient(135deg, #2f2f2f, #555)',
        color: '#eee',
      };
  }
};

const getBrandLogo = (brand?: string) => {
  const brandLower = brand?.toLowerCase() || 'generic';
  return (
    <div className="w-12 h-8 bg-white/20 rounded backdrop-blur-sm flex items-center justify-center">
      <span className="text-xs font-bold uppercase opacity-80">{brandLower}</span>
    </div>
  );
};

export default function CardPreview({ 
  brand = 'visa',
  nameOnCard = 'CARD HOLDER',
  last4 = '****',
  expiry = '--/--',
  balance = 0,
  currency = 'USD',
  cardStatus = 'active',
  cvv,
  sandbox = false, 
  onFund, 
  onViewDetails 
}: CardPreviewProps) {
  const [showCVV, setShowCVV] = useState(false);

  const style = getBrandStyle(brand);

  return (
    <div
      className="relative rounded-2xl p-6 w-full max-w-[340px] shadow-glow"
      style={{
        background: style.background,
        color: style.color,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Sandbox Badge */}
      {sandbox && (
        <span className="absolute top-2 right-3 bg-yellow-400 text-gray-900 px-2 py-1 rounded-md text-xs font-semibold">
          SANDBOX
        </span>
      )}

      {/* Card Header */}
      <div className="flex justify-between items-start mb-8">
        {getBrandLogo(brand)}
        <div className="text-right text-sm opacity-90">
          <div className="font-medium capitalize">{cardStatus}</div>
          <div className="font-bold mt-1">
            {currency} {Number(balance).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Card Number */}
      <div className="text-2xl tracking-[0.2em] font-mono mb-6">
        •••• •••• •••• {last4}
      </div>

      {/* Card Details */}
      <div className="flex justify-between items-end text-sm opacity-95">
        <div>
          <div className="text-xs uppercase opacity-75 mb-1">Name</div>
          <div className="font-medium">{nameOnCard}</div>
        </div>
        <div>
          <div className="text-xs uppercase opacity-75 mb-1">Expiry</div>
          <div className="font-medium font-mono">{expiry}</div>
        </div>
        {cvv && (
          <div>
            <div className="text-xs uppercase opacity-75 mb-1">CVV</div>
            <div className="flex items-center gap-2">
              <span className="font-medium font-mono">
                {showCVV ? cvv : '•••'}
              </span>
              <button
                onClick={() => setShowCVV(!showCVV)}
                className="opacity-75 hover:opacity-100 transition-opacity"
              >
                {showCVV ? (
                  <EyeOff className="w-3 h-3" />
                ) : (
                  <Eye className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {(onFund || onViewDetails) && (
        <div className="mt-6 space-y-2">
          {onFund && (
            <Button
              size="sm"
              onClick={onFund}
              className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
            >
              Recharger cette carte
            </Button>
          )}
          {onViewDetails && (
            <Button
              size="sm"
              variant="outline"
              onClick={onViewDetails}
              className="w-full bg-white/10 hover:bg-white/20 text-white border-white/30"
            >
              Voir détails
            </Button>
          )}
        </div>
      )}

      {/* Decorative circle */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
    </div>
  );
}
