from pydantic import BaseModel


class ForecastRequest(BaseModel):
    customer_id: str
    horizon_months: int = 6


class ForecastPoint(BaseModel):
    month: str
    forecast_teu: float
    lower_bound: float
    upper_bound: float


class ForecastResponse(BaseModel):
    customer_id: str
    model_used: str
    confidence_label: str  # HIGH | MEDIUM | LOW
    sparse_data_mode: bool
    forecasts: list[ForecastPoint]
    seasonal_pattern: dict[str, float]  # Q1-Q4 indices
    trend_direction: str  # GROWING | STABLE | DECLINING
    reason_codes: list[str]


class BatchForecastRequest(BaseModel):
    customer_ids: list[str]
    horizon_months: int = 6


class HealthResponse(BaseModel):
    status: str
    service: str
    model_loaded: bool
