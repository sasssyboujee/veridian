"""Yield Calculation Engine.

Applies the new Direct-to-Lessee fee structure:
  - 15.0% Depreciation Reserve (Hardware Replacement Fund)
  - 10.0% SPV Management & Insurance Fee
  - Total Base Fees: 25.0%
  Note: Dynamic veRWA multipliers are applied at distribution.
"""

import logging
from datetime import datetime
from decimal import Decimal, ROUND_DOWN
from typing import Optional
from uuid import UUID

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Asset, BillingCycle, TelemetryLog, YieldCalculation

logger = logging.getLogger(__name__)

# Fee tier percentages (as Decimal for precision)
DEPRECIATION_RESERVE_RATE = Decimal("0.150") # 15.0%
SPV_MANAGEMENT_RATE = Decimal("0.100")       # 10.0%
TOTAL_FEE_RATE = DEPRECIATION_RESERVE_RATE + SPV_MANAGEMENT_RATE  # 25.0%

# Base rate for Leasing revenue (configurable per asset via Governance)
DEFAULT_USAGE_RATE = Decimal("0.16")  # USD per unit consumed (e.g., kWh)


async def calculate_yield_for_cycle(
    db: AsyncSession,
    billing_cycle_id: UUID,
    hourly_rate: Optional[Decimal] = None,
) -> Optional[YieldCalculation]:
    """
    Calculate the yield for a specific billing cycle.

    1. Sum operating hours from verified telemetry within the cycle period
    2. Compute gross yield = operating_hours × hourly_rate
    3. Apply tiered fee structure (7.5% total)
    4. Store and return the YieldCalculation record

    Args:
        db: Async database session.
        billing_cycle_id: The billing cycle to calculate for.
        hourly_rate: Override for the hourly rate (defaults to $50/hr).

    Returns:
        YieldCalculation record, or None if the cycle is invalid.
    """
    rate = hourly_rate or DEFAULT_USAGE_RATE

    # Fetch the billing cycle
    cycle = await db.get(BillingCycle, billing_cycle_id)
    if not cycle:
        logger.error(f"Billing cycle {billing_cycle_id} not found")
        return None

    if cycle.status == "finalized":
        logger.warning(f"Billing cycle {billing_cycle_id} already finalized")
        return None

    # Mark cycle as processing
    cycle.status = "processing"
    await db.flush()

    # Sum operating hours from verified telemetry within the cycle window
    result = await db.execute(
        select(
            TelemetryLog.operating_hours,
            TelemetryLog.utilization_rate,
        ).where(
            and_(
                TelemetryLog.asset_id == cycle.asset_id,
                TelemetryLog.verified == True,
                TelemetryLog.timestamp >= cycle.period_start,
                TelemetryLog.timestamp <= cycle.period_end,
            )
        )
    )
    telemetry_rows = result.all()

    if not telemetry_rows:
        logger.info(f"No verified telemetry for cycle {billing_cycle_id}")
        total_hours = Decimal("0")
        avg_utilization = Decimal("0")
    else:
        total_hours = sum(row.operating_hours for row in telemetry_rows)
        avg_utilization = sum(row.utilization_rate for row in telemetry_rows) / len(telemetry_rows)

    # Calculate gross yield (units consumed × usage rate)
    # Note: We use operating_hours to represent 'units_consumed' in the DB schema for now.
    gross_yield = (total_hours * rate).quantize(Decimal("0.000001"), rounding=ROUND_DOWN)

    # Apply new fee structure
    depreciation_fee = (gross_yield * DEPRECIATION_RESERVE_RATE).quantize(Decimal("0.000001"), rounding=ROUND_DOWN)
    spv_fee = (gross_yield * SPV_MANAGEMENT_RATE).quantize(Decimal("0.000001"), rounding=ROUND_DOWN)
    
    total_fee = depreciation_fee + spv_fee
    net_yield = gross_yield - total_fee

    # Create yield calculation record
    yield_calc = YieldCalculation(
        asset_id=cycle.asset_id,
        billing_cycle_id=cycle.id,
        gross_yield=gross_yield,
        champions_fee=depreciation_fee, # Mapped to schema: Depreciation Reserve
        core_fee=spv_fee,               # Mapped to schema: SPV Management
        opportunity_fee=Decimal("0"),
        total_fee=total_fee,
        net_yield=net_yield,
        calculated_at=datetime.utcnow(),
    )
    db.add(yield_calc)

    # Finalize the billing cycle
    cycle.status = "finalized"
    cycle.finalized_at = datetime.utcnow()

    await db.flush()

    logger.info(
        f"Yield calculated for cycle {billing_cycle_id}: "
        f"gross={gross_yield}, fees={total_fee}, net={net_yield}"
    )

    return yield_calc


def compute_fees(gross_yield: Decimal) -> dict:
    """
    Pure function to compute the tiered fee breakdown.

    Args:
        gross_yield: The gross yield amount.

    Returns:
        Dict with champions_fee, core_fee, opportunity_fee, total_fee, net_yield.
    """
    depreciation_fee = (gross_yield * DEPRECIATION_RESERVE_RATE).quantize(Decimal("0.000001"), rounding=ROUND_DOWN)
    spv_fee = (gross_yield * SPV_MANAGEMENT_RATE).quantize(Decimal("0.000001"), rounding=ROUND_DOWN)
    total_fee = depreciation_fee + spv_fee
    net_yield = gross_yield - total_fee

    return {
        "depreciation_reserve": depreciation_fee,
        "spv_management": spv_fee,
        "total_fee": total_fee,
        "net_yield": net_yield,
    }
