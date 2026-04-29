[Skip to main content](https://biteship.com/id/docs/api/trackings/retrieve#docusaurus_skipToContent_fallback)

On this page

# Retrieve a Tracking

Endpoint

```js
GET /v1/trackings/:id
```

This endpoint can only be used when you order via our order API. Biteship will generate tracking\_id separately if you create an Order through Biteship API.

## API Response Fields [​](https://biteship.com/id/docs/api/trackings/retrieve\#api-response-fields "Direct link to heading")

successboolean

REQUIRED

The indication of whether this API has provided the desired response.

* * *

messagestring

REQUIRED

The brief explanation of this API response.

* * *

objectstring

REQUIRED

The returned object of this API response.

* * *

idstring

REQUIRED

The ID of the tracking object.

* * *

waybill\_idstring

REQUIRED

The air waybill number of this shipment.

* * *

courierobject

REQUIRED

The courier information from this shipment.**Show child parameters**

**courier.company**

REQUIRED

The courier company.

* * *

**courier.name**

Deprecated

The driver's name.

* * *

**courier.phone**

Deprecated

The driver's phone number.

* * *

**courier.driver\_name**

Nullable

The driver's name.

* * *

**courier.driver\_phone**

Nullable

The driver's phone number.

* * *

**courier.driver\_photo\_url**

Nullable

The driver's photo url.

* * *

**courier.driver\_plate\_number**

Nullable

The driver's vehicle registration number.

* * *

originobject

REQUIRED

The shipment origin.**Show child parameters**

**origin.contact\_name**

Nullable

The shipment origin contact person's name.

* * *

**origin.address**

Nullable

The shipment pickup address.

* * *

destinationobject

REQUIRED

The shipment destination.**Show child parameters**

**destination.contact\_name**

Nullable

The package receiver's name.

* * *

**destination.address**

Nullable

The package receiver's address.

* * *

historyarray

REQUIRED

The tracking history.**Show child parameters**

**history.note**

REQUIRED

The note of tracking history.

* * *

**history.service\_type**

Optional

The service type of shipment.

* * *

**history.updated\_at**

REQUIRED

The datetime of tracking history.

* * *

**history.status**

REQUIRED

The shipment status. Must have value from one of the [**Tracking Status**](https://biteship.com/id/docs/api/trackings/status).

* * *

linkstring

Nullable

The link from courier to track this shipment.

* * *

order\_idstring

Nullable

If this tracking belongs to Biteship's order, then the order ID will be shown.

* * *

statusstring

REQUIRED

The shipment status. Must have value from one of the [**Tracking Status**](https://biteship.com/id/docs/api/trackings/status).

## API Response [​](https://biteship.com/id/docs/api/trackings/retrieve\#api-response "Direct link to heading")

Response

```json
{
  "success": true,
  "messsage": "Successfully get tracking info",
  "object": "tracking",
  "id": "6051861741a37414e6637fab",
  "waybill_id": "0123082100003094",
  "courier": {
    "company": "grab",
    "name": "John Doe", // Deprecated
    "phone": "0888888888", // Deprecated
    "driver_name": "John Doe",
    "driver_phone": "0888888888",
    "driver_photo_url": "https://picsum.photos/200",
    "driver_plate_number": "B 1234 ABC"
  },
  "origin": {
    "contact_name": "John Doe",
    "address": "Jl. Medan Merdeka Barat, Gambir, Jakarta Pusat"
  },
  "destination": {
    "contact_name": "Doe John",
    "address": "Jl. Medan Merdeka Timur, Gambir, Jakarta Pusat"
  },
  "history": [\
    {\
      "note": "Order has been confirmed. Locating nearest driver to pick up.",\
      "service_type": "instant",\
      "updated_at": "2021-03-16T18:17:00+07:00",\
      "status": "confirmed"\
    },\
    {\
      "note": "Courier has been allocated. Waiting to pick up.",\
      "service_type": "instant",\
      "updated_at": "2021-03-16T21:15:00+07:00",\
      "status": "allocated"\
    },\
    {\
      "note": "Courier is on the way to pick up item.",\
      "service_type": "instant",\
      "updated_at": "2021-03-16T23:12:00+07:00",\
      "status": "picking_up"\
    },\
    {\
      "note": "Item has been picked and ready to be shipped.",\
      "service_type": "instant",\
      "updated_at": "2021-03-16T23:43:00+07:00",\
      "status": "picked"\
    },\
    {\
      "note": "Item has been picked and ready to be shipped.",\
      "service_type": "instant",\
      "updated_at": "2021-03-17T09:29:00+07:00",\
      "status": "dropping_off"\
    },\
    {\
      "note": "Item is on the way to customer.",\
      "service_type": "instant",\
      "updated_at": "2021-03-17T11:15:00+07:00",\
      "status": "delivered"\
    }\
  ],
  "link": "https://example.com/01803918209312093",
  "order_id": "6251863341sa3714e6637fab",
  "status": "delivered"
}
```

- [API Response Fields](https://biteship.com/id/docs/api/trackings/retrieve#api-response-fields)
- [API Response](https://biteship.com/id/docs/api/trackings/retrieve#api-response)