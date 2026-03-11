"""
Container optimization engine using OR-Tools MILP solver.

Solves a bin-packing problem: given a set of SKUs with weight and volume,
find the optimal container assignment that minimizes the number of
containers while respecting weight and volume constraints.
"""

import logging
import uuid

from ortools.linear_solver import pywraplp

from .config import settings
from .schemas import (
    ContainerAllocation,
    ContainerRecommendRequest,
    ContainerRecommendResponse,
    SkuItem,
)

logger = logging.getLogger(__name__)

# Container specifications
CONTAINERS = {
    "20GP": {
        "max_weight_kg": 21_770,   # max payload
        "max_volume_cbm": 33.0,    # internal volume
        "teu": 1,
    },
    "40HC": {
        "max_weight_kg": 26_480,
        "max_volume_cbm": 76.0,
        "teu": 2,
    },
}


def _compute_totals(items: list[SkuItem]) -> tuple[float, float]:
    """Compute total weight and volume for a list of SKU items."""
    total_weight = sum(item.quantity * item.weight_kg for item in items)
    total_volume = sum(item.quantity * item.volume_cbm for item in items)
    return total_weight, total_volume


def _fits_single(
    total_weight: float, total_volume: float, container_type: str
) -> bool:
    """Check if cargo fits in a single container of given type."""
    spec = CONTAINERS[container_type]
    return (
        total_weight <= spec["max_weight_kg"]
        and total_volume <= spec["max_volume_cbm"]
    )


def _single_container_solution(
    items: list[SkuItem],
    container_type: str,
    total_weight: float,
    total_volume: float,
) -> ContainerRecommendResponse:
    """Build response for single-container solution."""
    spec = CONTAINERS[container_type]
    weight_util = (total_weight / spec["max_weight_kg"]) * 100
    volume_util = (total_volume / spec["max_volume_cbm"]) * 100
    utilization = max(weight_util, volume_util)

    reason_codes = [f"FITS_STANDARD_{container_type}"]
    if weight_util > volume_util:
        reason_codes.append("WEIGHT_CONSTRAINED")
    else:
        reason_codes.append("VOLUME_CONSTRAINED")
    if utilization > 85:
        reason_codes.append("HIGH_UTILIZATION")
    elif utilization < 40:
        reason_codes.append("LOW_UTILIZATION_CONSIDER_SMALLER")

    allocation = ContainerAllocation(
        container_type=container_type,
        sku_assignments={item.sku_id: item.quantity for item in items},
        weight_kg=round(total_weight, 1),
        volume_cbm=round(total_volume, 2),
        weight_utilization_pct=round(weight_util, 1),
        volume_utilization_pct=round(volume_util, 1),
    )

    return ContainerRecommendResponse(
        recommendation_id=str(uuid.uuid4()),
        recommendation_type="SINGLE_CONTAINER",
        container_type=container_type,
        utilization_percent=round(utilization, 1),
        containers=[allocation],
        total_containers=1,
        reason_codes=reason_codes,
        confidence_label="HIGH",
        sparse_data_mode=False,
        solver_status="OPTIMAL",
    )


