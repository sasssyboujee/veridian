import asyncio
import logging
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import random

from sqlalchemy import delete
from app.database import AsyncSessionLocal, engine
from app.models import Asset, BillingCycle, TelemetryLog, YieldCalculation
from app.services.yield_engine import calculate_yield_for_cycle

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def seed_data():
    async with AsyncSessionLocal() as session:
        # 1. Wipe existing data
        logger.info("Wiping existing data...")
        await session.execute(delete(YieldCalculation))
        await session.execute(delete(TelemetryLog))
        await session.execute(delete(BillingCycle))
        await session.execute(delete(Asset))
        await session.commit()
        logger.info("Data wiped.")

        # 2. Define Assets
        asset_configs = [
            # Solar
            {"name": "Western Cape Solar Array 1", "asset_type": "solar", "spv": "SunPower SPV Ltd"},
            {"name": "Western Cape Solar Array 2", "asset_type": "solar", "spv": "SunPower SPV Ltd"},
            {"name": "Nevada Desert Array Alpha", "asset_type": "solar", "spv": "Nevada Solar LLC"},
            {"name": "Nevada Desert Array Beta", "asset_type": "solar", "spv": "Nevada Solar LLC"},
            # Wind
            {"name": "Texas Wind Farm - Turbine 1", "asset_type": "wind", "spv": "TexWind SPV"},
            {"name": "Texas Wind Farm - Turbine 2", "asset_type": "wind", "spv": "TexWind SPV"},
            {"name": "North Sea Offshore Wind A", "asset_type": "wind", "spv": "NordicWind A/S"},
            {"name": "North Sea Offshore Wind B", "asset_type": "wind", "spv": "NordicWind A/S"},
            # Agriculture
            {"name": "Queensland Smart Tractor Fleet", "asset_type": "agriculture", "spv": "AgriTech QLD"},
            {"name": "Iowa Automated Harvester", "asset_type": "agriculture", "spv": "Iowa Farming Tech"},
            {"name": "Central Valley Drone Sprayers", "asset_type": "agriculture", "spv": "CaliAg Drones"},
            {"name": "Kenya Smart Irrigation Pump", "asset_type": "agriculture", "spv": "Rift Valley Water"},
        ]

        assets = []
        for config in asset_configs:
            asset = Asset(
                name=config["name"],
                description=f"Tokenized {config['asset_type']} asset for RWA network.",
                token_address="0x" + "".join([random.choice("0123456789abcdef") for _ in range(40)]),
                spv_entity=config["spv"],
                jurisdiction="Global",
                asset_type=config["asset_type"],
                total_token_supply=Decimal("1000000"),
                status="active",
                operator_stake_balance=Decimal("50000.0"),
                stake_slashed=False,
                is_index_pool=False
            )
            session.add(asset)
            assets.append(asset)
        
        await session.flush()
        logger.info(f"Created {len(assets)} assets.")

        now = datetime.now(timezone.utc)
        
        # 3. Generate 6 months of historical data for each asset
        for asset in assets:
            logger.info(f"Generating data for {asset.name}...")
            
            # Decide base metrics based on type
            if asset.asset_type == "solar":
                base_hours = 8.0
                rate = Decimal("0.16")
            elif asset.asset_type == "wind":
                base_hours = 14.0
                rate = Decimal("0.12")
            else: # agriculture
                base_hours = 10.0
                rate = Decimal("0.25")
                
            for month_offset in range(5, -1, -1):
                # Calculate start and end of this billing cycle month
                period_end = now - timedelta(days=30 * month_offset)
                period_start = period_end - timedelta(days=30)
                
                # Insert Telemetry Logs for each day in this month
                for day in range(30):
                    log_time = period_start + timedelta(days=day)
                    
                    # Randomize telemetry a bit
                    daily_hours = base_hours * random.uniform(0.8, 1.2)
                    daily_temp = 25.0 + random.uniform(-10, 15)
                    power_kw = daily_hours * 15.0
                    
                    log = TelemetryLog(
                        asset_id=asset.id,
                        timestamp=log_time,
                        operating_hours=Decimal(str(round(daily_hours, 2))),
                        utilization_rate=Decimal(str(round(daily_hours / 24.0, 4))),
                        power_consumption_kwh=Decimal(str(round(power_kw, 2))),
                        temperature_celsius=Decimal(str(round(daily_temp, 2))),
                        tpm_signature=f"deadbeef_historical_{month_offset}_{day}",
                        verified=True,
                        raw_payload={"mock": True, "note": "historical seed data"}
                    )
                    session.add(log)
                
                await session.flush()
                
                # Create Billing Cycle
                cycle = BillingCycle(
                    asset_id=asset.id,
                    period_start=period_start,
                    period_end=period_end,
                    status="open" # calculate_yield will move it to processing then finalized
                )
                session.add(cycle)
                await session.flush()
                await session.refresh(cycle)
                
                # Run Yield Engine
                await calculate_yield_for_cycle(session, cycle.id, hourly_rate=rate)
            
        await session.commit()
        logger.info("Finished seeding historical data!")

if __name__ == "__main__":
    asyncio.run(seed_data())
