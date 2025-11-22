-- Create moneroo_payments table to track payment transactions
CREATE TABLE public.moneroo_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  payment_id TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  checkout_url TEXT,
  return_url TEXT NOT NULL,
  metadata JSONB,
  raw_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.moneroo_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own moneroo payments"
  ON public.moneroo_payments
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own moneroo payments"
  ON public.moneroo_payments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_moneroo_payments_user_id ON public.moneroo_payments(user_id);
CREATE INDEX idx_moneroo_payments_payment_id ON public.moneroo_payments(payment_id);
CREATE INDEX idx_moneroo_payments_status ON public.moneroo_payments(status);

-- Add trigger for updated_at
CREATE TRIGGER update_moneroo_payments_updated_at
  BEFORE UPDATE ON public.moneroo_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();