-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policy for user_roles: users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS policy for user_roles: only admins can insert roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create fees_settings table for admin configuration
CREATE TABLE public.fees_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value NUMERIC NOT NULL,
    description TEXT,
    currency TEXT DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on fees_settings
ALTER TABLE public.fees_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for fees_settings
CREATE POLICY "Everyone can view fees settings"
ON public.fees_settings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage fees settings"
ON public.fees_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default fees settings
INSERT INTO public.fees_settings (setting_key, setting_value, description, currency) VALUES
    ('card_creation_fixed_fee_usd', 2.00, 'Frais fixe de création de carte en USD', 'USD'),
    ('card_creation_percent_fee', 2.5, 'Frais en pourcentage pour création de carte', 'PERCENT'),
    ('card_creation_fixed_fee_xof', 1000.00, 'Frais fixe de création de carte en XOF', 'XOF'),
    ('card_reload_fixed_fee_usd', 1.00, 'Frais fixe de rechargement en USD', 'USD'),
    ('card_reload_percent_fee', 1.5, 'Frais en pourcentage pour rechargement', 'PERCENT'),
    ('card_reload_fixed_fee_xof', 500.00, 'Frais fixe de rechargement en XOF', 'XOF'),
    ('min_card_creation_usd', 10.00, 'Montant minimum pour créer une carte en USD', 'USD'),
    ('min_card_creation_xof', 5000.00, 'Montant minimum pour créer une carte en XOF', 'XOF'),
    ('min_card_reload_usd', 5.00, 'Montant minimum pour recharger en USD', 'USD'),
    ('min_card_reload_xof', 2500.00, 'Montant minimum pour recharger en XOF', 'XOF');

-- Create trigger for updated_at
CREATE TRIGGER update_fees_settings_updated_at
BEFORE UPDATE ON public.fees_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();