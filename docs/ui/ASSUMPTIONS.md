# Implementation Assumptions

1. **Async AI**: We assume backend inference is heavily asynchronous. The mock adapters intentionally introduce a 1.5s to 3s delay to enforce correct UI loading state implementation.
2. **Auth Handling**: Authentication is out of scope for this UI contract; we assume a valid JWT is injected into the HTTP client via interceptors.
3. **Chart Tooling**: Recharts is used for its declarative React API, which maps well to the required time-series forecast data.