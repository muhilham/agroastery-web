[Skip to main content](https://biteship.com/id/docs/api/trackings/overview#docusaurus_skipToContent_fallback)

# Overview

# Tracking API Introduction

Tracking objects are created to track sellers’ shipment. You can track your shipment status and history with this endpoint.

Endpoints

```jsx
GET /v1/trackings/:id                                   // tracking created by Biteship
GET /v1/trackings/:waybill_id/couriers/:courier_code    // for public tracking
```