def _solve_bin_packing(items: list[SkuItem]) -> ContainerRecommendResponse:
    """
    Solve multi-container bin packing using MILP.

    Minimizes total number of containers used while respecting
    weight and volume limits per container.
    """
    solver = pywraplp.Solver.CreateSolver("SCIP")
    if not solver:
        logger.error("SCIP solver not available")
        return _manual_review_fallback(items, "SOLVER_UNAVAILABLE")

    solver.SetTimeLimit(settings.solver_timeout_ms)

    n_items = len(items)
    container_types = list(CONTAINERS.keys())

    # Upper bound on containers needed (worst case: 1 per item type)
    max_containers = n_items * len(container_types)

    # Decision variables
    # x[i][c][t] = 1 if item i is assigned to container c of type t
    x = {}
    for i in range(n_items):
        for c in range(max_containers):
            for t_idx, t in enumerate(container_types):
                x[i, c, t_idx] = solver.BoolVar(f"x_{i}_{c}_{t_idx}")

    # y[c][t] = 1 if container c of type t is used
    y = {}
    for c in range(max_containers):
        for t_idx, t in enumerate(container_types):
            y[c, t_idx] = solver.BoolVar(f"y_{c}_{t_idx}")

    # Each item must be assigned to exactly one container
    for i in range(n_items):
        solver.Add(
            sum(x[i, c, t_idx]
                for c in range(max_containers)
                for t_idx in range(len(container_types)))
            == 1
        )

    # Container capacity constraints
    for c in range(max_containers):
        for t_idx, t in enumerate(container_types):
            spec = CONTAINERS[t]

            # Weight constraint
            solver.Add(
                sum(x[i, c, t_idx] * items[i].quantity * items[i].weight_kg
                    for i in range(n_items))
                <= spec["max_weight_kg"] * y[c, t_idx]
            )

            # Volume constraint
            solver.Add(
                sum(x[i, c, t_idx] * items[i].quantity * items[i].volume_cbm
                    for i in range(n_items))
                <= spec["max_volume_cbm"] * y[c, t_idx]
            )

    # Each container slot can be at most one type
    for c in range(max_containers):
        solver.Add(
            sum(y[c, t_idx] for t_idx in range(len(container_types))) <= 1
        )

    # Items can only be assigned to a container if it's active
    for i in range(n_items):
        for c in range(max_containers):
            for t_idx in range(len(container_types)):
                solver.Add(x[i, c, t_idx] <= y[c, t_idx])

    # Objective: minimize total TEU used
    solver.Minimize(
        sum(
            y[c, t_idx] * CONTAINERS[container_types[t_idx]]["teu"]
            for c in range(max_containers)
            for t_idx in range(len(container_types))
        )
    )

    status = solver.Solve()

    if status not in (pywraplp.Solver.OPTIMAL, pywraplp.Solver.FEASIBLE):
        return _manual_review_fallback(items, "INFEASIBLE_SOLUTION")

    solver_status = "OPTIMAL" if status == pywraplp.Solver.OPTIMAL else "FEASIBLE"

    # Extract solution
    allocations: list[ContainerAllocation] = []
    for c in range(max_containers):
        for t_idx, t in enumerate(container_types):
            if y[c, t_idx].solution_value() < 0.5:
                continue

            spec = CONTAINERS[t]
            assignments = {}
            total_w = 0.0
            total_v = 0.0

            for i in range(n_items):
                if x[i, c, t_idx].solution_value() > 0.5:
                    assignments[items[i].sku_id] = items[i].quantity
                    total_w += items[i].quantity * items[i].weight_kg
                    total_v += items[i].quantity * items[i].volume_cbm

            if assignments:
                allocations.append(ContainerAllocation(
                    container_type=t,
                    sku_assignments=assignments,
                    weight_kg=round(total_w, 1),
                    volume_cbm=round(total_v, 2),
                    weight_utilization_pct=round((total_w / spec["max_weight_kg"]) * 100, 1),
                    volume_utilization_pct=round((total_v / spec["max_volume_cbm"]) * 100, 1),
                ))

    # Aggregate metrics
    max_util = max(
        max(a.weight_utilization_pct, a.volume_utilization_pct) for a in allocations
    ) if allocations else 0

    reason_codes = ["MULTI_CONTAINER_OPTIMIZED", f"SOLVER_{solver_status}"]
    primary_type = max(
        set(a.container_type for a in allocations),
        key=lambda t: sum(1 for a in allocations if a.container_type == t),
    ) if allocations else None

    return ContainerRecommendResponse(
        recommendation_id=str(uuid.uuid4()),
        recommendation_type="SPLIT_LOAD",
        container_type=primary_type,
        utilization_percent=round(max_util, 1),
        containers=allocations,
        total_containers=len(allocations),
        reason_codes=reason_codes,
        confidence_label="HIGH" if solver_status == "OPTIMAL" else "MEDIUM",
        sparse_data_mode=False,
        solver_status=solver_status,
    )


def _manual_review_fallback(
    items: list[SkuItem], reason: str
) -> ContainerRecommendResponse:
    """Fallback when solver can't find a solution."""
    total_weight, total_volume = _compute_totals(items)
    return ContainerRecommendResponse(
        recommendation_id=str(uuid.uuid4()),
        recommendation_type="MANUAL_REVIEW",
        container_type=None,
        utilization_percent=0,
        containers=[],
        total_containers=0,
        reason_codes=[reason, "REQUIRES_MANUAL_PLANNING"],
        confidence_label="LOW",
        sparse_data_mode=False,
        solver_status="INFEASIBLE",
    )


def optimize_containers(req: ContainerRecommendRequest) -> ContainerRecommendResponse:
    """
    Main entry point for container optimization.

    Strategy:
    1. Try single 20GP if cargo fits
    2. Try single 40HC if cargo fits
    3. If prefer_single and fits 40HC, use 40HC
    4. Otherwise solve MILP bin-packing
    """
    total_weight, total_volume = _compute_totals(req.sku_list)
    reason_codes: list[str] = []

    logger.info(
        "Optimizing for %s: %.1f kg, %.2f cbm, %d SKU types",
        req.customer_id, total_weight, total_volume, len(req.sku_list),
    )

    # Try single container solutions first (cheaper)
    fits_20gp = _fits_single(total_weight, total_volume, "20GP")
    fits_40hc = _fits_single(total_weight, total_volume, "40HC")

    if fits_20gp and req.prefer_single:
        # Check if 20GP utilization is reasonable (>30%)
        spec_20 = CONTAINERS["20GP"]
        util = max(
            total_weight / spec_20["max_weight_kg"],
            total_volume / spec_20["max_volume_cbm"],
        ) * 100
        if util >= 30:
            return _single_container_solution(
                req.sku_list, "20GP", total_weight, total_volume
            )
        reason_codes.append("20GP_UNDERUTILIZED")

    if fits_40hc and req.prefer_single:
        return _single_container_solution(
            req.sku_list, "40HC", total_weight, total_volume
        )

    if fits_20gp:
        return _single_container_solution(
            req.sku_list, "20GP", total_weight, total_volume
        )

    # Multi-container: solve with MILP
    return _solve_bin_packing(req.sku_list)
