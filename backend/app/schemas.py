"""Pydantic schemas for request/response validation."""

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


# ─── Asset Schemas ───────────────────────────────────────────

class AssetCreate(BaseModel):
    name: str
    description: Optional[str] = None
    token_address: Optional[str] = None
    spv_entity: str
    jurisdiction: str = "US"
    asset_type: str = "equipment"
    total_token_supply: Optional[Decimal] = None
    status: Optional[str] = None
    tpm_public_key: Optional[str] = None
    metadata: dict = Field(default_factory=dict)


class AssetUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    token_address: Optional[str] = None
    status: Optional[str] = None
    tpm_public_key: Optional[str] = None
    stake_slashed: Optional[bool] = None
    operator_stake_balance: Optional[Decimal] = None
    metadata: Optional[dict] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        if v is not None and v not in ("pending", "active", "frozen", "retired"):
            raise ValueError("status must be one of: pending, active, frozen, retired")
        return v


class AssetResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    token_address: Optional[str]
    spv_entity: str
    jurisdiction: str
    asset_type: str
    total_token_supply: Optional[Decimal]
    tpm_public_key: Optional[str]
    status: str
    operator_stake_balance: Decimal
    stake_slashed: bool
    is_index_pool: bool
    metadata: dict = Field(validation_alias="metadata_")
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Telemetry Schemas ───────────────────────────────────────

class TelemetryPayload(BaseModel):
    """Incoming IIoT telemetry data from a physical asset."""
    asset_id: UUID
    operating_hours: Decimal = Field(ge=0)
    utilization_rate: Decimal = Field(ge=0, le=1)
    power_consumption_kwh: Optional[Decimal] = None
    temperature_celsius: Optional[Decimal] = None
    physical_audit_hours: Optional[Decimal] = None
    tpm_signature: str = Field(min_length=1, description="Hex-encoded TPM signature")
    tpm_public_key: Optional[str] = None
    raw_payload: dict = Field(default_factory=dict)


class TelemetryResponse(BaseModel):
    id: UUID
    asset_id: UUID
    timestamp: datetime
    operating_hours: Decimal
    utilization_rate: Decimal
    power_consumption_kwh: Optional[Decimal]
    temperature_celsius: Optional[Decimal]
    verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Billing Cycle Schemas ───────────────────────────────────

class BillingCycleCreate(BaseModel):
    asset_id: UUID
    period_start: datetime
    period_end: datetime


class BillingCycleResponse(BaseModel):
    id: UUID
    asset_id: UUID
    period_start: datetime
    period_end: datetime
    status: str
    finalized_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Yield Schemas ───────────────────────────────────────────

class YieldResponse(BaseModel):
    id: UUID
    asset_id: UUID
    billing_cycle_id: UUID
    gross_yield: Decimal
    champions_fee: Decimal
    core_fee: Decimal
    opportunity_fee: Decimal
    total_fee: Decimal
    net_yield: Decimal
    calculated_at: datetime
    distributed: bool
    distributed_at: Optional[datetime]
    tx_hash: Optional[str]

    model_config = {"from_attributes": True}


class OracleYieldPayload(BaseModel):
    """Deterministic JSON output for Chainlink Functions consumption."""
    asset_id: str
    billing_cycle_id: str
    net_yield_wei: str  # Yield in wei (uint256-compatible string)
    token_snapshot: dict  # address → balance mapping
    timestamp: int
