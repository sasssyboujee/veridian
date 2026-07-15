-- RWA Escrow Platform Schema Migration
-- Run against your PostgreSQL database

-- Assets table: Tracks tokenized real-world assets
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  token_address TEXT,
  spv_entity TEXT NOT NULL,
  jurisdiction TEXT NOT NULL DEFAULT 'US',
  asset_type TEXT NOT NULL DEFAULT 'equipment',
  total_token_supply NUMERIC(78, 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'frozen', 'retired')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Billing cycles table: Defines revenue periods for yield calculation
CREATE TABLE IF NOT EXISTS public.billing_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'processing', 'finalized')),
  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Telemetry logs: IIoT sensor data from physical assets
CREATE TABLE IF NOT EXISTS public.telemetry_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  operating_hours NUMERIC(10, 2) NOT NULL DEFAULT 0,
  utilization_rate NUMERIC(5, 4) NOT NULL DEFAULT 0 CHECK (utilization_rate >= 0 AND utilization_rate <= 1),
  power_consumption_kwh NUMERIC(10, 2),
  temperature_celsius NUMERIC(6, 2),
  tpm_signature TEXT NOT NULL,
  tpm_public_key TEXT,
  raw_payload JSONB NOT NULL DEFAULT '{}',
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Yield calculations: Computed yields per billing cycle
CREATE TABLE IF NOT EXISTS public.yield_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  billing_cycle_id UUID NOT NULL REFERENCES public.billing_cycles(id) ON DELETE CASCADE,
  gross_yield NUMERIC(20, 6) NOT NULL DEFAULT 0,
  champions_fee NUMERIC(20, 6) NOT NULL DEFAULT 0,
  core_fee NUMERIC(20, 6) NOT NULL DEFAULT 0,
  opportunity_fee NUMERIC(20, 6) NOT NULL DEFAULT 0,
  total_fee NUMERIC(20, 6) NOT NULL DEFAULT 0,
  net_yield NUMERIC(20, 6) NOT NULL DEFAULT 0,
  token_snapshot JSONB DEFAULT '{}',
  oracle_payload JSONB DEFAULT '{}',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  distributed BOOLEAN NOT NULL DEFAULT false,
  distributed_at TIMESTAMPTZ,
  tx_hash TEXT
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_telemetry_asset_ts ON public.telemetry_logs (asset_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_billing_asset_status ON public.billing_cycles (asset_id, status);
CREATE INDEX IF NOT EXISTS idx_yield_asset_cycle ON public.yield_calculations (asset_id, billing_cycle_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON public.assets (status);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update updated_at on assets
DROP TRIGGER IF EXISTS set_assets_updated_at ON public.assets;
CREATE TRIGGER set_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
