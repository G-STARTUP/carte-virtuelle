-- Create table for Strowallet API logs
CREATE TABLE IF NOT EXISTS public.strowallet_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  function_name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  request_payload JSONB,
  response_data JSONB,
  status_code INTEGER,
  duration_ms INTEGER,
  error_message TEXT,
  ip_address TEXT
);

-- Create index for faster queries
CREATE INDEX idx_strowallet_api_logs_created_at ON public.strowallet_api_logs(created_at DESC);
CREATE INDEX idx_strowallet_api_logs_function ON public.strowallet_api_logs(function_name);
CREATE INDEX idx_strowallet_api_logs_user ON public.strowallet_api_logs(user_id);

-- Enable RLS
ALTER TABLE public.strowallet_api_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view logs
CREATE POLICY "Admins can view all API logs"
ON public.strowallet_api_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Policy: System can insert logs (service role)
CREATE POLICY "System can insert API logs"
ON public.strowallet_api_logs
FOR INSERT
WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.strowallet_api_logs;