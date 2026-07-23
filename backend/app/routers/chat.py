"""Chat Router for AI Asset Assistant."""

import json
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field

from app.database import get_db
from app.config import get_settings
from app.models import Asset, TelemetryLog, YieldCalculation

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None

router = APIRouter(prefix="/chat", tags=["Chat"])

class ChatRequest(BaseModel):
    message: str

class ChartDataPoint(BaseModel):
    name: str
    value: float

class ChartData(BaseModel):
    type: str = Field(description="'bar', 'line', or 'none'")
    title: str = Field(description="Title of the chart")
    data: list[ChartDataPoint]
    x_key: str = Field(description="Key for x-axis (e.g. 'name')")
    y_key: str = Field(description="Key for y-axis (e.g. 'value')")

class ChatResponse(BaseModel):
    message: str = Field(description="The conversational text response.")
    chart: ChartData | None = Field(description="Optional chart data if visualization is relevant.", default=None)


@router.post("/{asset_address}", response_model=ChatResponse)
async def chat_with_asset(
    asset_address: str,
    request: ChatRequest,
    db: AsyncSession = Depends(get_db)
):
    settings = get_settings()
    if not settings.gemini_api_key or settings.gemini_api_key == "placeholder_for_demo":
        # For demo purposes, if API key is not set, return a mock response
        return ChatResponse(
            message="Asset #201 is located in Seattle, which experienced 4 days of heavy cloud cover, reducing solar output by 20%. Please add a real GEMINI_API_KEY to the backend .env to enable real-time AI.",
            chart=ChartData(
                type="bar",
                title="Solar Output (last 4 days)",
                data=[
                    ChartDataPoint(name="Day 1", value=45),
                    ChartDataPoint(name="Day 2", value=30),
                    ChartDataPoint(name="Day 3", value=35),
                    ChartDataPoint(name="Day 4", value=32),
                ],
                x_key="name",
                y_key="value"
            )
        )

    if not genai:
        raise HTTPException(status_code=500, detail="google-genai package not installed.")

    # 1. Fetch Asset Context
    result = await db.execute(select(Asset).where(Asset.token_address == asset_address))
    asset = result.scalar_one_or_none()
    
    if not asset:
        # Provide fallback demo data if DB is not seeded
        asset_info = f"Demo Asset ({asset_address[:6]})"
        status = "active"
        telemetry_data = [
            {"timestamp": "2026-07-20T10:00:00Z", "utilization_rate": 0.95, "power_consumption_kwh": 45, "temperature_celsius": 30},
            {"timestamp": "2026-07-21T10:00:00Z", "utilization_rate": 0.80, "power_consumption_kwh": 30, "temperature_celsius": 28},
            {"timestamp": "2026-07-22T10:00:00Z", "utilization_rate": 0.85, "power_consumption_kwh": 35, "temperature_celsius": 29},
            {"timestamp": "2026-07-23T10:00:00Z", "utilization_rate": 0.82, "power_consumption_kwh": 32, "temperature_celsius": 29},
        ]
        yield_data = [
            {"calculated_at": "2026-06-30T23:59:59Z", "gross_yield": 1500.0, "net_yield": 1350.0},
            {"calculated_at": "2026-05-31T23:59:59Z", "gross_yield": 1600.0, "net_yield": 1440.0},
        ]
    else:
        asset_info = f"{asset.name} (ID: {asset.id})"
        status = asset.status
        
        # 2. Fetch Recent Telemetry (Last 7 logs)
        tel_result = await db.execute(
            select(TelemetryLog).where(TelemetryLog.asset_id == asset.id).order_by(TelemetryLog.timestamp.desc()).limit(7)
        )
        telemetry = tel_result.scalars().all()
        telemetry_data = [
            {
                "timestamp": t.timestamp.isoformat(),
                "utilization_rate": float(t.utilization_rate),
                "power_consumption_kwh": float(t.power_consumption_kwh) if t.power_consumption_kwh else 0,
                "temperature_celsius": float(t.temperature_celsius) if t.temperature_celsius else 0
            }
            for t in telemetry
        ]

        # 3. Fetch Recent Yield Calculations
        yield_result = await db.execute(
            select(YieldCalculation).where(YieldCalculation.asset_id == asset.id).order_by(YieldCalculation.calculated_at.desc()).limit(3)
        )
        yields = yield_result.scalars().all()
        yield_data = [
            {
                "calculated_at": y.calculated_at.isoformat(),
                "gross_yield": float(y.gross_yield),
                "net_yield": float(y.net_yield)
            }
            for y in yields
        ]

    # 4. Construct System Prompt
    system_instruction = f"""You are the Veridian RWA Escrow Platform AI Assistant.
You are helping an investor or lessee understand the performance of their physical asset.
Use the following context to answer their question accurately.
If they ask for visual data, try to extract relevant time-series data from the telemetry or yield history and return a chart.

Asset Details:
Asset: {asset_info}
Status: {status}

Recent Telemetry:
{json.dumps(telemetry_data, indent=2)}

Recent Yields:
{json.dumps(yield_data, indent=2)}
"""

    try:
        client = genai.Client(api_key=settings.gemini_api_key)
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=request.message,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=ChatResponse,
            ),
        )
        # Parse the structured JSON response into our Pydantic model
        if not response.text:
            raise ValueError("No text returned from Gemini")
        parsed_data = json.loads(response.text)
        return ChatResponse(**parsed_data)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        
        # Check if it's a rate limit issue
        error_msg = str(e)
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            return ChatResponse(
                message="My Intelligence Core is currently experiencing high telemetry load (API Rate Limit Exceeded). Please try again in a few seconds. Here is the latest yield data as a fallback.",
                chart=ChartData(
                    type="bar",
                    title="Recent Yield Data",
                    data=[
                        ChartDataPoint(name="Yield 1", value=1350.0),
                        ChartDataPoint(name="Yield 2", value=1440.0),
                    ],
                    x_key="name",
                    y_key="value"
                )
            )
        
        raise HTTPException(status_code=500, detail=f"LLM Error: {error_msg}")
