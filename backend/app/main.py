"""RWA Escrow Platform — FastAPI Application."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import assets, telemetry, yields

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown."""
    logger.info("🚀 RWA Escrow Backend starting up...")
    settings = get_settings()
    logger.info(f"   Debug mode: {settings.debug}")
    yield
    logger.info("🛑 RWA Escrow Backend shutting down...")


app = FastAPI(
    title="RWA Escrow Platform API",
    description=(
        "Backend API for the Real World Asset Escrow Platform. "
        "Handles IIoT telemetry ingestion with TPM verification, "
        "yield calculations with tiered fee structures, and "
        "oracle-ready data endpoints for Chainlink Functions."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(assets.router)
app.include_router(telemetry.router)
app.include_router(yields.router)


@app.get("/", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "rwa-escrow-backend",
        "version": "0.1.0",
    }


@app.get("/health", tags=["Health"])
async def detailed_health():
    """Detailed health check with database connectivity info."""
    from app.database import engine
    try:
        async with engine.connect() as conn:
            await conn.execute("SELECT 1")
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "healthy",
        "service": "rwa-escrow-backend",
        "database": db_status,
    }
