"""RWA Escrow Platform — FastAPI Application."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import assets, telemetry, yields

from app.logger import setup_logging
setup_logging()
logger = logging.getLogger(__name__)


import sys
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import ValidationError

limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown."""
    logger.info("🚀 RWA Escrow Backend starting up...")
    try:
        settings = get_settings()
        if not settings.gemini_api_key or not settings.database_url or not settings.cors_origins or not settings.redis_url or not settings.rpc_url:
            raise ValueError("Empty required setting detected.")
    except (ValidationError, ValueError) as e:
        logger.critical(f"CRITICAL BOOT FAILURE: Missing or invalid environment variable. Details: {e}")
        sys.exit(1)
        
    logger.info(f"   Debug mode: {settings.debug}")
    yield
    logger.info("🛑 RWA Escrow Backend shutting down...")

settings = get_settings()

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
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    openapi_url="/openapi.json" if settings.debug else None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — restrict to allowed origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routers import assets, telemetry, yields, chat

# Register routers
app.include_router(assets.router)
app.include_router(telemetry.router)
app.include_router(yields.router)
app.include_router(chat.router)


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
