-- Create enum for card status
CREATE TYPE public.card_status_enum AS ENUM ('active', 'frozen', 'inactive', 'blocked');

-- Create strowallet_customers table
CREATE TABLE public.strowallet_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  customer_id TEXT NOT NULL UNIQUE,
  customer_email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone_number TEXT,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create strowallet_cards table
CREATE TABLE public.strowallet_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  customer_id TEXT REFERENCES public.strowallet_customers(customer_id) ON DELETE CASCADE,
  card_id TEXT NOT NULL UNIQUE,
  name_on_card TEXT,
  card_type TEXT DEFAULT 'visa',
  balance NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
  currency TEXT DEFAULT 'USD',
  status public.card_status_enum DEFAULT 'active' NOT NULL,
  card_number TEXT, -- Last 4 digits only for display
  expiry_month TEXT,
  expiry_year TEXT,
  cvv TEXT, -- Encrypted or server-side only
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT positive_card_balance CHECK (balance >= 0)
);

-- Create strowallet_webhook_events table
CREATE TABLE public.strowallet_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  card_id TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  signature_valid BOOLEAN DEFAULT false NOT NULL,
  processed BOOLEAN DEFAULT false NOT NULL,
  inserted_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create card transactions table
CREATE TABLE public.card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id TEXT REFERENCES public.strowallet_cards(card_id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  transaction_id TEXT UNIQUE,
  amount NUMERIC(15, 2) NOT NULL,
  type TEXT NOT NULL, -- 'charge', 'refund', 'fund', etc.
  status TEXT,
  description TEXT,
  merchant_name TEXT,
  merchant_category TEXT,
  currency TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.strowallet_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strowallet_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strowallet_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for strowallet_customers
CREATE POLICY "Users can view their own strowallet customers"
  ON public.strowallet_customers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own strowallet customers"
  ON public.strowallet_customers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own strowallet customers"
  ON public.strowallet_customers FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for strowallet_cards
CREATE POLICY "Users can view their own cards"
  ON public.strowallet_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own card transactions"
  ON public.card_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Webhook events - read-only for users
CREATE POLICY "Users can view their own webhook events"
  ON public.strowallet_webhook_events FOR SELECT
  USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_strowallet_customers_updated_at
  BEFORE UPDATE ON public.strowallet_customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_strowallet_cards_updated_at
  BEFORE UPDATE ON public.strowallet_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_strowallet_customers_user_id ON public.strowallet_customers(user_id);
CREATE INDEX idx_strowallet_customers_customer_id ON public.strowallet_customers(customer_id);
CREATE INDEX idx_strowallet_cards_user_id ON public.strowallet_cards(user_id);
CREATE INDEX idx_strowallet_cards_card_id ON public.strowallet_cards(card_id);
CREATE INDEX idx_strowallet_cards_customer_id ON public.strowallet_cards(customer_id);
CREATE INDEX idx_webhook_events_event_id ON public.strowallet_webhook_events(event_id);
CREATE INDEX idx_webhook_events_card_id ON public.strowallet_webhook_events(card_id);
CREATE INDEX idx_card_transactions_card_id ON public.card_transactions(card_id);
CREATE INDEX idx_card_transactions_user_id ON public.card_transactions(user_id);