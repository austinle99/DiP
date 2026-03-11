"""
Demand Forecasting Service

Produces TEU demand forecasts per customer using statistical models.
Exposes REST endpoints consumed by the Express API gateway.
"""

import logging

import httpx
import redis.asyncio as redis
from fastapi import FastAPI, HTTPException

from .config import settings
from .engine import generate_forecast
from .schemas import (
    BatchForecastRequest,
    ForecastRequest,
    ForecastResponse,
    HealthResponse,
)

logging.basicConfig(level=settings.log_level.upper())
logger = logging.getLogger(__name__)

app = FastAPI(
    title="DiP Forecast Service",
    version="0.1.0",
    docs_url="/docs",
)

redis_client: redis.Redis | None = None


@app.on_event("startup")
async def startup():
    global redis_client
    try:
        redis_client = redis.from_url(settings.redis_url, decode_responses=True)
        await redis_client.ping()
        logger.info("Connected to Redis")
    except Exception as e:
        logger.warning("Redis unavailable, running without cache: %s", e)
        redis_client = None


@app.on_event("shutdown")
async def shutdown():
    if redis_client:
        await redis_client.aclose()


async def _fetch_teu_records(customer_id: str) -> list[dict]:
    """Fetch historical TEU records from the gateway API or directly from DB."""
    # Direct DB query via the Express API (internal network)
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            f"http://api:3001/api/internal/teu-records/{customer_id}"
        )
        if resp.status_code == 404:
            return []
        resp.raise_for_status()
        return resp.json()


@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="ok",
        service=settings.service_name,
        model_loaded=True,
    )


@app.post("/predict", response_model=ForecastResponse)
async def predict(req: ForecastRequest):
    """Generate demand forecast for a single customer."""

    # Check cache first
    cache_key = f"forecast:{req.customer_id}:{req.horizon_months}"
    if redis_client:
        cached = await redis_client.get(cache_key)
        if cached:
            import json
            return ForecastResponse.model_validate_json(cached)

    # Fetch historical data
    try:
        records = await _fetch_teu_records(req.customer_id)
    except Exception as e:
        logger.error("Failed to fetch TEU records for %s: %s", req.customer_id, e)
        raise HTTPException(status_code=502, detail=f"Data fetch failed: {e}")

    if not records:
        raise HTTPException(status_code=404, detail=f"No TEU data for customer {req.customer_id}")

    # Run forecasting engine
    result = generate_forecast(
        customer_id=req.customer_id,
        teu_records=records,
        horizon_months=req.horizon_months,
    )

    # Cache result (TTL = 1 hour)
    if redis_client:
        await redis_client.setex(cache_key, 3600, result.model_dump_json())

    return result


@app.post("/predict/batch", response_model=list[ForecastResponse])
async def predict_batch(req: BatchForecastRequest):
    """Generate forecasts for multiple customers."""
    results = []
    for cid in req.customer_ids:
        try:
            result = await predict(ForecastRequest(
                customer_id=cid,
                horizon_months=req.horizon_months,
            ))
            results.append(result)
        except HTTPException:
            logger.warning("Skipping customer %s (no data)", cid)
    return results


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.port)
