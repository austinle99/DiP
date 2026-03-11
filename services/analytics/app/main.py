"""
Customer Analytics Service

Provides lead scoring, customer potential analysis, churn detection,
and portfolio-level analytics using RFM models and statistical methods.
"""

import logging

import httpx
import redis.asyncio as redis
from fastapi import FastAPI, HTTPException

from .config import settings
from .engine import (
    compute_customer_potential,
    compute_lead_score,
    compute_portfolio_analytics,
)
from .schemas import (
    CustomerPotentialRequest,
    CustomerPotentialResponse,
    HealthResponse,
    LeadScoreRequest,
    LeadScoreResponse,
    PortfolioAnalyticsResponse,
)

logging.basicConfig(level=settings.log_level.upper())
logger = logging.getLogger(__name__)

app = FastAPI(
    title="DiP Analytics Service",
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
        logger.warning("Redis unavailable: %s", e)
        redis_client = None


@app.on_event("shutdown")
async def shutdown():
    if redis_client:
        await redis_client.aclose()


async def _fetch_customer_data(customer_id: str) -> dict:
    """Fetch customer data from the gateway's internal API."""
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            f"{settings.gateway_url}/customer-analytics/{customer_id}"
        )
        if resp.status_code == 404:
            raise HTTPException(status_code=404, detail=f"Customer {customer_id} not found")
        resp.raise_for_status()
        return resp.json()


async def _fetch_all_customers() -> list[dict]:
    """Fetch all customers' analytics data."""
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(f"{settings.gateway_url}/customer-analytics")
        resp.raise_for_status()
        return resp.json()


@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="ok",
        service=settings.service_name,
        models_loaded=True,
    )


@app.post("/score/lead", response_model=LeadScoreResponse)
async def score_lead(req: LeadScoreRequest):
    """Score a lead/customer for conversion or upsell potential."""
    cache_key = f"lead_score:{req.lead_id}:{req.forecast_horizon}"

    if redis_client:
        cached = await redis_client.get(cache_key)
        if cached:
            return LeadScoreResponse.model_validate_json(cached)

    customer_data = await _fetch_customer_data(req.lead_id)
    result = compute_lead_score(customer_data, req.forecast_horizon)

    if redis_client:
        await redis_client.setex(cache_key, 1800, result.model_dump_json())

    return result


@app.post("/score/potential", response_model=CustomerPotentialResponse)
async def score_potential(req: CustomerPotentialRequest):
    """Analyze customer growth potential and churn risk."""
    cache_key = f"potential:{req.customer_id}"

    if redis_client:
        cached = await redis_client.get(cache_key)
        if cached:
            return CustomerPotentialResponse.model_validate_json(cached)

    customer_data = await _fetch_customer_data(req.customer_id)
    result = compute_customer_potential(customer_data)

    if redis_client:
        await redis_client.setex(cache_key, 1800, result.model_dump_json())

    return result


@app.get("/portfolio", response_model=PortfolioAnalyticsResponse)
async def portfolio_analytics():
    """Get portfolio-level analytics across all customers."""
    cache_key = "portfolio_analytics"

    if redis_client:
        cached = await redis_client.get(cache_key)
        if cached:
            return PortfolioAnalyticsResponse.model_validate_json(cached)

    customers_data = await _fetch_all_customers()
    result = compute_portfolio_analytics(customers_data)

    if redis_client:
        await redis_client.setex(cache_key, 900, result.model_dump_json())  # 15 min cache

    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.port)
