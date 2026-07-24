import asyncio
import asyncpg
import urllib.parse
from app.logger import setup_logging
import logging

setup_logging()
logger = logging.getLogger(__name__)

regions = [
    "us-east-1", "us-east-2", "us-west-1", "us-west-2",
    "ca-central-1", "eu-west-1", "eu-west-2", "eu-west-3",
    "eu-central-1", "eu-central-2", "ap-northeast-1",
    "ap-northeast-2", "ap-northeast-3", "ap-southeast-1",
    "ap-southeast-2", "ap-south-1", "sa-east-1",
    "af-south-1", "me-central-1"
]
password = "z4V4u%2CY%25df24Ew5"
project_ref = "lzbhpdythhhmozhjkrdp"
decoded_password = urllib.parse.unquote(password)

async def test_region(region):
    host = f"aws-0-{region}.pooler.supabase.com"
    user = f"postgres.{project_ref}"
    try:
        conn = await asyncio.wait_for(
            asyncpg.connect(
                host=host,
                port=6543,
                user=user,
                password=decoded_password,
                database="postgres",
                timeout=3
            ),
            timeout=4
        )
        await conn.close()
        logger.info(f"🎉 SUCCESS: Connected using region {region}!")
        return region
    except Exception as e:
        err_msg = str(e)
        if "tenant/user" not in err_msg:
            # If the error is password incorrect or something else, the tenant WAS found!
            logger.info(f"👉 TENANT FOUND in {region} but failed: {err_msg}")
            return region
        # If it's tenant not found, do nothing
        return None

async def main():
    logger.info("Starting region discovery...")
    tasks = [test_region(r) for r in regions]
    results = await asyncio.gather(*tasks)
    found = [r for r in results if r is not None]
    if found:
        logger.info(f"Found working regions: {found}")
    else:
        logger.info("No regions matched.")

asyncio.run(main())
