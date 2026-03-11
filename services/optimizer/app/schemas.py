from pydantic import BaseModel


class SkuItem(BaseModel):
    sku_id: str
    quantity: int
    weight_kg: float = 15.0   # default weight per unit
    volume_cbm: float = 0.04  # default volume per unit (cubic meters)


class ContainerRecommendRequest(BaseModel):
    customer_id: str
    sku_list: list[SkuItem]
    prefer_single: bool = True  # prefer single container if feasible


class ContainerAllocation(BaseModel):
    container_type: str  # "20GP" | "40HC"
    sku_assignments: dict[str, int]  # sku_id → quantity assigned
    weight_kg: float
    volume_cbm: float
    weight_utilization_pct: float
    volume_utilization_pct: float


class ContainerRecommendResponse(BaseModel):
    recommendation_id: str
    recommendation_type: str  # SINGLE_CONTAINER | SPLIT_LOAD | MANUAL_REVIEW
    container_type: str | None  # primary container type
    utilization_percent: float
    containers: list[ContainerAllocation]
    total_containers: int
    reason_codes: list[str]
    confidence_label: str  # HIGH | MEDIUM | LOW
    sparse_data_mode: bool
    solver_status: str  # OPTIMAL | FEASIBLE | INFEASIBLE


class MultiDropRequest(BaseModel):
    """Optimize container allocation across multiple destinations."""
    customer_id: str
    drops: list["DropPoint"]


class DropPoint(BaseModel):
    destination: str
    sku_list: list[SkuItem]


class HealthResponse(BaseModel):
    status: str
    service: str
    solver_available: bool
