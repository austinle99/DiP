from pydantic import BaseModel


# ─── Lead Scoring ─────────────────────────────────────────────────────────────

class LeadScoreRequest(BaseModel):
    lead_id: str
    forecast_horizon: str = "30_DAYS"  # 30_DAYS | 60_DAYS | 90_DAYS


class LeadScoreResponse(BaseModel):
    score: float  # 0-100
    next_best_action: str
    top_drivers: list[str]
    reason_codes: list[str]


# ─── Customer Potential ───────────────────────────────────────────────────────

class CustomerPotentialRequest(BaseModel):
    customer_id: str


class CustomerPotentialResponse(BaseModel):
    customer_id: str
    potential_score: float  # 0-100
    current_tier: str
    recommended_tier: str
    growth_probability: float
    churn_risk: float  # 0-1
    ltv_estimate: float
    top_drivers: list[str]
    next_best_action: str
    reason_codes: list[str]


# ─── Portfolio Analytics ──────────────────────────────────────────────────────

class PortfolioAnalyticsResponse(BaseModel):
    total_customers: int
    segments: list["CustomerSegment"]
    at_risk_customers: list[str]
    high_potential_customers: list[str]
    avg_churn_risk: float
    portfolio_health_score: float  # 0-100


class CustomerSegment(BaseModel):
    segment_name: str
    customer_count: int
    avg_teu: float
    avg_ltv: float
    avg_churn_risk: float


class HealthResponse(BaseModel):
    status: str
    service: str
    models_loaded: bool
