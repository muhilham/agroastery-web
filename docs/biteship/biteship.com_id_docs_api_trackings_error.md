[Skip to main content](https://biteship.com/id/docs/api/trackings/error#docusaurus_skipToContent_fallback)

# Error Codes

Below are the list of Tracking error codes. You can use the 'Code' column and customize based on your platform.

| Method | Endpoint | Code | Message |
| --- | --- | --- | --- |
| GET | /v1/trackings/:id | 40003001 | Failed to retrieve tracking number. |
| GET | /v1/trackings/:id | 40003002 | Courier tracking not available |
| GET | /v1/trackings/:waybill\_id/couriers/:courier\_code |  | No sufficient balance to call tracking API. Please top up your balance |
| GET | /v1/trackings/:waybill\_id/couriers/:courier\_code | 40003001 | Failed to get tracking information. It's either invalid or expired. Please check again |
| GET | /v1/trackings/:waybill\_id/couriers/:courier\_code | 40003003 | Waybill not found. It's either not activated or expired |