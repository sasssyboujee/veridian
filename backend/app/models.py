"""SQLAlchemy ORM models for the RWA Escrow Platform."""

import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, Numeric, Boolean, DateTime,
    ForeignKey, CheckConstraint, Index
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.database import Base


class Asset(Base):
    """Tokenized real-world asset."""
    __tablename__ = "assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    description = Column(Text)
    token_address = Column(Text)
    spv_entity = Column(Text, nullable=False)
    jurisdiction = Column(Text, nullable=False, default="US")
    asset_type = Column(Text, nullable=False, default="equipment")
    total_token_supply = Column(Numeric(78, 0))
    tpm_public_key = Column(Text, nullable=True)
    status = Column(
        Text, nullable=False, default="pending",
    )
    operator_stake_balance = Column(Numeric(20, 6), default=50000.0)
    stake_slashed = Column(Boolean, nullable=False, default=False)
    is_index_pool = Column(Boolean, nullable=False, default=False)
    metadata_ = Column("metadata", JSONB, default={})
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    # Relationships
    billing_cycles = relationship("BillingCycle", back_populates="asset", cascade="all, delete-orphan")
    telemetry_logs = relationship("TelemetryLog", back_populates="asset", cascade="all, delete-orphan")
    yield_calculations = relationship("YieldCalculation", back_populates="asset", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("status IN ('pending', 'active', 'frozen', 'retired')", name="ck_asset_status"),
        Index("idx_assets_status", "status"),
    )


class BillingCycle(Base):
    """Revenue period for yield calculation."""
    __tablename__ = "billing_cycles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end = Column(DateTime(timezone=True), nullable=False)
    status = Column(Text, nullable=False, default="open")
    finalized_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    # Relationships
    asset = relationship("Asset", back_populates="billing_cycles")
    yield_calculations = relationship("YieldCalculation", back_populates="billing_cycle", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("status IN ('open', 'processing', 'finalized')", name="ck_billing_status"),
        Index("idx_billing_asset_status", "asset_id", "status"),
    )


class TelemetryLog(Base):
    """IIoT sensor data from physical assets."""
    __tablename__ = "telemetry_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    operating_hours = Column(Numeric(10, 2), nullable=False, default=0)
    utilization_rate = Column(Numeric(5, 4), nullable=False, default=0)
    power_consumption_kwh = Column(Numeric(10, 2))
    temperature_celsius = Column(Numeric(6, 2))
    tpm_signature = Column(Text, nullable=False)
    tpm_public_key = Column(Text)
    raw_payload = Column(JSONB, nullable=False, default={})
    verified = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    # Relationships
    asset = relationship("Asset", back_populates="telemetry_logs")

    __table_args__ = (
        CheckConstraint("utilization_rate >= 0 AND utilization_rate <= 1", name="ck_utilization_range"),
        Index("idx_telemetry_asset_ts", "asset_id", "timestamp"),
    )


class YieldCalculation(Base):
    """Computed yield per billing cycle."""
    __tablename__ = "yield_calculations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    billing_cycle_id = Column(UUID(as_uuid=True), ForeignKey("billing_cycles.id", ondelete="CASCADE"), nullable=False)
    gross_yield = Column(Numeric(20, 6), nullable=False, default=0)
    champions_fee = Column(Numeric(20, 6), nullable=False, default=0)
    core_fee = Column(Numeric(20, 6), nullable=False, default=0)
    opportunity_fee = Column(Numeric(20, 6), nullable=False, default=0)
    total_fee = Column(Numeric(20, 6), nullable=False, default=0)
    net_yield = Column(Numeric(20, 6), nullable=False, default=0)
    token_snapshot = Column(JSONB, default={})
    oracle_payload = Column(JSONB, default={})
    calculated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    distributed = Column(Boolean, nullable=False, default=False)
    distributed_at = Column(DateTime(timezone=True))
    tx_hash = Column(Text)

    # Relationships
    asset = relationship("Asset", back_populates="yield_calculations")
    billing_cycle = relationship("BillingCycle", back_populates="yield_calculations")

    __table_args__ = (
        Index("idx_yield_asset_cycle", "asset_id", "billing_cycle_id"),
    )
