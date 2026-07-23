const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export interface Asset {
  id: string;
  name: string;
  description: string;
  token_address: string | null;
  spv_entity: string;
  jurisdiction: string;
  asset_type: string;
  total_token_supply: number;
  status: string;
  operator_stake_balance: number;
  stake_slashed: boolean;
  is_index_pool: boolean;
  metadata_: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  symbol?: string;
}

export interface TelemetrySummary {
  asset_id: string;
  total_records: number;
  total_operating_hours: number;
  avg_utilization_rate: number;
  latest_reading: string | null;
}

export interface TelemetryLog {
  id: string;
  asset_id: string;
  timestamp: string;
  operating_hours: number;
  utilization_rate: number;
  tpm_signature: string;
  tpm_public_key: string;
  raw_payload: Record<string, unknown>;
  verified: boolean;
  created_at: string;
}

export async function fetchAssets(): Promise<Asset[]> {
  const res = await fetch(`${API_URL}/assets/`);
  if (!res.ok) {
    throw new Error('Failed to fetch assets');
  }
  return res.json();
}

export async function fetchTelemetrySummary(assetId: string): Promise<TelemetrySummary> {
  const res = await fetch(`${API_URL}/telemetry/${assetId}/summary`);
  if (!res.ok) {
    throw new Error('Failed to fetch telemetry summary');
  }
  return res.json();
}

export async function fetchTelemetryLogs(assetId: string): Promise<TelemetryLog[]> {
  const res = await fetch(`${API_URL}/telemetry/${assetId}`);
  if (!res.ok) {
    throw new Error('Failed to fetch telemetry logs');
  }
  return res.json();
}
