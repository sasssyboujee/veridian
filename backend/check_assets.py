import asyncio
from app.database import AsyncSessionLocal
from app.models import Asset
from sqlalchemy import select, delete

async def check():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Asset))
        assets = result.scalars().all()
        print("Total assets:", len(assets))
        
        seen = set()
        duplicates = []
        for a in assets:
            if a.name in seen:
                duplicates.append(a.id)
            else:
                seen.add(a.name)
                print(f"Name: {a.name}, Type: {a.asset_type}, Status: {a.status}")
                
        if duplicates:
            print(f"Deleting {len(duplicates)} duplicates...")
            await session.execute(delete(Asset).where(Asset.id.in_(duplicates)))
            await session.commit()
            print("Duplicates deleted.")
        else:
            print("No duplicates found.")

asyncio.run(check())
