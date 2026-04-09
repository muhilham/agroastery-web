Getting Started

# Getting Started

About Paper.id API

Paper.id Open API allows developers to integrate applications directly with Paper.id's financial platform, automating invoicing, expense tracking, and payments. This enables businesses to customize Paper.id's features, boosting efficiency.

Undestanding the API & Use Cases

# Undestanding the API & Use Cases

Paper.id helps businesses make payments with ease. Our Open API can help automate your business use case by providing the tools to build sophisticated financial solutions. Consider the following scenarios:

* **ERP & Accounting Platform Integration:** If you run an accounting platform, use our API to offer your users a "pay now" button directly on their invoices, with payments automatically reconciled.

* **Marketplace & E-commerce Payouts:** If you manage a marketplace, automate vendor and seller payouts seamlessly. Create invoices and manage mass payments without leaving your platform.

* **Procurement System Enhancement:** For B2B procurement platforms, integrate our API to digitize the entire procure-to-pay cycle, from PO creation and invoicing to final payment and reconciliation.

Whether your focus is on payables, receivables, or embedding a complete payment gateway, our API provides the flexibility and power to enhance your platform and delight your users.

The Staging Environment

# The Staging Environment

Developer safe environment and Testing your Integration

## About The Staging Environment

Paper.id provides a staging environment, to test your integration with Paper.id. All Paper.id API functionality is supported in the staging environment. This environment is provided to make sure your data is clean in production environment.

> The staging environment provides capabilities for testing core use cases, but does not reflect the full scope and complexity of data that can exist in Production. After testing, it is recommended to test in Production environment before you fully launch and digest real-world data

## Difference between Staging and Production

* The staging environment is 1:1 compared with the production environment, with lower server specification. Built not to handle real-world traffic, but just for testing purposes.
* The staging environment does not need KYC and KYB Verification for your account, you may not need provide full data of your company like in Real world (production) activity
* **Do not EVER** try to pay in a staging environment. The payment request is not needed to be paid, we provide payment simulation for Payment Request, and can simulate paid situation for Invoice Document.\
  Also, the disbursement won't be processed at all, since the payment is not real.
* In Staging, callback retry is not provided, if you feel missing callback from our staging environment, you can do another payment / invoice creation to test more.
* Our Staging environment is frequently utilized for testing multiple features. Therefore, it may not always operate smoothly or consistently.

Get Your API Keys

# Get Your API Keys

How to get your API Access

## API Access

Our API is available for both new and existing customers. If you don't have one, contact your Paper.id contact or complete the form on Paper.id Website.

We will help you create a test account for integration purpose, then open your API Access in real account after the Integration Test in staging has been done.

## Setup Your API Key

After getting your access to Paper.id staging environment, go to the provided URL and login to Paper.id Staging, to retrieve your API Key

1. Go to settings page by clicking cog icon in the top right of the page, your account must have `owner` role to access the page
2. Choose API Integration menu and you will be shown API Settings Page
3. Click generate API Key to get your pairs of Client ID and Client Secret Credentials
4. Go to callback Tab, then set callback URL to receive payment, sending funds, and listen to invoice paid event
5. For extra security layer, you can add your server's IP Address in the IP Whitelist if you wanted to

# Your First API call: Create Invoice

Make your first API call in Paper.id

To test if your account is set up well and the credentials work, let us try to create our first sales invoices document.

***

(1) Assume that we are using `Postman Client` for testing, set your environment variable like

| Environment Variable | Value                                                                  |
| :------------------- | :--------------------------------------------------------------------- |
| BASE\_URL            | [https://open-api.stag-v2.paper.id](https://open-api.stag-v2.paper.id) |
| CLIENT\_ID           | \<Your Client ID>                                                      |
| CLIENT\_SECRET       | \<Your Client Secret>                                                  |

<br />

(2) Create Your first Invoice by using Paper.id Open API by copy and paste this CURL command to your postman address bar

```shell
curl --location '{{BASE_URL}}/api/v1/store-invoice' \
--header 'client_id: {{CLIENT_ID}}' \
--header 'client_secret: {{CLIENT_SECRET}}' \
--header 'Content-Type: application/json' \
--data-raw '{
    "invoice_date": "16-06-2025",
    "due_date": "23-06-2025",
    "number": "INV/2025/06/00001",
    "customer": {
        "id": "mitra-testing-001",
        "name": "Mitra Test Staging 001",
        "email": "mail@yopmail.com", 
        "phone": "6281888888",
    },
    "items": [
        {
            "name": "Tools Maintenance Service",
            "description": "3H 3M",
            "quantity": 1,
            "price": 3000000,
            "discount": 0,
            "tax_id": "",
            "additional_info":{}
        }
    ],
    "signature_text_header": "Mei 28, 2025",
    "signature_text_footer": "Finance Team",
    "terms_condition": "We receive payment no later than 7 days after the bill is received",
    "notes": "Invoice include service fee",
    "send": {
        "email": false,
        "whatsapp": false,
        "sms": false
    },
    "additional_info" :{}
}'
```

<br />

(3) Send the Request, If you are successful, then you will get response similar to the result below

```json
{
    "status_code": 201,
    "data": {
        "id": "3fef1947-36e1-454a-a020-0d35c5186ebb",
        "number": "INV/2025/06/INV02",
        "payper_url": "stg-v2.paper.id/frTCP8B",
        "pdf_url": "https://storage.googleapis.com/ppr-stg/export/47a07aa8-711e-4913-86cf-e54d1afcfee5/sales-invoice/pdf/INV_SAL_INV_2025_06_INV02.pdf",
        "pdf_url_short": "stg-v2.paper.id/HX5w7Z8",
        "status_send": {
            "email": false,
            "whatsapp": false,
            "sms": false
        }
    }
}
```

Invoicing & Payments

# Invoicing & Payments

Automating your entire invoicing process by utilize Paper.id Open API

<Image align="center" border={true} caption="Features Offered in Paper.id Open API" src="https://files.readme.io/9d404c96100c51c1ba8c918667f4d8d342173e00f6286801173bde174bbc5fa2-image.png" />

Paper.id offers an Open API designed to streamline and enhance your business operations. Specifically, it empowers you to automate the entire invoicing process, from the initial creation of an invoice to the final payment transaction. This comprehensive automation can lead to significant improvements in efficiency and accuracy for your business.

As a Customer, Here's How Paper.id Helps You:

1. **Your customer pay Invoices Instantly:** Your customer receives a payment link with invoice information and details, They can click on the “payment” button and pay with any payment method that is convenient to them.
2. **Automate Your Bill Management:** Streamline your business processes with Paper.id. Easily create orders and set up approval workflows to ensure timely and accurate transactions before disbursing funds to your suppliers.
3. **E-Meterai via Paper.id:** For enhanced legal standing, notarize your business documents with an E-meterai Stamp before dispatching them to customers or suppliers.
4. **Core-tax format ready** <sup>NEW</sup>**:** Optionally, prepare your transactions for core-tax reporting and compliance. This feature should only be used if desired.

***

\*) Approval works in Paper.id dashboard only, you can't do approval action via Open API

# Managing Partners

Manage your suppliers and buyers (customers) data

In Paper.id, "partners" refer to both suppliers and customers. Understanding how partner data is managed is crucial. Here are some best practices and key points to remember:

* **Required Information:** Most API calls involving partners will require their number and name.
* **Creating Partner Data:** Partner data can be created either by using the dedicated Partners API resources or automatically populated when a partner object is called within another API.
* **Partner Object Properties:** While partner objects across different API calls might have slightly varied properties, their core structure and purpose remain similar. Detailed explanations will be provided for each object.
* **Unique Identifier:** Partners must have a `partner_number` or `partner_id`. It's highly recommended to map this to your internal `customer_id` or similar unique identifier for consistency.
* **Handling Existing Partner IDs:**
  * **Data Mismatch (Error):** If the `partner_id` you provide matches an existing ID in Paper.id, but the `partner_name` does not, an error will occur to prevent incorrect data updates.
  * **Data Overwrite (Update):** If both the `partner_id` and `partner_name` match an existing record, the existing partner data in Paper.id will be updated with the new information you provide.
  * **Creating New Partners:** If the partner data you provide does not already exist in Paper.id, a new partner record will be created. Please note that a phone number is required for the initial creation of a new partner.


  Creating & Sending Invoices

# Creating & Sending Invoices

Best Practices when create invoices and send them to Your Partner

When using the Invoice and Payment API, remember that all calls create invoice resources, and you are responsible for the accuracy of this data. To prevent payment declines due to Paper.id fraud detection capability, ensure that all transactions reflect real-world data and not used to make fraudulent transaction.

Here are some best practices for creating and sending invoices:

* **Recipient Control:** You have the option to decide whether your partner receives the sales invoice or not.
* **Free Sending Channels:** Paper.id offers free invoice delivery via email, SMS, or WhatsApp as an essential feature.
* **Payment Notifications:** If you opt not to send the invoice, your partners will still receive payment notifications from Paper.id when they make a payment.
* **Edited Invoices:** If you edit an already sent invoice, it is highly recommended to send the updated version to avoid any business conflicts with your partner.

# Receive Payments

Payment Page Utilization in your A/R workflow

> add sequence diagram here

Paper.id Open API offers two ways to request payments :

1. **Invoice-based Payment Request:** Create an invoice and send it to your partner. They will receive the invoice details along with a payment link, allowing them to choose any available payment method.
2. **Direct Payment Request:** Create a Payment Request that includes the invoice information. With this method, you define the specific payment method for your partner, and they **CAN NOT** change it. This option also allows you to design your own user interface and payment flow. The first method, however, requires your partner to open a Paper.id payment link.

Paper.id sends a payment notification to your partners for every payment made, irrespective of the payment method. These notifications are crucial for ensuring both parties are aware that Paper.id is securely handling the funds, and as such, there is currently no option to disable them.

Handling API Callbacks

# Handling API Callbacks

Automating Confirmation with Webhooks (Callbacks)

PAPER.ID provide API callback to notify your system / application any time an event happens on your account like when the customer completes the payment process or when transaction status changes. These notifications help you to update payment status or take suitable actions in real-time.

To complete your integration, you need to integrate the Paper.id callback to synchronize invoice and payment data between your system and Paper.id. There are several callback configurations available for your system flow:

* **Payment In Callback:** Notifies you when a payment-in transaction is success or fails.
* **Payment Out Callback:** Notifies you when a payment-out transaction is success or fails.
* **Invoice Paid Callback:** Notifies you when an invoice status changes to `PAID`.
* **Disbursement Callback:** Notifies you when funds are disbursed to the bank account destination.

> 🚧 Important message
>
> You need to register your URL to both payment and invoice callback, if you use Sales Invoice API


# Introduction

This API reference describes the REST API you can use to interact with the Paper.id platform. REST APIs are usable via HTTP in any environment that supports HTTP requests. It has Uniformed URL pattern, accepting and returning JSON-encoded payload, use standard HTTP Responses codes and verbs. To learn more about RESTful API see <Anchor label="REST API Articles" target="_blank" href="https://restful-api.dev/rest-fundamentals">REST API Articles</Anchor>

## Environments

