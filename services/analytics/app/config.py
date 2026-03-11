from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    service_name: str = "analytics-service"
    port: int = 8003
    redis_url: str = "redis://redis:6379/0"
    gateway_url: str = "http://api:3001/api/internal"
    log_level: str = "info"

    model_config = {"env_prefix": "ANALYTICS_"}


settings = Settings()
