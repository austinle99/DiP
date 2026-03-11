"""
Customer analytics engine.

Provides lead scoring, customer potential analysis, and churn risk
using RFM (Recency, Frequency, Monetary) analysis and gradient
boosting for scoring when sufficient training data exists.
"""

import logging
from datetime import datetime

import numpy as np

from .schemas import (
    CustomerPotentialResponse,
    CustomerSegment,
    LeadScoreResponse,
    PortfolioAnalyticsResponse,
)

logger = logging.getLogger(__name__)

# ─── Action Mapping ───────────────────────────────────────────────────────────

ACTIONS = {
    "high_value_growing": "RETAIN_AND_UPSELL",
    "high_value_stable": "MAINTAIN_RELATIONSHIP",
    "high_value_declining": "CALL_CUSTOMER",
    "medium_value_growing": "DRAFT_QUOTE",
    "medium_value_stable": "SCHEDULE_REVIEW",
    "medium_value_declining": "OFFER_INCENTIVE",
    "low_value_growing": "NURTURE_CAMPAIGN",
    "low_value_stable": "STANDARD_FOLLOW_UP",
    "low_value_declining": "RE_ENGAGEMENT_CAMPAIGN",
}

TIER_MAP = {"TIER_1": "Tier 1", "TIER_2": "Tier 2", "TIER_3": "Tier 3"}


def _rfm_score(
    recency_days: int,
    frequency: int,
    monetary: float,
) -> tuple[float, list[str]]:
    """
    Compute RFM-based lead score (0-100).

    Recency: days since last booking (lower = better)
    Frequency: number of bookings in last 12 months
    Monetary: total TEU value
    """
    drivers = []

    # Recency score (0-33): more recent = higher score
    if recency_days <= 30:
        r_score = 33
        drivers.append("RECENT_ACTIVITY")
    elif recency_days <= 90:
        r_score = 25
    elif recency_days <= 180:
        r_score = 15
        drivers.append("DECLINING_ENGAGEMENT")
    else:
        r_score = 5
        drivers.append("INACTIVE_LONG_PERIOD")

    # Frequency score (0-33): more frequent = higher score
    if frequency >= 10:
        f_score = 33
        drivers.append("HIGH_FREQUENCY")
    elif frequency >= 5:
        f_score = 25
    elif frequency >= 2:
        f_score = 15
    else:
        f_score = 5
        drivers.append("LOW_FREQUENCY")

    # Monetary score (0-34): higher value = higher score
    if monetary >= 2000:
        m_score = 34
        drivers.append("HIGH_VALUE_CUSTOMER")
    elif monetary >= 500:
        m_score = 25
    elif monetary >= 100:
        m_score = 15
    else:
        m_score = 5
        drivers.append("LOW_VOLUME")

    return float(r_score + f_score + m_score), drivers


def _estimate_churn_risk(
    recency_days: int,
    frequency: int,
    teu_trend: list[float],
) -> float:
    """
    Estimate churn risk (0.0-1.0) based on behavioral signals.

    Simple logistic function based on:
    - Days since last activity
    - Booking frequency decline
    - TEU trend direction
    """
    # Base risk from recency
    recency_risk = min(recency_days / 365, 1.0)

    # Frequency risk
    freq_risk = max(1.0 - (frequency / 12), 0.0)

    # Trend risk
    if len(teu_trend) >= 3:
        recent = np.mean(teu_trend[-3:])
        older = np.mean(teu_trend[:3]) if len(teu_trend) >= 6 else recent
        if older > 0:
            trend_ratio = recent / older
            trend_risk = max(1.0 - trend_ratio, 0.0)
        else:
            trend_risk = 0.5
    else:
        trend_risk = 0.3  # unknown = moderate risk

    # Weighted combination
    risk = 0.4 * recency_risk + 0.3 * freq_risk + 0.3 * trend_risk
    return round(min(max(risk, 0.0), 1.0), 3)


def compute_lead_score(
    customer_data: dict,
    forecast_horizon: str = "30_DAYS",
) -> LeadScoreResponse:
    """Score a customer/lead based on their activity patterns."""

    recency_days = customer_data.get("recency_days", 60)
    frequency = customer_data.get("booking_count", 3)
    monetary = customer_data.get("total_teu", 500)

    score, drivers = _rfm_score(recency_days, frequency, monetary)

    # Adjust for forecast horizon
    horizon_multiplier = {
        "30_DAYS": 1.0,
        "60_DAYS": 0.95,
        "90_DAYS": 0.9,
    }.get(forecast_horizon, 1.0)
    score *= horizon_multiplier

    # Determine action
    value_tier = "high" if monetary >= 1500 else "medium" if monetary >= 500 else "low"
    teu_values = customer_data.get("monthly_teu", [])
    if len(teu_values) >= 2:
        growth = (teu_values[-1] - teu_values[0]) / max(teu_values[0], 1)
        trend = "growing" if growth > 0.05 else "declining" if growth < -0.05 else "stable"
    else:
        trend = "stable"

    action_key = f"{value_tier}_value_{trend}"
    next_best_action = ACTIONS.get(action_key, "SCHEDULE_REVIEW")

    reason_codes = [f"RFM_SCORE_{int(score)}", f"HORIZON_{forecast_horizon}"]
    if score >= 75:
        reason_codes.append("HIGH_CONVERSION_LIKELY")
    elif score < 30:
        reason_codes.append("LOW_ENGAGEMENT_RISK")

    return LeadScoreResponse(
        score=round(score, 1),
        next_best_action=next_best_action,
        top_drivers=drivers[:5],
        reason_codes=reason_codes,
    )