We provides [staging environment](https://open-api-paper-id.readme.io/reference/the-staging-environment) to help you test and integrate Paper.id Open API. After the integration / development has been done. You must have a live account, done proper KYC and KYB, then ask your Paper.id contact to enable your live account API so you can start using the API with real world data.

| Environment | BASE\_URL                                                                      | Web App URL                                                                    |
| ----------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Staging     | [https://open-api.stag-v2.paper.id/api](https://open-api.stag-v2.paper.id/api) | [https://staging-v2.paper.id/webappv1/](https://staging-v2.paper.id/webappv1/) |
| Production  | [https://open-api.paper.id/api](https://open-api.paper.id/api)                 | [https://paper.id/webappv1/](https://paper.id/webappv1/)                       |

API Version

# API Version

### API Version

Paper.id uses path versioning for its API.

You will find several API with different endpoints in your integration journey. For example:

* version 1: `[BASE_URL]/api/v1/path/to/endpoint`
* version 2: `[BASE_URL]/api/v2/path/to/endpoint`

# Authentication

Each API request expects the `client_id` and `client_secret` in header data.\
If you do not have one, please <Anchor label="Get Your API Keys / Credentials" target="_blank" href="ref:get-your-api-keys">Get Your API Keys / Credentials</Anchor> first.

### API Credentials

| Key             | Value                  |
| --------------- | ---------------------- |
| `client_id`     | `[YOUR_CLIENT_ID]`     |
| `client_secret` | `[YOUR_CLIENT_SECRET]` |

Please ensure the security of your `client_id` and `client_secret` as they have significant privileges. Avoid sharing your secret API keys in public areas like GitHub, client-side code, etc.

**Note**:

* All API requests should be made over HTTPS. Plain HTTP requests will fail.
* Unauthenticated API requests will also fail.

Responses

# Responses

PAPER.ID uses standard and conventional HTTP Status Code for each API Response given in a single API Request. In a brief, HTTP Status code `'2xx'` indicates that the request is accepted and successfully processed by Paper, `'4xx'` indicates that failure is caused by the information provided. (E.g. missing some required parameters, credentials is not valid). `'5xx'` indicates that the error is on the Paper side.

# HTTP Status

Summary of HTTP Status used in Paper

| HTTP Status               | Description                                                                                   |
| :------------------------ | :-------------------------------------------------------------------------------------------- |
| 200 OK                    | The request was successful                                                                    |
| 201 Created               | The request was successful and a resource was created                                         |
| 204 No Content            | The request was successful, but there is no representation to return (response)               |
| 400 Bad Request           | The request could not be understood or was missing required parameters                        |
| 401 Unauthorized          | Authentication failed or user doesn't have permissions for requested operation                |
| 403 Forbidden             | Access Denied                                                                                 |
| 404 Not Found             | Resource was not found                                                                        |
| 405 Method Not Allowed    | Requested method is not supported for the resource                                            |
| 500 Internal Server Error | The server encountered and unexpected condition that prevented it from fulfilling the request |

# Response Format

## V1 Response Format

The API Call response have common form, both for success and error response

```json Response Format
{
    "status_code": 400,
    "message": "error message",
    "data": {
        // response data
    }
}
```

## V2 Response Format

The successful API Call response will have a general format payload consisting of message and data parameters. The data will contain object resources or a dictionary of the object resources.

```json Success Response Format
{  
   "message": "success",  
   "data": {  
      // resource object  
   }  
}
```

# API Callback

Handling API Callback in Your System

To ensure your workflow automation is complete, you need to handle several callbacks. You will need to accept the callback http request and returns response with HTTP Status 200 to give acknowledge that you have received the callback.

## Payment Callback

Payment In and Payment Out Callbacks use the same payload. They only differ in their URL registration handlers, which helps you differentiate them if needed.

```json Bank Transfer
{
  "additional_info": {
		"invoices": [
      {
     		"uuid": "580efeb6-5887-4973-ab13-099e22598adf",
      	"number": "INV/2025/11/0001"
    	}
    ]
	},
  "message": "transaction succeed",
  "payment_date": "2025-06-18",
  "payment_info": {
    "bank_transfer": {
      "amount": 12557,
      "created": "2025-06-18T04:38:54.415786634+07:00",
      "paid_amount": 12557,
      "paid_at": "2025-06-18T04:39:43.594065797+07:00",
      "status": "PAID",
      "updated": "2025-06-18T04:39:43.594065797+07:00"
    },
    "channel": "bca_manual",
    "method": "bank_transfer",
    "source": "open-api",
    "status": "PAID"
  },
  "ref_id": "PAY-REF/2025/06/IN/123"
}
```

```json QRIS
{
  "additional_info": {
		"invoices": [
      {
     		"uuid": "580efeb6-5887-4973-ab13-099e22598adf",
      	"number": "INV/2025/11/0001"
    	}
    ]
	},
  "message": "transaction succeed",
  "payment_date": "2025-06-18",
  "payment_info": {
    "channel": "qris",
    "event": "qr.payment",
    "method": "qris",
    "qris": {
      "amount": 10000,
      "created": "2025-06-18T05:16:51.708008011+07:00",
      "paid_amount": 10000,
      "paid_at": "2025-06-18T05:16:59.511610249+07:00",
      "status": "PAID",
      "updated": "2025-06-18T05:16:59.511610249+07:00"
    },
    "source": "open-api",
    "status": "PAID"
  },
  "ref_id": "PAY-REF/2025/06/IN/124"
}
```

```json Credit Card
{
  "additional_info": {
		"invoices": [
      {
     		"uuid": "580efeb6-5887-4973-ab13-099e22598adf",
      	"number": "INV/2025/11/0001"
    	}
    ]
	},
  "message": "transaction succeed",
  "payment_date": "2025-06-18",
  "payment_info": {
    "channel": "Visa",
    "credit_card": {
      "amount": 10000,
      "created": "2025-06-18T05:18:49.797030079+07:00",
      "paid_amount": 10000,
      "paid_at": "2025-06-18T05:19:01.192687186+07:00",
      "status": "PAID",
      "updated": "2025-06-18T05:19:01.192687186+07:00"
    },
    "method": "credit_card",
    "source": "open-api",
    "status": "PAID"
  },
  "ref_id": "PAY-REF/2025/06/IN/125"
}
```

```json e-wallet
{
  "additional_info": {
		"invoices": [
      {
     		"uuid": "580efeb6-5887-4973-ab13-099e22598adf",
      	"number": "INV/2025/11/0001"
    	}
    ]
	},
  "message": "transaction succeed",
  "payment_date": "2025-06-18",
  "payment_info": {
    "channel": "OVO",
    "ewallet": {
      "amount": 10000,
      "created": "2025-06-18T05:21:14.36293672+07:00",
      "paid_amount": 10000,
      "paid_at": "2025-06-18T05:21:21.741879097+07:00",
      "status": "PAID",
      "updated": "2025-06-18T05:21:21.741879097+07:00"
    },
    "method": "ewallet",
    "source": "open-api",
    "status": "PAID",
  },
  "ref_id": "PAY-REF/2025/06/IN/127"
}
```

### Payment Callback Schema

| Path                                              | Data Type Validation | Description                                                                   |
| :------------------------------------------------ | :------------------- | :---------------------------------------------------------------------------- |
| **additional\_info**                              | Object               | Additional information related to the payment data, in key value pairs format |
| **message**                                       | String               | Human readable callback message from Paper.id                                 |
| **payment\_date**                                 | string               | Date when payment is being made. in YYYY-MM-DD format                         |
| **payment\_info**                                 | object               | Details of payment information                                                |
| payment\_info.**channel**                         | string               | The payment channel used                                                      |
| payment\_info.**method**                          | string               | The payment method used                                                       |
| payment\_info.**message**                         | string               | Message response related to the payment data                                  |
| payment\_info.**\[payment\_method]**              | object               | Details of selected payment method for the specified payment id               |
| payment\_info.\[payment\_method].**amount**       | number               | Billed amount                                                                 |
| payment\_info.\[payment\_method].**created**      | string               | Payment created time                                                          |
| payment\_info.\[payment\_method].**paid\_amount** | number               | Paid amount                                                                   |
| payment\_info.\[payment\_method].**paid\_at**     | string               | Payment transaction time                                                      |
| payment\_info.\[payment\_method].**status**       | string               | Payment status                                                                |
| payment\_info.\[payment\_method].**updated**      | string               | Payment last updated time                                                     |
| **ref\_id**                                       | string               | Payment Reference Id from client                                              |

## Invoice Callback

The Invoice callback is ONLY triggered when the invoice status changes to `PAID`.

```json
{
  "message": "Invoice has been paid",
  "data": {
    "invoice": {
      "id": "afef0ea1-caa6-4123-9735-749df749642c",
      "number": "INV/2025/06/126",
      "partner_id": "2d0e80ca-9a46-4e35-a951-a61987fb7c98",
      "status": "paid",
      "amount_due": 0,
      "total_amount": 10000,
      "updated_at": "2025-06-18 05:21:16.529804427 +0700 WIB"
    }
  }
}
```

| Path                           | Data Type Validation | Description                                   |
| :----------------------------- | :------------------- | :-------------------------------------------- |
| **message**                    | string               | Human readable callback message from Paper.id |
| **data**                       | object               | Data object contains invoice data             |
| data.**invoice**               | object               | Invoice object                                |
| data.invoice.**id**            | string               | Invoice unique ID                             |
| data.invoice.**number**        | string               | Invoice number                                |
| data.invoice.**partner\_id**   | string               | Partner Id which related with the invoice     |
| data.invoice.**status**        | string               | Invoice payment status                        |
| data.invoice.**amount\_due**   | number               | Invoice due amount                            |
| data.invoice.**total\_amount** | number               | Invoice total amount                          |
| data.invoice.**updated\_at**   | string               | Invoice last updated time                     |

## Reconciliation Callback

The reconciliation callback is triggered when the payment has been reconciled with invoice(s).

```json Reconciliation Callback
{
  "additional_info": {
    "invoices": [
      {
        "number": "test/2025/07/0049"
      },
      {
        "number": "INV/2025/11/0011"
      }
    ]
  },
  "message": "reconciliation succeed",
  "reconciliation_date": "2025-08-21",
  "reconciled_amount": 123123,
  "source": "recon_static_va",
  "payment_info": {
    "channel": "Permata",
    "static_va": {
      "amount": 200000,
      "created_at": "2025-08-20T15:34:01.592096867+07:00"
    },
    "payment_type": "digital_payment",
    "method": "static_va",
    "status": "FULLY_RECONCILED"
  },
  "ref_id": "REF1755762993VPURY"
}
```

<br />

| Path                                     | Data Type Validation | Description                                                                   |
| :--------------------------------------- | :------------------- | :---------------------------------------------------------------------------- |
| **additional\_info**                     | Object               | Additional information related to the payment data, in key value pairs format |
| **message**                              | String               | Human readable callback message from Paper.id                                 |
| **reconciliation\_date**                 | string               | Date when reconciliation is being made                                        |
| **reconciled\_amount**                   | number               | Total amount that has been reconciled                                         |
| payment\_info.**channel**                | string               | Bank that used to receive the payment                                         |
| payment\_info.static\_va.**amount**      | number               | Amount that payment received via virtual account                              |
| payment\_info.static\_va.**created\_at** | date                 | Time when the payment received via virtual account                            |
| payment\_info.**status**                 | string               | Payment status. \["FULLY\_RECONCILED", "PARTIALLY\_RECONCILED"]               |
| ref\_id                                  | string               | Reference number specific to the payment                                      |


Changelog

# Changelog

### 2024-02-02

We introduce new behavior for instant payment.

| Endpoint                                | Changes                                                    | Description                                                                                                                                                           |
| :-------------------------------------- | :--------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \[BASE\_URL]/api/v1/**payment/request** | Additional `instant_payment` parameter when in API Request | You may do payment without waiting for the invoice to be created first. This behavior might useful when used for AR transaction case e.g. build your own online-shop. |


# Service Status

This API is used as a health check, to see if the system of Paper.id is up and running

# OpenAPI definition

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "version-1",
    "version": "1.0"
  },
  "servers": [
    {
      "url": "https://open-api.stag-v2.paper.id/api/v1"
    }
  ],
  "components": {
    "securitySchemes": {
      "sec0": {
        "type": "apiKey",
        "in": "header",
        "name": "client_id"
      },
      "sec1": {
        "type": "apiKey",
        "in": "header",
        "name": "client_secret"
      }
    }
  },
  "security": [
    {
      "sec0": [],
      "sec1": []
    }
  ],
  "paths": {
    "/health-check": {
      "get": {
        "summary": "Service Status",
        "description": "",
        "operationId": "service-status-1",
        "parameters": [
          {
            "name": "client_id",
            "in": "header",
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "client_secret",
            "in": "header",
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "200",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{\n    \"message\": \"health\",\n    \"status_code\": 200\n}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "health"
                    },
                    "status_code": {
                      "type": "integer",
                      "example": 200,
                      "default": 0
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "400",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {}
                }
              }
            }
          }
        },
        "deprecated": false
      }
    }
  },
  "x-readme": {
    "headers": [],
    "explorer-enabled": true,
    "proxy-enabled": true
  },
  "x-readme-fauxas": true
}
```


Partner

# Partner

# Overview

<br />

The Partner Management API serves as a robust interface for managing and engaging with partners within the Paper.id ecosystem. These partners encompass a wide range of entities, including suppliers, customers, and other stakeholders integral to your business operations.

In the intricate web of modern business relationships, maintaining organized and efficient interactions with various partners is paramount. Whether it's streamlining communications with suppliers, ensuring timely transactions with customers, or collaborating with other business entities, the Partner Management API is designed to simplify and enhance these interactions.

This API not only facilitates the creation, retrieval of partner details but also ensures that all interactions are logged and managed systematically. By integrating this API, businesses can ensure a seamless and structured approach to partner management, fostering stronger relationships and smoother operational workflows.

# Retrieve All Partner

Retrieve a list of existing partners which have been created by the main account. The data sorted from recently create partner to the oldest one

<br />

# OpenAPI definition

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Paper Open API",
    "version": "0.0.1"
  },
  "servers": [
    {
      "url": "https://open-api.stag-v2.paper.id",
      "description": "Staging Server"
    }
  ],
  "paths": {
    "/api/v2/partners": {
      "get": {
        "tags": [
          "Partner"
        ],
        "summary": "Retrieve All Partner",
        "parameters": [
          {
            "name": "limit",
            "in": "query",
            "description": "Define data count limit restriction on the list, default limit is 10 with maximum limit 100",
            "schema": {
              "type": "integer",
              "minimum": 0,
              "maximum": 100
            }
          },
          {
            "name": "offset",
            "in": "query",
            "description": "The initial index number of the data displayed on the list",
            "schema": {
              "type": "integer"
            }
          },
          {
            "name": "type",
            "in": "query",
            "description": "Filter partner data based on partner type",
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "name",
            "in": "query",
            "description": "Filter partner by its partner name",
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "number",
            "in": "query",
            "description": "Filter partner by its partner number",
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "mobile",
            "in": "query",
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "phone",
            "in": "query",
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "email",
            "in": "query",
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful operation",
            "content": {
              "application/json": {
                "schema": {
                  "allOf": [
                    {
                      "$ref": "#/components/schemas/GenericSuccessListResponseObjectV4"
                    },
                    {
                      "type": "object",
                      "properties": {
                        "data": {
                          "type": "array",
                          "items": {
                            "$ref": "#/components/schemas/Partner"
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          "400": {
            "description": "Bad request",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/GenericErrorResponseObjectV4"
                }
              }
            }
          },
          "default": {
            "$ref": "#/components/responses/GenericDefaultError"
          }
        },
        "security": [
          {
            "ClientIdAuth": [],
            "ClientSecretAuth": []
          }
        ]
      }
    }
  },
  "components": {
    "schemas": {
      "GenericErrorResponseObjectV4": {
        "type": "object",
        "properties": {
          "status_code": {
            "type": "integer"
          },
          "error_code": {
            "type": "string"
          },
          "message": {
            "type": "string"
          },
          "data": {},
          "errors": {}
        },
        "required": [
          "status_code",
          "error_code",
          "message"
        ]
      },
      "GenericSuccessListResponseObjectV4": {
        "type": "object",
        "properties": {
          "message": {
            "type": "string"
          },
          "data": {},
          "pagination": {
            "$ref": "#/components/schemas/GenericSuccessListResponseObjectV4Pagination"
          }
        },
        "required": [
          "message",
          "pagination"
        ]
      },
      "GenericSuccessListResponseObjectV4Pagination": {
        "type": "object",
        "properties": {
          "limit": {
            "type": "integer"
          },
          "offset": {
            "type": "integer"
          },
          "total_record": {
            "type": "integer"
          },
          "page": {
            "type": "integer"
          },
          "total_page": {
            "type": "integer"
          }
        },
        "required": [
          "limit",
          "offset",
          "total_record",
          "page",
          "total_page"
        ]
      },
      "Partner": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "number": {
            "type": "string"
          },
          "type": {
            "type": "string"
          },
          "business_type": {
            "type": "string"
          },
          "email": {
            "type": "string"
          },
          "phone": {
            "type": "string"
          },
          "mobile_phone": {
            "type": "string"
          },
          "address": {
            "$ref": "#/components/schemas/PartnerAddress"
          },
          "notes": {
            "type": "string"
          },
          "virtual_account": {
            "type": "string"
          },
          "contacts": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/PartnerContact"
            }
          },
          "bank_accounts": {
            "type": "array",
            "items": {}
          },
          "counter_parties": {},
          "payment_method": {
            "$ref": "#/components/schemas/PartnerPaymentMethod"
          },
          "custom_type": {
            "type": "string"
          },
          "created_at": {
            "type": "string"
          },
          "updated_at": {
            "type": "string"
          }
        },
        "required": [
          "id"
        ]
      },
      "PartnerAddress": {
        "type": "object",
        "properties": {
          "address_line_1": {
            "type": "string"
          },
          "address_line_2": {
            "type": "string"
          },
          "state": {
            "type": "string"
          },
          "city": {
            "type": "string"
          },
          "postal_code": {
            "type": "string"
          },
          "country": {
            "type": "string"
          }
        }
      },
      "PartnerContact": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "email": {
            "type": "string"
          },
          "phone": {
            "type": "string"
          },
          "note": {
            "type": "string"
          },
          "position": {
            "type": "string"
          }
        }
      },
      "PartnerPaymentMethod": {
        "type": "object",
        "properties": {
          "credit_card": {
            "type": "boolean"
          },
          "bank_transfer": {
            "type": "boolean"
          },
          "ewallet": {
            "type": "boolean"
          },
          "mitra_pembayaran_digital": {
            "type": "boolean"
          },
          "qris": {
            "type": "boolean"
          }
        }
      }
    },
    "responses": {
      "GenericDefaultError": {
        "description": "Unsuccessful operation",
        "content": {
          "application/json": {
            "schema": {}
          }
        }
      }
    },
    "securitySchemes": {
      "ClientIdAuth": {
        "type": "apiKey",
        "description": "Client ID for API authentication. See https://open-api-paper-id.readme.io/reference/authentication for details.",
        "name": "client_id",
        "in": "header"
      },
      "ClientSecretAuth": {
        "type": "apiKey",
        "description": "Client secret for API authentication. See https://open-api-paper-id.readme.io/reference/authentication for details.",
        "name": "client_secret",
        "in": "header"
      }
    }
  }
}
```

Create a Partner

# Create a Partner

Making a POST request to this endpoint enables you to create a partner that can be used as reference for future payment API. It is also important to register a bank account detail as well if you want to make a payout transaction.

<br />

# OpenAPI definition

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Paper Open API",
    "version": "0.0.1"
  },
  "servers": [
    {
      "url": "https://open-api.stag-v2.paper.id",
      "description": "Staging Server"
    }
  ],
  "paths": {
    "/api/v2/partners": {
      "post": {
        "tags": [
          "Partner"
        ],
        "summary": "Create a Partner",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "name": {
                    "description": "Partner name",
                    "type": "string"
                  },
                  "number": {
                    "description": "Partner number or code. Value must be unique per company",
                    "type": "string"
                  },
                  "type": {
                    "description": "Partner type to classify partners",
                    "type": "string",
                    "enum": [
                      "Supplier",
                      "supplier",
                      "Client",
                      "client",
                      "Both",
                      "both"
                    ]
                  },
                  "business_type": {
                    "description": "Partner business type",
                    "type": "string",
                    "enum": [
                      "pt",
                      "cv",
                      "perorangan",
                      "lainnya"
                    ]
                  },
                  "email": {
                    "description": "Partner email address",
                    "type": "string"
                  },
                  "phone": {
                    "description": "Partner phone number in E.164 international format",
                    "type": "string"
                  },
                  "mobile_phone": {
                    "description": "Partner mobile phone number in E.164 international format",
                    "type": "string"
                  },
                  "address": {
                    "description": "Partner address detail",
                    "$ref": "#/components/schemas/PartnerAddress"
                  },
                  "notes": {
                    "description": "Partner Note, to help you describe and identify the partner faster",
                    "type": "string"
                  },
                  "virtual_account": {
                    "description": "Partner's VA Account Number",
                    "type": "string"
                  },
                  "contacts": {
                    "description": "Contact person detail",
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "string"
                        },
                        "name": {
                          "type": "string"
                        },
                        "email": {
                          "type": "string"
                        },
                        "phone": {
                          "type": "string"
                        },
                        "note": {
                          "type": "string"
                        },
                        "position": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "name",
                        "email",
                        "phone",
                        "position"
                      ]
                    }
                  },
                  "bank_accounts": {
                    "description": "Bank account information",
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "bank_code": {
                          "description": "Bank Code (BCA, BNI, etc.)",
                          "type": "string"
                        },
                        "bank_account_number": {
                          "type": "string"
                        },
                        "bank_account_name": {
                          "type": "string"
                        },
                        "country": {
                          "type": "string"
                        },
                        "currency": {
                          "type": "string"
                        },
                        "is_bypass": {
                          "type": "integer"
                        },
                        "is_default": {
                          "type": "integer"
                        }
                      },
                      "required": [
                        "bank_account_number",
                        "bank_code"
                      ]
                    }
                  },
                  "payment_method": {
                    "$ref": "#/components/schemas/PartnerPaymentMethod"
                  },
                  "custom_type": {
                    "type": "string",
                    "enum": [
                      "individual",
                      "company",
                      "travel-agent"
                    ]
                  }
                },
                "required": [
                  "name",
                  "number",
                  "type",
                  "phone"
                ]
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Successful operation",
            "content": {
              "application/json": {
                "schema": {
                  "allOf": [
                    {
                      "$ref": "#/components/schemas/GenericSuccessResponseObjectV4"
                    },
                    {
                      "type": "object",
                      "properties": {
                        "data": {
                          "$ref": "#/components/schemas/Partner"
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          "400": {
            "description": "Bad request",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/GenericErrorResponseObjectV4"
                }
              }
            }
          },
          "default": {
            "$ref": "#/components/responses/GenericDefaultError"
          }
        },
        "security": [
          {
            "ClientIdAuth": [],
            "ClientSecretAuth": []
          }
        ]
      }
    }
  },
  "components": {
    "schemas": {
      "GenericErrorResponseObjectV4": {
        "type": "object",
        "properties": {
          "status_code": {
            "type": "integer"
          },
          "error_code": {
            "type": "string"
          },
          "message": {
            "type": "string"
          },
          "data": {},
          "errors": {}
        },
        "required": [
          "status_code",
          "error_code",
          "message"
        ]
      },
      "GenericSuccessResponseObjectV4": {
        "type": "object",
        "properties": {
          "message": {
            "type": "string"
          },
          "data": {}
        },
        "required": [
          "message"
        ]
      },
      "Partner": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "number": {
            "type": "string"
          },
          "type": {
            "type": "string"
          },
          "business_type": {
            "type": "string"
          },
          "email": {
            "type": "string"
          },
          "phone": {
            "type": "string"
          },
          "mobile_phone": {
            "type": "string"
          },
          "address": {
            "$ref": "#/components/schemas/PartnerAddress"
          },
          "notes": {
            "type": "string"
          },
          "virtual_account": {
            "type": "string"
          },
          "contacts": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/PartnerContact"
            }
          },
          "bank_accounts": {
            "type": "array",
            "items": {}
          },
          "counter_parties": {},
          "payment_method": {
            "$ref": "#/components/schemas/PartnerPaymentMethod"
          },
          "custom_type": {
            "type": "string"
          },
          "created_at": {
            "type": "string"
          },
          "updated_at": {
            "type": "string"
          }
        },
        "required": [
          "id"
        ]
      },
      "PartnerAddress": {
        "type": "object",
        "properties": {
          "address_line_1": {
            "type": "string"
          },
          "address_line_2": {
            "type": "string"
          },
          "state": {
            "type": "string"
          },
          "city": {
            "type": "string"
          },
          "postal_code": {
            "type": "string"
          },
          "country": {
            "type": "string"
          }
        }
      },
      "PartnerContact": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "email": {
            "type": "string"
          },
          "phone": {
            "type": "string"
          },
          "note": {
            "type": "string"
          },
          "position": {
            "type": "string"
          }
        }
      },
      "PartnerPaymentMethod": {
        "type": "object",
        "properties": {
          "credit_card": {
            "type": "boolean"
          },
          "bank_transfer": {
            "type": "boolean"
          },
          "ewallet": {
            "type": "boolean"
          },
          "mitra_pembayaran_digital": {
            "type": "boolean"
          },
          "qris": {
            "type": "boolean"
          }
        }
      }
    },
    "responses": {
      "GenericDefaultError": {
        "description": "Unsuccessful operation",
        "content": {
          "application/json": {
            "schema": {}
          }
        }
      }
    },
    "securitySchemes": {
      "ClientIdAuth": {
        "type": "apiKey",
        "description": "Client ID for API authentication. See https://open-api-paper-id.readme.io/reference/authentication for details.",
        "name": "client_id",
        "in": "header"
      },
      "ClientSecretAuth": {
        "type": "apiKey",
        "description": "Client secret for API authentication. See https://open-api-paper-id.readme.io/reference/authentication for details.",
        "name": "client_secret",
        "in": "header"
      }
    }
  }
}
```

# Retrieve Partner

Retrieve an existing partner detail

<br />

# OpenAPI definition

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Paper Open API",
    "version": "0.0.1"
  },
  "servers": [
    {
      "url": "https://open-api.stag-v2.paper.id",
      "description": "Staging Server"
    }
  ],
  "paths": {
    "/api/v2/partners/{partnerId}": {
      "get": {
        "tags": [
          "Partner"
        ],
        "summary": "Retrieve Partner",
        "parameters": [
          {
            "name": "partnerId",
            "in": "path",
            "description": "Partner ID",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful operation",
            "content": {
              "application/json": {
                "schema": {
                  "allOf": [
                    {
                      "$ref": "#/components/schemas/GenericSuccessResponseObjectV4"
                    },
                    {
                      "type": "object",
                      "properties": {
                        "data": {
                          "$ref": "#/components/schemas/Partner"
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          "404": {
            "description": "Not Found",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/GenericErrorResponseObjectV4"
                }
              }
            }
          },
          "default": {
            "$ref": "#/components/responses/GenericDefaultError"
          }
        },
        "security": [
          {
            "ClientIdAuth": [],
            "ClientSecretAuth": []
          }
        ]
      }
    }
  },
  "components": {
    "schemas": {
      "GenericErrorResponseObjectV4": {
        "type": "object",
        "properties": {
          "status_code": {
            "type": "integer"
          },
          "error_code": {
            "type": "string"
          },
          "message": {
            "type": "string"
          },
          "data": {},
          "errors": {}
        },
        "required": [
          "status_code",
          "error_code",
          "message"
        ]
      },
      "GenericSuccessResponseObjectV4": {
        "type": "object",
        "properties": {
          "message": {
            "type": "string"
          },
          "data": {}
        },
        "required": [
          "message"
        ]
      },
      "Partner": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "number": {
            "type": "string"
          },
          "type": {
            "type": "string"
          },
          "business_type": {
            "type": "string"
          },
          "email": {
            "type": "string"
          },
          "phone": {
            "type": "string"
          },
          "mobile_phone": {
            "type": "string"
          },
          "address": {
            "$ref": "#/components/schemas/PartnerAddress"
          },
          "notes": {
            "type": "string"
          },
          "virtual_account": {
            "type": "string"
          },
          "contacts": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/PartnerContact"
            }
          },
          "bank_accounts": {
            "type": "array",
            "items": {}
          },
          "counter_parties": {},
          "payment_method": {
            "$ref": "#/components/schemas/PartnerPaymentMethod"
          },
          "custom_type": {
            "type": "string"
          },
          "created_at": {
            "type": "string"
          },
          "updated_at": {
            "type": "string"
          }
        },
        "required": [
          "id"
        ]
      },
      "PartnerAddress": {
        "type": "object",
        "properties": {
          "address_line_1": {
            "type": "string"
          },
          "address_line_2": {
            "type": "string"
          },
          "state": {
            "type": "string"
          },
          "city": {
            "type": "string"
          },
          "postal_code": {
            "type": "string"
          },
          "country": {
            "type": "string"
          }
        }
      },
      "PartnerContact": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "email": {
            "type": "string"
          },
          "phone": {
            "type": "string"
          },
          "note": {
            "type": "string"
          },
          "position": {
            "type": "string"
          }
        }
      },
      "PartnerPaymentMethod": {
        "type": "object",
        "properties": {
          "credit_card": {
            "type": "boolean"
          },
          "bank_transfer": {
            "type": "boolean"
          },
          "ewallet": {
            "type": "boolean"
          },
          "mitra_pembayaran_digital": {
            "type": "boolean"
          },
          "qris": {
            "type": "boolean"
          }
        }
      }
    },
    "responses": {
      "GenericDefaultError": {
        "description": "Unsuccessful operation",
        "content": {
          "application/json": {
            "schema": {}
          }
        }
      }
    },
    "securitySchemes": {
      "ClientIdAuth": {
        "type": "apiKey",
        "description": "Client ID for API authentication. See https://open-api-paper-id.readme.io/reference/authentication for details.",
        "name": "client_id",
        "in": "header"
      },
      "ClientSecretAuth": {
        "type": "apiKey",
        "description": "Client secret for API authentication. See https://open-api-paper-id.readme.io/reference/authentication for details.",
        "name": "client_secret",
        "in": "header"
      }
    }
  }
}
```

Update Partner Detail

# Update Partner Detail

This API is provided for users to update their current partner information.

<br />

# OpenAPI definition

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Paper Open API",
    "version": "0.0.1"
  },
  "servers": [
    {
      "url": "https://open-api.stag-v2.paper.id",
      "description": "Staging Server"
    }
  ],
  "paths": {
    "/api/v2/partners/{partnerId}": {
      "put": {
        "tags": [
          "Partner"
        ],
        "summary": "Update Partner Detail",
        "parameters": [
          {
            "name": "partnerId",
            "in": "path",
            "description": "Partner ID",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "name": {
                    "description": "Partner name",
                    "type": "string"
                  },
                  "number": {
                    "description": "Partner number or code. Value must be unique per company",
                    "type": "string"
                  },
                  "type": {
                    "description": "Partner type to classify partners",
                    "type": "string",
                    "enum": [
                      "Supplier",
                      "supplier",
                      "Client",
                      "client",
                      "Both",
                      "both"
                    ]
                  },
                  "business_type": {
                    "description": "Partner business type",
                    "type": "string",
                    "enum": [
                      "pt",
                      "cv",
                      "perorangan",
                      "lainnya"
                    ]
                  },
                  "email": {
                    "description": "Partner email address",
                    "type": "string"
                  },
                  "phone": {
                    "description": "Partner phone number in E.164 international format",
                    "type": "string"
                  },
                  "mobile_phone": {
                    "description": "Partner mobile phone number in E.164 international format",
                    "type": "string"
                  },
                  "address": {
                    "description": "Partner address detail",
                    "$ref": "#/components/schemas/PartnerAddress"
                  },
                  "notes": {
                    "description": "Partner Note, to help you describe and identify the partner faster",
                    "type": "string"
                  },
                  "virtual_account": {
                    "description": "Partner's VA Account Number",
                    "type": "string"
                  },
                  "payment_method": {
                    "$ref": "#/components/schemas/PartnerPaymentMethod"
                  },
                  "custom_type": {
                    "type": "string",
                    "enum": [
                      "individual",
                      "company",
                      "travel-agent"
                    ]
                  }
                },
                "required": [
                  "name",
                  "number",
                  "type",
                  "phone"
                ]
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Successful operation",
            "content": {
              "application/json": {
                "schema": {
                  "allOf": [
                    {
                      "$ref": "#/components/schemas/GenericSuccessResponseObjectV4"
                    },
                    {
                      "type": "object",
                      "properties": {
                        "data": {
                          "$ref": "#/components/schemas/Partner"
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          "400": {
            "description": "Bad request",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/GenericErrorResponseObjectV4"
                }
              }
            }
          },
          "default": {
            "$ref": "#/components/responses/GenericDefaultError"
          }
        },
        "security": [
          {
            "ClientIdAuth": [],
            "ClientSecretAuth": []
          }
        ]
      }
    }
  },
  "components": {
    "schemas": {
      "GenericErrorResponseObjectV4": {
        "type": "object",
        "properties": {
          "status_code": {
            "type": "integer"
          },
          "error_code": {
            "type": "string"
          },
          "message": {
            "type": "string"
          },
          "data": {},
          "errors": {}
        },
        "required": [
          "status_code",
          "error_code",
          "message"
        ]
      },
      "GenericSuccessResponseObjectV4": {
        "type": "object",
        "properties": {
          "message": {
            "type": "string"
          },
          "data": {}
        },
        "required": [
          "message"
        ]
      },
      "Partner": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "number": {
            "type": "string"
          },
          "type": {
            "type": "string"
          },
          "business_type": {
            "type": "string"
          },
          "email": {
            "type": "string"
          },
          "phone": {
            "type": "string"
          },
          "mobile_phone": {
            "type": "string"
          },
          "address": {
            "$ref": "#/components/schemas/PartnerAddress"
          },
          "notes": {
            "type": "string"
          },
          "virtual_account": {
            "type": "string"
          },
          "contacts": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/PartnerContact"
            }
          },
          "bank_accounts": {
            "type": "array",
            "items": {}
          },
          "counter_parties": {},
          "payment_method": {
            "$ref": "#/components/schemas/PartnerPaymentMethod"
          },
          "custom_type": {
            "type": "string"
          },
          "created_at": {
            "type": "string"
          },
          "updated_at": {
            "type": "string"
          }
        },
        "required": [
          "id"
        ]
      },
      "PartnerAddress": {
        "type": "object",
        "properties": {
          "address_line_1": {
            "type": "string"
          },
          "address_line_2": {
            "type": "string"
          },
          "state": {
            "type": "string"
          },
          "city": {
            "type": "string"
          },
          "postal_code": {
            "type": "string"
          },
          "country": {
            "type": "string"
          }
        }
      },
      "PartnerContact": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "email": {
            "type": "string"
          },
          "phone": {
            "type": "string"
          },
          "note": {
            "type": "string"
          },
          "position": {
            "type": "string"
          }
        }
      },
      "PartnerPaymentMethod": {
        "type": "object",
        "properties": {
          "credit_card": {
            "type": "boolean"
          },
          "bank_transfer": {
            "type": "boolean"
          },
          "ewallet": {
            "type": "boolean"
          },
          "mitra_pembayaran_digital": {
            "type": "boolean"
          },
          "qris": {
            "type": "boolean"
          }
        }
      }
    },
    "responses": {
      "GenericDefaultError": {
        "description": "Unsuccessful operation",
        "content": {
          "application/json": {
            "schema": {}
          }
        }
      }
    },
    "securitySchemes": {
      "ClientIdAuth": {
        "type": "apiKey",
        "description": "Client ID for API authentication. See https://open-api-paper-id.readme.io/reference/authentication for details.",
        "name": "client_id",
        "in": "header"
      },
      "ClientSecretAuth": {
        "type": "apiKey",
        "description": "Client secret for API authentication. See https://open-api-paper-id.readme.io/reference/authentication for details.",
        "name": "client_secret",
        "in": "header"
      }
    }
  }
}
```


# Partner Bank Account

# Overview

The Bank Account Partner API is a robust tool designed to facilitate the management and validation of bank account details linked with a specific partner. By integrating with this API, users can seamlessly handle bank account information, ensuring that the data remains accurate and up-to-date.

For instance, if you're working with the bank code "BCA" and need to validate the bank account number "231213123" for a partner with the number "0001", the API provides a straightforward method to achieve this. By leveraging endpoints like '[https://open-api-paper-id.readme.io/reference/add-partner-bank-account#/](https://open-api-paper-id.readme.io/reference/add-partner-bank-account#/)', users can send requests with the necessary headers and data payload to manage these details.

This guide aims to offer a comprehensive walkthrough on how to utilize the API effectively, ensuring that users can maximize its capabilities for their specific needs.

Retrieve Bank Account

# Retrieve Bank Account

# Overview

Fetch details of a specific bank account using its unique identifier.

Bank Account Retrieval: Fetch the details of a bank account using its unique identifier.
Integration: Seamlessly integrate with other systems for a unified banking experience.

# OpenAPI definition

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Paper Open API",
    "version": "0.0.1"
  },
  "servers": [
    {
      "url": "https://open-api.stag-v2.paper.id",
      "description": "Staging Server"
    }
  ],
  "paths": {
    "/api/v1/bank-account/{bankId}": {
      "get": {
        "tags": [
          "Partner Bank Account"
        ],
        "summary": "Retrieve Bank Account",
        "parameters": [
          {
            "name": "bankId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful operation",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "$ref": "#/components/schemas/BankAccountV2"
                    },
                    "status_code": {
                      "type": "integer"
                    }
                  },
                  "required": [
                    "data",
                    "status_code"
                  ]
                }
              }
            }
          },
          "default": {
            "$ref": "#/components/responses/GenericDefaultError"
          }
        },
        "security": [
          {
            "ClientIdAuth": [],
            "ClientSecretAuth": []
          }
        ]
      }
    }
  },
  "components": {
    "schemas": {
      "BankAccountV2": {
        "type": "object",
        "properties": {
          "bank_account_name": {
            "type": "string"
          },
          "bank_account_number": {
            "type": "string"
          },
          "bank_code": {
            "type": "string"
          },
          "bank_id": {
            "type": "string"
          },
          "bypass_validation": {
            "type": "boolean"
          },
          "country": {
            "type": "string"
          },
          "created_at": {
            "type": "string"
          },
          "currency": {
            "type": "string"
          },
          "status": {
            "type": "string"
          },
          "updated_at": {
            "type": "string"
          }
        },
        "additionalProperties": true
      }
    },
    "responses": {
      "GenericDefaultError": {
        "description": "Unsuccessful operation",
        "content": {
          "application/json": {
            "schema": {}
          }
        }
      }
    },
    "securitySchemes": {
      "ClientIdAuth": {
        "type": "apiKey",
        "description": "Client ID for API authentication. See https://open-api-paper-id.readme.io/reference/authentication for details.",
        "name": "client_id",
        "in": "header"
      },
      "ClientSecretAuth": {
        "type": "apiKey",
        "description": "Client secret for API authentication. See https://open-api-paper-id.readme.io/reference/authentication for details.",
        "name": "client_secret",
        "in": "header"
      }
    }
  }
}
```

# Add Partner Bank Account

# OpenAPI definition

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Paper Open API",
    "version": "0.0.1"
  },
  "servers": [
    {
      "url": "https://open-api.stag-v2.paper.id",
      "description": "Staging Server"
    }
  ],
  "paths": {
    "/api/v1/bank-account/partner": {
      "post": {
        "tags": [
          "Partner Bank Account"
        ],
        "summary": "Add Partner Bank Account",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "bank_account_detail": {
                    "type": "object",
                    "properties": {
                      "bank_code": {
                        "type": "string"
                      },
                      "bank_account_number": {
                        "type": "string"
                      }
                    },
                    "required": [
                      "bank_code",
                      "bank_account_number"
                    ]
                  },
                  "partner_id": {
                    "type": "string"
                  },
                  "partner_number": {
                    "description": "Your partner's number",
                    "type": "string"
                  },
                  "bypass_validation": {
                    "description": "The default value of this will be false",
                    "type": "boolean"
                  }
                },
                "required": [
                  "bank_account_detail"
                ]
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Successful operation",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "$ref": "#/components/schemas/BankAccountV2"
                    },
                    "status_code": {
                      "type": "integer"
                    }
                  },
                  "required": [
                    "data",
                    "status_code"
                  ]
                }
              }
            }
          },
          "default": {
            "$ref": "#/components/responses/GenericDefaultError"
          }
        },
        "security": [
          {
            "ClientIdAuth": [],
            "ClientSecretAuth": []
          }
        ]
      }
    }
  },
  "components": {
    "schemas": {
      "BankAccountV2": {
        "type": "object",
        "properties": {
          "bank_account_name": {
            "type": "string"
          },
          "bank_account_number": {
            "type": "string"
          },
          "bank_code": {
            "type": "string"
          },
          "bank_id": {
            "type": "string"
          },
          "bypass_validation": {
            "type": "boolean"
          },
          "country": {
            "type": "string"
          },
          "created_at": {
            "type": "string"
          },
          "currency": {
            "type": "string"
          },
          "status": {
            "type": "string"
          },
          "updated_at": {
            "type": "string"
          }
        },
        "additionalProperties": true
      }
    },
    "responses": {
      "GenericDefaultError": {
        "description": "Unsuccessful operation",
        "content": {
          "application/json": {
            "schema": {}
          }
        }
      }
    },
    "securitySchemes": {
      "ClientIdAuth": {
        "type": "apiKey",
        "description": "Client ID for API authentication. See https://open-api-paper-id.readme.io/reference/authentication for details.",
        "name": "client_id",
        "in": "header"
      },
      "ClientSecretAuth": {
        "type": "apiKey",
        "description": "Client secret for API authentication. See https://open-api-paper-id.readme.io/reference/authentication for details.",
        "name": "client_secret",
        "in": "header"
      }
    }
  }
}
```

Paper Utilities

# Paper Utilities

These are the list of API that useful on your supporting your main action (create document or making payment)

# List of Tax Code

# OpenAPI definition

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Paper Open API",
    "version": "0.0.1"
  },
  "servers": [
    {
      "url": "https://open-api.stag-v2.paper.id",
      "description": "Staging Server"
    }
  ],
  "paths": {
    "/api/v1/tax/list": {
      "get": {
        "tags": [
          "Paper Utilities"
        ],
        "summary": "List of Tax Code",
        "responses": {
          "200": {
            "description": "Successful operation",
            "content": {
              "application/json": {
                "schema": {
                  "allOf": [
                    {
                      "$ref": "#/components/schemas/GenericSuccessResponseObjectV2"
                    },
                    {
                      "type": "object",
                      "properties": {
                        "data": {
                          "$ref": "#/components/schemas/TaxListData"
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          "400": {
            "description": "Bad request",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/GenericErrorResponseObjectV2"
                }
              }
            }
          },
          "default": {
            "$ref": "#/components/responses/GenericDefaultError"
          }
        },
        "security": [
          {
            "ClientIdAuth": [],
            "ClientSecretAuth": []
          }
        ]
      }
    }
  },
  "components": {
    "schemas": {
      "GenericErrorResponseObjectV2": {
        "type": "object",
        "properties": {
          "error": {
            "$ref": "#/components/schemas/GenericErrorResponseObjectV2Error"
          }
        },
        "required": [
          "error"
        ]
      },
      "GenericErrorResponseObjectV2Error": {
        "type": "object",
        "properties": {
          "message": {
            "type": "string"
          },
          "status_code": {
            "type": "integer"
          }
        },
        "required": [
          "message",
          "status_code"
        ]
      },
      "GenericSuccessResponseObjectV2": {
        "type": "object",
        "properties": {
          "status_code": {
            "type": "integer"
          },
          "data": {}
        },
        "required": [
          "status_code",
          "data"
        ]
      },
      "Tax": {
        "type": "object",
        "properties": {
          "uuid": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "value": {
            "type": "number",
            "format": "double"
          },
          "selected": {
            "type": "integer"
          },
          "exclusive": {
            "type": "integer"
          },
          "created_at": {
            "type": "string"
          },
          "updated_at": {
            "type": "string"
          },
          "company_id": {
            "type": "string"
          },
          "is_negative_value": {
            "type": "integer"
          },
          "status_active": {
            "type": "integer"
          },
          "is_custom": {
            "type": "integer"
          },
          "tax_type": {
            "type": "string"
          },
          "sales_tax_account": {
            "type": "string"
          },
          "purchase_tax_account": {
            "type": "string"
          },
          "account_setting": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "uuid": {
                  "type": "string"
                },
                "company_id": {
                  "type": "string"
                },
                "account_id": {
                  "type": "string"
                },
                "entity_id": {
                  "type": "string"
                },
                "account_setting_name_id": {
                  "type": "string"
                },
                "entity_name": {
                  "type": "string"
                },
                "setting_name": {
                  "type": "string"
                },
                "created_at": {
                  "type": "string"
                },
                "updated_at": {
                  "type": "string"
                },
                "account_type_id": {
                  "type": "string"
                },
                "account_parent_id": {
                  "type": "string"
                },
                "account_code": {
                  "type": "string"
                },
                "name": {
                  "type": "string"
                },
                "is_deleteable": {
                  "type": "integer"
                },
                "original_account_code": {
                  "type": "string"
                },
                "status": {
                  "type": "integer"
                },
                "type": {
                  "type": "string"
                }
              },
              "required": [
                "uuid",
                "company_id",
                "account_id",
                "entity_id",
                "account_setting_name_id",
                "entity_name",
                "setting_name",
                "created_at",
                "updated_at",
                "account_type_id",
                "account_parent_id",
                "account_code",
                "name",
                "is_deleteable",
                "original_account_code",
                "status",
                "type"
              ]
            }
          }
        },
        "required": [
          "uuid",
          "name",
          "value",
          "selected",
          "exclusive",
          "created_at",
          "updated_at",
          "company_id",
          "is_negative_value",
          "status_active",
          "is_custom",
          "tax_type",
          "sales_tax_account",
          "purchase_tax_account",
          "account_setting"
        ]
      },
      "TaxListData": {
        "type": "object",
        "properties": {
          "default_tax": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Tax"
            }
          },
          "custom_tax": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Tax"
            }
          }
        },
        "required": [
          "default_tax",
          "custom_tax"
        ]
      }
    },
    "responses": {
      "GenericDefaultError": {
        "description": "Unsuccessful operation",
        "content": {
          "application/json": {
            "schema": {}
          }
        }
      }
    },
    "securitySchemes": {
      "ClientIdAuth": {
        "type": "apiKey",
        "description": "Client ID for API authentication. See https://open-api-paper-id.readme.io/reference/authentication for details.",
        "name": "client_id",
        "in": "header"
      },
      "ClientSecretAuth": {
        "type": "apiKey",
        "description": "Client secret for API authentication. See https://open-api-paper-id.readme.io/reference/authentication for details.",
        "name": "client_secret",
        "in": "header"
      }
    }
  }
}
```

List of Unit of Measurement (UOM)

# List of Unit of Measurement (UOM)

# OpenAPI definition

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Paper Open API",
    "version": "0.0.1"
  },
  "servers": [
    {
      "url": "https://open-api.stag-v2.paper.id",
      "description": "Staging Server"
    }
  ],
  "paths": {
    "/api/v1/uom/list": {
      "get": {
        "tags": [
          "Paper Utilities"
        ],
        "summary": "List of Unit of Measurement (UOM)",
        "responses": {
          "200": {
            "description": "Successful operation",
            "content": {
              "application/json": {
                "schema": {
                  "allOf": [
                    {
                      "$ref": "#/components/schemas/GenericSuccessResponseObjectV2"
                    },
                    {
                      "type": "object",
                      "properties": {
                        "data": {
                          "$ref": "#/components/schemas/UomListData"
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          "400": {
            "description": "Bad request",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/GenericErrorResponseObjectV2"
                }
              }
            }
          },
          "default": {
            "$ref": "#/components/responses/GenericDefaultError"
          }
        },
        "security": [
          {
            "ClientIdAuth": [],
            "ClientSecretAuth": []
          }
        ]
      }
    }
  },
  "components": {
    "schemas": {
      "GenericErrorResponseObjectV2": {
        "type": "object",
        "properties": {
          "error": {
            "$ref": "#/components/schemas/GenericErrorResponseObjectV2Error"
          }
        },
        "required": [
          "error"
        ]
      },
      "GenericErrorResponseObjectV2Error": {
        "type": "object",
        "properties": {
          "message": {
            "type": "string"
          },
          "status_code": {
            "type": "integer"
          }
        },
        "required": [
          "message",
          "status_code"
        ]
      },
      "GenericSuccessResponseObjectV2": {
        "type": "object",
        "properties": {
          "status_code": {
            "type": "integer"
          },
          "data": {}
        },
        "required": [
          "status_code",
          "data"
        ]
      },
      "Uom": {
        "type": "object",
        "properties": {
          "uuid": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "uom_type_id": {
            "type": "string"
          },
          "symbol": {
            "type": "string"
          },
          "code": {
            "type": "string"
          },
          "company_id": {
            "type": "string"
          },
          "created_at": {
            "type": "string"
          },
          "updated_at": {
            "type": "string"
          }
        },
        "required": [
          "uuid",
          "name",
          "uom_type_id",
          "symbol",
          "code",
          "company_id",
          "created_at",
          "updated_at"
        ]
      },
      "UomListData": {
        "type": "object",
        "properties": {
          "uoms": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Uom"
            }
          }
        },
        "required": [
          "uoms"
        ]
      }
    },
    "responses": {
      "GenericDefaultError": {
        "description": "Unsuccessful operation",
        "content": {
          "application/json": {
            "schema": {}
          }
        }
      }
    },
    "securitySchemes": {
      "ClientIdAuth": {
        "type": "apiKey",
        "description": "Client ID for API authentication. See https://open-api-paper-id.readme.io/reference/authentication for details.",
        "name": "client_id",
        "in": "header"
      },
      "ClientSecretAuth": {
        "type": "apiKey",
        "description": "Client secret for API authentication. See https://open-api-paper-id.readme.io/reference/authentication for details.",
        "name": "client_secret",
        "in": "header"
      }
    }
  }
}
```


# Withdrawal Bank Account

# Introduction

Users can create a withdrawal bank account resource which will be used as the destination for funds withdrawal. When a user creates a withdrawal bank account resource, it will automatically set as the withdrawal destination, tagged as primary bank account.
When users create and update a withdrawal bank account, users need to input OTP codes sent to their email or phone. This behavior is made to make sure that only the user can manage the withdrawal bank account resource

## Withdrawal Account Registration Flow:

By providing two way authentication on this flow, it will reduce a potential fraud for any user to change the disbursement account without permission

<Image align="center" border={false} caption="Withdrawal Account Registration and Update Flow" src="https://files.readme.io/3e9cb9bbedcaf40ca8c805f48fdbedfe066c50e2d9581dae664f23ec01664852-image.png" />

<br />

OTP Verification

# OTP Verification

# OpenAPI definition

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Paper Open API",
    "version": "0.0.1"
  },
  "servers": [
    {
      "url": "https://open-api.stag-v2.paper.id",
      "description": "Staging Server"
    }
  ],
  "paths": {
    "/api/v2/verification-request": {
      "get": {
        "tags": [
          "Withdrawal Bank Account"
        ],
        "summary": "OTP Verification",
        "parameters": [
          {
            "name": "method",
            "in": "query",
            "description": "Verification method that will be used. User can pick between email, SMS, or WhatsApp",
            "required": true,
            "schema": {
              "type": "string",
              "enum": [
                "email",
                "sms",
                "whatsapp"
              ]
            }
          },
          {
            "name": "otp_action",
            "in": "query",
            "description": "Type of OTP Action, value can be create_bank_account, update_bank_account",
            "required": true,
            "schema": {
              "type": "string",
              "enum": [
                "create_bank_account",
                "update_bank_account"
              ]
            }
          },
          {
            "name": "phone",
            "in": "query",
            "description": "Phone number where user receive their OTP, this parameter is required when user select SMS as method",
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "email",
            "in": "query",
            "description": "Email Address where user receive their OTP, this parameter is required when user select email method",
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful operation",
            "content": {
              "application/json": {
                "schema": {
                  "allOf": [
                    {
                      "$ref": "#/components/schemas/GenericSuccessResponseObjectV4"
                    },
                    {
                      "type": "object",
                      "properties": {
                        "data": {
                          "$ref": "#/components/schemas/VerificationRequestData"
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          "default": {
            "$ref": "#/components/responses/GenericDefaultError"
          }
        },
        "security": [
          {
            "ClientIdAuth": [],
            "ClientSecretAuth": []
          }
        ]
      }
    }
  },
  "components": {
    "schemas": {
      "GenericSuccessResponseObjectV4": {
        "type": "object",
        "properties": {
          "message": {
            "type": "string"
          },
          "data": {}
        },
        "required": [
          "message"
        ]
      },
      "VerificationRequestData": {
        "type": "object",
        "properties": {
          "token": {
            "type": "string"
          },
          "attempt": {
            "type": "integer",
            "format": "int32"
          },
          "otp_time": {
            "type": "string"
          },
          "expired_at": {
            "type": "string"
          }
        },
        "required": [
          "token",
          "attempt",
          "otp_time",
          "expired_at"
        ]
      }
    },
    "responses": {
      "GenericDefaultError": {
        "description": "Unsuccessful operation",
        "content": {
          "application/json": {
            "schema": {}
          }
        }
      }
    },
    "securitySchemes": {
      "ClientIdAuth": {
        "type": "apiKey",
        "description": "Client ID for API authentication. See https://open-api-paper-id.readme.io/reference/authentication for details.",
        "name": "client_id",
        "in": "header"
      },
      "ClientSecretAuth": {
        "type": "apiKey",
        "description": "Client secret for API authentication. See https://open-api-paper-id.readme.io/reference/authentication for details.",
        "name": "client_secret",
        "in": "header"
      }
    }
  }
}
```

# Add Withdrawal Bank Account

# OpenAPI definition

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Paper Open API",
    "version": "0.0.1"
  },
  "servers": [
    {
      "url": "https://open-api.stag-v2.paper.id",
      "description": "Staging Server"
    }
  ],
  "paths": {
    "/api/v2/withdrawal-bank-accounts": {
      "post": {
        "tags": [
          "Withdrawal Bank Account"
        ],
        "summary": "Add Withdrawal Bank Account",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "token": {
                    "description": "You can get by requesting the OTP verification first",
                    "type": "string"
                  },
                  "otp_code": {
                    "type": "string"
                  },
                  "bank_code": {
                    "type": "string"
                  },
                  "branch_name": {
                    "type": "string"
                  },
                  "account_number": {
                    "type": "string"
                  },
                  "currency": {
                    "type": "string"
                  },
                  "is_default": {
                    "type": "boolean"
                  }
                },
                "required": [
                  "token",
                  "code",
                  "bank_code",
                  "account_number"
                ]
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Successful operation",
            "content": {
              "application/json": {
                "schema": {
                  "allOf": [
                    {
                      "$ref": "#/components/schemas/GenericSuccessResponseObjectV4"
                    },
                    {
                      "type": "object",
                      "properties": {
                        "data": {
                          "$ref": "#/components/schemas/BankAccountV1"
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          "default": {
            "$ref": "#/components/responses/GenericDefaultError"
          }
        },
        "security": [
          {
            "ClientIdAuth": [],
            "ClientSecretAuth": []
          }
        ]
      }
    }
  },
  "components": {
    "schemas": {
      "BankAccountV1": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "object": {
            "type": "string"
          },
          "bank_name": {
            "type": "string"
          },
          "bank_code": {
            "type": "string"
          },
          "bank_branch_name": {
            "type": "string"
          },
          "bank_account_name": {
            "type": "string"
          },
          "bank_account_number": {
            "type": "string"
          },
          "currency": {
            "type": "string"
          },
          "is_default": {
            "type": "boolean"
          },
          "is_match": {
            "type": "boolean"
          }
        },
        "required": [
          "id",
          "object",
          "bank_name",
          "bank_code",
          "bank_branch_name",
          "bank_account_name",
          "bank_account_number",
          "currency",
          "is_default",
          "is_match"
        ]
      },
      "GenericSuccessResponseObjectV4": {
        "type": "object",
        "properties": {
          "message": {
            "type": "string"
          },
          "data": {}
        },
        "required": [
          "message"
        ]
      }
    },
    "responses": {
      "GenericDefaultError": {
        "description": "Unsuccessful operation",
        "content": {
          "application/json": {
            "schema": {}
          }
        }
      }
    },
    "securitySchemes": {
      "ClientIdAuth": {
        "type": "apiKey",
        "description": "Client ID for API authentication. See https://open-api-paper-id.readme.io/reference/authentication for details.",
        "name": "client_id",
        "in": "header"
      },
      "ClientSecretAuth": {
        "type": "apiKey",
        "description": "Client secret for API authentication. See https://open-api-paper-id.readme.io/reference/authentication for details.",
        "name": "client_secret",
        "in": "header"
      }
    }
  }
}
```

Digital Payment Balance

# Digital Payment Balance

## Introduction

PAPER.ID is providing account balance which works for receiving and holding incoming funds and payments from partners. The funds can be withdrawn to the user's primary bank account. The Payment-in Process also can be accomplished by providing Virtual Account to the user's partner.\
There are two kinds of balance in PAPER.ID. The first is the active balance, It is holding the funds which can be withdrawn by users. The second is the holding balance, it is used to store the funds which, for various reasons, are held by PAPER.ID and can't be withdrawn by users.

# Payment API

### Introduction

Paper.id Payments API is an enhanced interface that helps businesses connect effortlessly with our supported payment options, all through a unified set of APIs. Through these APIs, merchants can use a single endpoint for different payment methods across the various markets we support.

### Payment Method and Channel

Paper.id support for these payment methods and channel so far:

| Payment Method             | Description                                           | Available Payment Channel  |
| :------------------------- | :---------------------------------------------------- | :------------------------- |
| bank\_transfer             | Payment by manually transfer to specific bank account | bri, mandiri, bni, permata |
| credit\_card               | Payment using credit card and debit card              | visa, mastercard, jcb      |
| ewallet                    | Payment using digital wallet platform                 | ovo                        |
| mitra\_pembayaran\_digital | Payment to paper's online payment partner             | tokopedia, blibli, shopee  |
| qris                       | Payment using QRIS scanning method by mobile phone    | qris                       |

### Process Flow

In order to use specific payment methods, a request needs to be created that includes the selected payment method object. The payment object will be explained further in the separate section.

To understand the flow better, it can be referred on the following diagram:

<Image alt="Open API Payment" align="center" border={true} src="https://files.readme.io/6a6dd66-open-api-payment-Journey.png">
  Payment API Journey
</Image>

If the payment request is changed, the older versions of the payment request that was created will not prevail and expire. Paid payment requests cannot be paid again. Once the payment request has been paid, a callback of success will be triggered to the callback URL that has been registered.

Create Payment Transaction

# Create Payment Transaction

This API is used to get a list of created payment transactions. The are no difference in the URL for both payment in and out, the only key difference is the destination field.\
Parameter\
Use this schema if the user would like to pay by using an invoice as a basis.  The minimum amount for a transaction is IDR 10.000.

### Instant Payment

Instant Payment allows you to create Payment Request without waiting for the invoice creation completed, it will speed up the payment creation process. There are some behavioral changes to make sure the invoices successfully created. Since, all payment request need to have an underlying documents

* When due date is backdated before todays date then we will define the due date value as H+1
* When invoice date is backdated before todays date then we will use the invoice date value as today
* Partner Referencing behavior
  * If partner number is found, then use the the partner data in existing database as information
  * If partner number is not found, then use the partner data in payload request as information
* If invoice number already exist, then the invoice number will be replaced with defined format, i.e `INV-01-REF_ID`
  * INV: prefix that assigned for auto-assigned invoice number
  * 01: Invoice ordinal number, represent how many invoice should be created based on count of invoices at the request payload
  * REF\_ID: submitted user id, since the data is considered unique to prevent any duplicated invoice
* Also to prevent duplicated entry, if you are sending same payload request we have idempotency check to prevent duplicate request, even before invoice creation process begun.

<HTMLBlock>
  {`
  <header class="APISectionHeader3LN_-QIR0m7x rm-APISectionHeader"><strong class="APISectionHeader-heading4MUMLbp4_nLs">Request Schema</strong></header>
  `}
</HTMLBlock>

# OpenAPI definition

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "version-1",
    "version": "1.0"
  },
  "servers": [
    {
      "url": "https://open-api.stag-v2.paper.id/api/v1"
    }
  ],
  "components": {
    "securitySchemes": {
      "sec0": {
        "type": "apiKey",
        "in": "header",
        "name": "client_id"
      },
      "sec1": {
        "type": "apiKey",
        "in": "header",
        "name": "client_secret"
      }
    }
  },
  "security": [
    {
      "sec0": [],
      "sec1": []
    }
  ],
  "paths": {
    "/payment/request": {
      "post": {
        "summary": "Create Payment Transaction",
        "description": "",
        "operationId": "create-payment-request",
        "parameters": [
          {
            "name": "client_id",
            "in": "header",
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "client_secret",
            "in": "header",
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "transaction_details",
                  "total_amount",
                  "partner",
                  "invoices",
                  "payment_method"
                ],
                "properties": {
                  "transaction_details": {
                    "type": "object",
                    "properties": {
                      "ref_id": {
                        "type": "string",
                        "description": "reference id example : INV202324000343"
                      }
                    }
                  },
                  "total_amount": {
                    "type": "object",
                    "properties": {
                      "payment_amount": {
                        "type": "integer",
                        "description": "Payment Amount",
                        "format": "int32"
                      },
                      "supplier_fee": {
                        "type": "integer",
                        "description": "Supplier Fee",
                        "format": "int32"
                      },
                      "buyer_fee": {
                        "type": "integer",
                        "description": "Buyer Fee",
                        "format": "int32"
                      }
                    }
                  },
                  "partner": {
                    "type": "object",
                    "properties": {
                      "partner_number": {
                        "type": "string",
                        "description": "Partner ID Number"
                      },
                      "company_name": {
                        "type": "string",
                        "description": "Company Name"
                      },
                      "company_email": {
                        "type": "string",
                        "description": "Company Email"
                      },
                      "company_phone": {
                        "type": "string"
                      }
                    }
                  },
                  "invoices": {
                    "type": "array",
                    "items": {
                      "properties": {
                        "invoice_number": {
                          "type": "string",
                          "description": "Invoice Number"
                        },
                        "invoice_date": {
                          "type": "string",
                          "description": "The invoice date, the format should be YYYY-MM-DD",
                          "default": "YYYY-MM-DD",
                          "format": "date"
                        },
                        "invoice_due_date": {
                          "type": "string",
                          "description": "Due Date of Invoice, the format should be YYYY-MM-DD",
                          "default": "YYYY-MM-DD",
                          "format": "date"
                        },
                        "amount": {
                          "type": "integer",
                          "description": "amount",
                          "format": "int32"
                        },
                        "invoice_items": {
                          "type": "array",
                          "description": "Invoice item",
                          "items": {
                            "properties": {
                              "name": {
                                "type": "string",
                                "description": "Item Name"
                              },
                              "description": {
                                "type": "string",
                                "description": "Item Description"
                              },
                              "quantity": {
                                "type": "integer",
                                "description": "Item Quantity",
                                "format": "int32"
                              },
                              "price": {
                                "type": "integer",
                                "description": "item price",
                                "format": "int32"
                              },
                              "discount": {
                                "type": "integer",
                                "description": "Discount",
                                "format": "int32"
                              },
                              "tax": {
                                "type": "integer",
                                "description": "Tax Amount",
                                "format": "int32"
                              },
                              "additional_info": {
                                "type": "object"
                              }
                            },
                            "type": "object"
                          }
                        },
                        "discount": {
                          "type": "integer",
                          "description": "Additional discount for the invoice, the format should be in amount",
                          "format": "int32"
                        },
                        "delivery_fee": {
                          "type": "integer",
                          "description": "Total delivery fee for the invoice",
                          "format": "int32"
                        }
                      },
                      "required": [
                        "invoice_number",
                        "invoice_date",
                        "invoice_due_date"
                      ],
                      "type": "object"
                    }
                  },
                  "payment_method": {
                    "type": "object",
                    "properties": {
                      "method": {
                        "type": "string",
                        "description": "method"
                      },
                      "channel": {
                        "type": "string",
                        "description": "channel"
                      }
                    }
                  },
                  "redirect_url": {
                    "type": "string"
                  },
                  "send": {
                    "type": "object",
                    "properties": {
                      "email": {
                        "type": "boolean",
                        "description": "email",
                        "default": true
                      },
                      "whatsapp": {
                        "type": "boolean",
                        "description": "whatsapp",
                        "default": true
                      },
                      "sms": {
                        "type": "boolean",
                        "default": true
                      }
                    }
                  },
                  "additional_info": {
                    "type": "string"
                  },
                  "instant_payment": {
                    "type": "boolean"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "200",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{\n    \"status_code\": 201,\n    \"data\": {\n        \"amount\": 10000,\n        \"buyer_fee\": 0,\n        \"external_id\": \"17321762704SAS9\",\n        \"merchant_fee\": 150,\n        \"payment_channel\": \"visa\",\n        \"payment_id\": \"7664861d-6289-4a53-a177-be51eb403135\",\n        \"payment_method\": \"credit_card\",\n        \"ref_id\": \"PAY-REF/2024/01/18/XXzz2\"\n    },\n    \"links\": [\n        {\n            \"rel\": \"self\",\n            \"href\": \"/api/v1/payment/request/7664861d-6289-4a53-a177-be51eb403135\",\n            \"type\": \"GET\",\n            \"kind\": \"item\"\n        },\n        {\n            \"rel\": \"self\",\n            \"href\": \"/api/v1/payment/request/7664861d-6289-4a53-a177-be51eb403135/cancel\",\n            \"type\": \"POST\",\n            \"kind\": \"action\"\n        },\n        {\n            \"rel\": \"self\",\n            \"href\": \"/api/v1/payment/history\",\n            \"type\": \"GET\",\n            \"kind\": \"collections\"\n        }\n    ]\n}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "status_code": {
                      "type": "integer",
                      "example": 201,
                      "default": 0
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "amount": {
                          "type": "integer",
                          "example": 10000,
                          "default": 0
                        },
                        "buyer_fee": {
                          "type": "integer",
                          "example": 0,
                          "default": 0
                        },
                        "external_id": {
                          "type": "string",
                          "example": "17321762704SAS9"
                        },
                        "merchant_fee": {
                          "type": "integer",
                          "example": 150,
                          "default": 0
                        },
                        "payment_channel": {
                          "type": "string",
                          "example": "visa"
                        },
                        "payment_id": {
                          "type": "string",
                          "example": "7664861d-6289-4a53-a177-be51eb403135"
                        },
                        "payment_method": {
                          "type": "string",
                          "example": "credit_card"
                        },
                        "ref_id": {
                          "type": "string",
                          "example": "PAY-REF/2024/01/18/XXzz2"
                        }
                      }
                    },
                    "links": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "rel": {
                            "type": "string",
                            "example": "self"
                          },
                          "href": {
                            "type": "string",
                            "example": "/api/v1/payment/request/7664861d-6289-4a53-a177-be51eb403135"
                          },
                          "type": {
                            "type": "string",
                            "example": "GET"
                          },
                          "kind": {
                            "type": "string",
                            "example": "item"
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "400",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{\n    \"status_code\": 400,\n    \"message\": \"partner not found\",\n    \"data\": null\n}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "status_code": {
                      "type": "integer",
                      "example": 400,
                      "default": 0
                    },
                    "message": {
                      "type": "string",
                      "example": "partner not found"
                    },
                    "data": {}
                  }
                }
              }
            }
          }
        },
        "deprecated": false,
        "x-readme": {
          "code-samples": [
            {
              "language": "curl",
              "code": "curl --location 'https://open-api.stag-v2.paper.id/' \\\n--header 'Content-Type: application/json' \\\n--data-raw '{\n    \"transaction_details\": {\n        \"ref_id\": \"INV202324000343\"\n    },\n    \"total_amount\": {\n        \"payment_amount\": 20000,\n        \"supplier_fee\": 0,\n        \"buyer_fee\": 2500\n    },\n    \"partner\": {\n        \"partner_number\": \"0015\",\n        \"company_name\": \"Multi payment\",\n        \"company_email\": \"whitewing.flute@gmail.com\"\n    },\n    \"instant_payment\": false,\n    \"invoices\": [\n        {\n            \"invoice_number\": \"INV/2023/24000343\",\n            \"invoice_date\": \"2023-05-09\",\n            \"invoice_due_date\": \"2023-05-30\",\n            \"amount\": 27500,\n            \"discount\": 5000,\n            \"delivery_fee\": 2500,\n            \"invoice_items\": [\n                {\n                    \"name\": \"Paku beton\",\n                    \"description\": \"paku kuat anti karat\",\n                    \"quantity\": 1,\n                    \"uom_code\": \"KILO\",\n                    \"price\": 10000,\n                    \"discount\": 0,\n                    \"tax\": 0,\n                    \"additional_info\": {}\n                },\n                {\n                    \"name\": \"Paku beton\",\n                    \"description\": \"paku kuat anti karat\",\n                    \"quantity\": 1,\n                    \"uom_code\": \"KILO\",\n                    \"price\": 10000,\n                    \"discount\": 0,\n                    \"tax\": 0,\n                    \"additional_info\": {}\n                }\n            ]\n        }\n    ],\n    \"payment_method\": {\n        \"method\": \"qris\",\n        \"channel\": \"qris\"\n    },\n    \"send\": {\n        \"email\": true,\n        \"whatsapp\": true,\n        \"sms\": false\n    },\n    \"additional_info\": {}\n}'"
            }
          ],
          "samples-languages": [
            "curl"
          ]
        }
      }
    }
  },
  "x-readme": {
    "headers": [],
    "explorer-enabled": true,
    "proxy-enabled": true
  },
  "x-readme-fauxas": true
}
```

# Get Payment Request

Get payment detail information and its payment page

The first and common option for Payment with Paper.id is by presenting the payment link to your payers. The payment link can be found at

# OpenAPI definition

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "version-1",
    "version": "1.0"
  },
  "servers": [
    {
      "url": "https://open-api.stag-v2.paper.id/api/v1"
    }
  ],
  "components": {
    "securitySchemes": {
      "sec0": {
        "type": "apiKey",
        "in": "header",
        "name": "client_id"
      },
      "sec1": {
        "type": "apiKey",
        "in": "header",
        "name": "client_secret"
      }
    }
  },
  "security": [
    {
      "sec0": [],
      "sec1": []
    }
  ],
  "paths": {
    "/payment/request/{id}": {
      "get": {
        "summary": "Get Payment Request",
        "description": "Get payment detail information and its payment page",
        "operationId": "get-payment-request",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "Payment Request ID",
            "schema": {
              "type": "string"
            },
            "required": true
          }
        ],
        "responses": {
          "200": {
            "description": "200",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{\n    \"status_code\": 200,\n    \"message\": \"Request Success\",\n    \"data\": {\n        \"amount\": {\n            \"grand_amount\": 22880,\n            \"subtotal_amount\": 20000\n        },\n        \"payment_fee\": {\n            \"buyer_fee_amount\": 2880,\n            \"merchant_fee\": 380,\n            \"supplier_fee_amount\": 0\n        },\n        \"payment_method\": {\n            \"channel\": \"Visa\",\n            \"method\": \"credit_card\"\n        },\n        \"payper_url\": \"get.paper.id/syCt9SY\",\n        \"redirect_url\": \"https://www.acme.com/payment-success\",\n        \"ref_id\": \"PRPYIN10299-cop\",\n        \"transaction_id\": \"dfffdf0c-c6a4-44a8-bdfb-51ba1ba12d62\",\n        \"transaction_status\": \"success\"\n    }\n}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "status_code": {
                      "type": "integer",
                      "example": 200,
                      "default": 0
                    },
                    "message": {
                      "type": "string",
                      "example": "Request Success"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "amount": {
                          "type": "object",
                          "properties": {
                            "grand_amount": {
                              "type": "integer",
                              "example": 22880,
                              "default": 0
                            },
                            "subtotal_amount": {
                              "type": "integer",
                              "example": 20000,
                              "default": 0
                            }
                          }
                        },
                        "payment_fee": {
                          "type": "object",
                          "properties": {
                            "buyer_fee_amount": {
                              "type": "integer",
                              "example": 2880,
                              "default": 0
                            },
                            "merchant_fee": {
                              "type": "integer",
                              "example": 380,
                              "default": 0
                            },
                            "supplier_fee_amount": {
                              "type": "integer",
                              "example": 0,
                              "default": 0
                            }
                          }
                        },
                        "payment_method": {
                          "type": "object",
                          "properties": {
                            "channel": {
                              "type": "string",
                              "example": "Visa"
                            },
                            "method": {
                              "type": "string",
                              "example": "credit_card"
                            }
                          }
                        },
                        "payper_url": {
                          "type": "string",
                          "example": "get.paper.id/syCt9SY"
                        },
                        "redirect_url": {
                          "type": "string",
                          "example": "https://www.acme.com/payment-success"
                        },
                        "ref_id": {
                          "type": "string",
                          "example": "PRPYIN10299-cop"
                        },
                        "transaction_id": {
                          "type": "string",
                          "example": "dfffdf0c-c6a4-44a8-bdfb-51ba1ba12d62"
                        },
                        "transaction_status": {
                          "type": "string",
                          "example": "success"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "400",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {}
                }
              }
            }
          }
        },
        "deprecated": false
      }
    }
  },
  "x-readme": {
    "headers": [],
    "explorer-enabled": true,
    "proxy-enabled": true
  },
  "x-readme-fauxas": true
}
```

Generate Credit Card URL

# Generate Credit Card URL

Generate 3DS Authentication Page

> 🚧 IMPORTANT NOTE: Please ensure that no credit card details are saved while doing transactions and all customer sensitive data is deleted.
>
> Your system log must be secured and only accessible by person with specific authorization.

This endpoint is a step to create a 3DS authentication. Must be access with SSL certified server.

After the process of 3DS Authentication is done, then your redirect url (base\_url) will be hitted by Paper.id with response below

| 3DS Response | Example URL                                                                |
| :----------- | :------------------------------------------------------------------------- |
| SUCCESS      | \[redirect\_url]?status=successs                                           |
| FAILED       | \[redirect\_url]?status=error\&message-Payment%20failed.%20Please%20Retry. |

# OpenAPI definition

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "version-1",
    "version": "1.0"
  },
  "servers": [
    {
      "url": "https://open-api.stag-v2.paper.id/api/v1"
    }
  ],
  "components": {
    "securitySchemes": {
      "sec0": {
        "type": "apiKey",
        "in": "header",
        "name": "client_id"
      },
      "sec1": {
        "type": "apiKey",
        "in": "header",
        "name": "client_secret"
      }
    }
  },
  "security": [
    {
      "sec0": [],
      "sec1": []
    }
  ],
  "paths": {
    "/payment/request/credit-card": {
      "post": {
        "summary": "Generate Credit Card URL",
        "description": "Generate 3DS Authentication Page",
        "operationId": "generate-credit-card-url",
        "parameters": [
          {
            "name": "Authorization",
            "in": "header",
            "description": "Your Basse 64 authorization credentials. Generated from string \"clientID|ClientSecret\"",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "Content-Type",
            "in": "header",
            "description": "Specify the format of request",
            "required": true,
            "schema": {
              "type": "string",
              "default": "application/json"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "amount",
                  "redirect_url",
                  "external_id",
                  "card_number",
                  "card_month",
                  "card_year",
                  "card_cvn"
                ],
                "properties": {
                  "amount": {
                    "type": "integer",
                    "description": "Amount of transaction",
                    "default": 30000,
                    "format": "int32"
                  },
                  "redirect_url": {
                    "type": "string",
                    "description": "Your redirection page after credit card 3DS response",
                    "default": "https://yourdomain.com/3DSResponseHandler"
                  },
                  "external_id": {
                    "type": "string",
                    "description": "Payment Request External ID from create payment transaction response"
                  },
                  "card_number": {
                    "type": "string",
                    "description": "Credit Card Number to be used, we won't save the CC information",
                    "default": "4000000000001091"
                  },
                  "card_month": {
                    "type": "string",
                    "description": "Card Expired Month",
                    "default": "12"
                  },
                  "card_year": {
                    "type": "string",
                    "description": "Card Expired Year",
                    "default": "2025"
                  },
                  "card_cvn": {
                    "type": "string",
                    "description": "three digits code verification number",
                    "default": "123"
                  },
                  "card_holder_first_name": {
                    "type": "string",
                    "description": "Cardholder's first name"
                  },
                  "card_holder_last_name": {
                    "type": "string",
                    "description": "Cardholder's Last Name"
                  },
                  "card_holder_phone_number": {
                    "type": "string",
                    "description": "Cardholder's registered phone number. Make sure to use international number format. e.g. +62, +63,"
                  },
                  "card_holder_email": {
                    "type": "string",
                    "description": "Cardholder's registered email address"
                  },
                  "company_id": {
                    "type": "string",
                    "description": "Your company id, ask our team if you don't know what to be filled here"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "200",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{\n\t\"status\": 200,\n  \"url\": \"stg.paper.id/6mQtb9c\"\n}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "status": {
                      "type": "integer",
                      "example": 200,
                      "default": 0
                    },
                    "url": {
                      "type": "string",
                      "example": "stg.paper.id/6mQtb9c"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "400",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {}
                }
              }
            }
          }
        },
        "deprecated": false,
        "security": [],
        "x-readme": {
          "code-samples": [
            {
              "language": "curl",
              "code": "curl --location 'https://open-api.paper.id/api/v1/payment/request/credit-card' \\\n--header 'Authorization: [base64encodedValue]' \\\n--header 'Content-Type: application/json' \\\n--data '{\n    \"amount\": 30435,\n    \"redirect_url\": \"http://paper.id\",\n    \"card_number\": \"4000000000001091\",\n    \"card_month\": \"12\",\n    \"card_year\": \"2025\",\n    \"card_cvn\": \"123\",\n    \"external_id\": \"168431537914YDU\",\n    \"company_id\": \"tuf-123-asdfxxx77\",\n    \"card_holder_first_name\": \"first_name\",\n    \"card_holder_last_name\": \"last_name\",\n    \"card_holder_email\": \"email@domain.com\",\n    \"card_holder_phone_number\": \"+6281xxxxxxxx\"\n}'"
            }
          ],
          "samples-languages": [
            "curl"
          ]
        }
      }
    }
  },
  "x-readme": {
    "headers": [],
    "explorer-enabled": true,
    "proxy-enabled": true
  },
  "x-readme-fauxas": true
}
```

# Payment Method List

Use this endpoint to retrieve payment methods

<br />

# OpenAPI definition

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "version-1",
    "version": "1.0"
  },
  "servers": [
    {
      "url": "https://open-api.stag-v2.paper.id/api/v1"
    }
  ],
  "components": {
    "securitySchemes": {
      "sec0": {
        "type": "apiKey",
        "in": "header",
        "name": "client_id"
      },
      "sec1": {
        "type": "apiKey",
        "in": "header",
        "name": "client_secret"
      }
    }
  },
  "security": [
    {
      "sec0": [],
      "sec1": []
    }
  ],
  "paths": {
    "/payments/method": {
      "get": {
        "description": "",
        "operationId": "get_paymentsmethod",
        "responses": {
          "200": {
            "description": "",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "status_code": {
                      "type": "integer",
                      "default": "200"
                    },
                    "message": {
                      "type": "string",
                      "default": "Request Success"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "payment_methods": {
                          "type": "array",
                          "items": {
                            "properties": {
                              "method": {
                                "type": "string"
                              },
                              "status": {
                                "type": "string"
                              },
                              "channel": {
                                "type": "array",
                                "items": {
                                  "properties": {
                                    "code": {
                                      "type": "string"
                                    },
                                    "name": {
                                      "type": "string"
                                    },
                                    "fee_setting": {
                                      "type": "object",
                                      "properties": {
                                        "type": {
                                          "type": "string",
                                          "enum": [
                                            "percentage",
                                            "fixed"
                                          ]
                                        },
                                        "value": {
                                          "type": "number",
                                          "format": "double"
                                        },
                                        "assign_fee": {
                                          "type": "string",
                                          "enum": [
                                            "buyer",
                                            "seller"
                                          ]
                                        }
                                      }
                                    }
                                  },
                                  "type": "object"
                                }
                              }
                            },
                            "type": "object"
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "parameters": []
      }
    }
  },
  "x-readme": {
    "headers": [],
    "explorer-enabled": true,
    "proxy-enabled": true
  },
  "x-readme-fauxas": true
}
```


Payment Method Specific Explanation

# Payment Method Specific Explanation

Next, You will learn the behavior and example for each Payment method

# Credit Card Section

Refer to the table below for the complete list of the payment channel in credit card payment method. Upon the request, Paper.id will forward iFrame for users to input their credit card information and proceed until payment. i. Moreover, there will be 3DS authentication needed to be completed. OTP will be sent to the cardholder phone number.

| Payment Method name | method       | channel                 |
| :------------------ | :----------- | :---------------------- |
| Credit Card         | credit\_card | visa / mastercard / jcb |

Payload of Payment Method Object in an API Call Request, when using credit card

```json Credit Card Object
{        
	"method": "credit_card",
	"channel": "visa"
}

```

Payload of data object in an API Call Response, when using credit card

```json Response
{
  "payment_id": "11290381902kjadasdq32",
  "ref_id": "cc-12891s",
  "payment_method": "credit_card",
  "payment_channel": "visa",
  "amount": 10000,
  "external_id": "192801481HSD" // this is important for generating CC URL
}

```

## Generate Credit Card URL

For credit card payment, you will need to Generate Credit Card URL so your payer can perform 3DS Authentication.

This step must be implemented with caution, we will wrap up card details (and not save the card details), in order to trigger the transaction.

By successfully generating the token, the URL will be included in the response that will generate the 3ds authentication process (from Bank)

Virtual Account Section

# Virtual Account Section

Refer to the table below for the complete list of the payment channel in bank transfer payment method. Upon the request, Paper.id will send a response of the dynamic virtual account, together with the bank account holder’s name, that is applied for the payment request. The dynamic virtual account will expire in 30 days after it has been created.\
Payload of Payment Method Object in an API Call Request, when using virtual account

| Payment Method  | Method         | Channel                    |
| :-------------- | :------------- | :------------------------- |
| Virtual Account | bank\_transfer | bri, bni, mandiri, permata |

Payload of Payment Method Object in an API Call Request, when using virtual account

```json Virtual Account Object
{        
  "payment_method": "bank_transfer",
  "payment_channel": "bni"
}

```

Payload of data object in an API Call Response, when using virtual account

```json Response

"data": {
	"account_number": "880810008771",
  "amount": 20000,
  "buyer_fee": 2500,
  "currency": "IDR",
  "expiration_date": "2023-11-23 10:27:01",
  "is_single_use": false,
  "merchant_fee": 0,
  "payment_channel": "bni",
  "payment_id": "47ada401-2af0-4461-ac7e-0d4356a511ca",
  "payment_method": "bank_transfer",
  "ref_id": "EXP202324000312091831",
  "status": "PENDING",
  "va_name": "PAPER.ID"
},
```

For virtual account payment, the account number will remain active as long as it doesn’t pass the expiration date. If a new payment request is generated toward the same invoice, then the virtual account number will be generated and the previous number will become invalid.


# E-wallet Section

If an ewallet payment method is used in the payment request, PAPER.ID will process the payment to the respective ewallet account with the informed payor phone number (payor\_phone). The payor shall open the ewallet account and process the payment that is notified in their ewallet application.

For now, the only available channel for the e-wallet is OVO

| Payment Method | Method  | Channel |
| :------------- | :------ | :------ |
| ewallet OVO    | ewallet | ovo     |

Payload of Payment Method Object in an API Call Request, when using ewallet

```json E-wallet Object

{
    "payment_method": {
        "method": "ewallet",
        "channel": "ovo",
        "phone": "081359161624"
    },
    // other props ...
}


```

Payload of data object in an API Call Response, when using virtual account

```json Response
{    
  "data": {
    "amount": 20000,
    "buyer_fee": 2500,
    "merchant_fee": 0,
    "payment_channel": "ovo",
    "payment_id": "4eb2f775-5c4b-4fdd-abaa-b66d4c02f40c",
    "payment_method": "ewallet",
    "ref_id": "EXP202324000312091832",
    "status": "PENDING"
    },
    // other props ...
}
```

After the request is executed, a notification will appear on the customer application. The time for payment is 30s, if the time is out, you need to request with same ID to trigger the notification back

QRIS Section

# QRIS Section

If the QRIS payment method is used in the payment request, PAPER.ID will send a response of the dynamic QRIS that is applied for the payment request. QRIS is automatically compatible with channels that accept QRIS: GoPay, Dana, Shopee Pay, LinkAja, BCA QR, CIMB QRPay

| Payment Method | Method | Channel |
| :------------- | :----- | :------ |
| QRIS           | qris   | qris    |

Payload of Payment Method Object in an API Call Request, when using qris

```json QRIS Object
{
    "payment_method": {
        "method": "qris",
        "channel": "qris"
    },
    // other props ...
}


```

Payload of data object in an API Call Response, when using QRIS

```json Response
{
    "data": {
      "amount": 50000,
      "payment_id": "1664938016CJD8K",
      "buyer_fee": 0,
      "merchant_fee": 0,
      "payment_method": "qris",
      "payment_channel": "qris",
      "ref_id": "qris-12891s",
      "status": "PENDING",
      "qr_string": "0002010102##########CO.XENDIT.WWW011893600#######14220002152#####414220010303TTT####015CO.XENDIT.WWW02180000000000000000000TTT52045######ID5911XenditQRIS6007Jakarta6105121606##########3k1mOnF73h11111111#3k1mOnF73h6v53033605401163040BDB",
      "type": "DYNAMIC"
    },
    // other props ...
}
```

The QR string that has been generated, needs to be transformed into QR format, in order to be displayed on your application/website.


# Destination

Destination defines where the fund for the payment will be settled:

1. Empty or null means payment will be settled to the user company’s digital payment balance.
2. Finance Account: bank account that is already stored and referred by id.
3. Virtual Account: bank virtual account that is already stored and referred by id.

Caution: there’s no validation between Finance Account and Virtual Account here with those that are connected to the Company or Partner.

Payment Callback

# Payment Callback

PAPER.ID has a webhook which will send the payment status whenever there is an update. Please ensure that you have registered the URL callback on the dashboard in order to receive a callback from us.

This callback is catered for a successful/failed payment only, and not catering the disbursement process. The disbursement will be catered on different section (*see: disbursement callback*)

### Parameter:

| Path                       | Data Type Validation | Description                                                                                                                                                     |
| :------------------------- | :------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ref\_id                    | string               | Payment Transaction reference ID created by client                                                                                                              |
| external\_id               | string               | Payment Reference displayed in Paper.ID dashboard                                                                                                               |
| payment\_date              | date                 | Payment Date by customer / buyer in YYYY-MM-DD                                                                                                                  |
| message                    | string               | Message response related to the payment data                                                                                                                    |
| payment\_info              | object               | Payment data and details which had been made by customer / buyer                                                                                                |
| payment\_info.method       | string               | The payment method used by customers. Currently we offer: bank\_transfer, credit\_card, ewallet, qris, mitra\_pembayaran\_digital.                              |
| payment\_info.channel      | string               | The payment channel used by customer that identify which brand/channel that we used for identify specific payment method (e.g: visa, mastercard, ovo, bni, etc) |
| payment\_info.amount       | double               | Billed amount that need to be paid by the customer                                                                                                              |
| payment\_info.paid\_amount | double               | Amount of payment that has been paid by the customer                                                                                                            |
| payment\_info.paid\_at     | timestamp            | The time stamp of successful payment                                                                                                                            |
| payment\_info.status       | string               | Payment transaction status.  Expect that you will received PAID status for successful payment.                                                                  |
| payment\_info.updated      | timestamp            | The time stamp of latest update happens on the payment request                                                                                                  |
| payment\_info.source       | string               | The source of the underlying document. Default value: paper-chain, payment\_out\_request                                                                        |

### JSON Payload

```json Bank Transfer
{
  "additional_info": {
		"invoices": [
      {
          "uuid": "580efeb6-5887-4973-ab13-099e22598adf",
          "number": "INV/2025/11/0001"
      }
    ]
	},
  "message": "transaction success",
  "payment_date": "01-01-2021 23:59:59",
  "payment_info": {
    "bank_transfer": {
      "amount": 200000,
      "created": "2021-08-09T11:23:50.550571+07:00",
      "paid_amount": 200000,
      "paid_at": "2021-08-09T11:23:50.550571+07:00",
      "status": "PAID",
      "updated": "2021-08-09T11:23:53.011389+07:00"
    },
    "channel": "bni",
    "method": "bank_transfer",
  },
  "ref_id": "987654xxxxx",
  "external_id": "123456xxxx"
}
```

```json Credit Card
{
  "additional_info": {
		"invoices": [
      {
          "uuid": "580efeb6-5887-4973-ab13-099e22598adf",
          "number": "INV/2025/11/0001"
      }
    ]
	},
  "message": "transaction succeed",
  "payment_date": "2023-08-29",
  "payment_info": {
    "channel": "visa",
    "method": "credit_card",
    "credit_card": {
      "amount": 100000,
      "created": "2023-08-29T12:09:49.187348372+07:00",
      "paid_amount": 100000,
      "paid_at": "2023-08-29T12:10:51.143011605+07:00",
      "status": "PAID",
      "updated": "2023-08-29T12:10:51.143011605+07:00",
      "source": "paper-chain"
    }
  },
  "ref_id": "REF1693285783paQHF",
  "external_id": "123456xxxx"
}

```

```json E-wallet
{
  "additional_info": {
		"invoices": [
      {
          "uuid": "580efeb6-5887-4973-ab13-099e22598adf",
          "number": "INV/2025/11/0001"
      }
    ]
	},
  "message": "transaction succeed",
  "payment_date": "2023-08-29",
  "payment_info": {
    "channel": "OVO",
    "method": "ewallet",
    "ewallet": {
      "amount": 100000,
      "created": "2023-08-29T12:12:58.750848281+07:00",
      "paid_amount": 100000,
      "paid_at": "2023-08-29T12:13:02.53221859+07:00",
      "status": "PAID",
      "updated": "2023-08-29T12:13:02.53221859+07:00",
      "source": "paper-chain"
    }
  },
  "ref_id": "REF1693285978PKnAn",
  "external_id": "123456xxxx"
}

```

```json Mitra Pembayaran Digital
{
  "additional_info": {
		"invoices": [
      {
          "uuid": "580efeb6-5887-4973-ab13-099e22598adf",
          "number": "INV/2025/11/0001"
      }
    ]
	},
  "message": "transaction succeed",
  "payment_date": "2023-08-29",
  "payment_info": {
    "channel": "tokopedia", //or tokopedia_cc, blibli, shopee
    "method": "mitra_pembayaran_digital",
    "mitra_pembayaran_digital": {
      "amount": 100000,
      "created": "2023-08-29T11:53:12.475422622+07:00",
      "paid_amount": 100000,
      "paid_at": "2023-08-29T11:54:19.135087699+07:00",
      "status": "PAID",
      "updated": "2023-08-29T11:54:19.135087699+07:00",
      "source": "paper-chain"
    }
  },
  "ref_id": "REF1693284791uZVQR",
  "external_id": "123456xxxx"
}

```

```json QRIS
{
  "additional_info": {
		"invoices": [
      {
          "uuid": "580efeb6-5887-4973-ab13-099e22598adf",
          "number": "INV/2025/11/0001"
      }
    ]
	},
  "message": "transaction succeed",
  "payment_date": "2023-08-29",
  "payment_info": {
    "channel": "qris",
    "event": "qr.payment",
    "method": "qris",
    "ewallet": {
      "amount": 100000,
      "created": "2023-08-29T12:15:40.397707662+07:00",
      "paid_amount": 100000,
      "paid_at": "2023-08-29T12:16:15.633467823+07:00",
      "status": "PAID",
      "updated": "2023-08-29T12:16:15.633467823+07:00",
      "source": "paper-chain"
    }
  },
  "ref_id": "REF1693286139cxCtu",
  "external_id": "123456xxxx"
}

```

# Payout Callback

This callback catered the case the payout has been successfully sent to the supplier, that is triggered from payment out process

<br />

### Parameter:

| Path                        | Data Type Validation | Description                                                                                                                                                     |
| :-------------------------- | :------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| additional\_info            | object               | Additional information related to the payment                                                                                                                   |
| message                     | string               | Message response related to the payment data                                                                                                                    |
| payment\_date               | date                 | Payment Date by customer / buyer in YYYY-MM-DD                                                                                                                  |
| ref\_id                     | string               | Payment Transaction reference ID created by client                                                                                                              |
| payment\_info               | object               | Payment data and details which had been made by customer / buyer                                                                                                |
| payment\_info.amount        | double               | Billed amount that need to be paid by the customer                                                                                                              |
| payment\_info.created       | timestamp            | The time stamp when the transaction was created                                                                                                                 |
| payment\_info.paid\_amount  | double               | Amount of payment that has been paid by the customer                                                                                                            |
| payment\_info.paid\_at      | timestamp            | The time stamp of successful payment                                                                                                                            |
| payment\_info.updated       | timestamp            | The time stamp of latest update happens on the payment request                                                                                                  |
| payment\_info.channel       | string               | The payment channel used by customer that identify which brand/channel that we used for identify specific payment method (e.g: visa, mastercard, ovo, bni, etc) |
| payment\_info.grand\_amount | double               | Total amount billed, including additional fees (e.g., admin fee)                                                                                                |
| payment\_info.method        | string               | The payment method used by customers.                                                                                                                           |
| payment\_info.source        | string               | The source of the underlying document. Default value: digpayout                                                                                                 |
| payment\_info.status        | string               | Payment transaction status.  Expect that you will received PAID status for successful payment.                                                                  |

### JSON Payload

```json Bank Transfer
{
  "additional_info": null,
  "message": "transaction succeed",
  "payment_date": "2021-01-21",
  "payment_info": {
    "bank_transfer": {
      "amount": 1234567,
      "created": "2025-08-20T16:10:22.427501665+07:00",
      "paid_amount": 1234567,
      "paid_at": "2025-08-20T16:10:53.536572498+07:00",
      "status": "PAID",
      "updated": "2025-08-20T16:10:53.536572498+07:00"
    },
    "channel": "BCA",
    "grand_amount": 1237567,
    "method": "bank_transfer",
    "source": "digpayout",
    "status": "PAID"
  },
  "ref_id": "987654xxxxx"
}
```

```json Credit Card
{
  "additional_info": null,
  "message": "transaction succeed",
  "payment_date": "2021-01-21",
  "payment_info": {
    "credit_card": {
      "amount": 1234567,
      "created": "2025-08-20T16:10:22.427501665+07:00",
      "paid_amount": 1234567,
      "paid_at": "2025-08-20T16:10:53.536572498+07:00",
      "status": "PAID",
      "updated": "2025-08-20T16:10:53.536572498+07:00"
    },
    "channel": "visa",
    "grand_amount": 1237567,
    "method": "credit_card",
    "source": "digpayout",
    "status": "PAID"
  },
  "ref_id": "987654xxxxx"
}
```

```json E-Wallet
{
  "additional_info": null,
  "message": "transaction succeed",
  "payment_date": "2021-01-21",
  "payment_info": {
    "channel": "OVO",
    "ewallet": {
      "amount": 12345,
      "created": "2025-08-20T16:30:57.759515376+07:00",
      "paid_amount": 12345,
      "paid_at": "2025-08-20T16:31:00.992720561+07:00",
      "status": "PAID",
      "updated": "2025-08-20T16:31:00.992720561+07:00"
    },
    "ewallet_type": "ovo",
    "grand_amount": 13345,
    "method": "ewallet",
    "source": "digpayout",
    "status": "PAID"
  },
  "ref_id": "987654xxxxx"
}
```

```json Mitra Pembayaran Digital
{
  "additional_info": null,
  "message": "transaction succeed",
  "payment_date": "2021-01-21",
  "payment_info": {
    "mitra_pembayaran_digital": {
      "amount": 1234567,
      "created": "2025-08-20T16:10:22.427501665+07:00",
      "paid_amount": 1234567,
      "paid_at": "2025-08-20T16:10:53.536572498+07:00",
      "status": "PAID",
      "updated": "2025-08-20T16:10:53.536572498+07:00"
    },
    "channel": "tokopedia",
    "grand_amount": 1237567,
    "method": "mitra_pembayaran_digital",
    "source": "digpayout",
    "status": "PAID"
  },
  "ref_id": "987654xxxxx"
}
```


Retrieve a Payment Transaction

# Retrieve a Payment Transaction

You need to hit this API with parameters to get your payment transaction status and fees

# OpenAPI definition

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "version-1",
    "version": "1.0"
  },
  "servers": [
    {
      "url": "https://open-api.stag-v2.paper.id/api/v1"
    }
  ],
  "components": {
    "securitySchemes": {
      "sec0": {
        "type": "apiKey",
        "in": "header",
        "name": "client_id"
      },
      "sec1": {
        "type": "apiKey",
        "in": "header",
        "name": "client_secret"
      }
    }
  },
  "security": [
    {
      "sec0": [],
      "sec1": []
    }
  ],
  "paths": {
    "/payment/request/:id": {
      "get": {
        "summary": "Retrieve a Payment Transaction",
        "description": "",
        "operationId": "retrieve-a-payment-transaction",
        "responses": {
          "200": {
            "description": "200",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{\n\t\"status_code\": 200,\n\t\"data\": {\n\t\t\"payment_id\": \"1664903227N3D3W\",\n\t\t\"transaction_status\": \"pending\",\n\t\t\"ref_id\": \"00000009\"\n\t\t\"created_at\": \"2022-09-31T23:59:59+07:00\",\n\t\t\"modified_at\": \"2022-09-31T23:59:59+07:00\"\n\t},\n}\n"
                  }
                }
              }
            }
          },
          "400": {
            "description": "400",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {}
                }
              }
            }
          }
        },
        "deprecated": false
      }
    }
  },
  "x-readme": {
    "headers": [],
    "explorer-enabled": true,
    "proxy-enabled": true
  },
  "x-readme-fauxas": true
}
```

# Cancel Payment Transaction

# OpenAPI definition

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "version-1",
    "version": "1.0"
  },
  "servers": [
    {
      "url": "https://open-api.stag-v2.paper.id/api/v1"
    }
  ],
  "components": {
    "securitySchemes": {
      "sec0": {
        "type": "apiKey",
        "in": "header",
        "name": "client_id"
      },
      "sec1": {
        "type": "apiKey",
        "in": "header",
        "name": "client_secret"
      }
    }
  },
  "security": [
    {
      "sec0": [],
      "sec1": []
    }
  ],
  "paths": {
    "/payment/request/:key/cancel": {
      "post": {
        "summary": "Cancel Payment Transaction",
        "description": "",
        "operationId": "cancel-payment-transaction",
        "responses": {
          "200": {
            "description": "200",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{\n  \"status_code\": 200,\n    \"data\": {\n      \"date\": \"2021-09-29\",\n      \"expired_date\": \"2021-09-29T14:54:17Z\",\n      \"status\": \"CANCELED\",\n      \"updated_at\": \"2021-09-29T09:30:54.348883233+07:00\"\n}\n"
                  }
                }
              }
            }
          },
          "400": {
            "description": "400",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {}
                }
              }
            }
          }
        },
        "deprecated": false
      }
    }
  },
  "x-readme": {
    "headers": [],
    "explorer-enabled": true,
    "proxy-enabled": true
  },
  "x-readme-fauxas": true
}
```


Payment Simulation (Staging Only)

# Payment Simulation (Staging Only)

You can simulate payments in staging using several methods.
Depending on your integration flow, you may either:

1. Use the Payper Page
2. Use the Payment API

***

# Pay with Payper Page

These are some payment methods that can be simulated in staging

## Bank Transfer

1. Open your browser’s Developer Tools (Inspect → Network tab).
2. Trigger the `api/v1/payper-api/payment-request/payment-method/choose` API request. In the response, look for `data.payment_details.invoice_url`

<Image align="center" border={false} width="70% " src="https://files.readme.io/b982f6d9775a580a836eef119cf9a2776cb942ddec182a75ccab9624248f59b4-image.png" />

3. Copy the `invoice_url` and open it in your browser. [example link](https://dashboard-stg.pivot-payment.com/simulation/payment/ZmVhM2RhZTEtNDQ5Ni00YzM4LWI1ZmItNzhhZDg5MjYwMmI5)

<Image align="center" border={false} caption="Select any bank then click 'Select Payment Method' button" src="https://files.readme.io/3ad9e593ccb7b4275e754b817cf1194064187c9cdec017b9678903ebcdeb2d30-image.png" width="70% " />

<Image align="center" border={false} caption="Click 'Pay Now'" src="https://files.readme.io/d690e30de6a1fbee3465496ac970d790e743dc7c5cc97a95534e9b89ee140cde-image.png" width="70% " />

## Credit Card

### With OTP (3DS Page)

* Number: 4000 0000 0000 1091
* Expiry: 12 / 30
* CVV: 123
* OTP: 1234

### Without OTP

* Number: 5200 0000 0000 1005
* Expiry: 12 / 30
* CVV: 123

## Credit Card Installment

* Number: 4032 0385 6399 3207
* Expiry: 01 / 39
* CVV: 100

## E-Wallet (OVO)

* Enter any valid mobile number.
* Continue checkout normally.
* The transaction will be marked PAID automatically within a few minutes in staging.

***

# Pay with Payment API

If you use Payment Request API, you can hit this API to set the payment status to `PAID`

```shell cURL
curl --location https://open-api.stag-v2.paper.id/api/v1/payment/simulation \
--header client_id: xx \
--header client_secret: yy \
--header Content-Type: application/json \
--data {
  "change_status_to": "PAID",
  "ref_id": "REF-XXXX"
}
`
```

<br />

<br />


# Withdrawal Transaction

### Introduction

Paper.id Withdrawal API is an enhanced interface that helps businesses withdraw their balance easily using API. Through these APIs, merchants can check remaining balance, create a withdrawal request and check the historical log of the transaction

Alternatively, you can also withdraw your balance directly from the dashboard.


Create Withdrawal Request

# Create Withdrawal Request

# OpenAPI definition

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "version-1",
    "version": "1.0"
  },
  "servers": [
    {
      "url": "https://open-api.stag-v2.paper.id/api/v1"
    }
  ],
  "components": {
    "securitySchemes": {
      "sec0": {
        "type": "apiKey",
        "in": "header",
        "name": "client_id"
      },
      "sec1": {
        "type": "apiKey",
        "in": "header",
        "name": "client_secret"
      }
    }
  },
  "security": [
    {
      "sec0": [],
      "sec1": []
    }
  ],
  "paths": {
    "/withdrawal/request": {
      "post": {
        "summary": "Create Withdrawal Request",
        "description": "",
        "operationId": "create-withdrawal-request",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "transaction_detail": {
                    "type": "object",
                    "properties": {
                      "ref_id": {
                        "type": "string",
                        "description": "This is the id that is used by the user to identify their transaction in Paper.id"
                      },
                      "total_amount": {
                        "type": "integer",
                        "description": "This is the total amount that want to withdraw",
                        "format": "int32"
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "200",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{\n    \"data\": {\n        \"ref_id\": \"00000001\",\n        \"transaction_status\": \"Disbursed Requested\"\n    },\n    \"message\": \"Successful witdhrawal request\",\n    \"status_code\": 200\n}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "object",
                      "properties": {
                        "ref_id": {
                          "type": "string",
                          "example": "00000001"
                        },
                        "transaction_status": {
                          "type": "string",
                          "example": "Disbursed Requested"
                        }
                      }
                    },
                    "message": {
                      "type": "string",
                      "example": "Successful witdhrawal request"
                    },
                    "status_code": {
                      "type": "integer",
                      "example": 200,
                      "default": 0
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "400",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {}
                }
              }
            }
          }
        },
        "deprecated": false
      }
    }
  },
  "x-readme": {
    "headers": [],
    "explorer-enabled": true,
    "proxy-enabled": true
  },
  "x-readme-fauxas": true
}
```

# Retrieve Digital Payment Balance

This API can be used to check the remaining balance of the respected account

# OpenAPI definition

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "version-1",
    "version": "1.0"
  },
  "servers": [
    {
      "url": "https://open-api.stag-v2.paper.id/api/v1"
    }
  ],
  "components": {
    "securitySchemes": {
      "sec0": {
        "type": "apiKey",
        "in": "header",
        "name": "client_id"
      },
      "sec1": {
        "type": "apiKey",
        "in": "header",
        "name": "client_secret"
      }
    }
  },
  "security": [
    {
      "sec0": [],
      "sec1": []
    }
  ],
  "paths": {
    "/payment/balance": {
      "get": {
        "summary": "Retrieve Digital Payment Balance",
        "description": "",
        "operationId": "retrieve-digital-payment-balance",
        "parameters": [
          {
            "name": "client_id",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "client_secret",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "200",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{\n    \"data\": {\n        \"currency\": \"IDR\",\n        \"on_hold_amount\": 0,\n        \"balance\": 56005\n    },\n    \"meta\": {\n        \"created_at\": \"2024-03-13 15:20:31.928975612 +0700 WIB\",\n        \"modified_at\": \"2024-03-13 15:20:31.928975612 +0700 WIB\"\n    }\n}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "object",
                      "properties": {
                        "currency": {
                          "type": "string",
                          "example": "IDR"
                        },
                        "on_hold_amount": {
                          "type": "integer",
                          "example": 0,
                          "default": 0
                        },
                        "balance": {
                          "type": "integer",
                          "example": 56005,
                          "default": 0
                        }
                      }
                    },
                    "meta": {
                      "type": "object",
                      "properties": {
                        "created_at": {
                          "type": "string",
                          "example": "2024-03-13 15:20:31.928975612 +0700 WIB"
                        },
                        "modified_at": {
                          "type": "string",
                          "example": "2024-03-13 15:20:31.928975612 +0700 WIB"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "400",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {}
                }
              }
            }
          }
        },
        "deprecated": false
      }
    }
  },
  "x-readme": {
    "headers": [],
    "explorer-enabled": true,
    "proxy-enabled": true
  },
  "x-readme-fauxas": true
}
```

Retrieve List of Balance Transactions

# Retrieve List of Balance Transactions

This API is used to check all the transactions of digital payment transactions from customer and withdrawal balance

# OpenAPI definition

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "version-1",
    "version": "1.0"
  },
  "servers": [
    {
      "url": "https://open-api.stag-v2.paper.id/api/v1"
    }
  ],
  "components": {
    "securitySchemes": {
      "sec0": {
        "type": "apiKey",
        "in": "header",
        "name": "client_id"
      },
      "sec1": {
        "type": "apiKey",
        "in": "header",
        "name": "client_secret"
      }
    }
  },
  "security": [
    {
      "sec0": [],
      "sec1": []
    }
  ],
  "paths": {
    "/payment/balance/list": {
      "get": {
        "summary": "Retrieve List of Balance Transactions",
        "description": "",
        "operationId": "retrieve-list-of-balance-transactions",
        "parameters": [
          {
            "name": "limit",
            "in": "query",
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "offset",
            "in": "query",
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "200",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {}
                }
              }
            }
          },
          "400": {
            "description": "400",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {}
                }
              }
            }
          }
        },
        "deprecated": false
      }
    }
  },
  "x-readme": {
    "headers": [],
    "explorer-enabled": true,
    "proxy-enabled": true
  },
  "x-readme-fauxas": true
}
```

# Sales Invoice

### Overview

The Sales Invoice API is a robust platform designed to facilitate seamless A/R (account receivables) interactions. Its comprehensive suite of functionalities ensures that businesses can efficiently manage, create, retrieve, and list these documents, streamlining their financial operations.

Consider a scenario where a company needs to generate a new sales invoice, initiate a Paper.id payment, or even get an overview of all the financial documents they've processed over a certain period. This API is meticulously crafted to address these diverse needs, ensuring a cohesive and efficient experience.

Create Sales Invoice

# Create Sales Invoice

This API is used for creating sales invoice in Paper.id, and also to provide a payment link that can be shared to the customer as needed.

By creating invoice using this API, also automatically create a new partner if the partner number is not yet registered

| Path                          | Data Type | Validation | Description                                                                                                                |
| ----------------------------- | --------- | ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| `invoice_date`                | Date      | Mandatory  | Date of the invoice                                                                                                        |
| `due_date`                    | Date      | Mandatory  | Due date for the invoice                                                                                                   |
| `number`                      | String    | Mandatory  | Invoice number                                                                                                             |
| `customer.id`                 | String    | Mandatory  | ID of the customer                                                                                                         |
| `customer.name`               | String    | Mandatory  | Name of the customer                                                                                                       |
| `customer.email`              | String    | Optional   | Email of the customer                                                                                                      |
| `customer.phone`              | String    | Mandatory  | Phone number of the customer                                                                                               |
| `items`                       | Array     | Mandatory  | List of items in the invoice                                                                                               |
| `items.name`                  | String    | Mandatory  | Product Name                                                                                                               |
| `items.description`           | String    | Mandatory  | Description of the item                                                                                                    |
| `items.quantity`              | Int       | Mandatory  | Quantity of the item                                                                                                       |
| `items.price`                 | Int       | Mandatory  | Price of the item                                                                                                          |
| `items.discount`              | Int       | Optional   | Discount on the item -- would be default to percentage in case `discount_type` is missing                                  |
| `items.discount_type`         | string    | Optional   | Type of discount - can be either `amount` or `percentage`                                                                  |
| `items.tax_id`                | Int       | Optional   | Tax ID on the item                                                                                                         |
| `items.additional_info`       | Object    | Optional   | Additional information related to the item                                                                                 |
| `signature_text_header`       | String    | Optional   | Text above the document signature area                                                                                     |
| `signature_text_footer`       | String    | Optional   | Text below the document signature area                                                                                     |
| `terms_condition`             | String    | Optional   | Terms and conditions for the invoice                                                                                       |
| `notes`                       | String    | Optional   | Additional notes for the invoice                                                                                           |
| `send.email`                  | Boolean   | Mandatory  | Flag to determine if the invoice should be sent via email                                                                  |
| `send.whatsapp`               | Boolean   | Mandatory  | Flag to determine if the invoice should be sent via WhatsApp                                                               |
| `send.sms`                    | Boolean   | Mandatory  | Flag to determine if the invoice should be sent via SMS.                                                                   |
| `additional_info`             | Object    | Optional   | Additional information for the invoice                                                                                     |
| `additional_discount`         | Int       | Optional   | Additional discount applied to the transaction -- default to absolute amount in case `additional_discount_type` is missing |
| `additional_discount_type`    | String    | Optional   | Discount type applied to the whole invoice - can either be `percentage` or `amount`                                        |
| `additional_fee`              | Object    | Optional   | Any extra charges or fees incurred in addition to the base transaction amount                                              |
| `additional_fee.delivery_fee` | Int       | Optional   | The charge for delivering goods or services                                                                                |

# OpenAPI definition

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "version-1",
    "version": "1.0"
  },
  "servers": [
    {
      "url": "https://open-api.stag-v2.paper.id/api/v1"
    }
  ],
  "components": {
    "securitySchemes": {
      "sec0": {
        "type": "apiKey",
        "in": "header",
        "name": "client_id"
      },
      "sec1": {
        "type": "apiKey",
        "in": "header",
        "name": "client_secret"
      }
    }
  },
  "security": [
    {
      "sec0": [],
      "sec1": []
    }
  ],
  "paths": {
    "/store-invoice": {
      "post": {
        "summary": "Create Sales Invoice",
        "description": "",
        "operationId": "create-sales-invoice",
        "parameters": [
          {
            "name": "client_id",
            "in": "header",
            "description": "Your Client ID credential",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "client_secret",
            "in": "header",
            "description": "Your Client secret credential",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "invoice_date",
                  "due_date",
                  "number",
                  "customer",
                  "items",
                  "send"
                ],
                "properties": {
                  "invoice_date": {
                    "type": "string",
                    "description": "Invoice Date, using DD-MM-YYYY format",
                    "format": "date"
                  },
                  "due_date": {
                    "type": "string",
                    "description": "Due Date of Invoice, using DD-MM-YYYY format",
                    "format": "date"
                  },
                  "number": {
                    "type": "string",
                    "description": "Invoice Number"
                  },
                  "customer": {
                    "type": "object",
                    "description": "Customer Detail Information",
                    "properties": {
                      "id": {
                        "type": "string",
                        "description": "Customer ID"
                      },
                      "name": {
                        "type": "string",
                        "description": "Customer Name"
                      },
                      "email": {
                        "type": "string",
                        "description": "Customer Email"
                      },
                      "phone": {
                        "type": "string",
                        "description": "Customer Phone Number"
                      }
                    }
                  },
                  "items": {
                    "type": "array",
                    "description": "Item Details",
                    "items": {
                      "properties": {
                        "name": {
                          "type": "string",
                          "description": "Item Name"
                        },
                        "description": {
                          "type": "string",
                          "description": "Item Description"
                        },
                        "quantity": {
                          "type": "integer",
                          "description": "Item Quantity",
                          "format": "int32"
                        },
                        "price": {
                          "type": "integer",
                          "description": "item price",
                          "format": "int32"
                        },
                        "discount": {
                          "type": "integer",
                          "description": "Discount",
                          "format": "int32"
                        },
                        "tax": {
                          "type": "integer",
                          "description": "Tax Amount",
                          "format": "int32"
                        },
                        "additional_info": {
                          "type": "object"
                        }
                      },
                      "type": "object"
                    }
                  },
                  "signature_text_header": {
                    "type": "string",
                    "description": "signature text header"
                  },
                  "signature_text_footer": {
                    "type": "string",
                    "description": "signature text footer"
                  },
                  "terms_condition": {
                    "type": "string",
                    "description": "terms and condition"
                  },
                  "notes": {
                    "type": "string",
                    "description": "Notes"
                  },
                  "send": {
                    "type": "object",
                    "properties": {
                      "email": {
                        "type": "boolean",
                        "description": "email",
                        "default": true
                      },
                      "whatsapp": {
                        "type": "boolean",
                        "description": "whatsapp",
                        "default": true
                      },
                      "sms": {
                        "type": "boolean",
                        "default": true
                      }
                    }
                  },
                  "additional_info": {
                    "type": "object",
                    "description": "additional info",
                    "properties": {}
                  },
                  "additional_fee": {
                    "type": "array",
                    "items": {
                      "properties": {
                        "delivery_fee": {
                          "type": "number",
                          "format": "double"
                        }
                      },
                      "type": "object"
                    }
                  }
                }
              },
              "examples": {
                "Request Example": {
                  "value": {
                    "invoice_date": "23-11-2025",
                    "due_date": "30-11-2025",
                    "number": "INV/2025/11/0001",
                    "customer": {
                      "id": "TESTMITRA001",
                      "name": "Mitra Testing",
                      "email": "{{PARTNER_EMAIL_TEST}}",
                      "phone": "{{PARTNER_EMAIL_PHONE}}"
                    },
                    "items": [
                      {
                        "name": "black tie",
                        "description": "color is black",
                        "quantity": 2,
                        "price": 10000,
                        "discount": 50,
                        "tax_id": "",
                        "additional_info": {}
                      }
                    ],
                    "signature_text_header": "November 23, 2025",
                    "signature_text_footer": "Your Store",
                    "terms_condition": "We receive payment no later than 7 days after the bill is received",
                    "notes": "Invoice include service fee",
                    "send": {
                      "email": true,
                      "whatsapp": true,
                      "sms": true
                    },
                    "additional_info": {}
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "201",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{\n    \"status_code\": 201,\n    \"data\": {\n        \"id\": \"aad61dca-9be0-4663-9e9a-dd8d76c0b077\",\n        \"number\": \"INV/08/08/0021\",\n        \"payper_url\": \"get.paper.id/21d1rdK\",\n        \"pdf_url\": \"https://storage.googleapis.com/ppr-prd/export/4b3419d8-06d1-449c-9632-887b6c12ecda/sales-invoice/pdf/INV_SAL_INV_08_08_0021.pdf\",\n        \"pdf_url_short\": \"get.paper.id/W7vfptM\",\n        \"status_send\": {\n            \"email\": true,\n            \"whatsapp\": true,\n            \"sms\": true\n        }\n    }\n}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "status_code": {
                      "type": "integer",
                      "example": 201,
                      "default": 0
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "string",
                          "example": "aad61dca-9be0-4663-9e9a-dd8d76c0b077"
                        },
                        "number": {
                          "type": "string",
                          "example": "INV/08/08/0021"
                        },
                        "payper_url": {
                          "type": "string",
                          "example": "get.paper.id/21d1rdK"
                        },
                        "pdf_url": {
                          "type": "string",
                          "example": "https://storage.googleapis.com/ppr-prd/export/4b3419d8-06d1-449c-9632-887b6c12ecda/sales-invoice/pdf/INV_SAL_INV_08_08_0021.pdf"
                        },
                        "pdf_url_short": {
                          "type": "string",
                          "example": "get.paper.id/W7vfptM"
                        },
                        "status_send": {
                          "type": "object",
                          "properties": {
                            "email": {
                              "type": "boolean",
                              "example": true,
                              "default": true
                            },
                            "whatsapp": {
                              "type": "boolean",
                              "example": true,
                              "default": true
                            },
                            "sms": {
                              "type": "boolean",
                              "example": true,
                              "default": true
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "400",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{\n    \"error\": {\n        \"status_code\": 400,\n        \"message\": \"number sudah dipakai.\"\n    }\n}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": {
                      "type": "object",
                      "properties": {
                        "status_code": {
                          "type": "integer",
                          "example": 400,
                          "default": 0
                        },
                        "message": {
                          "type": "string",
                          "example": "number sudah dipakai."
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "deprecated": false
      }
    }
  },
  "x-readme": {
    "headers": [],
    "explorer-enabled": true,
    "proxy-enabled": true
  },
  "x-readme-fauxas": true
}
```

# Retrieve a Sales Invoice Details

# OpenAPI definition

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "version-1",
    "version": "1.0"
  },
  "servers": [
    {
      "url": "https://open-api.stag-v2.paper.id/api/v1"
    }
  ],
  "components": {
    "securitySchemes": {
      "sec0": {
        "type": "apiKey",
        "in": "header",
        "name": "client_id"
      },
      "sec1": {
        "type": "apiKey",
        "in": "header",
        "name": "client_secret"
      }
    }
  },
  "security": [
    {
      "sec0": [],
      "sec1": []
    }
  ],
  "paths": {
    "/sales-invoices/{invoice_id}": {
      "get": {
        "summary": "Retrieve a Sales Invoice Details",
        "description": "",
        "operationId": "retrieve-single-sales-invoice-details",
        "parameters": [
          {
            "name": "invoice_id",
            "in": "path",
            "schema": {
              "type": "string",
              "default": ""
            },
            "required": true
          }
        ],
        "responses": {
          "200": {
            "description": "200",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{\n    \"data\": {\n        \"number\": \"INV/08/08/0008\",\n        \"invoice_date\": \"2023-08-08\",\n        \"due_date\": \"2023-08-20\",\n        \"status\": {\n            \"payment_status\": \"overdue\",\n            \"acceptance_status\": \"accepted\"\n        },\n        \"payment_link\": \"get.paper.id/jG8q92b\",\n        \"pdf_link\": \"get.paper.id/JzdYh2J\",\n        \"customer\": {\n            \"id\": \"0002\",\n            \"company_name\": \"Budi Tech\",\n            \"company_email\": \"budi@ptabcd.id\",\n            \"company_phone\": \"38478273482\",\n            \"href\": \"/partners/8f2078f7-5c8c-40cf-a6cb-e405dd432762\",\n            \"contacts\": []\n        },\n        \"items\": [\n            {\n                \"name\": \"item 01\",\n                \"code\": \"\",\n                \"description\": \"color is black\",\n                \"quantity\": 2,\n                \"uom\": \"\",\n                \"price\": 10000,\n                \"discount\": 50,\n                \"tax\": 0,\n                \"product_href\": \"/products/ec93d51a-7ced-42e6-aaca-c58e5e6755c9\",\n                \"additional_info\": null\n            }\n        ]\n    },\n    \"additional_fee\": {\n        \"delivery_fee\": 0\n    },\n    \"total\": 10000,\n    \"signature_text_header\": \"August 08, 2023\",\n    \"signature_text_footer\": \"Your Store\",\n    \"terms_condition\": \"We receive payment no later than 7 days after the bill is received\",\n    \"notes\": \"Invoice include service fee\",\n    \"created_at\": \"2023-08-15 11:38:46\",\n    \"modified_at\": \"2023-08-15 11:38:59\"\n}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "object",
                      "properties": {
                        "number": {
                          "type": "string",
                          "example": "INV/08/08/0008"
                        },
                        "invoice_date": {
                          "type": "string",
                          "example": "2023-08-08"
                        },
                        "due_date": {
                          "type": "string",
                          "example": "2023-08-20"
                        },
                        "status": {
                          "type": "object",
                          "properties": {
                            "payment_status": {
                              "type": "string",
                              "example": "overdue"
                            },
                            "acceptance_status": {
                              "type": "string",
                              "example": "accepted"
                            }
                          }
                        },
                        "payment_link": {
                          "type": "string",
                          "example": "get.paper.id/jG8q92b"
                        },
                        "pdf_link": {
                          "type": "string",
                          "example": "get.paper.id/JzdYh2J"
                        },
                        "customer": {
                          "type": "object",
                          "properties": {
                            "id": {
                              "type": "string",
                              "example": "0002"
                            },
                            "company_name": {
                              "type": "string",
                              "example": "Budi Tech"
                            },
                            "company_email": {
                              "type": "string",
                              "example": "budi@ptabcd.id"
                            },
                            "company_phone": {
                              "type": "string",
                              "example": "38478273482"
                            },
                            "href": {
                              "type": "string",
                              "example": "/partners/8f2078f7-5c8c-40cf-a6cb-e405dd432762"
                            },
                            "contacts": {
                              "type": "array"
                            }
                          }
                        },
                        "items": {
                          "type": "array",
                          "items": {
                            "type": "object",
                            "properties": {
                              "name": {
                                "type": "string",
                                "example": "item 01"
                              },
                              "code": {
                                "type": "string",
                                "example": ""
                              },
                              "description": {
                                "type": "string",
                                "example": "color is black"
                              },
                              "quantity": {
                                "type": "integer",
                                "example": 2,
                                "default": 0
                              },
                              "uom": {
                                "type": "string",
                                "example": ""
                              },
                              "price": {
                                "type": "integer",
                                "example": 10000,
                                "default": 0
                              },
                              "discount": {
                                "type": "integer",
                                "example": 50,
                                "default": 0
                              },
                              "tax": {
                                "type": "integer",
                                "example": 0,
                                "default": 0
                              },
                              "product_href": {
                                "type": "string",
                                "example": "/products/ec93d51a-7ced-42e6-aaca-c58e5e6755c9"
                              },
                              "additional_info": {}
                            }
                          }
                        }
                      }
                    },
                    "additional_fee": {
                      "type": "object",
                      "properties": {
                        "delivery_fee": {
                          "type": "integer",
                          "example": 0,
                          "default": 0
                        }
                      }
                    },
                    "total": {
                      "type": "integer",
                      "example": 10000,
                      "default": 0
                    },
                    "signature_text_header": {
                      "type": "string",
                      "example": "August 08, 2023"
                    },
                    "signature_text_footer": {
                      "type": "string",
                      "example": "Your Store"
                    },
                    "terms_condition": {
                      "type": "string",
                      "example": "We receive payment no later than 7 days after the bill is received"
                    },
                    "notes": {
                      "type": "string",
                      "example": "Invoice include service fee"
                    },
                    "created_at": {
                      "type": "string",
                      "example": "2023-08-15 11:38:46"
                    },
                    "modified_at": {
                      "type": "string",
                      "example": "2023-08-15 11:38:59"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "400",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{\n  \"error\": {\n    \"status_code\": 400,\n    \"message\": \"Client_ID  not found budi@ptbcd.id  \"\n  }\n}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": {
                      "type": "object",
                      "properties": {
                        "status_code": {
                          "type": "integer",
                          "example": 400,
                          "default": 0
                        },
                        "message": {
                          "type": "string",
                          "example": "Client_ID  not found budi@ptbcd.id  "
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "deprecated": false,
        "x-readme": {
          "code-samples": [
            {
              "language": "curl",
              "code": "curl --location 'https://open-api.stag-v2.paper.id/api/v1/sales-invoices/{invoice_id}' \\\n--data ''"
            }
          ],
          "samples-languages": [
            "curl"
          ]
        }
      }
    }
  },
  "x-readme": {
    "headers": [],
    "explorer-enabled": true,
    "proxy-enabled": true
  },
  "x-readme-fauxas": true
}
```

Retrieve List of All Sales Invoices

# Retrieve List of All Sales Invoices

# OpenAPI definition

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "version-1",
    "version": "1.0"
  },
  "servers": [
    {
      "url": "https://open-api.stag-v2.paper.id/api/v1"
    }
  ],
  "components": {
    "securitySchemes": {
      "sec0": {
        "type": "apiKey",
        "in": "header",
        "name": "client_id"
      },
      "sec1": {
        "type": "apiKey",
        "in": "header",
        "name": "client_secret"
      }
    }
  },
  "security": [
    {
      "sec0": [],
      "sec1": []
    }
  ],
  "paths": {
    "/sales-invoices/all": {
      "get": {
        "summary": "Retrieve List of All Sales Invoices",
        "description": "",
        "operationId": "retrieve-list-of-all-sales-invoices",
        "parameters": [
          {
            "name": "status",
            "in": "query",
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "limit",
            "in": "query",
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "offset",
            "in": "query",
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "200",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{\n    \"invoices\": [\n        {\n            \"uuid\": \"aad61dca-9be0-4663-9e9a-dd8d76c0b077\",\n            \"number\": \"INV/08/08/0021\",\n            \"invoice_date\": \"2023-08-08\",\n            \"status\": 3,\n            \"links\": [\n                {\n                    \"rel\": \"self\",\n                    \"href\": \"/sales-invoices/aad61dca-9be0-4663-9e9a-dd8d76c0b077\",\n                    \"type\": \"GET\",\n                    \"kind\": \"item\"\n                },\n                {\n                    \"rel\": \"self\",\n                    \"href\": \"/sales-invoices/send/aad61dca-9be0-4663-9e9a-dd8d76c0b077\",\n                    \"type\": \"POST\",\n                    \"kind\": \"action\"\n                },\n                {\n                    \"rel\": \"self\",\n                    \"href\": \"/sales-invoices/pdf/aad61dca-9be0-4663-9e9a-dd8d76c0b077\",\n                    \"type\": \"GET\",\n                    \"kind\": \"file\"\n                }\n            ]\n        },\n        {\n            \"uuid\": \"55084edc-5417-4a92-b545-f940e1d2cf45\",\n            \"number\": \"INV/08/08/001238\",\n            \"invoice_date\": \"2023-08-08\",\n            \"status\": 3,\n            \"links\": [\n                {\n                    \"rel\": \"self\",\n                    \"href\": \"/sales-invoices/55084edc-5417-4a92-b545-f940e1d2cf45\",\n                    \"type\": \"GET\",\n                    \"kind\": \"item\"\n                },\n                {\n                    \"rel\": \"self\",\n                    \"href\": \"/sales-invoices/send/55084edc-5417-4a92-b545-f940e1d2cf45\",\n                    \"type\": \"POST\",\n                    \"kind\": \"action\"\n                },\n                {\n                    \"rel\": \"self\",\n                    \"href\": \"/sales-invoices/pdf/55084edc-5417-4a92-b545-f940e1d2cf45\",\n                    \"type\": \"GET\",\n                    \"kind\": \"file\"\n                }\n            ]\n        },\n        {\n            \"uuid\": \"07062e35-653a-4dca-817e-f40c4eed588f\",\n            \"number\": \"3f7b1e8f17074d34\",\n            \"invoice_date\": \"0001-01-01\",\n            \"status\": 3,\n            \"links\": [\n                {\n                    \"rel\": \"self\",\n                    \"href\": \"/sales-invoices/07062e35-653a-4dca-817e-f40c4eed588f\",\n                    \"type\": \"GET\",\n                    \"kind\": \"item\"\n                },\n                {\n                    \"rel\": \"self\",\n                    \"href\": \"/sales-invoices/send/07062e35-653a-4dca-817e-f40c4eed588f\",\n                    \"type\": \"POST\",\n                    \"kind\": \"action\"\n                },\n                {\n                    \"rel\": \"self\",\n                    \"href\": \"/sales-invoices/pdf/07062e35-653a-4dca-817e-f40c4eed588f\",\n                    \"type\": \"GET\",\n                    \"kind\": \"file\"\n                }\n            ]\n        },\n        {\n            \"uuid\": \"db158036-e985-4e62-a34c-536a388893ef\",\n            \"number\": \"INV/08/08/0008\",\n            \"invoice_date\": \"2023-08-08\",\n            \"status\": 3,\n            \"links\": [\n                {\n                    \"rel\": \"self\",\n                    \"href\": \"/sales-invoices/db158036-e985-4e62-a34c-536a388893ef\",\n                    \"type\": \"GET\",\n                    \"kind\": \"item\"\n                },\n                {\n                    \"rel\": \"self\",\n                    \"href\": \"/sales-invoices/send/db158036-e985-4e62-a34c-536a388893ef\",\n                    \"type\": \"POST\",\n                    \"kind\": \"action\"\n                },\n                {\n                    \"rel\": \"self\",\n                    \"href\": \"/sales-invoices/pdf/db158036-e985-4e62-a34c-536a388893ef\",\n                    \"type\": \"GET\",\n                    \"kind\": \"file\"\n                }\n            ]\n        },\n        {\n            \"uuid\": \"a5b69547-4afd-49f4-8aa4-db7b61e6ef9d\",\n            \"number\": \"EXP/2023/0001\",\n            \"invoice_date\": \"2023-05-09\",\n            \"status\": 3,\n            \"links\": [\n                {\n                    \"rel\": \"self\",\n                    \"href\": \"/sales-invoices/a5b69547-4afd-49f4-8aa4-db7b61e6ef9d\",\n                    \"type\": \"GET\",\n                    \"kind\": \"item\"\n                },\n                {\n                    \"rel\": \"self\",\n                    \"href\": \"/sales-invoices/send/a5b69547-4afd-49f4-8aa4-db7b61e6ef9d\",\n                    \"type\": \"POST\",\n                    \"kind\": \"action\"\n                },\n                {\n                    \"rel\": \"self\",\n                    \"href\": \"/sales-invoices/pdf/a5b69547-4afd-49f4-8aa4-db7b61e6ef9d\",\n                    \"type\": \"GET\",\n                    \"kind\": \"file\"\n                }\n            ]\n        },\n        {\n            \"uuid\": \"94bb5368-9abb-47c4-bbaf-0e50c8231187\",\n            \"number\": \"INV/2023/24000370\",\n            \"invoice_date\": \"2023-05-09\",\n            \"status\": 3,\n            \"links\": [\n                {\n                    \"rel\": \"self\",\n                    \"href\": \"/sales-invoices/94bb5368-9abb-47c4-bbaf-0e50c8231187\",\n                    \"type\": \"GET\",\n                    \"kind\": \"item\"\n                },\n                {\n                    \"rel\": \"self\",\n                    \"href\": \"/sales-invoices/send/94bb5368-9abb-47c4-bbaf-0e50c8231187\",\n                    \"type\": \"POST\",\n                    \"kind\": \"action\"\n                },\n                {\n                    \"rel\": \"self\",\n                    \"href\": \"/sales-invoices/pdf/94bb5368-9abb-47c4-bbaf-0e50c8231187\",\n                    \"type\": \"GET\",\n                    \"kind\": \"file\"\n                }\n            ]\n        },\n        {\n            \"uuid\": \"a05ad412-b22a-4bfa-b95c-8772dd10391a\",\n            \"number\": \"INV/2023/0001\",\n            \"invoice_date\": \"2023-08-08\",\n            \"status\": 2,\n            \"links\": [\n                {\n                    \"rel\": \"self\",\n                    \"href\": \"/sales-invoices/a05ad412-b22a-4bfa-b95c-8772dd10391a\",\n                    \"type\": \"GET\",\n                    \"kind\": \"item\"\n                },\n                {\n                    \"rel\": \"self\",\n                    \"href\": \"/sales-invoices/send/a05ad412-b22a-4bfa-b95c-8772dd10391a\",\n                    \"type\": \"POST\",\n                    \"kind\": \"action\"\n                },\n                {\n                    \"rel\": \"self\",\n                    \"href\": \"/sales-invoices/pdf/a05ad412-b22a-4bfa-b95c-8772dd10391a\",\n                    \"type\": \"GET\",\n                    \"kind\": \"file\"\n                }\n            ]\n        }\n    ],\n    \"limit\": 8,\n    \"offset\": 0,\n    \"total_records\": 7\n}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "invoices": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "uuid": {
                            "type": "string",
                            "example": "aad61dca-9be0-4663-9e9a-dd8d76c0b077"
                          },
                          "number": {
                            "type": "string",
                            "example": "INV/08/08/0021"
                          },
                          "invoice_date": {
                            "type": "string",
                            "example": "2023-08-08"
                          },
                          "status": {
                            "type": "integer",
                            "example": 3,
                            "default": 0
                          },
                          "links": {
                            "type": "array",
                            "items": {
                              "type": "object",
                              "properties": {
                                "rel": {
                                  "type": "string",
                                  "example": "self"
                                },
                                "href": {
                                  "type": "string",
                                  "example": "/sales-invoices/aad61dca-9be0-4663-9e9a-dd8d76c0b077"
                                },
                                "type": {
                                  "type": "string",
                                  "example": "GET"
                                },
                                "kind": {
                                  "type": "string",
                                  "example": "item"
                                }
                              }
                            }
                          }
                        }
                      }
                    },
                    "limit": {
                      "type": "integer",
                      "example": 8,
                      "default": 0
                    },
                    "offset": {
                      "type": "integer",
                      "example": 0,
                      "default": 0
                    },
                    "total_records": {
                      "type": "integer",
                      "example": 7,
                      "default": 0
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "400",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{\n  \"error\": {\n    \"status_code\": 400,\n    \"message\": \"Client_ID  not found budi@ptabcd.id  \"\n  }\n}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": {
                      "type": "object",
                      "properties": {
                        "status_code": {
                          "type": "integer",
                          "example": 400,
                          "default": 0
                        },
                        "message": {
                          "type": "string",
                          "example": "Client_ID  not found budi@ptabcd.id  "
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "deprecated": false,
        "x-readme": {
          "code-samples": [
            {
              "language": "curl",
              "code": "curl --location 'https://open-api.stag-v2.paper.id/api/v1/sales-invoices/all' \\"
            }
          ],
          "samples-languages": [
            "curl"
          ]
        }
      }
    }
  },
  "x-readme": {
    "headers": [],
    "explorer-enabled": true,
    "proxy-enabled": true
  },
  "x-readme-fauxas": true
}
```

# Update Sales Invoice

# OpenAPI definition

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "version-1",
    "version": "1.0"
  },
  "servers": [
    {
      "url": "https://open-api.stag-v2.paper.id/api/v1"
    }
  ],
  "components": {
    "securitySchemes": {
      "sec0": {
        "type": "apiKey",
        "in": "header",
        "name": "client_id"
      },
      "sec1": {
        "type": "apiKey",
        "in": "header",
        "name": "client_secret"
      }
    }
  },
  "security": [
    {
      "sec0": [],
      "sec1": []
    }
  ],
  "paths": {
    "/sales-invoice/{invoice_id}/update": {
      "post": {
        "summary": "Update Sales Invoice",
        "description": "",
        "operationId": "update-sales-invoice",
        "parameters": [
          {
            "name": "invoice_id",
            "in": "path",
            "schema": {
              "type": "string"
            },
            "required": true
          },
          {
            "name": "client_id",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "client_secret",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "invoice_date",
                  "due_date",
                  "number",
                  "customer",
                  "items",
                  "totals",
                  "send"
                ],
                "properties": {
                  "invoice_date": {
                    "type": "string",
                    "description": "The format is DD-MM-YYYY"
                  },
                  "due_date": {
                    "type": "string",
                    "description": "DD-MM-YYYY Format"
                  },
                  "number": {
                    "type": "string",
                    "description": "It is the intended invoice number to be posted"
                  },
                  "customer": {
                    "type": "object",
                    "properties": {
                      "id": {
                        "type": "string",
                        "description": "Partner ID Number"
                      },
                      "name": {
                        "type": "string",
                        "description": "Company Name"
                      },
                      "email": {
                        "type": "string",
                        "description": "Company Email"
                      },
                      "phone": {
                        "type": "string"
                      }
                    },
                    "required": [
                      "id",
                      "name",
                      "phone"
                    ]
                  },
                  "items": {
                    "type": "object",
                    "properties": {
                      "name": {
                        "type": "string",
                        "description": "Item Name"
                      },
                      "description": {
                        "type": "string",
                        "description": "Item Description"
                      },
                      "quantity": {
                        "type": "integer",
                        "description": "Item Quantity",
                        "format": "int32"
                      },
                      "price": {
                        "type": "integer",
                        "description": "item price",
                        "format": "int32"
                      },
                      "discount": {
                        "type": "integer",
                        "description": "Discount",
                        "format": "int32"
                      },
                      "tax": {
                        "type": "integer",
                        "description": "Tax Amount",
                        "format": "int32"
                      },
                      "additional_info": {
                        "type": "object",
                        "properties": {}
                      }
                    }
                  },
                  "totals": {
                    "type": "string",
                    "description": "It is required for now"
                  },
                  "signature_text_header": {
                    "type": "string"
                  },
                  "signature_text_footer": {
                    "type": "string"
                  },
                  "terms_condition": {
                    "type": "string"
                  },
                  "notes": {
                    "type": "string"
                  },
                  "send": {
                    "type": "array",
                    "description": "One of the method should be TRUE",
                    "items": {
                      "properties": {
                        "email": {
                          "type": "boolean",
                          "description": "email",
                          "default": true
                        },
                        "whatsapp": {
                          "type": "boolean",
                          "description": "whatsapp",
                          "default": true
                        },
                        "sms": {
                          "type": "boolean",
                          "default": true
                        }
                      },
                      "type": "object"
                    }
                  },
                  "total_discount": {
                    "type": "integer",
                    "format": "int32"
                  },
                  "additional_fee": {
                    "type": "array",
                    "items": {
                      "properties": {
                        "delivery_fee": {
                          "type": "number",
                          "format": "double"
                        }
                      },
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "200",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{\n    \"status_code\": 200,\n    \"data\": {\n        \"id\": \"e7c55585-86cf-4dd9-b1ee-1f42ca51c619\",\n        \"number\": \"INV/API/2023/000021203\",\n        \"invoice_date\": \"2023-05-04\",\n        \"due_date\": \"2023-12-20\",\n        \"payment_status\": \"overdue\",\n        \"acceptance_status\": \"not accepted\",\n        \"partner\": {\n            \"id\": \"PAPER/100\",\n            \"name\": \"Test paper\",\n            \"email\": \"\",\n            \"phone\": \"085157815521\"\n        },\n        \"items\": [\n            {\n                \"uuid\": \"1867fae7-c337-4743-901e-af00e69cd1ca\",\n                \"item_name\": \"SPRING\",\n                \"item_description\": \"Untuk mesin knapsack/semprot hama 15/20liter bensin campur 2 tak\",\n                \"quantity\": 2,\n                \"discount\": 0,\n                \"price\": 200000,\n                \"tax_id\": \"\"\n            }\n        ],\n        \"additional_discount\": 0,\n        \"total\": 390000,\n        \"notes\": \"Konfirmasi Pembayaran melalui WA\",\n        \"signature_text_header\": \"Invoice Testing\",\n        \"signature_text_footer\": \"USER FINANCE 1\",\n        \"additional_info\": {\n            \"address\": \"Jalan Noin No 23, RT 001 RW 002, Tebet, Kec. Menteng Dalam, Jakarta Selatan, DKI, Jakarta, Indonesia\",\n            \"cash_discount\": \"0.0\",\n            \"do_number\": \"DO/2023/00011\",\n            \"down_payment\": \"0.0\",\n            \"order_number\": \"PO/2023/0002\",\n            \"pelaksana\": \"Salam Pesi\",\n            \"points\": \"0.0\",\n            \"signature_name\": \"FAT MANAGER\"\n        },\n        \"payper_url\": \"get.paper.id/VMMSr3z\",\n        \"pdf_url\": \"https://storage.googleapis.com/ppr-prd/export/2694cebf-975a-4f7d-b07c-596f0af5c9a2/sales-invoice/pdf/INV_SAL_INV_API_2023_000021203.pdf\",\n        \"pdf_url_short\": \"get.paper.id/r5RXz3m\",\n        \"status_send\": {\n            \"email\": true,\n            \"whatsapp\": false,\n            \"sms\": false\n        },\n        \"created_at\": \"2024-01-05 21:18:24\",\n        \"updated_at\": \"2024-01-05 21:28:47\",\n        \"is_manually_calculated\": false,\n        \"subtotal\": 0\n    }\n}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "status_code": {
                      "type": "integer",
                      "example": 200,
                      "default": 0
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "string",
                          "example": "e7c55585-86cf-4dd9-b1ee-1f42ca51c619"
                        },
                        "number": {
                          "type": "string",
                          "example": "INV/API/2023/000021203"
                        },
                        "invoice_date": {
                          "type": "string",
                          "example": "2023-05-04"
                        },
                        "due_date": {
                          "type": "string",
                          "example": "2023-12-20"
                        },
                        "payment_status": {
                          "type": "string",
                          "example": "overdue"
                        },
                        "acceptance_status": {
                          "type": "string",
                          "example": "not accepted"
                        },
                        "partner": {
                          "type": "object",
                          "properties": {
                            "id": {
                              "type": "string",
                              "example": "PAPER/100"
                            },
                            "name": {
                              "type": "string",
                              "example": "Test paper"
                            },
                            "email": {
                              "type": "string",
                              "example": ""
                            },
                            "phone": {
                              "type": "string",
                              "example": "085157815521"
                            }
                          }
                        },
                        "items": {
                          "type": "array",
                          "items": {
                            "type": "object",
                            "properties": {
                              "uuid": {
                                "type": "string",
                                "example": "1867fae7-c337-4743-901e-af00e69cd1ca"
                              },
                              "item_name": {
                                "type": "string",
                                "example": "SPRING"
                              },
                              "item_description": {
                                "type": "string",
                                "example": "Untuk mesin knapsack/semprot hama 15/20liter bensin campur 2 tak"
                              },
                              "quantity": {
                                "type": "integer",
                                "example": 2,
                                "default": 0
                              },
                              "discount": {
                                "type": "integer",
                                "example": 0,
                                "default": 0
                              },
                              "price": {
                                "type": "integer",
                                "example": 200000,
                                "default": 0
                              },
                              "tax_id": {
                                "type": "string",
                                "example": ""
                              }
                            }
                          }
                        },
                        "additional_discount": {
                          "type": "integer",
                          "example": 0,
                          "default": 0
                        },
                        "total": {
                          "type": "integer",
                          "example": 390000,
                          "default": 0
                        },
                        "notes": {
                          "type": "string",
                          "example": "Konfirmasi Pembayaran melalui WA"
                        },
                        "signature_text_header": {
                          "type": "string",
                          "example": "Invoice Testing"
                        },
                        "signature_text_footer": {
                          "type": "string",
                          "example": "USER FINANCE 1"
                        },
                        "additional_info": {
                          "type": "object",
                          "properties": {
                            "address": {
                              "type": "string",
                              "example": "Jalan Noin No 23, RT 001 RW 002, Tebet, Kec. Menteng Dalam, Jakarta Selatan, DKI, Jakarta, Indonesia"
                            },
                            "cash_discount": {
                              "type": "string",
                              "example": "0.0"
                            },
                            "do_number": {
                              "type": "string",
                              "example": "DO/2023/00011"
                            },
                            "down_payment": {
                              "type": "string",
                              "example": "0.0"
                            },
                            "order_number": {
                              "type": "string",
                              "example": "PO/2023/0002"
                            },
                            "pelaksana": {
                              "type": "string",
                              "example": "Salam Pesi"
                            },
                            "points": {
                              "type": "string",
                              "example": "0.0"
                            },
                            "signature_name": {
                              "type": "string",
                              "example": "FAT MANAGER"
                            }
                          }
                        },
                        "payper_url": {
                          "type": "string",
                          "example": "get.paper.id/VMMSr3z"
                        },
                        "pdf_url": {
                          "type": "string",
                          "example": "https://storage.googleapis.com/ppr-prd/export/2694cebf-975a-4f7d-b07c-596f0af5c9a2/sales-invoice/pdf/INV_SAL_INV_API_2023_000021203.pdf"
                        },
                        "pdf_url_short": {
                          "type": "string",
                          "example": "get.paper.id/r5RXz3m"
                        },
                        "status_send": {
                          "type": "object",
                          "properties": {
                            "email": {
                              "type": "boolean",
                              "example": true,
                              "default": true
                            },
                            "whatsapp": {
                              "type": "boolean",
                              "example": false,
                              "default": true
                            },
                            "sms": {
                              "type": "boolean",
                              "example": false,
                              "default": true
                            }
                          }
                        },
                        "created_at": {
                          "type": "string",
                          "example": "2024-01-05 21:18:24"
                        },
                        "updated_at": {
                          "type": "string",
                          "example": "2024-01-05 21:28:47"
                        },
                        "is_manually_calculated": {
                          "type": "boolean",
                          "example": false,
                          "default": true
                        },
                        "subtotal": {
                          "type": "integer",
                          "example": 0,
                          "default": 0
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "400",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {}
                }
              }
            }
          }
        },
        "deprecated": false
      }
    }
  },
  "x-readme": {
    "headers": [],
    "explorer-enabled": true,
    "proxy-enabled": true
  },
  "x-readme-fauxas": true
}
```


Send Sales Invoice

# Send Sales Invoice

# OpenAPI definition

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "version-1",
    "version": "1.0"
  },
  "servers": [
    {
      "url": "https://open-api.stag-v2.paper.id/api/v1"
    }
  ],
  "components": {
    "securitySchemes": {
      "sec0": {
        "type": "apiKey",
        "in": "header",
        "name": "client_id"
      },
      "sec1": {
        "type": "apiKey",
        "in": "header",
        "name": "client_secret"
      }
    }
  },
  "security": [
    {
      "sec0": [],
      "sec1": []
    }
  ],
  "paths": {
    "/sales-invoices/send-all/{invoice_id}/": {
      "post": {
        "summary": "Send Sales Invoice",
        "description": "",
        "operationId": "send-sales-invoice",
        "parameters": [
          {
            "name": "invoice_id",
            "in": "path",
            "schema": {
              "type": "string"
            },
            "required": true
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "email": {
                    "type": "object",
                    "properties": {
                      "to": {
                        "type": "string",
                        "description": "indicate the first recipient of the email",
                        "default": "paper@paper.id"
                      },
                      "cc": {
                        "type": "string",
                        "description": "indicate other people that want to be informed with the notification as well",
                        "default": "invoice@paper.id"
                      }
                    }
                  },
                  "whatsapp": {
                    "type": "object",
                    "properties": {
                      "number": {
                        "type": "array",
                        "description": "Phone number that will receive the message from Whatsapp/SMS",
                        "default": [
                          "085157815521"
                        ],
                        "items": {
                          "type": "string"
                        }
                      }
                    }
                  },
                  "sms": {
                    "type": "object",
                    "properties": {
                      "number": {
                        "type": "array",
                        "description": "Phone number that will receive the message from Whatsapp/SMS",
                        "default": [
                          "085157815521"
                        ],
                        "items": {
                          "type": "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "200",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{\n\t“status_code”: 200,\n\t“data”: {\n    “email”: {\n      “status”: 200\n    },\n    “whatsapp”:{\n      “status”: 200\n    },\n    “sms”:{\n      “status”: 200\n    }\n  }\n}\n"
                  }
                }
              }
            }
          },
          "400": {
            "description": "400",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {}
                }
              }
            }
          }
        },
        "deprecated": false
      }
    }
  },
  "x-readme": {
    "headers": [],
    "explorer-enabled": true,
    "proxy-enabled": true
  },
  "x-readme-fauxas": true
}
```

# Stamp Sales Invoice

# OpenAPI definition

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "version-1",
    "version": "1.0"
  },
  "servers": [
    {
      "url": "https://open-api.stag-v2.paper.id/api/v1"
    }
  ],
  "components": {
    "securitySchemes": {
      "sec0": {
        "type": "apiKey",
        "in": "header",
        "name": "client_id"
      },
      "sec1": {
        "type": "apiKey",
        "in": "header",
        "name": "client_secret"
      }
    }
  },
  "security": [
    {
      "sec0": [],
      "sec1": []
    }
  ],
  "paths": {
    "/sales-invoice/stamps": {
      "post": {
        "summary": "Stamp Sales Invoice",
        "description": "",
        "operationId": "stamp-sales-invoice",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "invoice_number",
                  "send"
                ],
                "properties": {
                  "invoice_number": {
                    "type": "string",
                    "description": "The number of the invoice",
                    "default": "INV/2023/0001"
                  },
                  "vis_llx": {
                    "type": "number",
                    "description": "Coordinate for QR Specimen for the PDF file. If you don’t fill this part, the system will automatically assign based on default setting",
                    "format": "double"
                  },
                  "vis_lly": {
                    "type": "number",
                    "description": "Coordinate for QR Specimen for the PDF file. If you don’t fill this part, the system will automatically assign based on default setting",
                    "format": "double"
                  },
                  "vis_urx": {
                    "type": "number",
                    "description": "Coordinate for QR Specimen for the PDF file. If you don’t fill this part, the system will automatically assign based on default setting",
                    "format": "double"
                  },
                  "vis_ury": {
                    "type": "number",
                    "description": "Coordinate for QR Specimen for the PDF file. If you don’t fill this part, the system will automatically assign based on default setting",
                    "format": "double"
                  },
                  "vis_signature_page": {
                    "type": "integer",
                    "description": "Indicate which page that will be stamped",
                    "format": "int32"
                  },
                  "retry_flag": {
                    "type": "boolean",
                    "description": "Use this if the first stamping is not successful, default : false"
                  },
                  "send": {
                    "type": "object",
                    "description": "The sending should be written as true if you want to send the document that has been stamped",
                    "properties": {
                      "email": {
                        "type": "boolean",
                        "description": "email",
                        "default": true
                      },
                      "whatsapp": {
                        "type": "boolean",
                        "description": "whatsapp",
                        "default": true
                      },
                      "sms": {
                        "type": "boolean",
                        "default": true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "200",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{\n    \"data\": {\n        \"created_at\": \"2022-03-01T09:51:27.945523204+07:00\",\n        \"number\": \"INV/API/001\",\n        \"pdf_link\": \"https://storage.googleapis.com/ppr-prd/paper-signadapter/SIGNED/final_98e8ff26_3f2f_74b1_cfa7_7054117bf066_INV_SAL_INV_testdoang_106.pdf\",\n        \"quota\": 6,\n        \"sn_number\": \"ELYSAU1GUE0GODGA0000S9\",\n        \"type\": \"sales-invoice\",\n        \"updated_at\": \"2023-06-07T01:56:46.19507236+07:00\"\n    },\n    \"message\": \"successful file stamping\",\n    \"status\": 200\n}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "object",
                      "properties": {
                        "created_at": {
                          "type": "string",
                          "example": "2022-03-01T09:51:27.945523204+07:00"
                        },
                        "number": {
                          "type": "string",
                          "example": "INV/API/001"
                        },
                        "pdf_link": {
                          "type": "string",
                          "example": "https://storage.googleapis.com/ppr-prd/paper-signadapter/SIGNED/final_98e8ff26_3f2f_74b1_cfa7_7054117bf066_INV_SAL_INV_testdoang_106.pdf"
                        },
                        "quota": {
                          "type": "integer",
                          "example": 6,
                          "default": 0
                        },
                        "sn_number": {
                          "type": "string",
                          "example": "ELYSAU1GUE0GODGA0000S9"
                        },
                        "type": {
                          "type": "string",
                          "example": "sales-invoice"
                        },
                        "updated_at": {
                          "type": "string",
                          "example": "2023-06-07T01:56:46.19507236+07:00"
                        }
                      }
                    },
                    "message": {
                      "type": "string",
                      "example": "successful file stamping"
                    },
                    "status": {
                      "type": "integer",
                      "example": 200,
                      "default": 0
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "400",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {}
                }
              }
            }
          }
        },
        "deprecated": false
      }
    }
  },
  "x-readme": {
    "headers": [],
    "explorer-enabled": true,
    "proxy-enabled": true
  },
  "x-readme-fauxas": true
}
```

Retrieve E-Stamp Balance

# Retrieve E-Stamp Balance

This API is used to check the stamp balance for the company

# OpenAPI definition

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "version-1",
    "version": "1.0"
  },
  "servers": [
    {
      "url": "https://open-api.stag-v2.paper.id/api/v1"
    }
  ],
  "components": {
    "securitySchemes": {
      "sec0": {
        "type": "apiKey",
        "in": "header",
        "name": "client_id"
      },
      "sec1": {
        "type": "apiKey",
        "in": "header",
        "name": "client_secret"
      }
    }
  },
  "security": [
    {
      "sec0": [],
      "sec1": []
    }
  ],
  "paths": {
    "/stamps/check-balance": {
      "post": {
        "summary": "Retrieve E-Stamp Balance",
        "description": "",
        "operationId": "retrieve-e-meterai-balance",
        "responses": {
          "200": {
            "description": "200",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{\n    \"data\": {\n        \"company_id\": \"2694cebf-975a-4f7d-b07c-596f0af5c9a2\",\n        \"created_at\": \"2022-03-01T09:51:27.945523204+07:00\",\n        \"quota\": 3,\n        \"updated_at\": \"2024-01-08T16:52:05.84324251+07:00\"\n    },\n    \"message\": \"Request Success\",\n    \"status\": 200\n}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "object",
                      "properties": {
                        "company_id": {
                          "type": "string",
                          "example": "2694cebf-975a-4f7d-b07c-596f0af5c9a2"
                        },
                        "created_at": {
                          "type": "string",
                          "example": "2022-03-01T09:51:27.945523204+07:00"
                        },
                        "quota": {
                          "type": "integer",
                          "example": 3,
                          "default": 0
                        },
                        "updated_at": {
                          "type": "string",
                          "example": "2024-01-08T16:52:05.84324251+07:00"
                        }
                      }
                    },
                    "message": {
                      "type": "string",
                      "example": "Request Success"
                    },
                    "status": {
                      "type": "integer",
                      "example": 200,
                      "default": 0
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "400",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {}
                }
              }
            }
          }
        },
        "deprecated": false
      }
    }
  },
  "x-readme": {
    "headers": [],
    "explorer-enabled": true,
    "proxy-enabled": true
  },
  "x-readme-fauxas": true
}
```

# Delete Sales Invoice

# OpenAPI definition

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "version-1",
    "version": "1.0"
  },
  "servers": [
    {
      "url": "https://open-api.stag-v2.paper.id/api/v1"
    }
  ],
  "components": {
    "securitySchemes": {
      "sec0": {
        "type": "apiKey",
        "in": "header",
        "name": "client_id"
      },
      "sec1": {
        "type": "apiKey",
        "in": "header",
        "name": "client_secret"
      }
    }
  },
  "security": [
    {
      "sec0": [],
      "sec1": []
    }
  ],
  "paths": {
    "/sales-invoice/{invoice_id}": {
      "delete": {
        "description": "",
        "operationId": "delete_sales-invoice{invoice_id}",
        "responses": {
          "200": {
            "description": "",
            "content": {
              "application/json": {
                "examples": {
                  "Success": {
                    "summary": "Success",
                    "value": {
                      "status_code": 200,
                      "code": "SI-DLT-200",
                      "message": "OK"
                    }
                  }
                }
              }
            }
          },
          "404": {
            "description": "Not Found",
            "content": {
              "application/json": {
                "examples": {
                  "Not Found": {
                    "value": {
                      "status_code": 404,
                      "code": "ERR-CMN-000",
                      "error": "Invoice not found",
                      "message": "Not Found"
                    },
                    "summary": "Not Found"
                  }
                }
              }
            }
          }
        },
        "parameters": [
          {
            "in": "path",
            "name": "invoice_id",
            "schema": {
              "type": "string"
            },
            "required": true
          },
          {
            "name": "client_id",
            "in": "header",
            "required": true,
            "description": "",
            "schema": {
              "type": "string",
              "default": ""
            }
          },
          {
            "name": "client_secret",
            "in": "header",
            "required": true,
            "description": "",
            "schema": {
              "type": "string",
              "default": ""
            }
          }
        ]
      }
    }
  },
  "x-readme": {
    "headers": [],
    "explorer-enabled": true,
    "proxy-enabled": true
  },
  "x-readme-fauxas": true
}
```

Purchase Invoices

# Purchase Invoices

## Purchase Invoice

The Purchase Invoice API allows you to manage and automate your purchase invoices on Paper.id. With this API, you can create, retrieve, update, and delete purchase invoices, ensuring seamless integration with your existing systems and workflows.

### Core Features:

* **Create Purchase Invoices**: Automate the creation of purchase invoices by integrating your system with Paper.id.
* **Retrieve Purchase Invoices**: Fetch all your purchase invoices or filter them based on specific criteria, such as date range or partner ID.
* **Update Purchase Invoices**: Ensure your purchase invoice data remains accurate and up-to-date by updating them via the API.
* **Delete Purchase Invoices**: Remove outdated or incorrect purchase invoices from your Paper.id account.

### Use Cases:

* **Automated Invoice Creation**: Integrate your procurement system with Paper.id to automatically create purchase invoices when orders are placed.
* **Invoice Management**: Retrieve all purchase invoices for a specific time period to generate financial reports or for reconciliation purposes.

### Quick Links:

* [Getting Started with Purchase Invoice API](#getting-started)
* [API Reference](#api-reference)
* [Authentication](#authentication)
* [Error Codes](#error-codes)

# Create a Purchase Invoice

Store or Create Purchase Invoice from Vendor/Supplier in Paper.id

<br />

# OpenAPI definition

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "version-2",
    "version": "1.0"
  },
  "servers": [
    {
      "url": "https://open-api.stag-v2.paper.id/api/v2"
    }
  ],
  "components": {
    "securitySchemes": {
      "sec0": {
        "type": "apiKey",
        "in": "header",
        "name": "client_id"
      },
      "sec1": {
        "type": "apiKey",
        "in": "header",
        "name": "client_secret"
      }
    }
  },
  "security": [
    {
      "sec0": [],
      "sec1": []
    }
  ],
  "paths": {
    "/purchase-invoice": {
      "post": {
        "summary": "Create a Purchase Invoice",
        "description": "You can create a Purchase Invoice Document",
        "operationId": "create-a-purchase-invoice",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "partner_id",
                  "invoice_number",
                  "items",
                  "invoice_date",
                  "invoice_due_date"
                ],
                "properties": {
                  "partner_id": {
                    "type": "string",
                    "description": "Partner UUID, please make sure that the partner is already registered. partner is should be registered in paper.id system either as supplier or both (client and supplier)"
                  },
                  "invoice_number": {
                    "type": "string",
                    "description": "Invoice number, unique value"
                  },
                  "invoice_date": {
                    "type": "string",
                    "description": "Invoice creation date in YYYY-MM-DD format",
                    "format": "date"
                  },
                  "invoice_due_date": {
                    "type": "string",
                    "description": "Invoice payment due date in YYYY-MM-DD format",
                    "format": "date"
                  },
                  "items": {
                    "type": "array",
                    "description": "Product details of the invoices",
                    "items": {
                      "properties": {
                        "product_name": {
                          "type": "string",
                          "description": "Product Name"
                        },
                        "description": {
                          "type": "string",
                          "description": "Product Description"
                        },
                        "quantity": {
                          "type": "integer",
                          "description": "Product quantity",
                          "format": "int32"
                        },
                        "price": {
                          "type": "number",
                          "description": "Product price per unit"
                        },
                        "discount": {
                          "type": "number",
                          "description": "Product discount per unit. Value should be in percentage",
                          "format": "float"
                        },
                        "tax_id": {
                          "type": "string",
                          "description": "Tax UUID, applied tax id in purchase invoices. For tax list, see get tax list API"
                        },
                        "total": {
                          "type": "number",
                          "description": "Total amount for the product"
                        }
                      },
                      "required": [
                        "product_name",
                        "quantity",
                        "price",
                        "total"
                      ],
                      "type": "object"
                    }
                  },
                  "additional_info": {
                    "type": "string",
                    "description": "Additional information for the Purchase Invoice"
                  },
                  "signature_text_header": {
                    "type": "string",
                    "description": "Text above the document signature area"
                  },
                  "signature_text_footer": {
                    "type": "string",
                    "description": "Text below the document signature area"
                  },
                  "terms_and_conditions": {
                    "type": "string",
                    "description": "Description for terms and conditions for the purchase invoice"
                  },
                  "notes": {
                    "type": "string",
                    "description": "Notes for purchase invoice"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "201",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": {
                      "status_code": 201,
                      "code": "PI-CRT-200",
                      "message": "Invoice has been created",
                      "data": {
                        "uuid": "23ecfa55-07e2-41f8-8010-2e0438544213",
                        "invoice_number": "INV/2025/IN/09/01",
                        "company_id": "47a07aa8-711e-4913-86cf-e54d1afcfee5",
                        "partner_id": "249413e5-f4ee-46a0-a8bf-85be2b0a1309",
                        "document_type_id": "inv-02",
                        "invoice_date": "2025-09-15",
                        "due_date": "2025-09-22",
                        "status": "UNPAID",
                        "version": 1,
                        "signature_text_header": "Mei 28, 2025",
                        "signature_text_footer": "Seven Retail Finance",
                        "created_at": "2025-09-15 11:07:54",
                        "updated_at": "2025-09-15 11:07:54",
                        "terms_and_conditions": "terms 1",
                        "notes": "example notes",
                        "grand_total": 10000,
                        "subtotal": 10000,
                        "total_discount": 0,
                        "dpp_amount": 0,
                        "dpp_amount_other": 0,
                        "items": [
                          {
                            "product_name": "Ice Cream",
                            "description": "Ice Cream Vanilla",
                            "sku": "",
                            "uom": "",
                            "quantity": 1,
                            "price": 10000,
                            "discount": 0,
                            "index": 0,
                            "tax_type": "",
                            "discount_amount": 0,
                            "discount_percentage": 0,
                            "discount_string": "",
                            "total": 0
                          }
                        ],
                        "partner": {
                          "uuid": "249413e5-f4ee-46a0-a8bf-85be2b0a1309",
                          "name": "Toto",
                          "email": "christopher.imantaka@paper.id",
                          "phone": "6282310220088"
                        },
                        "tax_invoice": null,
                        "meterai": null,
                        "taxes": []
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "400",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "missing required parameters"
                    },
                    "type": {
                      "type": "string",
                      "example": "invalid_request_error"
                    },
                    "errors": {
                      "type": "object",
                      "properties": {
                        "invoice_id": {
                          "type": "string",
                          "example": "Failed to retrieve purchase invoices."
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "deprecated": false,
        "x-readme": {
          "code-samples": [
            {
              "language": "curl",
              "code": "curl -X POST \"https://open-api.sandbox.paper.id/api/v2/purchase-invoice\" \\\n     -H \"client_id: YOUR_CLIENT_ID\" \\\n     -H \"client_secret: YOUR_CLIENT_SECRET\" \\\n     -H \"Content-Type: application/json\" \\\n     -d '{\n         \"invoice_number\": \"EXP/2023/0002\",\n         \"invoice_date\": \"08-08-2023\",\n         \"due_date\": \"08-08-2023\",\n \t\t\t\t \"partner_id\": \"8273243-823u4823\",\n         \"items\": [\n             {\n                 \"product_name\": \"Ice Cream\",\n                 \"description\": \"Ice Cream Vanilla\"\n                 \"sku\": \"SKU0001\",\n                 \"uom\": \"pcs\",\n                 \"quantity\": 1,\n                 \"price\": 10000,\n                 \"discount\": 0,\n                 \"tax_id\": \"2763821-34734343\",\n                 \"total\": 10000\n             }\n         ],\n         \"notes\": \"example notes\",\n         \"terms_and_conditions\": \"terms 1\",\n         \"additional_info\": \"additional info if needed\"\n     }'\n"
            }
          ],
          "samples-languages": [
            "curl"
          ]
        }
      }
    }
  },
  "x-readme": {
    "headers": [],
    "explorer-enabled": true,
    "proxy-enabled": true
  },
  "x-readme-fauxas": true
}
```


Update Purchase Invoice

# Update Purchase Invoice

Update existing Purchase Invoice Document

When update on a Purchase Document, some behavior below is applied in the process

### Changes on the Item

1. Adding item will make the document with **payment status** paid changed to partially paid
2. Removing item on paid document is prohibited, since the paid bill amount can't be more than total invoice amount

### Changes on document status

1. You can't change the document status from other status to draft

# OpenAPI definition

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "version-2",
    "version": "1.0"
  },
  "servers": [
    {
      "url": "https://open-api.stag-v2.paper.id/api/v2"
    }
  ],
  "components": {
    "securitySchemes": {
      "sec0": {
        "type": "apiKey",
        "in": "header",
        "name": "client_id"
      },
      "sec1": {
        "type": "apiKey",
        "in": "header",
        "name": "client_secret"
      }
    }
  },
  "security": [
    {
      "sec0": [],
      "sec1": []
    }
  ],
  "paths": {
    "/purchase-invoices/:id": {
      "put": {
        "summary": "Update Purchase Invoice",
        "description": "You can update specific Purchase Invoice document",
        "operationId": "update-purchase-invoice",
        "parameters": [
          {
            "name": "invoice_id",
            "in": "query",
            "description": "Purchase Invoice UUID which will be updated",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "partner_id",
                  "invoice_number",
                  "items"
                ],
                "properties": {
                  "partner_id": {
                    "type": "string",
                    "description": "Partner UUID, please make sure that the partner is already registered."
                  },
                  "invoice_number": {
                    "type": "string",
                    "description": "Invoice number, unique value"
                  },
                  "invoice_date": {
                    "type": "string",
                    "description": "Invoice creation date, leave blank to use today's date",
                    "format": "date"
                  },
                  "invoice_due_date": {
                    "type": "string",
                    "description": "Invoice payment due date, Leave blank to use today's date",
                    "format": "date"
                  },
                  "items": {
                    "type": "array",
                    "description": "Product details of the invoices",
                    "items": {
                      "properties": {
                        "product_name": {
                          "type": "string",
                          "description": "Product Name"
                        },
                        "description": {
                          "type": "string",
                          "description": "Product Description"
                        },
                        "quantity": {
                          "type": "integer",
                          "description": "Product quantity",
                          "format": "int32"
                        },
                        "price": {
                          "type": "integer",
                          "description": "Product price per unit",
                          "format": "int32"
                        },
                        "discount": {
                          "type": "number",
                          "description": "Product discount per unit. Value should be in percentage",
                          "format": "float"
                        },
                        "tax_id": {
                          "type": "string",
                          "description": "Tax UUID, applied tax id in purchase invoices. For tax list, see get tax list API"
                        },
                        "total": {
                          "type": "number",
                          "description": "Total amount for the product"
                        }
                      },
                      "required": [
                        "product_name",
                        "quantity",
                        "price"
                      ],
                      "type": "object"
                    }
                  },
                  "additional_info": {
                    "type": "string",
                    "description": "Additional information for the Purchase Invoice"
                  },
                  "signature_text_header": {
                    "type": "string",
                    "description": "Text above the document signature area"
                  },
                  "signature_text_footer": {
                    "type": "string",
                    "description": "Text below the document signature area"
                  },
                  "terms_and_conditions": {
                    "type": "string",
                    "description": "Description for terms and conditions for the purchase invoice"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "200",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": {
                      "status_code": 200,
                      "code": "PI-UPD-200",
                      "message": "Invoice has been updated",
                      "data": {
                        "uuid": "d8f6f803-e2bc-4113-8132-65b7a0216509",
                        "invoice_number": "INV/2025/IN/09/03",
                        "company_id": "47a07aa8-711e-4913-86cf-e54d1afcfee5",
                        "partner_id": "249413e5-f4ee-46a0-a8bf-85be2b0a1309",
                        "document_type_id": "inv-02",
                        "invoice_date": "2025-09-15",
                        "due_date": "2025-09-22",
                        "status": "UNPAID",
                        "version": 2,
                        "signature_text_header": "Mei 28, 2025",
                        "signature_text_footer": "Seven Retail Finance - Edit by API",
                        "created_at": "2025-09-15 13:50:06",
                        "updated_at": "2025-09-15 13:51:38",
                        "terms_and_conditions": "",
                        "notes": "example notes",
                        "grand_total": 10000,
                        "subtotal": 10000,
                        "total_discount": 0,
                        "dpp_amount": 0,
                        "dpp_amount_other": 0,
                        "items": [
                          {
                            "product_name": "Ice Cream Sandwich",
                            "description": "Ice Cream Vanilla",
                            "sku": "",
                            "uom": "",
                            "quantity": 1,
                            "price": 10000,
                            "discount": 0,
                            "index": 0,
                            "tax_type": "",
                            "discount_amount": 0,
                            "discount_percentage": 0,
                            "discount_string": "",
                            "total": 0
                          }
                        ],
                        "partner": {
                          "uuid": "249413e5-f4ee-46a0-a8bf-85be2b0a1309",
                          "name": "Toto",
                          "email": "christopher.imantaka@paper.id",
                          "phone": "6282310220088"
                        },
                        "tax_invoice": null,
                        "meterai": null,
                        "taxes": []
                      }
                    }
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "status": {
                      "type": "string",
                      "example": "success"
                    },
                    "message": {
                      "type": "string",
                      "example": "Purchase invoice updated successfully."
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "invoice_uuid": {
                          "type": "string",
                          "example": "123e4567-e89b-12d3-a456-426614174000"
                        },
                        "invoice_number": {
                          "type": "string",
                          "example": "EXP/2023/0003"
                        },
                        "partner_id": {
                          "type": "string",
                          "example": "8273243-823u4823"
                        },
                        "items": {
                          "type": "array",
                          "items": {
                            "type": "object",
                            "properties": {
                              "product_name": {
                                "type": "string",
                                "example": "Chocolate"
                              },
                              "description": {
                                "type": "string",
                                "example": "Milk Chocolate"
                              },
                              "sku": {
                                "type": "string",
                                "example": "SKU0002"
                              },
                              "uom": {
                                "type": "string",
                                "example": "pcs"
                              },
                              "quantity": {
                                "type": "integer",
                                "example": 2,
                                "default": 0
                              },
                              "price": {
                                "type": "integer",
                                "example": 15000,
                                "default": 0
                              },
                              "discount": {
                                "type": "integer",
                                "example": 0,
                                "default": 0
                              },
                              "tax_id": {
                                "type": "string",
                                "example": "PPH 21 2.5% Gross Up"
                              },
                              "total": {
                                "type": "integer",
                                "example": 30000,
                                "default": 0
                              }
                            }
                          }
                        },
                        "signature_date": {
                          "type": "string",
                          "example": "9 Agt, 2023"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "400",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{  \n   \"message\": \"missing required parameters\",  \n   \"type\": \"invalid_request_error\",  \n   \"errors\": {  \n      \"invoice_id\": \"Failed to retrieve purchase invoices.\"  \n   }  \n}\n"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "missing required parameters"
                    },
                    "type": {
                      "type": "string",
                      "example": "invalid_request_error"
                    },
                    "errors": {
                      "type": "object",
                      "properties": {
                        "invoice_id": {
                          "type": "string",
                          "example": "Failed to retrieve purchase invoices."
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "deprecated": false,
        "x-readme": {
          "code-samples": [
            {
              "language": "curl",
              "code": "curl -X PUT \"https://open-api.sandbox.paper.id/api/v2/purchase-invoices/{INVOICE_ID}\" \\\n     -H \"client_id: YOUR_CLIENT_ID\" \\\n     -H \"client_secret: YOUR_CLIENT_SECRET\" \\\n     -H \"Content-Type: application/json\" \\\n     -d '{\n         \"invoice_reference\": \"EXP/2023/0002\",\n         \"invoice_date\": \"08-08-2023\",\n         \"due_date\": \"08-08-2023\",\n         \"partner_id\": \"8273243-823u4823\",\n         \"items\": [\n             {\n                 \"product\": \"SKU0001 - Ice Cream\",\n                 \"description\": \"Ice Cream\",\n                 \"quantity\": 1,\n                 \"price\": \"Rp 10.000\",\n                 \"discount\": \"0%\",\n                 \"tax\": \"PPH 21 2.5% Gross Up\",\n                 \"total\": \"Rp 10.000\"\n             },\n             {\n                 \"product\": \"SKU0002 - Chocolate\",\n                 \"description\": \"Milk Chocolate\",\n                 \"quantity\": 2,\n                 \"price\": \"Rp 15.000\",\n                 \"discount\": \"0%\",\n                 \"tax\": \"PPH 21 2.5% Gross Up\",\n                 \"total\": \"Rp 30.000\"\n             }\n         ],\n         \"signature_date\": \"9 Agt, 2023\"\n     }'\n"
            }
          ],
          "samples-languages": [
            "curl"
          ]
        }
      }
    }
  },
  "x-readme": {
    "headers": [],
    "explorer-enabled": true,
    "proxy-enabled": true
  },
  "x-readme-fauxas": true
}
```

# Delete Purchase Invoice

Delete an existing Purchase Invoice

Partially Paid or Paid Document can't be deleted

# OpenAPI definition

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "version-2",
    "version": "1.0"
  },
  "servers": [
    {
      "url": "https://open-api.stag-v2.paper.id/api/v2"
    }
  ],
  "components": {
    "securitySchemes": {
      "sec0": {
        "type": "apiKey",
        "in": "header",
        "name": "client_id"
      },
      "sec1": {
        "type": "apiKey",
        "in": "header",
        "name": "client_secret"
      }
    }
  },
  "security": [
    {
      "sec0": [],
      "sec1": []
    }
  ],
  "paths": {
    "/purchase-invoices/{invoice_id}": {
      "delete": {
        "summary": "Delete Purchase Invoice",
        "description": "You can delete specified purchase invoice document. Partially Paid or Paid Document can't be deleted",
        "operationId": "delete-purchase-invoice",
        "parameters": [
          {
            "name": "invoice_id",
            "in": "path",
            "description": "Purchase Invoice UUID which want to be deleted.",
            "schema": {
              "type": "string"
            },
            "required": true
          }
        ],
        "responses": {
          "200": {
            "description": "200",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{\n    \"status\": \"success\",\n    \"message\": \"Purchase invoice deleted successfully.\"\n}\n"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "status": {
                      "type": "string",
                      "example": "success"
                    },
                    "message": {
                      "type": "string",
                      "example": "Purchase invoice deleted successfully."
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "400",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{  \n   \"message\": \"missing required parameters\",  \n   \"type\": \"invalid_request_error\",  \n   \"errors\": {  \n      \"invoice_id\": \"invoice id is required\"  \n   }  \n}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "missing required parameters"
                    },
                    "type": {
                      "type": "string",
                      "example": "invalid_request_error"
                    },
                    "errors": {
                      "type": "object",
                      "properties": {
                        "invoice_id": {
                          "type": "string",
                          "example": "invoice id is required"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "deprecated": false,
        "x-readme": {
          "code-samples": [
            {
              "language": "curl",
              "code": "curl -X DELETE \"https://open-api.sandbox.paper.id/api/v2/purchase-invoice/{INVOICE_ID}\" \\\n     -H \"client_id: YOUR_CLIENT_ID\" \\\n     -H \"client_secret: YOUR_CLIENT_SECRET\"\n"
            }
          ],
          "samples-languages": [
            "curl"
          ]
        }
      }
    }
  },
  "x-readme": {
    "headers": [],
    "explorer-enabled": true,
    "proxy-enabled": true
  },
  "x-readme-fauxas": true
}
```

Retrieve Single Purchase Invoice

# Retrieve Single Purchase Invoice

You can get a specific document details information

<br />

# OpenAPI definition

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "version-2",
    "version": "1.0"
  },
  "servers": [
    {
      "url": "https://open-api.stag-v2.paper.id/api/v2"
    }
  ],
  "components": {
    "securitySchemes": {
      "sec0": {
        "type": "apiKey",
        "in": "header",
        "name": "client_id"
      },
      "sec1": {
        "type": "apiKey",
        "in": "header",
        "name": "client_secret"
      }
    }
  },
  "security": [
    {
      "sec0": [],
      "sec1": []
    }
  ],
  "paths": {
    "/purchase-invoice/{invoice_id}": {
      "get": {
        "summary": "Retrieve Single Purchase Invoice",
        "description": "You can get a specific document details information",
        "operationId": "retrive-single-purchase-invoice-1",
        "parameters": [
          {
            "name": "invoice_id",
            "in": "path",
            "description": "Purchase Invoice ID",
            "schema": {
              "type": "string"
            },
            "required": true
          }
        ],
        "responses": {
          "200": {
            "description": "200",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{\n  \"code\": \"PI-GET-200\",\n  \"message\": \"OK\",\n  \"data\": {\n    \"uuid\": \"458146ea-adbf-432a-8dee-cfdba9ee95c7\",\n    \"invoice_number\": \"241035596pp\",\n    \"company_id\": \"d9c19fb9-96ae-4f37-919d-bffdfae35bf8\",\n    \"partner_id\": \"de1d95c3-b090-4a2a-8e4e-37af8de87d25\",\n    \"document_type_id\": \"inv-02\",\n    \"invoice_date\": \"2024-07-31\",\n    \"due_date\": \"2024-10-11\",\n    \"status\": \"DRAFT\",\n    \"version\": 0,\n    \"signature_text_header\": \"\",\n    \"signature_text_footer\": \"\",\n    \"created_at\": \"2024-08-28 22:40:37\",\n    \"updated_at\": \"2024-08-28 22:40:37\",\n    \"terms_and_conditions\": \"\",\n    \"notes\": \"Nomor Po: POCI00036076 <br> Nomor Surat Jalan: 1400007762 <br> Satuan: BAG\",\n    \"grand_total\": 0,\n    \"subtotal\": 16141312,\n    \"total_discount\": 0,\n    \"tax_inclusive\": 0,\n    \"tax_exclusive\": 0,\n    \"custom_total_per_item\": 0,\n    \"items\": [\n      {\n        \"product_name\": \"ThinBed Adhesive for AAC/\",\n        \"description\": \"ALC\",\n        \"sku\": \"\",\n        \"uom\": null,\n        \"quantity\": 200,\n        \"price\": 80706.56,\n        \"discount\": 0,\n        \"index\": 0,\n        \"tax_type\": \"\",\n        \"discount_amount\": 0,\n        \"discount_percentage\": 0,\n        \"discount_string\": \"\",\n        \"total\": 16141312\n      }\n    ],\n    \"partner\": {\n      \"uuid\": \"de1d95c3-b090-4a2a-8e4e-37af8de87d25\",\n      \"name\": \"ak mw kemeikarta\",\n      \"email\": \"\",\n      \"phone\": \"0215671633\"\n    },\n    \"tax_invoice\": {\n      \"kd_jenis_transaksi\": \"01\",\n      \"fg_pengganti\": \"0\",\n      \"nomor_faktur\": \"0032457222230\",\n      \"tanggal_faktur\": \"08/02/2024\",\n      \"npwp_penjual\": \"016839003086000\",\n      \"nama_penjual\": \"PT PRIMAGRAHA KERAMINDO\",\n      \"alamat_penjual\": \"SENTRA NIAGA PURI INDAH BLOK T.5 / 16-17 RT 002/002, KEMBANGAN SELATAN , JAKARTA BARAT\",\n      \"npwp_lawan_transaksi\": \"013672233054000\",\n      \"nama_lawan_transaksi\": \"PT Catur Sentosa Adiprana, Tbk\",\n      \"alamat_lawan_transaksi\": \"Jl. Daan Mogot Raya No. 234 RT. 004 RW. 05, Kebon Jeruk Jakarta Barat DKI Jakarta Raya - 11510\",\n      \"jumlah_dpp\": \"3372954\",\n      \"jumlah_ppn\": \"371025\",\n      \"jumlah_ppnbm\": \"0\",\n      \"status_approval\": \"Faktur Valid, Sudah Diapprove oleh DJP\",\n      \"status_faktur\": \"Faktur Pajak Normal\",\n      \"referensi\": \"G24001548\",\n      \"detail_transaksi\": [\n        {\n          \"nama\": \"Und Coralia Exp Rustic E Grey\",\n          \"harga_satuan\": \"43243\",\n          \"jumlah_barang\": \"78\",\n          \"harga_total\": \"3372954\",\n          \"diskon\": \"0\",\n          \"dpp\": \"3372954\",\n          \"ppn\": \"371025\",\n          \"tarif_ppnbm\": \"0\",\n          \"ppnBm\": \"0\"\n        }\n      ]\n    }\n  }\n}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "code": {
                      "type": "string",
                      "example": "PI-GET-200"
                    },
                    "message": {
                      "type": "string",
                      "example": "OK"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "uuid": {
                          "type": "string",
                          "example": "458146ea-adbf-432a-8dee-cfdba9ee95c7"
                        },
                        "invoice_number": {
                          "type": "string",
                          "example": "241035596pp"
                        },
                        "company_id": {
                          "type": "string",
                          "example": "d9c19fb9-96ae-4f37-919d-bffdfae35bf8"
                        },
                        "partner_id": {
                          "type": "string",
                          "example": "de1d95c3-b090-4a2a-8e4e-37af8de87d25"
                        },
                        "document_type_id": {
                          "type": "string",
                          "example": "inv-02"
                        },
                        "invoice_date": {
                          "type": "string",
                          "example": "2024-07-31"
                        },
                        "due_date": {
                          "type": "string",
                          "example": "2024-10-11"
                        },
                        "status": {
                          "type": "string",
                          "example": "DRAFT"
                        },
                        "version": {
                          "type": "integer",
                          "example": 0,
                          "default": 0
                        },
                        "signature_text_header": {
                          "type": "string",
                          "example": ""
                        },
                        "signature_text_footer": {
                          "type": "string",
                          "example": ""
                        },
                        "created_at": {
                          "type": "string",
                          "example": "2024-08-28 22:40:37"
                        },
                        "updated_at": {
                          "type": "string",
                          "example": "2024-08-28 22:40:37"
                        },
                        "terms_and_conditions": {
                          "type": "string",
                          "example": ""
                        },
                        "notes": {
                          "type": "string",
                          "example": "Nomor Po: POCI00036076 <br> Nomor Surat Jalan: 1400007762 <br> Satuan: BAG"
                        },
                        "grand_total": {
                          "type": "integer",
                          "example": 0,
                          "default": 0
                        },
                        "subtotal": {
                          "type": "integer",
                          "example": 16141312,
                          "default": 0
                        },
                        "total_discount": {
                          "type": "integer",
                          "example": 0,
                          "default": 0
                        },
                        "tax_inclusive": {
                          "type": "integer",
                          "example": 0,
                          "default": 0
                        },
                        "tax_exclusive": {
                          "type": "integer",
                          "example": 0,
                          "default": 0
                        },
                        "custom_total_per_item": {
                          "type": "integer",
                          "example": 0,
                          "default": 0
                        },
                        "items": {
                          "type": "array",
                          "items": {
                            "type": "object",
                            "properties": {
                              "product_name": {
                                "type": "string",
                                "example": "ThinBed Adhesive for AAC/"
                              },
                              "description": {
                                "type": "string",
                                "example": "ALC"
                              },
                              "sku": {
                                "type": "string",
                                "example": ""
                              },
                              "uom": {},
                              "quantity": {
                                "type": "integer",
                                "example": 200,
                                "default": 0
                              },
                              "price": {
                                "type": "number",
                                "example": 80706.56,
                                "default": 0
                              },
                              "discount": {
                                "type": "integer",
                                "example": 0,
                                "default": 0
                              },
                              "index": {
                                "type": "integer",
                                "example": 0,
                                "default": 0
                              },
                              "tax_type": {
                                "type": "string",
                                "example": ""
                              },
                              "discount_amount": {
                                "type": "integer",
                                "example": 0,
                                "default": 0
                              },
                              "discount_percentage": {
                                "type": "integer",
                                "example": 0,
                                "default": 0
                              },
                              "discount_string": {
                                "type": "string",
                                "example": ""
                              },
                              "total": {
                                "type": "integer",
                                "example": 16141312,
                                "default": 0
                              }
                            }
                          }
                        },
                        "partner": {
                          "type": "object",
                          "properties": {
                            "uuid": {
                              "type": "string",
                              "example": "de1d95c3-b090-4a2a-8e4e-37af8de87d25"
                            },
                            "name": {
                              "type": "string",
                              "example": "ak mw kemeikarta"
                            },
                            "email": {
                              "type": "string",
                              "example": ""
                            },
                            "phone": {
                              "type": "string",
                              "example": "0215671633"
                            }
                          }
                        },
                        "tax_invoice": {
                          "type": "object",
                          "properties": {
                            "kd_jenis_transaksi": {
                              "type": "string",
                              "example": "01"
                            },
                            "fg_pengganti": {
                              "type": "string",
                              "example": "0"
                            },
                            "nomor_faktur": {
                              "type": "string",
                              "example": "0032457222230"
                            },
                            "tanggal_faktur": {
                              "type": "string",
                              "example": "08/02/2024"
                            },
                            "npwp_penjual": {
                              "type": "string",
                              "example": "016839003086000"
                            },
                            "nama_penjual": {
                              "type": "string",
                              "example": "PT PRIMAGRAHA KERAMINDO"
                            },
                            "alamat_penjual": {
                              "type": "string",
                              "example": "SENTRA NIAGA PURI INDAH BLOK T.5 / 16-17 RT 002/002, KEMBANGAN SELATAN , JAKARTA BARAT"
                            },
                            "npwp_lawan_transaksi": {
                              "type": "string",
                              "example": "013672233054000"
                            },
                            "nama_lawan_transaksi": {
                              "type": "string",
                              "example": "PT Catur Sentosa Adiprana, Tbk"
                            },
                            "alamat_lawan_transaksi": {
                              "type": "string",
                              "example": "Jl. Daan Mogot Raya No. 234 RT. 004 RW. 05, Kebon Jeruk Jakarta Barat DKI Jakarta Raya - 11510"
                            },
                            "jumlah_dpp": {
                              "type": "string",
                              "example": "3372954"
                            },
                            "jumlah_ppn": {
                              "type": "string",
                              "example": "371025"
                            },
                            "jumlah_ppnbm": {
                              "type": "string",
                              "example": "0"
                            },
                            "status_approval": {
                              "type": "string",
                              "example": "Faktur Valid, Sudah Diapprove oleh DJP"
                            },
                            "status_faktur": {
                              "type": "string",
                              "example": "Faktur Pajak Normal"
                            },
                            "referensi": {
                              "type": "string",
                              "example": "G24001548"
                            },
                            "detail_transaksi": {
                              "type": "array",
                              "items": {
                                "type": "object",
                                "properties": {
                                  "nama": {
                                    "type": "string",
                                    "example": "Und Coralia Exp Rustic E Grey"
                                  },
                                  "harga_satuan": {
                                    "type": "string",
                                    "example": "43243"
                                  },
                                  "jumlah_barang": {
                                    "type": "string",
                                    "example": "78"
                                  },
                                  "harga_total": {
                                    "type": "string",
                                    "example": "3372954"
                                  },
                                  "diskon": {
                                    "type": "string",
                                    "example": "0"
                                  },
                                  "dpp": {
                                    "type": "string",
                                    "example": "3372954"
                                  },
                                  "ppn": {
                                    "type": "string",
                                    "example": "371025"
                                  },
                                  "tarif_ppnbm": {
                                    "type": "string",
                                    "example": "0"
                                  },
                                  "ppnBm": {
                                    "type": "string",
                                    "example": "0"
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "400",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{  \n   \"message\": \"missing required parameters\",  \n   \"type\": \"invalid_request_error\",  \n   \"errors\": {  \n      \"invoice_id\": \"Failed to retrieve purchase invoices.\"  \n   }  \n}\n"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "missing required parameters"
                    },
                    "type": {
                      "type": "string",
                      "example": "invalid_request_error"
                    },
                    "errors": {
                      "type": "object",
                      "properties": {
                        "invoice_id": {
                          "type": "string",
                          "example": "Failed to retrieve purchase invoices."
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "404": {
            "description": "404",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{\n    \"code\": \"ERR-INV-001\",\n    \"message\": \"invoice not found\"\n}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "code": {
                      "type": "string",
                      "example": "ERR-INV-001"
                    },
                    "message": {
                      "type": "string",
                      "example": "invoice not found"
                    }
                  }
                }
              }
            }
          }
        },
        "deprecated": false,
        "x-readme": {
          "code-samples": [
            {
              "language": "curl",
              "code": "curl -X GET \"https://open-api.sandbox.paper.id/api/v2/purchase-invoice/{INVOICE_ID}\" \\\n     -H \"client_id: YOUR_CLIENT_ID\" \\\n     -H \"client_secret: YOUR_CLIENT_SECRET\"\n"
            }
          ],
          "samples-languages": [
            "curl"
          ]
        }
      }
    }
  },
  "x-readme": {
    "headers": [],
    "explorer-enabled": true,
    "proxy-enabled": true
  },
  "x-readme-fauxas": true
}
```

# List of All Purchase Invoice

You can get list of purchase invoice documents. Optional data filter may be applied

<br />

# OpenAPI definition

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "version-2",
    "version": "1.0"
  },
  "servers": [
    {
      "url": "https://open-api.stag-v2.paper.id/api/v2"
    }
  ],
  "components": {
    "securitySchemes": {
      "sec0": {
        "type": "apiKey",
        "in": "header",
        "name": "client_id"
      },
      "sec1": {
        "type": "apiKey",
        "in": "header",
        "name": "client_secret"
      }
    }
  },
  "security": [
    {
      "sec0": [],
      "sec1": []
    }
  ],
  "paths": {
    "/purchase-invoice": {
      "get": {
        "summary": "List of All Purchase Invoice",
        "description": "You can get list of purchase invoice documents. Optional data filter may be applied",
        "operationId": "list-of-all-purchase-invoice",
        "parameters": [
          {
            "name": "limit",
            "in": "query",
            "description": "To configure the number of items per page.",
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          },
          {
            "name": "offset",
            "in": "query",
            "description": "To specify which page to access.",
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          },
          {
            "name": "order",
            "in": "query",
            "description": "Value: desc, asc. To set the order in which data is displayed, either ascending or descending.",
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "sort",
            "in": "query",
            "description": "To specify the column used for sorting the data.",
            "schema": {
              "type": "string",
              "default": "created_at"
            }
          },
          {
            "name": "start_invoice_date",
            "in": "query",
            "description": "To filter by invoice_date (the end_invoice_date field must be provided).",
            "schema": {
              "type": "string",
              "format": "date"
            }
          },
          {
            "name": "end_invoice_date",
            "in": "query",
            "description": "To filter by invoice_date",
            "schema": {
              "type": "string",
              "format": "date"
            }
          },
          {
            "name": "start_due_date",
            "in": "query",
            "description": "To filter by due_date (the end_due_date field must be provided).",
            "schema": {
              "type": "string",
              "format": "date"
            }
          },
          {
            "name": "end_due_date",
            "in": "query",
            "description": "To filter by due_date",
            "schema": {
              "type": "string",
              "format": "date"
            }
          },
          {
            "name": "client_id",
            "in": "header",
            "description": "A unique identifier assigned to a client application.",
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "client_secret",
            "in": "header",
            "description": "A confidential key associated with the client application.",
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "200",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{\n   \"code\":\"PI-GLT-200\",\n   \"message\":\"OK\",\n   \"data\":[\n      {\n         \"uuid\":\"1d70876a-01c3-46fb-a7ae-4345943f2ad4\",\n         \"invoice_number\":\"EXP/2019/0001\",\n         \"company_id\":\"2cbbd916-14d3-4fc3-9cbe-0c1d759b53e3\",\n         \"partner_id\":\"4bc79ce7-d64f-4c45-8c90-6622ec22f2cf\",\n         \"document_type_id\":\"inv-02\",\n         \"invoice_date\":\"2021-12-05\",\n         \"due_date\":\"2019-12-05\",\n         \"status\":\"PAID\",\n         \"version\":0,\n         \"signature_text_header\":\"5 Dec, 2019\",\n         \"signature_text_footer\":\"Finance\",\n         \"created_at\":\"2019-12-05 23:52:38\",\n         \"updated_at\":\"2020-06-20 02:16:53\",\n         \"terms_and_conditions\":\"\",\n         \"notes\":\"\",\n         \"grand_total\":0,\n         \"subtotal\":0,\n         \"total_discount\":0,\n         \"tax_inclusive\":0,\n         \"tax_exclusive\":0,\n         \"custom_total_per_item\":0,\n         \"items\":[\n            {\n               \"product_name\":\"tes\",\n               \"description\":\"tes\",\n               \"sku\":\"\",\n               \"uom\":null,\n               \"quantity\":10,\n               \"price\":100000,\n               \"discount\":0,\n               \"index\":0,\n               \"tax_type\":\"\",\n               \"discount_amount\":0,\n               \"discount_percentage\":0,\n               \"discount_string\":\"\",\n               \"total\":0\n            }\n         ],\n         \"partner\":{\n            \"uuid\":\"4bc79ce7-d64f-4c45-8c90-6622ec22f2cf\",\n            \"name\":\"Karin 610\",\n            \"email\":\"karin.putri610@gmail.com\",\n            \"phone\":\"123456\"\n         }\n      }\n   ]\n}"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "code": {
                      "type": "string",
                      "example": "PI-GLT-200"
                    },
                    "message": {
                      "type": "string",
                      "example": "OK"
                    },
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "uuid": {
                            "type": "string",
                            "example": "1d70876a-01c3-46fb-a7ae-4345943f2ad4"
                          },
                          "invoice_number": {
                            "type": "string",
                            "example": "EXP/2019/0001"
                          },
                          "company_id": {
                            "type": "string",
                            "example": "2cbbd916-14d3-4fc3-9cbe-0c1d759b53e3"
                          },
                          "partner_id": {
                            "type": "string",
                            "example": "4bc79ce7-d64f-4c45-8c90-6622ec22f2cf"
                          },
                          "document_type_id": {
                            "type": "string",
                            "example": "inv-02"
                          },
                          "invoice_date": {
                            "type": "string",
                            "example": "2021-12-05"
                          },
                          "due_date": {
                            "type": "string",
                            "example": "2019-12-05"
                          },
                          "status": {
                            "type": "string",
                            "example": "PAID"
                          },
                          "version": {
                            "type": "integer",
                            "example": 0,
                            "default": 0
                          },
                          "signature_text_header": {
                            "type": "string",
                            "example": "5 Dec, 2019"
                          },
                          "signature_text_footer": {
                            "type": "string",
                            "example": "Finance"
                          },
                          "created_at": {
                            "type": "string",
                            "example": "2019-12-05 23:52:38"
                          },
                          "updated_at": {
                            "type": "string",
                            "example": "2020-06-20 02:16:53"
                          },
                          "terms_and_conditions": {
                            "type": "string",
                            "example": ""
                          },
                          "notes": {
                            "type": "string",
                            "example": ""
                          },
                          "grand_total": {
                            "type": "integer",
                            "example": 0,
                            "default": 0
                          },
                          "subtotal": {
                            "type": "integer",
                            "example": 0,
                            "default": 0
                          },
                          "total_discount": {
                            "type": "integer",
                            "example": 0,
                            "default": 0
                          },
                          "tax_inclusive": {
                            "type": "integer",
                            "example": 0,
                            "default": 0
                          },
                          "tax_exclusive": {
                            "type": "integer",
                            "example": 0,
                            "default": 0
                          },
                          "custom_total_per_item": {
                            "type": "integer",
                            "example": 0,
                            "default": 0
                          },
                          "items": {
                            "type": "array",
                            "items": {
                              "type": "object",
                              "properties": {
                                "product_name": {
                                  "type": "string",
                                  "example": "tes"
                                },
                                "description": {
                                  "type": "string",
                                  "example": "tes"
                                },
                                "sku": {
                                  "type": "string",
                                  "example": ""
                                },
                                "uom": {},
                                "quantity": {
                                  "type": "integer",
                                  "example": 10,
                                  "default": 0
                                },
                                "price": {
                                  "type": "integer",
                                  "example": 100000,
                                  "default": 0
                                },
                                "discount": {
                                  "type": "integer",
                                  "example": 0,
                                  "default": 0
                                },
                                "index": {
                                  "type": "integer",
                                  "example": 0,
                                  "default": 0
                                },
                                "tax_type": {
                                  "type": "string",
                                  "example": ""
                                },
                                "discount_amount": {
                                  "type": "integer",
                                  "example": 0,
                                  "default": 0
                                },
                                "discount_percentage": {
                                  "type": "integer",
                                  "example": 0,
                                  "default": 0
                                },
                                "discount_string": {
                                  "type": "string",
                                  "example": ""
                                },
                                "total": {
                                  "type": "integer",
                                  "example": 0,
                                  "default": 0
                                }
                              }
                            }
                          },
                          "partner": {
                            "type": "object",
                            "properties": {
                              "uuid": {
                                "type": "string",
                                "example": "4bc79ce7-d64f-4c45-8c90-6622ec22f2cf"
                              },
                              "name": {
                                "type": "string",
                                "example": "Karin 610"
                              },
                              "email": {
                                "type": "string",
                                "example": "karin.putri610@gmail.com"
                              },
                              "phone": {
                                "type": "string",
                                "example": "123456"
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "400",
            "content": {
              "application/json": {
                "examples": {
                  "Result": {
                    "value": "{  \n   \"message\": \"Failed to retrieve purchase invoices.\",  \n   \"type\": \"invalid_request_error\",  \n   \"errors\": {  \n      \"purchase_invoice\": \"Failed to retrieve purchase invoices.\"  \n   }  \n}\n"
                  }
                },
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Failed to retrieve purchase invoices."
                    },
                    "type": {
                      "type": "string",
                      "example": "invalid_request_error"
                    },
                    "errors": {
                      "type": "object",
                      "properties": {
                        "purchase_invoice": {
                          "type": "string",
                          "example": "Failed to retrieve purchase invoices."
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "deprecated": false,
        "x-readme": {
          "code-samples": [
            {
              "language": "curl",
              "code": "curl -X GET \"https://open-api.sandbox.paper.id/api/v2/purchase-invoice\" \\\n     -H \"client_id: YOUR_CLIENT_ID\" \\\n     -H \"client_secret: YOUR_CLIENT_SECRET\"\n"
            }
          ],
          "samples-languages": [
            "curl"
          ]
        }
      }
    }
  },
  "x-readme": {
    "headers": [],
    "explorer-enabled": true,
    "proxy-enabled": true
  },
  "x-readme-fauxas": true
}
```