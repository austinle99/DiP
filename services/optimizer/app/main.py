"""
Container Optimization Service

Uses OR-Tools MILP solver for bin-packing optimization of shipping containers.
Minimizes total TEU while respecting weight and volume constraints.
"""

import logging

import redis.asyncio as redis
from fastapi import FastAPI

from .config import settings
from .engine import optimize_containers
from .schemas import (
    ContainerRecommendRequest,
    ContainerRecommendResponse,
    HealthResponse,
)

logging.basicConfig(level=settings.log_level.upper())
logger = logging.getLogger(__name__)

app = FastAPI(
    title="DiP Container Optimizer",
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


@app.get("/health", response_model=HealthResponse)
async def health():
    from ortools.linear_solver import pywraplp
    solver = pywraplp.Solver.CreateSolver("SCIP")
    return HealthResponse(
        status="ok",
        service=settings.service_name,
        solver_available=solver is not None,
    )


@app.post("/optimize", response_model=ContainerRecommendResponse)
async def optimize(req: ContainerRecommendRequest):
    """Run container optimization for a shipment."""

    # Check cache
    import hashlib, json
    cache_input = json.dumps(req.model_dump(), sort_keys=True)
    cache_key = f"optimize:{hashlib.sha256(cache_input.encode()).hexdigest()[:16]}"

    if redis_client:
        cached = await redis_client.get(cache_key)
        if cached:
            return ContainerRecommendResponse.model_validate_json(cached)

    # Run optimizer
    result = optimize_containers(req)

    # Cache result (TTL = 30 min, since same input = same output)
    if redis_client:
        await redis_client.setex(cache_key, 1800, result.model_dump_json())

    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.port)
