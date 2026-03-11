"""
Demand forecasting engine using StatsForecast.

Uses AutoETS (Exponential Smoothing) as primary model with
SeasonalNaive as fallback for sparse data. Produces point forecasts
with prediction intervals.
"""

import logging
from datetime import datetime

import numpy as np
import pandas as pd
from statsforecast import StatsForecast
from statsforecast.models import AutoETS, SeasonalNaive

from .schemas import ForecastPoint, ForecastResponse

logger = logging.getLogger(__name__)

# Minimum data points needed for full model vs. fallback
MIN_POINTS_FULL_MODEL = 12
MIN_POINTS_FALLBACK = 3


def _build_sf_dataframe(teu_records: list[dict]) -> pd.DataFrame:
    """Convert raw TEU records into StatsForecast-compatible DataFrame."""
    df = pd.DataFrame(teu_records)
    df["ds"] = pd.to_datetime(df["month"] + "-01")
    df["y"] = df["booked_teu"].astype(float)
    df = df.sort_values("ds").reset_index(drop=True)
    df["unique_id"] = "customer"
    return df[["unique_id", "ds", "y"]]


def _detect_trend(values: list[float]) -> str:
    """Simple linear regression slope to detect trend direction."""
    if len(values) < 3:
        return "STABLE"
    x = np.arange(len(values))
    slope = np.polyfit(x, values, 1)[0]
    mean_val = np.mean(values)
    if mean_val == 0:
        return "STABLE"
    pct_change = slope / mean_val
    if pct_change > 0.02:
        return "GROWING"
    elif pct_change < -0.02:
        return "DECLINING"
    return "STABLE"


def _compute_seasonal_indices(df: pd.DataFrame) -> dict[str, float]:
    """Compute quarterly seasonal indices (0-100 scale)."""
    if len(df) < 4:
        return {"Q1": 50.0, "Q2": 50.0, "Q3": 50.0, "Q4": 50.0}

    df = df.copy()
    df["quarter"] = df["ds"].dt.quarter
    quarterly_mean = df.groupby("quarter")["y"].mean()
    overall_mean = df["y"].mean()

    if overall_mean == 0:
        return {"Q1": 50.0, "Q2": 50.0, "Q3": 50.0, "Q4": 50.0}

    indices = {}
    for q in range(1, 5):
        if q in quarterly_mean.index:
            raw_index = (quarterly_mean[q] / overall_mean) * 50
            indices[f"Q{q}"] = round(min(max(raw_index, 0), 100), 1)
        else:
            indices[f"Q{q}"] = 50.0
    return indices


def generate_forecast(
    customer_id: str,
    teu_records: list[dict],
    horizon_months: int = 6,
) -> ForecastResponse:
    """
    Generate demand forecast for a customer.

    Uses AutoETS when sufficient data (>=12 months), falls back to
    SeasonalNaive for sparse data (3-11 months), and uses simple
    average for very sparse data (<3 months).
    """
    n_records = len(teu_records)
    reason_codes: list[str] = []
    sparse_data_mode = False

    # ── Very sparse: not enough data for any model ────────────────────────
    if n_records < MIN_POINTS_FALLBACK:
        sparse_data_mode = True
        avg_teu = np.mean([r["booked_teu"] for r in teu_records]) if teu_records else 0

        now = datetime.now()
        forecasts = []
        for i in range(horizon_months):
            month_num = (now.month + i) % 12 + 1
            year = now.year + (now.month + i) // 12
            forecasts.append(ForecastPoint(
                month=f"{year}-{month_num:02d}",
                forecast_teu=round(float(avg_teu), 1),
                lower_bound=round(float(avg_teu * 0.5), 1),
                upper_bound=round(float(avg_teu * 1.5), 1),
            ))

        reason_codes.extend(["INSUFFICIENT_HISTORY", "USING_AVERAGE_FALLBACK"])
        return ForecastResponse(
            customer_id=customer_id,
            model_used="average_fallback",
            confidence_label="LOW",
            sparse_data_mode=True,
            forecasts=forecasts,
            seasonal_pattern={"Q1": 50.0, "Q2": 50.0, "Q3": 50.0, "Q4": 50.0},
            trend_direction="STABLE",
            reason_codes=reason_codes,
        )

    # ── Build StatsForecast DataFrame ─────────────────────────────────────
    df = _build_sf_dataframe(teu_records)

    # ── Select model based on data density ────────────────────────────────
    if n_records >= MIN_POINTS_FULL_MODEL:
        models = [AutoETS(season_length=12)]
        model_name = "auto_ets"
        confidence = "HIGH"
        reason_codes.append("FULL_MODEL_FIT")
    else:
        models = [SeasonalNaive(season_length=min(n_records, 4))]
        model_name = "seasonal_naive"
        confidence = "MEDIUM"
        sparse_data_mode = True
        reason_codes.extend(["SPARSE_DATA", "USING_SEASONAL_NAIVE"])

    # ── Fit and forecast ──────────────────────────────────────────────────
    try:
        sf = StatsForecast(models=models, freq="MS", n_jobs=1)
        sf.fit(df)
        forecast_df = sf.predict(h=horizon_months, level=[80])

        forecasts = []
        for _, row in forecast_df.iterrows():
            month_str = row["ds"].strftime("%Y-%m")
            col = forecast_df.columns[1]  # model column
            lo_col = [c for c in forecast_df.columns if "lo" in c.lower()]
            hi_col = [c for c in forecast_df.columns if "hi" in c.lower()]

            point = float(row[col])
            lower = float(row[lo_col[0]]) if lo_col else point * 0.8
            upper = float(row[hi_col[0]]) if hi_col else point * 1.2

            forecasts.append(ForecastPoint(
                month=month_str,
                forecast_teu=round(max(point, 0), 1),
                lower_bound=round(max(lower, 0), 1),
                upper_bound=round(max(upper, 0), 1),
            ))

    except Exception as e:
        logger.warning("Model fit failed for %s: %s — falling back to naive", customer_id, e)
        reason_codes.append("MODEL_FIT_FAILED")
        model_name = "naive_fallback"
        confidence = "LOW"
        sparse_data_mode = True

        last_values = df["y"].tail(3).tolist()
        avg = float(np.mean(last_values))
        now = datetime.now()
        forecasts = []
        for i in range(horizon_months):
            month_num = (now.month + i) % 12 + 1
            year = now.year + (now.month + i) // 12
            forecasts.append(ForecastPoint(
                month=f"{year}-{month_num:02d}",
                forecast_teu=round(avg, 1),
                lower_bound=round(avg * 0.6, 1),
                upper_bound=round(avg * 1.4, 1),
            ))

    # ── Derive insights ───────────────────────────────────────────────────
    trend = _detect_trend(df["y"].tolist())
    seasonal = _compute_seasonal_indices(df)

    if trend == "GROWING":
        reason_codes.append("UPWARD_TREND_DETECTED")
    elif trend == "DECLINING":
        reason_codes.append("DOWNWARD_TREND_DETECTED")

    peak_quarter = max(seasonal, key=seasonal.get)  # type: ignore[arg-type]
    if seasonal[peak_quarter] > 70:
        reason_codes.append(f"SEASONAL_PEAK_{peak_quarter}")

    return ForecastResponse(
        customer_id=customer_id,
        model_used=model_name,
        confidence_label=confidence,
        sparse_data_mode=sparse_data_mode,
        forecasts=forecasts,
        seasonal_pattern=seasonal,
        trend_direction=trend,
        reason_codes=reason_codes,
    )