def compute_customer_potential(
    customer_data: dict,
) -> CustomerPotentialResponse:
    """Analyze customer growth potential and churn risk."""

    customer_id = customer_data["customer_id"]
    total_teu = customer_data.get("total_teu", 0)
    tier = customer_data.get("tier", "TIER_3")
    monthly_teu = customer_data.get("monthly_teu", [])
    recency_days = customer_data.get("recency_days", 90)
    booking_count = customer_data.get("booking_count", 0)

    # Lead score (reuse RFM)
    score, drivers = _rfm_score(recency_days, booking_count, total_teu)

    # Churn risk
    churn_risk = _estimate_churn_risk(recency_days, booking_count, monthly_teu)

    # Growth probability (inverse of churn, weighted by trend)
    growth_prob = max(0, 1.0 - churn_risk - 0.1)
    if len(monthly_teu) >= 3 and np.mean(monthly_teu[-3:]) > np.mean(monthly_teu[:3] if len(monthly_teu) >= 6 else monthly_teu):
        growth_prob = min(growth_prob + 0.15, 1.0)
        drivers.append("POSITIVE_MOMENTUM")

    # LTV estimate (simple: avg monthly TEU * 580 * 12)
    avg_monthly = np.mean(monthly_teu) if monthly_teu else total_teu / 12
    ltv = float(avg_monthly * 580 * 12)

    # Recommended tier
    if total_teu >= 3000 or ltv >= 2_000_000:
        rec_tier = "Tier 1"
    elif total_teu >= 1000 or ltv >= 500_000:
        rec_tier = "Tier 2"
    else:
        rec_tier = "Tier 3"

    current_display = TIER_MAP.get(tier, tier)
    if rec_tier != current_display:
        drivers.append(f"TIER_UPGRADE_RECOMMENDED" if rec_tier < current_display else "TIER_AT_RISK")

    # Next best action
    value_tier = "high" if total_teu >= 1500 else "medium" if total_teu >= 500 else "low"
    trend_dir = "growing" if growth_prob > 0.6 else "declining" if churn_risk > 0.5 else "stable"
    action_key = f"{value_tier}_value_{trend_dir}"
    next_best_action = ACTIONS.get(action_key, "SCHEDULE_REVIEW")

    reason_codes = [f"POTENTIAL_SCORE_{int(score)}"]
    if churn_risk > 0.5:
        reason_codes.append("HIGH_CHURN_RISK")
    if growth_prob > 0.6:
        reason_codes.append("HIGH_GROWTH_POTENTIAL")

    return CustomerPotentialResponse(
        customer_id=customer_id,
        potential_score=round(score, 1),
        current_tier=current_display,
        recommended_tier=rec_tier,
        growth_probability=round(growth_prob, 3),
        churn_risk=churn_risk,
        ltv_estimate=round(ltv, 2),
        top_drivers=drivers[:5],
        next_best_action=next_best_action,
        reason_codes=reason_codes,
    )


def compute_portfolio_analytics(
    customers_data: list[dict],
) -> PortfolioAnalyticsResponse:
    """Compute portfolio-level analytics across all customers."""

    if not customers_data:
        return PortfolioAnalyticsResponse(
            total_customers=0,
            segments=[],
            at_risk_customers=[],
            high_potential_customers=[],
            avg_churn_risk=0,
            portfolio_health_score=50,
        )

    # Score each customer
    scored = []
    for c in customers_data:
        monthly_teu = c.get("monthly_teu", [])
        churn = _estimate_churn_risk(
            c.get("recency_days", 90),
            c.get("booking_count", 0),
            monthly_teu,
        )
        score, _ = _rfm_score(
            c.get("recency_days", 90),
            c.get("booking_count", 0),
            c.get("total_teu", 0),
        )
        scored.append({**c, "churn_risk": churn, "score": score})

    # Segment by tier
    segments: list[CustomerSegment] = []
    for tier_key, tier_label in TIER_MAP.items():
        tier_customers = [s for s in scored if s.get("tier") == tier_key]
        if tier_customers:
            segments.append(CustomerSegment(
                segment_name=tier_label,
                customer_count=len(tier_customers),
                avg_teu=round(float(np.mean([c["total_teu"] for c in tier_customers])), 1),
                avg_ltv=round(float(np.mean([c["total_teu"] * 580 for c in tier_customers])), 2),
                avg_churn_risk=round(float(np.mean([c["churn_risk"] for c in tier_customers])), 3),
            ))

    at_risk = [s["customer_id"] for s in scored if s["churn_risk"] > 0.5]
    high_potential = [s["customer_id"] for s in scored if s["score"] >= 70]
    avg_churn = float(np.mean([s["churn_risk"] for s in scored]))

    # Portfolio health: weighted average of (100 - churn_risk*100) per customer
    health = float(np.mean([100 - s["churn_risk"] * 100 for s in scored]))

    return PortfolioAnalyticsResponse(
        total_customers=len(scored),
        segments=segments,
        at_risk_customers=at_risk,
        high_potential_customers=high_potential,
        avg_churn_risk=round(avg_churn, 3),
        portfolio_health_score=round(health, 1),
    )
