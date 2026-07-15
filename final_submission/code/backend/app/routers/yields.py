"""Yield calculation and oracle-ready API endpoints."""

import logging
import time
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import BillingCycle, YieldCalculation
from app.schemas import (
    BillingCycleCreate, BillingCycleResponse,
    YieldResponse, OracleYieldPayload,
)
from app.services.yield_engine import calculate_yield_for_cycle

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/yields", tags=["Yields"])


# ─── Billing Cycles ─────────────────────────────────────────

@router.post("/cycles", response_model=BillingCycleResponse, status_code=status.HTTP_201_CREATED)
async def create_billing_cycle(
    payload: BillingCycleCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new billing cycle for an asset."""
    cycle = BillingCycle(
        asset_id=payload.asset_id,
        period_start=payload.period_start,
        period_end=payload.period_end,
    )
    db.add(cycle)
    await db.flush()
    await db.refresh(cycle)
    return cycle


@router.get("/cycles/{asset_id}", response_model=List[BillingCycleResponse])
async def list_billing_cycles(
    asset_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """List billing cycles for an asset."""
    result = await db.execute(
        select(BillingCycle)
        .where(BillingCycle.asset_id == asset_id)
        .order_by(BillingCycle.period_start.desc())
    )
    return result.scalars().all()


# ─── Yield Calculation ───────────────────────────────────────

@router.post("/calculate/{billing_cycle_id}", response_model=YieldResponse)
async def trigger_yield_calculation(
    billing_cycle_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Trigger yield calculation for a billing cycle."""
    yield_calc = await calculate_yield_for_cycle(db, billing_cycle_id)
    if not yield_calc:
        raise HTTPException(
            status_code=400,
            detail="Could not calculate yield — cycle may be invalid or already finalized.",
        )
    return yield_calc


@router.get("/{asset_id}", response_model=List[YieldResponse])
async def get_yields(
    asset_id: UUID,
    distributed_only: bool = False,
    db: AsyncSession = Depends(get_db),
):
    """Get yield calculations for a specific asset."""
    query = select(YieldCalculation).where(YieldCalculation.asset_id == asset_id)
    if distributed_only:
        query = query.where(YieldCalculation.distributed == True)
    query = query.order_by(YieldCalculation.calculated_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


# ─── Oracle-Ready Endpoint (Chainlink Functions) ─────────────

@router.get(
    "/oracle/{asset_id}",
    response_model=OracleYieldPayload,
    summary="Oracle-ready yield data",
    description="Deterministic, JSON-formatted yield metrics for Chainlink Functions consumption.",
)
async def get_oracle_yield(
    asset_id: UUID,
    api_key: str = Query(..., description="Oracle API key for authentication"),
    db: AsyncSession = Depends(get_db),
):
    """
    Secure read-only endpoint exposing deterministic yield data
    for smart contract consumption via Chainlink Functions.
    """
    from app.config import get_settings
    settings = get_settings()

    # Validate oracle API key
    if api_key != settings.oracle_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid oracle API key",
        )

    # Get the latest finalized yield calculation
    result = await db.execute(
        select(YieldCalculation)
        .where(YieldCalculation.asset_id == asset_id)
        .where(YieldCalculation.distributed == False)
        .order_by(YieldCalculation.calculated_at.desc())
        .limit(1)
    )
    yield_calc = result.scalar_one_or_none()

    if not yield_calc:
        raise HTTPException(
            status_code=404,
            detail="No pending yield calculation found for this asset",
        )

    # Convert net_yield to wei (18 decimals) for on-chain consumption
    net_yield_wei = str(int(yield_calc.net_yield * (10 ** 18)))

    return OracleYieldPayload(
        asset_id=str(asset_id),
        billing_cycle_id=str(yield_calc.billing_cycle_id),
        net_yield_wei=net_yield_wei,
        token_snapshot=yield_calc.token_snapshot or {},
        timestamp=int(time.time()),
    )
