import asyncio
import logging
from sqlalchemy import text
from app.database import engine
from app.logger import setup_logging
import logging

setup_logging()
logger = logging.getLogger(__name__)

logger = logging.getLogger(__name__)

async def check():
    async with engine.begin() as conn:
        result = await conn.execute(text("SELECT id, name, asset_type, status FROM assets"))
        assets = result.all()
        logger.info(f"Total assets: {len(assets)}")
        
        seen_names = set()
        duplicates = []
        
        for a in assets:
            if a.name in seen_names:
                duplicates.append(a.id)
            else:
                seen_names.add(a.name)
                logger.info(f"Name: {a.name}, Type: {a.asset_type}, Status: {a.status}")
                
        if duplicates:
            logger.info(f"Deleting {len(duplicates)} duplicates...")
            await conn.execute(
                text("DELETE FROM assets WHERE id = ANY(:ids)"),
                {"ids": duplicates}
            )
            logger.info("Duplicates deleted.")
        else:
            logger.info("No duplicates found.")

asyncio.run(check())
