"""Telemetry ingestion router with TPM signature verification."""

import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Asset, TelemetryLog, BillingCycle
from app.schemas import TelemetryPayload, TelemetryResponse
from app.services.tpm_verify import verify_tpm_signature
from app.services.yield_engine import calculate_yield_for_cycle
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/telemetry", tags=["Telemetry"])


@router.post("/", response_model=TelemetryResponse, status_code=status.HTTP_201_CREATED)
async def ingest_telemetry(
    payload: TelemetryPayload,
    db: AsyncSession = Depends(get_db),
):
    """
    Ingest IIoT telemetry data from a physical asset.

    Security: Rejects payloads lacking a valid cryptographic signature
    from a Hardware Root of Trust (TPM 2.0 or Secure Enclave).
    """
    # Verify the asset exists
    asset = await db.get(Asset, payload.asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    if asset.status != "active":
        raise HTTPException(
            status_code=400,
            detail=f"Asset is not active (current status: {asset.status})",
        )

    # Verify TPM signature — reject if invalid
    is_verified = verify_tpm_signature(
        raw_payload=payload.raw_payload,
        signature_hex=payload.tpm_signature,
        public_key_pem=payload.tpm_public_key,
    )

    if not is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid TPM signature — payload rejected. "
                   "Telemetry must be signed by a Hardware Root of Trust.",
        )

    # Physical Audit / SLA Slash Logic
    if payload.physical_audit_hours is not None:
        variance = abs(payload.operating_hours - payload.physical_audit_hours) / payload.physical_audit_hours
        if variance > 0.05:
            # Variance > 5%, slash operator stake
            asset.stake_slashed = True
            # In a real system, the stake balance would be moved to the yield contract
            asset.operator_stake_balance = 0

    # Store the verified telemetry record
    telemetry = TelemetryLog(
        asset_id=payload.asset_id,
        operating_hours=payload.operating_hours,
        utilization_rate=payload.utilization_rate,
        power_consumption_kwh=payload.power_consumption_kwh,
        temperature_celsius=payload.temperature_celsius,
        tpm_signature=payload.tpm_signature,
        tpm_public_key=payload.tpm_public_key,
        raw_payload=payload.raw_payload,
        verified=True,
    )
    db.add(telemetry)
    await db.flush()
    await db.refresh(telemetry)

    logger.info(f"Ingested telemetry for asset {payload.asset_id}: {telemetry.id}")
    return telemetry


@router.get("/{asset_id}", response_model=List[TelemetryResponse])
async def get_telemetry(
    asset_id: UUID,
    limit: int = 100,
    verified_only: bool = True,
    db: AsyncSession = Depends(get_db),
):
    """Get telemetry logs for a specific asset."""
    query = select(TelemetryLog).where(TelemetryLog.asset_id == asset_id)

    if verified_only:
        query = query.where(TelemetryLog.verified == True)

    query = query.order_by(TelemetryLog.timestamp.desc()).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{asset_id}/summary")
async def get_telemetry_summary(
    asset_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get an aggregate summary of telemetry for an asset."""
    from sqlalchemy import func

    result = await db.execute(
        select(
            func.count(TelemetryLog.id).label("total_records"),
            func.sum(TelemetryLog.operating_hours).label("total_operating_hours"),
            func.avg(TelemetryLog.utilization_rate).label("avg_utilization_rate"),
            func.max(TelemetryLog.timestamp).label("latest_reading"),
        ).where(
            and_(
                TelemetryLog.asset_id == asset_id,
                TelemetryLog.verified == True,
            )
        )
    )
    row = result.one()
    return {
        "asset_id": str(asset_id),
        "total_records": row.total_records or 0,
        "total_operating_hours": float(row.total_operating_hours or 0),
        "avg_utilization_rate": float(row.avg_utilization_rate or 0),
        "latest_reading": row.latest_reading.isoformat() if row.latest_reading else None,
    }


@router.post("/simulate/{asset_id}")
async def simulate_telemetry_month(
    asset_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Simulate 30 days of telemetry and trigger a yield cycle (Demo only)."""
    # Verify the asset exists
    asset = await db.get(Asset, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    # Generate 30 days of telemetry
    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=30)
    
    for i in range(30):
        log_time = start_date + timedelta(days=i)
        telemetry = TelemetryLog(
            asset_id=asset_id,
            operating_hours=8.5,  # Fake 8.5 hours of sunlight
            utilization_rate=0.85,
            power_consumption_kwh=120.5,
            temperature_celsius=35.0,
            tpm_signature="deadbeef", # mock bypass signature
            tpm_public_key=None,
            raw_payload={"mock": True},
            verified=True,
            timestamp=log_time
        )
        db.add(telemetry)
    
    await db.flush()
    
    # Create billing cycle for this month
    cycle = BillingCycle(
        asset_id=asset_id,
        period_start=start_date,
        period_end=now,
    )
    db.add(cycle)
    await db.flush()
    await db.refresh(cycle)
    
    # Calculate yield for the generated cycle
    yield_calc = await calculate_yield_for_cycle(db, cycle.id)
    
    return {"message": "Simulated 1 month of telemetry and calculated yield", "cycle_id": cycle.id}
