from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    service_name: str = "optimizer-service"
    port: int = 8002
    redis_url: str = "redis://redis:6379/0"
    solver_timeout_ms: int = 5000
    log_level: str = "info"

    model_config = {"env_prefix": "OPTIMIZER_"}


settings = Settings()
