"""Yield Calculation Engine.

Applies the tiered fee structure for Equipment-as-a-Service (EaaS):
  - 1.0% Champions fee
  - 2.0% Core fee
  - 4.5% Opportunity Fund fee
  - Total: 7.5% gross fee deducted before net distribution
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
CHAMPIONS_FEE_RATE = Decimal("0.010")   # 1.0%
CORE_FEE_RATE = Decimal("0.020")        # 2.0%
OPPORTUNITY_FEE_RATE = Decimal("0.045") # 4.5%
TOTAL_FEE_RATE = CHAMPIONS_FEE_RATE + CORE_FEE_RATE + OPPORTUNITY_FEE_RATE  # 7.5%

# Base hourly rate for EaaS revenue (configurable per asset in production)
DEFAULT_HOURLY_RATE = Decimal("50.00")  # USD per operating hour


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
    rate = hourly_rate or DEFAULT_HOURLY_RATE

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

    # Calculate gross yield (operating hours × rate × average utilization)
    gross_yield = (total_hours * rate * avg_utilization).quantize(Decimal("0.000001"), rounding=ROUND_DOWN)

    # Apply tiered fee structure
    champions_fee = (gross_yield * CHAMPIONS_FEE_RATE).quantize(Decimal("0.000001"), rounding=ROUND_DOWN)
    core_fee = (gross_yield * CORE_FEE_RATE).quantize(Decimal("0.000001"), rounding=ROUND_DOWN)
    opportunity_fee = (gross_yield * OPPORTUNITY_FEE_RATE).quantize(Decimal("0.000001"), rounding=ROUND_DOWN)
    total_fee = champions_fee + core_fee + opportunity_fee
    net_yield = gross_yield - total_fee

    # Create yield calculation record
    yield_calc = YieldCalculation(
        asset_id=cycle.asset_id,
        billing_cycle_id=cycle.id,
        gross_yield=gross_yield,
        champions_fee=champions_fee,
        core_fee=core_fee,
        opportunity_fee=opportunity_fee,
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
    champions_fee = (gross_yield * CHAMPIONS_FEE_RATE).quantize(Decimal("0.000001"), rounding=ROUND_DOWN)
    core_fee = (gross_yield * CORE_FEE_RATE).quantize(Decimal("0.000001"), rounding=ROUND_DOWN)
    opportunity_fee = (gross_yield * OPPORTUNITY_FEE_RATE).quantize(Decimal("0.000001"), rounding=ROUND_DOWN)
    total_fee = champions_fee + core_fee + opportunity_fee
    net_yield = gross_yield - total_fee

    return {
        "champions_fee": champions_fee,
        "core_fee": core_fee,
        "opportunity_fee": opportunity_fee,
        "total_fee": total_fee,
        "net_yield": net_yield,
    }
