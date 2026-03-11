# Domain Glossary & Naming Conventions

This is the canonical UI naming convention. Do not deviate.

## Entities & IDs
* `leadId`: Unique identifier for a prospective customer.
* `customerId`: Unique identifier for an active account.
* `segmentId`: Identifier for customer categorization (e.g., Tier 1, RFM segments).
* `regionId` / `countryId`: Geographic identifiers.
* `productCategoryId` / `skuId`: Product hierarchy identifiers.
* `tradeLaneId` / `portId`: Logistics routing identifiers.

## Enums & Core Types
* `forecastHorizon`: `30_DAYS` | `60_DAYS` | `90_DAYS` | `12_MONTHS`
* `seasonalityWindowType`: `MONTHLY` | `QUARTERLY` | `EVENT_DRIVEN`
* `containerType`: `20GP` | [cite_start]`40HC` [cite: 48]
* `recommendationType`: `SINGLE_CONTAINER` | `SPLIT_LOAD` | `MANUAL_REVIEW`
* `confidenceLabel`: `HIGH` | `MEDIUM` | `LOW`
* `sparseDataMode`: `ACTIVE` | `INACTIVE` (Indicates cold-start fallbacks are in use).

## Metric & Output Fields
* `reasonCodes`: Array of strings (e.g., `["VOL_EXCEEDS_40HC", "HIGH_AFFINITY"]`).
* `topDrivers`: Array of strings explaining a score.
* [cite_start]`utilizationPercent`: Float 0.0 to 100.0 representing capacity used[cite: 49].
* `nextBestAction`: Actionable directive string (e.g., `DRAFT_QUOTE`, `CALL_CUSTOMER`).