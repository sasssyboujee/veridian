import asyncio
import sys

from app.database import engine, Base
# Import all models to ensure they are registered with Base.metadata
from app.models import Asset, BillingCycle, TelemetryLog, YieldCalculation

async def init_db():
    print("Dropping and recreating database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables initialized successfully!")

if __name__ == "__main__":
    asyncio.run(init_db())
