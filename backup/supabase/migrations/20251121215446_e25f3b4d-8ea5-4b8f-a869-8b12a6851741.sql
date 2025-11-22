-- Create nowpayments_transactions table to track USDT deposits
CREATE TABLE IF NOT EXISTS public.nowpayments_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id),
  transfer_id TEXT NOT NULL UNIQUE,
  sub_partner_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usdttrc20',
  status TEXT NOT NULL DEFAULT 'CREATED',
  type TEXT NOT NULL CHECK (type IN ('deposit', 'writeoff')),
  raw_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.nowpayments_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own nowpayments transactions"
  ON public.nowpayments_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nowpayments transactions"
  ON public.nowpayments_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_nowpayments_transactions_updated_at
  BEFORE UPDATE ON public.nowpayments_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster queries
CREATE INDEX idx_nowpayments_transactions_user_id ON public.nowpayments_transactions(user_id);
CREATE INDEX idx_nowpayments_transactions_transfer_id ON public.nowpayments_transactions(transfer_id);
CREATE INDEX idx_nowpayments_transactions_status ON public.nowpayments_transactions(status);