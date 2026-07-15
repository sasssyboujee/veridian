"""Assets CRUD router."""

import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Asset
from app.schemas import AssetCreate, AssetUpdate, AssetResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/assets", tags=["Assets"])


@router.post("/", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def create_asset(payload: AssetCreate, db: AsyncSession = Depends(get_db)):
    """Register a new real-world asset."""
    asset = Asset(
        name=payload.name,
        description=payload.description,
        spv_entity=payload.spv_entity,
        jurisdiction=payload.jurisdiction,
        asset_type=payload.asset_type,
        total_token_supply=payload.total_token_supply,
        metadata_=payload.metadata,
    )
    db.add(asset)
    await db.flush()
    await db.refresh(asset)
    logger.info(f"Created asset: {asset.id} — {asset.name}")
    return asset


@router.get("/", response_model=List[AssetResponse])
async def list_assets(
    status_filter: str = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """List all assets, optionally filtered by status."""
    query = select(Asset)
    if status_filter:
        query = query.where(Asset.status == status_filter)
    query = query.order_by(Asset.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(asset_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get a specific asset by ID."""
    asset = await db.get(Asset, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


@router.patch("/{asset_id}", response_model=AssetResponse)
async def update_asset(
    asset_id: UUID,
    payload: AssetUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update an asset's properties."""
    asset = await db.get(Asset, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "metadata" in update_data:
        update_data["metadata_"] = update_data.pop("metadata")

    for field, value in update_data.items():
        setattr(asset, field, value)

    await db.flush()
    await db.refresh(asset)
    return asset


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_asset(asset_id: UUID, db: AsyncSession = Depends(get_db)):
    """Delete an asset."""
    asset = await db.get(Asset, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    await db.delete(asset)
