from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    service_name: str = "forecast-service"
    port: int = 8001
    redis_url: str = "redis://redis:6379/0"
    database_url: str = "postgresql://dip_user:dip_password@db:5432/demand_intel"
    model_retrain_interval_hours: int = 24
    forecast_horizon_months: int = 6
    log_level: str = "info"

    model_config = {"env_prefix": "FORECAST_"}


settings = Settings()
