# Frontend Acceptance Criteria

1. **Latency Awareness**: Every `POST /predict/*` and `POST /recommend/*` action MUST display a dedicated, non-blocking loading skeleton. The UI must not freeze if the local model takes >3000ms to return an inference.
2. **Explainability Mandate**: No AI score, forecast, or container recommendation can be rendered without an accompanying `ReasonCodeBadge` component attached to it in the UI. 
3. **Data Density**: Tables must use a compact density (max 32px row height) to accommodate B2B workflow scanning.
4. **Sparse Data Awareness**: If an API returns `sparseDataMode: true`, the UI must visibly flag the prediction with a warning icon indicating the reliance on fallback heuristics.
