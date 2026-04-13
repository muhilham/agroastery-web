[Skip to main content](https://biteship.com/id/docs/api/webhook/overview#docusaurus_skipToContent_fallback)

On this page

# Overview

You can configure webhook endpoints directly from your personal dashboard. Biteship has multiple webhook events

- **order.status**


Webhook will be fired every time there is an status update
- **order.price**


Webhook will be fired every time there is a change in price. This happens when the shipping rates is different from the actual weight
- **order.waybill\_id**


Webhook will be fired every time there is an update for your waybill number

## Benefits of Webhooks for Tracking Shipments [​](https://biteship.com/id/docs/api/webhook/overview\#benefits-of-webhooks-for-tracking-shipments "Direct link to heading")

Webhooks offer several advantages for tracking shipments:

1. **Real-time Updates**: Webhooks provide instant notifications about shipment status changes, allowing you to stay up-to-date without constantly polling the API.

2. **Automated Workflows**: You can trigger automated actions in your system based on shipment events, such as sending customer notifications or updating internal databases.

3. **Improved Customer Experience**: With real-time data, you can keep your customers informed about their shipments promptly, enhancing their satisfaction.

4. **Reduced API Load**: Webhooks eliminate the need for frequent API calls to check for updates, reducing the load on both your system and Biteship's servers.

5. **Efficient Resource Usage**: By receiving updates only when changes occur, you can optimize your system's resource allocation and processing.

6. **Enhanced Tracking Accuracy**: Webhooks ensure you have the most current information about shipments, improving the accuracy of your tracking systems.

7. **Scalability**: As your business grows, webhooks can easily handle increased shipment volumes without requiring changes to your integration.


By leveraging webhooks for shipment tracking, you can create a more responsive, efficient, and customer-friendly logistics system.

## Event Type [​](https://biteship.com/id/docs/api/webhook/overview\#event-type "Direct link to heading")

* * *

### Order Status [​](https://biteship.com/id/docs/api/webhook/overview\#order-status "Direct link to heading")

The Order Status webhook provides real-time updates about the status changes of your shipments. By implementing this webhook, you can maintain real-time synchronization between Biteship's system and your own, ensuring you always have the most up-to-date information about your orders.

JSON Body Request

```json
{
    "event": "order.status"
    "courier_tracking_id": "XYZ-123-PQS"
    "courier_waybill_id": "SKS-XXXXX",
    "courier_company": "JNE",
    "courier_type": "REG",
    "courier_driver_name": "Maulana Imran",
    "courier_driver_phone": "088888888888",
    "courier_driver_photo_url": "https://picsum.photos/200",
    "courier_driver_plate_number": "B 1234 AAA",
    "courier_link": "https://xxx-yyy-zzz.com",
    "order_id": "5dd6da88f43bd430ecd5aa2e",
    "order_price": 100000,
    "status": "confirmed"
}
```

* * *

### Order Price [​](https://biteship.com/id/docs/api/webhook/overview\#order-price "Direct link to heading")

The Order Price webhook provides real-time updates about the price changes of your shipments. By implementing this webhook, you can maintain real-time synchronization between Biteship's system and your own, ensuring you always have the most up-to-date information about your orders.

Price changes when the actual weight is different from the weight used to calculate the price. Order price is the price that will be charged to the customer.

JSON Body Request

```json
{
    "cash_on_delivery_fee": 100000,
    "courier_tracking_id": "ASjsd92Asd2d1ASdj91",
    "courier_waybill_id": "Abc-123",
    "event": "order.price",
    "order_id": "ASjsd92Asd2d1ASdj91",
    "price": 100000,
    "proof_of_delivery_fee": 2000,
    "shippment_fee": 10000,
    "status": "picked"
}
```

* * *

### Order Waybill Id [​](https://biteship.com/id/docs/api/webhook/overview\#order-waybill-id "Direct link to heading")

The Order Waybill Id webhook provides real-time updates about the waybill id changes of your shipments. By implementing this webhook, you can maintain real-time synchronization between Biteship's system and your own, ensuring you always have the most up-to-date information about your orders.

Order waybill id changes when the courier has updated the waybill id for the shipment. It happens when the shipment is picked up by the courier and then there's a switch to the next courier.

JSON Body Request

```json
{
    "order_id": "AbSASD12213dadas",
    "courier_tracking_id": "AbSASD12213dadas",
    "courier_waybill_id": "abc-1234",
    "event": "order.waybill_id",
    "status": "picked"
}
```

- [Benefits of Webhooks for Tracking Shipments](https://biteship.com/id/docs/api/webhook/overview#benefits-of-webhooks-for-tracking-shipments)
- [Event Type](https://biteship.com/id/docs/api/webhook/overview#event-type)
  - [Order Status](https://biteship.com/id/docs/api/webhook/overview#order-status)
  - [Order Price](https://biteship.com/id/docs/api/webhook/overview#order-price)
  - [Order Waybill Id](https://biteship.com/id/docs/api/webhook/overview#order-waybill-id)