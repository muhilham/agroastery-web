# Biteship API Documentation

> Source: https://biteship.com/id/docs
> Base URL: `https://api.biteship.com`

---

## Table of Contents

1. [Introduction](#introduction)
2. [Get Started](#get-started)
3. [Plan Your Integration](#plan-your-integration)
   - [Partnership](#partnership)
   - [Project Timeline](#project-timeline)
   - [Planning Considerations](#planning-considerations)
4. [Sandbox Environment](#sandbox-environment)
5. [Go Live](#go-live)
   - [API Activation](#api-activation)
   - [Submit Activation Request](#submit-activation-request)
6. [API](#api)
   - [Authentication](#authentication)
   - [Postman Collection](#postman-collection)
   - [API Usage Flow](#api-usage-flow)
   - [Base URL](#base-url)
   - [Issue API Key](#issue-api-key)
   - [Maps](#maps)
     - [Maps Overview](#maps-overview)
     - [Search Area](#search-area)
   - [Rates](#rates)
     - [Rates Overview](#rates-overview)
     - [Retrieve Courier Rates](#retrieve-courier-rates)
     - [Rates Error Codes](#rates-error-codes)
   - [Locations](#locations)
     - [Locations Overview](#locations-overview)
     - [Create a Location](#create-a-location)
     - [Retrieve a Location](#retrieve-a-location)
     - [Update a Location](#update-a-location)
     - [Delete a Location](#delete-a-location)
   - [Draft Orders](#draft-orders)
     - [Draft Orders Overview](#draft-orders-overview)
     - [Create Draft Order](#create-draft-order)
     - [Retrieve Draft Order](#retrieve-draft-order)
     - [Retrieve Draft Order Rates](#retrieve-draft-order-rates)
     - [Update Draft Order](#update-draft-order)
     - [Delete Draft Order](#delete-draft-order)
     - [Confirm Draft Order](#confirm-draft-order)
     - [Draft Orders Error Codes](#draft-orders-error-codes)
   - [Orders](#orders)
     - [Orders Overview](#orders-overview)
     - [Create an Order](#create-an-order)
     - [Retrieve an Order](#retrieve-an-order)
     - [Delete an Order](#delete-an-order)
     - [Orders Error Codes](#orders-error-codes)
   - [Couriers](#couriers)
     - [Couriers Overview](#couriers-overview)
     - [Retrieve Couriers](#retrieve-couriers)
   - [Trackings](#trackings)
     - [Trackings Overview](#trackings-overview)
     - [Retrieve a Tracking](#retrieve-a-tracking)
     - [Retrieve a Public Tracking](#retrieve-a-public-tracking)
     - [Tracking Status](#tracking-status)
     - [Trackings Error Codes](#trackings-error-codes)
   - [Webhook](#webhook)
     - [Webhook Overview](#webhook-overview)
     - [Add Webhook](#add-webhook)
     - [Play Webhook](#play-webhook)
   - [Changelog](#changelog)
7. [Shipping Label](#shipping-label)
8. [Errors](#errors)
9. [Support](#support)

---

## Introduction

Welcome to Biteship, your comprehensive shipping solution for businesses of all sizes. This guide will help you understand our platform and get started with integrating our services into your operations.

### What is Biteship?

Biteship is a powerful shipping API that connects you with multiple carriers, allowing you to streamline your shipping processes, calculate rates, create shipments, and track packages all from one centralized platform.

### Key Features

- **Multi-carrier Integration**: Access a wide range of shipping carriers through a single API.
- **Real-time Rate Calculation**: Get accurate, up-to-date shipping rates for informed decision-making.
- **Shipment Creation and Management**: Easily create and manage shipments with detailed information.
- **Package Tracking**: Keep your customers informed with real-time tracking across multiple carriers.
- **Flexible API**: Seamlessly integrate Biteship into your existing systems and workflows.

### What to Expect

This documentation provides comprehensive information about:
- Setting up your Biteship account
- Integrating our API into your systems
- Managing shipments and carriers
- Troubleshooting common issues
- Best practices for optimal use of our platform

We value our partnership with you and are committed to providing clear, helpful information to ensure your success with Biteship.

> **Note:** While this documentation aims to be as thorough as possible, it is not legally binding.

---

## Get Started

Create an account and learn how to start using Biteship's shipping services.

### Set Up Biteship

- **Activate your account**: Create a Biteship account and start managing shipments or testing right away. [Sign up](https://dashboard.biteship.com/signup)
- **API authentication**: Learn how to authenticate your API requests using your Biteship API key.
- **Manage carriers**: Configure and manage your preferred carriers and shipping options.

### Manage Shipments

- **Calculate shipping rates**: Get real-time shipping rates from various carriers to offer competitive pricing.
- **Create shipments**: Create and manage shipments with detailed information using our Orders API.
- **Track packages**: Keep your customers informed by tracking packages across multiple carriers.

### Plan Your Integration

- **Integration guide**: Follow our integration guide to successfully implement Biteship in your application.
- **Planning considerations**: Understand what decisions you need to make when building your Biteship integration.
- **Test your integration**: Test your integration thoroughly before going live.

### More Resources

- YouTube resources: Watch tutorials and discover new features.
- Support site: Get answers to common questions and troubleshooting tips.
- Need help? Contact Support: support@biteship.com

---

## Plan Your Integration

### Partnership

#### Integration Process

1. Sign up for a Biteship account at the registration page.
2. Complete your profile in the account settings.
3. Familiarize yourself with the API Documentation.
4. Choose your preferred payment method:
   - **Prepaid - Top Up Bitepoints**: Add funds to your wallet for daily transactions.
   - **Postpaid - Monthly Invoicing**: For monthly billing, complete and sign the Monthly Payment Activation form. You'll need to provide:
     - Company Tax ID (NPWP)
     - Business License (SIUP) or Business Identification Number (NIB)
     - Company Deed
5. Ensure you've followed all steps in the Developer Manual before proceeding.

#### Post-Integration Support

**Operational Support**
- Biteship provides dedicated communication channels (WhatsApp or Slack) for operational support.
- Support team available Monday to Sunday, 09:00 - 18:00 local time.
- For urgent matters outside these hours, response times may be slower.

**Ticket System**
- Use the ticket feature at https://dashboard.biteship.com/tickets for structured support.

**Service Level Agreement (SLA)**
- Details regarding lost or damaged goods, compensation, and other operational matters are outlined in our Cooperation Agreement (PKS).

---

### Project Timeline

Biteship integration can take 1 week to 2 months, depending on your business complexity.

| Phase | Duration | Activities |
|-------|----------|------------|
| Planning and Setup | 1 Week | Create account, review API docs, define requirements, set up sandbox environment |
| Core Integration | 2–4 Weeks | Implement authentication, integrate shipping rate calculations, add order creation, set up webhook handling |
| Advanced Features | 1–2 Weeks | Implement tracking updates, set up error handling and logging |
| Testing and Refinement | 1–2 Weeks | Prepare shipping labels, test via activation form |
| Launch Preparation | 1–2 Weeks | Final testing, prepare customer support materials, plan rollout strategy, set up monitoring |
| Go Live and Support | 1 Week | Launch integration, monitor performance, provide customer support, gather feedback |

---

### Planning Considerations

#### Integration Approach
- **API Integration**: Offers the most flexibility and control, allowing you to build a custom shipping experience.
- **Plugin or API**: If available, can provide a quicker integration process with pre-built components.

#### Shipping Workflow
- **Maps Configuration**: How will you configure the maps for your users?
- **Rate Calculation**: Will you use real-time rates or flat rates?
- **Courier Selection**: How will you select the courier?
- **Order Creation**: How will you capture shipping details?
- **Label Generation**: When in the process will you generate shipping labels?
- **Tracking**: How will you provide tracking information to customers?
- **Returns**: How will you handle returns?

#### Data Requirements
- Origin and destination addresses
- Package dimensions and weight
- Item details for customs (for international shipments)
- Any special handling instructions

#### User Experience
- Will you offer multiple carrier options?
- How will you display shipping rates and estimated delivery times?
- Where will tracking information be accessible to your customers?

#### Testing and Sandbox Environment
- Test API integrations without creating real shipments
- Simulate various shipping scenarios and edge cases
- Ensure error handling is robust

#### Security Considerations
- Securely store and manage API keys
- Use HTTPS for all API communications
- Implement proper authentication for user actions

#### Compliance and Regulations
- Understand prohibited items and restrictions
- Comply with shipping requirements
- Adhere to data protection laws (e.g., GDPR if applicable)

#### Scalability
- Ensure your integration can handle increased shipping volume
- Consider how you'll manage peak periods or seasonal spikes

---

## Sandbox Environment

### About the Sandbox

The sandbox environment is a safe testing space that mimics the production environment. It allows you to:
- Test API integrations without creating real shipments
- Validate your implementation logic
- Simulate various shipping scenarios
- Test error handling

### Getting Started with Sandbox

1. Sign up for a Biteship account.
2. Navigate to the API section in your dashboard.
3. Activate the sandbox environment by clicking the "Mode Testing" toggle in the sidebar.
4. Generate a sandbox API key.
5. Use this key for all your test API calls.

### Sandbox vs Production

| Feature | Sandbox | Production |
|---------|---------|------------|
| Maps API | Paid* | Paid |
| Rates API | Paid* | Paid |
| Order API | Simulated | Real shipments |
| Tracking API | Paid* | Paid |

> *Since Maps, Rates and Tracking are GET methods, real data is provided in sandbox environment, therefore it is considered as paid usage. Please contact support for more information.

### Testing Guidelines

- Test All API Endpoints: Rate calculations, order creation, tracking, label generation
- Simulate Edge Cases: Invalid addresses, out-of-range weights, missing required fields, error responses
- Verify Integration Logic: Rate display, order flow, error handling, user notifications

### Best Practices

- Keep sandbox API keys separate from production
- Test with realistic data scenarios
- Implement proper error handling
- Monitor API response times
- Document all test cases and results

---

## Go Live

### API Activation

Before you begin the activation process, ensure that you have:
1. Completed all necessary integration testing in the sandbox environment.
2. Reviewed and agreed to Biteship's terms of service.
3. Filled out the activation form with the correct information.

---

### Submit Activation Request

#### Activation Steps

1. Navigate to the Biteship dashboard integration page at [Integration Page](https://dashboard.biteship.com/integrations).
2. Go to **API Settings** section.
3. Click on **"Aktivasi Order API"** to start activation process.
4. Choose the key you want to activate.
5. Select the courier you want to activate.
6. Copy your Test Order ID and input it in the form.
7. Add the required information carefully.
8. If you choose to use your own shipping label, upload the label in the correct format.
9. Click the **"Kirim Data Aktivasi API"** button to submit your activation request.
10. Once approved, a success message will appear.
11. Check your API order status — it should change to **"Aktif"**.

#### Post-Activation Support

After going live, Biteship support is available every day from 09:00 to 18:00.

#### Security Reminder

Always keep your API keys secure and never share them publicly.

---

## API

### Authentication

HTTP requests to the REST API are protected with HTTP Basic authentication. You will use your Auth Token as the password for HTTP Basic authentication with Biteship.

> **Note:** Biteship Auth Tokens have `biteship_live.` or `biteship_test.` as a prefix.
```bash
curl --request POST \
  --url https://api.biteship.com/v1/rates/couriers \
  --header 'authorization: <<YOUR_API_KEY>>' \
  --header 'content-type: application/json'
```

#### Generate New API Key

1. Go to [Biteship Dashboard Integrations](https://dashboard.biteship.com/integrations) and click **"Pengaturan"**.
2. Click **"Tambah Kunci API"** to generate a new API key.
3. Name your API Key when prompted.
4. The API key is shown only once — save it securely.
5. Note: Your Order API will not be active yet. You need to submit an activation request.

#### Key for Testing

- Activate the **"Testing Mode"** toggle in the sidebar.
- Follow the same process to generate your testing API key.
- For Testing Mode, your Order API is active by default.

#### Authentication Error Codes

| Code | Message |
|------|---------|
| 40000001 | Authentication for your key has failed. Please make sure to input the right key or contact support@biteship.com. |
| 40101001 | Authorization failed |
| 40101002 | No account found with associated key |
| 40101003 | Cannot process authorization |
| 40301001 | There's no match token for this key |
| 40301002 | User information not found |

---

### Postman Collection

To make testing easier, you can use the Postman collection for Biteship API.

#### Setup Steps

1. **Download the Postman Collection**: Download from the Biteship docs page.
2. **Set Up Postman Environment**:
   - Open Postman and create a new environment.
   - Set the environment variable `url` to `https://api.biteship.com`.
   - Set the environment variable `authorization` to your API key.
3. **Testing the API**: Use the Postman collection to test various endpoints.

---

### API Usage Flow

Please follow the steps in the documentation to get started with the Biteship API. The general flow is:
1. Authenticate using your API key.
2. Use Maps API to get area IDs.
3. Use Rates API to retrieve courier pricing.
4. Create an Order (or Draft Order).
5. Track the shipment using Trackings API.
6. Receive real-time updates via Webhooks.

---

### Base URL

All URLs referenced in the API documentation have the following base:
```
https://api.biteship.com
```

This REST API is served over HTTPS. Unencrypted HTTP is not supported.

The API key you use to authenticate the request determines whether the request is live mode or test mode.

---

### Issue API Key

The Biteship API uses API keys to authenticate requests. You can view and manage your API keys in the Biteship Dashboard.

- Do not share your secret API keys in publicly accessible areas such as GitHub or client-side code.
- Authentication is performed via HTTP Basic Auth. Provide your API key as the basic auth username value. No password is needed.
- All API requests must be made over HTTPS.

---

## Maps

### Maps Overview

Biteship provides a Maps API to ease and standardize location names.

#### Endpoints
```
GET /v1/maps/areas
```

With the Maps API, you can query specific areas, cities, or districts within a selected country.

---

### Search Area

#### Endpoint
```
GET /v1/maps/areas
```

This API returns the name of areas matching your input. The autocomplete helps find areas efficiently.

> **Tip:** Please trigger your call function after the user has done writing. Otherwise it will slow down your response due to multiple calls.

#### Example Request
```
GET /v1/maps/areas?countries=ID&input=Jakarta+Selatan&type=single
```

#### Query Parameters

| Parameter | Description |
|-----------|-------------|
| `countries` | Country code (e.g., `ID` for Indonesia) |
| `input` | The search input string |
| `type` | Search type (e.g., `single`) |

#### Response
```json
{
  "success": true,
  "areas": [
    {
      "id": "IDNP6IDNC148IDND843IDZ12250",
      "name": "Pesanggrahan, Jakarta Selatan, DKI Jakarta. 12250",
      "country_name": "Indonesia",
      "country_code": "ID",
      "administrative_division_level_1_name": "DKI Jakarta",
      "administrative_division_level_1_type": "province",
      "administrative_division_level_2_name": "Jakarta Selatan",
      "administrative_division_level_2_type": "city",
      "administrative_division_level_3_name": "Pesanggrahan",
      "administrative_division_level_3_type": "district",
      "postal_code": 12250
    },
    {
      "id": "IDNP6IDNC148IDND843IDZ12260",
      "name": "Pesanggrahan, Jakarta Selatan, DKI Jakarta. 12260",
      "country_name": "Indonesia",
      "country_code": "ID",
      "administrative_division_level_1_name": "DKI Jakarta",
      "administrative_division_level_1_type": "province",
      "administrative_division_level_2_name": "Jakarta Selatan",
      "administrative_division_level_2_type": "city",
      "administrative_division_level_3_name": "Pesanggrahan",
      "administrative_division_level_3_type": "district",
      "postal_code": 12260
    }
  ]
}
```

---

## Rates

### Rates Overview

Rates API helps you browse multiple logistic options based on coordinates, area ID, or postal codes.

#### Endpoints
```
POST /v1/rates/couriers  // by coordinates
POST /v1/rates/couriers  // by postal codes
POST /v1/rates/couriers  // by area id
POST /v1/rates/couriers  // by mix
POST /v1/rates/couriers  // by type
```

---

### Retrieve Courier Rates

#### Endpoint
```
POST /v1/rates/couriers
```

#### API Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `origin_area_id` | string | OPTIONAL/REQUIRED | Origin area ID from Maps API |
| `destination_area_id` | string | OPTIONAL/REQUIRED | Destination area ID from Maps API |
| `origin_latitude` | number | OPTIONAL/REQUIRED | Origin latitude |
| `origin_longitude` | number | OPTIONAL/REQUIRED | Origin longitude |
| `destination_latitude` | number | OPTIONAL/REQUIRED | Destination latitude |
| `destination_longitude` | number | OPTIONAL/REQUIRED | Destination longitude |
| `origin_postal_code` | number | OPTIONAL/REQUIRED | Origin postal code |
| `destination_postal_code` | number | OPTIONAL/REQUIRED | Destination postal code |
| `type` | string | Optional | `origin_suggestion_to_closest_destination` — auto-selects nearest location |
| `couriers` | string | REQUIRED | Comma-separated list of courier codes |
| `items` | array | REQUIRED | List of items to ship |
| `courier_insurance` | number | Optional | Insurance value amount |
| `destination_cash_on_delivery` | number | Optional | COD amount (max IDR 15,000,000) |
| `destination_cash_on_delivery_type` | string | Optional | `7_days`, `5_days`, or `3_days` |

#### Items Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `items.name` | string | REQUIRED | Name of the package |
| `items.description` | string | Optional | Description of the package |
| `items.category` | string | Optional | Category (see category table below) |
| `items.sku` | string | Optional | Item SKU |
| `items.value` | number | REQUIRED | Value of the item |
| `items.quantity` | number | REQUIRED | Quantity of the item |
| `items.weight` | number | REQUIRED | Weight in grams |
| `items.height` | number | Optional | Height in centimeters |
| `items.length` | number | Optional | Length in centimeters |
| `items.width` | number | Optional | Width in centimeters |

#### Item Categories

| Value | Description |
|-------|-------------|
| `fashion` | Clothing, accessories, and personal adornments |
| `healthcare` | Products related to health, wellness, and personal care |
| `food_and_drink` | Food and beverages (important for instant delivery) |
| `electronic` | Electronic devices and accessories |
| `beauty` | Beauty products and cosmetics |
| `outdoor_gear` | Equipment and apparel for outdoor activities |
| `home_accessories` | Items that enhance the decor and functionality of the home |
| `hobby` | Products related to leisure and hobbies |
| `collection` | Items that belong to a particular collection or set |
| `sparepart` | Replacement parts and accessories |
| `groceries` | Food and household items for regular consumption |
| `frozen_food` | Food items preserved by freezing |
| `others` | Miscellaneous items (default) |

#### Types of Requests

**Rates by Coordinates** (Accuracy: Low)
- Best for instant couriers (Gojek, Grab, Paxel, Lalamove, Borzo)
- Can be used for both instant and standard delivery
```json
{
  "origin_latitude": -6.3031123,
  "origin_longitude": 106.7794934999,
  "destination_latitude": -6.2441792,
  "destination_longitude": 106.783529,
  "couriers": "grab,jne,tiki",
  "items": [
    {
      "name": "Shoes",
      "description": "Black colored size 45",
      "value": 199000,
      "length": 30,
      "width": 15,
      "height": 20,
      "weight": 200,
      "quantity": 2
    }
  ]
}
```

**Rates by Postal Code** (Accuracy: Medium)
```json
{
  "origin_postal_code": 12440,
  "destination_postal_code": 12240,
  "couriers": "anteraja,jne,sicepat",
  "items": [
    {
      "name": "Shoes",
      "description": "Black colored size 45",
      "value": 199000,
      "length": 30,
      "width": 15,
      "height": 20,
      "weight": 200,
      "quantity": 2
    }
  ]
}
```

**Rates by Area ID** (Accuracy: High)
- Area ID uses district as its lowest area level
- Cannot show instant delivery services
```json
{
  "origin_area_id": "IDNP6IDNC148IDND836IDZ12410",
  "destination_area_id": "IDNP6IDNC148IDND836IDZ12430",
  "couriers": "paxel,jne,sicepat",
  "items": [{ "name": "Shoes", "value": 199000, "length": 30, "width": 15, "height": 20, "weight": 200, "quantity": 2 }]
}
```

**Rates by Mix**
```json
{
  "origin_postal_code": 12440,
  "destination_latitude": -6.2441792,
  "destination_longitude": 106.783529,
  "couriers": "paxel,jne,sicepat",
  "items": [{ "name": "Shoes", "value": 199000, "length": 30, "width": 15, "height": 20, "weight": 200, "quantity": 2 }]
}
```

**Rates by Type**
```json
{
  "type": "origin_suggestion_to_closest_destination",
  "destination_latitude": -6.2441792,
  "destination_longitude": 106.783529,
  "couriers": "paxel,jne,sicepat",
  "items": [{ "name": "Shoes", "value": 199000, "length": 30, "width": 15, "height": 20, "weight": 200, "quantity": 2 }]
}
```

**Rates with Insurance Fee**
```json
{
  "origin_postal_code": 12440,
  "destination_postal_code": 12240,
  "couriers": "sicepat,jne",
  "courier_insurance": 199000,
  "items": [{ "name": "Shoes", "value": 199000, "length": 30, "width": 15, "height": 20, "weight": 200, "quantity": 1 }]
}
```

**Rates with COD Fee**
```json
{
  "origin_postal_code": 12440,
  "destination_postal_code": 12240,
  "couriers": "sicepat,jne",
  "destination_cash_on_delivery": 199000,
  "destination_cash_on_delivery_type": "7_days",
  "items": [{ "name": "Shoes", "value": 199000, "length": 30, "width": 15, "height": 20, "weight": 200, "quantity": 1 }]
}
```

#### API Response

> If you have an active Custom Rate, the pricing response will have an extra field: `shipping_fee_discount` or `shipping_fee_surcharge`. The `price` field is the final price after applying all adjustments.
```json
{
  "success": true,
  "object": "courier_pricing",
  "message": "Success to retrieve courier pricing",
  "code": 20001007,
  "origin": {
    "location_id": "5dad2bf246d52d72b87378f6",
    "latitude": -6.3031123,
    "longitude": 106.7794934999,
    "postal_code": 12440,
    "country_name": "Indonesia",
    "country_code": "ID",
    "administrative_division_level_1_name": "DKI Jakarta",
    "administrative_division_level_1_type": "province",
    "administrative_division_level_2_name": "Jakarta Selatan",
    "administrative_division_level_2_type": "city",
    "administrative_division_level_3_name": "Cilandak",
    "administrative_division_level_3_type": "district"
  },
  "destination": { "...": "..." },
  "pricing": [
    {
      "available_collection_method": ["pickup"],
      "available_for_cash_on_delivery": true,
      "available_for_proof_of_delivery": true,
      "available_for_instant_waybill_id": true,
      "available_for_insurance": false,
      "company": "jne",
      "courier_name": "JNE",
      "courier_code": "jne",
      "courier_service_name": "City to City (CTC)",
      "courier_service_code": "ctc",
      "currency": "IDR",
      "description": "Pengiriman city to city",
      "duration": "2 - 3 days",
      "shipment_duration_range": "2 - 3",
      "shipment_duration_unit": "days",
      "service_type": "standard",
      "shipping_type": "parcel",
      "shipping_fee": 9000,
      "shipping_fee_discount": 0,
      "shipping_fee_surcharge": 0,
      "insurance_fee": 0,
      "cash_on_delivery_fee": 2000,
      "price": 11000,
      "tax_lines": [],
      "type": "ctc"
    }
  ]
}
```

---

### Rates Error Codes

| Method | Endpoint | Code | Message |
|--------|----------|------|---------|
| POST | /v1/rates/couriers | 40001001 | Failed due to invalid or not available postal code. |
| POST | /v1/rates/couriers | 40001002 | Get pricing failed caused by missing parameter(s). |
| POST | /v1/rates/couriers | 40001010 | No courier available for requested location. |

---

## Locations

### Locations Overview

Location API lets you create, edit, and delete your location list data directly through an API call.

#### Endpoints
```
POST   /v1/locations
GET    /v1/locations/:id
POST   /v1/locations/:id
DELETE /v1/locations/:id
```

---

### Create a Location

#### Endpoint
```
POST /v1/locations
```

Creates a location saved in Biteship's dashboard under the Address Page. The location can be used for future shipments.

#### API Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | REQUIRED | The name of the location |
| `contact_name` | string | REQUIRED | Name of the person in charge (PIC) |
| `contact_phone` | string | REQUIRED | Phone of the PIC |
| `address` | string | REQUIRED | Complete detail of the location address |
| `note` | string | Optional | Additional information (house color, street name, etc.) |
| `postal_code` | string | REQUIRED | Postal code for the location |
| `latitude` | string | REQUIRED | Coordinate latitude |
| `longitude` | string | REQUIRED | Coordinate longitude |
| `type` | string | REQUIRED | `origin` or `destination` |

#### Request Body
```json
{
  "name": "Apotik Gambir",
  "contact_name": "Ahmad",
  "contact_phone": "08123456789",
  "address": "Jl. Gambir Selatan no 5. Blok F 92. Jakarta Pusat.",
  "note": "Dekat tulisan warung Bu Indah",
  "postal_code": 10110,
  "latitude": -6.232123121,
  "longitude": 102.22189911,
  "type": "origin"
}
```

#### Response
```json
{
  "success": true,
  "id": "61d565c69a3211036a05f3f8",
  "name": "Apotek Gambir",
  "contact_name": "Ahmad",
  "contact_phone": "08123456789",
  "address": "Jl. Gambir Selatan no 5. Blok F 92. Jakarta Pusat."
}
```

---

### Retrieve a Location

#### Endpoint
```
GET /v1/locations/:id
```

#### Response
```json
{
  "success": true,
  "id": "61d565c69a3211036a05f3f8",
  "name": "Apotek Gambir",
  "contact_name": "Ahmad",
  "contact_phone": "08123456789",
  "address": "Jl. Gambir Selatan no 5. Blok F 92. Jakarta Pusat."
}
```

---

### Update a Location

#### Endpoint
```
POST /v1/locations/:id
```

You can edit your existing location by sending only the fields you want to change.

#### Request Body
```json
{
  "name": "Apotik Monas"
}
```

#### Response
```json
{
  "success": true,
  "id": "61d565c69a3211036a05f3f8",
  "name": "Apotek Monas",
  "contact_name": "Ahmad",
  "contact_phone": "08123456789",
  "address": "Jl. Gambir Selatan no 5. Blok F 92. Jakarta Pusat."
}
```

---

### Delete a Location

#### Endpoint
```
DELETE /v1/locations/:id
```

#### Response
```json
{
  "success": true,
  "id": "61d565c69a3211036a05f3f8",
  "message": "Location successfully been removed"
}
```

---

## Draft Orders

### Draft Orders Overview

Draft Order API allows users to save an order before moving forward to order creation. Draft order becomes an order after it is confirmed using the Confirm Draft Order API.

Unlike Order API, Draft Order API allows you to change order details including the courier service. Biteship will not create a waybill while the order is still in draft.

#### Endpoints
```
POST   /v1/draft_orders
GET    /v1/draft_orders/:id
GET    /v1/draft_orders/:id/rates
POST   /v1/draft_orders/:id
DELETE /v1/draft_orders/:id
POST   /v1/draft_orders/:id/confirm
```

#### Draft Order Status Flow

| No | Status | Description | Available to Delete |
|----|--------|-------------|---------------------|
| 1 | `placed` | Draft order just placed, cannot be confirmed | ✅ |
| 2 | `ready` | Courier has been set, ready to confirm | ✅ |
| 3 | `confirmed` | Draft order confirmed and order created | ❌ |

---

### Create Draft Order

#### Endpoint
```
POST /v1/draft_orders
```

You can create a draft order without specifying courier information. You won't be charged until the draft order is confirmed.

#### Key API Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `origin_contact_name` | string | REQUIRED | Name of person at pickup location |
| `origin_contact_phone` | string | REQUIRED | Phone at pickup location |
| `origin_address` | string | REQUIRED | Complete pickup address |
| `origin_postal_code` | number | *REQUIRED/OPTIONAL | Postal code of pickup location |
| `origin_coordinate` | object | *REQUIRED/OPTIONAL | Coordinates of pickup location |
| `destination_contact_name` | string | REQUIRED | Name at destination |
| `destination_contact_phone` | string | REQUIRED | Phone at destination |
| `destination_address` | string | REQUIRED | Complete destination address |
| `destination_postal_code` | number | *REQUIRED/OPTIONAL | Postal code of destination |
| `destination_coordinate` | object | *REQUIRED/OPTIONAL | Coordinates of destination |
| `courier_company` | string | Optional | Shipping provider |
| `courier_type` | string | Optional | Courier service type |
| `delivery_type` | string | REQUIRED | `now` or `scheduled` |
| `items` | array | REQUIRED | List of items |
| `reference_id` | string | Optional | Your internal order ID (must be unique) |
| `destination_cash_on_delivery` | number | Optional | COD amount |
| `destination_cash_on_delivery_type` | string | Optional | `7_days`, `5_days`, or `3_days` |
| `courier_insurance` | number | Optional | Insurance value |
| `metadata` | object | Optional | Any internal data |
| `tags` | array | Optional | Custom tags |

> Origin and destination must have at least one of: postal codes, coordinates, or area IDs.

#### Request Body (Without Courier)
```json
{
  "origin_contact_name": "Amir",
  "origin_contact_phone": "081234567890",
  "origin_address": "Plaza Senayan, Jalan Asia Afrik...",
  "origin_note": "Deket pintu masuk STC",
  "origin_postal_code": 12440,
  "destination_contact_name": "John Doe",
  "destination_contact_phone": "088888888888",
  "destination_contact_email": "johndoe@example.com",
  "destination_address": "Lebak Bulus MRT...",
  "destination_postal_code": 12950,
  "destination_note": "Near the gas station",
  "delivery_type": "now",
  "order_note": "Please be careful",
  "items": [
    {
      "name": "Black L",
      "description": "White Shirt",
      "category": "fashion",
      "value": 165000,
      "quantity": 1,
      "height": 10,
      "length": 10,
      "weight": 200,
      "width": 10
    }
  ]
}
```

#### Request Body (With Courier)
```json
{
  "origin_contact_name": "Amir",
  "origin_contact_phone": "081234567890",
  "origin_address": "Plaza Senayan, Jalan Asia Afrik...",
  "origin_postal_code": 12440,
  "destination_contact_name": "John Doe",
  "destination_contact_phone": "088888888888",
  "destination_address": "Lebak Bulus MRT...",
  "destination_postal_code": 12950,
  "courier_company": "sicepat",
  "courier_type": "reg",
  "delivery_type": "now",
  "items": [{ "name": "Black L", "value": 165000, "quantity": 1, "height": 10, "length": 10, "weight": 200, "width": 10 }]
}
```

---

### Retrieve Draft Order

#### Endpoint
```
GET /v1/draft_orders/:id
```

Returns full draft order information including origin, destination, courier, items, status, and pricing.

---

### Retrieve Draft Order Rates

#### Endpoint
```
GET /v1/draft_orders/:id/rates
```

Returns available courier rates for the draft order. Use this to select a courier before confirming.

---

### Update Draft Order

#### Endpoint
```
POST /v1/draft_orders/:id
```

You can update the draft order as long as it is not yet confirmed. Use this to set the courier, update addresses, change items, etc.

Setting `courier_company` and `courier_type` will automatically update the draft order status to `ready`.

#### Set Courier Example
```json
{
  "courier_company": "sicepat",
  "courier_type": "reg"
}
```

#### Set Coordinates Example
```json
{
  "origin_coordinate": {
    "latitude": -6.1751,
    "longitude": 106.8650
  },
  "destination_coordinate": {
    "latitude": -6.2115,
    "longitude": 106.8452
  }
}
```

---

### Delete Draft Order

#### Endpoint
```
DELETE /v1/draft_orders/:id
```

Removes the draft order permanently. Once deleted, it cannot be reactivated. A new draft order must be created.

---

### Confirm Draft Order

#### Endpoint
```
POST /v1/draft_orders/:id/confirm
```

Confirms a draft order when its status is `ready`. Creates a new Order with the same `reference_id`. The response `id` is the new order's ID — continue the flow using the Order API.

---

### Draft Orders Error Codes

# Error Codes

Below are the list of Draft Order error codes. You can use the 'Code' column and customize based on your platform.

| Method | Endpoint | Code | Message |
| --- | --- | --- | --- |
| DELETE | /v1/draft\_orders/:id | 42211006 | Draft order with 'id=$DRAFT\_ORDER\_ID' has been confirmed. |
| GET | /v1/draft\_orders/:id | 40411007 | Draft order with 'id=$DRAFT\_ORDER\_ID' is not found. |
| GET | /v1/draft\_orders/:id/rates | 40011001 | Bad request. |
| GET | /v1/draft\_orders/:id/rates | 40411007 | Draft order with 'id=$DRAFT\_ORDER\_ID' is not found. |
| GET | /v1/draft\_orders/:id/rates | 42211006 | Draft order with 'id=$DRAFT\_ORDER\_ID' has been confirmed. |
| POST | /v1/draft\_orders | 40011001 | Bad request. |
| POST | /v1/draft\_orders | 42211009 | Invoice with 'number=$INVOICE\_NUMBER' has been paid. |
| POST | /v1/draft\_orders | 42211010 | '$CASH\_ON\_DELIVERY\_TYPE' is not a valid cash on delivery type. |
| POST | /v1/draft\_orders | 42211011 | Cash on delivery amount cannot exceed Rp 15.000.000,- |
| POST | /v1/draft\_orders | 42211012 | Cash on delivery for '$COURIER\_COMPANY' is not available for this account. |
| POST | /v1/draft\_orders | 42211013 | Postal code '$POSTAL\_CODE' is not registered. |
| POST | /v1/draft\_orders | 42211015 | Reference ID '${reference\_id}' is already taken. |
| POST | /v1/draft\_orders/:id | 40011001 | Bad request. |
| POST | /v1/draft\_orders/:id | 40411007 | Draft order with 'id=$DRAFT\_ORDER\_ID' is not found. |
| POST | /v1/draft\_orders/:id | 42211006 | Draft order with 'id=$DRAFT\_ORDER\_ID' has been confirmed. |
| POST | /v1/draft\_orders/:id | 42211009 | Invoice with 'number=$INVOICE\_NUMBER' has been paid. |
| POST | /v1/draft\_orders/:id | 42211010 | '$CASH\_ON\_DELIVERY\_TYPE' is not a valid cash on delivery type. |
| POST | /v1/draft\_orders/:id | 42211011 | Cash on delivery amount cannot exceed Rp 15.000.000,- |
| POST | /v1/draft\_orders/:id | 42211012 | Cash on delivery for '$COURIER\_COMPANY' is not available for this account. |
| POST | /v1/draft\_orders/:id | 42211013 | Postal code '$POSTAL\_CODE' is not registered. |
| POST | /v1/draft\_orders/:id/confirm | 40011001 | Bad request. |
| POST | /v1/draft\_orders/:id/confirm | 40411007 | Draft order with 'id=$DRAFT\_ORDER\_ID' is not found. |
| POST | /v1/draft\_orders/:id/confirm | 42211008 | Draft order with 'id=$DRAFT\_ORDER\_ID' is not ready to be confirmed for it is on $DRAFT\_ORDER\_STATUS status. |





---------------


### Orders

# Order API Introduction

Order objects are created to handle sellers’ shipments. You can create, retrieve, update, and cancel individual orders. Orders are identified by a unique, random ID

Endpoints

```jsx
POST    /v1/orders
GET     /v1/orders/:id
POST    /v1/orders/:id
POST    /v1/orders/:id/cancel
DELETE  /v1/orders/:id  // deprecated
```

## Status Flow [​](https://biteship.com/id/docs/api/orders/overview\#status-flow "Direct link to heading")

Below is the order flow of general shipment with Biteship

![Biteship Flow Order](https://biteship.com/id/assets/images/biteship_order_flow-c550c24a31b8f03f2b193ac304995cc4.png)

## Order Status [​](https://biteship.com/id/docs/api/orders/overview\#order-status "Direct link to heading")

| No | Status | Description | Available to Delete |
| --- | --- | --- | --- |
| 1 | `confirmed` | Order is ready to be confirmed. AWB has been generated. | ✅ |
| 2 | `scheduled` | Order has been scheduled to be delivered. AWB has been generated. | ✅ |
| 3 | `allocated` | Order has been allocated, courier will pickup the package. | ✅ |
| 4 | `picking_up` | Courier is on the way to pickup the package. (First Mile) | ✅ |
| 5 | `picked` | Package has been picked up by courier. | ❌ |
| 6 | `cancelled` | Order has been cancelled. | ❌ |
| 7 | `on_hold` | Order is on hold for any reason. | ❌ |
| 8 | `dropping_off` | Courier is dropping off the package to the receiver. (Last Mile) | ❌ |
| 9 | `return_in_transit` | Package is on the transit for a return to sender. | ❌ |
| 10 | `returned` | Package has been returned to sender. | ❌ |
| 11 | `rejected` | Order has been rejected. | ❌ |
| 12 | `disposed` | Package has been disposed / destroyed. | ❌ |
| 13 | `courier_not_found` | Cannot find courier for the order. | ❌ |
| 14 | `delivered` | Package has been delivered to the receiver. | ❌ |

## Courier Status Availability [​](https://biteship.com/id/docs/api/orders/overview\#courier-status-availability "Direct link to heading")

For each uniqueness of all courier status, please go to this link **[All Courier Status Availability](https://bit.ly/biteship-courier-status-availability)**



------------


# Create an Order

Endpoint

```jsx
POST /v1/orders
```

To request a new order to be picked up by the courier, you need to create a new order object. Make sure your Biteship Balance is sufficient when making this request. Try to request for invoice payment for more custom ordering.

If your environment is still in Staging, the courier will not pick up your request, though everything else will occur as if in live mode.

## API Parameters [​](https://biteship.com/id/docs/api/orders/create\#api-parameters "Direct link to heading")

shipper\_contact\_namestring

Optional

The name of the shipper.

* * *

shipper\_contact\_phonestring

Optional

The phone number of the shipper.

* * *

shipper\_contact\_emailstring

Optional

The email of the shipper.

* * *

shipper\_organizationstring

Optional

The organization of the shipper.

* * *

origin\_contact\_namestring

REQUIRED

The name of the person in the pickup location.

* * *

origin\_contact\_phonestring

REQUIRED

The phone number of the person in the pickup location.

* * *

origin\_contact\_emailstring

Optional

The email of the person in the pickup location.

* * *

origin\_addressstring

REQUIRED

Complete address of the pickup location.

* * *

origin\_notestring

Optional

Additional information of the pickup location to ease pickup process.

* * *

origin\_postal\_codenumber

\*REQUIRED / OPTIONAL

Postal code of the pickup location.

* * *

origin\_coordinateobject

\*REQUIRED / OPTIONAL

Coordinates of the pickup location. If you use an instant courier, you must use coordinate.**Show child parameters**

**origin\_coordinate.latitude**double

\*REQUIRED / OPTIONAL

Latitude of the pickup location.

* * *

**origin\_coordinate.longitude**double

\*REQUIRED / OPTIONAL

Longitude of the pickup location.

* * *

origin\_area\_idstring

\*REQUIRED / OPTIONAL

Use area\_id from [**Maps API**](https://biteship.com/id/docs/api/maps/overview).

* * *

origin\_location\_idstring

Optional

Use location\_id from [**Locations API**](https://biteship.com/id/docs/api/locations/overview).

* * *

origin\_collection\_methodstring

Optional

Use the **available\_collection\_method** from [**Rates API**](https://biteship.com/id/docs/api/rates/overview). Value can be **pickup**, or **drop\_off**. Default to **pickup**.

**pickup** your package will be picked by courier based on origin that you specify.

**drop\_off** you must drop off the package to the nearest courier agent.

* * *

destination\_contact\_namestring

REQUIRED

The name of the person in destination location.

* * *

destination\_contact\_phonestring

REQUIRED

The phone number of the person in destination location.

* * *

destination\_contact\_emailstring

Optional

The email of the person in destination location.

* * *

destination\_addressstring

REQUIRED

Complete address of the destination location.

* * *

destination\_notestring

Optional

Additional information of the destination location to ease destination process.

* * *

destination\_postal\_codenumber

\*REQUIRED / OPTIONAL

Postal code of the destination location.

* * *

destination\_coordinateobject

\*REQUIRED / OPTIONAL

Coordinates of the destination location. If you use an instant courier, you must use coordinate.**Show child parameters**

**destination\_coordinate.latitude**double

\*REQUIRED / OPTIONAL

Latitude of the destination location.

* * *

**destination\_coordinate.longitude**double

\*REQUIRED / OPTIONAL

Longitude of the destination location.

* * *

destination\_area\_idstring

\*REQUIRED / OPTIONAL

Use area\_id from [**Maps API**](https://biteship.com/id/docs/api/maps/overview).

* * *

destination\_location\_idstring

Optional

Use location\_id from [**Locations API**](https://biteship.com/id/docs/api/locations/overview).

* * *

destination\_cash\_on\_deliverynumber

Optional

State the COD Amount if you want to activate COD delivery.

* * *

destination\_cash\_on\_delivery\_typestring

Optional

The COD disbursement window. Value can be 7\_days, 5\_days, or 3\_days.

**7\_days** you will receiver your money 7 days after the item is delivered.

**5\_days** you will receiver your money 5 days after the item is delivered.

**3\_days** you will receiver your money 3 days after the item is delivered.

* * *

destination\_proof\_of\_deliveryboolean

Optional

Proof of delivery feature.

* * *

destination\_proof\_of\_delivery\_notestring

\*REQUIRED / OPTIONAL

Notes for proof of delivery. It is required if proof of delivery feature is activated.

* * *

courier\_companystring

REQUIRED

Shipping provider that will be used for this particular shipment. List of available courier can be found using [**Couriers API**](https://biteship.com/id/docs/api/couriers/overview).

* * *

courier\_typestring

REQUIRED

Courier type based on the courier company used. Each type can be different for each company. Value of type can be found within the [**Rates API**](https://biteship.com/id/docs/api/rates/overview) and [**Couriers API**](https://biteship.com/id/docs/api/couriers/overview).

* * *

courier\_insurancenumber

Optional

The amount of the insurance value. This is optional if you want to insured your shipment. For example, if your item is valued at IDR 1.000.000, then you should put **1000000** for the value.

* * *

delivery\_typestring

REQUIRED

Type of delivery order is now and scheduled.

**now** will generate waybill instantly and pickup right away.

**scheduled** will generate waybill instantly and pickup based on delivery date and delivery time.

* * *

delivery\_datestring

Optional

The delivery date format: “YYYY-MM-DD”

* * *

delivery\_timestring

Optional

The delivery time format: “HH:mm”

* * *

order\_notestring

Optional

Additional information for the shipment.

* * *

metadataobject

Optional

You can insert any kind of data through this object for internal purposes.

* * *

reference\_idstring

Optional

You can insert your internal order id here. Must unique for each order id.

* * *

tagsarray

Optional

You can insert multiple custom tags (in string) for filtering your orders by tag later on.

* * *

itemsarray

REQUIRED

The list of item you will send for delivery**Show child parameters**

**items.name**string

REQUIRED

Name of your package.

* * *

**items.description**string

Optional

A description of your package. You can share the color, the details or any that help describing your item.

* * *

**items.category**string

Optional

Categorization of your package, **the value must be one of these table value**. If empty, the default value will be **others**

| Value | Description |
| --- | --- |
| fashion | Clothing, accessories, and personal adornments. |
| healthcare | Products related to health, wellness, and personal care. |
| food\_and\_drink | Items related to food and beverages. This category is **important** for instant delivery to ensure the courier assignment and avoid longer pick up & delivery time. |
| electronic | Electronic devices and accessories. |
| beauty | Beauty products and cosmetics. |
| outdoor\_gear | Equipment and apparel for outdoor activities. |
| home\_accessories | Items that enhance the decor and functionality of the home. |
| hobby | Products related to leisure and hobbies. |
| collection | Items that belong to a particular collection or set. |
| sparepart | Replacement parts and accessories. |
| groceries | Food and household items typically purchased for regular consumption. |
| frozen\_food | Food items preserved by freezing, such as frozen meals, meat, vegetables, and desserts. |
| others | Miscellaneous items that don't fit into the other categories. |

* * *

**items.sku**string

Optional

Item SKU if you have one.

* * *

**items.value**number

REQUIRED

The value of the item.

* * *

**items.quantity**number

REQUIRED

The total of the item.

* * *

**items.weight**number

REQUIRED

The weight of the item in grams.

* * *

**items.height**number

Optional

The height of the item in centimeters. Item dimensions can affect the weight of your item which can cause a price different.

* * *

**items.length**number

Optional

The length of the item in centimeters. Item dimensions can affect the weight of your item which can cause a price different.

* * *

**items.width**number

Optional

The width of the item in centimeters. Item dimensions can affect the weight of your item which can cause a price different.

## Type of Request [​](https://biteship.com/id/docs/api/orders/create\#type-of-request "Direct link to heading")

### Order for Standard Couriers [​](https://biteship.com/id/docs/api/orders/create\#order-for-standard-couriers "Direct link to heading")

JSON Body Request

```json
{
  "shipper_contact_name": "Amir",
  "shipper_contact_phone": "088888888888",
  "shipper_contact_email": "biteship@test.com",
  "shipper_organization": "Biteship Org Test",
  "origin_contact_name": "Amir",
  "origin_contact_phone": "088888888888",
  "origin_address": "Plaza Senayan, Jalan Asia Afrik...",
  "origin_note": "Deket pintu masuk STC",
  "origin_postal_code": 12440,
  "destination_contact_name": "John Doe",
  "destination_contact_phone": "088888888888",
  "destination_contact_email": "jon@test.com",
  "destination_address": "Lebak Bulus MRT...",
  "destination_postal_code": 12950,
  "destination_note": "Near the gas station",
  "courier_company": "jne",
  "courier_type": "reg",
  "courier_insurance": 500000,
  "delivery_type": "now",
  "order_note": "Please be careful",
  "metadata": {},
  "items": [\
    {\
      "name": "Black L",\
      "description": "White Shirt",\
      "category": "fashion",\
      "value": 165000,\
      "quantity": 1,\
      "height": 10,\
      "length": 10,\
      "weight": 200,\
      "width": 10\
    }\
  ]
}
```

### Order for Instant Couriers [​](https://biteship.com/id/docs/api/orders/create\#order-for-instant-couriers "Direct link to heading")

JSON Body Request

```json
{
  "shipper_contact_name": "Amir",
  "shipper_contact_phone": "088888888888",
  "shipper_contact_email": "biteship@test.com",
  "shipper_organization": "Biteship Org Test",
  "origin_contact_name": "Amir",
  "origin_contact_phone": "088888888888",
  "origin_address": "Plaza Senayan, Jalan Asia Afrik...",
  "origin_note": "Deket pintu masuk STC",
  "origin_coordinate": {
    "latitude": -6.2253114,
    "longitude": 106.7993735
  },
  "destination_contact_name": "John Doe",
  "destination_contact_phone": "088888888888",
  "destination_contact_email": "jon@test.com",
  "destination_address": "Lebak Bulus MRT...",
  "destination_note": "Near the gas station",
  "destination_coordinate": {
    "latitude": -6.28927,
    "longitude": 106.77492000000007
  },
  "courier_company": "grab",
  "courier_type": "instant",
  "courier_insurance": 500000,
  "delivery_type": "now",
  "order_note": "Please be careful",
  "metadata": {},
  "items": [\
    {\
      "name": "Black L",\
      "description": "White Shirt",\
      "category": "fashion",\
      "category": "fashion",\
      "value": 165000,\
      "quantity": 1,\
      "height": 10,\
      "length": 10,\
      "weight": 200,\
      "width": 10\
    }\
  ]
}
```

### Order for Cash on Delivery [​](https://biteship.com/id/docs/api/orders/create\#order-for-cash-on-delivery "Direct link to heading")

JSON Body Request

```json
{
  "shipper_contact_name": "Amir",
  "shipper_contact_phone": "088888888888",
  "shipper_contact_email": "biteship@test.com",
  "shipper_organization": "Biteship Org Test",
  "origin_contact_name": "Amir",
  "origin_contact_phone": "088888888888",
  "origin_address": "Plaza Senayan, Jalan Asia Afrik...",
  "origin_note": "Deket pintu masuk STC",
  "origin_postal_code": 12440,
  "destination_contact_name": "John Doe",
  "destination_contact_phone": "088888888888",
  "destination_contact_email": "jon@test.com",
  "destination_address": "Lebak Bulus MRT...",
  "destination_note": "Near the gas station",
  "destination_postal_code": 12950,
  "destination_cash_on_delivery": 500000,
  "destination_cash_on_delivery_type": "7_days",
  "courier_company": "sicepat",
  "courier_type": "reg",
  "courier_insurance": 500000,
  "delivery_type": "now",
  "order_note": "Please be careful",
  "metadata": {},
  "items": [\
    {\
      "name": "Black L",\
      "description": "White Shirt",\
      "category": "fashion",\
      "value": 165000,\
      "quantity": 1,\
      "height": 10,\
      "length": 10,\
      "weight": 200,\
      "width": 10\
    }\
  ]
}
```

### Order for Drop Off collection method [​](https://biteship.com/id/docs/api/orders/create\#order-for-drop-off-collection-method "Direct link to heading")

JSON Body Request

```json
{
  "shipper_contact_name": "Amir",
  "shipper_contact_phone": "088888888888",
  "shipper_contact_email": "biteship@test.com",
  "shipper_organization": "Biteship Org Test",
  "origin_contact_name": "Amir",
  "origin_contact_phone": "088888888888",
  "origin_address": "Plaza Senayan, Jalan Asia Afrik...",
  "origin_note": "Deket pintu masuk STC",
  "origin_postal_code": 12440,
  "origin_collection_method": "drop_off",
  "destination_contact_name": "John Doe",
  "destination_contact_phone": "088888888888",
  "destination_contact_email": "jon@test.com",
  "destination_address": "Lebak Bulus MRT...",
  "destination_note": "Near the gas station",
  "destination_postal_code": 12950,
  "courier_company": "sicepat",
  "courier_type": "reg",
  "courier_insurance": 500000,
  "delivery_type": "now",
  "order_note": "Please be careful",
  "metadata": {},
  "items": [\
    {\
      "name": "Black L",\
      "description": "White Shirt",\
      "category": "fashion",\
      "value": 165000,\
      "quantity": 1,\
      "height": 10,\
      "length": 10,\
      "weight": 200,\
      "width": 10\
    }\
  ]
}
```

\*When you send origin and destination value, you must at least choose one type of origin or destination. Origin and destination must at least have postal codes, coordinates or area ids. You do not need to insert all of the three values.

## API Response [​](https://biteship.com/id/docs/api/orders/create\#api-response "Direct link to heading")

### Order Created [​](https://biteship.com/id/docs/api/orders/create\#order-created "Direct link to heading")

Response

```json
{
  "success": true,
  "message": "Order successfully created",
  "object": "order",
  "id": "5dd599ebdefcd4158eb8470b",
  "draft_order_id": null,
  "shipper": {
    "name": "Biteship Indonesia",
    "email": "Biteship@gmail.com",
    "phone": "08123456789",
    "organization": "Biteship"
  },
  "origin": {
    "contact_name": "Akbar",
    "contact_phone": "08123456789",
    "coordinate": {
      "latitude": -6.2253114,
      "longitude": 106.7993735
    },
    "address": "Plaza Senayan, Jalan Asia Afrika, RT.1/RW.3",
    "note": "Deket pintu masuk STC",
    "postal_code": 12440
  },
  "destination": {
    "contact_name": "Bambang",
    "contact_phone": "088888888888",
    "contact_email": "mirsa@biteship.com",
    "address": "Lebak Bulus MRT, Jalan R.A.Kartini",
    "note": "Di deket pintu MRT",
    "proof_of_delivery": {
      "use": false,
      "fee": 0,
      "note": null,
      "link": null
    },
    "cash_on_delivery": {
      "id": "77bb0f60b029822ecb1411da",
      "amount": 500000,
      "amount_currency": "IDR",
      "fee": 20000,
      "fee_currency": "IDR",
      "note": null,
      "type": "7_days"
    },
    "coordinate": {
      "latitude": -6.28927,
      "longitude": 106.77492000000007
    },
    "postal_code": 12950
  },
  "courier": {
    "tracking_id": "6de509ebdefgh4158ij3451c",
    "waybill_id": "WYB-1112223333443",
    "company": "anteraja",
    "name": null,  // Deprecated
    "phone": null, // Deprecated
    "driver_name": null,
    "driver_phone": null,
    "driver_photo_url": null,
    "driver_plate_number": null,
    "type": "reg",
    "link": null,
    "insurance": {
      "amount": 500000,
      "amount_currency": "IDR",
      "fee": 2500,
      "fee_currency": "IDR",
      "note": ""
    },
    "routing_code": null
  },
  "delivery": {
    "datetime": "2029-09-24T12:00+07:00",
    "note": null,
    "type": "now",
    "distance": 9.8,
    "distance_unit": "kilometer"
  },
  "reference_id": null,
  "items": [\
    {\
      "name": "Black L",\
      "description": "Feast/Bangkok'19 Invasion",\
      "sku": null,\
      "value": 165000,\
      "quantity": 1,\
      "length": 10,\
      "width": 10,\
      "height": 10,\
      "weight": 200\
    }\
  ],
  "extra": [],
  "currency": "IDR",
  "tax_lines": [],
  "price": 48000,
  "metadata": {},
  "note": "Please be careful",
  "status": "confirmed"
}
```

### Failed to Create Order due to Reference ID already used [​](https://biteship.com/id/docs/api/orders/create\#failed-to-create-order-due-to-reference-id-already-used "Direct link to heading")

Response

```json
{
  "success": false,
  "error": "Reference id has already been used before. Please input other reference id",
  "code": 40002060,
  "details": {
    "order_id": "660105377589b8dea565208b", // The order that uses given reference id
    "waybill_id": "1028309128390", // The waybill of order that uses given reference id
    "reference_id": "66010548c90b557a9e2dd7a4" // Given reference id
  }
}
```


[Skip to main content](https://biteship.com/id/docs/api/orders/retrieve#docusaurus_skipToContent_fallback)

[![Biteship Logo](https://biteship.com/images/biteship-logo.svg)\\
**DOCS**](https://biteship.com/)

[Sign In](https://dashboard.biteship.com/signin) [Contact Sales](https://biteship.com/en/contact-sales?utm_source=mainsite&utm_medium=organic&utm_term=harga&utm_content=demo-dev-prefooter) [Get Started Free](https://dashboard.biteship.com/signup?utm_source=mainsite&utm_medium=organic&utm_campaign=cekongkir&utm_content=navbar)

- [Introduction](https://biteship.com/id/docs/intro)
- [Get Started](https://biteship.com/id/docs/getting-started)
- [Plan Your Integration](https://biteship.com/id/docs/api/orders/retrieve#)

- [Sandbox Environment](https://biteship.com/id/docs/sandbox)
- [Go Live](https://biteship.com/id/docs/api/orders/retrieve#)

- [API](https://biteship.com/id/docs/api/orders/retrieve#)

  - [Authentication](https://biteship.com/id/docs/api/authentication)
  - [Postman Collection](https://biteship.com/id/docs/api/postman_collection)
  - [API Usage Flow](https://biteship.com/id/docs/api/usage_flow)
  - [Base URL](https://biteship.com/id/docs/api/base_url)
  - [Issue API Key](https://biteship.com/id/docs/api/issue_key)
  - [Maps](https://biteship.com/id/docs/api/orders/retrieve#)

  - [Rates](https://biteship.com/id/docs/api/orders/retrieve#)

  - [Locations](https://biteship.com/id/docs/api/orders/retrieve#)

  - [Draft Orders](https://biteship.com/id/docs/api/orders/retrieve#)

  - [Orders](https://biteship.com/id/docs/api/orders/retrieve#)

    - [Overview](https://biteship.com/id/docs/api/orders/overview)
    - [Create an Order](https://biteship.com/id/docs/api/orders/create)
    - [Retrieve an Order](https://biteship.com/id/docs/api/orders/retrieve)
    - [Delete an Order](https://biteship.com/id/docs/api/orders/delete)
    - [Error Codes](https://biteship.com/id/docs/api/orders/error)
  - [Couriers](https://biteship.com/id/docs/api/orders/retrieve#)

  - [Trackings](https://biteship.com/id/docs/api/orders/retrieve#)

  - [Webhook](https://biteship.com/id/docs/api/orders/retrieve#)

  - [Changelog](https://biteship.com/id/docs/api/changelog)
- [Shipping Label](https://biteship.com/id/docs/shipping_label)
- [Errors](https://biteship.com/id/docs/errors)
- [Support](https://biteship.com/id/docs/support)

- [Home page](https://biteship.com/id/)
- API
- Orders
- Retrieve an Order

# Retrieve an Order

Endpoint

```js
GET /v1/orders/:id
```

Check your order history or tracking by orderId. You can get the Order ID from the Order API request. Please assume all field **Nullable**.

Response

```json
{
  "success": true,
  "message": "Order successfully retrieved",
  "object": "order",
  "id": "5dd599ebdefcd4158eb8470b",
  "draft_order_id": null,
  "short_id": "URf_UO2nY3V",
  "shipper": {
    "name": "Amir",
    "email": "biteship@example.com",
    "phone": "088888888888",
    "organization": "Biteship Org"
  },
  "origin": {
    "contact_name": "Amir",
    "contact_phone": "088888888888",
    "address": "Plaza Senayan, Jalan Asia Afrik...",
    "note": "Deket pintu masuk STC",
    "postal_code": 10270,
    "coordinate": {
      "latitude": -6.2253114,
      "longitude": 106.7993735
    }
  },
  "destination": {
    "contact_name": "John Doe",
    "contact_phone": "088888888888",
    "contact_email": "jon@example.com",
    "address": "Lebak Bulus MRT...",
    "note": "Near the gas station",
    "proof_of_delivery": {
      "use": false,
      "fee": 0,
      "note": null,
      "link": null
    },
    "postal_code": 12310,
    "coordinate": {
      "latitude": -6.28927,
      "longitude": 106.77492000000007
    },
    "cash_on_delivery": {
      "id": null,
      "amount": 0,
      "amount_currency": "IDR",
      "fee": 0,
      "fee_currency": "IDR",
      "note": null,
      "type": null
    }
  },
  "delivery": {
    "datetime": "2023-09-24T12:00+07:00",
    "note": null,
    "type": "now",
    "distance": 15.2,
    "distance_unit": "kilometer"
  },
  "voucher": {
    "id": null,
    "name": null,
    "value": null,
    "type": null
  },
  "courier": {
    "tracking_id": "65ddac3879699035b83dc561",
    "waybill_id": "WYB-1112223333442",
    "company": "jnt",
    "history": [\
      {\
        "service_type": "-",\
        "status": "confirmed",\
        "note": "Order has been confirmed. Locating nearest driver to pickup.",\
        "updated_at": "2021-01-11T14:03:41+07:00"\
      },\
      {\
        "service_type": "-",\
        "status": "allocated",\
        "note": "Courier has been allocated. Waiting to pick up.",\
        "updated_at": "2021-01-11T15:49:25+07:00"\
      }\
    ],
    "link": "https://example.com/10298309123809",
    "name": "John Doe",   // Deprecated
    "phone": "0888888888",  // Deprecated
    "driver_name": "John Doe",
    "driver_phone": "0888888888",
    "driver_photo_url": "https://picsum.photos/200",
    "driver_plate_number": "B 1234 ABC",
    "type": "instant",
    "shipment_fee": 25000,
    "insurance": {
      "amount": 500000,
      "amount_currency": "IDR",
      "fee": 2500,
      "fee_currency": "IDR",
      "note": null
    },
    "routing_code": "123-JKT45A-67"
  },
  "reference_id": null,
  "invoice_id": null,
  "items": [\
    {\
      "name": "Black L",\
      "description": "Feast/Bangkok'19 Invasion",\
      "sku": null,\
      "value": 165000,\
      "quantity": 1,\
      "length": 72,\
      "width": 54,\
      "height": 1,\
      "weight": 200\
    }\
  ],
  "extra": null,
  "metadata": null,
  "tags": [],
  "note": "Please be careful",
  "currency": "IDR",
  "tax_lines": [],
  "price": 27500,
  "status": "allocated",
  "ticket_status": null
}
```


[Skip to main content](https://biteship.com/id/docs/api/orders/retrieve#docusaurus_skipToContent_fallback)

# Retrieve an Order

Endpoint

```js
GET /v1/orders/:id
```

Check your order history or tracking by orderId. You can get the Order ID from the Order API request. Please assume all field **Nullable**.

Response

```json
{
  "success": true,
  "message": "Order successfully retrieved",
  "object": "order",
  "id": "5dd599ebdefcd4158eb8470b",
  "draft_order_id": null,
  "short_id": "URf_UO2nY3V",
  "shipper": {
    "name": "Amir",
    "email": "biteship@example.com",
    "phone": "088888888888",
    "organization": "Biteship Org"
  },
  "origin": {
    "contact_name": "Amir",
    "contact_phone": "088888888888",
    "address": "Plaza Senayan, Jalan Asia Afrik...",
    "note": "Deket pintu masuk STC",
    "postal_code": 10270,
    "coordinate": {
      "latitude": -6.2253114,
      "longitude": 106.7993735
    }
  },
  "destination": {
    "contact_name": "John Doe",
    "contact_phone": "088888888888",
    "contact_email": "jon@example.com",
    "address": "Lebak Bulus MRT...",
    "note": "Near the gas station",
    "proof_of_delivery": {
      "use": false,
      "fee": 0,
      "note": null,
      "link": null
    },
    "postal_code": 12310,
    "coordinate": {
      "latitude": -6.28927,
      "longitude": 106.77492000000007
    },
    "cash_on_delivery": {
      "id": null,
      "amount": 0,
      "amount_currency": "IDR",
      "fee": 0,
      "fee_currency": "IDR",
      "note": null,
      "type": null
    }
  },
  "delivery": {
    "datetime": "2023-09-24T12:00+07:00",
    "note": null,
    "type": "now",
    "distance": 15.2,
    "distance_unit": "kilometer"
  },
  "voucher": {
    "id": null,
    "name": null,
    "value": null,
    "type": null
  },
  "courier": {
    "tracking_id": "65ddac3879699035b83dc561",
    "waybill_id": "WYB-1112223333442",
    "company": "jnt",
    "history": [\
      {\
        "service_type": "-",\
        "status": "confirmed",\
        "note": "Order has been confirmed. Locating nearest driver to pickup.",\
        "updated_at": "2021-01-11T14:03:41+07:00"\
      },\
      {\
        "service_type": "-",\
        "status": "allocated",\
        "note": "Courier has been allocated. Waiting to pick up.",\
        "updated_at": "2021-01-11T15:49:25+07:00"\
      }\
    ],
    "link": "https://example.com/10298309123809",
    "name": "John Doe",   // Deprecated
    "phone": "0888888888",  // Deprecated
    "driver_name": "John Doe",
    "driver_phone": "0888888888",
    "driver_photo_url": "https://picsum.photos/200",
    "driver_plate_number": "B 1234 ABC",
    "type": "instant",
    "shipment_fee": 25000,
    "insurance": {
      "amount": 500000,
      "amount_currency": "IDR",
      "fee": 2500,
      "fee_currency": "IDR",
      "note": null
    },
    "routing_code": "123-JKT45A-67"
  },
  "reference_id": null,
  "invoice_id": null,
  "items": [\
    {\
      "name": "Black L",\
      "description": "Feast/Bangkok'19 Invasion",\
      "sku": null,\
      "value": 165000,\
      "quantity": 1,\
      "length": 72,\
      "width": 54,\
      "height": 1,\
      "weight": 200\
    }\
  ],
  "extra": null,
  "metadata": null,
  "tags": [],
  "note": "Please be careful",
  "currency": "IDR",
  "tax_lines": [],
  "price": 27500,
  "status": "allocated",
  "ticket_status": null
}
```


# Delete an Order

Endpoint

```jsx
POST    /v1/orders/:id/cancel
DELETE  /v1/orders/:id  // deprecated
```

Order can be cancelled or rejected based on order id upon request.

## Cancellation Reason Codes [​](https://biteship.com/id/docs/api/orders/delete\#cancellation-reason-codes "Direct link to heading")

To cancel an order, please use one of the codes provided by this endpoint. Each code is paired with a cancellation reason. The cancellation reasons are available in two languages: Bahasa (`id`) and English (`en`), represented by the `lang` query parameter. The default language is Bahasa if you do not specify a language upon retrieval.

Endpoint

```jsx
GET    /v1/orders/cancellation_reasons?lang=id // in bahasa
GET    /v1/orders/cancellation_reasons?lang=en // in english
```

### Cancellation Reasons in Bahasa [​](https://biteship.com/id/docs/api/orders/delete\#cancellation-reasons-in-bahasa "Direct link to heading")

Response Example

```jsx
{
    "success": true,
    "message": "Order cancellation reasons successfully retrieved",
    "cancellation_reasons": [\
        {\
            "code": "change_courier",\
            "reason": "Ingin mengganti kurir"\
        },\
        {\
            "code": "pickup_delay",\
            "reason": "Waktu penjemputan terlalu lama"\
        },\
        {\
            "code": "change_address",\
            "reason": "Ingin mengganti alamat"\
        },\
        {\
            "code": "others",\
            "reason": "Pesanan dibatalkan oleh pedagang karena alasan lain"\
        }\
    ]
}
```

### Cancellation Reasons in English [​](https://biteship.com/id/docs/api/orders/delete\#cancellation-reasons-in-english "Direct link to heading")

Response Example

```jsx
{
    "success": true,
    "message": "Order cancellation reasons successfully retrieved",
    "cancellation_reasons": [\
        {\
            "code": "change_courier",\
            "reason": "Want to change courier"\
        },\
        {\
            "code": "pickup_delay",\
            "reason": "Pickup time too long"\
        },\
        {\
            "code": "change_address",\
            "reason": "Want to change address"\
        },\
        {\
            "code": "others",\
            "reason": "Order cancelled by merchant for other reason"\
        }\
    ]
}
```

## Type of Requests [​](https://biteship.com/id/docs/api/orders/delete\#type-of-requests "Direct link to heading")

### Using Cancellation Reason Code [​](https://biteship.com/id/docs/api/orders/delete\#using-cancellation-reason-code "Direct link to heading")

JSON Body Request

```jsx
{
    "cancellation_reason_code": "change_courier"
}
```

### Custom Cancellation Reason [​](https://biteship.com/id/docs/api/orders/delete\#custom-cancellation-reason "Direct link to heading")

JSON Body Request

```jsx
{
    "cancellation_reason_code": "others",
    "cancellation_reason": "Accidentally ordered"
}
```

## API Response [​](https://biteship.com/id/docs/api/orders/delete\#api-response "Direct link to heading")

Response

```jsx
{
    "success": true,
    "message": "Order successfully deleted",
    "object": "order",
    "id": "5dd5a396248481164a225af4",
    "status": "cancelled",
    "cancellation_reason_code": "others"
    "cancellation_reason": "Accidentally ordered"
}
```

- [Cancellation Reason Codes](https://biteship.com/id/docs/api/orders/delete#cancellation-reason-codes)
  - [Cancellation Reasons in Bahasa](https://biteship.com/id/docs/api/orders/delete#cancellation-reasons-in-bahasa)
  - [Cancellation Reasons in English](https://biteship.com/id/docs/api/orders/delete#cancellation-reasons-in-english)
- [Type of Requests](https://biteship.com/id/docs/api/orders/delete#type-of-requests)
  - [Using Cancellation Reason Code](https://biteship.com/id/docs/api/orders/delete#using-cancellation-reason-code)
  - [Custom Cancellation Reason](https://biteship.com/id/docs/api/orders/delete#custom-cancellation-reason)
- [API Response](https://biteship.com/id/docs/api/orders/delete#api-response)



# Error Codes

Below are the list of Order error codes. You can use the 'Code' column and customize based on your platform.

| Method | Endpoint | Code | Message |
| --- | --- | --- | --- |
| POST | /v1/orders | 40002001 | Booking courier API Key is not found |
| POST | /v1/orders | 40002002 | Key has not been activated |
| POST | /v1/orders | 40002003 | There's an error with your authentication key. Please contact [support@biteship.com](mailto:support@biteship.com) for this matter |
| POST | /v1/orders | 40002004 | This is direct Biteship order and you're missing type field |
| POST | /v1/orders | 40002005 | Delivery type has no value. Please specify whether it's a 'Now', or 'Scheduled' delivery type |
| POST | /v1/orders | 40002006 | Please make sure to input the right delivery type value |
| POST | /v1/orders | 40002007 | Courier is not available for scheduled delivery |
| POST | /v1/orders | 40002008 | Please make sure you requested the correct extra feature(s) |
| POST | /v1/orders | 40002009 | Courier is not available for cash on delivery service |
| POST | /v1/orders | 40002010 | Either destination needs to have postal code or coordinate |
| POST | /v1/orders | 40002011 | Either origin needs to have postal code or coordinate |
| POST | /v1/orders | 40002012 | Destination addres is required for this courier |
| POST | /v1/orders | 40002013 | Time already passed. Set new delivery time. |
| POST | /v1/orders | 40002014 | Please make sure origin contact name is filled |
| POST | /v1/orders | 40002015 | Please make sure origin contact phone is filled |
| POST | /v1/orders | 40002016 | Please make sure origin address is filled |
| POST | /v1/orders | 40002017 | Please make sure destination contact name is filled |
| POST | /v1/orders | 40002018 | Please make sure destination contact phone is filled |
| POST | /v1/orders | 40002019 | Please make sure destination address is filled |
| POST | /v1/orders | 40002020 | Failed due to invalid or missing postal code. Please contact [support@biteship.com](mailto:support@biteship.com) for this matter. |
| POST | /v1/orders | 40002021 | There's something wrong getting the courier rates. Please contact [support@biteship.com](mailto:support@biteship.com) for this matter. |
| POST | /v1/orders | 40002022 | Origin coordinate must have both latitude and longitude value |
| POST | /v1/orders | 40002023 | Selected courier needs to have origin coordinate value |
| POST | /v1/orders | 40002024 | Destination coordinate must have both latitude and longitude value |
| POST | /v1/orders | 40002025 | Selected courier needs to have destination coordinate value |
| POST | /v1/orders | 40002026 | Selected courier does not exist |
| POST | /v1/orders | 40002027 | Courier service type does not exist |
| POST | /v1/orders | 40002028 | Your account is not available for {{Courier Name}} COD feature. |
| POST | /v1/orders | 40002029 | Please specify the correct COD Type: 3\_days, 5\_days, 7\_days or leave it null to set as default 7\_days |
| POST | /v1/orders | 40002030 | Cash on delivery value cannot exceed Rp. 15.000.000 |
| POST | /v1/orders | 40002031 | Existing courier cannot provide cash on delivery |
| POST | /v1/orders | 40002032 | Need to fill proof of delivery note |
| POST | /v1/orders | 40002033 | Courier is not available for providing proof of delivery service |
| POST | /v1/orders | 40002034 | Courier is not available for providing insurance |
| POST | /v1/orders | 40002035 | Delivery date has not been specified |
| POST | /v1/orders | 40002036 | Delivery time has no been specified |
| POST | /v1/orders | 40002037 | Restriction for same day delivery order time |
| POST | /v1/orders | 40002038 | There's something wrong with the order item. Please contact [support@biteship.com](mailto:support@biteship.com) for more information |
| POST | /v1/orders | 40002039 | There's something wrong with the payment. Please contact [support@biteship.com](mailto:support@biteship.com) for more information |
| POST | /v1/orders | 40002040 | There's something wrong with ordering partner. Please contact [support@biteship.com](mailto:support@biteship.com) for more information. |
| POST | /v1/orders | 40002041 | Failed to create order. Please contact [support@biteship.com](mailto:support@biteship.com) for this problem. |
| POST | /v1/orders | 40002060 | Reference id has already been used before. Please input other reference id |
| POST | /v1/orders | 40002061 | Delivery date must be in 'YYYY-MM-DD' format |
| POST | /v1/orders | 40002062 | Delivery time must be in 'HH:mm' format |
| POST | /v1/orders | 40002999 | Something is wrong with the order. Please contact [support@biteship.com](mailto:support@biteship.com) for more info |
| GET | /v1/orders/:id | 40002042 | Something went wrong when getting the order's details. |
| GET | /v1/orders/:id | 40002057 | Order not found |
| POST | /v1/orders/:id | 40002043 | Something is wrong when updating a new order. Please contact [support@biteship.com](mailto:support@biteship.com) for this matter. |
| POST | /v1/orders/:id | 40002044 | Order has already been confirmed therefore cannot edit order. Please create a new order instead. |
| POST | /v1/orders/:id | 40002045 | Cannot update order because shipment already delivered |
| POST | /v1/orders/:id | 40002046 | Cannot update order because shipment already cancelled |
| POST | /v1/orders/:id | 40002047 | Cannot update order because shipment is on process |
| POST | /v1/orders/:id | 40002048 | Something error in development mode |
| POST | /v1/orders/:id | 40002049 | Something went wrong with the payment when updating the new order. |
| POST | /v1/orders/:id | 40002050 | Order has already been {{new status}} |
| POST | /v1/orders/:id | 40002051 | Order failed to confirm in development mode |
| POST | /v1/orders/:id | 40002052 | Failed to confirm order. Please contact [support@biteship.com](mailto:support@biteship.com) for this matter |
| POST | /v1/orders/:id | 40002053 | Cannot cancel order because order already {{status}} |
| POST | /v1/orders/:id | 40002054 | Failed to cancel development order |
| POST | /v1/orders/:id | 40002055 | Failed to cancel the courier. Please contact [support@biteship.com](mailto:support@biteship.com) for this matter |
| POST | /v1/orders/:id | 40002056 | Something wrong when cancelling an order. Please contact [support@biteship.com](mailto:support@biteship.com) for this matter. |
| POST | /v1/orders/:id | 40002058 | Tags must be in array format |
| POST | /v1/orders/:id | 40002059 | Waybill id is already created and cannot be duplicated. |
| POST | /v1/orders/:id | 40002060 | Reference id has already been used before. Please input other reference id |
| POST | /v1/orders | 40009001 | Lack of transaction data |
| POST | /v1/orders | 40009002 | Payment method is not found |
| POST | /v1/orders | 40009003 | Payment failed to process. Please contact [support@biteship.com](mailto:support@biteship.com) for this matter. |
| POST | /v1/orders | 40009004 | Failed to create transaction |