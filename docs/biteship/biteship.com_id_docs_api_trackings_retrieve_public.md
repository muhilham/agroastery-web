[Skip to main content](https://biteship.com/id/docs/api/trackings/retrieve_public#docusaurus_skipToContent_fallback)

On this page

# Retrieve a Public Tracking

Endpoint

```js
GET /v1/trackings/:waybill_id/couriers/:courier_code
```

This endpoint can be used to track any other waybill from any other source. It requires the courier code which you can find the in [**Courier API**](https://biteship.com/id/docs/api/couriers/overview).

## API Response Fields [​](https://biteship.com/id/docs/api/trackings/retrieve_public\#api-response-fields "Direct link to heading")

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

## API Response [​](https://biteship.com/id/docs/api/trackings/retrieve_public\#api-response "Direct link to heading")

Response

```json
{
  "success": true,
  "messsage": "Successfully get tracking info",
  "object": "tracking",
  "id": "6051861741a37414e6637fab",
  "waybill_id": "0123082100003094",
  "courier": {
    "company": "jne",
    "name": "John Doe", // Deprecated
    "phone": "08123456789", // Deprecated
    "driver_name": "John Doe",
    "driver_phone": "08123456789",
    "driver_photo_url": null,
    "driver_plate_number": null
  },
  "origin": {
    "contact_name": "[INSTANT COURIER] BITESHIP/FIE",
    "address": "JALAN TANJUNG 16 NO.5, RT.8/RW.2, WEST TANJUNG, SOUTH JAKARTA CITY, JAKARTA, IN"
  },
  "destination": {
    "contact_name": "ADITARA MADJID",
    "address": "THE PAKUBUWONO RESIDENCE, JALAN PAKUBUWONO VI, RW.1, GUNUNG, SOUTH JAKARTA CITY"
  },
  "history": [\
    {\
      "note": "SHIPMENT RECEIVED BY JNE COUNTER OFFICER AT [JAKARTA]",\
      "updated_at": "2021-03-16T18:17:00+07:00",\
      "status": "dropping_off"\
    },\
    {\
      "note": "RECEIVED AT SORTING CENTER [JAKARTA]",\
      "updated_at": "2021-03-16T21:15:00+07:00",\
      "status": "dropping_off"\
    },\
    {\
      "note": "SHIPMENT FORWARDED TO DESTINATION [JAKARTA , HUB VETERAN BINTARO]",\
      "updated_at": "2021-03-16T23:12:00+07:00",\
      "status": "dropping_off"\
    },\
    {\
      "note": "RECEIVED AT INBOUND STATION [JAKARTA , HUB VETERAN BINTARO]",\
      "updated_at": "2021-03-16T23:43:00+07:00",\
      "status": "dropping_off"\
    },\
    {\
      "note": "WITH DELIVERY COURIER [JAKARTA , HUB VETERAN BINTARO]",\
      "updated_at": "2021-03-17T09:29:00+07:00",\
      "status": "dropping_off"\
    },\
    {\
      "note": "DELIVERED TO [ainul yakin | 17-03-2021 11:15 | JAKARTA ]",\
      "updated_at": "2021-03-17T11:15:00+07:00",\
      "status": "delivered"\
    }\
  ],
  "link": "https://random-courier-tracking-link.com/",
  "order_id": "8041821741b38417d6644fbc",
  "status": "delivered"
}
```

- [API Response Fields](https://biteship.com/id/docs/api/trackings/retrieve_public#api-response-fields)
- [API Response](https://biteship.com/id/docs/api/trackings/retrieve_public#api-response)