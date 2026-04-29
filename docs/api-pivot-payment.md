# Pivot API Reference for Developers

Pivot Open API is built from various financial use cases, from payments to payouts, covering domestic to global money movement. It is tailored to fit on your business, regardless of its size.

You can focus on your core business activity, while we tackle the financial things. Make sure to have Active Pivot merchant Account to start the API integration.

# Environment

Pivot provides two environments for API Access. You can use our staging environments for development purposes. The production environment can be used after the application is ready to go live.

These are the available environments, which you can use in the integration process

<table><thead><tr><th width="154">Environment</th><th width="261">URL</th><th>Description</th></tr></thead><tbody><tr><td><strong>Production</strong></td><td>https://api.pivot-payment.com</td><td>Used for Production / Live</td></tr><tr><td><strong>Sandbox</strong></td><td>https://api-stg.pivot-payment.com</td><td>Used for Development and Testing</td></tr></tbody></table>

# Authentication

Pivot uses OAuth to allow your application to gain programmatic access, request, and obtain permission from an account.&#x20;

You need to send a request to get an access token to Pivot Server, then you will receive the access token that will expire in 900 seconds (15 minutes). Whenever it expires, you should send another request to get a new access token.

{% hint style="info" %}
**Tips!**

You could create a cron job that generates an access token request that runs every 14 minutes, stores the access token in your system, and uses the access token for every next request.
{% endhint %}

## Access Token

**Method and URL**

<mark style="color:green;">`POST`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v1/access-token

**Request Header**

| Key               | Value                 |
| ----------------- | --------------------- |
| X-MERCHANT-ID     | \[Your Client ID]     |
| X-MERCHANT-SECRET | \[Your Client Secret] |

**Request Body**

```json
{
    "grantType": "client_credentials"
}
```

**Response Body**

```json
{
    "code": "00",
    "message": "Success",
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJiYWNrZW5kLXBvcnRhbCIsInN1YiI6IjkyMmUzOWFiLTc1NjUtNDlmNi1iODRmLWZiNTYxMjI4MjFhZSIsImV4cCI6MTcxNDAyODE0MywiY2xpZW50SWQiOiI5MjJlMzlhYi03NTY1LTQ5ZjYtYjg0Zi1mYjU2MTIyODIxYWUiLCJtZXJjaGFudElkIjoiOTIyZTM5YWItNzU2NS00OWY2LWI4NGYtZmI1NjEyMjgyMWFlIn0.EkxckAJEcB4fgVU97mQC5eooBwQ7vhexzksafyUgOPU",
        "expiresIn": "900",
        "tokenType": "Bearer"
    }
}
```


# Idempotency

Attach this Parameter to the Header Request whenever you create a Payment or Payout

<table><thead><tr><th>Parameter</th><th width="115">Data Type</th><th width="135">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>X-REQUEST-ID</td><td>String</td><td>M</td><td>Unique Idempotency Key to make sure no double transaction created from Merchant</td></tr></tbody></table>

#### Scenario

1. First-time request to create Payment / Payout using the <mark style="color:orange;">`X-REQUEST-ID`</mark>  : **`123`**, a successful process will return a Response HTTP Status 200
2. Second-time request to create Payment / Payout using the same <mark style="color:orange;">`X-REQUEST-ID`</mark> : **`123`** With a different Payload, then Pivot will return HTTP Response 409&#x20;
3. Second-time request to create Payment / Payout using the same <mark style="color:orange;">`X-REQUEST-ID`</mark> : **`123`** With the same request Payload, then Pivot will return a HTTP Response Status 200, with the same initial response&#x20;

#### Requirements

The requirement for <mark style="color:orange;">`X-REQUEST-ID`</mark> are:

1. Allow only alphanumeric characters
2. Minimum length is 16 digits
3. Maximum length is 36 digits
4. Expired in 24 hours, which means after 24 hours, you can reuse the same <mark style="color:orange;">`X-REQUEST-ID`</mark> for another transaction request

# Pagination

Some API methods (e.g.,[retrieve-payment-session-details](https://pivot-payment.gitbook.io/pivot-docs/api-references/api-lists/payments/payment-session/retrieve-payment-session-details "mention") & [retrieve-a-payout](https://pivot-payment.gitbook.io/pivot-docs/api-references/api-lists/payout-local/retrieve-a-payout "mention")) use page-based pagination through <mark style="color:orange;">`page`</mark> and <mark style="color:orange;">`perPage`</mark> parameters. Both parameters can be set when hitting the endpoint. Below is the example:

* <mark style="color:green;">`GET`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v2/payments/{id}?page=:page
* <mark style="color:green;">`GET`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v1/payouts/:id?page=:page\&perPage=:perPage

| Key     | Value                                | Description                                         |
| ------- | ------------------------------------ | --------------------------------------------------- |
| page    | \[Page to be shown]                  |                                                     |
| perPage | \[Total record to be shown per page] | Maximum 100 records per page, default is 20 records |


# Response

## HTTP Status

Pivot uses standard and conventional HTTP Status Codes for each API Response given in a single API Request. In brief, the HTTP Status code <mark style="color:green;">`2xx`</mark> indicates that the request is accepted and successfully processed by Pivot, <mark style="color:orange;">`4xx`</mark> indicating that the failure is caused by the information provided. (E.g., missing some required parameters, credentials are not valid). <mark style="color:orange;">`5xx`</mark> indicates that the error is on the Pivot side.

### **HTTP Status List used in Pivot API**

| HTTP Status               | Description                                                                                   |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| 200 OK                    | The request was successful                                                                    |
| 400 Bad Request           | The request could not be understood or was missing required parameters                        |
| 401 Unauthorized          | Authentication failed or user doesn't have permissions for requested operation                |
| 404 Not Found             | Resource was not found                                                                        |
| 405 Method Not Allowed    | Requested method is not supported for the resource                                            |
| 500 Internal Server Error | The server encountered and unexpected condition that prevented it from fulfilling the request |

### Timeout

Pivot sets a default API timeout of 60 seconds., If the request takes longer than 60 seconds, then Pivot will return an HTTP code 408 for a timeout response.

### Response Format

#### **Response Format Example**

```json
{
    "code": "00",
    "message": "OK",
    "error": {      
        // error object
    },
    "data": { 
        // resource object
    },
    "pagination": { 
        "page": 2,
        "perPage": 20,
        "totalItems": 400,
        "totalPages": 20
    }
}
```

Pivot API returns a uniform response format, which helps you traverse the response easily. The payload contains the following information:

<table><thead><tr><th>Parameter</th><th width="114.1171875">Data Type</th><th width="130.4453125">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>code</td><td>String</td><td>M</td><td>A code that represents the success or failure of your request. The List of response codes can be found in each section of API Services</td></tr><tr><td>message</td><td>String</td><td>M</td><td>A human-readable format that explains the response</td></tr><tr><td>error</td><td>Object</td><td>Conditional</td><td>An extended payload that explains the error in detail. See <a data-mention href="errors">errors</a></td></tr><tr><td>data</td><td>Object</td><td>Conditional</td><td>Contains the response data related with the accessed resources</td></tr><tr><td>pagination</td><td>Object</td><td>Conditional</td><td>Contains pagination information such as page number, how many records shows in page, total records, and total pages available</td></tr></tbody></table>


# Errors

The error object explains the error details of your request. It is encapsulated as an error object in the response; if no error is found, then you should expect the error object to be omitted from the response.

### Error Object

```json
{
    "code": "400100xxx",
    "message": "human-readable message response",
    "error": {      
        "type": "API_ERROR",      
        "details": [
            {
                "field": "Email",
                "message": "Email is required"
            }
        ],      
        "trace_id": "ed9ef145530fc386190ddd7612ed61c7"
    },
    "data": { 
        // resource object
    }
```

The error object contains the following information:

#### Type

Error Type values will be one of <mark style="color:orange;">API\_ERROR</mark>, <mark style="color:orange;">GATEWAY\_ERROR</mark>, <mark style="color:orange;">PARTNER\_ERROR</mark>

* <mark style="color:orange;">API\_ERROR</mark>: Either error is caused by a validation error or an invalid request. Usually will have an HTTP status <mark style="color:orange;">`4xx`</mark>
* <mark style="color:orange;">GATEWAY\_ERROR</mark>: Error is on Pivot Gateway side. You should expect this to rarely happen. Usually will have an HTTP status <mark style="color:orange;">`5xx`</mark>
* <mark style="color:orange;">PARTNER\_ERROR</mark>: Interaction with one of our Payment channels is causing an error, the error reasons are various. Usually will be accompanied by an HTTP status <mark style="color:orange;">`5xx`</mark>

#### Detail

Error details are exclusive to validation errors. You may expect it will contain an array of invalid fields.

#### Trace ID

ID to trace your request, if a request is not accompanied by <mark style="color:orange;">`traceId`</mark>, then Pivot's system will generate the trace ID for you. You can use the <mark style="color:orange;">`traceId`</mark> when raising a helpdesk ticket to Pivot

# Callback

Pivot will send real-time notifications to your system for every key event that occurs on each of your products. This ensures you always receive the latest status updates without needing to hit our API constantly.&#x20;

You can register a dedicated **Callback URL for each product** directly from your dashboard:

**Dashboard → Setting → Developer Settings →** [**Callbacks**](https://dashboard.pivot-payment.com/setting/developer-setting/callbacks)

For security, make sure to **validate the Callback source** using your **Callback API Key**, which is also available on the same [Callbacks](https://dashboard.pivot-payment.com/setting/developer-setting/callbacks) page.

## Delivery Retries

Pivot will automatically retry callback deliveries when your endpoint returns <mark style="color:orange;">5xx</mark>, <mark style="color:orange;">`408`</mark>, <mark style="color:orange;">`429`</mark>, or when internal service errors occur. These retry attempts help ensure important event notifications are not lost due to temporary issues on the merchant side.

Our retry schedule is as follows:

* **1st retry:** after **5 minutes**
* **2nd retry:** after **15 minutes**
* **3rd retry:** after **1 hour**
* **4th retry:** after **3 hours**
* **5th retry:** after **6 hours**
* **Final retry:** after **12 hours**

If all attempts fail, the callback will be **flagged for manual retry**.<br>

You can manually trigger a retry anytime from the dashboard:

**Dashboard → Setting → Developer Settings →** [**Callback History**](https://dashboard.pivot-payment.com/setting/developer-setting/callback-history)



# Core Resources

<table data-view="cards"><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><a data-mention href="core-resources/balance">balance</a></td><td>Retrieve your current available balance in real-time and access your balance history</td></tr></tbody></table>


# Balance

## API Collections

<table data-view="cards"><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><a data-mention href="balance/retrieve-balance">retrieve-balance</a></td><td>Get the latest available balance amounts for your account, allowing you to monitor funds in real-time</td></tr><tr><td><a data-mention href="balance/retrieve-balance-history">retrieve-balance-history</a></td><td>Access a record of past balance changes over time</td></tr></tbody></table>

# Retrieve Balance

## Method and URL

<mark style="color:green;">`GET`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v1/balances

## Request Params

| Key     | Value                                                                                            |
| ------- | ------------------------------------------------------------------------------------------------ |
| usecase | <p>Balance types are:</p><ul><li>DISBURSEMENT (default)</li><li>PAYMENT</li><li>WALLET</li></ul> |

## Response

**Response Body**

{% code fullWidth="false" %}

```json
{
    "code": "00",
    "message": "Success",
    "data": {
        "availableBalance": {
            "currency": "IDR",
            "value": "135775256.00"
        }
    }
}
```

{% endcode %}

**Detail Parameter Response**&#x20;

<table><thead><tr><th>Parameter</th><th width="127.20404052734375">Data Type</th><th width="133.248291015625">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>availableBalance</td><td>Object</td><td>M</td><td>Available balance for the merchant</td></tr><tr><td><ul><li>currency</li></ul></td><td>String</td><td>M</td><td>Balance currency</td></tr><tr><td><ul><li>value</li></ul></td><td>String</td><td>M</td><td>Available Balance. Your available funds which is ready to be used</td></tr></tbody></table>


# Retrieve Balance History

## Method and URL

<mark style="color:green;">`GET`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v1/balance-histories?startDate={startDate}\&endDate={endDate}

## Query Parameter

**Detail Query Parameter**

<table><thead><tr><th>Parameter</th><th width="114.62109375">Data Type</th><th width="122.45703125">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>startDate</td><td>String</td><td>M</td><td><p></p><p>Filter start date (ISO 8601 format) :</p><ul><li>Max Back Date = 6 Months</li><li>Max Range = 31 Days</li></ul></td></tr><tr><td>endDate</td><td>String </td><td>M</td><td><p></p><p>Filter end date (ISO 8601 format)</p><ul><li>Max Back Date = 6 Months</li><li>Max Range = 31 Days</li></ul></td></tr><tr><td>accountType</td><td>String</td><td>O</td><td><a data-mention href="#list-of-account-types">#list-of-account-types</a></td></tr><tr><td>transactionId</td><td>String</td><td>O</td><td>Reference ID of your transaction</td></tr></tbody></table>

## Response

**Response Body**

{% code fullWidth="false" %}

```json
{
  "code": "00",
  "message": "Success",
  "data": [
    {
      "referenceId": "1748603636",
      "date": "2025-05-30T11:14:24.352687Z",
      "settlementDate": "2025-05-30T11:14:24Z",
      "settlementStatus": "SUCCESS",
      "balanceType": "Payment Balance",
      "channel": "Virtual Account",
      "transactionType": "VA Payment",
      "amount": {
        "value": 10000,
        "currency": "IDR"
      },
      "fee": {
        "value": 4000,
        "currency": "IDR"
      },
      "createdBy": "Reforza Pivot",
      "transactionId": "e89e6584-d25d-4ccf-ac50-a95369fe2ae0"
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 1,
    "totalItems": 89,
    "totalPages": 89
  }
}
```

{% endcode %}

**Detail Parameter Response**&#x20;

<table><thead><tr><th>Parameter</th><th width="123.53125">Data Type</th><th width="131.44921875">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>data</td><td>Array of Objects</td><td>O</td><td>Object consisting of Merchant’s balance history</td></tr><tr><td><ul><li>referenceId</li></ul></td><td>String</td><td>M</td><td>Same data as in Merchant Dashboard - Balance History</td></tr><tr><td><ul><li>date</li></ul></td><td>String</td><td>M</td><td>Transaction date</td></tr><tr><td><ul><li>settlementDate</li></ul></td><td>String</td><td>O</td><td>Same data as in Merchant Dashboard - Balance History</td></tr><tr><td><ul><li>settlementStatus</li></ul></td><td>String</td><td>M</td><td>Same data as in Merchant Dashboard - Balance History</td></tr><tr><td><ul><li>balanceType</li></ul></td><td>String</td><td>M</td><td>Same data as in Merchant Dashboard - Balance History</td></tr><tr><td><ul><li>channel</li></ul></td><td>String</td><td>O</td><td>Same data as in Merchant Dashboard - Balance History</td></tr><tr><td><ul><li>transactionType</li></ul></td><td>String</td><td>M</td><td>Same data as in Merchant Dashboard - Balance History</td></tr><tr><td><ul><li>amount</li></ul></td><td> Object</td><td>O</td><td>Same data as in Merchant Dashboard - Balance History</td></tr><tr><td><blockquote><ul><li>value</li></ul></blockquote></td><td>Float</td><td>M</td><td>The amount value</td></tr><tr><td><blockquote><ul><li>currency</li></ul></blockquote></td><td>String</td><td>M</td><td>The amount currency</td></tr><tr><td><ul><li>fee</li></ul></td><td>Object</td><td>O</td><td>Same data as in Merchant Dashboard - Balance History</td></tr><tr><td><blockquote><ul><li> value</li></ul></blockquote></td><td>Float</td><td>M</td><td>The amount value</td></tr><tr><td><blockquote><ul><li>currency</li></ul></blockquote></td><td>String</td><td>M</td><td>The amount currency</td></tr><tr><td><ul><li>createdBy</li></ul></td><td>String</td><td>M</td><td>Same data as in Merchant Dashboard - Balance History</td></tr><tr><td><ul><li>transactionId</li></ul></td><td>String</td><td>M</td><td>Same data as in Merchant Dashboard - Balance History</td></tr><tr><td>pagination</td><td>Object</td><td>M</td><td><a data-mention href="../../../api-information/pagination">pagination</a></td></tr></tbody></table>

## List of Account Types

| Balance Type | Transaction Type           |
| ------------ | -------------------------- |
| PAYMENT      | BALANCE\_ADJUSTMENT        |
| PAYMENT      | TRANSFER                   |
| PAYMENT      | PAYMENT\_WITHDRAWAL        |
| PAYMENT      | CARD\_PAYMENT              |
| PAYMENT      | VA\_PAYMENT                |
| PAYMENT      | QRIS\_PAYMENT              |
| PAYMENT      | PLATFORM\_TRANSACTION\_FEE |
| PAYMENT      | REFUND                     |
| PAYMENT      | REFUND\_FEE                |
| PAYMENT      | PAYMENT\_FEE               |
| DISBURSEMENT | VA\_TOP\_UP                |
| DISBURSEMENT | MANUAL\_TOP\_UP            |
| DISBURSEMENT | BALANCE\_ADJUSTMENT        |
| DISBURSEMENT | TRANSFER                   |
| DISBURSEMENT | DISBURSEMENT\_WITHDRAWAL   |
| DISBURSEMENT | DISBURSEMENT               |
| DISBURSEMENT | BULK\_DISBURSEMENT         |
| DISBURSEMENT | ACCOUNT\_INQUIRY\_FEE      |
| DISBURSEMENT | INTERNATIONAL\_PAYOUT      |
| DISBURSEMENT | PLATFORM\_ACTIVITY\_FEE    |
| DISBURSEMENT | PLATFORM\_TRANSACTION\_FEE |
| DISBURSEMENT | DISBURSEMENT\_FEE          |
| WALLET       | VA\_TOP\_UP                |
| WALLET       | MANUAL\_TOP\_UP            |
| WALLET       | BALANCE\_ADJUSTMENT        |
| WALLET       | WALLET\_WITHDRAWAL         |
| WALLET       | MERCHANT\_PAYMENT          |
| WALLET       | FEE\_TOP\_UP               |
| WALLET       | FEE\_BANK\_TRANSFER        |
| WALLET       | FEE\_WALLET\_TRANSACTION   |
| WALLET       | FEE\_TRANSFER              |


# Retrieve List of Sub-Merchants Balance

## Method and URL

<mark style="color:green;">`POST`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v1/balances/sub-merchants

## Request

**Request Body**

```json
{
    "usecase": "DISBURSEMENT",
    "page": 1,
    "perPage": 5
}
```

**Detail Parameter Request**&#x20;

<table><thead><tr><th>Parameter</th><th width="115.6083984375">Data Type</th><th width="129.8974609375">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>usecase</td><td>String</td><td>M</td><td><p>Sub-merchant balance types are:</p><ul><li>DISBURSEMENT </li><li>PAYMENT</li></ul></td></tr><tr><td>page</td><td>Number</td><td>O</td><td></td></tr><tr><td>perPage</td><td>Number</td><td>O</td><td>Maximum 30 records per page, default is 30 records</td></tr></tbody></table>

## Response

**Response Body**

{% code fullWidth="false" %}

```json
{
    "code": "00",
    "message": "Success",
    "data": [
        {
            "merchantId": "535f73fc-cb40-4127-9fb4-4d32057451f8",
            "availableBalance": {
                "value": 0,
                "currency": "IDR"
            }
        },
        {
            "merchantId": "6f37946a-9ce5-42c7-a516-0dec7419dbcc",
            "availableBalance": {
                "value": 0,
                "currency": "IDR"
            }
        }
    ],
    "pagination": {
        "page": 1,
        "perPage": 2,
        "totalItems": 65,
        "totalPages": 33
    }
}
```

{% endcode %}

**Detail Parameter Response**&#x20;

<table><thead><tr><th>Parameter</th><th width="127.20404052734375">Data Type</th><th width="133.248291015625">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>merchantId</td><td>String</td><td>M</td><td>Your Sub-merchant ID</td></tr><tr><td>availableBalance</td><td>Object</td><td>M</td><td>Available balance for the Sub-merchant</td></tr><tr><td><ul><li>value</li></ul></td><td>Number</td><td>M</td><td>Amount Value</td></tr><tr><td><ul><li>currency</li></ul></td><td>String</td><td>M</td><td>Currency code in ISO 4217 Format, e.g. USD, IDR</td></tr></tbody></table>



# Customers

## API Collections

<table data-view="cards"><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><a data-mention href="customers/retrieve-customer">retrieve-customer</a></td><td>Fetch stored customer details, including profile information and linked payment methods</td></tr><tr><td><a data-mention href="customers/customer-object">customer-object</a></td><td></td></tr></tbody></table>


# Retrieve Customer

## Method and URL

<mark style="color:green;">`GET`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v1/customers/{customerId}

<mark style="color:orange;">`customerId`</mark> from the response body whenever you create Payment Session

## Response

**Response Body**

{% code fullWidth="false" %}

```json
{
  "code": "00",
  "message": "Success",
  "data": {
    "givenName": "Reforza Jordan",
    "surname": "Geotama",
    "email": "reforza@pivot-payment.com",
    "phoneNumber": {
      "countryCode": "+62",
      "number": "089699990003"
    },
    "refundPreference": {
      "method": "AUTO",
      "transferDestination": {
        "channelCode": "014",
        "channelInformation": {
          "accountNumber": "17677665415",
          "accountName": "Reforza Jordan Geotama"
        }
      }
    },
    "storedPaymentMethods": [
      {
        "token": "020027de-134e-45ed-8f0d-7ae0506a7133",
        "paymentMethod": "CARD",
        "paymentChannel": "VISA",
        "status": "ACTIVE",
        "createdAt": "2025-09-02T06:02:59.141590124Z",
        "card": {
          "fingerprint": "0198edcf-87a0-73fd-b937-7ec4b0ddb9c6",
          "network": "VISA",
          "first6": "444000",
          "first8": "44400001",
          "last4": "0002",
          "expMonth": "01",
          "expYear": "39",
          "cardHolderFirstName": "Reforza Jordan",
          "cardHolderLastName": "Geotama"
        }
      }
    ]
  }
}
```

{% endcode %}

**Detail Parameter Response**&#x20;

<table><thead><tr><th>Parameter</th><th width="127.20404052734375">Data Type</th><th width="133.248291015625">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>Customer</td><td>Object</td><td>M</td><td><a data-mention href="customer-object">customer-object</a></td></tr></tbody></table>


# Customer Object

```json
{
  "customer": {
    "givenName": "Reforza Jordan",
    "surname": "Geotama",
    "email": "reforza@pivot-payment.com",
    "phoneNumber": {
      "countryCode": "+62",
      "number": "89699990001"
    },
    "refundPreference": {
      "method": "AUTO",
      "transferDestination": {
        "channelCode": "014",
        "channelInformation": {
          "accountNumber": "17677665415",
          "accountName": "Reforza Jordan Geotama"
        }
      }
    },
    "storedPaymentMethods": [
      {
        "token": "020027de-134e-45ed-8f0d-7ae0506a7133",
        "paymentMethod": "CARD",
        "paymentChannel": "VISA",
        "createdAt": "2025-09-02T06:02:59.141590124Z",
        "status": "ACTIVE",
        "card": {
          "fingerprint": "0198edcf-87a0-73fd-b937-7ec4b0ddb9c6",
          "network": "VISA",
          "first6": "444000",
          "first8": "44400001",
          "last4": "0002",
          "expMonth": "01",
          "expYear": "39",
          "cardHolderFirstName": "Reforza Jordan",
          "cardHolderLastName": "Geotama"
        }
      },
      {
        "token": "bicbiweu63c",
        "paymentMethod": "ewallet",
        "paymentChannel": "dana",
        "createdAt": "2024-03-15T09:37:00Z",
        "status": "ACTIVE"
      }
    ]
  }
}
```

**Detail Customer Object**

<table><thead><tr><th width="284.2861328125">Parameter</th><th width="109.078125">Data Type</th><th width="134.529296875">Character Limit</th><th width="124.23828125">Requirement</th><th width="198.458984375">Description</th></tr></thead><tbody><tr><td>givenName</td><td>String</td><td>1-255</td><td>O</td><td>First name of the customer</td></tr><tr><td>surname</td><td>String</td><td>0-255</td><td>O</td><td>Last name of the customer</td></tr><tr><td>email</td><td>String</td><td>1-255</td><td>M</td><td>Unique identifier of the customer</td></tr><tr><td>phoneNumber</td><td>Object</td><td>-</td><td>O</td><td>Phone number information</td></tr><tr><td><ul><li>countryCode</li></ul></td><td>String</td><td>1-4</td><td>M</td><td>Country code prefix (e.g., +62)</td></tr><tr><td><ul><li>number</li></ul></td><td>String</td><td>1-15</td><td>M</td><td>Phone number start with “8”</td></tr><tr><td>refundPreference</td><td>Object</td><td>-</td><td>O</td><td>Preferred refund method settings</td></tr><tr><td><ul><li>method</li></ul></td><td>String</td><td>-</td><td>M</td><td><p>Refund method preferred by Merchant / Customer, possible values:</p><p></p><ul><li>AUTO (default) :  Pivot will perform refund through Channel, if failed then fallback to Bank Transfer if available</li><li>TRANSFER_ONLY : Refund will be performed through Bank Transfer only, Merchant is required to send the destination account</li></ul></td></tr><tr><td><ul><li>transferDestination</li></ul></td><td>Object</td><td>-</td><td>C</td><td>Required if method = TRANSFER_ONLY</td></tr><tr><td><blockquote><ul><li> channelCode</li></ul></blockquote></td><td>String</td><td>1-20</td><td>M</td><td><p>Channel code for payout destination such as Bank, E wallet or other channels</p><p><br>List of Channel code can be accessed <a href="../../payout-local/channel-codes">here</a></p></td></tr><tr><td><blockquote><ul><li>channelInformation</li></ul></blockquote></td><td>Object</td><td>-</td><td>M</td><td></td></tr><tr><td><blockquote><blockquote><ul><li>accountNumber</li></ul></blockquote></blockquote></td><td>String</td><td>1-30</td><td>M</td><td>Account Number of payout destination</td></tr><tr><td><blockquote><blockquote><ul><li>accountName</li></ul></blockquote></blockquote></td><td>String</td><td>1-50</td><td>M</td><td>Account Name of payout destination from the Merchant</td></tr><tr><td>storedPaymentMethods</td><td>Array of Objects</td><td>-</td><td>O</td><td>List of tokenized payment methods stored under this customer profile<br><br>*Shown on response only</td></tr><tr><td><ul><li>token</li></ul></td><td>String</td><td>20-100</td><td>M</td><td>Token ID representing the saved payment method<br><br>*Shown on response only</td></tr><tr><td><ul><li>paymentMethod</li></ul></td><td>String</td><td>-</td><td>M</td><td>Type of payment method (e.g., ewallet, cards)<br><br>*Shown on response only</td></tr><tr><td><ul><li>paymentChannel</li></ul></td><td>String</td><td>-</td><td>M</td><td>Payment provider (e.g., dana, visa)<br><br>*Shown on response only</td></tr><tr><td><ul><li>createdAt</li></ul></td><td>String</td><td>-</td><td>M</td><td>Timestamp of when the token was created (ISO 8601 format)<br><br>*Shown on response only</td></tr><tr><td><ul><li>status</li></ul></td><td>String</td><td>-</td><td>M</td><td><p>Token status, possible values:</p><ul><li>ACTIVE</li><li>INACTIVE</li></ul><p><br>*Shown on response only</p></td></tr><tr><td><ul><li>card</li></ul></td><td>Object</td><td>-</td><td>M</td><td><a data-mention href="../../payments/object/charge-object/card-charge-object">card-charge-object</a></td></tr></tbody></table>


# Account and Balance

<table data-view="cards"><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><a data-mention href="account-and-balance/sub-account-management">sub-account-management</a></td><td>Manage multiple entities in Pivot and helps you maintain accountability for all transactions occurred in those sub-accounts</td></tr><tr><td><a data-mention href="account-and-balance/top-ups">top-ups</a></td><td>View available Virtual Account payment channels and your assigned VA numbers for adding funds</td></tr><tr><td><a data-mention href="account-and-balance/transfer">transfer</a></td><td>Move funds internally within your platform, such as between sub-accounts, enabling flexible fund management and allocation</td></tr><tr><td><a data-mention href="account-and-balance/split-payment-and-routing">split-payment-and-routing</a></td><td>Automatically divide a single payment and route funds to multiple accounts based on custom rules</td></tr></tbody></table>


# Sub-account Management

## API Collections

<table data-view="cards"><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><a data-mention href="sub-account-management/create-a-sub-account">create-a-sub-account</a></td><td>Create a new sub-account</td></tr><tr><td><a data-mention href="sub-account-management/assign-user-to-a-sub-account">assign-user-to-a-sub-account</a></td><td>Add admin user to your sub-account</td></tr><tr><td><a data-mention href="sub-account-management/resend-invitation">resend-invitation</a></td><td>Resend email invitation to users of sub-account</td></tr><tr><td><a data-mention href="sub-account-management/update-a-sub-account">update-a-sub-account</a></td><td>Update a sub-account Information</td></tr><tr><td><a data-mention href="sub-account-management/retrieve-a-sub-account">retrieve-a-sub-account</a></td><td>Get a sub-account detail information</td></tr><tr><td><a data-mention href="sub-account-management/list-of-sub-accounts">list-of-sub-accounts</a></td><td>Get a Collection of Sub-accounts</td></tr><tr><td><a data-mention href="sub-account-management/sub-account-activation-callback">sub-account-activation-callback</a></td><td>Register your Sub-account Activation Callback URL and get Activation status</td></tr><tr><td><a data-mention href="sub-account-management/sub-accounts-object">sub-accounts-object</a></td><td></td></tr></tbody></table>

## Miscellaneous

<table data-view="cards"><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><a data-mention href="sub-account-management/activity-on-behalf-of-sub-account">activity-on-behalf-of-sub-account</a></td><td>Perform actions or transactions as a sub-account using the main account’s credentials</td></tr><tr><td><a data-mention href="sub-account-management/status">status</a></td><td></td></tr></tbody></table>


# Activity on behalf-of Sub-account

Managing a Sub-account means you are in charge of its lifecycle, from registering a new Sub-account to blocking Sub-account activity. You may also be doing transactions on behalf of their account.

### Additional Header Value for activity on behalf of Sub-accounts

Add extra information in your API Request Header to execute any Action on behalf of your Sub-account. The requester might be coming from your system, but the action will be done on the Sub-account account.

<table><thead><tr><th width="362.7083740234375">Key</th><th>Value</th></tr></thead><tbody><tr><td>x-submerchant-id</td><td>[Sub-account uuid]</td></tr></tbody></table>


# Create a Sub-account

## Method and URL

<mark style="color:green;">`POST`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v1/sub-merchants

## Request

**Request Body**

```json
{
  "name": "Reforza Corporation",
  "shortName": "RCI",
  "description": "Whale Technology Company",
  "website": "pivot-payment.com",
  "logo": "https://acme.inc/assets/logo.png",
  "merchantEmail": "admin@corp.inc",
  "merchantPhone": "081217003600",
  "businessCountry": "ID",
  "businessType": "COMPANY",
  "businessStructure": "PERSEROAN TERBATAS",
  "parentIndustry": "Airlines",
  "childIndustry": "Airlines, Air Carriers",
  "mcc": "4511",
  "countryOfEntity": "ID",
  "digitalStatus": "Digital",
  "picName": "Reforza",
  "picEmail": "admin@corp.inc",
  "picPhone": "081217003600",
  "picJobTitle": "owner",
  "picInvitation": false,
  "address": "H Rasuna Said, Jakarta",
  "districtId": 1970,
  "postCode": "10230",
  "autoWithdrawal": "ON",
  "bankAccount": {
    "accountNumber": "90016666001",
    "channelCode": "JENIUS"
  },
  "subAccountType": "KYC"
}
```

**Detail Parameter Request**

<table data-full-width="false"><thead><tr><th width="224">Parameter</th><th>Data Type</th><th>Character Limit</th><th width="129.78515625">Requirement</th><th width="304">Description</th></tr></thead><tbody><tr><td>name</td><td>String</td><td>1-255</td><td>M</td><td>Name of the Sub-account</td></tr><tr><td>shortName</td><td>String</td><td>1-25</td><td>M</td><td>Short Name of the Sub-account, used as the transaction descriptor</td></tr><tr><td>description</td><td>String</td><td>1-255</td><td>O</td><td>Description of the Sub-account</td></tr><tr><td>website</td><td>Strin</td><td>-</td><td>M</td><td>Website URL of the Sub-account</td></tr><tr><td>logo</td><td>String</td><td>1-255</td><td>M</td><td>URL of the Sub-account logo to be uploaded. Expecting a publicly accessible URL</td></tr><tr><td>merchantEmail</td><td>String</td><td>0-255</td><td>M</td><td>Email Address of the Sub-account</td></tr><tr><td>merchantPhone</td><td>String</td><td>1-255</td><td>M</td><td>Phone Number of the Sub-account</td></tr><tr><td>businessCountry</td><td>String</td><td>0-255</td><td>M</td><td>Two letter digits country code based on <a href="https://en.wikipedia.org/wiki/ISO_3166-1">ISO 3166-1 alpha-2</a> where the business resides</td></tr><tr><td>businessType</td><td>String</td><td>1-20</td><td>M</td><td>Type of the business of sub-account, one of <mark style="color:orange;"><code>INDVIDUAL</code></mark> or <mark style="color:orange;"><code>COMPANY</code></mark>. </td></tr><tr><td>businessStructure</td><td>String</td><td>1-20</td><td>M</td><td><p>Business structure of the sub-merchants. e.g. CV, PT, etc. </p><p></p><p>Business structure is regulated differently in each Country.</p></td></tr><tr><td>parentIndustry</td><td>String</td><td>0-255</td><td>M</td><td>Industry in general<br><a data-mention href="industry-and-code-list">industry-and-code-list</a></td></tr><tr><td>childIndustry</td><td>String</td><td>0-255</td><td>M</td><td>Industry in specific<br><a data-mention href="industry-and-code-list">industry-and-code-list</a></td></tr><tr><td>mcc</td><td>String</td><td>0-255</td><td>M</td><td>Merchant Category Code<br><a data-mention href="industry-and-code-list">industry-and-code-list</a></td></tr><tr><td>countryOfEntity</td><td>String</td><td>0-255</td><td>M</td><td>Merchant's operational Country<br><a href="https://en.wikipedia.org/wiki/ISO_3166-1">ISO 3166-1 alpha-2</a></td></tr><tr><td>digitalStatus</td><td>String</td><td>0-255</td><td>M</td><td>Selling Digital Product / Non-Digital Product, possible values are <mark style="color:orange;"><code>Digital</code></mark> or <mark style="color:orange;"><code>Non-digital</code></mark></td></tr><tr><td>picName</td><td>String</td><td>1-32</td><td>M</td><td>PIC Full Name</td></tr><tr><td>picPhone</td><td>String</td><td>1-255</td><td>M</td><td>PIC phone number</td></tr><tr><td>picEmail</td><td>String</td><td>0-255</td><td>M</td><td>PIC email address</td></tr><tr><td>picJobTitle</td><td>String</td><td>1-20</td><td>O</td><td>PIC Job Title</td></tr><tr><td>picInvitation</td><td>Boolean</td><td>-</td><td>O</td><td>Invite PIC to Dashboard, default value is <mark style="color:orange;"><code>false</code></mark></td></tr><tr><td>address</td><td>String</td><td>1-254</td><td>M</td><td>Full Address of Sub-account's Company</td></tr><tr><td>districtId</td><td>Number</td><td>-</td><td>M</td><td><a data-mention href="industry-and-code-list">industry-and-code-list</a></td></tr><tr><td>postCode</td><td>String</td><td>1-20</td><td>M</td><td>Postal code of the Sub-account company address</td></tr><tr><td>autoWithdrawal</td><td>String</td><td>0-5</td><td>O</td><td>Options to enable/disable auto-withdrawal capability, default will be "ON"</td></tr><tr><td>bankAccount</td><td>Object</td><td>-</td><td>O</td><td></td></tr><tr><td><ul><li>accountNumber</li></ul></td><td>String</td><td>1-60</td><td>M</td><td>Account Number of Withdrawal destination</td></tr><tr><td><ul><li>channelCode</li></ul></td><td>String</td><td>1-60</td><td>M</td><td><p>Channel code for Withdrawal destination, such as Bank, E walle,t or other channels</p><p></p><p>The list of Channel codes can be accessed <a data-mention href="../../payout-local/channel-codes">channel-codes</a></p></td></tr><tr><td>subAccountType</td><td>String</td><td>0-10</td><td>O</td><td><p>Possible values are:</p><ol><li>KYC</li><li>NON_KYC</li></ol><p></p><p>The default value is <mark style="color:orange;"><code>NON_KYC</code></mark></p></td></tr></tbody></table>

## Response

**Response Body**

{% code fullWidth="false" %}

```json
{
  "code": "00",
  "message": "Success",
  "data": {
    "uuid": "d8361719-290b-4b80-8e75-8329321a4000",
    "name": "Reforza Corporation",
    "shortName": "RCI",
    "description": "Whale Technology Company",
    "website": "pivot-payment.com",
    "address": "H Rasuna Said, Jakarta",
    "postCode": "60541",
    "logo": "https://acme.inc/assets/logo.png",
    "merchantEmail": "admin@corp.inc",
    "merchantPhone": "081217003600",
    "picEmail": "admin@corp.inc",
    "picPhone": "081217003600",
    "picName": "Reforza",
    "picJobTitle": "owner",
    "businessType": "COMPANY",
    "businessStructure": "PERSEROAN TERBATAS",
    "businessCountry": "ID",
    "parentIndustry": "Airlines",
    "childIndustry": "Airlines, Air Carriers",
    "mcc": "4511",
    "countryOfEntity": "ID",
    "digitalStatus": "Digital",
    "parentId": "e485e01b-ff59-4a47-bb7d-9b39064f3388",
    "autoWithdrawal": "ON",
    "bankAccount": {
      "channelCode": "JENIUS",
      "bankName": "PT BANK BTPN TBK",
      "accountNumber": "90016666001",
      "accountName": "Sdr. Dummy Account Success"
    },
    "subAccountStatus": "CREATED",
    "subAccountType": "KYC",
    "subAccountKycStatus": "WAITING_FOR_DOCUMENT"
  }
}
```

{% endcode %}

**Detail Parameter Response**

<table><thead><tr><th>Parameter</th><th width="136.9600830078125">Data Type </th><th width="135.126708984375">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>code</td><td>String</td><td>M</td><td>Response Code from Pivot</td></tr><tr><td>message</td><td>String</td><td>M</td><td>Human readable message that represent response from Pivot</td></tr><tr><td>data</td><td>Object</td><td>M</td><td>Response Data from Pivot contains <a data-mention href="sub-accounts-object">sub-accounts-object</a></td></tr></tbody></table>


# Assign User to a Sub-account

## Method and URL

<mark style="color:green;">`POST`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v1/sub-merchants/admin

{% hint style="info" %}
Don't forget to use <mark style="color:orange;">`x-submerchant-id`</mark> of the intended Sub-account in the Request's Header Data&#x20;
{% endhint %}

## Request

**Request Body**

```json
{
    "email": "admin@acme.inc",
    "name": "John Mayer"
}
```

**Detail Parameter Request**

<table data-full-width="false"><thead><tr><th width="224">Parameter</th><th>Data Type</th><th>Character limit</th><th width="140.671875">Requirement</th><th width="357">Description</th></tr></thead><tbody><tr><td>email</td><td>String</td><td>0-255</td><td>M</td><td>Email address of the admin user</td></tr><tr><td>name</td><td>String</td><td>1-255</td><td>M</td><td>Full name of the admin user</td></tr></tbody></table>

## Response

**Response Body**

{% code fullWidth="false" %}

```json
{
    "code": "00",
    "message": "success"
}
```

{% endcode %}

**Detail Parameter Response**

<table><thead><tr><th>Parameter</th><th width="119.73443603515625">Data Type</th><th width="137.9366455078125">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>code</td><td>String</td><td>M</td><td>Response Code from Pivot</td></tr><tr><td>message</td><td>String</td><td>M</td><td>Human readable message that represent response from Pivot</td></tr></tbody></table>


# Resend Invitation

## Method and URL

<mark style="color:green;">`POST`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v1/sub-merchants/users/resend-invitation

{% hint style="info" %}
Don't forget to use <mark style="color:orange;">`x-submerchant-id`</mark> of the intended Sub-account in the Request's Header Data&#x20;
{% endhint %}

## Request

**Request Body**

```json
{
    "email": "admin@acme.inc"
}
```

**Detail Parameter Request**

<table data-full-width="false"><thead><tr><th width="224">Parameter</th><th>Data Type</th><th>Character limit</th><th width="129.8671875">Requirement</th><th width="357">Description</th></tr></thead><tbody><tr><td>email</td><td>String</td><td>0-255</td><td>M</td><td>Email address of the invited user</td></tr></tbody></table>

## Response

**Response Body**

{% code fullWidth="false" %}

```json
{
    "code": "00",
    "message": "success"
}
```

{% endcode %}

**Detail Parameter Response**

<table><thead><tr><th>Parameter</th><th width="117.92449951171875">Data Type</th><th width="139.05810546875">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>code</td><td>String</td><td>M</td><td>Response Code from Pivot</td></tr><tr><td>message</td><td>String</td><td>M</td><td>Human readable message that represent response from Pivot</td></tr></tbody></table>


# Update a Sub-account

## Method and URL

<mark style="color:green;">`PUT`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v1/sub-merchants/{uuid}

<mark style="color:orange;">`uuid`</mark> from the response body whenever you create a Sub-account

## Request

**Request Body**

```json
{
    "name": "Acme.inc",
    "description": "Updated Description",
    "logo": "some-url/company-logo.png",
    "merchantEmail": "admin@acme.inc",
    "merchantPhone": "08123456789",
    "address": "company address",
    "postCode": "123456"
}
```

**Detail Parameter Request**

<table data-full-width="false"><thead><tr><th width="224">Parameter</th><th>Data Type</th><th>Character limit</th><th width="138.90234375">Requirement</th><th width="357">Description</th></tr></thead><tbody><tr><td>name</td><td>String</td><td>1-255</td><td>O</td><td>Name of the Sub-account</td></tr><tr><td>description</td><td>String</td><td>1-255</td><td>O</td><td>Description of the Sub-account</td></tr><tr><td>logo</td><td>String</td><td>1-255</td><td>O</td><td>cloud storage URL of the Sub-account logo</td></tr><tr><td>merchantEmail</td><td>String</td><td>0-255</td><td>O</td><td>Email Address of the Sub-account</td></tr><tr><td>merchantPhone</td><td>String</td><td>1-255</td><td>O</td><td>Phone Number of the Sub-account</td></tr><tr><td>address</td><td>String</td><td>1-254</td><td>O</td><td>Full Address of Sub-account's Company</td></tr><tr><td>postCode</td><td>String</td><td>1-20</td><td>O</td><td>Postal code of the Sub-account company address</td></tr></tbody></table>

## Response

**Response Body**

{% code fullWidth="false" %}

```json
{
  "code": "00",
  "message": "Success",
  "data": {
    "uuid": "d8361719-290b-4b80-8e75-8329321a4000",
    "name": "Reforza Corporation LTD",
    "shortName": "RCI5",
    "description": "Technologia Company",
    "address": "Menteng, Jakarta Pusat",
    "postCode": "60271",
    "logo": "some-url/company-logo.png",
    "merchantEmail": "reforza@corp.id",
    "merchantPhone": "081299996666",
    "picEmail": "admin@corp.inc",
    "picPhone": "081299996666",
    "picName": "Reforza",
    "picJobTitle": "owner",
    "businessType": "COMPANY",
    "businessStructure": "PERSEROAN TERBATAS",
    "businessCountry": "ID",
    "parentIndustry": "Airlines",
    "childIndustry": "Airlines, Air Carriers",
    "mcc": "4511",
    "countryOfEntity": "ID",
    "digitalStatus": "Digital",
    "parentId": "e485e01b-ff59-4a47-bb7d-9b39064f3388",
    "subAccountStatus": "CREATED"
  }
}
```

{% endcode %}

**Detail Parameter Response**

<table><thead><tr><th>Parameter</th><th width="116.04949951171875">Data Type</th><th width="129.0928955078125">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>code</td><td>String</td><td>M</td><td>Response Code from Pivot</td></tr><tr><td>message</td><td>String</td><td>M</td><td>Human readable message that represent response from Pivot</td></tr><tr><td>data</td><td>Object</td><td>M</td><td>Response Data from Pivot contains <a data-mention href="sub-accounts-object">sub-accounts-object</a></td></tr></tbody></table>


# Retrieve a Sub-account

## Method and URL

<mark style="color:green;">`GET`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v1/sub-merchants/{uuid}

<mark style="color:orange;">`uuid`</mark> from the response body whenever you create a Sub-account

## Response

**Response Body**

{% code fullWidth="false" %}

```json
{
  "code": "00",
  "message": "Success",
  "data": {
    "uuid": "d8361719-290b-4b80-8e75-8329321a4000",
    "name": "Reforza Corporation",
    "shortName": "RCI",
    "description": "Whale Technology Company",
    "website": "pivot-payment.com",
    "address": "H Rasuna Said, Jakarta",
    "postCode": "60541",
    "logo": "https://acme.inc/assets/logo.png",
    "merchantEmail": "admin@corp.inc",
    "merchantPhone": "081217003600",
    "picEmail": "admin@corp.inc",
    "picPhone": "081217003600",
    "picName": "Reforza",
    "picJobTitle": "owner",
    "businessType": "COMPANY",
    "businessStructure": "PERSEROAN TERBATAS",
    "businessCountry": "ID",
    "parentIndustry": "Airlines",
    "childIndustry": "Airlines, Air Carriers",
    "mcc": "4511",
    "countryOfEntity": "ID",
    "digitalStatus": "Digital",
    "parentId": "e485e01b-ff59-4a47-bb7d-9b39064f3388",
    "subAccountStatus": "CREATED"
  }
}
```

{% endcode %}

**Detail Parameter Response**

<table><thead><tr><th>Paremeter</th><th width="117.9071044921875">Data Type</th><th width="138.6285400390625">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>code</td><td>String</td><td>M</td><td>Response Code from Pivot</td></tr><tr><td>message</td><td>String</td><td>M</td><td>Human readable message that represent response from Pivot</td></tr><tr><td>data</td><td>Object</td><td>M</td><td>Response Data from Pivot contains <a data-mention href="sub-accounts-object">sub-accounts-object</a></td></tr></tbody></table>


# List of Sub-accounts

## Method and URL

<mark style="color:green;">`GET`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v1/sub-merchants

## Query Options

<table data-full-width="false"><thead><tr><th width="168">Parameter</th><th width="288">Description</th><th>Example Value</th></tr></thead><tbody><tr><td>page</td><td>designated page</td><td>1</td></tr><tr><td>perPage</td><td>amount of record per page</td><td>10</td></tr></tbody></table>

## Response

**Response Body**

{% code fullWidth="false" %}

```json
{
  "code": "00",
  "message": "Success",
  "data": [
    {
      "uuid": "d8361719-290b-4b80-8e75-8329321a4000",
      "name": "Reforza Corporation",
      "shortName": "RCI",
      "description": "Whale Technology Company",
      "website": "pivot-payment.com",
      "address": "H Rasuna Said, Jakarta",
      "postCode": "60541",
      "logo": "https://acme.inc/assets/logo.png",
      "merchantEmail": "admin@corp.inc",
      "merchantPhone": "081217003600",
      "picEmail": "admin@corp.inc",
      "picPhone": "081217003600",
      "picName": "Reforza",
      "picJobTitle": "owner",
      "businessType": "COMPANY",
      "businessStructure": "PERSEROAN TERBATAS",
      "businessCountry": "ID",
      "parentIndustry": "Airlines",
      "childIndustry": "Airlines, Air Carriers",
      "mcc": "4511",
      "countryOfEntity": "ID",
      "digitalStatus": "Digital",
      "parentId": "e485e01b-ff59-4a47-bb7d-9b39064f3388",
      "subAccountStatus": "CREATED"
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 1,
    "totalItems": 11,
    "totalPages": 11
  }
}
```

{% endcode %}

**Detail Parameter Response**

<table data-full-width="false"><thead><tr><th>Parameter</th><th width="117.8636474609375">Data Type</th><th width="132.5">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>code</td><td>String</td><td>M</td><td>Response Code from Pivot</td></tr><tr><td>message</td><td>String</td><td>M</td><td>Human readable message that represent response from Pivot</td></tr><tr><td>data</td><td>Array of Objects</td><td>M</td><td>Collection of <a data-mention href="sub-accounts-object">sub-accounts-object</a></td></tr><tr><td>pagination</td><td>Object</td><td>M</td><td><a data-mention href="../../../api-information/pagination">pagination</a></td></tr></tbody></table>


# Sub-account Activation Callback

## Method and URL

<mark style="color:green;">`POST`</mark> [www.yourcompany.com/payment\\\_callback\\\_url](http://www.yourcompany.com/payment\\_callback\\_url)

## Request

**Header Request**

<table><thead><tr><th>Parameter </th><th width="117">Data Type</th><th width="131">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>X-API-Key</td><td>String</td><td>M</td><td>Callback API Key, an additional API Key used specifically for receiving callbacks</td></tr><tr><td>Content-Type</td><td>String</td><td>M</td><td>application/JSON</td></tr><tr><td>Accept</td><td>String</td><td>M</td><td>application/JSON</td></tr></tbody></table>

**Request Body**

```json
{
  "event": "SUB.ACTIVATION.APPROVED",
  "data": {
    "subAccountId": "d8361719-290b-4b80-8e75-8329321a4000",
    "subAccountStatus": "ACTIVE",
    "subAccountKycStatus": "APPROVED",
    "updatedAt": "2024-03-15T09:37:00Z"
  }
}
```

**Detail Parameter Request**

<table><thead><tr><th width="196.24609375">Parameter</th><th width="120">Data Type</th><th width="131.12060546875">Requirement</th><th width="279.8203125">Description</th></tr></thead><tbody><tr><td>event</td><td>String</td><td>M</td><td><p>List of Event Names:</p><ol><li>SUB.ACTIVATION.PENDING</li><li>SUB.ACTIVATION.REJECTED</li><li>SUB.ACTIVATION.APPROVED</li></ol></td></tr><tr><td>data</td><td>Object</td><td>M</td><td><a data-mention href="sub-accounts-object">sub-accounts-object</a></td></tr></tbody></table>


# Sub-accounts Object

Sub-accounts Object is a business entity that you can manage when you need additional account for transparency and accountability in your transactions

```json
{
  "uuid": "d8361719-290b-4b80-8e75-8329321a4000",
  "name": "Reforza Corporation",
  "shortName": "RCI",
  "description": "Whale Technology Company",
  "website": "pivot-payment.com",
  "address": "H Rasuna Said, Jakarta",
  "postCode": "60541",
  "logo": "https://acme.inc/assets/logo.png",
  "merchantEmail": "admin@corp.inc",
  "merchantPhone": "081217003600",
  "picEmail": "admin@corp.inc",
  "picPhone": "081217003600",
  "picName": "Reforza",
  "picJobTitle": "owner",
  "businessType": "COMPANY",
  "businessStructure": "PERSEROAN TERBATAS",
  "businessCountry": "ID",
  "parentIndustry": "Airlines",
  "childIndustry": "Airlines, Air Carriers",
  "mcc": "4511",
  "countryOfEntity": "ID",
  "digitalStatus": "Digital",
  "parentId": "e485e01b-ff59-4a47-bb7d-9b39064f3388",
  "autoWithdrawal": "ON",
  "bankAccount": {
    "channelCode": "JENIUS",
    "bankName": "PT BANK BTPN TBK",
    "accountNumber": "90016666001",
    "accountName": "Sdr. Dummy Account Success"
  },
  "subAccountStatus": "CREATED",
  "subAccountType": "KYC",
  "subAccountKycStatus": "WAITING_FOR_DOCUMENT"
}
```

**Detail Sub-accounts Object**

<table data-full-width="false"><thead><tr><th width="275">Parameter</th><th width="116.9149169921875">Data Type</th><th width="134.8228759765625">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>uuid</td><td>String</td><td>M</td><td>Object Unique Identifier</td></tr><tr><td>name</td><td>String</td><td>M</td><td>Name of the Sub-account</td></tr><tr><td>shortName</td><td>String</td><td>M</td><td>Short Name of the Sub-account, used as the transaction statement descriptor</td></tr><tr><td>description</td><td>String</td><td>O</td><td>Description of the Sub-account</td></tr><tr><td>website</td><td>String</td><td>M</td><td>Website URL of the Sub-account</td></tr><tr><td>address</td><td>String</td><td>O</td><td>Full address of the Sub-account company</td></tr><tr><td>postCode</td><td>String</td><td>O</td><td>Postal code of the Sub-account company address</td></tr><tr><td>logo</td><td>String</td><td>O</td><td>cloud storage URL of the Sub-account logo</td></tr><tr><td>merchantEmail</td><td>String</td><td>M</td><td>Email Address of the Sub-account</td></tr><tr><td>merchantPhone</td><td>String</td><td>M</td><td>Phone Number of the Sub-account</td></tr><tr><td>picEmail</td><td>String</td><td>M</td><td>PIC email address</td></tr><tr><td>picPhone</td><td>String</td><td>M</td><td>PIC phone number</td></tr><tr><td>picName</td><td>String</td><td>M</td><td>PIC Full Name</td></tr><tr><td>picJobTitle</td><td>String</td><td>O</td><td>PIC Job Title</td></tr><tr><td>businessType</td><td>String</td><td>M</td><td>Type of the business of Sub-account, one of <mark style="color:orange;"><code>INDVIDUAL</code></mark> or <mark style="color:orange;"><code>COMPANY</code></mark>. </td></tr><tr><td>businessStructure</td><td>String</td><td>M</td><td><p>Business structure of the Sub-account. e.g. CV, PT, etc. </p><p></p><p>Business structure is regulated differently in each Country.</p></td></tr><tr><td>businessCountry</td><td>String</td><td>M</td><td>Two letter digits country code based on <a href="https://en.wikipedia.org/wiki/ISO_3166-1">ISO 3166-1 alpha-2</a> where the business resides</td></tr><tr><td>parentIndustry</td><td>String</td><td>O</td><td>Industry in general<br><a href="https://docs.google.com/spreadsheets/d/1xl2f8e7CjxU-r4XHFcVP3Mnvqp8-vSV3x9St4s5044I/edit?usp=sharing">Merchant Industry List</a></td></tr><tr><td>childIndustry</td><td>String</td><td>O</td><td>Industry in specific<br><a href="https://docs.google.com/spreadsheets/d/1xl2f8e7CjxU-r4XHFcVP3Mnvqp8-vSV3x9St4s5044I/edit?usp=sharing">Merchant Industry List</a></td></tr><tr><td>mcc</td><td>String</td><td>O</td><td>Merchant Category Code<br><a href="https://docs.google.com/spreadsheets/d/1xl2f8e7CjxU-r4XHFcVP3Mnvqp8-vSV3x9St4s5044I/edit?usp=sharing">MCC Code List</a></td></tr><tr><td>countryOfEntity</td><td>String</td><td>O</td><td>Merchant's operational Country<br><a href="https://en.wikipedia.org/wiki/ISO_3166-1">ISO 3166-1 alpha-2</a></td></tr><tr><td>digitalStatus</td><td>String</td><td>O</td><td>Selling Digital Product / Non Digital Product, possible values are <mark style="color:orange;"><code>Digital</code></mark> or <mark style="color:orange;"><code>Non-digital</code></mark></td></tr><tr><td>parentId</td><td>String</td><td>M</td><td>Parent Merchant's UUID</td></tr><tr><td>autoWithdrawal</td><td>String</td><td>O</td><td>Auto-withdrawal options for Sub-account, default value is ON</td></tr><tr><td>bankAccount</td><td>Object</td><td>O</td><td></td></tr><tr><td><ul><li>channelCode</li></ul></td><td>String</td><td>M</td><td><p>Channel code for Withdrawal destination such as Bank, E wallet or other channels</p><p></p><p>List of Channel code can be accessed <a data-mention href="../../payout-local/channel-codes">channel-codes</a></p></td></tr><tr><td><ul><li>bankName</li></ul></td><td>String</td><td>M</td><td><p>Bank name for Withdrawal destination such as Bank, E wallet or other channels</p><p></p><p>List of Channel code can be accessed <a data-mention href="../../payout-local/channel-codes">channel-codes</a></p></td></tr><tr><td><ul><li>accountNumber</li></ul></td><td>String</td><td>M</td><td>Account Number of Withdrawal destination</td></tr><tr><td><ul><li>accountName</li></ul></td><td>String</td><td>M</td><td>Account Name of Withdrawal destination</td></tr><tr><td>subAccountStatus</td><td>String</td><td>M</td><td><a data-mention href="status">status</a></td></tr><tr><td>subAccountType</td><td>String</td><td>M</td><td><p>Possible values are:</p><ol><li>KYC</li><li>NON_KYC</li></ol><p></p><p>The default value is <mark style="color:orange;"><code>NON_KYC</code></mark></p></td></tr><tr><td>subAccountKycStatus</td><td>String</td><td>M</td><td><a data-mention href="status">status</a></td></tr></tbody></table>


# Status

## Sub-account Status

<table><thead><tr><th>Sub-account Type</th><th width="149.1015625">Sub-account Status</th><th width="133.501220703125">Sub-account KYC Status</th><th>Definition</th><th>Action items</th></tr></thead><tbody><tr><td>KYC</td><td>CREATED</td><td>WAITING_FOR_DOCUMENT</td><td>Account created and still in inactive mode</td><td>Need to submit Sub-account KYC document</td></tr><tr><td>KYC</td><td>CREATED</td><td>IN_REVIEW</td><td>Account created and still in inactive mode</td><td>Waiting for review results</td></tr><tr><td>KYC</td><td>CREATED</td><td>REJECTED</td><td>Account created and still in inactive mode</td><td>Submit other Sub-accounts</td></tr><tr><td>KYC</td><td>ACTIVE</td><td>APPROVED</td><td>Account active and can do (any) activity via dashboard / API</td><td></td></tr><tr><td>KYC</td><td>DEACTIVATED</td><td>APPROVED</td><td>Main Account intentionally deactivated the Sub-account</td><td></td></tr><tr><td>KYC</td><td>BLOCKED</td><td>APPROVED</td><td>Account Blocked by Pivot due to any terms and policy violation</td><td>Contact our Helpdesk support</td></tr><tr><td>KYC</td><td>DORMANT</td><td>APPROVED</td><td>Account has not been have transaction in any balance (account) for a period of time</td><td>Contact our Helpdesk support</td></tr><tr><td>KYC</td><td>CLOSED</td><td>APPROVED</td><td>Account has been closed due to main account request</td><td></td></tr><tr><td>NON_KYC</td><td>ACTIVE</td><td>NOT_REQUIRED</td><td>Account active and can do (any) activity via dashboard / API</td><td></td></tr><tr><td>NON_KYC</td><td>DEACTIVATED</td><td>NOT_REQUIRED</td><td>Main Account intentionally deactivated the Sub-account</td><td></td></tr><tr><td>NON_KYC</td><td>BLOCKED</td><td>NOT_REQUIRED</td><td>Account Blocked by Pivot due to any terms and policy violation</td><td>Contact our Helpdesk support</td></tr><tr><td>NON_KYC</td><td>DORMANT</td><td>NOT_REQUIRED</td><td>Account has not been have transaction in any balance (account) for a period of time</td><td>Contact our Helpdesk support</td></tr><tr><td>NON_KYC</td><td>CLOSED</td><td>NOT_REQUIRED</td><td>Account has been closed due to main account request</td><td></td></tr></tbody></table>

# Industry and Code List

## Industry List

<table data-full-width="false"><thead><tr><th width="264.923828125">Parent Industry</th><th width="397.3544921875">Child Industry</th><th>MCC</th></tr></thead><tbody><tr><td>Airlines</td><td>Airlines, Air Carriers</td><td>4511</td></tr><tr><td>Automotive</td><td>Car and Truck Dealers</td><td>7699</td></tr><tr><td>Automotive</td><td>Automotive Parts and Accessories Stores</td><td>7699</td></tr><tr><td>Automotive</td><td>Service Stations (with or without Ancillary Services)</td><td>7699</td></tr><tr><td>Clothing, apparel &#x26; acessories</td><td>Clothing stores</td><td>7299</td></tr><tr><td>Clothing, apparel &#x26; acessories</td><td>Pet shop</td><td>7299</td></tr><tr><td>Clothing, apparel &#x26; acessories</td><td>Tailors</td><td>7299</td></tr><tr><td>Clothing, apparel &#x26; acessories</td><td>Men’s and Women’s Clothing Stores</td><td>7299</td></tr><tr><td>Digital goods</td><td>Games</td><td>5816</td></tr><tr><td>Digital goods</td><td>Media (books, movies, artwork, images)</td><td>5815</td></tr><tr><td>Digital goods</td><td>Applications (excl. games)</td><td>5817</td></tr><tr><td>Digital goods</td><td>Utilities</td><td>4900</td></tr><tr><td>Education</td><td>Elementary and Secondary Schools</td><td>8299</td></tr><tr><td>Education</td><td>Colleges, Universities, Professional Schools</td><td>8299</td></tr><tr><td>Education</td><td>Correspondence Schools</td><td>8299</td></tr><tr><td>Education</td><td>Other educational services</td><td>8299</td></tr><tr><td>Education</td><td>LMS Platform</td><td>8299</td></tr><tr><td>Education</td><td>Edutech</td><td>8299</td></tr><tr><td>Entertainment</td><td>Theaters</td><td>7999</td></tr><tr><td>Entertainment</td><td>Tourist Attractions and Exhibits</td><td>7999</td></tr><tr><td>Entertainment</td><td>Public Golf Courses</td><td>7999</td></tr><tr><td>Entertainment</td><td>Membership Clubs (Sports, Recreation)</td><td>7999</td></tr><tr><td>Entertainment</td><td>Streaming services (gaming, music, TV)</td><td>7999</td></tr><tr><td>Entertainment</td><td>Health &#x26; beauty spas</td><td>7999</td></tr><tr><td>Entertainment</td><td>Other entertainment/recreation services</td><td>7999</td></tr><tr><td>Financial services</td><td>Banks, Credit unions</td><td>6010</td></tr><tr><td>Financial services</td><td>Remittance</td><td>4829</td></tr><tr><td>Financial services</td><td>Quasi-Cash Transactions (Gambling, Lottery)</td><td>6051</td></tr><tr><td>Financial services</td><td>Investments</td><td>6211</td></tr><tr><td>Financial services</td><td>Cryptocurrency exchage</td><td>6051</td></tr><tr><td>Financial services</td><td>Forex</td><td>6051</td></tr><tr><td>Financial services</td><td>P2P Lending</td><td>6051</td></tr><tr><td>Financial services</td><td>Other financial services</td><td>6051</td></tr><tr><td>Financial services</td><td>Aggregator/Payment Reseller</td><td>6051</td></tr><tr><td>Healthcare</td><td>Hospital</td><td>8099</td></tr><tr><td>Healthcare</td><td>Clinics (Chiropractors, Dentist, Optometrics)</td><td>8099</td></tr><tr><td>Healthcare</td><td>Drug stores/Pharmacy</td><td>8099</td></tr><tr><td>Healthcare</td><td>Laboratories</td><td>8099</td></tr><tr><td>Healthcare</td><td>Opticians, Optical Goods, Eyeglasses</td><td>8099</td></tr><tr><td>Logistics</td><td>Courier, Express, and Parcel</td><td>4789</td></tr><tr><td>Logistics</td><td>⁠Third-Party Logistics (3PL) Provider</td><td>4789</td></tr><tr><td>Logistics</td><td>Freight Forwarding Companies &#x26; ⁠Multimodal Transport Operators (MTOs)</td><td>4789</td></tr><tr><td>Logistics</td><td>Cold Chain Logistics Providers</td><td>4789</td></tr><tr><td>Marketplace</td><td>Horizontal Marketplace</td><td>5262</td></tr><tr><td>Marketplace</td><td>Vertical Marketplace</td><td>5262</td></tr><tr><td>Marketplace</td><td>Gaming Marketplace</td><td>5262</td></tr><tr><td>Organization</td><td>Charitable and Social Service Organizations</td><td>8699</td></tr><tr><td>Organization</td><td>Political organizations</td><td>8699</td></tr><tr><td>Organization</td><td>Religious organizations</td><td>8699</td></tr><tr><td>Organization</td><td>Civic, Social, and Fraternal Associations</td><td>8699</td></tr><tr><td>Outsourcing</td><td>Freelance marketplace/Gig economy platform/Crowdsourcing</td><td>7399</td></tr><tr><td>Outsourcing</td><td>Business Process Outsourcing (BPO)</td><td>7399</td></tr><tr><td>Personal services</td><td>Funeral services/crematorium</td><td>7399</td></tr><tr><td>Personal services</td><td>Beauty &#x26; barber shops</td><td>7399</td></tr><tr><td>Personal services</td><td>Laundry, cleaning, garment services</td><td>7399</td></tr><tr><td>Personal services</td><td>Photography Studios</td><td>7399</td></tr><tr><td>Personal services</td><td>Wedding and Bridal Services</td><td>7399</td></tr><tr><td>Personal services</td><td>Counseling services</td><td>7399</td></tr><tr><td>Personal services</td><td>Massage parlors</td><td>7399</td></tr><tr><td>Professional services</td><td>Advertising Services</td><td>8999</td></tr><tr><td>Professional services</td><td>Commercial Photography, Art, and Graphics</td><td>8999</td></tr><tr><td>Professional services</td><td>Consulting, Public Relations Services</td><td>8999</td></tr><tr><td>Professional services</td><td>Professional Services (Not Elsewhere Classified)</td><td>8999</td></tr><tr><td>Professional services</td><td>Law firm</td><td>8999</td></tr><tr><td>Professional services</td><td>Accounting, Auditing, Book keeping</td><td>8999</td></tr><tr><td>Professional services</td><td>Insurance Sales, Underwriting, and Premiums</td><td>8999</td></tr><tr><td>Professional services</td><td>Timeshares</td><td>8999</td></tr><tr><td>Professional services</td><td>Tax Preparation Services</td><td>8999</td></tr><tr><td>Professional services</td><td>Counseling Services – Debt, Marriage, and Personal</td><td>8999</td></tr><tr><td>Professional services</td><td>Advertising Services</td><td>8999</td></tr><tr><td>Professional services</td><td>Employment Agencies and Temporary Help Services</td><td>8999</td></tr><tr><td>Professional services</td><td>Management, Consulting, and Public Relations Services</td><td>8999</td></tr><tr><td>Professional services</td><td>Detective Agencies, Protective Services, and Security Services, including Armored Cars, and Guard Dogs</td><td>8999</td></tr><tr><td>Professional services</td><td>Architectural, Engineering, and Surveying Services</td><td>8999</td></tr><tr><td>Recreational services</td><td>Fitness &#x26; Sports Club</td><td>8999</td></tr><tr><td>Restaurants</td><td>Restaurants and Eating Places</td><td>5812</td></tr><tr><td>Restaurants</td><td>Drinking Places</td><td>5812</td></tr><tr><td>Restaurants</td><td>Coffee shops/cafe</td><td>5812</td></tr><tr><td>Restaurants</td><td>Fast Food Restaurants</td><td>5812</td></tr><tr><td>Retail</td><td>Department Stores</td><td>5999</td></tr><tr><td>Retail</td><td>Grocery Stores</td><td>5999</td></tr><tr><td>Retail</td><td>Miscellaneous and Specialty Retail</td><td>5999</td></tr><tr><td>Retail</td><td>Book Stores</td><td>5999</td></tr><tr><td>Retail</td><td>Office Supplies</td><td>5999</td></tr><tr><td>Retail</td><td>Furniture, home decor &#x26; home appliances</td><td>5999</td></tr><tr><td>Retail</td><td>Alcohol</td><td>5999</td></tr><tr><td>Retail</td><td>Other retail</td><td>5999</td></tr><tr><td>SaaS</td><td>POS</td><td>7399</td></tr><tr><td>SaaS</td><td>CRM &#x26; Marketing Automation</td><td>7399</td></tr><tr><td>SaaS</td><td>HRIS</td><td>7399</td></tr><tr><td>SaaS</td><td>Invoicing platform</td><td>7399</td></tr><tr><td>SaaS</td><td>Enabler (website developer, ecommerce enabler)</td><td>4816</td></tr><tr><td>SaaS</td><td>Ecommerce enabler</td><td>4816</td></tr><tr><td>Travel services</td><td>Lodging - Hotels, Motels, Resorts</td><td>7011</td></tr><tr><td>Travel services</td><td>Online travel agent</td><td>7011</td></tr></tbody></table>

## District & City ID

{% file src="<https://627965603-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FImVr2HJay0snj5ukhBJK%2Fuploads%2FghWWywRjrCmc328D5i6q%2FMerchant%20Industry%20(Pivot%20Payment).xlsx?alt=media&token=dc6a22ac-db59-4990-8cea-fe4a755fabc7>" %}


# Top-Ups

## API Collections

<table data-view="cards"><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><a data-mention href="top-ups/get-va-payment-channel-list">get-va-payment-channel-list</a></td><td>Retrieve available Virtual Account payment channel to Top Up</td></tr><tr><td><a data-mention href="top-ups/get-va-for-top-up">get-va-for-top-up</a></td><td>Retrieve selected Virtual Account number to Top Up</td></tr><tr><td><a data-mention href="top-ups/top-up-callback">top-up-callback</a></td><td>Register your Top Up Callback URL and get Top Up notification from your Account or Sub-Account</td></tr></tbody></table>

# Get VA Payment Channel List

## Method and URL

<mark style="color:green;">`GET`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]v1/payment-channels/virtual-accounts

## Response

**Response Body**

{% code fullWidth="false" %}

```json
{
    "code": "00",
    "message": "Success",
    "data": [
        {
            "uuid": "d26e581e-67a0-4785-883f-9c2a1d92ee66",
            "name": "BRI Virtual Account",
            "description": "-",
            "acquirer": "bri",
            "bankName": "Bank BRI"
        },
        {
            "uuid": "d26e581e-67a0-4785-883f-9c2a1d92ee65",
            "name": "Permata Virtual Account",
            "description": "-",
            "acquirer": "permata",
            "bankName": "Bank Permata"
        }
    ]
}
```

{% endcode %}

**Detail Parameter Response**

<table><thead><tr><th>Parameter</th><th width="123.2451171875">Data Type</th><th width="140.9931640625">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>code</td><td>String</td><td>M</td><td>Response Code from Pivot</td></tr><tr><td>message</td><td>String</td><td>M</td><td>Human readable message that represent response from Pivot</td></tr><tr><td>data</td><td>Array of Objects</td><td></td><td>Response Data from Pivot VA payment channel list</td></tr><tr><td><ul><li>uuid</li></ul></td><td>String</td><td>M</td><td>Unique Identifier of the Payment Channel</td></tr><tr><td><ul><li>name</li></ul></td><td>String</td><td>M</td><td>Name of the Payment Channel</td></tr><tr><td><ul><li>description</li></ul></td><td>String</td><td>M</td><td>Description of the Payment Channel</td></tr><tr><td><ul><li>acquirer</li></ul></td><td>String</td><td>M</td><td>Payment Channel Partner, usually 1 on 1 relationship. same with the payment channel name</td></tr><tr><td><ul><li>bankName</li></ul></td><td>String</td><td>M</td><td>Payment Channel Bank Name</td></tr></tbody></table>


# Get VA for Top Up

## Method and URL

<mark style="color:green;">`GET`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v1/payment-channels/virtual-accounts/{uuid}/top-up

<mark style="color:orange;">`uuid`</mark> from the Response Body whenever you get VA Payment Channel List

## Response

**Response Body**

{% code fullWidth="false" %}

```json
{
    "code": "00",
    "message": "Success",
    "data": {
        "uuid": "63a903c1-ec0b-46f1-8491-1595cd47985d",
        "merchantId": "047ff034-c8dc-4472-8931-4214674463de",
        "paymentMethodId": "d26e581e-67a0-4785-883f-9c2a1d92ee65",
        "referenceNumber": "7664012751673525",
        "createdAt": "2024-09-13T08:13:12Z",
        "updatedAt": "2024-09-13T08:13:12Z"
    }
}
```

{% endcode %}

**Detail Parameter Response**

<table><thead><tr><th>Parameter</th><th width="118.8359375">Data Type</th><th width="132.26171875">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>code</td><td>String</td><td>M</td><td>Response Code from Pivot</td></tr><tr><td>message</td><td>String</td><td>M</td><td>Human readable message that represent response from Pivot</td></tr><tr><td>data</td><td>Object</td><td></td><td>Response Data from Pivot for VA Object</td></tr><tr><td><ul><li>uuid</li></ul></td><td>String</td><td>M</td><td>Unique Identifier of the VA</td></tr><tr><td><ul><li>merchantId</li></ul></td><td>String</td><td>M</td><td>Your Merchant ID</td></tr><tr><td><ul><li>paymentMethodId</li></ul></td><td>String</td><td>M</td><td>Payment Channel UUID, you can get it from <a data-mention href="get-va-payment-channel-list">get-va-payment-channel-list</a></td></tr><tr><td><ul><li>referenceNumber</li></ul></td><td>String</td><td>M</td><td>The VA Number, you can show it in your platform</td></tr><tr><td><ul><li>createdAt</li></ul></td><td>String</td><td>M</td><td>VA created time with format YYYY-MM-DDTHH:MM:SSZ</td></tr><tr><td><ul><li>updatedAt</li></ul></td><td>String</td><td>M</td><td>VA latest updated time with format YYYY-MM-DDTHH:MM:SSZ</td></tr></tbody></table>


# Top Up Callback

## Method and URL

<mark style="color:green;">`POST`</mark> [www.yourcompany.com/payment\\\_callback\\\_url](http://www.yourcompany.com/payment\\_callback\\_url)

## Request

**Header Request**

<table><thead><tr><th>Parameter </th><th width="117">Data Type</th><th width="131">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>X-API-Key</td><td>String</td><td>M</td><td>Callback API Key, an additional API Key used specifically for receiving callbacks</td></tr><tr><td>Content-Type</td><td>String</td><td>M</td><td>application/JSON</td></tr><tr><td>Accept</td><td>String</td><td>M</td><td>application/JSON</td></tr></tbody></table>

**Request Body**

```json
{
  "event": "MERCHANT-TOP-UP.SUCCESS",
  "data": {
    "merchantId": "293b3e10-a973-42dc-864a-46f615dd0690",
    "merchantName": "Test Widya",
    "accountName": "DISBURSEMENT",
    "amount": {
      "currency": "IDR",
      "value": "100000"
    },
    "balanceBefore": {
      "currency": "IDR",
      "value": "500000"
    },
    "balanceAfter": {
      "currency": "IDR",
      "value": "600000"
    },
    "paymentMethod": {
      "type": "VIRTUAL_ACCOUNT"
    },
    "paymentMethodOptions": {
      "virtualAccount": {
        "channel": "PERMATA",
        "virtualAccountNumber": "7664011855050926",
        "virtualAccountName": "TW"
      }
    },
    "transactionTime": "2025-05-14T08:52:20.832448Z"
  }
}
```

**Detail Parameter Request**

<table><thead><tr><th width="217.5302734375">Parameter</th><th width="120">Data Type</th><th width="134.3671875">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>event</td><td>String</td><td>M</td><td>Event name: <br>MERCHANT-TOP-UP.SUCCESS</td></tr><tr><td>merchantId</td><td>String</td><td>M</td><td>Unique merchant ID given by Pivot</td></tr><tr><td>merchantName</td><td>String</td><td>M</td><td>Merchant Name information</td></tr><tr><td>accountName</td><td>String</td><td>M</td><td>Topped-up Account Balance </td></tr><tr><td>amount</td><td>Object</td><td>M</td><td></td></tr><tr><td><ul><li>currency</li></ul></td><td>String</td><td>M</td><td>Currency code in ISO 4217 Format, e.g. USD, IDR</td></tr><tr><td><ul><li>value</li></ul></td><td>String</td><td>M</td><td>Top Up amount value</td></tr><tr><td>balanceBefore</td><td>Object</td><td>M</td><td>Balance before Top Up</td></tr><tr><td><ul><li>currency</li></ul></td><td>String</td><td>M</td><td>Currency code in ISO 4217 Format, e.g. USD, IDR</td></tr><tr><td><ul><li>value</li></ul></td><td>String</td><td>M</td><td>Balance before Top Up value</td></tr><tr><td>balanceAfter</td><td>Object</td><td>M</td><td>Balance after Top Up</td></tr><tr><td><ul><li>currency</li></ul></td><td>String</td><td>M</td><td>Currency code in ISO 4217 Format, e.g. USD, IDR</td></tr><tr><td><ul><li>value</li></ul></td><td>String</td><td>M</td><td>Balance after Top Up value</td></tr><tr><td>paymentMethod</td><td>Object</td><td>M</td><td></td></tr><tr><td><ul><li>type</li></ul></td><td>String</td><td>M</td><td><p>Available payment method types for Top Up, possible values are</p><p><mark style="color:orange;"><code>VIRTUAL_ACCOUNT</code></mark></p></td></tr><tr><td>paymentMethodOptions</td><td>Object</td><td>M</td><td></td></tr><tr><td><ul><li>virtualAccount</li></ul></td><td>Object</td><td>M</td><td></td></tr><tr><td><blockquote><ul><li>channel</li></ul></blockquote></td><td>String</td><td>M</td><td><p>Virtual Account Bank Name, possible values are</p><ul><li>DANAMON</li><li>BNI</li><li>MANDIRI</li><li>BSI</li><li>BNC</li><li>CIMB</li><li>BRI</li><li>PERMATA</li></ul></td></tr><tr><td><blockquote><ul><li>virtualAccountNumber</li></ul></blockquote></td><td>String</td><td>M</td><td>The corresponding virtual account number that can be used to Top Up</td></tr><tr><td><blockquote><ul><li>virtualAccountName</li></ul></blockquote></td><td>String</td><td>M</td><td><p>For Main Account &#x26; Non KYC Sub-Account: </p><p>Virtual Account Name will use merchant name <br><br>For KYC Sub-Account:<br>Virtual Account Name will use Sub-Account name </p></td></tr><tr><td>transactionTime</td><td>String</td><td>M</td><td>When Top Up transaction time with format YYYY-MM-DDTHH:MM:SSZ</td></tr></tbody></table>


# Transfer

## API Collections

<table data-view="cards"><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><a data-mention href="transfer/create-a-transfer">create-a-transfer</a></td><td>Single - One way money movement between platform accounts</td></tr><tr><td><a data-mention href="transfer/retrieve-a-transfer">retrieve-a-transfer</a></td><td>Get a transfer details</td></tr><tr><td><a data-mention href="transfer/list-of-transfer">list-of-transfer</a></td><td>Get a Collection of transfer details</td></tr><tr><td><a data-mention href="transfer/transfer-object">transfer-object</a></td><td></td></tr></tbody></table>

## Miscellaneous

<table data-view="cards"><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><a data-mention href="response-code">response-code</a></td><td></td></tr></tbody></table>



# Create a Transfer

## Method and URL

<mark style="color:green;">`POST`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v1/transfers

## Request

**Request Body**

```json
{
    "referenceId": "PAY/trf-0109332",
    "recipientId": "u734-981324saf-53tup",
    "transferType": "DIRECT",
    "amount": 10000,
    "remarks": "transfer for coffeeshop"
}
```

**Detail Parameter Request**

<table><thead><tr><th width="176">Parameter</th><th>Data Type</th><th>Character limit</th><th width="134.3984375">Requirement</th><th width="283">Description</th></tr></thead><tbody><tr><td>referenceId</td><td>String</td><td>1-100</td><td>M</td><td>Id of transaction reference from merchant, It can be used for reconcile process</td></tr><tr><td>recipientId</td><td>Uuid</td><td>-</td><td>M</td><td>Id of the Recipient, in platform cases means merchantId</td></tr><tr><td>transferType</td><td>String</td><td>0-20</td><td>M</td><td>Posibble value is <mark style="color:orange;"><code>DIRECT</code></mark></td></tr><tr><td>amount</td><td>Numeric</td><td>-</td><td>M</td><td>Transfer amount</td></tr><tr><td>remarks</td><td>String</td><td>1-100</td><td>M</td><td>Note for the transaction</td></tr></tbody></table>

## Response

**Response Body**

{% code fullWidth="false" %}

```json
{
    "code": "00",
    "message": "Success",
    "data": {
        "uuid": "8uh7-n332-9vst-l2c1",
        "recipientId": "u734-981324saf-53tu",
        "amount": 10000,
        "remarks": "transfer for coffeeshop",
        "status": "SUCCESS",
        "transaction_timestamp": "2024-05-13T08:21:44.967496538Z",
        "created": "2024-05-13T08:21:44.967496538Z",
        "updated": "2024-05-13T08:21:44.967496538Z"
    }
}
```

{% endcode %}

**Detail Parameter Response**

<table><thead><tr><th>Parameter</th><th width="121.150390625">Data Type</th><th width="135.8369140625">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>code</td><td>String</td><td>M</td><td>Response Code from Pivot</td></tr><tr><td>message</td><td>String</td><td>M</td><td>Human readable message that represent response from Pivot</td></tr><tr><td>data</td><td>Object</td><td>M</td><td>Response Data from Pivot contains <a data-mention href="transfer-object">transfer-object</a></td></tr></tbody></table>


# Retrieve a Transfer

## Method and URL

<mark style="color:green;">`GET`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v1/transfers/{uuid}

<mark style="color:orange;">`uuid`</mark> from the Response Body whenever you create a transfer

## Response

**Response Body**

{% code fullWidth="false" %}

```json
{
    "code": "00",
    "message": "Success",
    "data": {
        "uuid": "8uh7-n332-9vst-l2c1",
        "referenceId": "PAY/trf-0109332"
        "recipientId": "u734-981324saf-53tu",
        "amount": 10000,
        "remarks": "transfer for coffeeshop",
        "transferType": "DIRECT",
        "status": "SUCCESS",
        "transaction_timestamp": "2024-05-13T08:21:44.967496538Z",
        "created": "2024-05-13T08:21:44.967496538Z",
        "updated": "2024-05-13T08:21:44.967496538Z"
    }
}
```

{% endcode %}

**Detail Parameter Response**

<table><thead><tr><th>Parameter</th><th width="120.8232421875">Data Type</th><th width="135.884765625">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>code</td><td>String</td><td>M</td><td>Response Code from Pivot</td></tr><tr><td>message</td><td>String</td><td>M</td><td>Human readable message that represent response from Pivot</td></tr><tr><td>data</td><td>Object</td><td>M</td><td>Response Data from Pivot contains <a data-mention href="transfer-object">transfer-object</a></td></tr></tbody></table>


# List of Transfer

## Method and URL

<mark style="color:green;">`GET`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v1/transfers?referenceId={referenceId}

{% hint style="info" %} <mark style="color:orange;">`referenceId`</mark> is optional.&#x20;

With <mark style="color:orange;">`referenceId`</mark> Provided, the response will return an array of data containing a single transfer with an exact match reference ID
{% endhint %}

## Response

**Response Body**

{% code fullWidth="false" %}

```json
{
    "code": "00",
    "message": "Success",
    "data": [
        {
            "uuid": "8uh7-n332-9vst-l2c1",
            "referenceId": "PAY/trf-0109332",
            "recipientId": "u734-981324saf-53tu",
            "amount": 10000,
            "remarks": "transfer for coffeeshop",
            "transferType": "DIRECT",
            "status": "SUCCESS",
            "transaction_timestamp": "2024-05-13T08:21:44.967496538Z",
            "created": "2024-05-13T08:21:44.967496538Z",
            "updated": "2024-05-13T08:21:44.967496538Z"
        },
        // more transfer items
    ],
    "pagination": {
        "page": 1,
        "perPage": 10,
        "totalPage": 10,
        "totalData": 100
    }
}
```

{% endcode %}

**Detail Parameter Response**

<table><thead><tr><th>Parameter</th><th width="127.869140625">Data Type</th><th width="141.44921875">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>code</td><td>String</td><td>M</td><td>Response Code from Pivot</td></tr><tr><td>message</td><td>String</td><td>M</td><td>Human readable message that represent response from Pivot</td></tr><tr><td>data</td><td>Object</td><td>M</td><td>Response Data from Pivot contains list of <a data-mention href="transfer-object">transfer-object</a></td></tr><tr><td>pagination</td><td>Object</td><td>M</td><td><a data-mention href="../../../api-information/pagination">pagination</a></td></tr></tbody></table>


# Transfer Object

A transfer is a single money movement between accounts within the platform

```json
{
  "uuid": "8uh7-n332-9vst-l2c1",
  "referenceId": "[your_reference]",
  "recipientId": "u734-981324saf-53tu",
  "amount": 100000,
  "remarks": "transfer for coffeeshop",
  "transferType": "DIRECT",
  "status": "SUCCESS",
  "transaction_timestamp": "2024-05-13T08:21:44.967496538Z",
  "created": "2024-05-13T08:21:44.967496538Z",
  "updated": "2024-05-13T08:21:44.967496538Z"
}
```

**Detail Transfer Object**

<table data-full-width="false"><thead><tr><th>Parameter</th><th width="126.365234375">Data Type</th><th width="147.5810546875">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>uuid</td><td>String</td><td>M</td><td>Object Unique Identifier</td></tr><tr><td>referenceId</td><td>String</td><td>M</td><td>Merchant Reference Id from the Client's System </td></tr><tr><td>recipientId</td><td>String</td><td>M</td><td>UUID of the Recipient, recipient can be a merchant for platform case or a customer for wallet case</td></tr><tr><td>amount</td><td>Number</td><td>M</td><td>Transfer amount</td></tr><tr><td>remarks</td><td>String</td><td>M</td><td>Transfer note or remarks from the Client's System</td></tr><tr><td>transferType</td><td>String</td><td>M</td><td></td></tr><tr><td>status</td><td>ENUM</td><td>M</td><td>Transfer Status, one of <mark style="color:orange;"><code>SUCCESS</code></mark>, <mark style="color:orange;"><code>PENDING</code></mark> and <mark style="color:orange;"><code>FAILED</code></mark></td></tr><tr><td>transactionTimestamp</td><td>String</td><td>M</td><td>Transfer transaction timestamp</td></tr><tr><td>created</td><td>String</td><td>M</td><td>Transfer Object created time in ISO-8601 Format. i.e. 2024-05-13T08:21:44.967496538Z</td></tr><tr><td>updated</td><td>String</td><td>M</td><td>Transfer Object last updated time in ISO-8601 Format. i.e. 2024-05-13T08:21:44.967496538Z</td></tr></tbody></table>


# Withdrawal




# Create a Withdrawal

## Method and URL

<mark style="color:green;">`POST`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v1/withdrawals

## Request

**Request Body**

```json
{
  "referenceId": "TEST-REFORZA-2025-001",
  "withdrawType": "BANK_TRANSFER",
  "balanceType": "PAYOUT_BALANCE",
  "isFullAmount": false,
  "amount": {
    "value": "10000",
    "currency": "IDR"
  },
  "description": "Test Reforza Pivot"
}
```

**Detail Parameter Request**

<table><thead><tr><th width="176">Parameter</th><th>Data Type</th><th>Character limit</th><th width="134.3984375">Requirement</th><th width="283">Description</th></tr></thead><tbody><tr><td>Withdrawal</td><td>Object</td><td>-</td><td>M</td><td><a data-mention href="withdrawal-object">withdrawal-object</a></td></tr></tbody></table>

## Response

**Response Body**

{% code fullWidth="false" %}

```json
{
  "code": "00",
  "message": "OK",
  "data": {
    "id": "0199130c-f3aa-7024-b547-0ef3216f9602",
    "merchantId": "e485e01b-ff59-4a47-bb7d-9b39064f3388",
    "withdrawal": {
      "referenceId": "TEST-REFORZA-2025-001",
      "withdrawType": "BANK_TRANSFER",
      "balanceType": "PAYOUT_BALANCE",
      "isFullAmount": false,
      "amount": {
        "currency": "IDR",
        "value": "10000"
      },
      "description": "Test Reforza Pivot"
    },
    "status": "SUCCESS",
    "createdAt": "2025-09-04T04:47:20Z",
    "updatedAt": "2025-09-04T04:47:20Z"
  }
}
```

{% endcode %}

**Detail Parameter Response**

<table><thead><tr><th>Parameter</th><th width="121.150390625">Data Type</th><th width="135.8369140625">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>code</td><td>String</td><td>M</td><td>Response Code from Pivot</td></tr><tr><td>message</td><td>String</td><td>M</td><td>Human readable message that represent response from Pivot</td></tr><tr><td>data</td><td>Object</td><td>M</td><td>Response Data from Pivot contains <a data-mention href="withdrawal-object">withdrawal-object</a></td></tr></tbody></table>


# Withdrawal Callback

## Method and URL

<mark style="color:green;">`POST`</mark> [www.yourcompany.com/payment\\\_callback\\\_url](http://www.yourcompany.com/payment\\_callback\\_url)

## Request

**Header Request**

<table><thead><tr><th>Parameter </th><th width="117">Data Type</th><th width="131">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>X-API-Key</td><td>String</td><td>M</td><td>Callback API Key, an additional API Key used specifically for receiving callbacks</td></tr><tr><td>Content-Type</td><td>String</td><td>M</td><td>application/JSON</td></tr><tr><td>Accept</td><td>String</td><td>M</td><td>application/JSON</td></tr></tbody></table>

**Request Body**

```json
{
  "event": "WITHDRAW.SUCCESS",
  "data": {
    "id": "7f0485cf-4289-40b4-9a0d-80f182b914fd",
    "merchantId": "e485e01b-ff59-4a47-bb7d-9b39064f3388",
    "withdrawal": {
      "referenceId": "Reforza-Pivot-001",
      "withdrawType": "BANK_ACCOUNT",
      "balanceType": null,
      "isFullAmount": false,
      "amount": {
        "currency": "IDR",
        "value": "1000000"
      },
      "description": "Reforza Pivot 001"
    },
    "status": "SUCCESS",
    "createdAt": "2025-08-07T07:29:13.962421067Z",
    "updatedAt": "2025-08-07T07:29:13.962421155Z"
  }
}
```

**Detail Parameter Request**

<table><thead><tr><th width="217.5302734375">Parameter</th><th width="120">Data Type</th><th width="134.3671875">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>event</td><td>String</td><td>M</td><td><p>Withdrawal Event Names:<br></p><ol><li>WITHDRAW.SUCCESS</li><li>WITHDRAW.FAILED</li></ol></td></tr><tr><td>data</td><td>Object</td><td>M</td><td>Response Data from Pivot contains <a data-mention href="withdrawal-object">withdrawal-object</a></td></tr></tbody></table>


# Withdrawal Object

```json
{
  "code": "00",
  "message": "OK",
  "data": {
    "id": "0199130c-f3aa-7024-b547-0ef3216f9602",
    "merchantId": "e485e01b-ff59-4a47-bb7d-9b39064f3388",
    "withdrawal": {
      "referenceId": "TEST-REFORZA-2025-001",
      "withdrawType": "BANK_TRANSFER",
      "balanceType": "PAYOUT_BALANCE",
      "isFullAmount": false,
      "amount": {
        "currency": "IDR",
        "value": "10000"
      },
      "description": "Test Reforza Pivot"
    },
    "status": "SUCCESS",
    "createdAt": "2025-09-04T04:47:20Z",
    "updatedAt": "2025-09-04T04:47:20Z"
  }
}
```

**Detail Withdrawal Object**

<table><thead><tr><th width="176">Parameter</th><th>Data Type</th><th width="106.583984375">Character limit</th><th width="117.8310546875">Requirement</th><th width="283">Description</th></tr></thead><tbody><tr><td>id</td><td>String</td><td>-</td><td>Auto Generated</td><td>Unique ID generated from Pivot as withdrawal identifier</td></tr><tr><td>merchantId</td><td>String</td><td>-</td><td>M</td><td>Unique merchant ID given by Pivot</td></tr><tr><td>withdrawal</td><td>Object</td><td>-</td><td>M</td><td></td></tr><tr><td><ul><li>referenceId</li></ul></td><td>String</td><td>-</td><td>M</td><td>Unique ID from merchant to identify the withdrawal</td></tr><tr><td><ul><li>withdrawType</li></ul></td><td>String</td><td>-</td><td>M</td><td><p>Withdrawal destination, </p><p>possible values:</p><ul><li>BALANCE_TRANSFER</li><li>BANK_TRANSFER</li></ul></td></tr><tr><td><ul><li>balanceType</li></ul></td><td>String</td><td>-</td><td>C</td><td><p>Required if <mark style="color:orange;"><code>balanceType</code></mark> = <mark style="color:orange;"><code>BALANCE_TRANSFER</code></mark><br><br>Balance Type: </p><p>PAYOUT_BALANCE</p></td></tr><tr><td><ul><li>isFullAmount</li></ul></td><td>Boolean</td><td>-</td><td>C</td><td><p>possible values:</p><ul><li>false (default)</li><li>true</li></ul></td></tr><tr><td><ul><li>amount</li></ul></td><td>Object</td><td>-</td><td>C</td><td>Requred if <mark style="color:orange;"><code>isFullAmount</code></mark> = false</td></tr><tr><td><blockquote><ul><li>currency</li></ul></blockquote></td><td>String</td><td>1-3</td><td>M</td><td>Currency ISO 4217</td></tr><tr><td><blockquote><ul><li>value</li></ul></blockquote></td><td>String</td><td>1-18</td><td>M</td><td>Amount value</td></tr><tr><td><ul><li>description</li></ul></td><td>String</td><td>1-50</td><td>O</td><td>Information describing the withdrawal for merchant internal notes</td></tr><tr><td>status</td><td>String</td><td>-</td><td>M</td><td><p>Status of Withdrawal , possible values:</p><ul><li>PENDING</li><li>SUCCESS</li><li>FAILED</li></ul></td></tr><tr><td>createdAt</td><td>String</td><td>-</td><td>M</td><td>Withdrawal created time with format YYYY-MM-DDTHH:MM:SSZ</td></tr><tr><td>updatedAt</td><td>String</td><td>-</td><td>M</td><td>Withdrawal latest updated time with format YYYY-MM-DDTHH:MM:SSZ</td></tr></tbody></table>



# Split Payment and Routing

## Split Payment and Routing Object

Attach this object to the Request Body of [create-payment-session](https://pivot-payment.gitbook.io/pivot-docs/api-references/api-lists/payments/payment-session/create-payment-session "mention")

```json
{
  "splitRoutingConfigurations": [
    {
      "merchantId": "e485e01b-ff59-4a47-bb7d-9b39064f3388",
      "type": "FIXED",
      "currency": "IDR",
      "percentageAmount": 2.5,
      "fixedAmount": 25000,
      "remarks": "Fee Reforza Platform"
    }
  ]
}
```

**Detail Parameter Object**

<table><thead><tr><th width="230.01953125">Parameter</th><th width="120.9453125">Data Type</th><th width="133.1796875">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>splitRoutingConfiguration</td><td>Array of Objects</td><td>O</td><td></td></tr><tr><td><ul><li>merchantId</li></ul></td><td>String</td><td>M</td><td>Route Payment destination, can route to Main Account or Sub-account within the platform</td></tr><tr><td><ul><li>type</li></ul></td><td>String</td><td>M</td><td><p>Type possible values:</p><ol><li>FIXED</li><li>PERCENTAGE</li></ol></td></tr><tr><td><ul><li>currency</li></ul></td><td>String</td><td>M</td><td>IDR</td></tr><tr><td><ul><li>percentageAmount</li></ul></td><td>Integer</td><td>C</td><td>Mandatory if the type value is "PERCENTAGE"</td></tr><tr><td><ul><li>fixedAmount</li></ul></td><td>Integer</td><td>C</td><td>Mandatory if the type value is "FIXED"</td></tr><tr><td><ul><li>remarks</li></ul></td><td>String</td><td>M</td><td></td></tr></tbody></table>



# Response Code

## Generic API Error

<table><thead><tr><th width="98.58984375" valign="middle">HTTP Method</th><th>Error Type</th><th>Error Code</th><th>Message</th><th>Scenario</th></tr></thead><tbody><tr><td valign="middle">400</td><td>API_ERROR</td><td>api_validation_error</td><td>The request was invalid, or an error occurred in downstream provider</td><td>User hit any endpoints with invalid payload</td></tr><tr><td valign="middle">401</td><td>API_ERROR</td><td>credentials_invalid</td><td>Access token is invalid, please verify that the authentication is provided and valid</td><td>User hit any endpoints but can't authenticate its API Access</td></tr><tr><td valign="middle">403</td><td>API_ERROR</td><td>resource_not_complete</td><td>Please verify that the setup is complete</td><td><p>User hit any endpoints but not set mandatory setup like redirect url, etc</p><p><br></p></td></tr><tr><td valign="middle">403</td><td>API_ERROR</td><td>forbidden_access</td><td>Provided API Key does not have the correct permissions to perform the operation</td><td>User is already authenticated but hit endpoints which out of scope of the authorization</td></tr><tr><td valign="middle">404</td><td>GATEWAY_ERROR</td><td>not_found</td><td>The requested URL does not exist</td><td>User is already authenticated but hit wrong endpoints</td></tr><tr><td valign="middle">404</td><td>GATEWAY_ERROR</td><td>resource_missing</td><td>The $resource with ID $id cannot be found</td><td>User is already authenticated but can't found the resources with specific ID</td></tr><tr><td valign="middle">409</td><td>GATEWAY_ERROR</td><td>duplicate_error</td><td>There's already existing record with the provided details</td><td>User is already authenticated and send payload request which conflicted with existing resource</td></tr><tr><td valign="middle">409</td><td>API_ERROR</td><td>idempotency_error</td><td>The same Idempotency-key was provided with a different payload</td><td>User is already authenticated and send same idempotency key with different payload request, can be different data or different endpoint</td></tr><tr><td valign="middle">429</td><td>API_ERROR</td><td>frequency_above_limit</td><td>The frequency limit of $resource is reached for operation $operation</td><td>User hit same endpoints repeatedly many times in short period</td></tr><tr><td valign="middle">500</td><td>GATEWAY_ERROR</td><td>internal_error</td><td>An internal error was encountered. Please Try again later</td><td>User is hit any endpoints but the pivot's server has encountered a problem</td></tr><tr><td valign="middle">502</td><td>GATEWAY_ERROR</td><td>bad_gateway</td><td>An internal error was encountered. Please Try again later</td><td>User is hit any endpoints but the pivot's server has encountered a problem</td></tr><tr><td valign="middle">503</td><td>GATEWAY_ERROR</td><td>service_unavailable</td><td>An internal error was encountered. Please Try again later</td><td>User is hit any endpoints but the pivot's server has encountered a problem</td></tr><tr><td valign="middle">504</td><td>GATEWAY_ERROR</td><td>gateway_timeout</td><td>An internal error was encountered. Please Try again later</td><td>User is hit any endpoints but the pivot's server has encountered a problem</td></tr></tbody></table>

## Response Code

<table><thead><tr><th width="205.8564453125">Response Code</th><th width="210.1181640625">Response Message</th><th width="344.5478515625">Error Object</th></tr></thead><tbody><tr><td>00</td><td>success</td><td>-</td></tr><tr><td>credentials_invalid</td><td>Access token is invalid</td><td><pre class="language-json"><code class="lang-json">{
  "error": {
    "type": "API_ERROR",
    "details": [
      {
        "field": "",
        "message": "Request new access token"
      }
    ],
    "traceId": "{trace id}"
  }
}
</code></pre></td></tr><tr><td>api_validation_error</td><td>The request was invalid, or an error occurred in downstream provider</td><td><pre class="language-json"><code class="lang-json">{
  "error": {
    "type": "API_ERROR",
    "details": [
      {
        "field": "recipientID",
        "message": "Make sure recipientID format is correct"
      },
      {
        "field": "referenceID",
        "message": "Make sure referenceID value is fulfilled"
      }
    ],
    "traceId": "7fadd95da98e59cfad5148382095f2c1"
  }
}
</code></pre></td></tr><tr><td>field_required</td><td>Mandatory Field is Missing</td><td><pre class="language-json"><code class="lang-json">{
  "error": {
    "type": "API_ERROR",
    "details": [
      {
        "field": "{field name}",
        "message": "Make sure {field name} value is fulfilled"
      }
    ],
    "traceId": "{trace id}"
  }
}
</code></pre></td></tr><tr><td>resource_already_exists</td><td>ID is already exists</td><td><pre class="language-json"><code class="lang-json">{
  "error": {
    "type": "API_ERROR",
    "details": [
      {
        "field": "{field name}",
        "message": "Use unique {field name}"
      }
    ],
    "traceId": "{trace id}"
  }
}
</code></pre></td></tr><tr><td>invalid_recepient</td><td>Receepient ID is invalid</td><td><pre class="language-json"><code class="lang-json">{
  "error": {
    "type": "API_ERROR",
    "details": [
      {
        "field": "",
        "message": "Make sure the Recipient ID is correct"
      }
    ],
    "trace_id": "{trace id}"
  }
}
</code></pre></td></tr><tr><td>insufficient_fund</td><td>Insufficient balance for Transfer</td><td><pre class="language-json"><code class="lang-json">{
  "error": {
    "type": "API_ERROR",
    "details": [
      {
        "field": "",
        "message": "Make sure balance is sufficient for Transfer"
      }
    ],
    "trace_id": "{trace id}"
  }
}
</code></pre></td></tr><tr><td>resend_failed</td><td>Resend Invitation Failed: User Is Invalid</td><td><pre class="language-json"><code class="lang-json">{
  "error": {
    "type": "API_ERROR",
    "details": [
      {
        "field": "",
        "message": "Cannot resend invitation: the user is invalid or no longer eligible for an invitation"
      }
    ],
    "traceId": "{trace id}"
  }
}
</code></pre></td></tr><tr><td>resend_failed</td><td>Resend Invitation Failed: User Already Active</td><td><pre class="language-json"><code class="lang-json">{
  "error": {
    "type": "API_ERROR",
    "details": [
      {
        "field": "",
        "message": "Cannot resend invitation: the user is already active"
      }
    ],
    "traceId": "{trace id}"
  }
}
</code></pre></td></tr><tr><td>topup_va_failed</td><td>Failed to Generate Virtual Account for Topup</td><td><pre class="language-json"><code class="lang-json">{
  "error": {
    "type": "API_ERROR",
    "details": [
      {
        "field": "",
        "message": "Failed to generate VA for topup"
      }
    ],
    "traceId": "{trace id}"
  }
}
</code></pre></td></tr><tr><td>assign_user_failed</td><td>Assign Admin User: Email Already Exist</td><td><pre class="language-json"><code class="lang-json">{
  "error": {
    "type": "API_ERROR",
    "details": [
      {
        "field": "",
        "message": "Cannot assign admin user: the email is already exists"
      }
    ],
    "traceId": "{trace id}"
  }
}
</code></pre></td></tr><tr><td>general_error</td><td>General Error</td><td><pre class="language-json"><code class="lang-json">{
  "error": {
    "type": "API_ERROR",
    "details": [
      {
        "field": "",
        "message": "Please contact our representative team"
      }
    ],
    "traceId": "{trace id}"
  }
}
</code></pre></td></tr></tbody></table>



# Payments

## API Collections

<table data-view="cards"><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><a data-mention href="payments/get-payment-method-config">get-payment-method-config</a></td><td>Retrieve enabled Payment Method configuration</td></tr><tr><td><a data-mention href="payments/payment-session/create-payment-session">create-payment-session</a></td><td>Request a windowed time of payment session</td></tr><tr><td><a data-mention href="payments/payment-session/confirm-payment-session">confirm-payment-session</a></td><td>Confirm your chosen Payment Method, applicable if "autoConfirm" is false</td></tr><tr><td><a data-mention href="payments/payment-session/retrieve-payment-session-details">retrieve-payment-session-details</a></td><td>Get a detailed Payment Session by ID or Client Reference ID</td></tr><tr><td><a data-mention href="payments/payment-session/retrieve-list-of-payment-sessions">retrieve-list-of-payment-sessions</a></td><td>Get all of your created Payment Sessions</td></tr><tr><td><a data-mention href="payments/payment-session/cancel-payment-session">cancel-payment-session</a></td><td>Void an unpaid payment session, preventing further transactions</td></tr><tr><td><a data-mention href="payments/retrieve-charge-details">retrieve-charge-details</a></td><td>Get a detailed Charge by Client Reference ID</td></tr><tr><td><a data-mention href="payments/payment-callback">payment-callback</a></td><td>Register your Payment Callback URL and get Payment status</td></tr><tr><td><a data-mention href="payments/payment-simulation">payment-simulation</a></td><td>Simulate payment flows without using real money</td></tr><tr><td><a data-mention href="payments/object">object</a></td><td></td></tr></tbody></table>

## Miscellaneous

<table data-view="cards"><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><a data-mention href="payments/card-encryption">card-encryption</a></td><td></td></tr><tr><td><a data-mention href="payments/response-and-failure-code">response-and-failure-code</a></td><td></td></tr><tr><td><a data-mention href="payments/status">status</a></td><td></td></tr></tbody></table>


# Get Payment Method Config

## Method and URL

<mark style="color:green;">`GET`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v2/payment-method-configs

## Response

**Response Body**

```json
{
  "code": "00",
  "message": "Success",
  "data": {
    "card": {
      "enabled": true,
      "acceptedChannels": [
        "VISA",
        "MASTERCARD",
        "JCB"
      ],
      "minimumAmount": {
        "value": 10000,
        "currency": "IDR"
      },
      "maximumAmount": {
        "value": 9999999999,
        "currency": "IDR"
      },
      "maximumExpiry": "30 DAYS",
      "installmentConfig": null
    },
    "virtualAccount": {
      "enabled": true,
      "acceptedChannels": [
        "DANAMON"
        "BNI",
        "MANDIRI",
        "BSI",
        "BCA",
        "BNC",
        "CIMB",
        "BRI",
        "PERMATA"
      ],
      "minimumAmount": {
        "value": 10000,
        "currency": "IDR"
      },
      "maximumAmount": {
        "value": 9999999999,
        "currency": "IDR"
      },
      "maximumExpiry": "30 DAYS"
    },
    "qr": {
      "enabled": true,
      "minimumAmount": {
        "value": 1000,
        "currency": "IDR"
      },
      "maximumAmount": {
        "value": 9999999,
        "currency": "IDR"
      },
      "maximumExpiry": "60 MINUTES"
    },
    "ewallet": {
      "enabled": true,
      "acceptedChannels": [
        "DANA",
        "SHOPEEPAY"
      ],
      "minimumAmount": {
        "value": 10000,
        "currency": "IDR"
      },
      "maximumAmount": {
        "value": 9999999,
        "currency": "IDR"
      },
      "maximumExpiry": "30 MINUTES"
    },
    "installment": {
      "enabled": false,
      "acceptedChannels": {}
    }
  }
}
```

**Detail Parameter Response**

<table><thead><tr><th width="203.60546875">Parameter</th><th width="125.2890625">Data Type</th><th width="132.67578125">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>card</td><td>Object</td><td>M</td><td>Config object</td></tr><tr><td><ul><li>enabled</li></ul></td><td>Boolean</td><td>M</td><td>Depend on Merchant payment method config</td></tr><tr><td><ul><li>acceptedChannels</li></ul></td><td>Array of string</td><td>O</td><td><p>If enabled = false, then []</p><p>If enabled = true, then depends on which channel is enabled</p><p></p><p>Possible values</p><ul><li>VISA</li><li>MASTERCARD</li><li>JCB</li><li>AMEX</li><li>UNIONPAY</li><li>DINERS</li><li>DISCOVER</li></ul></td></tr><tr><td><ul><li>minimumAmount</li></ul></td><td>Object</td><td>O</td><td><a data-mention href="object/amount-object">amount-object</a>, if amount is below the amount, then payment method is disabled</td></tr><tr><td><ul><li>maximumAmount</li></ul></td><td>Object</td><td>O</td><td><a data-mention href="object/amount-object">amount-object</a>, if amount is above the amount, then payment method is disabled</td></tr><tr><td><ul><li>maximumExpiry</li></ul></td><td>String</td><td>M</td><td>Maximum Payment Expiry Time </td></tr><tr><td><ul><li>installmentConfigs</li></ul></td><td>Array of object</td><td>O</td><td>Installment Config object</td></tr><tr><td><blockquote><ul><li> binNumbers</li></ul></blockquote></td><td>Array of string</td><td>M</td><td><p>Array of bin number (6 and 8 digit) enabled for installment, </p><p></p><p>example:</p><p>[“412345”, “42345678”]</p></td></tr><tr><td><blockquote><ul><li>enabledPlans</li></ul></blockquote></td><td>Array of number</td><td>M</td><td><p>Installment plans / durations, </p><p></p><p>example: [3, 6, 9, 12]</p></td></tr><tr><td><blockquote><ul><li>plans</li></ul></blockquote></td><td>Array of string</td><td>O</td><td><p>Installment plans category, </p><p></p><p>example: [“regular”, “0%”]</p></td></tr><tr><td><blockquote><ul><li>minimumAmount</li></ul></blockquote></td><td>Object</td><td>M</td><td><a data-mention href="object/amount-object">amount-object</a>, if amount is below the amount, then installment  is disabled</td></tr><tr><td><blockquote><ul><li>maximumAmount</li></ul></blockquote></td><td>Object</td><td>M</td><td><a data-mention href="object/amount-object">amount-object</a>, if amount is above the amount, then installment is disabled</td></tr><tr><td>virtualAccount</td><td>Object</td><td>M</td><td>Config object</td></tr><tr><td><ul><li>enabled</li></ul></td><td>Boolean</td><td>M</td><td>Depend on Merchant payment method config</td></tr><tr><td><ul><li>acceptedChannels</li></ul></td><td>Array of string</td><td>O</td><td><p>If enabled = false, then []</p><p>If enabled = true, then depends on which channel is enabled</p><p><br></p><p>Possible values</p><ul><li>PERMATA</li><li>BRI</li><li>MANDIRI</li><li>CIMB</li><li>BNC</li><li>etc</li></ul></td></tr><tr><td><ul><li>minimumAmount</li></ul></td><td>Object</td><td>O</td><td><a data-mention href="object/amount-object">amount-object</a>, if amount is below the amount, then payment method is disabled</td></tr><tr><td><ul><li>maximumAmount</li></ul></td><td>Object</td><td>O</td><td><a data-mention href="object/amount-object">amount-object</a>, if amount is above the amount, then payment method is disabled</td></tr><tr><td><ul><li>maximumExpiry</li></ul></td><td>String</td><td>M</td><td>Maximum Payment Expiry Time </td></tr><tr><td>qr</td><td>Object</td><td>M</td><td>Config object</td></tr><tr><td><ul><li>enabled</li></ul></td><td>Boolean</td><td>M</td><td>Depend on Merchant payment method config</td></tr><tr><td><ul><li>minimumAmount</li></ul></td><td>Object</td><td>O</td><td><a data-mention href="object/amount-object">amount-object</a>, if amount is below the amount, then payment method is disabled</td></tr><tr><td><ul><li>maximumAmount</li></ul></td><td>Object</td><td>O</td><td><a data-mention href="object/amount-object">amount-object</a>, if amount is above the amount, then payment method is disabled</td></tr><tr><td><ul><li>maximumExpiry</li></ul></td><td>String</td><td>M</td><td>Maximum Payment Expiry Time </td></tr><tr><td>ewallet</td><td>Object</td><td>M</td><td>Depend on Merchant payment method config</td></tr><tr><td><ul><li>enabled</li></ul></td><td>Boolean</td><td>M</td><td>Depend on Merchant payment method config</td></tr><tr><td><ul><li>acceptedChannels</li></ul></td><td>Array of string</td><td>O</td><td><p>If enabled = false, then []</p><p>If enabled = true, then depends on which channel is enabled</p><p><br></p><p>Possible values</p><ul><li>DANA</li><li>SHOPEEPAY</li><li>OVO</li></ul></td></tr><tr><td><ul><li>minimumAmount</li></ul></td><td>Object</td><td>O</td><td><a data-mention href="object/amount-object">amount-object</a>, if amount is below the amount, then payment method is disabled</td></tr><tr><td><ul><li>maximumAmount</li></ul></td><td>Object</td><td>O</td><td><a data-mention href="object/amount-object">amount-object</a>, if amount is above the amount, then payment method is disabled</td></tr><tr><td><ul><li>maximumExpiry</li></ul></td><td>String</td><td>M</td><td>Maximum Payment Expiry Time </td></tr></tbody></table>



# Card Encryption

## Flow

<figure><img src="https://627965603-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FImVr2HJay0snj5ukhBJK%2Fuploads%2FjhI3iNsmjRnvaovFhQFM%2FUntitled%20diagram%20_%20Mermaid%20Chart-2025-07-04-025836.png?alt=media&#x26;token=d63f8c5c-2bae-46cd-96a1-ff334f6370d5" alt=""><figcaption></figcaption></figure>

## Encryption Code&#x20;

{% tabs %}
{% tab title="Encryption UI" %}
Download and simulate the encryption without installing a programming language

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Card Encryption</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }

        .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }

        .form-group {
            margin-bottom: 20px;
        }

        label {
            display: block;
            margin-bottom: 5px;
            color: #555;
            font-weight: bold;
        }

        input[type="text"],
        input[type="number"],
        textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
            box-sizing: border-box;
        }

        input[type="text"]:focus,
        input[type="number"]:focus,
        textarea:focus {
            outline: none;
            border-color: #4CAF50;
        }

        .row {
            display: flex;
            gap: 15px;
        }

        .col {
            flex: 1;
        }

        .btn {
            background-color: #4CAF50;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            width: 100%;
            margin-top: 20px;
        }

        .btn:hover {
            background-color: #45a049;
        }

        .btn:disabled {
            background-color: #ccc;
            cursor: not-allowed;
        }

        .result {
            margin-top: 20px;
            padding: 15px;
            background-color: #f9f9f9;
            border-radius: 5px;
            border: 1px solid #ddd;
        }

        .error {
            color: #d32f2f;
            background-color: #ffebee;
            border-color: #f8bbd9;
        }

        .success {
            color: #388e3c;
            background-color: #e8f5e8;
            border-color: #c8e6c9;
        }

        .public-key-section {
            margin-bottom: 30px;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 5px;
        }

        .card-form {
            border: 1px solid #ddd;
            padding: 20px;
            border-radius: 5px;
            background-color: #fafafa;
        }

        .loading {
            display: none;
            text-align: center;
            margin-top: 10px;
        }

        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Card Encryption</h1>
        
        <!-- Public Key Input Section -->
        <div class="public-key-section">
            <div class="form-group">
                <label for="publicKey">RSA Public Key (Base64 PKIX format):</label>
                <textarea id="publicKey" rows="8" placeholder="Enter your Base64-encoded RSA public key here..."></textarea>
            </div>
        </div>

        <!-- Card Details Form -->
        <div class="card-form">
            <h3>Card Holder Details</h3>
            <form id="cardForm">
                <div class="form-group">
                    <label for="cardNumber">Card Number:</label>
                    <input type="text" id="cardNumber" placeholder="1234 5678 9012 3456" maxlength="19" required>
                </div>

                <div class="form-group">
                    <label for="cardholderName">Cardholder Name:</label>
                    <input type="text" id="cardholderName" placeholder="John Doe" required>
                </div>

                <div class="row">
                    <div class="col">
                        <div class="form-group">
                            <label for="expiryMonth">Expiry Month:</label>
                            <input type="number" id="expiryMonth" min="1" max="12" placeholder="MM" required>
                        </div>
                    </div>
                    <div class="col">
                        <div class="form-group">
                            <label for="expiryYear">Expiry Year:</label>
                            <input type="number" id="expiryYear" min="01" max="99" placeholder="YY" required>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label for="cvv">CVV:</label>
                    <input type="text" id="cvv" placeholder="123" maxlength="4">
                </div>

                <button type="submit" class="btn" id="encryptBtn">Encrypt Card Details</button>
            </form>
        </div>

        <!-- Loading Indicator -->
        <div class="loading" id="loadingIndicator">
            <div class="spinner"></div>
            <p>Encrypting...</p>
        </div>

        <!-- Result Display -->
        <div id="result" class="result" style="display: none;"></div>
    </div>

    <script>
        // Hybrid Encryption Class
        class HybridEncryption {
            /**
             * Encrypts plaintext using hybrid encryption (RSA-OAEP + AES-GCM)
             * @param {string} plaintext - The text to encrypt
             * @param {string} base64PublicKey - Base64-encoded PKIX/SubjectPublicKeyInfo public key
             * @returns {Promise<string>} Base64-encoded encrypted response
             */
            static async encryptHybrid(plaintext, base64PublicKey) {
                try {
                    // Decode the base64 public key
                    const publicKeyBytes = this.base64ToArrayBuffer(base64PublicKey);

                    // Import the public key
                    const publicKey = await crypto.subtle.importKey(
                        'spki', // PKIX/SubjectPublicKeyInfo format
                        publicKeyBytes,
                        { name: 'RSA-OAEP',hash: 'SHA-256' },
                        false,
                        ['encrypt']
                    );

                    // Generate 32-byte AES key
                    const aesKey = await crypto.subtle.generateKey(
                        { name: 'AES-GCM', length: 256 }, true, ['encrypt']
                    );

                    // Generate 12-byte nonce for AES-GCM
                    const nonce = crypto.getRandomValues(new Uint8Array(12));

                    // Encrypt plaintext with AES-GCM
                    const plaintextBuffer = new TextEncoder().encode(plaintext);
                    const ciphertext = await crypto.subtle.encrypt(
                        { name: 'AES-GCM', iv: nonce }, aesKey, plaintextBuffer
                    );

                    // Export AES key as raw bytes
                    const aesKeyBytes = await crypto.subtle.exportKey('raw', aesKey);

                    // Encrypt AES key with RSA-OAEP
                    const encryptedKey = await crypto.subtle.encrypt(
                        { name: 'RSA-OAEP' }, publicKey, aesKeyBytes
                    );

                    // Create response payload
                    const payload = {
                        encryptedKey: this.arrayBufferToBase64(encryptedKey),
                        nonce: this.arrayBufferToBase64(nonce),
                        ciphertext: this.arrayBufferToBase64(ciphertext)
                    };

                    // Convert to JSON and encode as base64
                    const jsonString = JSON.stringify(payload);
                    const jsonBuffer = new TextEncoder().encode(jsonString);

                    return this.arrayBufferToBase64(jsonBuffer);

                } catch (error) {
                    throw new Error(`Encryption failed: ${error.message}`);
                }
            }

            /**
             * Convert base64 string to ArrayBuffer
             * @param {string} base64 - Base64 string
             * @returns {ArrayBuffer} ArrayBuffer
             */
            static base64ToArrayBuffer(base64) {
                const binaryString = atob(base64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                return bytes.buffer;
            }

            /**
             * Convert ArrayBuffer to base64 string
             * @param {ArrayBuffer} buffer - ArrayBuffer
             * @returns {string} Base64 string
             */
            static arrayBufferToBase64(buffer) {
                const bytes = new Uint8Array(buffer);
                let binary = '';
                for (let i = 0; i < bytes.byteLength; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                return btoa(binary);
            }
        }

        // Make it available globally
        window.HybridEncryption = HybridEncryption;

        // UI Event Handlers
        document.addEventListener('DOMContentLoaded', function() {
            const cardForm = document.getElementById('cardForm');
            const encryptBtn = document.getElementById('encryptBtn');
            const loadingIndicator = document.getElementById('loadingIndicator');
            const resultDiv = document.getElementById('result');

            // Format card number input
            document.getElementById('cardNumber').addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
                e.target.value = value;
            });

            // Format CVV input (numbers only)
            document.getElementById('cvv').addEventListener('input', function(e) {
                e.target.value = e.target.value.replace(/\D/g, '');
            });

            // Handle form submission
            cardForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const publicKey = document.getElementById('publicKey').value.trim();
                const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
                const cardholderName = document.getElementById('cardholderName').value.trim();
                const expiryMonth = document.getElementById('expiryMonth').value;
                const expiryYear = document.getElementById('expiryYear').value;
                const cvv = document.getElementById('cvv').value;

                // Validation
                if (!publicKey) {
                    showResult('Please enter a valid RSA public key.', 'error');
                    return;
                }

                if (!cardNumber || cardNumber.length < 13 || cardNumber.length > 19) {
                    showResult('Please enter a valid card number.', 'error');
                    return;
                }

                if (!cardholderName) {
                    showResult('Please enter the cardholder name.', 'error');
                    return;
                }

                if (!expiryMonth || expiryMonth < 1 || expiryMonth > 12) {
                    showResult('Please enter a valid expiry month (1-12).', 'error');
                    return;
                }

                if (!expiryYear || expiryYear < 25) {
                    showResult('Please enter a valid expiry year.', 'error');
                    return;
                }

                // Prepare card data for encryption
                const payload = {
                    card: {
                        number: cardNumber,
                        expiryMonth: expiryMonth.padStart(2, '0'),
                        expiryYear: expiryYear,
                        cvc: cvv,
                        nameOnCard: cardholderName,
                    },
                    deviceInformations: {
                        type: "",
                        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
                        ipAddress: "254.254.254.254",
                        acceptLanguage: "EN",
                        cookieToken: "ZU_0oRV1S3D95Rz06Q1Aa0RTeOlgdXWKeVvZEk7k3LM=",
                        deviceId: "067783c8-29ac-4684-8aa8-71c05ab346df",
                        browserWidth: "1234",
                        browserHeight: "1234",
                        country: "ID"
                    },
                    metadata: {}
                };

                const plaintextData = JSON.stringify(payload);

                // Show loading
                showLoading(true);
                
                try {
                    // Encrypt the card data
                    const encryptedData = await HybridEncryption.encryptHybrid(plaintextData, publicKey);
                    
                    showResult(`
                        <h4>Encryption Successful!</h4>
                        <p><strong>Encrypted Data:</strong></p>
                        <textarea readonly style="width: 100%; height: 100px; font-family: monospace; font-size: 12px;">${encryptedData}</textarea>
                        <p><strong>Original Data:</strong></p>
                        <pre style="background: #f0f0f0; padding: 10px; border-radius: 3px; font-size: 12px;">${JSON.stringify(payload, null, 2)}</pre>
                    `, 'success');
                } catch (error) {
                    showResult(`Encryption failed: ${error.message}`, 'error');
                } finally {
                    showLoading(false);
                }
            });

            function showLoading(show) {
                loadingIndicator.style.display = show ? 'block' : 'none';
                encryptBtn.disabled = show;
            }

            function showResult(message, type) {
                resultDiv.innerHTML = message;
                resultDiv.className = `result ${type}`;
                resultDiv.style.display = 'block';
                resultDiv.scrollIntoView({ behavior: 'smooth' });
            }
        });
    </script>
</body>
</html>
```

{% endtab %}

{% tab title="Typescript / Javascript" %}

```typescript
// Hybrid Encryption Class
class HybridEncryption {
    /**
     * Encrypts plaintext using hybrid encryption (RSA-OAEP + AES-GCM)
     * @param {string} plaintext - The text to encrypt
     * @param {string} base64PublicKey - Base64-encoded PKIX/SubjectPublicKeyInfo public key
     * @returns {Promise<string>} Base64-encoded encrypted response
     */
    static async encryptHybrid(plaintext, base64PublicKey) {
        try {
            // Decode the base64 public key
            const publicKeyBytes = this.base64ToArrayBuffer(base64PublicKey);

            // Import the public key
            const publicKey = await crypto.subtle.importKey(
                "spki", // PKIX/SubjectPublicKeyInfo format
                publicKeyBytes,
                { name: "RSA-OAEP", hash: "SHA-256" },
                false,
                ["encrypt"]
            );

            // Generate 32-byte AES key
            const aesKey = await crypto.subtle.generateKey(
                { name: "AES-GCM", length: 256 },
                true,
                ["encrypt"]
            );

            // Generate 12-byte nonce for AES-GCM
            const nonce = crypto.getRandomValues(new Uint8Array(12));

            // Encrypt plaintext with AES-GCM
            const plaintextBuffer = new TextEncoder().encode(plaintext);
            const ciphertext = await crypto.subtle.encrypt(
                { name: "AES-GCM", iv: nonce },
                aesKey,
                plaintextBuffer
            );

            // Export AES key as raw bytes
            const aesKeyBytes = await crypto.subtle.exportKey("raw", aesKey);

            // Encrypt AES key with RSA-OAEP
            const encryptedKey = await crypto.subtle.encrypt(
                { name: "RSA-OAEP" },
                publicKey,
                aesKeyBytes
            );

            // Create response payload
            const payload = {
                encryptedKey: this.arrayBufferToBase64(encryptedKey),
                nonce: this.arrayBufferToBase64(nonce),
                ciphertext: this.arrayBufferToBase64(ciphertext),
            };

            // Convert to JSON and encode as base64
            const jsonString = JSON.stringify(payload);
            const jsonBuffer = new TextEncoder().encode(jsonString);

            return this.arrayBufferToBase64(jsonBuffer);
        } catch (error) {
            throw new Error(`Encryption failed: ${error.message}`);
        }
    }

    /**
     * Convert base64 string to ArrayBuffer
     * @param {string} base64 - Base64 string
     * @returns {ArrayBuffer} ArrayBuffer
     */
    static base64ToArrayBuffer(base64) {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /**
     * Convert ArrayBuffer to base64 string
     * @param {ArrayBuffer} buffer - ArrayBuffer
     * @returns {string} Base64 string
     */
    static arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
}
```

{% endtab %}

{% tab title="Golang" %}

```go
package main

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
)

type DataEncryption struct {
	EncryptedKey string `json:"encryptedKey"`
	Nonce        string `json:"nonce"`
	Ciphertext   string `json:"ciphertext"`
}

func EncryptDataWithRSAHybrid(plaintext, base64PublicKey string) (string, error) {
	publicKeyBytes, err := base64.StdEncoding.DecodeString(base64PublicKey)
	if err != nil {
		return "", fmt.Errorf("failed to decode base64 public key: %w", err)
	}

	pub, err := x509.ParsePKIXPublicKey(publicKeyBytes)
	if err != nil {
		return "", fmt.Errorf("failed to parse public key: %w", err)
	}
	publicKey, ok := pub.(*rsa.PublicKey)
	if !ok {
		return "", errors.New("not an RSA public key")
	}

	aesKey := make([]byte, 32)
	if _, err := rand.Read(aesKey); err != nil {
		return "", fmt.Errorf("failed to generate aes key: %w", err)
	}

	block, err := aes.NewCipher(aesKey)
	if err != nil {
		return "", fmt.Errorf("failed to create aes cipher: %w", err)
	}

	nonce := make([]byte, 12)
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("failed to generate nonce: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("failed to create aes gcm: %w", err)
	}

	ciphertext := gcm.Seal(nil, nonce, []byte(plaintext), nil)

	encryptedKey, err := rsa.EncryptOAEP(sha256.New(), rand.Reader, publicKey, aesKey, nil)
	if err != nil {
		return "", fmt.Errorf("failed to encrypt aes gcm key: %w", err)
	}

	payload := DataEncryption{
		EncryptedKey: base64.StdEncoding.EncodeToString(encryptedKey),
		Nonce:        base64.StdEncoding.EncodeToString(nonce),
		Ciphertext:   base64.StdEncoding.EncodeToString(ciphertext),
	}
	raw, _ := json.Marshal(payload)

	return base64.StdEncoding.EncodeToString(raw), nil
}

func main() {
	payload := `{
"card": {
	"number": "4440000112200001",
	"expiryMonth": "01",
	"expiryYear": "29",
	"cvc": "123",
	"nameOnCard": "John Doe"
},
"deviceInformations": {
	"type": "",
	"userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
	"ipAddress": "182.253.147.99",
	"acceptLanguage": "EN",
	"cookieToken": "ZU_0oRV1S3D95Rz06Q1Aa0RTeOlgdXWKeVvZEk7k3LM=",
	"deviceId": "067783c8-29ac-4684-8aa8-71c05ab346df",
	"browserWidth": "1234",
	"browserHeight": "1234",
	"country": "ID"
},
"metadata": {}
}`

	publicKey := `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwtAVSVluXY/8QEnXRuAqJ97+ZbAQprE5RtQ8cWlXfznGpTvtbcYEF7tooa4WXnPrDaR0ETcRQlNhP/qYDc3ODRC1w57TLbZL+Wtm4kc3VsWEyM8lklxFV02fiqMaDz+solgeHMOsiwMShTd8FqQ+OnCgVB+R1n1v+bbFZ3EzraIjGzbiffQwyNoCtLO+S3THQRTcDX/KjjANFejjCezGeLZGOUtRFrnhZ4k0x7/xV+9cn3ETuqDuZGJ1Hu7uOswD170N3nMVdrNHv2qn4qkGKjHwngL9sP+xaJpYkzeiMyQxT8VuRe6TdyCpbQGwVIepHTYBGMkfWeXT0LFeh5XUgwIDAQAB`

	encryptedCard, err := EncryptDataWithRSAHybrid(payload, publicKey)
	if err != nil {
		fmt.Println("Encryption Error:", err)
		return
	}
	fmt.Println("Encrypted base64:", encryptedCard)
}
```

{% endtab %}

{% tab title="PHP" %}
{% hint style="info" %}
PHP minimum version 8.0+
{% endhint %}

```php
<?php

require_once 'vendor/autoload.php';

use phpseclib3\Crypt\RSA;
use phpseclib3\Crypt\PublicKeyLoader;

/**
 * Performs hybrid encryption using AES-GCM and RSA-OAEP
 * 
 * @param string $plaintext The text to encrypt
 * @param string $publicKeyBase64 Base64-encoded PKIX format public key
 * @return string Base64-encoded JSON result containing encrypted components
 * @throws Exception If encryption fails or invalid parameters provided
 */
function hybridEncrypt(string $plaintext, string $publicKeyBase64): string
{   
    // Decode and validate the public key
    $publicKeyPem = base64_decode($publicKeyBase64, true);
    if ($publicKeyPem === false) {
        throw new InvalidArgumentException('Invalid Base64 public key');
    }
    
    // Convert DER to PEM format if needed
    if (strpos($publicKeyPem, '-----BEGIN') === false) {
        $publicKeyPem = "-----BEGIN PUBLIC KEY-----\n" . 
                       chunk_split(base64_encode($publicKeyPem), 64, "\n") . 
                       "-----END PUBLIC KEY-----\n";
    }
    
    $publicKey = openssl_pkey_get_public($publicKeyPem);
    if ($publicKey === false) {
        throw new InvalidArgumentException('Invalid public key format');
    }
    
    try {
        // Generate secure random AES key
        $aesKey = random_bytes(32);
        
        // Generate secure random nonce for AES-GCM
        $nonce = random_bytes(12);
        
        // Encrypt plaintext using AES-GCM
        $tag = '';
        $ciphertext = openssl_encrypt(
            $plaintext, 'aes-256-gcm', $aesKey, OPENSSL_RAW_DATA, $nonce, $tag
        );
        if ($ciphertext === false) {
            throw new RuntimeException('AES-GCM encryption failed');
        }
        
        // Combine ciphertext and authentication tag
        $encryptedData = $ciphertext . $tag;
        
        // Encrypt AES key using RSA-OAEP with SHA-256
        $key = PublicKeyLoader::load($publicKeyPem)
            ->withPadding(RSA::ENCRYPTION_OAEP)
            ->withHash('sha256')
            ->withMGFHash('sha256');
        $encryptedAesKey = $key->encrypt($aesKey);
        if ($encryptedAesKey === false) {
            throw new RuntimeException('RSA-OAEP encryption failed');
        }
        
        // Construct JSON object
        $result = [
            'encryptedKey' => base64_encode($encryptedAesKey),
            'nonce' => base64_encode($nonce),
            'ciphertext' => base64_encode($encryptedData)
        ];
        
        // Encode JSON as Base64
        $jsonString = json_encode($result, JSON_THROW_ON_ERROR);
        return base64_encode($jsonString);

    } catch (Exception $e) {
        throw new RuntimeException('Encryption failed: ' . $e->getMessage(), 0, $e);
    }
}
?>
```

Dependency

```php
composer require phpseclib/phpseclib:~3.0
```

{% endtab %}

{% tab title="Java" %}

```java
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import java.security.*;
import java.security.spec.X509EncodedKeySpec;
import java.security.spec.MGF1ParameterSpec;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import javax.crypto.spec.SecretKeySpec;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.OAEPParameterSpec;
import javax.crypto.spec.PSource;
import com.google.gson.Gson;

public class HybridEncryption {

    private static final int AES_KEY_SIZE = 256;
    private static final int GCM_NONCE_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;

    public static String encryptHybrid(String plaintext, String base64PublicKey) throws Exception {
        // Decode the public key
        byte[] decodedKey = Base64.getDecoder().decode(base64PublicKey);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        PublicKey publicKey = keyFactory.generatePublic(new X509EncodedKeySpec(decodedKey));

        // Generate 256-bit AES key
        KeyGenerator keyGen = KeyGenerator.getInstance("AES");
        keyGen.init(AES_KEY_SIZE);
        SecretKey aesKey = keyGen.generateKey();

        // Generate 12-byte nonce (IV)
        byte[] nonce = new byte[GCM_NONCE_LENGTH];
        SecureRandom secureRandom = new SecureRandom();
        secureRandom.nextBytes(nonce);

        // AES-GCM encryption
        Cipher aesCipher = Cipher.getInstance("AES/GCM/NoPadding");
        GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, nonce); // 128-bit tag
        aesCipher.init(Cipher.ENCRYPT_MODE, aesKey, gcmSpec);
        byte[] ciphertext = aesCipher.doFinal(plaintext.getBytes("UTF-8"));

        // Encrypt AES key with RSA-OAEP (SHA-256)
        Cipher rsaCipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
        OAEPParameterSpec oaepParams = new OAEPParameterSpec(
            "SHA-256",
            "MGF1",
            MGF1ParameterSpec.SHA256,
            PSource.PSpecified.DEFAULT
        );
        rsaCipher.init(Cipher.ENCRYPT_MODE, publicKey, oaepParams);
        byte[] encryptedKey = rsaCipher.doFinal(aesKey.getEncoded());

        // Build the payload
        Map<String, String> payload = new HashMap<>();
        payload.put("encryptedKey", Base64.getEncoder().encodeToString(encryptedKey));
        payload.put("nonce", Base64.getEncoder().encodeToString(nonce));
        payload.put("ciphertext", Base64.getEncoder().encodeToString(ciphertext));

        // Convert to JSON
        Gson gson = new Gson();
        String json = gson.toJson(payload);

        // Return Base64-encoded JSON string
        return Base64.getEncoder().encodeToString(json.getBytes("UTF-8"));
    }
}
```

Maven Dependency

```java
<dependency>
  <groupId>com.google.code.gson</groupId>
  <artifactId>gson</artifactId>
  <version>2.11.0</version>
</dependency>
```

{% endtab %}

{% tab title="Python" %}

```python
import os, json, base64

from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def encrypt_hybrid(plaintext: str, base64_public_key: str) -> str:
    # Load RSA public key from base64 (PKIX format)
    public_key_bytes = base64.b64decode(base64_public_key)
    public_key = serialization.load_der_public_key(public_key_bytes)

    # Generate AES key (256-bit) and nonce (12 bytes)
    aes_key = os.urandom(32)  # 256 bits
    nonce = os.urandom(12)    # 96 bits

    # Encrypt plaintext with AES-GCM
    aesgcm = AESGCM(aes_key)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode(), None)

    # Encrypt AES key with RSA-OAEP using SHA-256
    encrypted_key = public_key.encrypt(
        aes_key,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )

    # Create JSON object
    payload = {
        "encryptedKey": base64.b64encode(encrypted_key).decode(),
        "nonce": base64.b64encode(nonce).decode(),
        "ciphertext": base64.b64encode(ciphertext).decode()
    }

    # Encode the JSON object as base64 string
    json_bytes = json.dumps(payload).encode()

    return base64.b64encode(json_bytes).decode()
```

Dependency&#x20;

```python
pip install cryptography
```

{% endtab %}
{% endtabs %}


# Payment Session

# Create Payment Session

## Method and URL

<mark style="color:green;">`POST`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v2/payments

## Request

### **Payment UI**

<details>

<summary>Pivot's Payment UI </summary>

```json
{
  "clientReferenceId": "1751612565",
  "amount": {
    "value": 10000,
    "currency": "IDR"
  },
  "paymentType": "SINGLE",
  "mode": "REDIRECT",
  "bypassStatusPage": false,
  "redirectUrl": {
    "successReturnUrl": "https://merchant.com/success",
    "failureReturnUrl": "https://merchant.com/failure",
    "expirationReturnUrl": "https://merchant.com/expiration"
  },
  "customer": {
    "givenName": "Reforza Jordan",
    "surname": "Geotama",
    "email": "reforza@pivot-payment.com",
    "phoneNumber": {
      "countryCode": "+62",
      "number": "89699990001"
    },
    "refundPreference": {
      "method": "AUTO",
      "transferDestination": {
        "channelCode": "014",
        "channelInformation": {
          "accountNumber": "17677665415",
          "accountName": "Reforza Jordan Geotama"
        }
      }
    }
  },
  "orderInformation": {
    "productDetails": [
      {
        "type": "PHYSICAL",
        "category": "FASHION",
        "subCategory": "FASHION WANITA",
        "name": "Dress Kasual Warna Putih",
        "description": "Ukuran M",
        "quantity": 1,
        "price": {
          "value": 100000,
          "currency": "IDR"
        }
      }
    ],
    "billingInfo": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990001"
      },
      "addressLine1": "Biomedical Building Lantai 3",
      "addressLine2": "Digital hub, BSD City",
      "city": "Tangerang Regency",
      "provinceState": "Banten",
      "country": "ID",
      "postalCode": "15331"
    },
    "shippingInfo": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990001"
      },
      "addressLine1": "Biomedical Building Lantai 3",
      "addressLine2": "Digital hub, BSD City",
      "city": "Tangerang Regency",
      "provinceState": "Banten",
      "country": "ID",
      "postalCode": "15331",
      "method": "REGULAR",
      "shippingFee": {
        "value": 100000,
        "currency": "IDR"
      }
    }
  },
  "autoConfirm": false,
  "statementDescriptor": "Reforza Pivot",
  "expiryAt": "2025-12-30T23:59:00Z",
  "metadata": {
    "invoiceNo": "INV001"
  }
}
```

</details>

### **Card Payment Method**

{% hint style="info" %}
If you plan to embed our Payment Redirection page using an iframe, please submit your website domain to us for whitelisting
{% endhint %}

<details>

<summary>Pivot's Payment Redirection</summary>

```json
{
  "clientReferenceId": "1751610085",
  "amount": {
    "value": 10000,
    "currency": "IDR"
  },
  "paymentType": "SINGLE",
  "paymentMethod": {
    "type": "CARD"
  },
  "paymentMethodOptions": {
    "card": {
      "captureMethod": "automatic", // "MANUAL" for Capture later
      "threeDsMethod": "CHALLENGE" // "NEVER" for Non 3DS
    }
  },
  "mode": "REDIRECT",
  "bypassStatusPage": false,
  "redirectUrl": {
    "successReturnUrl": "https://merchant.com/success",
    "failureReturnUrl": "https://merchant.com/failure",
    "expirationReturnUrl": "https://merchant.com/expiration"
  },
  "customer": {
    "givenName": "Reforza Jordan",
    "surname": "Geotama",
    "email": "reforza@pivot-payment.com",
    "phoneNumber": {
      "countryCode": "+62",
      "number": "89699990001"
    },
    "refundPreference": {
      "method": "AUTO",
      "transferDestination": {
        "channelCode": "014",
        "channelInformation": {
          "accountNumber": "17677665415",
          "accountName": "Reforza Jordan Geotama"
        }
      }
    }
  },
  "orderInformation": { 
    "productDetails": [
      {
        "type": "PHYSICAL",
        "category": "FASHION",
        "subCategory": "FASHION WANITA",
        "name": "Dress Kasual Warna Putih",
        "description": "Ukuran M",
        "quantity": 1,
        "price": {
          "value": 100000,
          "currency": "IDR"
        }
      }
    ],
    "billingInfo": { // Mandatory for Foreign Card with AVS
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990001"
      },
      "addressLine1": "Biomedical Building Lantai 3",
      "addressLine2": "Digital hub, BSD City",
      "city": "Tangerang Regency",
      "provinceState": "Banten",
      "country": "ID",
      "postalCode": "15331"
    },
    "shippingInfo": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990001"
      },
      "addressLine1": "Biomedical Building Lantai 3",
      "addressLine2": "Digital hub, BSD City",
      "city": "Tangerang Regency",
      "provinceState": "Banten",
      "country": "ID",
      "postalCode": "15331",
      "method": "REGULAR",
      "shippingFee": {
        "value": 100000,
        "currency": "IDR"
      }
    }
  },
  "autoConfirm": true,
  "statementDescriptor": "Reforza Pivot",
  "expirationMode": "STRICT",
  "expiryAt": "2025-12-30T23:59:00Z",
  "metadata": {
    "invoiceNo": "INV001"
  }
}
```

</details>

<details>

<summary>Merchant's customized Payment Page — Card Encryption</summary>

How to build reference: [Card Customized Payment Page (Encryption)](https://app.gitbook.com/s/bRczl3VT35wkmuP4KTzZ/accept-payment/build-card-payment-use-case/card-customized-payment-page-encryption "mention")

```json
{
  "clientReferenceId": "1751620870",
  "amount": {
    "value": 10000,
    "currency": "IDR"
  },
  "paymentType": "SINGLE",
  "paymentMethod": {
    "type": "CARD"
  },
  "mode": "API",
  "redirectUrl": {
    "successReturnUrl": "https://merchant.com/success",
    "failureReturnUrl": "https://merchant.com/failure",
    "expirationReturnUrl": "https://merchant.com/expiration"
  },
  "customer": {
    "givenName": "Reforza Jordan",
    "surname": "Geotama",
    "email": "reforza@pivot-payment.com",
    "phoneNumber": {
      "countryCode": "+62",
      "number": "89699990001"
    },
    "refundPreference": {
      "method": "AUTO",
      "transferDestination": {
        "channelCode": "014",
        "channelInformation": {
          "accountNumber": "17677665415",
          "accountName": "Reforza Jordan Geotama"
        }
      }
    }
  },
  "orderInformation": { 
    "productDetails": [
      {
        "type": "PHYSICAL",
        "category": "FASHION",
        "subCategory": "FASHION WANITA",
        "name": "Dress Kasual Warna Putih",
        "description": "Ukuran M",
        "quantity": 1,
        "price": {
          "value": 100000,
          "currency": "IDR"
        }
      }
    ],
    "billingInfo": { // Mandatory for Foreign Card with AVS
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990001"
      },
      "addressLine1": "Biomedical Building Lantai 3",
      "addressLine2": "Digital hub, BSD City",
      "city": "Tangerang Regency",
      "provinceState": "Banten",
      "country": "ID",
      "postalCode": "15331"
    },
    "shippingInfo": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990001"
      },
      "addressLine1": "Biomedical Building Lantai 3",
      "addressLine2": "Digital hub, BSD City",
      "city": "Tangerang Regency",
      "provinceState": "Banten",
      "country": "ID",
      "postalCode": "15331",
      "method": "REGULAR",
      "shippingFee": {
        "value": 100000,
        "currency": "IDR"
      }
    }
  },
  "autoConfirm": false,
  "statementDescriptor": "Reforza Pivot",
  "expirationMode": "STRICT",
  "expiryAt": "2025-12-30T23:59:00Z",
  "metadata": {
    "invoiceNo": "INV001"
  }
}
```

</details>

<details>

<summary>Save Card with Pivot's Payment Redirection (Card Tokenization)</summary>

**Initiation**

Enable "Save Payment Information Detail" option for your customers when the Charge is <mark style="color:orange;">`SUCCESS`</mark> We will save your Customer's Payment Information Detail in Token format under your Customer Object

How to build reference: [Pay and Save Card (Tokenization)](https://app.gitbook.com/s/bRczl3VT35wkmuP4KTzZ/accept-payment/build-card-payment-use-case/pay-and-save-card-tokenization "mention")

```json
{
  "clientReferenceId": "1751610085",
  "amount": {
    "value": 10000,
    "currency": "IDR"
  },
  "paymentType": "SINGLE",
  "paymentMethod": {
    "type": "CARD"
  },
  "paymentMethodOptions": {
    "card": {
      "captureMethod": "automatic", // "MANUAL" for Capture later
      "threeDsMethod": "CHALLENGE" // "NEVER" for Non 3DS
    }
  },
  "saveForFuture": true,
  "showSavedPayment": null,
  "mode": "REDIRECT",
  "bypassStatusPage": false,
  "redirectUrl": {
    "successReturnUrl": "https://merchant.com/success",
    "failureReturnUrl": "https://merchant.com/failure",
    "expirationReturnUrl": "https://merchant.com/expiration"
  },
  "customer": {
    "givenName": "Reforza Jordan",
    "surname": "Geotama",
    "email": "reforza@pivot-payment.com",
    "phoneNumber": {
      "countryCode": "+62",
      "number": "89699990001"
    },
    "refundPreference": {
      "method": "AUTO",
      "transferDestination": {
        "channelCode": "014",
        "channelInformation": {
          "accountNumber": "17677665415",
          "accountName": "Reforza Jordan Geotama"
        }
      }
    }
  },
  "orderInformation": { 
    "productDetails": [
      {
        "type": "PHYSICAL",
        "category": "FASHION",
        "subCategory": "FASHION WANITA",
        "name": "Dress Kasual Warna Putih",
        "description": "Ukuran M",
        "quantity": 1,
        "price": {
          "value": 100000,
          "currency": "IDR"
        }
      }
    ],
    "billingInfo": { // Mandatory for Foreign Card with AVS
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990001"
      },
      "addressLine1": "Biomedical Building Lantai 3",
      "addressLine2": "Digital hub, BSD City",
      "city": "Tangerang Regency",
      "provinceState": "Banten",
      "country": "ID",
      "postalCode": "15331"
    },
    "shippingInfo": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990001"
      },
      "addressLine1": "Biomedical Building Lantai 3",
      "addressLine2": "Digital hub, BSD City",
      "city": "Tangerang Regency",
      "provinceState": "Banten",
      "country": "ID",
      "postalCode": "15331",
      "method": "REGULAR",
      "shippingFee": {
        "value": 100000,
        "currency": "IDR"
      }
    }
  },
  "autoConfirm": true,
  "statementDescriptor": "Reforza Pivot",
  "expirationMode": "STRICT",
  "expiryAt": "2025-12-30T23:59:00Z",
  "metadata": {
    "invoiceNo": "INV001"
  }
}
```

**Use Tokenized Card**

Reuse your customers' saved Payment Information details so that they can check out faster

{% hint style="info" %}
Stored Payment Method links to your <mark style="color:orange;">`customerId`</mark>
{% endhint %}

```json
{
  "clientReferenceId": "1751610085",
  "amount": {
    "value": 10000,
    "currency": "IDR"
  },
  "paymentType": "SINGLE",
  "paymentMethod": {
    "type": "CARD"
  },
  "paymentMethodOptions": {
    "card": {
      "captureMethod": "automatic", // "MANUAL" for Capture later
      "threeDsMethod": "CHALLENGE" // "NEVER" for Non 3DS
    }
  },
  "saveForFuture": true,
  "showSavedPayment": true,
  "mode": "REDIRECT",
  "bypassStatusPage": false,
  "redirectUrl": {
    "successReturnUrl": "https://merchant.com/success",
    "failureReturnUrl": "https://merchant.com/failure",
    "expirationReturnUrl": "https://merchant.com/expiration"
  },
  "customerId": "01975d90-bb55-76f6-b423-691c7868e85d",
  "orderInformation": {
    "productDetails": [
      {
        "type": "PHYSICAL",
        "category": "FASHION",
        "subCategory": "FASHION WANITA",
        "name": "Dress Kasual Warna Putih",
        "description": "Ukuran M",
        "quantity": 1,
        "price": {
          "value": 100000,
          "currency": "IDR"
        }
      }
    ],
    "billingInfo": { // Mandatory for Foreign Card with AVS
      "givenName": "Reforza Jordan",
      "sureName": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990001"
      },
      "addressLine1": "Biomedical Building Lantai 3",
      "addressLine2": "Digital hub, BSD City",
      "city": "Tangerang Regency",
      "provinceState": "Banten",
      "country": "ID",
      "postalCode": "15331"
    },
    "shippingInfo": {
      "givenName": "Reforza Jordan",
      "sureName": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990001"
      },
      "addressLine1": "Biomedical Building Lantai 3",
      "addressLine2": "Digital hub, BSD City",
      "city": "Tangerang Regency",
      "provinceState": "Banten",
      "country": "ID",
      "postalCode": "15331",
      "method": "REGULAR",
      "shippingFee": {
        "value": 100000,
        "currency": "IDR"
      }
    }
  },
  "autoConfirm": true,
  "statementDescriptor": "Reforza Pivot",
  "expirationMode": "STRICT",
  "expiryAt": "2025-12-30T23:59:00Z",
  "metadata": {
    "invoiceNo": "INV001"
  }
}
```

</details>

<details>

<summary>Save Card with Merchant's customized Payment Page (Card Tokenization)</summary>

**Initiation**

Enable "Save Payment Information Detail" option for your customers when the Charge is <mark style="color:orange;">`SUCCESS`</mark> We will save your Customer's Payment Information Detail in Token format under your Customer Object

How to build reference: [Pay and Save Card (Tokenization)](https://app.gitbook.com/s/bRczl3VT35wkmuP4KTzZ/accept-payment/build-card-payment-use-case/pay-and-save-card-tokenization "mention")

```json
{
  "clientReferenceId": "1751620870",
  "amount": {
    "value": 10000,
    "currency": "IDR"
  },
  "paymentType": "SINGLE",
  "paymentMethod": {
    "type": "CARD"
  },
  "saveForFutureUse": true,
  "mode": "API",
  "redirectUrl": {
    "successReturnUrl": "https://merchant.com/success",
    "failureReturnUrl": "https://merchant.com/failure",
    "expirationReturnUrl": "https://merchant.com/expiration"
  },
  "customer": {
    "givenName": "Reforza Jordan",
    "surname": "Geotama",
    "email": "reforza@pivot-payment.com",
    "phoneNumber": {
      "countryCode": "+62",
      "number": "89699990001"
    },
    "refundPreference": {
      "method": "AUTO",
      "transferDestination": {
        "channelCode": "014",
        "channelInformation": {
          "accountNumber": "17677665415",
          "accountName": "Reforza Jordan Geotama"
        }
      }
    }
  },
  "orderInformation": { 
    "productDetails": [
      {
        "type": "PHYSICAL",
        "category": "FASHION",
        "subCategory": "FASHION WANITA",
        "name": "Dress Kasual Warna Putih",
        "description": "Ukuran M",
        "quantity": 1,
        "price": {
          "value": 100000,
          "currency": "IDR"
        }
      }
    ],
    "billingInfo": { // Mandatory for Foreign Card with AVS
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990001"
      },
      "addressLine1": "Biomedical Building Lantai 3",
      "addressLine2": "Digital hub, BSD City",
      "city": "Tangerang Regency",
      "provinceState": "Banten",
      "country": "ID",
      "postalCode": "15331"
    },
    "shippingInfo": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990001"
      },
      "addressLine1": "Biomedical Building Lantai 3",
      "addressLine2": "Digital hub, BSD City",
      "city": "Tangerang Regency",
      "provinceState": "Banten",
      "country": "ID",
      "postalCode": "15331",
      "method": "REGULAR",
      "shippingFee": {
        "value": 100000,
        "currency": "IDR"
      }
    }
  },
  "autoConfirm": false,
  "statementDescriptor": "Reforza Pivot",
  "expirationMode": "STRICT",
  "expiryAt": "2025-12-30T23:59:00Z",
  "metadata": {
    "invoiceNo": "INV001"
  }
}
```

**Use Tokenized Card**

Reuse your customers' saved Payment Information details so that they can check out faster

{% hint style="info" %}
Stored Payment Method links to your <mark style="color:orange;">`customerId`</mark> &#x20;
{% endhint %}

```json
{
  "clientReferenceId": "1751620870",
  "amount": {
    "value": 10000,
    "currency": "IDR"
  },
  "paymentType": "SINGLE",
  "paymentMethod": {
    "type": "CARD",
    "card": {
      "token": "020027de-134e-45ed-8f0d-7ae0506a7133",
      "cvc": "123"
    }
  },
  "paymentMethodOptions": {
    "card": {
      "captureMethod": "automatic", // "MANUAL" for Capture later
      "threeDsMethod": "CHALLENGE" // "NEVER" for Non 3DS
    }
  },
  "saveForFutureUse": true,
  "mode": "API",
  "customerId": "01975d90-bb55-76f6-b423-691c7868e85d",
  "orderInformation": { 
    "productDetails": [
      {
        "type": "PHYSICAL",
        "category": "FASHION",
        "subCategory": "FASHION WANITA",
        "name": "Dress Kasual Warna Putih",
        "description": "Ukuran M",
        "quantity": 1,
        "price": {
          "value": 100000,
          "currency": "IDR"
        }
      }
    ],
    "billingInfo": { // Mandatory for Foreign Card with AVS
      "givenName": "Reforza Jordan",
      "sureName": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990001"
      },
      "addressLine1": "Biomedical Building Lantai 3",
      "addressLine2": "Digital hub, BSD City",
      "city": "Tangerang Regency",
      "provinceState": "Banten",
      "country": "ID",
      "postalCode": "15331"
    },
    "shippingInfo": {
      "givenName": "Reforza Jordan",
      "sureName": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990001"
      },
      "addressLine1": "Biomedical Building Lantai 3",
      "addressLine2": "Digital hub, BSD City",
      "city": "Tangerang Regency",
      "provinceState": "Banten",
      "country": "ID",
      "postalCode": "15331",
      "method": "REGULAR",
      "shippingFee": {
        "value": 100000,
        "currency": "IDR"
      }
    }
  },
  "autoConfirm": true,
  "statementDescriptor": "Reforza Pivot",
  "expirationMode": "STRICT",
  "expiryAt": "2025-12-30T23:59:00Z",
  "metadata": {
    "invoiceNo": "INV001"
  }
}
```

</details>

### **E-Wallet Payment Method**

{% hint style="info" %} <mark style="color:orange;">`channel`</mark> = DANA doesn't support to embed page using an iframe
{% endhint %}

<details>

<summary>Pivot's Payment Redirection</summary>

```json
{
  "clientReferenceId": "1751610085",
  "amount": {
    "value": 10000,
    "currency": "IDR"
  },
  "paymentType": "SINGLE",
  "paymentMethod": {
    "type": "EWALLET"
  },
  "paymentMethodOptions": {
    "ewallet": {
      "channel": "SHOPEEPAY"
    }
  },
  "mode": "REDIRECT",
  "bypassStatusPage": false,
  "redirectUrl": {
    "successReturnUrl": "https://merchant.com/success",
    "failureReturnUrl": "https://merchant.com/failure",
    "expirationReturnUrl": "https://merchant.com/expiration"
  },
  "customer": {
    "givenName": "Reforza Jordan",
    "surname": "Geotama",
    "email": "reforza@pivot-payment.com",
    "phoneNumber": {
      "countryCode": "+62",
      "number": "89699990001"
    },
    "refundPreference": {
      "method": "AUTO",
      "transferDestination": {
        "channelCode": "014",
        "channelInformation": {
          "accountNumber": "17677665415",
          "accountName": "Reforza Jordan Geotama"
        }
      }
    }
  },
  "orderInformation": {
    "productDetails": [
      {
        "type": "PHYSICAL",
        "category": "FASHION",
        "subCategory": "FASHION WANITA",
        "name": "Dress Kasual Warna Putih",
        "description": "Ukuran M",
        "quantity": 1,
        "price": {
          "value": 100000,
          "currency": "IDR"
        }
      }
    ],
    "billingInfo": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990001"
      },
      "addressLine1": "Biomedical Building Lantai 3",
      "addressLine2": "Digital hub, BSD City",
      "city": "Tangerang Regency",
      "provinceState": "Banten",
      "country": "ID",
      "postalCode": "15331"
    },
    "shippingInfo": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990001"
      },
      "addressLine1": "Biomedical Building Lantai 3",
      "addressLine2": "Digital hub, BSD City",
      "city": "Tangerang Regency",
      "provinceState": "Banten",
      "country": "ID",
      "postalCode": "15331",
      "method": "REGULAR",
      "shippingFee": {
        "value": 100000,
        "currency": "IDR"
      }
    }
  },
  "autoConfirm": true,
  "statementDescriptor": "Reforza Pivot",
  "expiryAt": "2025-12-30T23:59:00Z",
  "metadata": {
    "invoiceNo": "INV001"
  }
}
```

</details>

<details>

<summary>Merchant's customized Payment Page</summary>

```json
{
  "clientReferenceId": "1751610085",
  "amount": {
    "value": 10000,
    "currency": "IDR"
  },
  "paymentType": "SINGLE",
  "paymentMethod": {
    "type": "EWALLET"
  },
  "paymentMethodOptions": {
    "ewallet": {
      "channel": "SHOPEEPAY"
    }
  },
  "mode": "API",
  "redirectUrl": {
    "successReturnUrl": "https://merchant.com/success",
    "failureReturnUrl": "https://merchant.com/failure",
    "expirationReturnUrl": "https://merchant.com/expiration"
  },
  "customer": {
    "givenName": "Reforza Jordan",
    "surname": "Geotama",
    "email": "reforza@pivot-payment.com",
    "phoneNumber": {
      "countryCode": "+62",
      "number": "89699990001"
    },
    "refundPreference": {
      "method": "AUTO",
      "transferDestination": {
        "channelCode": "014",
        "channelInformation": {
          "accountNumber": "17677665415",
          "accountName": "Reforza Jordan Geotama"
        }
      }
    }
  },
  "orderInformation": {
    "productDetails": [
      {
        "type": "PHYSICAL",
        "category": "FASHION",
        "subCategory": "FASHION WANITA",
        "name": "Dress Kasual Warna Putih",
        "description": "Ukuran M",
        "quantity": 1,
        "price": {
          "value": 100000,
          "currency": "IDR"
        }
      }
    ],
    "billingInfo": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990001"
      },
      "addressLine1": "Biomedical Building Lantai 3",
      "addressLine2": "Digital hub, BSD City",
      "city": "Tangerang Regency",
      "provinceState": "Banten",
      "country": "ID",
      "postalCode": "15331"
    },
    "shippingInfo": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990001"
      },
      "addressLine1": "Biomedical Building Lantai 3",
      "addressLine2": "Digital hub, BSD City",
      "city": "Tangerang Regency",
      "provinceState": "Banten",
      "country": "ID",
      "postalCode": "15331",
      "method": "REGULAR",
      "shippingFee": {
        "value": 100000,
        "currency": "IDR"
      }
    }
  },
  "autoConfirm": true,
  "statementDescriptor": "Reforza Pivot",
  "expiryAt": "2025-12-30T23:59:00Z",
  "metadata": {
    "invoiceNo": "INV001"
  }
}
```

</details>

### Virtual Account Payment Method

<details>

<summary>Pivot's Payment Redirection</summary>

```json
{
  "clientReferenceId": "1751610085",
  "amount": {
    "value": 10000,
    "currency": "IDR"
  },
  "paymentType": "SINGLE",
  "paymentMethod": {
    "type": "VIRTUAL_ACCOUNT"
  },
  "paymentMethodOptions": {
    "virtualAccount": {
      "channel": "PERMATA",
      "virtualAccountName": "Reforza Pivot"
    }
  },
  "mode": "REDIRECT",
  "bypassStatusPage": false,
  "redirectUrl": {
    "successReturnUrl": "https://merchant.com/success",
    "failureReturnUrl": "https://merchant.com/failure",
    "expirationReturnUrl": "https://merchant.com/expiration"
  },
  "customer": {
    "givenName": "Reforza Jordan",
    "surname": "Geotama",
    "email": "reforza@pivot-payment.com",
    "phoneNumber": {
      "countryCode": "+62",
      "number": "89699990001"
    },
    "refundPreference": {
      "method": "AUTO",
      "transferDestination": {
        "channelCode": "014",
        "channelInformation": {
          "accountNumber": "17677665415",
          "accountName": "Reforza Jordan Geotama"
        }
      }
    }
  },
  "orderInformation": {
    "productDetails": [
      {
        "type": "PHYSICAL",
        "category": "FASHION",
        "subCategory": "FASHION WANITA",
        "name": "Dress Kasual Warna Putih",
        "description": "Ukuran M",
        "quantity": 1,
        "price": {
          "value": 100000,
          "currency": "IDR"
        }
      }
    ],
    "billingInfo": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990001"
      },
      "addressLine1": "Biomedical Building Lantai 3",
      "addressLine2": "Digital hub, BSD City",
      "city": "Tangerang Regency",
      "provinceState": "Banten",
      "country": "ID",
      "postalCode": "15331"
    },
    "shippingInfo": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990001"
      },
      "addressLine1": "Biomedical Building Lantai 3",
      "addressLine2": "Digital hub, BSD City",
      "city": "Tangerang Regency",
      "provinceState": "Banten",
      "country": "ID",
      "postalCode": "15331",
      "method": "REGULAR",
      "shippingFee": {
        "value": 100000,
        "currency": "IDR"
      }
    }
  },
  "autoConfirm": true,
  "statementDescriptor": "Reforza Pivot",
  "expiryAt": "2025-12-30T23:59:00Z",
  "metadata": {
    "invoiceNo": "INV001"
  }
}
```

</details>

<details>

<summary>Merchant's customized Payment Page</summary>

```json
{
  "clientReferenceId": "1751610085",
  "amount": {
    "value": 10000,
    "currency": "IDR"
  },
  "paymentType": "SINGLE",
  "paymentMethod": {
    "type": "VIRTUAL_ACCOUNT"
  },
  "paymentMethodOptions": {
    "virtualAccount": {
      "channel": "PERMATA",
      "virtualAccountName": "Reforza Pivot"
    }
  },
  "mode": "API",
  "redirectUrl": {
    "successReturnUrl": "https://merchant.com/success",
    "failureReturnUrl": "https://merchant.com/failure",
    "expirationReturnUrl": "https://merchant.com/expiration"
  },
  "customer": {
    "givenName": "Reforza Jordan",
    "surname": "Geotama",
    "email": "reforza@pivot-payment.com",
    "phoneNumber": {
      "countryCode": "+62",
      "number": "89699990001"
    },
    "refundPreference": {
      "method": "AUTO",
      "transferDestination": {
        "channelCode": "014",
        "channelInformation": {
          "accountNumber": "17677665415",
          "accountName": "Reforza Jordan Geotama"
        }
      }
    }
  },
  "orderInformation": {
    "productDetails": [
      {
        "type": "PHYSICAL",
        "category": "FASHION",
        "subCategory": "FASHION WANITA",
        "name": "Dress Kasual Warna Putih",
        "description": "Ukuran M",
        "quantity": 1,
        "price": {
          "value": 100000,
          "currency": "IDR"
        }
      }
    ],
    "billingInfo": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990001"
      },
      "addressLine1": "Biomedical Building Lantai 3",
      "addressLine2": "Digital hub, BSD City",
      "city": "Tangerang Regency",
      "provinceState": "Banten",
      "country": "ID",
      "postalCode": "15331"
    },
    "shippingInfo": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990001"
      },
      "addressLine1": "Biomedical Building Lantai 3",
      "addressLine2": "Digital hub, BSD City",
      "city": "Tangerang Regency",
      "provinceState": "Banten",
      "country": "ID",
      "postalCode": "15331",
      "method": "REGULAR",
      "shippingFee": {
        "value": 100000,
        "currency": "IDR"
      }
    }
  },
  "autoConfirm": true,
  "statementDescriptor": "Reforza Pivot",
  "expiryAt": "2025-12-30T23:59:00Z",
  "metadata": {
    "invoiceNo": "INV001"
  }
}
```

</details>

<details>

<summary>Virtual Account Static with Merchant's customized Payment Page</summary>

How to build reference: [Build Static Payment](https://app.gitbook.com/s/bRczl3VT35wkmuP4KTzZ/accept-payment/build-static-payment "mention")

{% hint style="info" %}
Make sure <mark style="color:orange;">`virtualAccountNumber`</mark> within our default Static Range or your Configuration range:

<https://dashboard.pivot-payment.com/static-payment/virtual-account/range>
{% endhint %}

```json
{
  "clientReferenceId": "1751610085",
  "amount": { // Mandatory if VA is Closed Static
    "value": 10000,
    "currency": "IDR"
  },
  "paymentType": "MULTIPLE",
  "paymentMethod": {
    "type": "VIRTUAL_ACCOUNT"
  },
  "paymentMethodOptions": {
    "virtualAccount": {
      "channel": "PERMATA",
      "virtualAccountName": "Reforza Pivot",
      "virtualAccountNumber": "00000001"
    }
  },
  "mode": "API",
  "redirectUrl": {
    "successReturnUrl": "https://merchant.com/success",
    "failureReturnUrl": "https://merchant.com/failure",
    "expirationReturnUrl": "https://merchant.com/expiration"
  },
  "customer": {
    "givenName": "Reforza Jordan",
    "surname": "Geotama",
    "email": "reforza@pivot-payment.com",
    "phoneNumber": {
      "countryCode": "+62",
      "number": "89699990001"
    },
    "refundPreference": {
      "method": "AUTO",
      "transferDestination": {
        "channelCode": "014",
        "channelInformation": {
          "accountNumber": "17677665415",
          "accountName": "Reforza Jordan Geotama"
        }
      }
    }
  },
  "orderInformation": {
    "productDetails": [
      {
        "type": "PHYSICAL",
        "category": "FASHION",
        "subCategory": "FASHION WANITA",
        "name": "Dress Kasual Warna Putih",
        "description": "Ukuran M",
        "quantity": 1,
        "price": {
          "value": 100000,
          "currency": "IDR"
        }
      }
    ],
    "billingInfo": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990001"
      },
      "addressLine1": "Biomedical Building Lantai 3",
      "addressLine2": "Digital hub, BSD City",
      "city": "Tangerang Regency",
      "provinceState": "Banten",
      "country": "ID",
      "postalCode": "15331"
    },
    "shippingInfo": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990001"
      },
      "addressLine1": "Biomedical Building Lantai 3",
      "addressLine2": "Digital hub, BSD City",
      "city": "Tangerang Regency",
      "provinceState": "Banten",
      "country": "ID",
      "postalCode": "15331",
      "method": "REGULAR",
      "shippingFee": {
        "value": 100000,
        "currency": "IDR"
      }
    }
  },
  "autoConfirm": true,
  "statementDescriptor": "Reforza Pivot",
  "metadata": {
    "invoiceNo": "INV001"
  }
}
```

</details>

### **QR Payment Method**

<details>

<summary>Pivot's Payment Redirection</summary>

```json
{
  "clientReferenceId": "1751610085",
  "amount": {
    "value": 10000,
    "currency": "IDR"
  },
  "paymentType": "SINGLE",
  "paymentMethod": {
    "type": "QR"
  },
  "paymentMethodOptions": {
    "qr": {
      "expiryAt": "2025-12-30T23:59:00Z"
    }
  },
  "mode": "REDIRECT",
  "bypassStatusPage": false,
  "redirectUrl": {
    "successReturnUrl": "https://merchant.com/success",
    "failureReturnUrl": "https://merchant.com/failure",
    "expirationReturnUrl": "https://merchant.com/expiration"
  },
  "customer": {
    "givenName": "Reforza Jordan",
    "surname": "Geotama",
    "email": "reforza@pivot-payment.com",
    "phoneNumber": {
      "countryCode": "+62",
      "number": "89699990001"
    },
    "refundPreference": {
      "method": "AUTO",
      "transferDestination": {
        "channelCode": "014",
        "channelInformation": {
          "accountNumber": "17677665415",
          "accountName": "Reforza Jordan Geotama"
        }
      }
    }
  },
  "orderInformation": {
    "productDetails": [
      {
        "type": "PHYSICAL",
        "category": "FASHION",
        "subCategory": "FASHION WANITA",
        "name": "Dress Kasual Warna Putih",
        "description": "Ukuran M",
        "quantity": 1,
        "price": {
          "value": 100000,
          "currency": "IDR"
        }
      }
    ],
    "billingInfo": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990001"
      },
      "addressLine1": "Biomedical Building Lantai 3",
      "addressLine2": "Digital hub, BSD City",
      "city": "Tangerang Regency",
      "provinceState": "Banten",
      "country": "ID",
      "postalCode": "15331"
    },
    "shippingInfo": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990001"
      },
      "addressLine1": "Biomedical Building Lantai 3",
      "addressLine2": "Digital hub, BSD City",
      "city": "Tangerang Regency",
      "provinceState": "Banten",
      "country": "ID",
      "postalCode": "15331",
      "method": "REGULAR",
      "shippingFee": {
        "value": 100000,
        "currency": "IDR"
      }
    }
  },
  "autoConfirm": true,
  "statementDescriptor": "Reforza Pivot",
  "expiryAt": "2025-12-30T23:59:00Z",
  "metadata": {
    "invoiceNo": "INV001"
  }
}
```

</details>

<details>

<summary>Merchant's customized Payment Page</summary>

```json
{
  "clientReferenceId": "1751610085",
  "amount": {
    "value": 10000,
    "currency": "IDR"
  },
  "paymentType": "SINGLE",
  "paymentMethod": {
    "type": "QR"
  },
  "paymentMethodOptions": {
    "qr": {
      "expiryAt": "2025-12-30T23:59:00Z"
    }
  },
  "mode": "API",
  "redirectUrl": {
    "successReturnUrl": "https://merchant.com/success",
    "failureReturnUrl": "https://merchant.com/failure",
    "expirationReturnUrl": "https://merchant.com/expiration"
  },
  "customer": {
    "givenName": "Reforza Jordan",
    "surname": "Geotama",
    "email": "reforza@pivot-payment.com",
    "phoneNumber": {
      "countryCode": "+62",
      "number": "89699990001"
    },
    "refundPreference": {
      "method": "AUTO",
      "transferDestination": {
        "channelCode": "014",
        "channelInformation": {
          "accountNumber": "17677665415",
          "accountName": "Reforza Jordan Geotama"
        }
      }
    }
  },
  "orderInformation": {
    "productDetails": [
      {
        "type": "PHYSICAL",
        "category": "FASHION",
        "subCategory": "FASHION WANITA",
        "name": "Dress Kasual Warna Putih",
        "description": "Ukuran M",
        "quantity": 1,
        "price": {
          "value": 100000,
          "currency": "IDR"
        }
      }
    ],
    "billingInfo": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990001"
      },
      "addressLine1": "Biomedical Building Lantai 3",
      "addressLine2": "Digital hub, BSD City",
      "city": "Tangerang Regency",
      "provinceState": "Banten",
      "country": "ID",
      "postalCode": "15331"
    },
    "shippingInfo": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990001"
      },
      "addressLine1": "Biomedical Building Lantai 3",
      "addressLine2": "Digital hub, BSD City",
      "city": "Tangerang Regency",
      "provinceState": "Banten",
      "country": "ID",
      "postalCode": "15331",
      "method": "REGULAR",
      "shippingFee": {
        "value": 100000,
        "currency": "IDR"
      }
    }
  },
  "autoConfirm": true,
  "statementDescriptor": "Reforza Pivot",
  "expiryAt": "2025-12-30T23:59:00Z",
  "metadata": {
    "invoiceNo": "INV001"
  }
}
```

</details>

<details>

<summary>QR Static with Merchant's customized Payment Page</summary>

How to build reference: [Build Static Payment](https://app.gitbook.com/s/bRczl3VT35wkmuP4KTzZ/accept-payment/build-static-payment "mention")

```json
{
  "clientReferenceId": "1751610085",
  "paymentType": "MULTIPLE",
  "paymentMethod": {
    "type": "QR"
  },
  "mode": "API",
  "redirectUrl": {
    "successReturnUrl": "https://merchant.com/success",
    "failureReturnUrl": "https://merchant.com/failure",
    "expirationReturnUrl": "https://merchant.com/expiration"
  },
  "customer": {
    "givenName": "Reforza Jordan",
    "surname": "Geotama",
    "email": "reforza@pivot-payment.com",
    "phoneNumber": {
      "countryCode": "+62",
      "number": "89699990001"
    },
    "refundPreference": {
      "method": "AUTO",
      "transferDestination": {
        "channelCode": "014",
        "channelInformation": {
          "accountNumber": "17677665415",
          "accountName": "Reforza Jordan Geotama"
        }
      }
    }
  },
  "orderInformation": {
    "productDetails": [
      {
        "type": "PHYSICAL",
        "category": "FASHION",
        "subCategory": "FASHION WANITA",
        "name": "Dress Kasual Warna Putih",
        "description": "Ukuran M",
        "quantity": 1,
        "price": {
          "value": 100000,
          "currency": "IDR"
        }
      }
    ],
    "billingInfo": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990001"
      },
      "addressLine1": "Biomedical Building Lantai 3",
      "addressLine2": "Digital hub, BSD City",
      "city": "Tangerang Regency",
      "provinceState": "Banten",
      "country": "ID",
      "postalCode": "15331"
    },
    "shippingInfo": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990001"
      },
      "addressLine1": "Biomedical Building Lantai 3",
      "addressLine2": "Digital hub, BSD City",
      "city": "Tangerang Regency",
      "provinceState": "Banten",
      "country": "ID",
      "postalCode": "15331",
      "method": "REGULAR",
      "shippingFee": {
        "value": 100000,
        "currency": "IDR"
      }
    }
  },
  "autoConfirm": true,
  "statementDescriptor": "Reforza Pivot",
  "metadata": {
    "invoiceNo": "INV001"
  }
}
```

</details>

**Detail Parameter Request**

<table><thead><tr><th width="212.58984375">Parameter</th><th width="132.98046875">Data Type</th><th width="114.7509765625">Character Limit</th><th width="119.09375">Requirement</th><th width="270.0029296875">Description</th></tr></thead><tbody><tr><td>clientReferenceId</td><td>Alphanumeric</td><td>1-100</td><td>M</td><td>Unique Payment Reference from Merchant's Request</td></tr><tr><td>amount</td><td>Object</td><td>-</td><td>M</td><td><a data-mention href="../object/amount-object">amount-object</a><br>Total Payment amount</td></tr><tr><td>paymentType</td><td>String</td><td>-</td><td>O</td><td><p>Default to SINGLE</p><p></p><p>Payment Type possible values are:</p><ul><li>SINGLE</li><li>MULTIPLE</li></ul><p></p><p>Definition:</p><ul><li><mark style="color:orange;"><code>SINGLE</code></mark>: Payment Session can only be charged once</li><li><mark style="color:orange;"><code>MULTIPLE</code></mark>: Payment Session can be charged multiple times, and Payment Session Status is always <mark style="color:orange;"><code>Active</code></mark></li></ul><p><br>Applicable only for Payment Method Type <mark style="color:orange;"><code>QR</code></mark> and <mark style="color:orange;"><code>VIRTUAL_ACCOUNT</code></mark></p></td></tr><tr><td>paymentMethod</td><td>Object</td><td>-</td><td>O</td><td><a data-mention href="../object/payment-method-object">payment-method-object</a></td></tr><tr><td>paymentMethodOptions</td><td>Object</td><td>-</td><td>C</td><td><a data-mention href="../object/payment-method-options-object">payment-method-options-object</a></td></tr><tr><td>saveForFutureUse</td><td>Boolean</td><td>-</td><td>O</td><td><p>Store Payment Information detail in Token format in <a data-mention href="../../core-resources/customers/customer-object">customer-object</a> for <mark style="color:orange;"><code>CARD</code></mark> &#x26; <mark style="color:orange;"><code>EWALLET</code></mark>  Payment method whenever the charge is <mark style="color:orange;"><code>SUCCESS</code></mark></p><p></p><p>Default to false<br><br>Possible values are:</p><ul><li>true</li><li>false</li></ul></td></tr><tr><td>showSavedPayment</td><td>Boolean</td><td>-</td><td>O</td><td><p>Show saved Payment Information for <mark style="color:orange;"><code>CARD</code></mark> &#x26; <mark style="color:orange;"><code>EWALLET</code></mark>  Payment method in Payment Redirection</p><p></p><p>Default to false, applicable only for <mark style="color:orange;"><code>REDIRECT</code></mark> mode<br><br>Possible values are:</p><ul><li>true</li><li>false</li></ul></td></tr><tr><td>mode</td><td>String</td><td>-</td><td>O</td><td><p>Default to REDIRECT</p><p></p><p>Payment Session mode. Possible values are:</p><ul><li>REDIRECT will return redirectUrl</li><li>API</li></ul></td></tr><tr><td>bypassStatusPage</td><td>Boolean</td><td>-</td><td>O</td><td><p>Bypass Pivot's Status Page after your customer completing the Payment, directly redirect to your URLs</p><p></p><p>Default to false, applicable only for <mark style="color:orange;"><code>REDIRECT</code></mark> mode<br><br>Possible values are:</p><ul><li>true</li><li>false</li></ul></td></tr><tr><td>redirectUrl</td><td>Object</td><td>-</td><td>M</td><td><a data-mention href="../object/redirect-object">redirect-object</a><br><br>URL for redirection</td></tr><tr><td>customerId</td><td>String</td><td>0-255</td><td>O</td><td>Auto generated based on email as the unique identifier<br><br>*Choose either to send customerId or customer Object</td></tr><tr><td>customer</td><td>Object</td><td>-</td><td>C</td><td><a data-mention href="../../core-resources/customers/customer-object">customer-object</a><br><br>Customer information<br><br>*Choose either to send customerId or customer Object</td></tr><tr><td>orderInformation</td><td>Object</td><td>-</td><td>M</td><td><a data-mention href="../object/order-object">order-object</a><br><br>Order information</td></tr><tr><td>autoConfirm</td><td>Boolean</td><td>-</td><td>O</td><td><p>Default to true</p><p><br>If the confirmation method is set to false. Then clients need to hit the /confirm endpoint</p></td></tr><tr><td>statementDescriptor</td><td>String</td><td>0-20</td><td>O</td><td><p>Default = Merchant’s short name</p><p></p><p>Statement descriptors allow a maximum 20 characters for all the concatenated characters (including space). </p><p></p><p>It will be shown on invoice, receipt, and for payment methods that support custom descriptors, it will be shown on the customer's bank statement.<br></p></td></tr><tr><td>expirationMode</td><td>String</td><td>-</td><td>O</td><td><p>Default to LOOSE</p><p></p><p>Payment Type possible values are:</p><ul><li>LOOSE</li><li>STRICT</li></ul><p></p><p>Definition:</p><ul><li><mark style="color:orange;"><code>LOOSE</code></mark>: Expiry depends on processor rules</li><li><mark style="color:orange;"><code>STRICT</code></mark>: Expiry depends on merchant rules</li></ul><p><br>Applicable only for Payment Method Type <mark style="color:orange;"><code>CARD</code></mark> and <mark style="color:orange;"><code>EWALLET</code></mark></p></td></tr><tr><td>expiryAt</td><td>String</td><td>-</td><td>O</td><td>Session expired time set by merchant with format YYYY-MM-DDTHH:MM:SSZ. The default expiration time is 15 mins.<br><br>For Payment Type = <mark style="color:orange;"><code>MULTIPLE</code></mark>, don't necessarily send the Expiry At value</td></tr><tr><td>metadata</td><td>Object</td><td>-</td><td>O</td><td>Free object for merchant to store any extra information about the payment session</td></tr></tbody></table>

## Response

### **Payment UI**

<details>

<summary>Pivot's Payment UI</summary>

```json
{
  "code": "00",
  "message": "Success",
  "data": {
    "id": "a97224e6-9f1d-4839-9a4c-62d334c35899",
    "clientReferenceId": "1751612565",
    "amount": {
      "value": 10000,
      "currency": "IDR"
    },
    "autoConfirm": false,
    "mode": "REDIRECT",
    "bypassStatusPage": false,
    "redirectUrl": {
      "successReturnUrl": "https://merchant.com/success",
      "failureReturnUrl": "https://merchant.com/failure",
      "expirationReturnUrl": "https://merchant.com/expiration"
    },
    "paymentType": "SINGLE",
    "paymentMethod": null,
    "statementDescriptor": "Reforza Pivot",
    "status": "REQUIRE_CONFIRMATION",
    "createdAt": "2025-10-02T08:38:37.008529109Z",
    "updatedAt": "2025-10-02T08:38:37.008529249Z",
    "expiryAt": "2025-10-30T04:10:43Z",
    "paymentUrl": "https://pay.pivot-payment.com/detail?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiYTk3MjI0ZTYtOWYxZC00ODM5LTlhNGMtNjJkMzM0YzM1ODk5IiwiaXNzIjoiYmFja2VuZC1wb3J0YWwiLCJleHAiOjE3NjE3OTc0NDN9.EzTa8rz4ipiUfZJgA79D75fsd2DgPaNJNagFpbK2zGY",
    "chargeDetails": null,
    "customerId": "0197e3f5-1a17-7d43-b2f9-1b51479fb8a9",
    "customer": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990001"
      },
      "refundPreference": {
        "method": "AUTO",
        "transferDestination": {
          "channelCode": "014",
          "channelInformation": {
            "accountNumber": "17677665415",
            "accountName": "Reforza Jordan Geotama"
          }
        }
      }
    },
    "metadata": {
      "invoiceNo": "INV001"
    }
  }
}
```

</details>

### Card Payment Method

<details>

<summary>Pivot's Payment Redirection</summary>

```json
{
  "code": "00",
  "message": "Success",
  "data": {
    "id": "9a08c652-f59d-45ea-8828-4b616d80db57",
    "clientReferenceId": "1751610085",
    "amount": {
      "value": 10000,
      "currency": "IDR"
    },
    "autoConfirm": true,
    "mode": "REDIRECT",
    "bypassStatusPage": false,
    "redirectUrl": {
      "successReturnUrl": "https://merchant.com/success",
      "failureReturnUrl": "https://merchant.com/failure",
      "expirationReturnUrl": "https://merchant.com/expiration"
    },
    "paymentType": "SINGLE",
    "paymentMethod": {
      "type": "CARD"
    },
    "statementDescriptor": "Reforza Pivot",
    "expirationMode": "STRICT",
    "status": "REQUIRE_ACTION",
    "createdAt": "2025-10-02T08:50:44.142545061Z",
    "updatedAt": "2025-10-02T08:50:44.159516672Z",
    "expiryAt": "2025-10-30T04:10:43Z",
    "paymentUrl": "https://pay.pivot-payment.com/detail?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiOWEwOGM2NTItZjU5ZC00NWVhLTg4MjgtNGI2MTZkODBkYjU3IiwiaXNzIjoiYmFja2VuZC1wb3J0YWwiLCJleHAiOjE3NjE3OTc0NDN9.W7M__xdfnFkYRsNsdrhkLk0f89lrHNYJDQWENlodz9U",
    "chargeDetails": [
      {
        "id": "29af1dec-4bac-4371-84c2-40c959704e6b",
        "paymentSessionId": "9a08c652-f59d-45ea-8828-4b616d80db57",
        "paymentSessionClientReferenceId": "1751610085",
        "amount": {
          "value": 10000,
          "currency": "IDR"
        },
        "statementDescriptor": "Reforza Pivot",
        "status": "WAITING_FOR_USER_ACTION",
        "authorizedAmount": null,
        "capturedAmount": null,
        "isCaptured": false,
        "createdAt": "2025-10-02T08:50:44.166332523Z",
        "updatedAt": "2025-10-02T08:50:44.166332616Z",
        "paidAt": null
      }
    ],
    "customerId": "0197e3f5-1a17-7d43-b2f9-1b51479fb8a9",
    "customer": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990003"
      },
      "refundPreference": {
        "method": "AUTO",
        "transferDestination": {
          "channelCode": "014",
          "channelInformation": {
            "accountNumber": "17677665415",
            "accountName": "Reforza Jordan Geotama"
          }
        }
      }
    },
    "metadata": {
      "invoiceNo": "INV001"
    }
  }
}
```

</details>

<details>

<summary>Merchant's customized Payment Page — Card Encryption</summary>

```json
{
  "code": "00",
  "message": "Success",
  "data": {
    "id": "18ca2228-af6a-49ec-9d32-72c5f3fb4bfa",
    "clientReferenceId": "1751620870",
    "amount": {
      "value": 10000,
      "currency": "IDR"
    },
    "autoConfirm": false,
    "mode": "API",
    "redirectUrl": {
      "successReturnUrl": "https://merchant.com/success",
      "failureReturnUrl": "https://merchant.com/failure",
      "expirationReturnUrl": "https://merchant.com/expiration"
    },
    "paymentType": "SINGLE",
    "paymentMethod": {
      "type": "CARD"
    },
    "statementDescriptor": "Reforza Pivot",
    "expirationMode": "STRICT",
    "status": "REQUIRE_CONFIRMATION",
    "createdAt": "2025-10-02T08:53:48.681269615Z",
    "updatedAt": "2025-10-02T08:53:48.681269727Z",
    "expiryAt": "2025-10-30T04:10:43Z",
    "encryptionKey": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzktmvQP+4z6OikrOaf4kx1LizCzQ6vbzxEUbzyjEyur3oiTT3q4sL5GV037t14UPLsb1SHNObtJjqISyi/lmiIqtr/LayM8AKvbZVf2LL2+MSa/1IGYMHpeO8w/mYkFKOhlvbQHa0VTiM8Tsqv2yFvZ3uFKeJ8AJL+QcAdusNKVzcx37DZGB33qLeiy0G/OXkq57pT/aAwx85fdRxw9ih001l3oyKil3l+VT42ZeB2kLJHRVf+HMqFTtIPgkPSbwbFNJQhZXKzGnHTF0YW2M78+ji+2wMdq2pEpxVHpatl32Irj6VU23Zlrle3B1udGOZgOkaLUfmUKWJd/cgf8lPQIDAQAB",
    "chargeDetails": null,
    "customerId": "0197e3f5-1a17-7d43-b2f9-1b51479fb8a9",
    "customer": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990003"
      },
      "refundPreference": {
        "method": "AUTO",
        "transferDestination": {
          "channelCode": "014",
          "channelInformation": {
            "accountNumber": "17677665415",
            "accountName": "Reforza Jordan Geotama"
          }
        }
      }
    },
    "metadata": {
      "invoiceNo": "INV001"
    }
  }
}
```

</details>

<details>

<summary>Save Card with Pivot's Payment Redirection (Card Tokenization)</summary>

**Initiation**

```json
{
  "code": "00",
  "message": "Success",
  "data": {
    "id": "73989414-456f-4735-b1cf-d2dc20bb2f1b",
    "clientReferenceId": "1751610085",
    "amount": {
      "value": 10000,
      "currency": "IDR"
    },
    "autoConfirm": true,
    "mode": "REDIRECT",
    "bypassStatusPage": false,
    "redirectUrl": {
      "successReturnUrl": "https://merchant.com/success",
      "failureReturnUrl": "https://merchant.com/failure",
      "expirationReturnUrl": "https://merchant.com/expiration"
    },
    "paymentType": "SINGLE",
    "paymentMethod": {
      "type": "CARD"
    },
    "statementDescriptor": "Reforza Pivot",
    "saveForFutureUse": true,
    "expirationMode": "STRICT",
    "status": "REQUIRE_ACTION",
    "createdAt": "2025-10-02T08:56:51.761170412Z",
    "updatedAt": "2025-10-02T08:56:51.785624475Z",
    "expiryAt": "2025-10-30T04:10:43Z",
    "paymentUrl": "https://pay.pivot-payment.com/detail?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiNzM5ODk0MTQtNDU2Zi00NzM1LWIxY2YtZDJkYzIwYmIyZjFiIiwiaXNzIjoiYmFja2VuZC1wb3J0YWwiLCJleHAiOjE3NjE3OTc0NDN9.jnwVOU4HH7-lLZO8r1NLPanEURXPGzEe2Eun24WZhts",
    "chargeDetails": [
      {
        "id": "d76a12da-49e9-4c94-93cf-5e1bd1c98d8d",
        "paymentSessionId": "73989414-456f-4735-b1cf-d2dc20bb2f1b",
        "paymentSessionClientReferenceId": "1759395411",
        "amount": {
          "value": 10000,
          "currency": "IDR"
        },
        "statementDescriptor": "HRS",
        "status": "WAITING_FOR_USER_ACTION",
        "authorizedAmount": null,
        "capturedAmount": null,
        "isCaptured": false,
        "createdAt": "2025-10-02T08:56:51.792337754Z",
        "updatedAt": "2025-10-02T08:56:51.792337952Z",
        "paidAt": null
      }
    ],
    "customerId": "0197e3f5-1a17-7d43-b2f9-1b51479fb8a9",
    "customer": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990003"
      },
      "refundPreference": {
        "method": "AUTO",
        "transferDestination": {
          "channelCode": "014",
          "channelInformation": {
            "accountNumber": "17677665415",
            "accountName": "Reforza Jordan Geotama"
          }
        }
      }
    },
    "metadata": {
      "invoiceNo": "INV001"
    }
  }
}
```

**Use Tokenized Card**

```json
{
  "code": "00",
  "message": "Success",
  "data": {
    "id": "204009d4-40da-4793-a899-24ca8452fd02",
    "clientReferenceId": "1751610085",
    "amount": {
      "value": 10000,
      "currency": "IDR"
    },
    "autoConfirm": true,
    "mode": "REDIRECT",
    "bypassStatusPage": false,
    "redirectUrl": {
      "successReturnUrl": "https://merchant.com/success",
      "failureReturnUrl": "https://merchant.com/failure",
      "expirationReturnUrl": "https://merchant.com/expiration"
    },
    "paymentType": "SINGLE",
    "paymentMethod": {
      "type": "CARD"
    },
    "statementDescriptor": "Reforza Pivot",
    "saveForFutureUse": true,
    "showSavedPayment": true,
    "expirationMode": "STRICT",
    "status": "REQUIRE_ACTION",
    "createdAt": "2025-10-02T09:01:23.169576493Z",
    "updatedAt": "2025-10-02T09:01:23.188991777Z",
    "expiryAt": "2025-10-30T04:10:43Z",
    "paymentUrl": "https://pay.pivot-payment.com/detail?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiMjA0MDA5ZDQtNDBkYS00NzkzLWE4OTktMjRjYTg0NTJmZDAyIiwiaXNzIjoiYmFja2VuZC1wb3J0YWwiLCJleHAiOjE3NjE3OTc0NDN9.7Mbp8oFpeZceXV7goI4qrrivKf1b69mxHh2xP_6OZAs",
    "chargeDetails": [
      {
        "id": "d237163c-8c41-4c4e-b3cc-9926348d3846",
        "paymentSessionId": "204009d4-40da-4793-a899-24ca8452fd02",
        "paymentSessionClientReferenceId": "1759395683",
        "amount": {
          "value": 10000,
          "currency": "IDR"
        },
        "statementDescriptor": "HRS",
        "status": "WAITING_FOR_USER_ACTION",
        "authorizedAmount": null,
        "capturedAmount": null,
        "isCaptured": false,
        "createdAt": "2025-10-02T09:01:23.196373446Z",
        "updatedAt": "2025-10-02T09:01:23.196373623Z",
        "paidAt": null
      }
    ],
    "customerId": "0197e3f5-1a17-7d43-b2f9-1b51479fb8a9",
    "customer": {
      "givenName": "Reforza Jordan",
      "sureName": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990003"
      },
      "refundPreference": {
        "method": "AUTO",
        "transferDestination": {
          "channelCode": "014",
          "channelInformation": {
            "accountNumber": "17677665415",
            "accountName": "Reforza Jordan Geotama"
          }
        }
      }
    },
    "metadata": {
      "invoiceNo": "INV001"
    }
  }
}
```

</details>

<details>

<summary>Save Card with Merchant's customized Payment Page (Card Tokenization)</summary>

**Initiation**

```json
{
  "code": "00",
  "message": "Success",
  "data": {
    "id": "93ef772b-cd46-4b90-9194-11d0fa4506ce",
    "clientReferenceId": "1751620870",
    "amount": {
      "value": 10000,
      "currency": "IDR"
    },
    "autoConfirm": false,
    "mode": "API",
    "redirectUrl": {
      "successReturnUrl": "https://merchant.com/success",
      "failureReturnUrl": "https://merchant.com/failure",
      "expirationReturnUrl": "https://merchant.com/expiration"
    },
    "paymentType": "SINGLE",
    "paymentMethod": {
      "type": "CARD"
    },
    "statementDescriptor": "Reforza Pivot",
    "saveForFutureUse": true,
    "expirationMode": "STRICT",
    "status": "REQUIRE_CONFIRMATION",
    "createdAt": "2025-10-02T09:05:05.220870672Z",
    "updatedAt": "2025-10-02T09:05:05.220870842Z",
    "expiryAt": "2025-10-30T04:10:43Z",
    "encryptionKey": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAw9tfaEzUSz9A3NRnNFlswVzw2ZInCIVRBKNPiJ6SX0VsBO3fZepZmoXGqyfwvIVHechSTlFrfyRqKsvGeqRXdCCroYsyvmsnhW/x17EFgwbYqI6Lt0nd4IJGurN5cW5vNiQ9a/Qx2gTpx91sMLl07dqroLjOTCm6OyKUQXH/pBpFFKjwEGWCYJSaqK+cOX5KhypXoZRhKPdy0QRJrUvW7PHhsL0VDA9VfY+2H+WlxABNzA7sEBWdk/tw4+TKzfM4I8qAQenVmBmKGVr70mYIGkwXtqG/nUOyMiDMXxrazUyKEIpqNIALI5DdXkNTYAqbjgZQqmpd6oebrTU/PVj/dwIDAQAB",
    "chargeDetails": null,
    "customerId": "0197e3f5-1a17-7d43-b2f9-1b51479fb8a9",
    "customer": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990003"
      },
      "refundPreference": {
        "method": "AUTO",
        "transferDestination": {
          "channelCode": "014",
          "channelInformation": {
            "accountNumber": "17677665415",
            "accountName": "Reforza Jordan Geotama"
          }
        }
      }
    },
    "metadata": {
      "invoiceNo": "INV001"
    }
  }
}
```

**Use Tokenized Card**

```json
{
  "code": "00",
  "message": "Success",
  "data": {
    "id": "3c9d8e23-c88a-4181-b364-0eba2230cf02",
    "clientReferenceId": "1751620870",
    "amount": {
      "value": 10000,
      "currency": "IDR"
    },
    "autoConfirm": true,
    "mode": "API",
    "redirectUrl": {
      "successReturnUrl": "https://merchant.com/success",
      "failureReturnUrl": "https://merchant.com/failure",
      "expirationReturnUrl": "https://merchant.com/expiration"
    },
    "paymentType": "SINGLE",
    "paymentMethod": {
      "type": "CARD",
      "card": {
        "token": "020027de-134e-45ed-8f0d-7ae0506a7133",
        "encryptedCard": "",
        "cvc": ""
      }
    },
    "statementDescriptor": "Reforza Pivot",
    "saveForFutureUse": true,
    "expirationMode": "STRICT",
    "status": "REQUIRE_ACTION",
    "createdAt": "2025-10-02T09:08:51.376512113Z",
    "updatedAt": "2025-10-02T09:08:51.419384219Z",
    "expiryAt": "2025-10-30T04:10:43Z",
    "paymentUrl": "https://creditcard-webview-stg.harsya.com/payment/creditcard/authenticate-token?cred=Teknb__Gytp_Cb81dhg1E39AkVDuOl6SXIpa2G8E0QW4LvKCAGo5cGtHc9NmDAAq0NYR0b_AlZNAgZRsV8E4NuQe-r3XMEUgtu35Xz0EZKX365xduzFd92j8u4YmdGAps3-xFD6VlF4Z2gEK2XHGsJbPUuzkEjSyj6zfrI8lw7WFLbLLEiFyHdzQ0S27dCPgtpV8OkQABCAfD7QYmePoZodLXHvBkBxjjxyd5gr-Hp-5i0UsZVlbzVvHG-rQ6MsTsbjEUzbT3E8nB5Gk5794Wi5kt0sXDlznpM0R4ePqoocknk1EvTQBssjFchMCuIjf_qWmJeLMRVToO5XUN2NdEopjJbxhf-qX1uGSO9uwnFVMYI8Jaf_k3AX1wHG5PxNsUq1zoBd8b1AzDZ6FA1JsB9o9nqKC31_YW4IbhNrvW6VXQ4UydfwxQMD4lY18bQkj-ODCCkIPVETynh3yrKaqKnUzTq_202gAB7SgSM2enidsLYZqTjqeNyX7ozbhkStzrZXdaamz2MWSuWWJ8Mk5Y1uqaksyAR6juOmnVTPiPzN1fWiYcCNN7XumN2Nb4EHn1r-3wAocgcK45vLcjCvnBI7OEeCRzjyRuSzkYcwiFDtHqeOHM9l2TLSROoVfB3LOjiP-yB453DWlAqyS_9HWLFpuc-4FdM_W7jNbNsYVtAGVX0H13n3SgVAAd_H3wH4t_7-svT1kx8RLnVlprhC9AETKxg0Cj_4wNGWfnlFHRpgAPXltJ9UjAIFDghZgeDUw-jU--3kSbDWgo8N7PUHJHKW8e4aqQNpY17oSZIAjMQRVd0MdWLrDdVM5kGAryDLllD7sedP1u21RxiudwMikbq2zJ_eTmge6vg%3D%3D&merchant_id=e485e01b-ff59-4a47-bb7d-9b39064f3388",
    "chargeDetails": [
      {
        "id": "9380a83b-933a-4a43-94d4-8f2c4b937bb3",
        "paymentSessionId": "3c9d8e23-c88a-4181-b364-0eba2230cf02",
        "paymentSessionClientReferenceId": "1751620870",
        "amount": {
          "value": 10000,
          "currency": "IDR"
        },
        "statementDescriptor": "Reforza Pivot",
        "status": "WAITING_FOR_USER_ACTION",
        "authorizedAmount": null,
        "capturedAmount": null,
        "isCaptured": false,
        "createdAt": "2025-10-02T09:08:51.42249967Z",
        "updatedAt": "2025-10-02T09:08:51.42249986Z",
        "paidAt": null,
        "card": {
          "first6": "",
          "first8": "",
          "last4": "",
          "expMonth": "",
          "expYear": "",
          "binInformations": {
            "type": "",
            "issuingBank": "",
            "brand": "",
            "country": ""
          },
          "authenticationResult": null,
          "authorizationResult": null
        }
      }
    ],
    "customerId": "01975d90-bb55-76f6-b423-691c7868e85d",
    "customer": {
      "givenName": "Reforza Jordan",
      "sureName": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990003"
      },
      "refundPreference": {
        "method": "AUTO",
        "transferDestination": {
          "channelCode": "014",
          "channelInformation": {
            "accountNumber": "17677665415",
            "accountName": "Reforza Jordan Geotama"
          }
        }
      },
      "storedPaymentMethods": [
        {
          "token": "020027de-134e-45ed-8f0d-7ae0506a7133",
          "paymentMethod": "CARD",
          "paymentChannel": "VISA",
          "status": "ACTIVE",
          "createdAt": "2025-09-02T06:02:59.141590124Z",
          "card": {
            "fingerprint": "0198edcf-87a0-73fd-b937-7ec4b0ddb9c6",
            "network": "VISA",
            "first6": "444000",
            "first8": "44400001",
            "last4": "0002",
            "expMonth": "01",
            "expYear": "39",
            "cardHolderFirstName": "Reforza Jordan",
            "cardHolderLastName": "Geotama"
          }
        }
      ]
    },
    "metadata": {
      "invoiceNo": "INV001"
    }
  }
}
```

</details>

### E-Wallet Payment Method

<details>

<summary>Pivot's Payment Redirection</summary>

```json
{
  "code": "00",
  "message": "Success",
  "data": {
    "id": "edeb945c-21c8-4742-be44-39158ac5f5af",
    "clientReferenceId": "1751610085",
    "amount": {
      "value": 10000,
      "currency": "IDR"
    },
    "autoConfirm": true,
    "mode": "REDIRECT",
    "bypassStatusPage": false,
    "redirectUrl": {
      "successReturnUrl": "https://merchant.com/success",
      "failureReturnUrl": "https://merchant.com/failure",
      "expirationReturnUrl": "https://merchant.com/expiration"
    },
    "paymentType": "SINGLE",
    "paymentMethod": {
      "type": "EWALLET"
    },
    "statementDescriptor": "Reforza Pivot",
    "expirationMode": "LOOSE",
    "status": "REQUIRE_ACTION",
    "createdAt": "2025-11-07T02:22:22.903283906Z",
    "updatedAt": "2025-11-07T02:22:23.243302892Z",
    "expiryAt": "2025-11-10T00:00:00Z",
    "paymentUrl": "https://pay.pivot-payment.com/detail?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiZWRlYjk0NWMtMjFjOC00NzQyLWJlNDQtMzkxNThhYzVmNWFmIiwiaXNzIjoiYmFja2VuZC1wb3J0YWwiLCJleHAiOjE3NjI3MzI4MDB9.2gl2iB8Jq8nPUuRSsdU1O03iGr-VVfkqKPPKaZbt08o",
    "chargeDetails": [
      {
        "id": "a193d396-0c1c-4ea4-ad09-7c8ff9e63dff",
        "paymentSessionId": "edeb945c-21c8-4742-be44-39158ac5f5af",
        "paymentSessionClientReferenceId": "1751610085",
        "amount": {
          "value": 10000,
          "currency": "IDR"
        },
        "statementDescriptor": "Reforza Pivot",
        "status": "WAITING_FOR_USER_ACTION",
        "authorizedAmount": null,
        "capturedAmount": null,
        "isCaptured": false,
        "createdAt": "2025-11-07T02:22:23.253414896Z",
        "updatedAt": "2025-11-07T02:22:23.253415045Z",
        "paidAt": null,
        "ewallet": {
          "channel": "SHOPEEPAY"
        }
      }
    ],
    "customerId": "0197e3f5-1a17-7d43-b2f9-1b51479fb8a9",
    "customer": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990003"
      },
      "refundPreference": {
        "method": "AUTO",
        "transferDestination": {
          "channelCode": "014",
          "channelInformation": {
            "accountNumber": "17677665415",
            "accountName": "Reforza Jordan Geotama"
          }
        }
      }
    },
    "metadata": {
      "invoiceNo": "INV001"
    }
  }
}
```

</details>

<details>

<summary>Merchant's customized Payment Page</summary>

```json
{
  "code": "00",
  "message": "Success",
  "data": {
    "id": "3adcaae9-f388-4ac7-a189-d508db57f43d",
    "clientReferenceId": "1751610085",
    "amount": {
      "value": 10000,
      "currency": "IDR"
    },
    "autoConfirm": true,
    "mode": "API",
    "redirectUrl": {
      "successReturnUrl": "https://merchant.com/success",
      "failureReturnUrl": "https://merchant.com/failure",
      "expirationReturnUrl": "https://merchant.com/expiration"
    },
    "paymentType": "SINGLE",
    "paymentMethod": {
      "type": "EWALLET"
    },
    "statementDescriptor": "Reforza Pivot",
    "expirationMode": "LOOSE",
    "status": "REQUIRE_ACTION",
    "createdAt": "2025-11-07T02:05:44.813268237Z",
    "updatedAt": "2025-11-07T02:05:44.946002569Z",
    "expiryAt": "2025-11-10T00:00:00Z",
    "paymentUrl": "shopeepayid://main?apprl=%2Frn%2FTRANSFER_PAGE%3Fnavigate_url%3Dhttps%253A%252F%252Fwsa.wallet.airpay.co.id%252Fwallet%252Fpay%253Fmedium_index%253DUm80ZWF4Yk9xZmROUMQfB-00Q4YgC41bT06qjdCJd8bJlUV-qTqNYDbIdTnPNtM%2526order_key%253DB3DVvDfDXt2QtKL8-jIH3KBOdogx8-lGVMrtoTV0gWLMVjaQYm8roaBOT4aFdw4y_yxnPWaAV8bMRw%2526order_sn%253D112648522470591032%2526return_url%253DaHR0cHM6Ly9waXZvdC1wYXltZW50LmNvbT9hbW91bnQ9MTAwMDEwMCZjbGllbnRfaWQ9SGFyc3lhK1JlbWl0aW5kbyZyZWZlcmVuY2VfaWQ9MTc2MjQ4MTE0NDg0ODAyNjIyNCZyZXN1bHRfY29kZT0yMDMmc2lnbmF0dXJlPUNfQ1cwYWNUWlU1emFPMHRGc19jOTU5OUJfSF9RSWs4QUFubHlGZWhQWFUlM0Q%25253D%2526source%253Dqr%2526token%253DUm80ZWF4Yk9xZmROUMQfB-00Q4YgC41bT06qjdCJd8bJlUV-qTqNYDbIdTnPNtM",
    "chargeDetails": [
      {
        "id": "a6b68aee-bd42-45e0-b17d-dc605c3c3465",
        "paymentSessionId": "3adcaae9-f388-4ac7-a189-d508db57f43d",
        "paymentSessionClientReferenceId": "1751610085",
        "amount": {
          "value": 10000,
          "currency": "IDR"
        },
        "statementDescriptor": "Reforza Pivot",
        "status": "WAITING_FOR_USER_ACTION",
        "authorizedAmount": null,
        "capturedAmount": null,
        "isCaptured": false,
        "createdAt": "2025-11-07T02:05:44.955152399Z",
        "updatedAt": "2025-11-07T02:05:44.955152539Z",
        "paidAt": null,
        "ewallet": {
          "channel": "SHOPEEPAY"
        }
      }
    ],
    "customerId": "0197e3f5-1a17-7d43-b2f9-1b51479fb8a9",
    "customer": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990003"
      },
      "refundPreference": {
        "method": "AUTO",
        "transferDestination": {
          "channelCode": "014",
          "channelInformation": {
            "accountNumber": "17677665415",
            "accountName": "Reforza Jordan Geotama"
          }
        }
      }
    },
    "metadata": {
      "invoiceNo": "INV001"
    }
  }
}
```

</details>

### Virtual Account Payment Method

<details>

<summary>Pivot's Payment Redirection</summary>

```json
{
  "code": "00",
  "message": "Success",
  "data": {
    "id": "e2d98a89-94bd-4823-a0d6-9e5ff4d1dce0",
    "clientReferenceId": "1751610085",
    "amount": {
      "value": 10000,
      "currency": "IDR"
    },
    "autoConfirm": true,
    "mode": "REDIRECT",
    "bypassStatusPage": false,
    "redirectUrl": {
      "successReturnUrl": "https://merchant.com/success",
      "failureReturnUrl": "https://merchant.com/failure",
      "expirationReturnUrl": "https://merchant.com/expiration"
    },
    "paymentType": "SINGLE",
    "paymentMethod": {
      "type": "VIRTUAL_ACCOUNT"
    },
    "statementDescriptor": "Reforza Pivot",
    "status": "REQUIRE_ACTION",
    "createdAt": "2025-10-03T02:38:34.918432123Z",
    "updatedAt": "2025-10-03T02:38:34.986588447Z",
    "expiryAt": "2025-10-30T04:10:43Z",
    "paymentUrl": "https://pay.pivot-payment.com/detail?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiZTJkOThhODktOTRiZC00ODIzLWEwZDYtOWU1ZmY0ZDFkY2UwIiwiaXNzIjoiYmFja2VuZC1wb3J0YWwiLCJleHAiOjE3NjE3OTc0NDN9.GeaTU5cGOreSDtoL7EcsfDuUym9MUkvblbO251v7Cfg",
    "chargeDetails": [
      {
        "id": "32c8480f-97c5-4d70-ba52-6c24ef75ba8a",
        "paymentSessionId": "e2d98a89-94bd-4823-a0d6-9e5ff4d1dce0",
        "paymentSessionClientReferenceId": "1759459114",
        "amount": {
          "value": 10000,
          "currency": "IDR"
        },
        "statementDescriptor": "Reforza Pivot",
        "status": "WAITING_FOR_USER_ACTION",
        "authorizedAmount": null,
        "capturedAmount": null,
        "isCaptured": false,
        "createdAt": "2025-10-03T02:38:35.004420647Z",
        "updatedAt": "2025-10-03T02:38:35.004420739Z",
        "paidAt": null,
        "virtualAccount": {
          "channel": "PERMATA",
          "virtualAccountNumber": "7663000002940005",
          "virtualAccountName": "Pivot - Reforza Pivot",
          "expiryAt": "2025-10-30T04:10:43Z"
        }
      }
    ],
    "customerId": "0197e3f5-1a17-7d43-b2f9-1b51479fb8a9",
    "customer": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990003"
      },
      "refundPreference": {
        "method": "AUTO",
        "transferDestination": {
          "channelCode": "014",
          "channelInformation": {
            "accountNumber": "17677665415",
            "accountName": "Reforza Jordan Geotama"
          }
        }
      }
    },
    "metadata": {
      "invoiceNo": "INV001"
    }
  }
}
```

</details>

<details>

<summary>Merchant's customized Payment Page</summary>

```json
{
  "code": "00",
  "message": "Success",
  "data": {
    "id": "23f1a0e5-e4b7-4940-ac4a-0e9e5fc8afb1",
    "clientReferenceId": "1751610085",
    "amount": {
      "value": 10000,
      "currency": "IDR"
    },
    "autoConfirm": true,
    "mode": "API",
    "redirectUrl": {
      "successReturnUrl": "https://merchant.com/success",
      "failureReturnUrl": "https://merchant.com/failure",
      "expirationReturnUrl": "https://merchant.com/expiration"
    },
    "paymentType": "SINGLE",
    "paymentMethod": {
      "type": "VIRTUAL_ACCOUNT"
    },
    "statementDescriptor": "Reforza Pivot",
    "status": "REQUIRE_ACTION",
    "createdAt": "2025-10-03T02:36:25.538819731Z",
    "updatedAt": "2025-10-03T02:36:25.655396429Z",
    "expiryAt": "2025-10-30T04:10:43Z",
    "chargeDetails": [
      {
        "id": "c421c3ee-dd0c-4f42-805c-08589dcbaf84",
        "paymentSessionId": "23f1a0e5-e4b7-4940-ac4a-0e9e5fc8afb1",
        "paymentSessionClientReferenceId": "1759458985",
        "amount": {
          "value": 10000,
          "currency": "IDR"
        },
        "statementDescriptor": "Reforza Pivot",
        "status": "WAITING_FOR_USER_ACTION",
        "authorizedAmount": null,
        "capturedAmount": null,
        "isCaptured": false,
        "createdAt": "2025-10-03T02:36:25.669528836Z",
        "updatedAt": "2025-10-03T02:36:25.669528938Z",
        "paidAt": null,
        "virtualAccount": {
          "channel": "PERMATA",
          "virtualAccountNumber": "7663000066992249",
          "virtualAccountName": "Pivot - Reforza Pivot",
          "expiryAt": "2025-10-30T04:10:43Z"
        }
      }
    ],
    "customerId": "0197e3f5-1a17-7d43-b2f9-1b51479fb8a9",
    "customer": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990003"
      },
      "refundPreference": {
        "method": "AUTO",
        "transferDestination": {
          "channelCode": "014",
          "channelInformation": {
            "accountNumber": "17677665415",
            "accountName": "Reforza Jordan Geotama"
          }
        }
      }
    },
    "metadata": {
      "invoiceNo": "INV001"
    }
  }
}
```

</details>

<details>

<summary>Virtual Account Static with Merchant's customized Payment Page</summary>

```json
{
  "code": "00",
  "message": "Success",
  "data": {
    "id": "75dcc1eb-ddc4-4b64-8ddc-2d3216cc8feb",
    "clientReferenceId": "1751610085",
    "amount": {
      "value": 0,
      "currency": "IDR"
    },
    "autoConfirm": true,
    "mode": "API",
    "redirectUrl": {
      "successReturnUrl": "https://merchant.com/success",
      "failureReturnUrl": "https://merchant.com/failure",
      "expirationReturnUrl": "https://merchant.com/expiration"
    },
    "paymentType": "MULTIPLE",
    "paymentMethod": {
      "type": "VIRTUAL_ACCOUNT",
      "virtualAccount": {
        "channel": "PERMATA",
        "virtualAccountNumber": "7664000000000001",
        "virtualAccountName": "Pivot - Reforza Pivot",
        "expiryAt": "0001-01-01T00:00:00Z"
      }
    },
    "statementDescriptor": "Reforza Pivot",
    "status": "ACTIVE",
    "createdAt": "2025-10-03T02:30:58.213271158Z",
    "updatedAt": "2025-10-03T02:30:58.263858929Z",
    "expiryAt": null,
    "chargeDetails": null,
    "customerId": "0197e3f5-1a17-7d43-b2f9-1b51479fb8a9",
    "customer": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990003"
      },
      "refundPreference": {
        "method": "AUTO",
        "transferDestination": {
          "channelCode": "014",
          "channelInformation": {
            "accountNumber": "17677665415",
            "accountName": "Reforza Jordan Geotama"
          }
        }
      }
    },
    "metadata": {
      "invoiceNo": "INV001"
    }
  }
}
```

</details>

### QR Payment Method

<details>

<summary>Pivot's Payment Redirection</summary>

```json
{
  "code": "00",
  "message": "Success",
  "data": {
    "id": "eeb6cd48-363f-430e-93c4-3e830de2559d",
    "clientReferenceId": "1751610085",
    "amount": {
      "value": 10000,
      "currency": "IDR"
    },
    "autoConfirm": true,
    "mode": "REDIRECT",
    "bypassStatusPage": false,
    "redirectUrl": {
      "successReturnUrl": "https://merchant.com/success",
      "failureReturnUrl": "https://merchant.com/failure",
      "expirationReturnUrl": "https://merchant.com/expiration"
    },
    "paymentType": "SINGLE",
    "paymentMethod": {
      "type": "QR"
    },
    "statementDescriptor": "Reforza Pivot",
    "status": "REQUIRE_ACTION",
    "createdAt": "2025-10-03T01:58:06.519989182Z",
    "updatedAt": "2025-10-03T01:58:07.473553268Z",
    "expiryAt": "2025-10-30T04:10:43Z",
    "paymentUrl": "https://pay.pivot-payment.com/detail?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiZWViNmNkNDgtMzYzZi00MzBlLTkzYzQtM2U4MzBkZTI1NTlkIiwiaXNzIjoiYmFja2VuZC1wb3J0YWwiLCJleHAiOjE3NjE3OTc0NDN9.zvmxSLGAxuiX3riK3nwo-YvzCRfs8xP_THrEjnLbjAE",
    "chargeDetails": [
      {
        "id": "e4153565-05aa-44ce-90b0-561c083e4cd7",
        "paymentSessionId": "eeb6cd48-363f-430e-93c4-3e830de2559d",
        "paymentSessionClientReferenceId": "1751610085",
        "amount": {
          "value": 10000,
          "currency": "IDR"
        },
        "statementDescriptor": "Reforza Pivot",
        "status": "WAITING_FOR_USER_ACTION",
        "authorizedAmount": null,
        "capturedAmount": null,
        "isCaptured": false,
        "createdAt": "2025-10-03T01:58:07.482979568Z",
        "updatedAt": "2025-10-03T01:58:07.482979665Z",
        "paidAt": null,
        "qr": {
          "acquirer": "BNC",
          "qrContent": "00020101021226740025ID.CO.BANKNEOCOMMERCE.WWW011893600490800007980502120005301399030303UKE51550025ID.CO.BANKNEOCOMMERCE.WWW0215ID20254287539870303UKE5204653353033605405100005802ID5909Pivot Pay6013JAKARTA UTARA6105144506233012230019739305295701155850703A016304D63D",
          "qrUrl": "https://marketing-img.bankneo.co.id/qris/merchant/img/oXrORYiv8HQOLe8YSJaRa5O9i6Mh0yiB19mOTzKZ3j4.png",
          "qrType": "DYNAMIC",
          "retrievalReferenceNumber": "2025100308343092284377575",
          "issuerName": "",
          "expiryAt": "2025-10-03T04:58:06.544268421Z",
          "merchantName": "Pivot"
        }
      }
    ],
    "customerId": "0197e3f5-1a17-7d43-b2f9-1b51479fb8a9",
    "customer": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990003"
      },
      "refundPreference": {
        "method": "AUTO",
        "transferDestination": {
          "channelCode": "014",
          "channelInformation": {
            "accountNumber": "17677665415",
            "accountName": "Reforza Jordan Geotama"
          }
        }
      }
    },
    "metadata": {
      "invoiceNo": "INV001"
    }
  }
}
```

</details>

<details>

<summary>Merchant's customized Payment Page</summary>

```json
{
  "code": "00",
  "message": "Success",
  "data": {
    "id": "db826bf0-8c10-4203-8a87-42b3e19c0bf9",
    "clientReferenceId": "1751610085",
    "amount": {
      "value": 10000,
      "currency": "IDR"
    },
    "autoConfirm": true,
    "mode": "API",
    "redirectUrl": {
      "successReturnUrl": "https://merchant.com/success",
      "failureReturnUrl": "https://merchant.com/failure",
      "expirationReturnUrl": "https://merchant.com/expiration"
    },
    "paymentType": "SINGLE",
    "paymentMethod": {
      "type": "QR"
    },
    "statementDescriptor": "Reforza Pivot",
    "status": "REQUIRE_ACTION",
    "createdAt": "2025-10-03T02:00:02.113967326Z",
    "updatedAt": "2025-10-03T02:00:03.253716017Z",
    "expiryAt": "2025-10-30T04:10:43Z",
    "chargeDetails": [
      {
        "id": "264b8f44-758b-467a-88b3-5740ded1b4e8",
        "paymentSessionId": "db826bf0-8c10-4203-8a87-42b3e19c0bf9",
        "paymentSessionClientReferenceId": "1759456801",
        "amount": {
          "value": 10000,
          "currency": "IDR"
        },
        "statementDescriptor": "Reforza Pivot",
        "status": "WAITING_FOR_USER_ACTION",
        "authorizedAmount": null,
        "capturedAmount": null,
        "isCaptured": false,
        "createdAt": "2025-10-03T02:00:03.262940053Z",
        "updatedAt": "2025-10-03T02:00:03.262940213Z",
        "paidAt": null,
        "qr": {
          "acquirer": "BNC",
          "qrContent": "00020101021226740025ID.CO.BANKNEOCOMMERCE.WWW011893600490800007980502120005301399030303UKE51550025ID.CO.BANKNEOCOMMERCE.WWW0215ID20254287539870303UKE5204653353033605405100005802ID5909Pivot Pay6013JAKARTA UTARA6105144506233012230019739310141401989130703A0163043FE0",
          "qrUrl": "https://marketing-img.bankneo.co.id/qris/merchant/img/bwHeZhG1jVYDmQmn69Z0eVlJDMlLkpTaZeEiWyiqgQw.png",
          "qrType": "DYNAMIC",
          "retrievalReferenceNumber": "2025100309358657284378149",
          "issuerName": "",
          "expiryAt": "2025-10-03T05:00:02.137671661Z",
          "merchantName": "Pivot"
        }
      }
    ],
    "customerId": "0197e3f5-1a17-7d43-b2f9-1b51479fb8a9",
    "customer": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990003"
      },
      "refundPreference": {
        "method": "AUTO",
        "transferDestination": {
          "channelCode": "014",
          "channelInformation": {
            "accountNumber": "17677665415",
            "accountName": "Reforza Jordan Geotama"
          }
        }
      }
    },
    "metadata": {
      "invoiceNo": "INV001"
    }
  }
}
```

</details>

<details>

<summary>QR Static with Merchant's customized Payment Page</summary>

```json
{
  "code": "00",
  "message": "Success",
  "data": {
    "id": "69de7595-3c42-47ae-ac53-4ba98d1420f0",
    "clientReferenceId": "1751610085",
    "amount": {
      "value": 0,
      "currency": "IDR"
    },
    "autoConfirm": true,
    "mode": "API",
    "redirectUrl": {
      "successReturnUrl": "https://merchant.com/success",
      "failureReturnUrl": "https://merchant.com/failure",
      "expirationReturnUrl": "https://merchant.com/expiration"
    },
    "paymentType": "MULTIPLE",
    "paymentMethod": {
      "type": "QR",
      "qr": {
        "acquirer": "BNC",
        "qrContent": "00020101021126740025ID.CO.BANKNEOCOMMERCE.WWW011893600490800007980502120005601399070303UKE51550025ID.CO.BANKNEOCOMMERCE.WWW0215ID20254288651200303UKE5204653353033605802ID5911Pivot Pay 36013JAKARTA UTARA6105144506233052230019587123729412464640703A01630462B4",
        "qrUrl": "https://marketing-img.bankneo.co.id/qris/merchant/img/_A9bFoNtJXsVcSwLn-0lwKfSKS0H5GoWjnPeEkjv37k.png",
        "qrType": "STATIC",
        "retrievalReferenceNumber": "2025100309367869284378876",
        "issuerName": "",
        "expiryAt": "2025-10-03T02:02:28.438817076Z",
        "merchantName": "Pivot",
        "storeId": "000560139907"
      }
    },
    "statementDescriptor": "Reforza Pivot",
    "status": "ACTIVE",
    "createdAt": "2025-10-03T02:02:27.932239134Z",
    "updatedAt": "2025-10-03T02:02:28.75510101Z",
    "expiryAt": null,
    "chargeDetails": null,
    "customerId": "0197e3f5-1a17-7d43-b2f9-1b51479fb8a9",
    "customer": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990003"
      },
      "refundPreference": {
        "method": "AUTO",
        "transferDestination": {
          "channelCode": "014",
          "channelInformation": {
            "accountNumber": "17677665415",
            "accountName": "Reforza Jordan Geotama"
          }
        }
      }
    },
    "metadata": {
      "invoiceNo": "INV001"
    }
  }
}
```

</details>

**Detail Parameter Response**

<table><thead><tr><th width="210.4765625">Parameter</th><th width="119.98046875">Data Type</th><th width="137.9453125">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>Payment Session</td><td>Object</td><td>M</td><td><a data-mention href="../object/payment-session-object">payment-session-object</a></td></tr></tbody></table>


# Confirm Payment Session

## Method and URL

<mark style="color:green;">`POST`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v2/payments/{id}/confirm

<mark style="color:orange;">`id`</mark> from the Payment Session ID whenever you create Payment Session

## Request

**Request Body**

```json
{
  "paymentMethod": {
    "type": "CARD",
    "card": {
      "encryptedCard": "eyJFbmNyeXB0ZWRLZXkiOiJ0aHgzc25YdUZOU1NQdzlORWIwMEVvdzZSVWFlaFVjd2Yzc3JzTFNOaXpUSExYeG51WnVMb29jR1lxYVlkNTBEdkZDQUMvUzRBaTltSnZNdUwvc2N0TnJjL1UzMkNKa0M3WTdrYVc0ZTFvTWtlM2JZKzBURHRPdlJ1bGc3Y3NVc1FmcXRFUytkdGxKN2IyWVRxdml4Q1VMTnNxeWxRb2Y0WjRRZitQeWM2NzE5eVZUZkIzUEJ0VElOQTBiQlZJN1ErUDliN0c0Nk9ZVk5adW9BTXBPY2MyS3ZjdW5LUE1La2hlTDluM3lnZTFMTzVpenlyQU9JMXIzVWpROEdKYW55OTFqaXZTMjVVZVh4WktrYWZLalAyQ2ZlSzZJTi9HVlJReDNwRWhTb3BiSGFEYmh2STJrYlllT2REeGlQSFlMdkx2NnBlNTZFS0Y1RG9OUU5IeURGY2c9PSIsIk5vbmNlIjoiSS9McDRtRGp0TS9uNDRwVSIsIkNpcGhlcnRleHQiOiIvaVR5UCtQcUpnOTltcjBYTVh3cDNWZk5FOGVOeDVTYVN0bFFhMnI0c0FoZmZsZHArdXlHM3pyU3F5WGwwdnZHYjhZb1FIV2NCQzZRM3IxZTBwRTNjWEVlMklKSEVQc2pEUk04bS9VZnJIL0lRVUZndHJPbzNZNmk1bFdWQ0VYa0FyRTRDV21jVmdpRHhrcXVNd2hoR2Zub084K1NCMmlORWtTamxMRjhYeGFFbzF6NzFkTUVaRzVHd1V2UE9jTWpVSnRWODdQbll6RFFqdHl0Rnh1ZXpKUzU4bjhCR3M4SEViQmdzMXNvMzg5QlZtQi9WenpxQzR1SFpQS2tuaExqNFZmYkg2VkJ4c1VQc3BIOXdMbnZCcC80dlB0WlhLemJUMXlUWnBMTzJUNUsxc2MwZTFUWFl5UDJPM1AyYy96RlBLbmF0RU1IRUZBQXRYRy9FYlNTSExBYkxhZnRhVjBaYVZlZ2hDQ0p4cTdBczRlb1c3QzNGNXZwU1AxMG8yOXlsUzBzQ3pEZXBiL25FTGlMRTR5cWRPTTVVK3ZpS1FkcEhNNFp1TnNUNnhZL1NVRlhYNVl4ZG5jNURiK2ZjNEloZ0NZalBnUnl1RVNwdHBoUkFMblJFZmpVKzB4SDhMNmhYYmNIa2Zma0UrRU5tQmRveGNRTUhxZWJIRldEZFp2cWp5S1hHdU4wbjJNaENaSDlVZ083UmtFazgzSS9URHVLZ1VYLzMwT1crTU83cmRZTlI4ZE9FMEs5eW9pU0k4NVUySlcrd3NRb0dwdkduMmYrNWJ3MTFnTmM0VHBQQjBPVWVLeDhGZjJBRDg2ZTByUjNjUjZUZGZQR1IyR29ualZNOTdJT1dtUkhLUW9sRGpxME96bjZ4ZlcyNS9FOFRTTWYxSTllVm9BYkpkaGVFTGF4d3RPVTN1ZGxmbHhLM0F2RitmWUhZM1c2SDZmcWZGWjRHaS8xIn0="
    },
    "paymentMethodOptions": {
      "card": {
        "captureMethod": "automatic",
        "threeDsMethod": "CHALLENGE"
      }
    }
  }
}
```

**Detail Parameter Request**

<table><thead><tr><th width="217.60546875">Parameter</th><th width="119.98828125">Data Type</th><th width="127.69921875">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>paymentMethod</td><td>Object</td><td>M</td><td><a data-mention href="../object/payment-method-object">payment-method-object</a></td></tr><tr><td>paymentMethodOptions</td><td>Object</td><td>M</td><td><a data-mention href="../object/payment-method-options-object">payment-method-options-object</a></td></tr></tbody></table>

## Response

**Response Body**

```json
{
  "code": "00",
  "message": "Success",
  "data": {
    "id": "c4f2a951-18e7-4df8-a2bb-86957076191c",
    "clientReferenceId": "1759377986",
    "amount": {
      "value": 10000,
      "currency": "IDR"
    },
    "autoConfirm": false,
    "mode": "API",
    "redirectUrl": {
      "successReturnUrl": "https://merchant.com/success",
      "failureReturnUrl": "https://merchant.com/failure",
      "expirationReturnUrl": "https://merchant.com/expiration"
    },
    "paymentType": "SINGLE",
    "paymentMethod": {
      "type": "CARD",
      "card": {
        "token": "",
        "encryptedCard": "eyJFbmNyeXB0ZWRLZXkiOiJ0aHgzc25YdUZOU1NQdzlORWIwMEVvdzZSVWFlaFVjd2Yzc3JzTFNOaXpUSExYeG51WnVMb29jR1lxYVlkNTBEdkZDQUMvUzRBaTltSnZNdUwvc2N0TnJjL1UzMkNKa0M3WTdrYVc0ZTFvTWtlM2JZKzBURHRPdlJ1bGc3Y3NVc1FmcXRFUytkdGxKN2IyWVRxdml4Q1VMTnNxeWxRb2Y0WjRRZitQeWM2NzE5eVZUZkIzUEJ0VElOQTBiQlZJN1ErUDliN0c0Nk9ZVk5adW9BTXBPY2MyS3ZjdW5LUE1La2hlTDluM3lnZTFMTzVpenlyQU9JMXIzVWpROEdKYW55OTFqaXZTMjVVZVh4WktrYWZLalAyQ2ZlSzZJTi9HVlJReDNwRWhTb3BiSGFEYmh2STJrYlllT2REeGlQSFlMdkx2NnBlNTZFS0Y1RG9OUU5IeURGY2c9PSIsIk5vbmNlIjoiSS9McDRtRGp0TS9uNDRwVSIsIkNpcGhlcnRleHQiOiIvaVR5UCtQcUpnOTltcjBYTVh3cDNWZk5FOGVOeDVTYVN0bFFhMnI0c0FoZmZsZHArdXlHM3pyU3F5WGwwdnZHYjhZb1FIV2NCQzZRM3IxZTBwRTNjWEVlMklKSEVQc2pEUk04bS9VZnJIL0lRVUZndHJPbzNZNmk1bFdWQ0VYa0FyRTRDV21jVmdpRHhrcXVNd2hoR2Zub084K1NCMmlORWtTamxMRjhYeGFFbzF6NzFkTUVaRzVHd1V2UE9jTWpVSnRWODdQbll6RFFqdHl0Rnh1ZXpKUzU4bjhCR3M4SEViQmdzMXNvMzg5QlZtQi9WenpxQzR1SFpQS2tuaExqNFZmYkg2VkJ4c1VQc3BIOXdMbnZCcC80dlB0WlhLemJUMXlUWnBMTzJUNUsxc2MwZTFUWFl5UDJPM1AyYy96RlBLbmF0RU1IRUZBQXRYRy9FYlNTSExBYkxhZnRhVjBaYVZlZ2hDQ0p4cTdBczRlb1c3QzNGNXZwU1AxMG8yOXlsUzBzQ3pEZXBiL25FTGlMRTR5cWRPTTVVK3ZpS1FkcEhNNFp1TnNUNnhZL1NVRlhYNVl4ZG5jNURiK2ZjNEloZ0NZalBnUnl1RVNwdHBoUkFMblJFZmpVKzB4SDhMNmhYYmNIa2Zma0UrRU5tQmRveGNRTUhxZWJIRldEZFp2cWp5S1hHdU4wbjJNaENaSDlVZ083UmtFazgzSS9URHVLZ1VYLzMwT1crTU83cmRZTlI4ZE9FMEs5eW9pU0k4NVUySlcrd3NRb0dwdkduMmYrNWJ3MTFnTmM0VHBQQjBPVWVLeDhGZjJBRDg2ZTByUjNjUjZUZGZQR1IyR29ualZNOTdJT1dtUkhLUW9sRGpxME96bjZ4ZlcyNS9FOFRTTWYxSTllVm9BYkpkaGVFTGF4d3RPVTN1ZGxmbHhLM0F2RitmWUhZM1c2SDZmcWZGWjRHaS8xIn0=",
        "cvc": ""
      }
    },
    "statementDescriptor": "Reforza Pivot",
    "expirationMode": "STRICT",
    "status": "REQUIRE_ACTION",
    "createdAt": "2025-10-02T04:06:27Z",
    "updatedAt": "2025-10-02T04:07:08Z",
    "expiryAt": "2025-10-02T04:10:43Z",
    "paymentUrl": "https://creditcard-webview.harsya.com/payment/creditcard/threeds?client_transaction_id=1759377986&acquirer_transaction_id=TRXCC3ad24bf2330a17593780241&session_id=F78IuIMNO3Xqzh2TCQkHKoCnw6VFB6Da",
    "encryptionKey": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwKxJ35pMLkAzTxk1Uv9OGSGEqwmvi3SE1Gl91yE+HiWXsYvwKgdMhSPp/3LRHYPi1lTnXzEzdeEC7AD9v/t7xDZJYzfRnbg1bkKjTkAhVqaZOmzp0QQeUhe+UQI4Z8JeXiLgvDW0jMhzrMPegWLFXbZb403LpuCUvhjA21Ol3Ua82d0EjI8yQGgluRHhtU4/OszKwJYoMZ4G2/llK5dDa41LxIOwcEj/ka2XpYxuY+jW+E3dji1KLDEywIhA1wA/CSJIgKOtjBa21JIbzLdknrS2YXSs0JibSB86lDDONPuqQoEcHS9/mM5PBceXk6Koz12iKVBjBbT9Eju2yKL5DQIDAQAB",
    "chargeDetails": [
      {
        "id": "452ead84-63ee-4c76-84e4-d01ad3d806c2",
        "paymentSessionId": "c4f2a951-18e7-4df8-a2bb-86957076191c",
        "paymentSessionClientReferenceId": "1759377986",
        "amount": {
          "value": 10000,
          "currency": "IDR"
        },
        "statementDescriptor": "Reforza Pivot",
        "status": "WAITING_FOR_USER_ACTION",
        "authorizedAmount": null,
        "capturedAmount": null,
        "isCaptured": false,
        "createdAt": "2025-10-02T04:07:07.817691642Z",
        "updatedAt": "2025-10-02T04:07:07.817692232Z",
        "paidAt": null,
        "card": {
          "first6": "999999",
          "first8": "99996666",
          "last4": "6666",
          "expMonth": "09",
          "expYear": "06",
          "binInformations": {
            "type": "CREDIT",
            "issuingBank": "PT BANK BTPN TBK",
            "brand": "VISA",
            "country": "ID"
          },
          "authenticationResult": {
            "threeDsVersion": "3DS2",
            "threeDsResult": "",
            "threeDsMethod": "",
            "eciCode": ""
          },
          "authorizationResult": null
        }
      }
    ],
    "metadata": {
      "invoiceNo": "INV001"
    }
  }
}
```

**Detail Parameter Response**&#x20;

| Parameter       | Data Type | Requirement | Description                                                                                                                                     |
| --------------- | --------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Payment Session | Object    | M           | [payment-session-object](https://pivot-payment.gitbook.io/pivot-docs/api-references/api-lists/payments/object/payment-session-object "mention") |



# Retrieve Payment Session Details

## Retrieve Payment Session by ID

### Method and URL

<mark style="color:green;">`GET`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v2/payments/{id}

<mark style="color:orange;">`id`</mark> from the Payment Session ID whenever you create Payment Session

### Response

**Response Body**

```json
{
  "code": "00",
  "message": "Success",
  "data": {
    "id": "bca0b57a-391e-4f6f-bfef-8cd37492ee5b",
    "clientReferenceId": "1750758552",
    "amount": {
      "value": 10001,
      "currency": "IDR"
    },
    "autoConfirm": true,
    "mode": "REDIRECT",
    "redirectUrl": {
      "successReturnUrl": "https://merchan.com/success",
      "failureReturnUrl": "https://merchant.com/failed",
      "expirationReturnUrl": "https://merchant.com/expired"
    },
    "paymentType": "SINGLE",
    "paymentMethod": {
      "type": "CARD"
    },
    "statementDescriptor": "Reforza Pivot",
    "saveForFutureUse": false,
    "showSavedPayment": false,
    "expirationMode": "LOOSE",
    "status": "PAID",
    "investigationStatus": null,
    "createdAt": "2025-06-24T09:49:13Z",
    "updatedAt": "2025-06-24T09:56:40Z",
    "expiryAt": "2025-12-30T23:59:00Z",
    "paymentUrl": "https://pay-stg.pivot-payment.com/detail?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiYmNhMGI1N2EtMzkxZS00ZjZmLWJmZWYtOGNkMzc0OTJlZTViIiwiaXNzIjoiYmFja2VuZC1wb3J0YWwiLCJleHAiOjE3NjcxMzkxNDB9.yvVXKEgcbJucCACggQLaFZQmnqkzvDAfK56kcNY625o",
    "chargeDetails": [
      {
        "id": "cf2842f4-e263-4643-8bc9-af682a5060cd",
        "paymentSessionId": "bca0b57a-391e-4f6f-bfef-8cd37492ee5b",
        "paymentSessionClientReferenceId": "1750758552",
        "amount": {
          "value": 10001,
          "currency": "IDR"
        },
        "statementDescriptor": "Reforza Pivot",
        "status": "SUCCESS",
        "authorizedAmount": {
          "value": 10001,
          "currency": "IDR"
        },
        "capturedAmount": {
          "value": 10001,
          "currency": "IDR"
        },
        "isCaptured": true,
        "createdAt": "2025-06-24T09:49:12.861006Z",
        "updatedAt": "2025-06-24T09:56:40.020691Z",
        "paidAt": "2025-06-24T09:56:39Z",
        "fdsRiskAssessment": {
          "score": "0",
          "level": "very low",
          "recommendation": "Approve",
          "status": "PASSED",
          "evaluatedAt": "2025-06-24T09:56:39.411921983Z"
        },
        "card": {
          "first6": "999999",
          "first8": "99999966",
          "last4": "0001",
          "expMonth": "01",
          "expYear": "39",
          "fingerprint": "03765362-4f67-41c6-a6c7-4a7520dcbc36",
          "binInformations": {
            "type": "DEBIT",
            "issuingBank": "BRI",
            "brand": "VISA",
            "country": "ID"
          },
          "authenticationResult": {
            "threeDsVersion": "2.2.0",
            "threeDsResult": "AUTHENTICATION_SUCCESSFUL",
            "threeDsMethod": "",
            "eciCode": "02"
          },
          "authorizationResult": {
            "acquirerReferenceNumber": "123456789",
            "retrievalReferenceNumber": "TRXCC7c364322b98717507589132",
            "stan": "104539",
            "avsResult": "",
            "cvvResult": "",
            "authorizedAmount": {
              "value": 10001,
              "currency": "IDR"
            },
            "issuerAuthorizationCode": "00"
          }
        },
        "captureHistories": null
      }
    ],
    "customerId": "0197e3f5-1a17-7d43-b2f9-1b51479fb8a9",
    "customer": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990003"
      },
      "refundPreference": {
        "method": "AUTO",
        "transferDestination": {
          "channelCode": "014",
          "channelInformation": {
            "accountNumber": "17677665415",
            "accountName": "Reforza Jordan Geotama"
          }
        }
      },
      "storePaymentMethods": null
    },
    "metadata": {
      "invoiceNo": "INV001"
    },
    "bypassStatusPage": false
  }
}
```

**Detail Parameter Response**

<table><thead><tr><th width="216.8359375">Parameter</th><th width="108.55859375">Data Type</th><th width="123.18359375">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>Payment Session</td><td>Object</td><td>M</td><td><a data-mention href="../object/payment-session-object">payment-session-object</a></td></tr></tbody></table>

## Retrieve Payment Session by Client Reference ID

### Method and URL

<mark style="color:green;">`GET`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v2/payments?clientReferenceId={clientReferenceId}

<mark style="color:orange;">`clientReferenceId`</mark> from the Request body you send whenever you create Payment Session

### Response

**Response Body**

```json
{
  "code": "00",
  "message": "Success",
  "data": [
    {
      "id": "bca0b57a-391e-4f6f-bfef-8cd37492ee5b",
      "clientReferenceId": "1750758552",
      "amount": {
        "value": 10001,
        "currency": "IDR"
      },
      "autoConfirm": true,
      "mode": "REDIRECT",
      "redirectUrl": {
        "successReturnUrl": "https://merchan.com/success",
        "failureReturnUrl": "https://merchant.com/failed",
        "expirationReturnUrl": "https://merchant.com/expired"
      },
      "paymentType": "SINGLE",
      "paymentMethod": {
        "type": "CARD"
      },
      "statementDescriptor": "Reforza Pivot",
      "saveForFutureUse": false,
      "showSavedPayment": false,
      "expirationMode": "LOOSE",
      "status": "PAID",
      "investigationStatus": null,
      "createdAt": "2025-06-24T09:49:13Z",
      "updatedAt": "2025-06-24T09:56:40Z",
      "expiryAt": "2025-12-30T23:59:00Z",
      "paymentUrl": "https://pay-stg.pivot-payment.com/detail?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiYmNhMGI1N2EtMzkxZS00ZjZmLWJmZWYtOGNkMzc0OTJlZTViIiwiaXNzIjoiYmFja2VuZC1wb3J0YWwiLCJleHAiOjE3NjcxMzkxNDB9.yvVXKEgcbJucCACggQLaFZQmnqkzvDAfK56kcNY625o",
      "chargeDetails": [
        {
          "id": "cf2842f4-e263-4643-8bc9-af682a5060cd",
          "paymentSessionId": "bca0b57a-391e-4f6f-bfef-8cd37492ee5b",
          "paymentSessionClientReferenceId": "1750758552",
          "amount": {
            "value": 10001,
            "currency": "IDR"
          },
          "statementDescriptor": "Reforza Pivot",
          "status": "SUCCESS",
          "authorizedAmount": {
            "value": 10001,
            "currency": "IDR"
          },
          "capturedAmount": {
            "value": 10001,
            "currency": "IDR"
          },
          "isCaptured": true,
          "createdAt": "2025-06-24T09:49:12.861006Z",
          "updatedAt": "2025-06-24T09:56:40.020691Z",
          "paidAt": "2025-06-24T09:56:39Z",
          "fdsRiskAssessment": {
            "score": "0",
            "level": "very low",
            "recommendation": "Approve",
            "status": "PASSED",
            "evaluatedAt": "2025-06-24T09:56:39.411921983Z"
          },
          "card": {
            "first6": "999999",
            "first8": "99999966",
            "last4": "0001",
            "expMonth": "01",
            "expYear": "39",
            "fingerprint": "03765362-4f67-41c6-a6c7-4a7520dcbc36",
            "binInformations": {
              "type": "DEBIT",
              "issuingBank": "BRI",
              "brand": "VISA",
              "country": "ID"
            },
            "authenticationResult": {
              "threeDsVersion": "2.2.0",
              "threeDsResult": "AUTHENTICATION_SUCCESSFUL",
              "threeDsMethod": "",
              "eciCode": "02"
            },
            "authorizationResult": {
              "acquirerReferenceNumber": "123456789",
              "retrievalReferenceNumber": "TRXCC7c364322b98717507589132",
              "stan": "104539",
              "avsResult": "",
              "cvvResult": "",
              "authorizedAmount": {
                "value": 10001,
                "currency": "IDR"
              },
              "issuerAuthorizationCode": "00"
            }
          },
          "captureHistories": null
        }
      ],
      "customerId": "0197e3f5-1a17-7d43-b2f9-1b51479fb8a9",
      "customer": {
        "givenName": "Reforza Jordan",
        "surname": "Geotama",
        "email": "reforza@pivot-payment.com",
        "phoneNumber": {
          "countryCode": "+62",
          "number": "89699990003"
        },
        "refundPreference": {
          "method": "AUTO",
          "transferDestination": {
            "channelCode": "014",
            "channelInformation": {
              "accountNumber": "17677665415",
              "accountName": "Reforza Jordan Geotama"
            }
          }
        },
        "storePaymentMethods": null
      },
      "metadata": {
        "invoiceNo": "INV001"
      },
      "bypassStatusPage": false
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 10,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

**Detail Parameter Response**

<table><thead><tr><th width="196.46875">Parameter</th><th width="112.859375">Data Type</th><th width="130.65625">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>Payment Session</td><td>Object</td><td>M</td><td><a data-mention href="../object/payment-session-object">payment-session-object</a></td></tr><tr><td>pagination</td><td>Object</td><td>M</td><td><a data-mention href="../../../api-information/pagination">pagination</a></td></tr></tbody></table>


# Retrieve list of Payment Sessions

## Method and URL

<mark style="color:green;">`GET`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v2/payments

## Response

**Response Body**

```json
{
  "code": "00",
  "message": "Success",
  "data": [
    {
      "id": "bca0b57a-391e-4f6f-bfef-8cd37492ee5b",
      "clientReferenceId": "1750758552",
      "amount": {
        "value": 10001,
        "currency": "IDR"
      },
      "autoConfirm": true,
      "mode": "REDIRECT",
      "redirectUrl": {
        "successReturnUrl": "https://merchant.com/success",
        "failureReturnUrl": "https://merchant.com/failed",
        "expirationReturnUrl": "https://merchant.com/expired"
      },
      "paymentType": "SINGLE",
      "paymentMethod": {
        "type": "CARD"
      },
      "statementDescriptor": "Reforza Pivot",
      "saveForFutureUse": false,
      "showSavedPayment": false,
      "expirationMode": "LOOSE",
      "status": "PAID",
      "investigationStatus": null,
      "createdAt": "2025-06-24T09:49:13Z",
      "updatedAt": "2025-06-24T09:56:40Z",
      "expiryAt": "2025-12-30T23:59:00Z",
      "paymentUrl": "https://pay-stg.pivot-payment.com/detail?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiYmNhMGI1N2EtMzkxZS00ZjZmLWJmZWYtOGNkMzc0OTJlZTViIiwiaXNzIjoiYmFja2VuZC1wb3J0YWwiLCJleHAiOjE3NjcxMzkxNDB9.yvVXKEgcbJucCACggQLaFZQmnqkzvDAfK56kcNY625o",
      "chargeDetails": [
        {
          "id": "cf2842f4-e263-4643-8bc9-af682a5060cd",
          "paymentSessionId": "bca0b57a-391e-4f6f-bfef-8cd37492ee5b",
          "paymentSessionClientReferenceId": "1750758552",
          "amount": {
            "value": 10001,
            "currency": "IDR"
          },
          "statementDescriptor": "Reforza Pivot",
          "status": "SUCCESS",
          "authorizedAmount": {
            "value": 10001,
            "currency": "IDR"
          },
          "capturedAmount": {
            "value": 10001,
            "currency": "IDR"
          },
          "isCaptured": true,
          "createdAt": "2025-06-24T09:49:12.861006Z",
          "updatedAt": "2025-06-24T09:56:40.020691Z",
          "paidAt": "2025-06-24T09:56:39Z",
          "fdsRiskAssessment": {
            "score": "0",
            "level": "very low",
            "recommendation": "Approve",
            "status": "PASSED",
            "evaluatedAt": "2025-06-24T09:56:39.411921983Z"
          },
          "card": {
            "first6": "999999",
            "first8": "99999966",
            "last4": "0001",
            "expMonth": "01",
            "expYear": "39",
            "fingerprint": "03765362-4f67-41c6-a6c7-4a7520dcbc36",
            "binInformations": {
              "type": "DEBIT",
              "issuingBank": "BRI",
              "brand": "VISA",
              "country": "ID"
            },
            "authenticationResult": {
              "threeDsVersion": "2.2.0",
              "threeDsResult": "AUTHENTICATION_SUCCESSFUL",
              "threeDsMethod": "",
              "eciCode": "02"
            },
            "authorizationResult": {
              "acquirerReferenceNumber": "123456789",
              "retrievalReferenceNumber": "TRXCC7c364322b98717507589132",
              "stan": "104539",
              "avsResult": "",
              "cvvResult": "",
              "authorizedAmount": {
                "value": 10001,
                "currency": "IDR"
              },
              "issuerAuthorizationCode": "00"
            }
          },
          "captureHistories": null
        }
      ],
      "metadata": {
        "invoiceNo": "INV001"
      },
      "bypassStatusPage": false
    },
    {
      "id": "1a857708-8227-4d25-98f4-57d38d207f6d",
      "clientReferenceId": "1753772327",
      "amount": {
        "value": 10100,
        "currency": "IDR"
      },
      "autoConfirm": true,
      "mode": "API",
      "redirectUrl": {
        "successReturnUrl": "https://merchant.com/success",
        "failureReturnUrl": "https://merchant.com/failed",
        "expirationReturnUrl": "https://merchant.com/expired"
      },
      "paymentType": "MULTIPLE",
      "paymentMethod": {
        "type": "VIRTUAL_ACCOUNT",
        "virtualAccount": {
          "channel": "PERMATA",
          "virtualAccountNumber": "7698013100000063",
          "virtualAccountName": "Reforza Pivot",
          "expiryAt": "0001-01-01T00:00:00Z"
        }
      },
      "statementDescriptor": "Reforza Pivot",
      "saveForFutureUse": false,
      "showSavedPayment": false,
      "status": "ACTIVE",
      "investigationStatus": null,
      "createdAt": "2025-07-29T06:58:48Z",
      "updatedAt": "2025-07-29T06:59:50Z",
      "expiryAt": "2025-07-31T03:35:00Z",
      "chargeDetails": [
        {
          "id": "019854fa-f83c-72f3-adec-1bc1530cea75",
          "paymentSessionId": "1a857708-8227-4d25-98f4-57d38d207f6d",
          "paymentSessionClientReferenceId": "1753772327",
          "amount": {
            "value": 10100,
            "currency": "IDR"
          },
          "statementDescriptor": "",
          "status": "SUCCESS",
          "authorizedAmount": {
            "value": 10100,
            "currency": "IDR"
          },
          "capturedAmount": {
            "value": 10100,
            "currency": "IDR"
          },
          "isCaptured": true,
          "createdAt": "2025-07-29T06:59:50.467898Z",
          "updatedAt": "2025-07-29T06:59:50.467899Z",
          "paidAt": "2025-07-29T06:59:50Z",
          "virtualAccount": {
            "channel": "PERMATA",
            "virtualAccountNumber": "7698013100000063",
            "virtualAccountName": "Reforza Pivot",
            "expiryAt": "0001-01-01T00:00:00Z"
          }
        },
        {
          "id": "019854fa-f2ea-70ec-bf28-6f491216cc4a",
          "paymentSessionId": "1a857708-8227-4d25-98f4-57d38d207f6d",
          "paymentSessionClientReferenceId": "1753772327",
          "amount": {
            "value": 10100,
            "currency": "IDR"
          },
          "statementDescriptor": "",
          "status": "SUCCESS",
          "authorizedAmount": {
            "value": 10100,
            "currency": "IDR"
          },
          "capturedAmount": {
            "value": 10100,
            "currency": "IDR"
          },
          "isCaptured": true,
          "createdAt": "2025-07-29T06:59:49.107748Z",
          "updatedAt": "2025-07-29T06:59:49.107748Z",
          "paidAt": "2025-07-29T06:59:49Z",
          "virtualAccount": {
            "channel": "PERMATA",
            "virtualAccountNumber": "7698013100000063",
            "virtualAccountName": "Reforza Pivot",
            "expiryAt": "0001-01-01T00:00:00Z"
          }
        },
        {
          "id": "019854fa-eed6-74af-9af1-cd198ac6d0e7",
          "paymentSessionId": "1a857708-8227-4d25-98f4-57d38d207f6d",
          "paymentSessionClientReferenceId": "1753772327",
          "amount": {
            "value": 10100,
            "currency": "IDR"
          },
          "statementDescriptor": "",
          "status": "SUCCESS",
          "authorizedAmount": {
            "value": 10100,
            "currency": "IDR"
          },
          "capturedAmount": {
            "value": 10100,
            "currency": "IDR"
          },
          "isCaptured": true,
          "createdAt": "2025-07-29T06:59:48.063058Z",
          "updatedAt": "2025-07-29T06:59:48.063058Z",
          "paidAt": "2025-07-29T06:59:48Z",
          "virtualAccount": {
            "channel": "PERMATA",
            "virtualAccountNumber": "7698013100000063",
            "virtualAccountName": "Reforza Pivot",
            "expiryAt": "0001-01-01T00:00:00Z"
          }
        },
        {
          "id": "019854fa-9b74-7201-b5f5-176b11a3025c",
          "paymentSessionId": "1a857708-8227-4d25-98f4-57d38d207f6d",
          "paymentSessionClientReferenceId": "1753772327",
          "amount": {
            "value": 10100,
            "currency": "IDR"
          },
          "statementDescriptor": "",
          "status": "SUCCESS",
          "authorizedAmount": {
            "value": 10100,
            "currency": "IDR"
          },
          "capturedAmount": {
            "value": 10100,
            "currency": "IDR"
          },
          "isCaptured": true,
          "createdAt": "2025-07-29T06:59:26.717841Z",
          "updatedAt": "2025-07-29T06:59:26.717841Z",
          "paidAt": "2025-07-29T06:59:27Z",
          "virtualAccount": {
            "channel": "PERMATA",
            "virtualAccountNumber": "7698013100000063",
            "virtualAccountName": "Reforza Pivot",
            "expiryAt": "0001-01-01T00:00:00Z"
          }
        }
      ],
      "metadata": {
        "invoiceNo": "INV001"
      },
      "bypassStatusPage": false
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 10,
    "totalItems": 2,
    "totalPages": 1
  }
}
```

**Detail Parameter Response**

<table><thead><tr><th width="216.1484375">Parameter</th><th width="117.94921875">Data Type</th><th width="128.16796875">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>Payment Session</td><td>Array of Object</td><td>M</td><td><a data-mention href="../object/payment-session-object">payment-session-object</a></td></tr><tr><td>pagination</td><td>Object</td><td>M</td><td><a data-mention href="../../../api-information/pagination">pagination</a></td></tr></tbody></table>


# Cancel Payment Session

## Method and URL

<mark style="color:green;">`POST`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v2/payments/{id}/cancel

<mark style="color:orange;">`id`</mark> from the Payment Session ID whenever you create Payment Session

{% hint style="info" %}
Cancellation can be done if the Payment Session status is <mark style="color:orange;">`REQUIRE_CONFIRMATION`</mark> or <mark style="color:orange;">`REQUIRE_PAYMENT_METHOD`</mark>&#x20;
{% endhint %}

## Request

**Request Body**

```json
{
  "cancellationReason": "REQUESTED_BY_CUSTOMER"
}
```

**Detail Parameter Request**

<table><thead><tr><th>Parameter</th><th width="127.6884765625">Data Type</th><th width="139.7060546875">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>cancellationReason</td><td>String</td><td>M</td><td>Reason to cancel Payment Session</td></tr></tbody></table>

## Response

**Response Body**

```json
{
  "code": "00",
  "message": "Success",
  "data": {
    "id": "f5011fb2-e205-46ad-ac20-481429ba1d32",
    "clientReferenceId": "1743343932",
    "amount": {
      "value": 10000,
      "currency": "IDR"
    },
    "autoConfirm": false,
    "mode": "REDIRECT",
    "redirectUrl": {
      "successReturnUrl": "https://merchant.com/success",
      "failureReturnUrl": "https://merchant.com/failure",
      "expirationReturnUrl": "https://merchant.com/expiration"
    },
    "paymentType": "SINGLE",
    "paymentMethod": null,
    "statementDescriptor": "Reforza Pivot",
    "saveForFutureUse": false,
    "showSavedPayment": false,
    "expirationMode": "LOOSE",
    "status": "CANCELLED",
    "createdAt": "2025-03-30T14:12:12Z",
    "updatedAt": "2025-03-30T14:12:28.231875669Z",
    "expiryAt": "2025-03-30T14:12:28.231875669Z",
    "paymentUrl": "https://payment.pivot-payment.com/detail?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiZjUwMTFmYjItZTIwNS00NmFkLWFjMjAtNDgxNDI5YmExZDMyIiwiaXNzIjoiYmFja2VuZC1wb3J0YWwiLCJleHAiOjE3NDM0NjU1NDV9.DsupgNf0F-IfinTSvQd_2Y6iEIrk8Mr7WcNGATGtYqs",
    "chargeDetails": null,
    "cancelledAt": "2025-03-30T14:12:28.231875669Z",
    "cancellationReason": "REQUESTED_BY_CUSTOMER",
    "metadata": {
      "invoiceNo": "INV001"
    },
    "bypassStatusPage": false
  }
}
```

**Detail Parameter Response**

<table><thead><tr><th width="208.9453125">Parameter</th><th width="111.5390625">Data Type</th><th width="132.98828125">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>Payment Session</td><td>Object</td><td>M</td><td><a data-mention href="../object/payment-session-object">payment-session-object</a></td></tr></tbody></table>


# Capture

## Method and URL

<mark style="color:green;">`POST`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v2/payments/{id}/capture

<mark style="color:orange;">`id`</mark> from the Payment Session ID whenever you create Payment Session

## Request

**Request Body**

```json
{
  "releaseRemainingAmount": true,
  "amount": {
    "currency": "IDR",
    "value": 12000
  }
}
```

**Detail Parameter Request**

<table><thead><tr><th width="217.60546875">Parameter</th><th width="119.98828125">Data Type</th><th width="137.298828125">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>releaseRemainingAmount</td><td>Object</td><td>M</td><td>Choose either <mark style="color:orange;"><code>true</code></mark> or <mark style="color:orange;"><code>false</code></mark>, to  void the remaining authorized amount</td></tr><tr><td>amount</td><td>Object</td><td>C</td><td><a data-mention href="object/amount-object">amount-object</a></td></tr></tbody></table>

## Response

**Response Body**

```json
{
  "code": "00",
  "message": "Success",
  "data": {
    "id": "019c0d24-ec94-74b5-a4b7-b4da305bc41a",
    "paymentSessionId": "e03c2066-9e5b-454c-add6-c7c85b0b9d6b",
    "paymentSessionClientReferenceId": "1769746960",
    "releaseRemainingAmount": true,
    "amount": {
      "value": 12000,
      "currency": "IDR"
    },
    "status": "PENDING",
    "createdAt": "2026-01-30T04:24:09.620309094Z",
    "updatedAt": "2026-01-30T04:24:09.620309237Z"
  }
}
```

**Detail Parameter Response**&#x20;

<table><thead><tr><th width="197.9619140625">Parameter</th><th width="114.29296875">Data Type</th><th width="138.7783203125">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>id</td><td>String</td><td>M</td><td>Unique Capture ID</td></tr><tr><td>paymentSessionId</td><td>String</td><td>M</td><td>Payments Session Id</td></tr><tr><td>PaymentSessionClientReferenceId</td><td>Alphanumeric</td><td>M</td><td>Payment Session merchant reference Id</td></tr><tr><td>amount</td><td>Object</td><td>M</td><td><a data-mention href="object/amount-object">amount-object</a></td></tr><tr><td>status</td><td>String</td><td>M</td><td>Status of Capture:<br>1. PENDING<br>2. SUCCESS<br>3. FAILED</td></tr><tr><td>createdAt</td><td>String</td><td>Auto generated</td><td>Created time with format YYYY-MM-DDTHH:MM:SSZ</td></tr><tr><td>updatedAt</td><td>String</td><td>Auto generated</td><td>Updated time with format YYYY-MM-DDTHH:MM:SSZ</td></tr></tbody></table>


# Retrieve Charge Details

## Method and URL

<mark style="color:green;">`GET`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v2/charges?clientReferenceId={clientReferenceId}

<mark style="color:orange;">`clientReferenceIdd`</mark> from the Request Body you send whenever you create Payment Session

## Response

**Response Body**

```json
{
  "code": "00",
  "message": "Success",
  "data": [
    {
      "id": "cf2842f4-e263-4643-8bc9-af682a5060cd",
      "paymentSessionId": "bca0b57a-391e-4f6f-bfef-8cd37492ee5b",
      "paymentSessionClientReferenceId": "1750758552",
      "amount": {
        "value": 10001,
        "currency": "IDR"
      },
      "statementDescriptor": "Reforza Pivot",
      "status": "SUCCESS",
      "authorizedAmount": {
        "value": 10001,
        "currency": "IDR"
      },
      "capturedAmount": {
        "value": 10001,
        "currency": "IDR"
      },
      "isCaptured": true,
      "createdAt": "2025-06-24T09:49:12.861006Z",
      "updatedAt": "2025-06-24T09:56:40.020691Z",
      "paidAt": "2025-06-24T09:56:39Z",
      "fdsRiskAssessment": {
        "score": "0",
        "level": "very low",
        "recommendation": "Approve",
        "status": "PASSED",
        "evaluatedAt": "2025-06-24T09:56:39.411921983Z"
      },
      "card": {
        "first6": "999999",
        "first8": "99999966",
        "last4": "0001",
        "expMonth": "01",
        "expYear": "39",
        "fingerprint": "03765362-4f67-41c6-a6c7-4a7520dcbc36",
        "binInformations": {
          "type": "DEBIT",
          "issuingBank": "BRI",
          "brand": "VISA",
          "country": "ID"
        },
        "authenticationResult": {
          "threeDsVersion": "2.2.0",
          "threeDsResult": "AUTHENTICATION_SUCCESSFUL",
          "threeDsMethod": "",
          "eciCode": "02"
        },
        "authorizationResult": {
          "acquirerReferenceNumber": "123456789",
          "retrievalReferenceNumber": "TRXCC7c364322b98717507589132",
          "stan": "104539",
          "avsResult": "",
          "cvvResult": "",
          "authorizedAmount": {
            "value": 10001,
            "currency": "IDR"
          },
          "issuerAuthorizationCode": "00"
        }
      },
      "captureHistories": null,
      "virtualAccount": null,
      "qr": null,
      "ewallet": null,
      "failureCode": null,
      "failureMessage": null,
      "recommendation": null
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 10,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

**Detail Parameter Response**

<table><thead><tr><th width="204.53515625">Parameter</th><th width="127.68359375">Data Type</th><th width="134.5078125">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>chargeDetails</td><td>Array of Objects</td><td>M</td><td><a data-mention href="object/charge-object">charge-object</a></td></tr><tr><td>pagination</td><td>Object</td><td>M</td><td><a data-mention href="../../api-information/pagination">pagination</a></td></tr></tbody></table>


# Payment Callback

## Method and URL

<mark style="color:green;">`POST`</mark> [www.yourcompany.com/payment\\\_callback\\\_url](http://www.yourcompany.com/payment\\_callback\\_url)

## Request

**Header Request**

<table><thead><tr><th>Parameter </th><th width="117">Data Type</th><th width="131">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>X-API-Key</td><td>String</td><td>M</td><td>Callback API Key, an additional API Key used specifically for receiving callbacks</td></tr><tr><td>Content-Type</td><td>String</td><td>M</td><td>application/JSON</td></tr><tr><td>Accept</td><td>String</td><td>M</td><td>application/JSON</td></tr></tbody></table>

**Request Body**

```json
{
  "event": "PAYMENT.PAID",
  "data": {
    "id": "bca0b57a-391e-4f6f-bfef-8cd37492ee5b",
    "clientReferenceId": "1750758552",
    "amount": {
      "value": 10001,
      "currency": "IDR"
    },
    "autoConfirm": true,
    "mode": "REDIRECT",
    "redirectUrl": {
      "successReturnUrl": "https://merchant.com/success",
      "failureReturnUrl": "https://merchant.com/failed",
      "expirationReturnUrl": "https://merchant.com/expired"
    },
    "paymentType": "SINGLE",
    "paymentMethod": {
      "type": "CARD"
    },
    "statementDescriptor": "Reforza Pivot",
    "saveForFutureUse": false,
    "showSavedPayment": false,
    "status": "PAID",
    "investigationStatus": null,
    "createdAt": "2025-06-24T09:49:13Z",
    "updatedAt": "2025-06-24T09:56:40.020691396Z",
    "expiryAt": "2025-12-30T23:59:00Z",
    "paymentUrl": "https://pay-stg.pivot-payment.com/detail?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiYmNhMGI1N2EtMzkxZS00ZjZmLWJmZWYtOGNkMzc0OTJlZTViIiwiaXNzIjoiYmFja2VuZC1wb3J0YWwiLCJleHAiOjE3NjcxMzkxNDB9.yvVXKEgcbJucCACggQLaFZQmnqkzvDAfK56kcNY625o",
    "chargeDetails": [
      {
        "id": "cf2842f4-e263-4643-8bc9-af682a5060cd",
        "paymentSessionId": "bca0b57a-391e-4f6f-bfef-8cd37492ee5b",
        "paymentSessionClientReferenceId": "1750758552",
        "amount": {
          "value": 10001,
          "currency": "IDR"
        },
        "statementDescriptor": "Reforza Pivot",
        "status": "SUCCESS",
        "authorizedAmount": {
          "value": 10001,
          "currency": "IDR"
        },
        "capturedAmount": {
          "value": 10001,
          "currency": "IDR"
        },
        "isCaptured": true,
        "createdAt": "2025-06-24T09:49:12.861006Z",
        "updatedAt": "2025-06-24T09:56:40.020691Z",
        "paidAt": "2025-06-24T09:56:39Z",
        "fdsRiskAssessment": {
          "score": "0",
          "level": "very low",
          "recommendation": "Approve",
          "status": "PASSED",
          "evaluatedAt": "2025-06-24T09:56:39Z"
        },
        "card": {
          "first6": "444000",
          "first8": "44400001",
          "last4": "0002",
          "expMonth": "01",
          "expYear": "39",
          "binInformations": {
            "type": "DEBIT",
            "issuingBank": "UNKNOWN",
            "brand": "VISA",
            "country": "ID"
          },
          "authenticationResult": {
            "threeDsVersion": "2.2.0",
            "threeDsResult": "AUTHENTICATION_SUCCESSFUL",
            "threeDsMethod": "",
            "eciCode": "00"
          },
          "authorizationResult": {
            "acquirerReferenceNumber": "123456789",
            "retrievalReferenceNumber": "TRXCCfd7d4b1877e117696670881",
            "stan": "104539",
            "avsResult": "",
            "cvvResult": "",
            "authorizedAmount": {
              "value": 100000,
              "currency": "IDR"
            },
            "issuerAuthorizationCode": "00"
          }
        },
        "captureHistories": null
      }
    ],
    "customerId": "0197e3f5-1a17-7d43-b2f9-1b51479fb8a9",
    "customer": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990003"
      },
      "refundPreference": {
        "method": "AUTO",
        "transferDestination": {
          "channelCode": "014",
          "channelInformation": {
            "accountNumber": "17677665415",
            "accountName": "Reforza Jordan Geotama"
          }
        }
      },
      "storePaymentMethods": null
    },
    "metadata": {
      "invoiceNo": "INV001"
    },
    "bypassStatusPage": false
  }
}
```

**Detail Parameter Request**

<table><thead><tr><th width="196.24609375">Parameter</th><th width="120">Data Type</th><th width="128">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>event</td><td>String</td><td>M</td><td><p>List of Event Names:</p><ol><li>PAYMENT.PROCESSING</li><li>PAYMENT.PAID </li><li>CHARGE.SUCCESS</li><li>PAYMENT.CANCELLED</li></ol><p><br>Explanation:</p><ul><li><mark style="color:orange;"><code>PAYMENT.PAID</code></mark> will be sent once the Customer successfully charges the Payment with the Payment Type = <mark style="color:orange;"><code>SINGLE</code></mark></li><li><mark style="color:orange;"><code>CHARGE.SUCCESS</code></mark> will be sent once the Customer successfully charges the Payment with the Payment Type = <mark style="color:orange;"><code>MULTIPLE</code></mark></li></ul></td></tr><tr><td>Payment Session</td><td>Object</td><td>M</td><td><a data-mention href="object/payment-session-object">payment-session-object</a></td></tr></tbody></table>


# Payment Simulation

## Simulate via API

### Method and URL

<mark style="color:green;">`POST`</mark> <https://api-stg.pivot-payment.com/v2/payments/simulations>

{% hint style="info" %}
Applicable only for "QRIS",  "Virtual Account", and "E-Wallet" Payment Methods in the Testing environment
{% endhint %}

### Request

**Request Body**

```json
{
  "paymentSessionId": "c09ec1fd-e19e-4a84-ba1e-0b4a8f6283ee",
  "chargeStatus": "SUCCESS",
  "amount": {
    "value": 10000,
    "currency": "IDR"
  }
}
```

**Detail Parameter Request**

<table><thead><tr><th>Parameter</th><th width="132.98046875">Data Type</th><th width="119.09375">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>paymentSessionId</td><td>String</td><td>M</td><td>Payment session ID</td></tr><tr><td>chargeStatus</td><td>String</td><td>M</td><td><p>Possible values: </p><ol><li>SUCCESS</li><li>EXPIRED</li></ol></td></tr><tr><td>amount</td><td>Object</td><td>C</td><td><p><a data-mention href="object/amount-object">amount-object</a></p><p>Mandatory if Payment Type is <mark style="color:orange;"><code>MULTIPLE</code></mark></p></td></tr></tbody></table>

### Response

**Response Body**

```json
{
  "code": "00",
  "message": "Success",
  "data": {
    "updated": "true"
  }
}
```

**Detail Parameter Response**

<table><thead><tr><th width="210.4765625">Parameter</th><th width="119.98046875">Data Type</th><th width="137.9453125">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>updated</td><td>Boolean</td><td>M</td><td></td></tr></tbody></table>

## Simulate via Dashboard

### Cards

<table><thead><tr><th width="246.3125">Scenario</th><th>Need Mock 3DS</th><th width="191.65625">Visa</th><th width="190.26953125">Mastercard</th><th width="190.578125">JCB</th></tr></thead><tbody><tr><td>Charge Success - 3DS (Frictionless)</td><td>No</td><td>4440000112200001</td><td>5550000112230001</td><td>3550000112280001</td></tr><tr><td>Charge Success - 3DS &#x26; Non 3DS (Challege &#x26; Never)</td><td>Yes</td><td>4440000112290002</td><td>5550000112220002</td><td>3550000112270002</td></tr><tr><td>DECLINED_BY_CHANNEL -  The transaction was declined by the channel</td><td>Yes</td><td>4440000334480001</td><td>5550000334410001</td><td>3550000334460001</td></tr><tr><td>DECLINED_BY_CHANNEL - The transaction was declined by the issuer due to the card has already expired</td><td>Yes</td><td>4440000334470002</td><td>5550000334400002</td><td>3550000334450002</td></tr><tr><td>DECLINED_BY_CHANNEL - The transaction was declined by the issuer due to the submitted CVV is invalid</td><td>Yes</td><td>4440000334460003</td><td>5550000334490003</td><td>3550000334440003</td></tr><tr><td>INVALID_ACCOUNT - The transaction was declined by the issuer due to the card being marked as invalid</td><td>Yes</td><td>4440000334450004</td><td>5550000334480004</td><td>3550000334430004</td></tr><tr><td>AUTHENTICATION_FAILED - The 3DS attempt was rejected by the issuer</td><td>Yes</td><td>4440000334440005</td><td>5550000334470005</td><td>3550000334420005</td></tr><tr><td>SUSPECTED_FRAUD - The transaction was declined by the issuer due to the card being marked as stolen or potential fraud</td><td>Yes</td><td>4440000334430006</td><td>5550000334460006</td><td>3550000334410006</td></tr><tr><td>SUSPECTED_FRAUD - The transaction was declined by channel due to the account being blocked or suspected as fraud</td><td>Yes</td><td>4440000334420007</td><td>5550000334450007</td><td>3550000334400007</td></tr><tr><td>BLOCKED_BY_FDS - The transaction was declined by FDS due to the transactions being categorized as high risk</td><td>Yes</td><td>4440000334410008</td><td>5550000334440008</td><td>3550000334490008</td></tr><tr><td>REQUIRE_REVIEW - The transaction was deferred by FDS due to the transactions being categorized as suspicious</td><td>Yes</td><td>4440000334400009</td><td>5550000334430009</td><td>3550000334480009</td></tr><tr><td>INSUFFICIENT_FUND - The transaction was declined by the issuer due to credit limit or balance is not sufficient</td><td>Yes</td><td>4440000334470010</td><td>5550000334400010</td><td>3550000334450010</td></tr><tr><td>CHANNEL_UNAVAILABLE - The transaction failed due to the issuer being unavailable or having a system malfunction</td><td>Yes</td><td>4440000334460011</td><td>5550000334490011</td><td>3550000334440011</td></tr><tr><td>CANCELLED_BY_USER - The 3DS attempt was cancelled by the cardholder</td><td>Yes</td><td>4440000334450012</td><td>5550000334480012</td><td>3550000334430012</td></tr><tr><td>Foreign Card - Requires Billing Address</td><td>Yes</td><td>4448100334430014</td><td>5558100334460014</td><td>3558100334410014</td></tr></tbody></table>

### E-Wallet

| Phone Number | OTP    | Payment Status | Charge Status |
| ------------ | ------ | -------------- | ------------- |
| 08111111001  | 000000 | PAID           | SUCCESS       |
| 08111111002  | 000000 | PROCESSING     | PROCESSING    |
| 08111111003  | 000000 | CANCELLED      | FAILED        |
| 08111111004  | 000000 | EXPIRED        | EXPIRED       |

### QRIS & Virtual Account

Link Simulation:

<https://dashboard-stg.pivot-payment.com/simulation/payment/{base64> encode from Payment Session ID}

## AVS Simulation

{% hint style="info" %}
Any AVS <mark style="color:orange;">`gatewayCode`</mark> result will not void the transaction. If the Issuing bank has been approved
{% endhint %}

<table><thead><tr><th width="343.1650390625">Address Line</th><th>AVS gatewayCode Result</th></tr></thead><tbody><tr><td>Alpha Street</td><td>SERVICE_NOT_AVAILABLE_RET</td></tr><tr><td>Bravo Street</td><td>NOT_AVAILABLE</td></tr><tr><td>Charlie Street</td><td>DEFERRED_TRANSACTION_RECE</td></tr><tr><td>Delta Street</td><td>NO_MATCH</td></tr><tr><td>Echo Street</td><td>ZIP_MATCH</td></tr><tr><td>Foxtrot Street</td><td>ADDRESS_MATCH</td></tr><tr><td>Golf Street</td><td>ADDRESS_ZIP_MATCH</td></tr><tr><td>Hotel Street</td><td>NAME_MATCH</td></tr><tr><td>India Street</td><td>NAME_ZIP_MATCH</td></tr><tr><td>Juliett Street</td><td>NAME_ADDRESS_MATCH</td></tr><tr><td>Kilo Street</td><td>SERVICE_NOT_SUPPORTED</td></tr><tr><td>Lima Street</td><td>NOT_REQUESTED</td></tr><tr><td>Mike Street</td><td>NOT_VERIFIED</td></tr></tbody></table>


# Amount Object

```json
{
  "amount": {
    "value": 999999999,
    "currency": "IDR"
  }
}
```

**Detail Amount Object**

<table><thead><tr><th>Parameter</th><th width="152.595703125">Data Type</th><th width="129.701171875">Character Limit</th><th width="139.546875">Requirement</th><th width="226.7060546875">Description</th></tr></thead><tbody><tr><td>value</td><td>Decimal</td><td>1-18</td><td>M</td><td>Payment amount value</td></tr><tr><td>currency</td><td>String</td><td>1-3</td><td>M</td><td>Currency code in ISO 4217 Format, e.g. USD, IDR</td></tr></tbody></table>


# Payment Method Object

```json
{
  "type": "CARD",
  "card": {
    "encryptedCard": "01975dc4-2a18-7a6f-9319-74658398b2b1",
    "token": "tok_4eC39HqLyjWDarjtT1zdp7dc",
    "number": "9999666600001111",
    "expMonth": 1,
    "expYear": 39,
    "cvc": "999",
    "cardHolderFirstName": "Reforza Jordan",
    "cardHolderLastName": "Geotama",
    "cardHolderEmail": "reforza@pivot-payment.com",
    "cardHolderPhone": "081299996666"
  },
  "virtualAccount": {
    "channel": "PERMATA",
    "virtualAccountNumber": "7699013199996662",
    "virtualAccountName": "Reforza Pivot",
    "expiryAt": "0001-01-01T00:00:00Z"
  },
  "ewallet": {
    "accountIdentifier": "081299996666"
  }
}
```

**Detail Payment Method Object**

<table><thead><tr><th width="225.23828125">Parameter</th><th width="116.24609375">Data Type</th><th width="128.0458984375">Character Limit</th><th width="123.82421875">Requirement</th><th width="243.9423828125">Description</th></tr></thead><tbody><tr><td>type</td><td>String</td><td>-</td><td>M</td><td><p>Available payment method types that can be selected by, possible values are </p><ul><li>VIRTUAL_ACCOUNT</li><li>QR</li><li>CARD</li><li>EWALLET</li></ul></td></tr><tr><td>card</td><td>Object</td><td>-</td><td>C</td><td><p>Card data</p><p></p><p>PLEASE NOTE for </p><ul><li>PCI-DSS &#x26; SAQ-D merchants can send full card number</li><li>SAQ AEP merchants need to send tokenized card</li></ul></td></tr><tr><td><ul><li>encryptedCard</li></ul></td><td>String</td><td>0-500</td><td>C</td><td><p>Only if :</p><ul><li><mark style="color:orange;"><code>mode</code></mark> = API</li><li><mark style="color:orange;"><code>autoConfirm</code></mark> = false</li></ul><p></p><p>Token Unique ID generated from Merchant</p></td></tr><tr><td><ul><li>token</li></ul></td><td>String</td><td>-</td><td>C</td><td>Card tokenization flow</td></tr><tr><td><ul><li>number</li></ul></td><td>String</td><td>-</td><td>C</td><td><p>Required if token not sent</p><p>Card PAN</p></td></tr><tr><td><ul><li>expMonth</li></ul></td><td>Number</td><td>-</td><td>C</td><td><p>Required if token not sent</p><p>Card Expiration Month</p></td></tr><tr><td><ul><li>expYear</li></ul></td><td>Number</td><td>-</td><td>C</td><td><p>Required if token not sent</p><p>Card Expiration Year</p></td></tr><tr><td><ul><li>cvc</li></ul></td><td>String </td><td>0-3</td><td>C</td><td>Card CVV Code</td></tr><tr><td><ul><li>cardHolderFirstName</li></ul></td><td>String</td><td>-</td><td>M</td><td>Cardholder First Name</td></tr><tr><td><ul><li>cardHolderLastName</li></ul></td><td>String</td><td>-</td><td>M</td><td>Cardholder Last Name</td></tr><tr><td><ul><li>cardHolderEmail</li></ul></td><td>String</td><td>-</td><td>M</td><td>Cardholder registered email address</td></tr><tr><td><ul><li>cardHolderPhone</li></ul></td><td>String</td><td>-</td><td>M</td><td>Cardholder registered phone number</td></tr><tr><td>virtualAccount</td><td>Object</td><td>-</td><td>C</td><td>Virtual Account data only for API integration if user already selected the <mark style="color:orange;"><code>VIRTUAL_ACCOUNT</code></mark> channel</td></tr><tr><td><ul><li>channel</li></ul></td><td>String</td><td>1-100</td><td>M</td><td>Selected Virtual Account Bank Name</td></tr><tr><td><ul><li>virtualAccountNumber</li></ul></td><td>String</td><td>0-100</td><td>M</td><td>The corresponding virtual account number that can be used by Customers to send payments to</td></tr><tr><td><ul><li>virtualAccountName</li></ul></td><td>String</td><td>0-100</td><td>M</td><td>Virtual Account Name display to Customers</td></tr><tr><td><ul><li>expiryAt</li></ul></td><td>String</td><td>-</td><td>M</td><td><p>VA expiration time</p><p>format YYYY-MM-DDTHH:MM:SSZ</p></td></tr><tr><td>ewallet</td><td>Object</td><td>-</td><td>C</td><td>Ewallet data only for API integration if user already selected the <mark style="color:orange;"><code>EWALLET</code></mark> channel</td></tr><tr><td><ul><li>accountIdentifier</li></ul></td><td>String</td><td>-</td><td>M</td><td>Registered mobile number to the E Wallet account</td></tr></tbody></table>


# Payment Method Options Object

```json
{
  "id": "ea35b4d0-79fc-461b-84a0-a4e8e64eecd9",
  "card": {
    "captureMethod": "automatic",
    "threeDsMethod": "CHALLENGE",
    "processingConfig": {
      "bankMerchantId": null,
      "merchantIdTag": null
    },
    "installment": null
  },
  "virtualAccount": {
    "channel": "BRI",
    "virtualAccountName": "Reforza Pivot",
    "virtualAccountNumber": "999996",
    "expiryAt": "2025-03-30T23:59:05Z"
  },
  "ewallet": {
    "channel": "DANA",
    "expiryAt": "2025-03-30T23:59:05Z"
  },
  "qr": {
    "expiryAt": "2025-03-30T23:59:05Z"
  }
}
```

**Detail Payment Method Options Object**

<table><thead><tr><th width="233.41796875">Parameter</th><th width="118.26171875">Data Type</th><th>Character Limit</th><th width="132.1171875">Requirement</th><th width="243.04296875">Description</th></tr></thead><tbody><tr><td>id</td><td>String</td><td>-</td><td>O</td><td>Identifier for stored preset payment method options</td></tr><tr><td>card</td><td>Object</td><td>-</td><td>O</td><td>Cards Payment Options, Mandatory if payment method types selected is CARDS</td></tr><tr><td><ul><li>captureMethod</li></ul></td><td>String</td><td>-</td><td>O</td><td><p>If merchant wanted to manually capture, possible values:</p><ul><li>automatic</li><li>manual</li></ul></td></tr><tr><td><ul><li>threeDsMethod</li></ul></td><td>String</td><td>-</td><td>O</td><td><p>We will try to provide options for three_ds later, possible values: </p><ul><li>AUTOMATIC (DEFAULT)</li><li>NEVER</li><li>CHALLENGE</li></ul></td></tr><tr><td><ul><li>processingConfig</li></ul></td><td>Object</td><td>-</td><td>O</td><td>Only for Facilitator model, to pass the bank MID they want to route this transaction to</td></tr><tr><td><blockquote><ul><li> bankMerchantId</li></ul></blockquote></td><td>String</td><td>0-50</td><td>C</td><td></td></tr><tr><td><blockquote><ul><li> merchantIdTag</li></ul></blockquote></td><td>String</td><td>0-50</td><td>C</td><td></td></tr><tr><td><ul><li>installment</li></ul></td><td>Object</td><td>-</td><td>O</td><td><a data-mention href="installment-object">installment-object</a></td></tr><tr><td>virtualAccount</td><td>Object</td><td>-</td><td>O</td><td></td></tr><tr><td><ul><li>channel</li></ul></td><td>String</td><td>1-100</td><td>O</td><td><p>Virtual Account Bank Name, possible values are </p><ul><li>DANAMON</li><li>BNI</li><li>MANDIRI</li><li>BSI</li><li>BCA</li><li>BNC</li><li>CIMB</li><li>BRI</li><li>MANDIRI</li><li>etc</li></ul></td></tr><tr><td><ul><li>virtualAccountName</li></ul></td><td>String</td><td>0-100</td><td>O</td><td><p>All Virtual Account Name will use merchant short name</p><p><br></p><p>For some banks that can perform custom name, this field will be used</p></td></tr><tr><td><ul><li>virtualAccountNumber</li></ul></td><td>String</td><td>0-100</td><td>O</td><td><p>The corresponding virtual account number that can be used by Customers to send payments to</p><p></p><p>If merchants want to have their custom number they can pass this field within Static configuration range number in Dashboard<br><br>Default Static Range: <a data-mention href="https://app.gitbook.com/s/bRczl3VT35wkmuP4KTzZ/payment-channels/virtual-account/limitation">Limitation</a></p></td></tr><tr><td><ul><li>expiryAt</li></ul></td><td>String</td><td>-</td><td>C</td><td><p>VA expiration time</p><p></p><p>format YYYY-MM-DDTHH:MM:SSZ<br><br>For Payment Type = <mark style="color:orange;"><code>MULTIPLE</code></mark>, don't necessarily send the Expiry At value</p></td></tr><tr><td>ewallet</td><td>Object</td><td>-</td><td>O</td><td></td></tr><tr><td><ul><li>channel</li></ul></td><td>String</td><td>-</td><td>O</td><td><p>Ewallet channel, possible values are </p><ul><li>DANA</li><li>SHOPEEPAY</li><li>OVO</li></ul></td></tr><tr><td><ul><li>expiryAt</li></ul></td><td>String</td><td>-</td><td>M</td><td><p>Payment expiration time</p><p></p><p>format YYYY-MM-DDTHH:MM:SSZ</p></td></tr><tr><td>qr</td><td>Object</td><td>-</td><td>O</td><td></td></tr><tr><td><ul><li>expiryAt</li></ul></td><td>String</td><td>-</td><td>C</td><td><p>Payment expiration time</p><p></p><p>format YYYY-MM-DDTHH:MM:SSZ<br><br>For Payment Type = <mark style="color:orange;"><code>MULTIPLE</code></mark>, don't necessarily send the Expiry At value</p></td></tr></tbody></table>


# Redirect Object

```json
{
  "redirectUrl": {
    "successReturnUrl": "https://merchant.com/success",
    "failureReturnUrl": "https://merchant.com/failure",
    "expirationReturnUrl": "https://merchant.com/expired"
  }
}
```

**Detail Redirect Object**

<table><thead><tr><th width="230.53125">Parameter</th><th width="109.078125">Data Type</th><th width="128.2646484375">Character Limit</th><th width="124.23828125">Requirement</th><th width="195.501953125">Description</th></tr></thead><tbody><tr><td>successReturnUrl</td><td>String</td><td>1-255</td><td>C</td><td>Redirect URL when the payment / charge is success</td></tr><tr><td>failureReturnUrl</td><td>String</td><td>1-255</td><td>C</td><td>Failure URL when the payment / charge is failed</td></tr><tr><td>expirationReturnUrl</td><td>String</td><td>1-255</td><td>C</td><td>Redirect URL when the payment is expired</td></tr></tbody></table>


# Order Object

```json
{
  "orderInformation": {
    "productDetails": [
      {
        "type": "PHYSICAL",
        "category": "FASHION",
        "subCategory": "FASHION WANITA",
        "name": "Dress Kasual Warna Putih",
        "description": "Ukuran M",
        "quantity": 1,
        "price": {
          "value": 100000,
          "currency": "IDR"
        }
      }
    ],
    "billingInfo": { // Mandatory for Foreign Card with AVS
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990001"
      },
      "addressLine1": "Biomedical Building Lantai 3",
      "addressLine2": "Digital hub, BSD City",
      "city": "Tangerang Regency",
      "provinceState": "Banten",
      "country": "ID",
      "postalCode": "15331"
    },
    "shippingInfo": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990001"
      },
      "addressLine1": "Biomedical Building Lantai 3",
      "addressLine2": "Digital hub, BSD City",
      "city": "Tangerang Regency",
      "provinceState": "Banten",
      "country": "ID",
      "postalCode": "15331",
      "method": "REGULAR",
      "shippingFee": {
        "value": 100000,
        "currency": "IDR"
      }
    }
  }
}
```

**Detail Order Object**

<table><thead><tr><th width="230.53125">Parameter</th><th width="109.078125">Data Type</th><th width="129.548828125">Character Limit</th><th width="124.23828125">Requirement</th><th width="235.794921875">Description</th></tr></thead><tbody><tr><td>productDetails</td><td>Array of Objects</td><td>-</td><td>M</td><td>List of products included in the order</td></tr><tr><td><ul><li>type</li></ul></td><td>String</td><td>1-255</td><td>M</td><td><p>Product type, possible values:</p><ul><li>PHYSICAL</li><li>DIGITAL</li><li>SERVICE</li></ul></td></tr><tr><td><ul><li>category</li></ul></td><td>String</td><td>1-255</td><td>O</td><td>Main category of the product (e.g., FASHION)</td></tr><tr><td><ul><li>subCategory</li></ul></td><td>String</td><td>1-255</td><td>O</td><td>Further classification within the category</td></tr><tr><td><ul><li>name</li></ul></td><td>String</td><td>1-255</td><td>O</td><td>Product name</td></tr><tr><td><ul><li>description</li></ul></td><td>String</td><td>1-255</td><td>O</td><td>Additional details such as size or color</td></tr><tr><td><ul><li>quantity</li></ul></td><td>Float</td><td>1-18</td><td>M</td><td>Number of units for this product</td></tr><tr><td><ul><li>price</li></ul></td><td>Object</td><td>-</td><td>M</td><td>Unit price of the product</td></tr><tr><td><blockquote><ul><li>value</li></ul></blockquote></td><td>Float</td><td>1-18</td><td>M</td><td>Amount value</td></tr><tr><td><blockquote><ul><li>currency</li></ul></blockquote></td><td>String</td><td>1-3</td><td>M</td><td>Currency ISO 4217</td></tr><tr><td>billingInfo</td><td>Object</td><td>-</td><td>C</td><td>The details of the billing information<br><br>Mandatory for Foreign Card with AVS</td></tr><tr><td><ul><li>givenName</li></ul></td><td>String</td><td>1-255</td><td>M</td><td>First name of the billing name</td></tr><tr><td><ul><li>surname</li></ul></td><td>String</td><td>0-255</td><td>O</td><td>Last name of the billing name</td></tr><tr><td><ul><li>email</li></ul></td><td>String</td><td>1-255</td><td>M</td><td>Validate email format</td></tr><tr><td><ul><li>phoneNumber</li></ul></td><td>Object</td><td>-</td><td>O</td><td>Phone number information</td></tr><tr><td><blockquote><ul><li>CountryCode</li></ul></blockquote></td><td>String</td><td>1-255</td><td>M</td><td>Country code prefix (e.g., +62)</td></tr><tr><td><blockquote><ul><li>number</li></ul></blockquote></td><td>String</td><td>1-15</td><td>M</td><td>Phone number start with “8”</td></tr><tr><td><ul><li>addressLine1</li></ul></td><td>String</td><td>1-255</td><td>C</td><td>Primary street address<br><br>Mandatory for Foreign Card with AVS</td></tr><tr><td><ul><li>addressLine2</li></ul></td><td>String</td><td>0-255</td><td>O</td><td>Secondary address information</td></tr><tr><td><ul><li>city</li></ul></td><td>String</td><td>1-255</td><td>C</td><td>City or regency<br><br>Mandatory for Foreign Card with AVS</td></tr><tr><td><ul><li>provinceState</li></ul></td><td>String</td><td>1-255</td><td>C</td><td>Province or state name<br><br>Mandatory for Foreign Card with AVS</td></tr><tr><td><ul><li>country</li></ul></td><td>String</td><td>1-255</td><td>C</td><td>Country code (e.g., ID)<br>ISO 3166-2<br><br>Mandatory for Foreign Card with AVS</td></tr><tr><td><ul><li>postalCode</li></ul></td><td>String</td><td>0-255</td><td>C</td><td>Postal or ZIP code<br><br>Mandatory for Foreign Card with AVS</td></tr><tr><td>shippingInfo</td><td>Object</td><td>-</td><td>O</td><td>The details of the shipping information</td></tr><tr><td><ul><li>givenName</li></ul></td><td>String</td><td>1-255</td><td>M</td><td>First name of the billing name</td></tr><tr><td><ul><li>surname</li></ul></td><td>String</td><td>0-255</td><td>O</td><td>Last name of the billing name</td></tr><tr><td><ul><li>email</li></ul></td><td>String</td><td>1-255</td><td>M</td><td>Validate email format</td></tr><tr><td><ul><li>phoneNumber</li></ul></td><td>Object</td><td>-</td><td>O</td><td>Phone number information</td></tr><tr><td><blockquote><ul><li>CountryCode</li></ul></blockquote></td><td>String</td><td>2-4</td><td>M</td><td>Country code prefix (e.g., +62)</td></tr><tr><td><blockquote><ul><li>number</li></ul></blockquote></td><td>String</td><td>1-15</td><td>M</td><td>Phone number start with “8”</td></tr><tr><td><ul><li>addressLine1</li></ul></td><td>String</td><td>1-255</td><td>M</td><td>Primary street address</td></tr><tr><td><ul><li>addressLine2</li></ul></td><td>String</td><td>0-255</td><td>O</td><td>Secondary address information</td></tr><tr><td><ul><li>city</li></ul></td><td>String</td><td>1-255</td><td>M</td><td>City or regency</td></tr><tr><td><ul><li>provinceState</li></ul></td><td>String</td><td>1-255</td><td>M</td><td>Province or state name</td></tr><tr><td><ul><li>country</li></ul></td><td>String</td><td>1-255</td><td>M</td><td>Country code (e.g., ID)<br>ISO 3166-2</td></tr><tr><td><ul><li>postalCode</li></ul></td><td>String</td><td>0-255</td><td>O</td><td>Postal or ZIP cod</td></tr><tr><td><ul><li>method</li></ul></td><td>String</td><td>-</td><td>M</td><td><p>Shipping method, possible values:</p><ul><li>REGULAR</li><li>NEXTDAY</li><li>SAMEDAY</li><li>INSTANT</li></ul></td></tr><tr><td><ul><li>shippingFee</li></ul></td><td>Object</td><td>-</td><td>O</td><td>Shipping fee amount</td></tr><tr><td><blockquote><ul><li>value</li></ul></blockquote></td><td>Float</td><td>1-18</td><td>M</td><td>Amount value</td></tr><tr><td><blockquote><ul><li>currency</li></ul></blockquote></td><td>String</td><td>1-3</td><td>M</td><td>Currency ISO 4217</td></tr></tbody></table>


# Payment Session Object

```json
{
  "id": "bca0b57a-391e-4f6f-bfef-8cd37492ee5b",
  "clientReferenceId": "1750758552",
  "amount": {
    "value": 10001,
    "currency": "IDR"
  },
  "autoConfirm": true,
  "mode": "REDIRECT",
  "bypassStatusPage": false,
  "redirectUrl": {
    "successReturnUrl": "https://merchant.com/success",
    "failureReturnUrl": "https://merchant.com/failed",
    "expirationReturnUrl": "https://merchant.com/expired"
  },
  "paymentType": "SINGLE",
  "paymentMethod": {
    "type": "CARD"
  },
  "statementDescriptor": "Reforza Pivot",
  "expirationMode": "STRICT",
  "saveForFutureUse": false,
  "showSavedPayment": false,
  "status": "PAID",
  "investigationStatus": null,
  "createdAt": "2025-03-30T05:48:17.0549468Z",
  "updatedAt": "2025-03-30T05:48:17.103243713Z",
  "expiryAt": "2025-03-31T23:59:05Z",
  "encryptionKey": "Eykc6QYeUuG5aKcPMrUsaZq0bWWCGLJY",
  "paymentUrl": "https://payment.pivot-payment.com/detail?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiN2Y2NWM3NTctMzU1Zi00NjQ1LWFjMTQtMDI4YjM0YWI1MWIxIiwiaXNzIjoiYmFja2VuZC1wb3J0YWwiLCJleHAiOjE3NDM0NjU1NDV9.55-QdvI0xVtivNLJzREPDGzUbqFNEj7ouFUCvrzAIbw",
  "chargeDetails": [
    {
      "id": "cf2842f4-e263-4643-8bc9-af682a5060cd",
      "paymentSessionId": "bca0b57a-391e-4f6f-bfef-8cd37492ee5b",
      "paymentSessionClientReferenceId": "1750758552",
      "amount": {
        "value": 10001,
        "currency": "IDR"
      },
      "statementDescriptor": "Reforza Pivot",
      "status": "SUCCESS",
      "authorizedAmount": {
        "value": 10001,
        "currency": "IDR"
      },
      "capturedAmount": {
        "value": 10001,
        "currency": "IDR"
      },
      "isCaptured": true,
      "createdAt": "2025-06-24T09:49:12.861006Z",
      "updatedAt": "2025-06-24T09:56:40.020691Z",
      "paidAt": "2025-06-24T09:56:39Z",
      "fdsRiskAssessment": {
        "score": "0",
        "level": "very low",
        "recommendation": "Approve",
        "status": "PASSED",
        "evaluatedAt": "2025-06-24T09:56:39.411921983Z"
      },
      "card": {
        "first6": "999999",
        "first8": "99999966",
        "last4": "0001",
        "expMonth": "01",
        "expYear": "39",
        "fingerprint": "03765362-4f67-41c6-a6c7-4a7520dcbc36",
        "binInformations": {
          "type": "DEBIT",
          "issuingBank": "BRI",
          "brand": "VISA",
          "country": "ID"
        },
        "authenticationResult": {
          "threeDsVersion": "2.2.0",
          "threeDsResult": "AUTHENTICATION_SUCCESSFUL",
          "threeDsMethod": "",
          "eciCode": "02"
        },
        "authorizationResult": {
          "acquirerReferenceNumber": "123456789",
          "retrievalReferenceNumber": "TRXCC7c364322b98717507589132",
          "stan": "104539",
          "avsResult": "",
          "cvvResult": "",
          "authorizedAmount": {
            "value": 10001,
            "currency": "IDR"
          },
          "issuerAuthorizationCode": "00"
        }
      },
      "captureHistories": [
        {
          "captureId": "019c0862-dc89-73d6-b8f1-d790847b09ee",
          "currency": "IDR",
          "capturedAmount": 10001,
          "status": "SUCCESS",
          "createdAt": "2026-01-29T06:13:42Z"
        }
      ]
    }
  ],
  "customerId": "999966660001",
  "customer": {
    "givenName": "Reforza Jordan",
    "surname": "Geotama",
    "email": "reforza@pivot-payment.com",
    "phoneNumber": {
      "countryCode": "+62",
      "number": "89699990001"
    },
    "refundPreference": {
      "method": "AUTO",
      "transferDestination": {
        "channelCode": "014",
        "channelInformation": {
          "accountNumber": "17677665415",
          "accountName": "Reforza Jordan Geotama"
        }
      }
    },
    "storedPaymentMethods": [
      {
        "token": "020027de-134e-45ed-8f0d-7ae0506a7133",
        "paymentMethod": "CARD",
        "paymentChannel": "VISA",
        "createdAt": "2025-09-02T06:02:59.141590124Z",
        "status": "ACTIVE",
        "card": {
          "fingerprint": "0198edcf-87a0-73fd-b937-7ec4b0ddb9c6",
          "network": "VISA",
          "first6": "444000",
          "first8": "44400001",
          "last4": "0002",
          "expMonth": "01",
          "expYear": "39",
          "cardHolderFirstName": "Reforza Jordan",
          "cardHolderLastName": "Geotama"
        }
      },
      {
        "token": "bicbiweu63c",
        "paymentMethod": "ewallet",
        "paymentChannel": "dana",
        "createdAt": "2024-03-15T09:37:00Z",
        "status": "ACTIVE"
      }
    ]
  },
  "orderInformation": {
    "productDetails": [
      {
        "type": "PHYSICAL",
        "category": "FASHION",
        "subCategory": "FASHION WANITA",
        "name": "Dress Kasual Warna Putih",
        "description": "Ukuran M",
        "quantity": 1,
        "price": {
          "value": 100000,
          "currency": "IDR"
        }
      }
    ],
    "billingInfo": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990001"
      },
      "addressLine1": "Biomedical Building Lantai 3",
      "addressLine2": "Digital hub, BSD City",
      "city": "Tangerang Regency",
      "provinceState": "Banten",
      "country": "ID",
      "postalCode": "15331"
    },
    "shippingInfo": {
      "givenName": "Reforza Jordan",
      "surname": "Geotama",
      "email": "reforza@pivot-payment.com",
      "phoneNumber": {
        "countryCode": "+62",
        "number": "89699990001"
      },
      "addressLine1": "Biomedical Building Lantai 3",
      "addressLine2": "Digital hub, BSD City",
      "city": "Tangerang Regency",
      "provinceState": "Banten",
      "country": "ID",
      "postalCode": "15331",
      "method": "REGULAR",
      "shippingFee": {
        "value": 100000,
        "currency": "IDR"
      }
    }
  },
  "cancelledAt": null,
  "cancellationReason": null,
  "metadata": {
    "invoiceNo": "INV001"
  }
}
```

**Detail Payment Session Object**

<table><thead><tr><th width="232.91015625">Parameter</th><th width="111.90234375">Data Type</th><th width="123.6318359375">Character Limit</th><th width="119.61328125">Requirement</th><th width="240.0888671875">Description</th></tr></thead><tbody><tr><td>id</td><td>String</td><td>-</td><td>Auto Generated</td><td>Unique ID of a payment session, generated by Pivot</td></tr><tr><td>clientReferenceId</td><td>Alphanumeric</td><td>1-100</td><td>M</td><td>Unique Payment Reference from Merchant's Request</td></tr><tr><td>amount</td><td>Object</td><td>-</td><td>M</td><td><a data-mention href="amount-object">amount-object</a><br>Total Payment amount</td></tr><tr><td>autoConfirm</td><td>Boolean</td><td>-</td><td>O</td><td><p>Default to true</p><p><br>If the confirmation method is set to false. Then clients need to hit the /confirm endpoint</p></td></tr><tr><td>mode</td><td>String</td><td>-</td><td>O</td><td><p>Default to REDIRECT</p><p></p><p>Payment Session mode. Possible values are: </p><ul><li>REDIRECT will return redirectUrl</li><li>API</li></ul></td></tr><tr><td>bypassStatusPage</td><td>Boolean</td><td>-</td><td>O</td><td><p>Bypass Pivot's Status Page after your customer completing the Payment, directly redirect to your URLs</p><p></p><p>Default to false, applicable only for <mark style="color:orange;"><code>REDIRECT</code></mark> mode<br><br>Possible values are:</p><ul><li>true</li><li>false</li></ul></td></tr><tr><td>redirectUrl</td><td>Object</td><td>-</td><td>M</td><td><a data-mention href="redirect-object">redirect-object</a><br><br>URL for redirection</td></tr><tr><td>paymentType</td><td>String</td><td>-</td><td>O</td><td><p>Default to SINGLE</p><p></p><p>Payment Type possible values are:</p><ul><li>SINGLE</li><li>MULTIPLE</li></ul><p></p><p>Definition:</p><ul><li><mark style="color:orange;"><code>SINGLE</code></mark>: Payment Session can only be charged once</li><li><mark style="color:orange;"><code>MULTIPLE</code></mark>: Payment Session can be charged multiple times, and Payment Session Status is always <mark style="color:orange;"><code>Active</code></mark></li></ul><p><br>Applicable only for Payment Method Type <mark style="color:orange;"><code>QR</code></mark> and <mark style="color:orange;"><code>VIRTUAL_ACCOUNT</code></mark></p></td></tr><tr><td>paymentMethod</td><td>Object</td><td>-</td><td>O</td><td><a data-mention href="payment-method-object">payment-method-object</a></td></tr><tr><td>statementDescriptor</td><td>String</td><td>0-20</td><td>O</td><td><p>Default = Merchant’s short name</p><p></p><p>Statement descriptors allow a maximum 20 characters for all the concatenated characters (including space). </p><p></p><p>It will be shown on invoice, receipt, and for payment methods that support custom descriptors, it will be shown on the customer's bank statement.</p></td></tr><tr><td>expirationMode</td><td>String</td><td>-</td><td>O</td><td><p>Default to LOOSE</p><p></p><p>Payment Type possible values are:</p><ul><li>LOOSE</li><li>STRICT</li></ul><p></p><p>Definition:</p><ul><li><mark style="color:orange;"><code>LOOSE</code></mark>: Expiry depends on processor rules</li><li><mark style="color:orange;"><code>STRICT</code></mark>: Expiry depends on merchant rules</li></ul><p><br>Applicable only for Payment Method Type <mark style="color:orange;"><code>CARD</code></mark> and <mark style="color:orange;"><code>EWALLET</code></mark></p></td></tr><tr><td>saveForFutureUse</td><td>Boolean</td><td>-</td><td>O</td><td><p>Store Payment Information detail in Token format in <a data-mention href="../../core-resources/customers/customer-object">customer-object</a> for <mark style="color:orange;"><code>CARD</code></mark> &#x26; <mark style="color:orange;"><code>EWALLET</code></mark>  Payment method whenever the charge is <mark style="color:orange;"><code>SUCCESS</code></mark></p><p></p><p>Default to false<br><br>Possible values are:</p><ul><li>true</li><li>false</li></ul></td></tr><tr><td>showSavedPayment</td><td>Boolean</td><td>-</td><td>O</td><td><p>Show saved Payment Information for <mark style="color:orange;"><code>CARD</code></mark> &#x26; <mark style="color:orange;"><code>EWALLET</code></mark>  Payment method in Payment Redirection</p><p></p><p>Default to false, applicable only for <mark style="color:orange;"><code>REDIRECT</code></mark> mode<br><br>Possible values are:</p><ul><li>true</li><li>false</li></ul></td></tr><tr><td>status</td><td>String</td><td>-</td><td>Auto Generated</td><td><a data-mention href="../status">status</a></td></tr><tr><td>investigationStatus</td><td>String</td><td>-</td><td>C</td><td><p>Applicable for the merchant who is eligible for Settlement Guarantee Program</p><p></p><p>Investigation Status:</p><ul><li><mark style="color:orange;"><code>INVESTIGATION_IN_PROCESS</code></mark> : Validating to our Bank Partner</li><li><mark style="color:orange;"><code>INVESTIGATION_SUCCESS</code></mark> : Final Payment Status in our Bank Partner is <mark style="color:orange;"><code>SUCCESS</code></mark> </li><li><mark style="color:orange;"><code>INVESTIGATION_FAILED</code></mark> : Final Payment Status in our Bank Partner <mark style="color:orange;"><code>FAILED</code></mark></li></ul></td></tr><tr><td>createdAt</td><td>String</td><td>-</td><td>Auto Generated</td><td>Session created time with format YYYY-MM-DDTHH:MM:SSZ</td></tr><tr><td>updatedAt</td><td>String</td><td>-</td><td>Auto Generated</td><td>Session latest updated time with format YYYY-MM-DDTHH:MM:SSZ</td></tr><tr><td>expiryAt</td><td>String</td><td>-</td><td>O</td><td>Session expired time set by merchant with format YYYY-MM-DDTHH:MM:SSZ. The default expiration time is 15 mins.<br><br>For Payment Type = <mark style="color:orange;"><code>MULTIPLE</code></mark>, don't necessarily send the Expiry At value</td></tr><tr><td>encryptionKey</td><td>String</td><td>-</td><td>C</td><td><p>Only if :</p><ul><li><mark style="color:orange;"><code>paymentMethod.type</code></mark> = CARD</li><li><mark style="color:orange;"><code>mode</code></mark> = API</li><li><mark style="color:orange;"><code>autoConfirm</code></mark> = false</li></ul><p>To be used as Encryption of Customer's Card Information in Merchant FE</p></td></tr><tr><td>paymentUrl</td><td>String</td><td>-</td><td>C</td><td><p>Only If mode = REDIRECT<br></p><p>Pivot will generate a Payment URL for merchant to redirect their user to the page<br></p></td></tr><tr><td>chargeDetails</td><td>Array of object</td><td>-</td><td>Auto Generated</td><td><p><a data-mention href="charge-object">charge-object</a></p><p></p><p>Charged payments related to the payment session</p></td></tr><tr><td>customerId</td><td>String</td><td>0-255</td><td>O</td><td>Auto generated based on email as the unique identifier</td></tr><tr><td>customer</td><td>Object</td><td>-</td><td>M</td><td><a data-mention href="../../core-resources/customers/customer-object">customer-object</a><br><br>Customer Information</td></tr><tr><td>orderInformation</td><td>Object</td><td>-</td><td>M</td><td><a data-mention href="order-object">order-object</a><br><br>Order Information</td></tr><tr><td>cancelledAt</td><td>String</td><td>-</td><td>Auto Generated</td><td>Session cancellation time with format YYYY-MM-DDTHH:MM:SSZ</td></tr><tr><td>cancellationReason</td><td>String</td><td>-</td><td>O</td><td><p>Reason of cancellation, either provided by merchants or by Pivot System. Possible values</p><ul><li>REQUESTED_BY_CUSTOMER - cancellation by end-customer</li><li>DUPLICATED - cancellation because of duplicated payment session</li><li>VOID_SESSION - cancellation by Merchant</li><li>CHARGE_FAILED - Session cancelled because user payment is rejected</li><li>FRAUDULENT - Session cancelled due to transaction marked as fraud</li></ul></td></tr><tr><td>metadata</td><td>Object</td><td>-</td><td>O</td><td>Free object for merchant to store any extra information about the payment session</td></tr></tbody></table>


# Charge Object

```json
{
  "chargeDetails": [
    {
      "id": "cf2842f4-e263-4643-8bc9-af682a5060cd",
      "paymentSessionId": "bca0b57a-391e-4f6f-bfef-8cd37492ee5b",
      "paymentSessionClientReferenceId": "1750758552",
      "amount": {
        "value": 10001,
        "currency": "IDR"
      },
      "statementDescriptor": "Reforza Pivot",
      "status": "SUCCESS",
      "authorizedAmount": {
        "value": 10001,
        "currency": "IDR"
      },
      "capturedAmount": {
        "value": 10001,
        "currency": "IDR"
      },
      "isCaptured": true,
      "createdAt": "2025-06-24T09:49:12.861006Z",
      "updatedAt": "2025-06-24T09:56:40.020691Z",
      "paidAt": "2025-06-24T09:56:39Z",
      "fdsRiskAssessment": {
        "score": "0",
        "level": "very low",
        "recommendation": "Approve",
        "status": "PASSED",
        "evaluatedAt": "2025-06-24T09:56:39.411921983Z"
      },
      "card": {
        "first6": "999999",
        "first8": "99999966",
        "last4": "0001",
        "expMonth": "01",
        "expYear": "39",
        "fingerprint": "03765362-4f67-41c6-a6c7-4a7520dcbc36",
        "binInformations": {
          "type": "DEBIT",
          "issuingBank": "BRI",
          "brand": "VISA",
          "country": "ID"
        },
        "authenticationResult": {
          "threeDsVersion": "2.2.0",
          "threeDsResult": "AUTHENTICATION_SUCCESSFUL",
          "threeDsMethod": "",
          "eciCode": "02"
        },
        "authorizationResult": {
          "acquirerReferenceNumber": "123456789",
          "retrievalReferenceNumber": "TRXCC7c364322b98717507589132",
          "stan": "104539",
          "avsResult": "",
          "cvvResult": "",
          "authorizedAmount": {
            "value": 10001,
            "currency": "IDR"
          },
          "issuerAuthorizationCode": "00"
        }
      },
      "captureHistories": [
        {
          "captureId": "019c0862-dc89-73d6-b8f1-d790847b09ee",
          "currency": "IDR",
          "capturedAmount": 12000,
          "status": "SUCCESS",
          "createdAt": "2026-01-29T06:13:42Z"
        }
      ]
      "virtualAccount": null,
      "qr": null,
      "ewallet": null,
      "failureCode": null,
      "failureMessage": null,
      "recommendation": null
    }
  ]
}
```

**Detail Charge Object**

<table><thead><tr><th width="209.97265625">Parameter</th><th width="116.12890625">Data Type</th><th width="124.96875">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>id</td><td>String</td><td>M</td><td>Id of the charges</td></tr><tr><td>paymentSessionId</td><td>String</td><td>M</td><td>Related Payments Session Id</td></tr><tr><td>paymentSessionClientReferenceId</td><td>Alphanumeric</td><td>M</td><td>Payment Session merchant reference Id</td></tr><tr><td>amount</td><td>Object</td><td>M</td><td><a data-mention href="amount-object">amount-object</a><br>Total Payment Amount</td></tr><tr><td>statementDescriptor</td><td>String</td><td>M</td><td><p>Statement descriptors allow a maximum 20 characters for all the concatenated characters (including space). </p><p><br></p><p>It will be shown on invoice, receipt, and for payment methods that support custom descriptors, it will be shown on the customer's bank statement.</p></td></tr><tr><td>status</td><td>String</td><td>M</td><td><a data-mention href="../status">status</a></td></tr><tr><td>authorizedAmount</td><td>Object</td><td>M</td><td><a data-mention href="amount-object">amount-object</a></td></tr><tr><td>capturedAmount</td><td>Object</td><td>M</td><td><a data-mention href="amount-object">amount-object</a></td></tr><tr><td>isCaptured</td><td>Boolean</td><td>M</td><td></td></tr><tr><td>createdAt</td><td>String</td><td>Auto Generated</td><td>Created time with format YYYY-MM-DDTHH:MM:SSZ</td></tr><tr><td>updatedAt</td><td>String</td><td>Auto Generated</td><td>Updated time with format YYYY-MM-DDTHH:MM:SSZ</td></tr><tr><td>paidAt</td><td>String</td><td>Auto Generated</td><td>When status = SUCCESS time with format YYYY-MM-DDTHH:MM:SSZ</td></tr><tr><td>fdsRiskAssessment</td><td>Object</td><td>M</td><td><a data-mention href="fds-object">fds-object</a></td></tr><tr><td>card</td><td>Object</td><td>C</td><td><a data-mention href="charge-object/card-charge-object">card-charge-object</a></td></tr><tr><td>captureHistories</td><td>Array of Object</td><td>C</td><td>Mandatory if <mark style="color:orange;"><code>captureMethod</code></mark> = MANUAL</td></tr><tr><td><ul><li>captureId</li></ul></td><td>String</td><td>M</td><td>Unique identifier for capture</td></tr><tr><td><ul><li>currency</li></ul></td><td>String</td><td>M</td><td>Currency code in ISO 4217 Format, e.g. USD, IDR</td></tr><tr><td><ul><li>captureAmount</li></ul></td><td>Number</td><td>M</td><td>Payment amount value</td></tr><tr><td><ul><li>status</li></ul></td><td>String</td><td>M</td><td>Status of Capture:<br>1. PENDING<br>2. SUCCESS<br>3. FAILED</td></tr><tr><td><ul><li>createdAt</li></ul></td><td>String</td><td>M</td><td>Capture created time with format YYYY-MM-DDTHH:MM:SSZ</td></tr><tr><td>virtualAccount</td><td>Object</td><td>C</td><td><a data-mention href="charge-object/virtual-account-charge-object">virtual-account-charge-object</a></td></tr><tr><td>qr</td><td>Object</td><td>C</td><td><a data-mention href="charge-object/qr-charge-object">qr-charge-object</a></td></tr><tr><td>ewallet</td><td>Object </td><td>C</td><td><a data-mention href="charge-object/ewallet-charge-object">ewallet-charge-object</a></td></tr><tr><td>failureCode</td><td>String</td><td>C</td><td><a data-mention href="../response-and-failure-code">response-and-failure-code</a></td></tr><tr><td>failureMessage</td><td>String</td><td>C</td><td><a data-mention href="../response-and-failure-code">response-and-failure-code</a></td></tr><tr><td>recommendation</td><td>String</td><td>C</td><td><a data-mention href="../response-and-failure-code">response-and-failure-code</a></td></tr></tbody></table>


# Card Charge Object

```json
{
  "first6": "999999",
  "first8": "99999966",
  "last4": "0001",
  "expMonth": "01",
  "expYear": "39",
  "fingerprint": "03765362-4f67-41c6-a6c7-4a7520dcbc36",
  "binInformations": {
    "type": "DEBIT",
    "issuingBank": "BRI",
    "brand": "VISA",
    "country": "ID"
  },
  "authenticationResult": {
    "threeDsVersion": "2.2.0",
    "threeDsResult": "AUTHENTICATION_SUCCESSFUL",
    "threeDsMethod": "",
    "eciCode": "02"
  },
  "authorizationResult": {
    "acquirerReferenceNumber": "123456789",
    "retrievalReferenceNumber": "TRXCC7c364322b98717507589132",
    "stan": "104539",
    "avsResult": "",
    "cvvResult": "",
    "authorizedAmount": {
      "value": 10001,
      "currency": "IDR"
    },
    "issuerAuthorizationCode": "00"
  }
}
```

**Detail Card Charge Object**

<table><thead><tr><th width="218.62109375">Parameter</th><th width="106.8203125">Data Type</th><th width="131.36328125">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>first6</td><td>String</td><td>M</td><td>First 6 card number</td></tr><tr><td>first8</td><td>String</td><td>M</td><td>First 8 card number</td></tr><tr><td>last4</td><td>String</td><td>M</td><td>Last 4 card number</td></tr><tr><td>expMonth</td><td>String</td><td>M</td><td>Card Expired Month</td></tr><tr><td>expYear</td><td>String</td><td>M</td><td>Card Expired Year</td></tr><tr><td>fingerprint</td><td>String</td><td>M</td><td>Unique card identification</td></tr><tr><td>binInformations</td><td>Object</td><td>M</td><td></td></tr><tr><td><ul><li>type</li></ul></td><td>String</td><td>M</td><td>Cards funding type. Possible values: DEBIT / CREDIT / PREPAID</td></tr><tr><td><ul><li>issuingBank</li></ul></td><td>String</td><td>M</td><td>Bank Issuer</td></tr><tr><td><ul><li>brand</li></ul></td><td>String</td><td>M</td><td>Card Principal, possible values: VISA, MASTERCARD, JCB, etc.</td></tr><tr><td><ul><li>country</li></ul></td><td>String </td><td>M</td><td><p>Card Country registered to</p><p>(ISO 3166-1 alpha-2)</p></td></tr><tr><td>authenticationResult</td><td>Object</td><td>O</td><td></td></tr><tr><td><ul><li>threeDsVersion</li></ul></td><td> String</td><td>O</td><td><p>Indicates the 3DS version.<br></p><p>Possible values:</p><ul><li>null</li><li>1.0.x</li><li>2.1.x</li><li>2.2.x</li></ul></td></tr><tr><td><ul><li>threeDsResult</li></ul></td><td>String</td><td>O</td><td><p>Possible values</p><ul><li>SUCCESSFUL [ECI 02 / 05]</li><li>ATTEMPTED [ECI 01 / 06]</li><li>FAILED [ECI 00 / 07]</li><li>NOT_AVAILABLE [No ECI code being returned]</li><li>PROCESSING_ERROR [No ECI code being returned]</li></ul></td></tr><tr><td><ul><li>eciCode</li></ul></td><td>String</td><td>O</td><td><p>Possible values</p><ul><li>00</li><li>01</li><li>02</li><li>05</li><li>06</li><li>07</li></ul></td></tr><tr><td><ul><li>threeDsMethod</li></ul></td><td> String</td><td>O</td><td><p>Possible values</p><ul><li>BYPASSED</li><li>CHALLENGE</li><li>FRICTIONLESS</li></ul></td></tr><tr><td>authorizationResult</td><td>Object</td><td>M</td><td></td></tr><tr><td><ul><li>acquirerReferenceNumber</li></ul></td><td> String</td><td>O</td><td></td></tr><tr><td><ul><li>retrievalReferenceNumber</li></ul></td><td>String</td><td>O</td><td></td></tr><tr><td><ul><li>stan</li></ul></td><td>String </td><td>O</td><td></td></tr><tr><td><ul><li>avsResult</li></ul></td><td> String</td><td>O</td><td><p>Possible values</p><ul><li>MATCHED</li><li>NOT_MATCHED</li><li>NOT_MATCHED_NAME</li><li>PARTIAL_MATCH_ADDRESS</li><li>PARTIAL_MATCH_ZIP</li><li>PARTIAL_MATCH_NAME</li><li>INVALID</li><li>NOT_SUPPORTED</li><li>NOT_AVAILABLE</li><li>UNKNOWN_FROM_PROCESSOR</li></ul></td></tr><tr><td><ul><li>cvvResult</li></ul></td><td> String</td><td>O</td><td><p>Possible values</p><ul><li>NOT_SUBMITTED</li><li>MATCHED</li><li>NOT_MATCHED</li><li>NOT_PROCESSED</li><li>NOT_INCLUDED</li><li>VALIDATION_FAILED</li><li>SUSPICIOUS_TRANSACTION</li><li>NOT_SUPPORTED</li><li>UNKNOWN_FROM_PROCESSOR</li></ul></td></tr><tr><td><ul><li>authorizedAmount</li></ul></td><td>Object</td><td>M</td><td><a data-mention href="../amount-object">amount-object</a></td></tr><tr><td><ul><li>issuerAuthorizationCode</li></ul></td><td> String</td><td>M</td><td></td></tr></tbody></table>


# Virtual Account Charge Object

```json
{
  "channel": "PERMATA",
  "virtualAccountNumber": "766300001234566",
  "virtualAccountName": "Reforza Pivot",
  "expiryAt": "2025-03-30T23:59:05Z"
}
```

**Detail Virtual Account Charge Object**

<table><thead><tr><th width="212.05859375">Parameter</th><th width="114.9609375">Data Type</th><th width="125.49609375">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>channel</td><td>String</td><td>M</td><td><p>Virtual Account Bank Name, possible values are </p><ul><li>DANAMON</li><li>BNI</li><li>MANDIRI</li><li>BSI</li><li>BCA</li><li>BNC</li><li>CIMB</li><li>BRI</li><li>PERMATA</li><li>etc</li></ul></td></tr><tr><td>virtualAccountNumber</td><td>String</td><td>M</td><td><p>The corresponding virtual account number that can be used by Customers to send payments to</p><p></p><p>If merchants want to have their custom number they can pass this field</p></td></tr><tr><td>virtualAccountName</td><td>String</td><td>M</td><td><p>All Virtual Account Name will use merchant short name</p><p></p><p>For some banks that can perform custom name, this field will be used</p></td></tr><tr><td>expiryAt</td><td>String</td><td>M</td><td>VA expiration time - format YYYY-MM-DDTHH:MM:SSZ</td></tr></tbody></table>


# QR Charge Object

```json
{
  "acquirer": "BRI",
  "qrContent": "00020101021226600013ID.CO.BRI.WWW0118936000020110855909021019995143220303UME5204653353033605405100005802ID5917PIVOT QRIS API 16014TANGERANG KOT.6105153456234011850227152490175577707081085590963040250",
  "qrUrl": "",
  "qrType": "DYNAMIC",
  "retrievalReferenceNumber": "524901755777",
  "issuerName": "",
  "expiryAt": "2025-03-30T10:31:16.098536101Z",
  "merchantName": "Reforza Pivot"
}
```

**Detail QR Charge Object**

<table><thead><tr><th width="205.98046875">Parameter</th><th width="103.1875">Data Type</th><th width="127.1015625">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>acquirer</td><td>String</td><td>M</td><td>Acquiring Channel of the QRIS, possible values are BRI, BNC</td></tr><tr><td>qrContent</td><td>String</td><td>M</td><td>QR String Value which can be converted to QR Code Image</td></tr><tr><td>qrUrl</td><td>String</td><td>M</td><td>QR code image URL</td></tr><tr><td>qrType</td><td>String</td><td>M</td><td><p>QR Type possible values are:</p><ol><li>DYNAMIC</li><li>STATIC</li></ol></td></tr><tr><td>retrievalReferenceNumber</td><td>String</td><td>C</td><td>If charge is successful, then show issuer RRN</td></tr><tr><td>issuerName</td><td>String</td><td>C</td><td>If charge is successful, then show the issuerName</td></tr><tr><td>expiryAt</td><td>String</td><td>C</td><td>QR expiration time - format YYYY-MM-DDTHH:MM:SSZ</td></tr><tr><td>merchantName</td><td>String</td><td>M</td><td>QR Descriptor </td></tr></tbody></table>


# Ewallet Charge Object

```json
{
  "channel": "OVO",
  "accountInformations": {
    "mobileNumber": "6281299996666",
    "name": "Reforza Pivot"
  }
}
```

**Detail Ewallet Charge Object**

<table><thead><tr><th>Parameter</th><th width="120.265625">Data Type</th><th width="135.90234375">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>channel</td><td>String</td><td>M</td><td><p>Ewallet channel, possible values are </p><ul><li>DANA</li><li>OVO</li><li>SHOPEEPAY</li></ul></td></tr><tr><td>accountInformations</td><td>Object</td><td>O</td><td></td></tr><tr><td><ul><li>mobileNumber</li></ul></td><td>String</td><td>M</td><td>Registered mobile number of the end-customer to the channel partner in E.164 Format</td></tr><tr><td><ul><li>name</li></ul></td><td>String</td><td>M</td><td></td></tr></tbody></table>


# FDS Object

```json
{
  "fdsRiskAssessment": {
    "score": "0",
    "level": "very low",
    "recommendation": "Approve",
    "status": "PASSED",
    "evaluatedAt": "2025-06-24T09:56:39.411921983Z"
  }
}
```

**Detail FDS Object**

<table><thead><tr><th width="230.53125">Parameter</th><th width="109.078125">Data Type</th><th width="124.23828125">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>score</td><td>String</td><td>M</td><td>Risk assessment score</td></tr><tr><td>level</td><td>String</td><td>M</td><td>Risk level</td></tr><tr><td>recommendation</td><td>String</td><td>M</td><td><p>Recommendation for the risk assessment</p><p></p><p>Possible values: </p><ul><li>Approve</li><li>Reject</li></ul></td></tr><tr><td>status</td><td>String</td><td>M</td><td><p>Risk assesment status</p><p></p><p>Possible values:</p><ul><li>PASSED</li><li>REJECTED</li></ul></td></tr><tr><td>evaluatedAt</td><td>String</td><td>M</td><td>Charge evaluated at with format YYYY-MM-DDTHH:MM:SSZ</td></tr></tbody></table>


# Installment Object

```json
{
  "installment": {
    "enabled": "true",
    "availablePlans": [
      "3",
      "6",
      "9",
      "12"
    ],
    "plan": [
      "regular",
      "0%"
    ]
  }
}
```

**Detail Installment Object**

<table><thead><tr><th width="224.578125">Parameter</th><th width="110.9453125">Data Type</th><th width="125.1171875">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>enabled</td><td>Boolean</td><td>O</td><td>Boolean value, if enabled then installment plan should be returned as response</td></tr><tr><td>availablePlans</td><td>Array of object</td><td>O</td><td>Available Installment plans, this data returned if installment plan is enabled.</td></tr><tr><td>plan</td><td>Object</td><td>M</td><td>Selected installment plan of the available installments, sent when confirming payment</td></tr></tbody></table>


# Response & Failure Code

## Generic API Error

<table><thead><tr><th width="98.58984375" valign="middle">HTTP Method</th><th>Error Type</th><th>Error Code</th><th>Message</th><th>Scenario</th></tr></thead><tbody><tr><td valign="middle">400</td><td>API_ERROR</td><td>api_validation_error</td><td>The request was invalid, or an error occurred in downstream provider</td><td>User hit any endpoints with invalid payload</td></tr><tr><td valign="middle">401</td><td>API_ERROR</td><td>credentials_invalid</td><td>Access token is invalid, please verify that the authentication is provided and valid</td><td>User hit any endpoints but can't authenticate its API Access</td></tr><tr><td valign="middle">403</td><td>API_ERROR</td><td>resource_not_complete</td><td>Please verify that the setup is complete</td><td><p>User hit any endpoints but not set mandatory setup like redirect url, etc</p><p><br></p></td></tr><tr><td valign="middle">403</td><td>API_ERROR</td><td>forbidden_access</td><td>Provided API Key does not have the correct permissions to perform the operation</td><td>User is already authenticated but hit endpoints which out of scope of the authorization</td></tr><tr><td valign="middle">404</td><td>GATEWAY_ERROR</td><td>not_found</td><td>The requested URL does not exist</td><td>User is already authenticated but hit wrong endpoints</td></tr><tr><td valign="middle">404</td><td>GATEWAY_ERROR</td><td>resource_missing</td><td>The $resource with ID $id cannot be found</td><td>User is already authenticated but can't found the resources with specific ID</td></tr><tr><td valign="middle">409</td><td>GATEWAY_ERROR</td><td>duplicate_error</td><td>There's already existing record with the provided details</td><td>User is already authenticated and send payload request which conflicted with existing resource</td></tr><tr><td valign="middle">409</td><td>API_ERROR</td><td>idempotency_error</td><td>The same Idempotency-key was provided with a different payload</td><td>User is already authenticated and send same idempotency key with different payload request, can be different data or different endpoint</td></tr><tr><td valign="middle">429</td><td>API_ERROR</td><td>frequency_above_limit</td><td>The frequency limit of $resource is reached for operation $operation</td><td>User hit same endpoints repeatedly many times in short period</td></tr><tr><td valign="middle">500</td><td>GATEWAY_ERROR</td><td>internal_error</td><td>An internal error was encountered. Please Try again later</td><td>User is hit any endpoints but the pivot's server has encountered a problem</td></tr><tr><td valign="middle">502</td><td>GATEWAY_ERROR</td><td>bad_gateway</td><td>An internal error was encountered. Please Try again later</td><td>User is hit any endpoints but the pivot's server has encountered a problem</td></tr><tr><td valign="middle">503</td><td>GATEWAY_ERROR</td><td>service_unavailable</td><td>An internal error was encountered. Please Try again later</td><td>User is hit any endpoints but the pivot's server has encountered a problem</td></tr><tr><td valign="middle">504</td><td>GATEWAY_ERROR</td><td>gateway_timeout</td><td>An internal error was encountered. Please Try again later</td><td>User is hit any endpoints but the pivot's server has encountered a problem</td></tr></tbody></table>

## Response Code

<table data-full-width="false"><thead><tr><th>Response Code</th><th>Response Message</th><th width="330.4248046875">Error Object</th></tr></thead><tbody><tr><td>00</td><td>Success</td><td>-</td></tr><tr><td>api_validation_error</td><td>The request was invalid, or an error occurred in downstream provider</td><td><pre class="language-json"><code class="lang-json">{
  "type": "API_ERROR",
  "details": [
    {
      "field": "",
      "message": "paymentType 'MULTIPLE' is only allowed when mode is set to 'API'"
    }
  ],
  "traceId": ""
}
</code></pre></td></tr><tr><td>api_validation_error</td><td>The request was invalid, or an error occurred in downstream provider</td><td><pre class="language-json"><code class="lang-json">{
  "type": "API_ERROR",
  "details": [
    {
      "field": "",
      "message": "paymentType 'MULTIPLE' is not allowed for this payment method type"
    }
  ],
  "traceId": ""
}
</code></pre></td></tr><tr><td>api_validation_error</td><td>The request was invalid, or an error occurred in downstream provider</td><td><pre class="language-json"><code class="lang-json">{
  "type": "API_ERROR",
  "details": [
    {
      "field": "",
      "message": "The requested Virtual Account number is not within your assigned static VA range. Please check your configuration."
    }
  ],
  "traceId": ""
}
</code></pre></td></tr><tr><td>api_validation_error</td><td>The request was invalid, or an error occurred in downstream provider</td><td><pre class="language-json"><code class="lang-json">{
  "type": "API_ERROR",
  "details": [
    {
      "field": "",
      "message": "The Virtual Account number you requested has already been assigned. Please choose a different number."
    }
  ],
  "traceId": ""
}
</code></pre></td></tr><tr><td>api_validation_error</td><td>The request was invalid, or an error occurred in downstream provider</td><td><pre class="language-json"><code class="lang-json">{
  "type": "API_ERROR",
  "details": [
    {
      "field": "",
      "message": "The number of static QRIS you’ve created has reached the allowed limit. Cannot create a new QRIS."
    }
  ],
  "traceId": ""
}
</code></pre></td></tr><tr><td>api_validation_error</td><td>The request was invalid, or an error occurred in downstream provider</td><td><pre class="language-json"><code class="lang-json">{
  "type": "API_ERROR",
  "details": [
    {
      "field": "",
      "message": "QRIS with paymentType = MULTIPLE must not include an amount. Remove the amount value from the request."
    }
  ],
  "traceId": ""
}
</code></pre></td></tr><tr><td>api_validation_error</td><td>The request was invalid, or an error occurred in downstream provider</td><td><pre class="language-json"><code class="lang-json">{
  "type": "API_ERROR",
  "details": [
    {
      "field": "",
      "message": "No available VA number to assign. All dynamic VA numbers in the configured range are in use. Please try again later or adjust your range."
    }
  ],
  "traceId": ""
}
</code></pre></td></tr></tbody></table>

## Charge Failure

<table><thead><tr><th width="258.53125">Failure Code</th><th width="236.52734375">Failure Message</th><th width="241.51953125">Recommendation</th><th width="220.5390625">Card</th><th>QR</th><th>Virtual Account</th><th>Ewallet</th></tr></thead><tbody><tr><td>DECLINED_BY_CHANNEL</td><td><p>{{paymentSession.paymentMethod.type}} <br>payment failed. </p><p></p><p>The transaction was declined by the channel</p></td><td><p>[[ if CARD ]]</p><p>The cardholder should contact their issuer for clarification. The shopper can try again after resolving the issue with their issuer, or use another payment method.</p><p></p><p>[[ if EWALLET ]]</p><p>The user should contact their EWallet provider for clarification. The shopper can try again after resolving the issue with their issuer, or use another payment method.</p></td><td><p></p><p>IssuerAuthorizationCode</p><ul><li>01</li><li>03</li><li>05</li><li>06</li><li>12</li><li>13</li><li>22</li><li>40</li><li>57</li><li>61</li><li>62</li><li>63</li><li>64</li><li>65</li><li>6P</li><li>70</li><li>82</li><li>92</li><li>93</li><li>100</li><li>109</li><li>110</li><li>115</li></ul></td><td>-</td><td>-</td><td>TBD</td></tr><tr><td>DECLINED_BY_CHANNEL</td><td><p>{{paymentSession.paymentMethod.type}} <br>payment failed. </p><p></p><p>[[ if CARD ]]</p><p>The transaction was declined by the issuer due to the card has already expired.</p></td><td><p>[[ if CARD ]]</p><p>The shopper should try again with another valid card or use another payment method.</p></td><td><p></p><p>IssuerAuthorizationCode</p><ul><li>54</li><li>101</li></ul></td><td>-</td><td>-</td><td>TBD</td></tr><tr><td>DECLINED_BY_CHANNEL</td><td><p>{{paymentSession.paymentMethod.type}} <br>payment failed. </p><p></p><p>[[ if CARD ]]</p><p>The transaction was declined by the issuer due to the submitted CVV is invalid.</p></td><td><p>[[ if CARD ]]</p><p>The shopper should try again with another valid card or use another payment method.</p></td><td><p></p><p>IssuerAuthorizationCode</p><ul><li>82</li><li>N7</li></ul></td><td>-</td><td>-</td><td>TBD</td></tr><tr><td>INVALID_ACCOUNT</td><td><p>{{paymentSession.paymentMethod.type}} <br>payment failed. </p><p></p><p>[[ if CARD ]]</p><p>The transaction was declined by the issuer due to the card being marked as invalid.<br></p><p>[[ if EWALLET ]]</p><p>The transaction was declined by the partner due to the account being marked as invalid.</p></td><td><p>[[ if CARD ]]</p><p>The shopper should try again with another valid card or use another payment method.<br></p><p>[[ if EWALLET ]]</p><p>The shopper should try again with another valid account or use another payment method.</p></td><td><p></p><p>IssuerAuthorizationCode</p><ul><li>14</li><li>15</li><li>21</li><li>46</li><li>52</li><li>53</li><li>78</li><li>79</li><li>111</li></ul></td><td>-</td><td>-</td><td>TBD</td></tr><tr><td>AUTHENTICATION_FAILED</td><td><p>{{paymentSession.paymentMethod.type}} authentication failed. </p><p></p><p>[[ if CARD ]]</p><p>The 3DS attempt was rejected by the issuer.<br></p></td><td><p>[[ if CARD ]]</p><p>The cardholder should contact their issuer for clarification. The shopper can try again after resolving the issue with their issuer, or use another payment method.</p></td><td>authenticationResult.threeDsResult = FAILED</td><td>-</td><td>-</td><td>TBD</td></tr><tr><td>SUSPECTED_FRAUD</td><td><p>{{paymentSession.paymentMethod.type}} <br>payment failed. </p><p></p><p>[[ if CARD ]]</p><p>The transaction was declined by the issuer due to the card being marked as stolen or potential fraud.</p></td><td><p>[[ if CARD ]]</p><p>The card was reported as lost, the shopper should be validated for authenticity and be referred to their issuer.</p></td><td><p>IssuerAuthorizationCode</p><ul><li>04</li><li>07</li><li>41</li><li>43</li><li>200</li></ul></td><td>-</td><td>-</td><td>-</td></tr><tr><td>SUSPECTED_FRAUD</td><td><p>{{paymentSession.paymentMethod.type}} <br>payment failed. </p><p></p><p>The transaction was declined by channel due to the account being blocked or suspected as fraud.<br></p></td><td>The channel has declined the transaction due to suspicion of fraud, the shopper should be validated for authenticity and be referred to their issuer.</td><td><p>IssuerAuthorizationCode</p><ul><li>34</li><li>59</li><li>83</li></ul></td><td>-</td><td>-</td><td>TBD</td></tr><tr><td>INSUFFICIENT_FUND</td><td><p>{{paymentSession.paymentMethod.type}} payment failed. </p><p></p><p>[[ if CARD ]]</p><p>The transaction was declined by the issuer due to credit limit or balance is not sufficient.<br></p><p>[[ OTHER ]]</p><p>The transaction was declined due to the balance not sufficient or transaction limit exceeded.</p></td><td><p>[[ if CARD ]]</p><p>Insufficient funds in the cardholder's account. The shopper can try again after adding funds to their bank account, or use another payment method.</p><p></p><p>[[ OTHER ]] </p><p>Insufficient funds in the user’s account. The shopper can try again after adding funds to their account, or use another payment method.</p></td><td><p>IssuerAuthorizationCode</p><ul><li>51</li><li>116</li><li>121</li></ul></td><td>-</td><td>-</td><td>TBD</td></tr><tr><td>CHANNEL_UNAVAILABLE</td><td><p>{{paymentSession.paymentMethod.type}} <br>payment failed. </p><p></p><p>[[ if CARD ]]</p><p>The transaction failed due to the issuer being unavailable or having a system malfunction.</p><p></p><p>[[ OTHER ]]</p><p>The transaction failed due to the selected channel being unavailable or having a system malfunction.<br></p></td><td><p>[[ if CARD ]]</p><p>The issuing bank cannot be contacted. The shopper should try again or use another payment method.<br></p><p>[[ OTHER ]]</p><p>The channel cannot be contacted. The shopper should try again or use another payment method.</p></td><td><p>IssuerAuthorizationCode</p><ul><li>19</li><li>80</li><li>90</li><li>91</li><li>91</li><li>96</li><li>911</li></ul></td><td>TBD</td><td>TBD</td><td>TBD</td></tr><tr><td>CANCELLED_BY_USER</td><td><p>{{paymentSession.paymentMethod.type}} <br>payment failed. </p><p></p><p>[[ if CARD ]]</p><p>The 3DS attempt was cancelled by the cardholder.</p><p></p><p>[[ if EWALLET ]]</p><p>Payment cancelled by the user through the apps.</p></td><td>The shopper can try again or use another payment method</td><td>-</td><td>-</td><td>-</td><td>-</td></tr><tr><td>CHARGE_EXPIRED</td><td><p>{{paymentSession.paymentMethod.type}} </p><p>charge failed due to the transaction time has exceeded the channel expiration time.</p></td><td>The shopper can try again or use another payment method</td><td>3DS authentication expired</td><td>QR expired</td><td>VA number expired</td><td>TBD</td></tr></tbody></table>


# Status

## Payment Session Statuses

<table><thead><tr><th width="181.94140625">Status</th><th width="194.7734375">Dashboard status wording</th><th width="184.4453125">Cancellable </th><th width="189.421875">Definition</th><th width="181.6328125">Action items</th></tr></thead><tbody><tr><td>REQUIRE_PAYMENT_METHOD</td><td>Waiting for payment method</td><td><p></p><p>✅ By Merchant &#x26; Customer</p><p></p><p>Possible values:</p><ul><li>REQUESTED_BY_CUSTOMER</li><li>DUPLICATED</li><li>VOID_SESSION</li></ul></td><td>When Merchant created payment session and waiting for user to choose payment method</td><td>Choose payment Method</td></tr><tr><td>REQUIRE_CONFIRMATION</td><td>Waiting for confirmation</td><td><p>✅ By Merchant &#x26; Customer</p><p></p><p>Possible values:</p><ul><li>REQUESTED_BY_CUSTOMER</li><li>DUPLICATED</li><li>VOID_SESSION</li></ul></td><td>After payment method is selected, waiting for the payment session to be confirmed and continue to charge process</td><td>Confirm</td></tr><tr><td>REQUIRE_ACTION</td><td>Waiting for user action</td><td>❌ For API method</td><td>Payment method (Charge) already initiated and Waiting for customer action</td><td><p></p><ul><li>Push Payment (VA &#x26; QR) = Customer to initiate transaction</li><li>Pull Payment (Card &#x26; Ewallet) = Customer to fill in details to be charged</li></ul></td></tr><tr><td>ACTIVE</td><td>Waiting for charged</td><td>❌</td><td><mark style="color:orange;"><code>Multiple</code></mark> use payment type is already Active and Waiting for customer action</td><td><p>Push Payment </p><p>(VA &#x26; QR) = Customer to initiate transaction</p></td></tr><tr><td>PROCESSING</td><td>Processing</td><td>❌</td><td>Payment already processed by partners, charge is confirmed and already initiate the payment process</td><td>Wait for callback</td></tr><tr><td><p>[Final Status]</p><p>CANCELLED</p></td><td>Cancelled</td><td>❌</td><td>Session cancelled by merchant / customer</td><td>Redirect to failed payment</td></tr><tr><td><p>[Final Status]</p><p>EXPIRED</p></td><td>Expired</td><td>❌</td><td>Customer exceed payment session time</td><td>Redirect to failed payment</td></tr><tr><td><p>[Final Status]</p><p>INACTIVE</p></td><td>Inactive</td><td>❌</td><td>Multiple use payment type is inactive</td><td>Create New Payment Session to generate  Payment Type = <mark style="color:orange;"><code>MULTIPLE</code></mark></td></tr><tr><td><p>[Final Status]</p><p>PAID</p></td><td>Paid</td><td>❌</td><td>Payment session successfully paid</td><td>Redirect to successful payment</td></tr></tbody></table>

## Charge Statuses

| Status                               | Definition                                                                                                                     | Action items                                                                                                                                                         |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WAITING\_FOR\_USER\_ACTION           | Payment session is confirmed and waiting for customer to perform action                                                        | <p></p><ul><li>Push Payment (VA & QR) = Customer to initiate transaction</li><li>Pull Payment (Card & Ewallet) = Customer to fill in details to be charged</li></ul> |
| WAITING\_FOR\_AUTHENTICATION         | <p>Only applicable for pull payment</p><p>Waiting for partner to authenticate the transaction</p>                              | Input OTP or PIN                                                                                                                                                     |
| PROCESSING                           | Partner processing the transaction                                                                                             | Waiting for partner to complete the process                                                                                                                          |
| WAITING\_FOR\_CAPTURE                | <p>Only applicable for Cards and if autoCapture: false</p><p>Charge already authorized (money booked) but not captured yet</p> | Merchant to call Capture                                                                                                                                             |
| <p>\[Final Status]</p><p>FAILED</p>  | Charge failed                                                                                                                  | -                                                                                                                                                                    |
| <p>\[Final Status]</p><p>EXPIRED</p> | Charge expired                                                                                                                 | -                                                                                                                                                                    |
| <p>\[Final Status]</p><p>SUCCESS</p> | Charge is successful & completed                                                                                               | -                                                                                                                                                                    |

# Refunds

# Create Refund

## Method and URL

<mark style="color:green;">`POST`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v1/refunds

## Request

**Request Body**

```json
{
    "clientReferenceId": "1755665477",
    "paymentSessionId": "44a14481-fa75-49a5-b17f-d03d8c5d52a6",
    "isFullAmount": true,
    "amount": {
        "value": "10000",
        "currency": "IDR"
    },
    "reason": "REQUESTED_BY_CUSTOMER",
    "description": "Customer didn't receive the Product",
    "method": "AUTO",
    "transferDestination": {
        "channelCode": "BCA",
        "channelInformation": {
            "accountNumber": "17677665415",
            "accountName": "Reforza Jordan Geotama"
        },
        "description": "Refund Pivot"
    },
    "metadata": {
        "notes": "Customer called support"
    }
}
```

**Detail Parameter Request**

<table><thead><tr><th width="212.58984375">Parameter</th><th width="132.98046875">Data Type</th><th width="114.7509765625">Character Limit</th><th width="119.09375">Requirement</th><th width="270.0029296875">Description</th></tr></thead><tbody><tr><td>Refund</td><td>Object</td><td>-</td><td>M</td><td><a data-mention href="refund-object">refund-object</a></td></tr></tbody></table>

## Response

**Response Body**

```json
{
    "code": "00",
    "message": "Success",
    "data": {
        "id": "01990e74-5bc9-79a5-a651-400af0ad13ef",
        "clientReferenceId": "1755665477",
        "paymentSessionId": "44a14481-fa75-49a5-b17f-d03d8c5d52a6",
        "chargeId": "110eb890-d238-4212-aedc-533a8c77a53e",
        "capturedAmount": {
            "currency": "IDR",
            "value": "10000.00"
        },
        "isFullAmount": true,
        "amount": {
            "currency": "IDR",
            "value": "10000.00"
        },
        "status": "PENDING",
        "reason": "REQUESTED_BY_CUSTOMER",
        "description": "Customer didn't receive the Product",
        "method": "AUTO",
        "transferDestination": {
            "channelCode": "BCA",
            "channelInformation": {
                "accountNumber": "17677665415",
                "accountName": "Reforza Jordan Geotama"
            },
            "description": "Refund Pivot"
        },
        "metadata": {
            "notes": "Customer called support"
        },
        "createdAt": "2025-09-03T07:22:10.761667115Z",
        "updatedAt": "2025-09-03T07:22:10.761667203Z"
    }
}
```

**Detail Parameter Response**

<table><thead><tr><th width="210.4765625">Parameter</th><th width="119.98046875">Data Type</th><th width="137.9453125">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>Refund</td><td>Object</td><td>M</td><td><a data-mention href="refund-object">refund-object</a></td></tr></tbody></table>


# Retrieve Refund Details

## Method and URL

<mark style="color:green;">`GET`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v1/refunds/{id}

<mark style="color:orange;">`id`</mark> from the Refund ID whenever you create Refund

## Response

**Response Body**

```json
{
    "code": "00",
    "message": "Success",
    "data": {
        "id": "01990e74-5bc9-79a5-a651-400af0ad13ef",
        "clientReferenceId": "1755665477",
        "paymentSessionId": "44a14481-fa75-49a5-b17f-d03d8c5d52a6",
        "chargeId": "110eb890-d238-4212-aedc-533a8c77a53e",
        "capturedAmount": {
            "currency": "IDR",
            "value": "10000.00"
        },
        "isFullAmount": true,
        "amount": {
            "currency": "IDR",
            "value": "10000.00"
        },
        "status": "SUCCESS",
        "reason": "REQUESTED_BY_CUSTOMER",
        "description": "Customer didn't receive the Product",
        "destinationType": "CHANNEL",
        "method": "AUTO",
        "transferDestination": {
            "channelCode": "BCA",
            "channelInformation": {
                "accountNumber": "17677665415",
                "accountName": "Reforza Jordan Geotama"
            },
            "description": "Refund Pivot"
        },
        "metadata": {
            "notes": "Customer called support"
        },
        "createdAt": "2025-09-03T07:22:11Z",
        "updatedAt": "2025-09-03T07:22:13Z"
    }
}
```

**Detail Parameter Response**

<table><thead><tr><th width="216.8359375">Parameter</th><th width="108.55859375">Data Type</th><th width="123.18359375">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>Refund</td><td>Object</td><td>M</td><td><a data-mention href="refund-object">refund-object</a></td></tr></tbody></table>


# Retrieve list of Refund

## Method and URL

<mark style="color:green;">`GET`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v1/refunds

## Response

**Response Body**

```json
{
  "code": "00",
  "message": "Success",
  "data": [
    {
      "id": "01990e74-5bc9-79a5-a651-400af0ad13ef",
      "clientReferenceId": "1755665477",
      "paymentSessionId": "44a14481-fa75-49a5-b17f-d03d8c5d52a6",
      "chargeId": "110eb890-d238-4212-aedc-533a8c77a53e",
      "capturedAmount": {
        "currency": "IDR",
        "value": "10000.00"
      },
      "isFullAmount": true,
      "amount": {
        "currency": "IDR",
        "value": "10000.00"
      },
      "status": "SUCCESS",
      "reason": "REQUESTED_BY_CUSTOMER",
      "description": "Customer didn't receive the Product",
      "destinationType": "CHANNEL",
      "method": "AUTO",
      "transferDestination": {
        "channelCode": "BCA",
        "channelInformation": {
          "accountNumber": "17677665415",
          "accountName": "Reforza Jordan Geotama"
        },
        "description": "Refund Pivot"
      },
      "metadata": {
        "notes": "Customer called support"
      },
      "createdAt": "2025-09-03T07:22:11Z",
      "updatedAt": "2025-09-03T07:22:13Z"
    },
    {
      "id": "01990e4f-bb8d-7e3d-ba3f-463176c925e8",
      "clientReferenceId": "1755054798",
      "paymentSessionId": "edb4e7c4-7842-4ec6-831a-f85c5bbdf3a4",
      "chargeId": "4f5eebdd-00ba-4202-b6ed-7056c1865f2d",
      "capturedAmount": {
        "currency": "IDR",
        "value": "10000.00"
      },
      "isFullAmount": false,
      "amount": {
        "currency": "IDR",
        "value": "500.00"
      },
      "status": "SUCCESS",
      "reason": "REQUESTED_BY_CUSTOMER",
      "description": "Refund due to duplicate transaction",
      "destinationType": "ACCOUNT",
      "method": "AUTO",
      "transferDestination": {
        "channelCode": "BCA",
        "channelInformation": {
          "accountNumber": "17677665415",
          "accountName": "Reforza Jordan Geotama"
        },
        "description": "Reforza Pivot"
      },
      "metadata": {
        "notes": "Customer called support"
      },
      "createdAt": "2025-09-03T06:42:10Z",
      "updatedAt": "2025-09-03T06:42:13Z"
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 10,
    "totalItems": 47,
    "totalPages": 5
  }
}
```

**Detail Parameter Response**

<table><thead><tr><th width="216.1484375">Parameter</th><th width="117.94921875">Data Type</th><th width="128.16796875">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>Refund</td><td>Array of Object</td><td>M</td><td><a data-mention href="refund-object">refund-object</a></td></tr><tr><td>pagination</td><td>Object</td><td>M</td><td><a data-mention href="../../api-information/pagination">pagination</a></td></tr></tbody></table>


# Retrieve list of Refund

## Method and URL

<mark style="color:green;">`GET`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v1/refunds

## Response

**Response Body**

```json
{
  "code": "00",
  "message": "Success",
  "data": [
    {
      "id": "01990e74-5bc9-79a5-a651-400af0ad13ef",
      "clientReferenceId": "1755665477",
      "paymentSessionId": "44a14481-fa75-49a5-b17f-d03d8c5d52a6",
      "chargeId": "110eb890-d238-4212-aedc-533a8c77a53e",
      "capturedAmount": {
        "currency": "IDR",
        "value": "10000.00"
      },
      "isFullAmount": true,
      "amount": {
        "currency": "IDR",
        "value": "10000.00"
      },
      "status": "SUCCESS",
      "reason": "REQUESTED_BY_CUSTOMER",
      "description": "Customer didn't receive the Product",
      "destinationType": "CHANNEL",
      "method": "AUTO",
      "transferDestination": {
        "channelCode": "BCA",
        "channelInformation": {
          "accountNumber": "17677665415",
          "accountName": "Reforza Jordan Geotama"
        },
        "description": "Refund Pivot"
      },
      "metadata": {
        "notes": "Customer called support"
      },
      "createdAt": "2025-09-03T07:22:11Z",
      "updatedAt": "2025-09-03T07:22:13Z"
    },
    {
      "id": "01990e4f-bb8d-7e3d-ba3f-463176c925e8",
      "clientReferenceId": "1755054798",
      "paymentSessionId": "edb4e7c4-7842-4ec6-831a-f85c5bbdf3a4",
      "chargeId": "4f5eebdd-00ba-4202-b6ed-7056c1865f2d",
      "capturedAmount": {
        "currency": "IDR",
        "value": "10000.00"
      },
      "isFullAmount": false,
      "amount": {
        "currency": "IDR",
        "value": "500.00"
      },
      "status": "SUCCESS",
      "reason": "REQUESTED_BY_CUSTOMER",
      "description": "Refund due to duplicate transaction",
      "destinationType": "ACCOUNT",
      "method": "AUTO",
      "transferDestination": {
        "channelCode": "BCA",
        "channelInformation": {
          "accountNumber": "17677665415",
          "accountName": "Reforza Jordan Geotama"
        },
        "description": "Reforza Pivot"
      },
      "metadata": {
        "notes": "Customer called support"
      },
      "createdAt": "2025-09-03T06:42:10Z",
      "updatedAt": "2025-09-03T06:42:13Z"
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 10,
    "totalItems": 47,
    "totalPages": 5
  }
}
```

**Detail Parameter Response**

<table><thead><tr><th width="216.1484375">Parameter</th><th width="117.94921875">Data Type</th><th width="128.16796875">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>Refund</td><td>Array of Object</td><td>M</td><td><a data-mention href="refund-object">refund-object</a></td></tr><tr><td>pagination</td><td>Object</td><td>M</td><td><a data-mention href="../../api-information/pagination">pagination</a></td></tr></tbody></table>


# Refund Callback

## Method and URL

<mark style="color:green;">`POST`</mark> [www.yourcompany.com/payment\\\_callback\\\_url](http://www.yourcompany.com/payment\\_callback\\_url)

## Request

**Header Request**

<table><thead><tr><th>Parameter </th><th width="117">Data Type</th><th width="131">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>X-API-Key</td><td>String</td><td>M</td><td>Callback API Key, an additional API Key used specifically for receiving callbacks</td></tr><tr><td>Content-Type</td><td>String</td><td>M</td><td>application/JSON</td></tr><tr><td>Accept</td><td>String</td><td>M</td><td>application/JSON</td></tr></tbody></table>

**Request Body**

```json
{
  "event": "REFUND.SUCCESS",
  "data": {
    "id": "01990e4f-bb8d-7e3d-ba3f-463176c925e8",
    "clientReferenceId": "1755054798",
    "paymentSessionId": "edb4e7c4-7842-4ec6-831a-f85c5bbdf3a4",
    "chargeId": "4f5eebdd-00ba-4202-b6ed-7056c1865f2d",
    "capturedAmount": {
      "currency": "IDR",
      "value": "10000.00"
    },
    "isFullAmount": false,
    "amount": {
      "currency": "IDR",
      "value": "500.00"
    },
    "status": "SUCCESS",
    "reason": "REQUESTED_BY_CUSTOMER",
    "description": "Refund due to duplicate transaction",
    "destinationType": "ACCOUNT",
    "method": "AUTO",
    "transferDestination": {
      "channelCode": "BCA",
      "channelInformation": {
        "accountNumber": "17677665415",
        "accountName": "Reforza Jordan Geotama"
      },
      "description": "Refund Pivot"
    },
    "metadata": {
      "notes": "Customer called support"
    },
    "createdAt": "2025-09-03T06:42:10Z",
    "updatedAt": "2025-09-03T06:42:13Z"
  }
}
```

**Detail Parameter Request**

<table><thead><tr><th width="196.24609375">Parameter</th><th width="120">Data Type</th><th width="128">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>event</td><td>String</td><td>M</td><td><p>List of Event Names:</p><ol><li>REFUND.PENDING</li><li>REFUND.WAITING_BANK_TRANFER</li><li>REFUND.SUCCESS</li><li>REFUND.FAILED</li></ol></td></tr><tr><td>Refund</td><td>Object</td><td>M</td><td><a data-mention href="refund-object">refund-object</a></td></tr></tbody></table>



# Refund Simulation

| Scenario                                                      | Client Reference ID (clientReferenceId) | Account Number (accountNumber) |
| ------------------------------------------------------------- | --------------------------------------- | ------------------------------ |
| Refund direct to bank transfer success                        | any                                     | 999966660001                   |
| Refund failed to channel, fallback to bank transfer success   | 1001-{{your reference}}                 | 999966660001                   |
| Refund failed to channel, fallback to bank transfer fails     | 2001-{{your reference}}                 | 999966660008                   |
| Refund direct to bank transfer fails due to account not found | 2002-{{your reference}}                 | 999966660002                   |


# Refund Object

```json
{
  "id": "01990e74-5bc9-79a5-a651-400af0ad13ef",
  "clientReferenceId": "1755665477",
  "paymentSessionId": "44a14481-fa75-49a5-b17f-d03d8c5d52a6",
  "chargeId": "110eb890-d238-4212-aedc-533a8c77a53e",
  "capturedAmount": {
    "currency": "IDR",
    "value": "10000.00"
  },
  "isFullAmount": true,
  "amount": {
    "currency": "IDR",
    "value": "10000.00"
  },
  "status": "SUCCESS",
  "reason": "REQUESTED_BY_CUSTOMER",
  "description": "Customer didn't receive the Product",
  "destinationType": "CHANNEL",
  "method": "AUTO",
  "transferDestination": {
    "channelCode": "BCA",
    "channelInformation": {
      "accountNumber": "17677665415",
      "accountName": "Reforza Jordan Geotama"
    },
    "description": "Refund Pivot"
  },
  "metadata": {
    "notes": "Customer called support"
  },
  "createdAt": "2025-09-03T07:22:11Z",
  "updatedAt": "2025-09-03T07:22:13Z"
}
```

**Detail Refund Object**&#x20;

<table data-full-width="false"><thead><tr><th width="227.640625">Parameter</th><th width="132.4912109375">Data Type</th><th width="93.6103515625">Character Limit</th><th width="116.8662109375">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>id</td><td>String</td><td>-</td><td>Auto Generated</td><td>Unique ID generated from Pivot as refund identifier</td></tr><tr><td>clientReferenceId</td><td>Alphanumeric</td><td>1-100</td><td>M</td><td>Unique ID from merchant to identify the refund</td></tr><tr><td>paymentSessionId</td><td>String</td><td>-</td><td>C</td><td>Payment Session ID merchant intend to perform refund on</td></tr><tr><td>chargeId</td><td>String</td><td>-</td><td>C</td><td>Singular Charge ID merchant intend to perform refund on</td></tr><tr><td>capturedAmount</td><td>Object</td><td>-</td><td>M</td><td>Total captured amount from Payment Session ID – amount available to be refunded</td></tr><tr><td><ul><li>currency</li></ul></td><td>String</td><td>1-3</td><td>M</td><td>Currency ISO 4217</td></tr><tr><td><ul><li>value</li></ul></td><td>String</td><td>1-18</td><td>M</td><td>Amount value</td></tr><tr><td>isFullAmount</td><td>Boolean</td><td>-</td><td>C</td><td><p>Indicate if the refund amount is the same with capturedAmount, possible values</p><ul><li>false (default) </li><li>true</li></ul></td></tr><tr><td>amount</td><td>Object</td><td>-</td><td>C</td><td>Required if <mark style="color:orange;"><code>isFullAmount</code></mark> = false</td></tr><tr><td><ul><li>currency</li></ul></td><td>String</td><td>1-3</td><td>M</td><td>Currency ISO 4217</td></tr><tr><td><ul><li>value</li></ul></td><td>String</td><td>1-18</td><td>M</td><td>Amount value</td></tr><tr><td>status</td><td>String</td><td>-</td><td>M</td><td><p>Status of Refund, possible values:</p><ul><li>PENDING</li><li>WAITING_BANK_TRANSFER</li><li>SUCCESS</li><li>FAILED</li><li>CANCELLED</li></ul></td></tr><tr><td>reason</td><td>String</td><td>-</td><td>M</td><td><p>Reason for user performing refund, possible values:</p><ul><li>SUSPECT_FRAUDULENT</li><li>DUPLICATE</li><li>REQUESTED_BY_CUSTOMER</li><li>CANCELLATION</li><li>OTHERS</li></ul></td></tr><tr><td>description</td><td>String</td><td>0-50</td><td>O</td><td>Information describing the refund for merchant internal notes</td></tr><tr><td>destinationType</td><td>String</td><td>-</td><td>C</td><td><p>Value is available after refund reached to final status, indicating the refund destination OR if <mark style="color:orange;"><code>status</code></mark> = <mark style="color:orange;"><code>WAITING_BANK_TRANSFER</code></mark> then value will always be ACCOUNT</p><p><br></p><p>Possible values</p><ul><li>CHANNEL → fund is credited back to the payment channel used on the transaction</li><li>ACCOUNT → fund is transferred to the submitted destination</li></ul></td></tr><tr><td>method</td><td>String</td><td>-</td><td>O</td><td><p>Refund method preferred by Merchant / customer, possible values:</p><ul><li>AUTO (default) →<br>Pivot will perform refund through Channel, if failed then fallback to Bank Transfer if available</li><li>TRANSFER_ONLY →<br>Refund will be performed through Bank Transfer only, Merchant is required to send the destination account</li></ul></td></tr><tr><td>transferDestination</td><td>Object</td><td>-</td><td>C</td><td>Required if <mark style="color:orange;"><code>preferredMethod</code></mark> = <mark style="color:orange;"><code>TRANSFER_ONLY</code></mark></td></tr><tr><td><ul><li>channelCode</li></ul></td><td>String</td><td>-</td><td>M</td><td><p>Channel code for payout destination such as Bank, E wallet or other channels</p><p></p><p>List of Channel code can be accessed <a data-mention href="../payout-local/channel-codes">channel-codes</a></p></td></tr><tr><td><ul><li>channelInformation</li></ul></td><td>Object</td><td>-</td><td>M</td><td></td></tr><tr><td><blockquote><ul><li>accountNumber</li></ul></blockquote></td><td>String</td><td>-</td><td>M</td><td>Account Number of payout destination</td></tr><tr><td><blockquote><ul><li>accountName</li></ul></blockquote></td><td>String</td><td>-</td><td>M</td><td>Account Name of payout destination</td></tr><tr><td><ul><li>description</li></ul></td><td>String</td><td>-</td><td>O</td><td><p>Information that will be seen by beneficiary account in statement</p><p>Note:</p><ul><li>Maximum length each channel code is 20 characters</li><li>Support alphanumeric characters only</li></ul></td></tr><tr><td>metadata</td><td>Object</td><td>-</td><td>O</td><td>Free object for merchant to store any extra information about the payment session</td></tr><tr><td>createdAt</td><td>String</td><td>-</td><td>M</td><td>Refund created time with format YYYY-MM-DDTHH:MM:SSZ</td></tr><tr><td>updatedAt</td><td>String</td><td>-</td><td>M</td><td>Refund latest updated time with format YYYY-MM-DDTHH:MM:SSZ</td></tr></tbody></table>



# Payout (Local)

## API Collections

<table data-view="cards"><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><a data-mention href="payout-local/payout-balance">payout-balance</a></td><td>Get Payout Balance information</td></tr><tr><td><a data-mention href="payout-local/inquiry-account">inquiry-account</a></td><td>Inquire Payout beneficiary account information</td></tr><tr><td><a data-mention href="payout-local/retrieve-inquiry-account">retrieve-inquiry-account</a></td><td>Retrieve Inquiry Account results by Inquiry Account ID</td></tr><tr><td><a data-mention href="payout-local/create-a-payout">create-a-payout</a></td><td>Create payout transactions, supports capability for bulk payout or single payout.</td></tr><tr><td><a data-mention href="payout-local/retrieve-a-single-payout-request">retrieve-a-single-payout-request</a></td><td>Retrieve payout by ID and reference Id</td></tr><tr><td><a data-mention href="payout-local/retrieve-a-payout">retrieve-a-payout</a></td><td>Retrieve Payout by ID</td></tr><tr><td><a data-mention href="payout-local/payout-callback">payout-callback</a></td><td>Register your Webhook URL and get payout notification whenever Payout request status is DONE</td></tr><tr><td><a data-mention href="payout-local/payout-object">payout-object</a></td><td>A payout object is created when you initiate a payout to a local bank account.</td></tr></tbody></table>

## Miscellaneous

<table data-view="cards"><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><a data-mention href="payout-local/response-codes-and-failure-reason">response-codes-and-failure-reason</a></td><td></td></tr><tr><td><a data-mention href="payout-local/test-scenarios">test-scenarios</a></td><td></td></tr><tr><td><a data-mention href="payout-local/channel-codes">channel-codes</a></td><td></td></tr></tbody></table>


# ⭐️ Local Payout API Integration Guide

This guide explains the complete integration flow for sending local payouts using the Pivot Payment API. It covers authentication, beneficiary validation, payout creation, webhook handling, and payout status reconciliation.

This page provides an end-to-end workflow. For full endpoint specifications, refer to the individual API references.

### Overview

Pivot Local Payout API allows merchants to transfer funds from their Pivot balance to beneficiary bank accounts in Indonesia.

A typical payout integration consists of the following steps:

1. Authenticate API requests
2. Check available payout balance
3. Validate beneficiary bank account (Inquiry Account)
4. Create payout transaction
5. Receive payout status via webhook callback
6. Retrieve payout status for reconciliation (optional)

***

### Prerequisites

Before integrating the payout API, ensure that:

* Your merchant account has been activated for **Local** **Payout**.
* You have received the following credentials from Pivot:

| Credential    | Description                        |
| ------------- | ---------------------------------- |
| Client Key    | Used to authenticate requests      |
| Client Secret | Used to sign requests              |
| Merchant ID   | Unique identifier for your account |

You should also configure:

* A **secure webhook endpoint** to receive payout callbacks
* Proper **idempotency handling** to avoid duplicate payouts

***

### Base URL

**Production**

```
https://api.pivot-payment.com
```

**Sandbox**

```
https://api-stg.pivot-payment.com
```

***

### Authentication

All API requests must include authentication headers. A valid access token must be included in the `Authorization` header when sending requests to the Pivot API.

Endpoint reference:

[**Authentication**](https://pivot-payment.gitbook.io/pivot-docs/api-references/api-information/authentication)

Example headers:

```
X-MERCHANT-ID: [Your Client ID]
X-MERCHANT-SECRET: [Your Client Secret]
```

Example request:

```
{
    "grantType": "client_credentials"
}
```

Example response:

```
{
    "code": "00",
    "message": "Success",
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJiYWNrZW5kLXBvcnRhbCIsInN1YiI6IjkyMmUzOWFiLTc1NjUtNDlmNi1iODRmLWZiNTYxMjI4MjFhZSIsImV4cCI6MTcxNDAyODE0MywiY2xpZW50SWQiOiI5MjJlMzlhYi03NTY1LTQ5ZjYtYjg0Zi1mYjU2MTIyODIxYWUiLCJtZXJjaGFudElkIjoiOTIyZTM5YWItNzU2NS00OWY2LWI4NGYtZmI1NjEyMjgyMWFlIn0.EkxckAJEcB4fgVU97mQC5eooBwQ7vhexzksafyUgOPU",
        "expiresIn": "900",
        "tokenType": "Bearer"
    }
}
```

Access tokens expire after **900 seconds (15 minutes)**. You must request a new access token once the current token expires.

***

### Recommended Integration Flow

The recommended payout flow is shown below.

```
Merchant System
      │
      │
      ├── Check Balance
      │
      ├── Inquiry Account (validate beneficiary)
      │
      ├── Create Payout
      │
      ├── Receive Webhook Callback
      │
      └── Retrieve Payout Status (optional)
```

***

### Step 1 — Check Payout Balance

Before creating a payout, ensure that your Pivot balance is sufficient to cover the transaction amount. If the balance is insufficient, the payout request will not be processed. The transaction will appear in the dashboard under **Local** **Payout → Need Action → Waiting for Top Up**, where you may **retry** the payout after topping up your balance or **cancel** the transaction.

Endpoint reference:

[**Payout Balance**](https://pivot-payment.gitbook.io/pivot-docs/api-references/~/changes/62/api-lists/payout-local/payout-balance)

Example request:

```
GET /v1/payouts/balance?currency=IDR
```

Example response:

```
{
  "code": "00",
  "message": "Success",
  "data": {
    "availableBalance": {
      "currency": "IDR",
      "value": "4440916697.16"
    }
  }
}
```

***

### Step 2 — Validate Beneficiary Account

Before creating a payout, validate the beneficiary account using **Inquiry Account**.

This ensures:

* the bank account exists
* the account name matches the expected beneficiary

Endpoint reference:

[**Inquiry Account**](https://pivot-payment.gitbook.io/pivot-docs/api-references/~/changes/62/api-lists/payout-local/inquiry-account)

Example request:

```
{
  "channelCode": "BCA",
  "channelInformation": {
    "accountNumber": "999966660001",
    "accountName": "Reforza Pivot"
  }
}
```

Example response:

```
{
  "account_name": "BUDI SANTOSO",
  "bank_code": "014",
  "account_number": "1234567890",
  "status": "VALID"
}
```

You should display the returned **account\_name** to your user for confirmation.

***

### Step 3 — Create Payout

Once the beneficiary is validated, create the payout transaction. You have two options to create a payout:

* Using inquiryId, or
* Using channel information

Endpoint reference:

[**Create Payout**](https://pivot-payment.gitbook.io/pivot-docs/api-references/api-lists/payout-local/create-a-payout)

Example request using inquiryId:

```
{
  "payouts": [
    {
      "referenceId": "1999",
      "inquiryId": "d6a46a2c-1b26-40c5-9ca3-e063e69635a0",
      "amount": {
        "value": "100000",
        "currency": "IDR"
      },
      "description": "test Reforza Pivot"
    }
  ]
}
```

Example request using channel information:

```
{
  "payouts": [
    {
      "referenceId": "999",
      "channelCode": "BRI",
      "channelInformation": {
        "accountNumber": "888801000157508",
        "accountName": "Reforza Pivot"
      },
      "amount": {
        "value": "100000",
        "currency": "IDR"
      },
      "description": "test Reforza Pivot"
    }
  ]
}
```

*Note: For the full list of channel codes, refer to* [**Channel Codes**](https://pivot-payment.gitbook.io/pivot-docs/api-references/api-lists/payout-local/channel-codes).

Example response:

```
{
  "code": "00",
  "message": "Success",
  "data": {
    "created": "2024-05-13T08:21:44.967496435Z",
    "merchantId": "922e39ab-7565-49f6-b84f-fb56122821ae",
    "payouts": [
      {
        "amount": {
          "currency": "IDR",
          "value": "100000"
        },
        "inquiryId": "",
        "channelCode": "BRI",
        "channelInformation": {
          "accountName": "Reforza Pivot",
          "accountNumber": "888801000157508"
        },
        "description": "test Reforza Pivot",
        "referenceId": "999"
      }
    ],
    "status": "IN_PROGRESS",
    "updated": "2024-05-13T08:21:44.967496538Z",
    "uuid": "d6a46a2c-1b26-40c5-9ca3-e063e69635a0"
  }
}
```

Important notes:

* `reference_id` must be **unique** for each payout.
* Use **idempotency** to prevent duplicate transactions.

***

### Step 4 — Handle Webhook Callback

Pivot sends a webhook callback when the payout status is updated.

Typical payout statuses:

| Status     | Meaning                                          |
| ---------- | ------------------------------------------------ |
| PROCESSING | Payout is being processed                        |
| SUCCESS    | Funds successfully transferred                   |
| FAILED     | Payout failed                                    |
| DELAYED    | Payout is taking longer than expected to process |

Example webhook payload for bulk payout:

```
{
  "event": "PAYOUT.DONE",
  "data": {
    "uuid": "d6a46a2c-1b26-40c5-9ca3-e063e69635a0",
    "merchantId": "922e39ab-7565-49f6-b84f-fb56122821ae",
    "payoutResults": {
      "totalPendingCount": 0,
      "totalPendingAmount": 0,
      "totalSuccessCount": 1,
      "totalSuccessAmount": 100000,
      "totalFailedCount": 0,
      "totalFailedAmount": 0,
      "totalCancelledCount": 0,
      "totalCancelledAmount": 0
    },
    "status": "DONE"
  }
}
```

Example webhook payload for single payout:

```
{
  "event": "PAYOUT.SUCCESS",
  "data": {
    "uuid": "d6a46a2c-1b26-40c5-9ca3-e063e69635a0",
    "merchantId": "922e39ab-7565-49f6-b84f-fb56122821ae",
    "payouts": {
      "referenceId": "TestReforzaPivot001",
      "amount": {
        "currency": "IDR",
        "value": "100000"
      },
      "status": "SUCCESS",
      "reason": ""
    }
  }
}
```

Your webhook endpoint should:

1. Verify the callback authenticity
2. Update payout status in your system
3. Return HTTP 200 to acknowledge receipt

Example response:

```
HTTP 200 OK
```

If your endpoint returns an error or timeout, Pivot may retry sending the webhook. For more details on the retry mechanism, refer to [**Callback**](https://pivot-payment.gitbook.io/pivot-docs/api-references/api-information/callback).

***

### Step 5 — Retrieve Payout Status (Optional)

You may retrieve payout status via API for reconciliation or if webhook delivery fails.

Endpoint reference:

[**Retrieve Payout**](https://pivot-payment.gitbook.io/pivot-docs/api-references/api-lists/payout-local/retrieve-a-payout)

Example request:

```
GET /v1/payouts/{uuid}
```

Example response:

```
{
  "code": "00",
  "message": "Success",
  "data": {
    "created": "2024-05-13T08:21:45Z",
    "merchantId": "922e39ab-7565-49f6-b84f-fb56122821ae",
    "payoutResults": {
      "totalFailedAmount": 0,
      "totalFailedCount": 0,
      "totalPendingAmount": 0,
      "totalPendingCount": 0,
      "totalSuccessAmount": 100000,
      "totalSuccessCount": 1,
      "totalCancelledCount": 0,
      "totalCancelledAmount": 0
    },
    "payouts": [
      {
        "amount": {
          "currency": "IDR",
          "value": "100000"
        },
        "channelCode": "BRI",
        "channelInformation": {
          "accountName": "Reforza Pivot",
          "accountNumber": "888801000157508"
        },
        "created": "2024-05-13T08:21:45Z",
        "inquiryId": "d6a46a2c-1b26-40c5-9ca3-e063e69635a0",
        "description": "test Reforza Pivot",
        "referenceId": "999",
        "status": "SUCCESS",
        "reason": "",
        "updated": "2024-05-13T08:21:46Z"
      }
    ],
    "status": "DONE",
    "updated": "2024-05-13T08:21:46Z",
    "uuid": "d6a46a2c-1b26-40c5-9ca3-e063e69635a0"
  },
  "pagination": {
    "page": 1,
    "perPage": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

To retrieve the details of a specific payout, refer to [**Retrieve a Single Payout Request**](https://pivot-payment.gitbook.io/pivot-docs/api-references/api-lists/payout-local/retrieve-a-single-payout-request)**.**

Example request:

```
GET /v1/payouts/:{uuid}?referenceId=:{referenceId}
```

Example response:

```
{
  "code": "00",
  "message": "Success",
  "data": {
    "merchantId": "922e39ab-7565-49f6-b84f-fb56122821ae",
    "payoutResults": {
      "totalFailedAmount": 0,
      "totalFailedCount": 0,
      "totalPendingAmount": 0,
      "totalPendingCount": 0,
      "totalSuccessAmount": 100000,
      "totalSuccessCount": 1,
      "totalCancelledCount": 0,
      "totalCancelledAmount": 0
    },
    "payouts": {
      "amount": {
        "currency": "IDR",
        "value": "100000"
      },
      "channelCode": "BRI",
      "channelInformation": {
        "accountName": "Reforza Pivot",
        "accountNumber": "888801000157508"
      },
      "created": "2024-05-13T08:21:45Z",
      "inquiryId": "d6a46a2c-1b26-40c5-9ca3-e063e69635a0",
      "description": "test Reforza Pivot",
      "referenceId": "999",
      "status": "SUCCESS",
      "reason": "",
      "updated": "2024-05-13T08:21:46Z"
    },
    "uuid": "d6a46a2c-1b26-40c5-9ca3-e063e69635a0"
  }
}
```

***

### Idempotency

To prevent duplicate transaction processing, all payout requests must include the `X-REQUEST-ID` header. Pivot uses this value to ensure that the same request is not processed multiple times.

If the same `X-REQUEST-ID` is received more than once within the validity period, Pivot will treat the request as the **same transaction** and return the original response instead of creating a new payout.

#### X-REQUEST-ID Requirements

The `X-REQUEST-ID` value must meet the following requirements:

* Must contain **only alphanumeric characters**
* **Minimum length:** 16 characters
* **Maximum length:** 36 characters
* The ID remains **valid for 24 hours**

After **24 hours**, the same `X-REQUEST-ID` may be reused for a new transaction request.

Example Header:

```
X-REQUEST-ID: a1b2c3d4e5f6g7h8
```

#### Tips

Further measure to prevent duplicate payouts:

* Do not retry payouts blindly if the transaction has not reached final status
* Always check payout status before retrying

***

### Error Handling

Common payout failure scenarios include:

| Error                             | Cause                                                   |
| --------------------------------- | ------------------------------------------------------- |
| Invalid account                   | Beneficiary account is invalid or doesn't exist         |
| Declined due to beneficiary limit | Beneficiary account has already reached the daily limit |
| Failed to process by Bank Network | Bank network failed to process the transaction          |

Refer to the [**Response Codes and Failure Reasons**](https://pivot-payment.gitbook.io/pivot-docs/api-references/api-lists/payout-local/response-codes-and-failure-reason) section for full error mappings.

***

### Common Integration Questions

#### What happens if the webhook fails?

If your webhook endpoint fails to respond with HTTP 200, Pivot will retry sending the callback.\
You should ensure your endpoint is highly available.

***

#### Can I retry a payout?

Do not retry immediately.\
Always retrieve the payout status first to avoid duplicate transfers.

***

#### Should I rely on webhook or API status?

Webhook is the **primary mechanism** for status updates.\
Retrieve payout status only for reconciliation or webhook failures.

***

#### Do I need to perform Inquiry Account before every payout?

Yes. This ensures the beneficiary account is valid and prevents payout failures.

***

#### How do I avoid duplicate payouts?

Use a unique `reference_id` for each payout and implement idempotency logic in your system.

***

### API References

For full endpoint specifications, refer to:

* Payout Balance
* Inquiry Account
* Create Payout
* Retrieve Payout
* Callback
* Response Codes and Failure Reasons
* Test Scenarios
* Channel Codes


# Payout Balance

## Method and URL

<mark style="color:green;">`GET`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v1/payouts/balance?currency=IDR

## Response

**Response Body**

```json
{
  "code": "00",
  "message": "Success",
  "data": {
    "availableBalance": {
      "currency": "IDR",
      "value": "4440916697.16"
    }
  }
}
```

**Detail Parameter Response**

<table><thead><tr><th>Parameter</th><th width="110">Data Type</th><th width="133">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>code</td><td>String</td><td>M</td><td>Response code</td></tr><tr><td>message</td><td>String</td><td>M</td><td>Response description</td></tr><tr><td>data</td><td>Object</td><td>M</td><td><br></td></tr><tr><td><ul><li>availableBalance</li></ul></td><td>Object</td><td>M</td><td></td></tr><tr><td><blockquote><ul><li>currency</li></ul></blockquote></td><td>String</td><td>M</td><td>IDR</td></tr><tr><td><blockquote><ul><li>value</li></ul></blockquote></td><td>String</td><td>M</td><td><p>Amount with 2 decimals</p><p>E.g: 10000.00<br></p></td></tr></tbody></table>


# Inquiry Account

## Method and URL

<mark style="color:green;">`POST`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v1/inquiry-account

## Request

**Request Body**

```json
{
  "channelCode": "BCA",
  "channelInformation": {
    "accountNumber": "999966660001",
    "accountName": "Reforza Pivot"
  }
}
```

**Detail Parameter Request**

<table><thead><tr><th>Parameter</th><th width="109">Data Type</th><th width="114.65625">Character limit</th><th width="129">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>channelCode</td><td>String</td><td>1-30</td><td>M</td><td><p>Channel code for payout destination such as Bank, E wallet or other channels</p><p><br></p><p>List of Channel code can be accessed here</p><p><br><a href="channel-codes">Channel Code</a></p></td></tr><tr><td>channelInformation</td><td>Object</td><td>-</td><td>M</td><td><br></td></tr><tr><td><ul><li>accountNumber</li></ul></td><td>String</td><td>1-60</td><td>M</td><td>Account Number of payout destination</td></tr><tr><td><ul><li>accountName</li></ul></td><td>String</td><td>1-60</td><td>M</td><td>Account Name of payout destination from Merchant</td></tr></tbody></table>

## Response

**Response Body**

```json
{
  "code": "00",
  "message": "OK",
  "data": {
    "uuid": "f4f3b3d0-fbff-414a-9ec1-f2c279b4e0c6",
    "merchantId": "e485e01b-ff59-4a47-bb7d-9b39064f3388",
    "inquiryResult": {
      "status": "WARNING",
      "detail": "The account name entered does not match the bank's records. Please check the account information and try again. Bank record: Dummy Simulation"
    }
  }
}
```

**Detail Parameter Response**

<table><thead><tr><th>Parameter</th><th width="111">Data Type</th><th width="129">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>code</td><td>String</td><td>M</td><td>Response code</td></tr><tr><td>message</td><td>String</td><td>M</td><td>Response description</td></tr><tr><td>data</td><td>Object</td><td>M</td><td><br></td></tr><tr><td><ul><li>uuid</li></ul></td><td>String</td><td>M</td><td>Unique Inquiry Account ID</td></tr><tr><td><ul><li>merchantId</li></ul></td><td>String</td><td>M</td><td>Unique merchant ID</td></tr><tr><td><ul><li>inquiryResult</li></ul></td><td>Object</td><td>O</td><td></td></tr><tr><td><blockquote><ul><li>Status</li></ul></blockquote></td><td>String</td><td>M</td><td><p>Inquiry status to indicate the result</p><p><br></p><p>Potential value</p><ul><li>VALID = requested account matched </li><li>WARNING = requested account is available, but the account might be mismatched. Please check detail for more information</li><li>INVALID = requested account is invalid or can’t be found</li><li>PENDING = inquiry account is still in progress</li></ul></td></tr><tr><td><blockquote><ul><li>detail</li></ul></blockquote></td><td>String</td><td>C</td><td><p>Only available if the status is WARNING, INVALID, and PENDING explains the reason below:</p><p><br></p><p>Warning:</p><ul><li>Account Name is not similar = "The account name entered does not match the bank's records. Please check the account information and try again. Bank record:{accountName from bank}"</li><li>Account Name is similar = “The account name entered is not an exact match. Please check the account information and try again. Bank record: {accountName from bank}”</li></ul><p></p><p>Invalid: </p><p>Account number not found.</p><p></p><p>Pending: </p><p>Inquiry in progress</p></td></tr></tbody></table>

## Tips! Storing Inquiry ID for future usage

{% hint style="info" %}
After you have successfully received a response from the Inquiry Account, you can store the <mark style="color:orange;">`inquiryId`</mark>.&#x20;

So whenever you want to create a Payout to the same Beneficiary Account, you don't need to hit the Inquiry Account API again, just pass <mark style="color:orange;">`inquiryId`</mark> on the payload [here](https://pivot-payment.gitbook.io/pivot-docs/api-references/api-lists/create-a-payout#request)
{% endhint %}


# Retrieve Inquiry Account

## Method and URL

<mark style="color:green;">`GET`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v1/inquiry-account/{uuid}

<mark style="color:orange;">`uuid`</mark> from the response body of the Inquiry Account

## Response

**Response Body**

```json
{
  "code": "00",
  "message": "OK",
  "data": {
    "uuid": "f4f3b3d0-fbff-414a-9ec1-f2c279b4e0c6",
    "merchantId": "e485e01b-ff59-4a47-bb7d-9b39064f3388",
    "inquiryResult": {
      "status": "WARNING",
      "detail": "The account name entered does not match the bank's records. Please check the account information and try again. Bank record: Dummy Simulation"
    }
  }
}
```

**Detail Parameter Response**

<table><thead><tr><th>Parameter</th><th width="111">Data Type</th><th width="129">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>code</td><td>String</td><td>M</td><td>Response code</td></tr><tr><td>message</td><td>String</td><td>M</td><td>Response description</td></tr><tr><td>data</td><td>Object</td><td>M</td><td><br></td></tr><tr><td><ul><li>uuid</li></ul></td><td>String</td><td>M</td><td>Unique Inquiry Account ID</td></tr><tr><td><ul><li>merchantId</li></ul></td><td>String</td><td>M</td><td>Unique merchant ID</td></tr><tr><td><ul><li>inquiryResult</li></ul></td><td>Object</td><td>O</td><td></td></tr><tr><td><blockquote><ul><li>Status</li></ul></blockquote></td><td>String</td><td>M</td><td><p>Inquiry status to indicate the result</p><p><br></p><p>Potential value</p><ul><li>VALID = requested account matched </li><li>WARNING = requested account is available, but the account might be mismatched. Please check detail for more information</li><li>INVALID = requested account is invalid or can’t be found</li><li>PENDING = inquiry account is still in progress</li></ul></td></tr><tr><td><blockquote><ul><li>detail</li></ul></blockquote></td><td>String</td><td>C</td><td><p>Only available if the status is WARNING, INVALID, and PENDING explains the reason below:</p><p><br></p><p>Warning:</p><ul><li>Account Name is not similar = "The account name entered does not match the bank's records. Please check the account information and try again. Bank record:{accountName from bank}"</li><li>Account Name is similar = “The account name entered is not an exact match. Please check the account information and try again. Bank record: {accountName from bank}”</li></ul><p></p><p></p><p>Invalid: </p><p>Account number not found.<br><br>Pending: </p><p>Inquiry in progress</p></td></tr></tbody></table>


# Create a Payout

## Method and URL

<mark style="color:green;">`POST`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v1/payouts

## Request

### **Request Body using Inquiry ID**

```json
{
  "payouts": [
    {
      "referenceId": "1999",
      "inquiryId": "d6a46a2c-1b26-40c5-9ca3-e063e69635a0",
      "amount": {
        "value": "100000",
        "currency": "IDR"
      },
      "description": "test Reforza Pivot"
    }
  ]
}
```

**Detail Parameter Request**

<table><thead><tr><th>Parameter</th><th width="109">Data Type</th><th width="105.828125">Character limit</th><th width="128">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>payouts</td><td>Array of Object</td><td>1-1000</td><td>M</td><td><br></td></tr><tr><td><ul><li>referenceId</li></ul></td><td>String</td><td>1-100</td><td>M</td><td>Merchant provide unique identifier for payout request</td></tr><tr><td><ul><li>inquiryId</li></ul></td><td>Uuid</td><td>-</td><td>M</td><td>Merchant provide Inquiry ID returned by Pivot from inquiry bank account</td></tr><tr><td><ul><li>amount</li></ul></td><td>Object</td><td>-</td><td>M</td><td></td></tr><tr><td><blockquote><ul><li>value</li></ul></blockquote></td><td>String</td><td>-</td><td>M</td><td><p>Amount </p><p>E.g: 10000</p></td></tr><tr><td><blockquote><ul><li>currency</li></ul></blockquote></td><td>String</td><td>1-10</td><td>M</td><td><p>ISO 4217 </p><p></p><p>Example:</p><ul><li>Rupiah = IDR</li></ul></td></tr><tr><td><ul><li>description</li></ul></td><td>String</td><td>1-20</td><td>O </td><td><p>Information that will be seen by beneficiary account in statement</p><p><br>Note:</p><ul><li>Maximum length each channel code is 20 characters</li><li>Support alphanumeric characters only</li></ul></td></tr></tbody></table>

### **Request Body using Channel Code & Channel Information**

```json
{
  "payouts": [
    {
      "referenceId": "999",
      "channelCode": "BRI",
      "channelInformation": {
        "accountNumber": "888801000157508",
        "accountName": "Reforza Pivot"
      },
      "amount": {
        "value": "100000",
        "currency": "IDR"
      },
      "description": "test Reforza Pivot"
    }
  ]
}
```

**Detail Parameter Request**

<table><thead><tr><th>Parameter</th><th width="121.85546875">Data Type</th><th width="109.484375">Character limit</th><th width="128">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>payouts</td><td>Array of Object</td><td>1-1000</td><td>M</td><td><br></td></tr><tr><td><ul><li>referenceId</li></ul></td><td>String</td><td>1-100</td><td>M</td><td>Merchant provide unique identifier for payout request</td></tr><tr><td><ul><li>channelCode</li></ul></td><td>String</td><td>1-30</td><td>M</td><td><p>Channel code for payout destination such as Bank, E wallet or other channels</p><p><br>List of Channel code can be accessed <a href="channel-codes">here</a></p></td></tr><tr><td><ul><li>channelInformation</li></ul></td><td>Object</td><td>-</td><td>M</td><td></td></tr><tr><td><blockquote><ul><li>accountNumber</li></ul></blockquote></td><td>String</td><td>1-60</td><td>M</td><td>Account Number of payout destination</td></tr><tr><td><blockquote><ul><li>accountName</li></ul></blockquote></td><td>String</td><td>1-60</td><td>M</td><td>Account Name of payout destination</td></tr><tr><td><ul><li>amount</li></ul></td><td>Object</td><td>-</td><td>M</td><td></td></tr><tr><td><blockquote><ul><li>value</li></ul></blockquote></td><td>String</td><td>-</td><td>M</td><td><p>Amount </p><p>E.g: 10000</p></td></tr><tr><td><blockquote><ul><li>currency</li></ul></blockquote></td><td>String</td><td>1-10</td><td>M</td><td><p>ISO 4217 </p><p></p><p>Example:</p><ul><li>Rupiah = IDR</li></ul></td></tr><tr><td><ul><li>description</li></ul></td><td>String</td><td>1-20</td><td>O </td><td><p>Information that will be seen by beneficiary account in statement</p><p></p><p>Note:</p><ul><li>Maximum length each channel code is 20 characters</li><li>Support alphanumeric characters only</li></ul></td></tr></tbody></table>

## Response

**Response Body**

```json
{
  "code": "00",
  "message": "Success",
  "data": {
    "created": "2024-05-13T08:21:44.967496435Z",
    "merchantId": "922e39ab-7565-49f6-b84f-fb56122821ae",
    "payouts": [
      {
        "amount": {
          "currency": "IDR",
          "value": "100000"
        },
        "inquiryId": "",
        "channelCode": "BRI",
        "channelInformation": {
          "accountName": "Reforza Pivot",
          "accountNumber": "888801000157508"
        },
        "description": "test Reforza Pivot",
        "referenceId": "999"
      }
    ],
    "status": "IN_PROGRESS",
    "updated": "2024-05-13T08:21:44.967496538Z",
    "uuid": "d6a46a2c-1b26-40c5-9ca3-e063e69635a0"
  }
}
```

**Detail Parameter Response**

<table><thead><tr><th>Parameter</th><th width="113">Data Type</th><th width="132">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>code</td><td>String</td><td>M</td><td>Response code</td></tr><tr><td>message</td><td>String</td><td>M</td><td>Response description</td></tr><tr><td>data</td><td>Object</td><td>M</td><td>Payout Object. Refers to <a data-mention href="payout-object">payout-object</a></td></tr></tbody></table>


# Retrieve a single payout request

## Get A Single Payout by ID

Retrieve details of a Payout Transaction by specifying the payout ID and reference ID.

### Method and URL

<mark style="color:green;">`GET`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v1/payouts/:{uuid}?referenceId=:{referenceId}

<mark style="color:orange;">`uuid`</mark> from the response body whenever you create a Payout

<mark style="color:orange;">`referenceId`</mark> from the request body whenever you create a Payout

### Response

**Response Body**

```json
{
  "code": "00",
  "message": "Success",
  "data": {
    "merchantId": "922e39ab-7565-49f6-b84f-fb56122821ae",
    "payoutResults": {
      "totalFailedAmount": 0,
      "totalFailedCount": 0,
      "totalPendingAmount": 0,
      "totalPendingCount": 0,
      "totalSuccessAmount": 100000,
      "totalSuccessCount": 1,
      "totalCancelledCount": 0,
      "totalCancelledAmount": 0
    },
    "payouts": {
      "amount": {
        "currency": "IDR",
        "value": "100000"
      },
      "channelCode": "BRI",
      "channelInformation": {
        "accountName": "Reforza Pivot",
        "accountNumber": "888801000157508"
      },
      "created": "2024-05-13T08:21:45Z",
      "inquiryId": "d6a46a2c-1b26-40c5-9ca3-e063e69635a0",
      "description": "test Reforza Pivot",
      "referenceId": "999",
      "status": "SUCCESS",
      "reason": "",
      "updated": "2024-05-13T08:21:46Z"
    },
    "uuid": "d6a46a2c-1b26-40c5-9ca3-e063e69635a0"
  }
}
```

**Detail Parameter Response**

<table><thead><tr><th>Parameter</th><th width="110">Data Type</th><th width="128">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>code</td><td>String</td><td>M</td><td>Response code</td></tr><tr><td>message</td><td>String</td><td>M</td><td>Response description</td></tr><tr><td>data</td><td>Object</td><td>M</td><td>Payout Object. Refers to <a data-mention href="payout-object">payout-object</a></td></tr></tbody></table>

## Get A Single Payout by Reference ID

Retrieve details of a Payout Transaction by specifying the payout reference ID.

### Method and URL

<mark style="color:green;">`GET`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v1/payouts/:{referenceId}?type=single

<mark style="color:orange;">`referenceId`</mark> from the request body whenever you create a Payout

### Response

**Response Body**

```json
{
  "code": "00",
  "message": "Success",
  "data": [
    {
      "referenceId": "TestJojo24032025-001",
      "inquiryId": "",
      "channelCode": "BRI",
      "channelInformation": {
        "accountNumber": "999966660001",
        "accountName": "Dummy Simulation"
      },
      "amount": {
        "currency": "IDR",
        "value": "25000"
      },
      "description": "Test Jojo",
      "status": "SUCCESS",
      "reason": "",
      "created": "2025-03-24T06:25:43Z",
      "updated": "2025-03-24T06:25:44Z"
    }
  ]
}
```

**Detail Parameter Response**

<table><thead><tr><th>Parameter</th><th width="110">Data Type</th><th width="128">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>code</td><td>String</td><td>M</td><td>Response code</td></tr><tr><td>message</td><td>String</td><td>M</td><td>Response description</td></tr><tr><td>data</td><td>Object</td><td>M</td><td>Payout Object. Refers to <a data-mention href="payout-object">payout-object</a></td></tr></tbody></table>


# Retrieve a Payout

Retrieve details of a Payout Request by specifying the payout ID.

## Method and URL

<mark style="color:green;">`GET`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/v1/payouts/{uuid}

<mark style="color:orange;">`uuid`</mark> from the response body whenever you create a Payout

## Response

**Response Body**

```json
{
  "code": "00",
  "message": "Success",
  "data": {
    "created": "2024-05-13T08:21:45Z",
    "merchantId": "922e39ab-7565-49f6-b84f-fb56122821ae",
    "payoutResults": {
      "totalFailedAmount": 0,
      "totalFailedCount": 0,
      "totalPendingAmount": 0,
      "totalPendingCount": 0,
      "totalSuccessAmount": 100000,
      "totalSuccessCount": 1,
      "totalCancelledCount": 0,
      "totalCancelledAmount": 0
    },
    "payouts": [
      {
        "amount": {
          "currency": "IDR",
          "value": "100000"
        },
        "channelCode": "BRI",
        "channelInformation": {
          "accountName": "Reforza Pivot",
          "accountNumber": "888801000157508"
        },
        "created": "2024-05-13T08:21:45Z",
        "inquiryId": "d6a46a2c-1b26-40c5-9ca3-e063e69635a0",
        "description": "test Reforza Pivot",
        "referenceId": "999",
        "status": "SUCCESS",
        "reason": "",
        "updated": "2024-05-13T08:21:46Z"
      }
    ],
    "status": "DONE",
    "updated": "2024-05-13T08:21:46Z",
    "uuid": "d6a46a2c-1b26-40c5-9ca3-e063e69635a0"
  },
  "pagination": {
    "page": 1,
    "perPage": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

**Detail Parameter Response**

<table><thead><tr><th>Parameter</th><th width="110">Data Type</th><th width="128">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>code</td><td>String</td><td>M</td><td>Response code</td></tr><tr><td>message</td><td>String</td><td>M</td><td>Response description</td></tr><tr><td>data</td><td>Object</td><td>M</td><td>Payout Object. Refers to <a data-mention href="payout-object">payout-object</a></td></tr><tr><td>pagination</td><td>Object</td><td>M</td><td><a data-mention href="../../api-information/pagination">pagination</a></td></tr></tbody></table>


# Payout Callback

## Method and URL

<mark style="color:green;">`POST`</mark> {[www.yourcompany.com}/payout\_webhook\_url](http://www.yourcompany.com}/payout_webhook_url)

## Request

**Header Request**&#x20;

<table><thead><tr><th>Parameter</th><th width="120">Data Type</th><th width="141">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>X-API-Key</td><td>String</td><td>M</td><td>Callback API Key, an additional API Key used specifically for receiving callbacks</td></tr><tr><td>Content-Type</td><td>String</td><td>M</td><td>application/JSON</td></tr><tr><td>Accept</td><td>String</td><td>M</td><td>application/JSON</td></tr></tbody></table>

### **Request Body for Bulk Payout**

{% hint style="info" %}
For more details about each transaction, please retrieve a payout.
{% endhint %}

```json
{
  "event": "PAYOUT.DONE",
  "data": {
    "uuid": "d6a46a2c-1b26-40c5-9ca3-e063e69635a0",
    "merchantId": "922e39ab-7565-49f6-b84f-fb56122821ae",
    "payoutResults": {
      "totalPendingCount": 0,
      "totalPendingAmount": 0,
      "totalSuccessCount": 1,
      "totalSuccessAmount": 100000,
      "totalFailedCount": 0,
      "totalFailedAmount": 0,
      "totalCancelledCount": 0,
      "totalCancelledAmount": 0
    },
    "status": "DONE"
  }
}
```

### **Request Body for Single Payout**

```json
{
  "event": "PAYOUT.SUCCESS",
  "data": {
    "uuid": "d6a46a2c-1b26-40c5-9ca3-e063e69635a0",
    "merchantId": "922e39ab-7565-49f6-b84f-fb56122821ae",
    "payouts": {
      "referenceId": "TestReforzaPivot001",
      "amount": {
        "currency": "IDR",
        "value": "100000"
      },
      "status": "SUCCESS",
      "reason": null
    }
  }
}
```

**Detail Parameter Request**

<table><thead><tr><th>Parameter</th><th width="123">Data Type</th><th width="133">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>event</td><td>String</td><td>M</td><td><p>Bulk Payout Event Names:<br></p><ol><li>PAYOUT.DONE</li><li>PAYOUT.PENDING</li><li>PAYOUT.DELAYED</li><li>PAYOUT.CANCELLED</li></ol><p><br></p><p>Single Payout Event Names:<br></p><ol><li>PAYOUT.SUCCESS</li><li>PAYOUT.FAILED</li><li>PAYOUT.DELAYED</li></ol></td></tr><tr><td>data</td><td>Object</td><td>M</td><td>Payout Object. Refers to <a data-mention href="payout-object">payout-object</a></td></tr></tbody></table>



# Payout Object

```json
{
  "created": "2024-05-13T08:21:45Z",
  "merchantId": "922e39ab-7565-49f6-b84f-fb56122821ae",
  "payoutResults": {
    "totalFailedAmount": 0,
    "totalFailedCount": 0,
    "totalPendingAmount": 0,
    "totalPendingCount": 0,
    "totalSuccessAmount": 200000,
    "totalSuccessCount": 2,
    "totalCancelledCount": 0,
    "totalCancelledAmount": 0
  },
  "payouts": [
    {
      "amount": {
        "currency": "IDR",
        "value": "100000"
      },
      "channelCode": "BRI",
      "channelInformation": {
        "accountName": "Reforza Pivot",
        "accountNumber": "888801000157508"
      },
      "created": "2024-05-13T08:21:45Z",
      "inquiryId": "d6a46a2c-1b26-40c5-9ca3-e063e69635a0",
      "description": "test Reforza Pivot",
      "referenceId": "999",
      "status": "SUCCESS",
      "reason": "",
      "updated": "2024-05-13T08:21:46Z"
    },
    {
      "amount": {
        "currency": "IDR",
        "value": "100000"
      },
      "created": "2024-05-13T08:21:45Z",
      "inquiryId": "d6a46a2c-1b26-40c5-9ca3-e063e69635a0",
      "description": "test Reforza Pivot",
      "channelCode": "BRI",
      "channelInformation": {
        "accountName": "Reforza Pivot",
        "accountNumber": "888801000157508"
      },
      "referenceId": "1999",
      "status": "SUCCESS",
      "reason": "", 
      "updated": "2024-05-13T08:21:46Z"
    }
  ],
  "status": "DONE",
  "updated": "2024-05-13T08:21:46Z",
  "uuid": "d6a46a2c-1b26-40c5-9ca3-e063e69635a0"
}
```

**Detail Payout Object**&#x20;

<table><thead><tr><th>Parameter</th><th width="110">Data Type</th><th width="131">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>created</td><td>String</td><td>M</td><td>Timestamp when Payout request is made (using ISO 8601, Timezone UTC+0)</td></tr><tr><td>merchantId</td><td>String</td><td>M</td><td>Unique merchant ID given by Pivot</td></tr><tr><td>payoutsResults</td><td>Object</td><td>M</td><td><br></td></tr><tr><td><ul><li>totalFailedAmount</li></ul></td><td>Integer</td><td>M</td><td>Total Amount of all disbursement that has status Failed</td></tr><tr><td><ul><li>totalFailedCount</li></ul></td><td>Integer</td><td>M</td><td>The count of all disbursement that has status Failed</td></tr><tr><td><ul><li>totalPendingAmount</li></ul></td><td>Integer</td><td>M</td><td>Total Amount of all disbursement that has status Pending</td></tr><tr><td><ul><li>totalPendingCount</li></ul></td><td>Integer</td><td>M</td><td>The count of all disbursement that has status Pending</td></tr><tr><td><ul><li>totalSuccessAmount</li></ul></td><td>Integer</td><td>M</td><td>Total Amount of all disbursement that has status Success</td></tr><tr><td><ul><li>totalSuccessCount</li></ul></td><td>Integer</td><td>M</td><td>The count of all disbursement that has status Success</td></tr><tr><td>payouts</td><td>Array of Object</td><td>M</td><td></td></tr><tr><td><ul><li>amount</li></ul></td><td>Object</td><td>M</td><td></td></tr><tr><td><blockquote><ul><li>value</li></ul></blockquote></td><td>String</td><td>M</td><td><p>Amount </p><p>E.g: 10000</p></td></tr><tr><td><blockquote><ul><li>currency</li></ul></blockquote></td><td>String</td><td>M</td><td><p>ISO 4217 </p><p><br>Example:</p><ul><li>Rupiah = IDR</li></ul></td></tr><tr><td><ul><li>channelCode</li></ul></td><td>String</td><td>M</td><td><p>Channel code for payout destination such as Bank, E wallet or other channels</p><p><br>List of Channel code can be accessed <a data-mention href="channel-codes">channel-codes</a></p></td></tr><tr><td><ul><li>channelInformation</li></ul></td><td>Object</td><td>M</td><td></td></tr><tr><td><blockquote><ul><li>accountName</li></ul></blockquote></td><td>String</td><td>M</td><td>Account Name of payout destination</td></tr><tr><td><blockquote><ul><li>accountNumber</li></ul></blockquote></td><td>String</td><td>M</td><td>Account Number of payout destination</td></tr><tr><td><ul><li>created</li></ul></td><td>String</td><td>M</td><td>Timestamp when Payout transaction is made (using ISO 8601, Timezone UTC+0)</td></tr><tr><td><ul><li>inquiryId</li></ul></td><td>String</td><td></td><td>Inquiry ID returned by Pivot from inquiry bank account</td></tr><tr><td><ul><li>description</li></ul></td><td>String</td><td>O</td><td><p>Information that will be seen by beneficiary account in statement</p><p></p><p>Note:</p><ul><li>Maximum length each channel code is 20 characters</li><li>Support alphanumeric characters only</li></ul></td></tr><tr><td><ul><li>referenceId</li></ul></td><td>String</td><td>M</td><td>Merchant provide unique identifier for payout request</td></tr><tr><td><ul><li>status</li></ul></td><td>String</td><td></td><td><p></p><p>Status of Payout transaction :</p><ol><li>APPROVED / REJECTED (current state always APPROVED in Open API)</li><li>PENDING</li><li>SUCCESS</li><li>FAILED</li></ol></td></tr><tr><td><ul><li>reason</li></ul></td><td>String</td><td></td><td><p>Detail reason for FAILED Payout transaction status</p><p><a data-mention href="../response-codes-and-failure-reason#failure-reason">#failure-reason</a> </p></td></tr><tr><td><ul><li>updated</li></ul></td><td>String</td><td></td><td>Timestamp when Payout transaction status is updated (using ISO 8601, Timezone UTC+0)</td></tr><tr><td>status</td><td>String</td><td></td><td><p></p><p>Status of Payout request:</p><ol><li>IN PROGRESS</li><li>DONE </li><li>PENDING</li></ol></td></tr><tr><td>updated</td><td>String</td><td></td><td>Timestamp when Payout request status is updated (using ISO 8601, Timezone UTC+0)</td></tr><tr><td>uuid</td><td>String</td><td></td><td>Unique Bulk payout ID</td></tr></tbody></table>


# Response Codes & Failure Reason

## Response Codes

<table><thead><tr><th width="166">Response Code</th><th width="176">Response Message</th><th>Error Object</th></tr></thead><tbody><tr><td>00</td><td>Success</td><td>-</td></tr><tr><td>credentials_invalid</td><td>Access Token is Invalid</td><td><p></p><pre class="language-json"><code class="lang-json">{
  "error": {
    "type": "API_ERROR",
    "details": [
      {
        "field": "",
        "message": "Request new access token"
      }
    ],
    "traceId": "{trace id}" 
  }
}

</code></pre></td></tr><tr><td>field\_format\_invalid</td><td>Format Field is Invalid</td><td><p></p><pre class="language-json"><code class="lang-json">{
"error": {
"type": "API\_ERROR",
"details": \[
{
"field": "{field name}",
"message": "Make sure {field name} format is correct"
}
],
"traceId": "{trace id}"
}
}

</code></pre></td></tr><tr><td>field\_required</td><td>Mandatory Field is Missing</td><td><p></p><pre class="language-json"><code class="lang-json">{
"error": {
"type": "API\_ERROR",
"details": \[
{
"field": "{field name}",
"message": "Make sure {field name} value is fulfilled"
}
],
"traceId": "{trace id}"
}
}

</code></pre></td></tr><tr><td>amount\_below\_limit</td><td>Amount Value below the minimum</td><td><p></p><pre class="language-json"><code class="lang-json">{
"error": {
"type": "API\_ERROR",
"details": \[
{
"field": "{field name}",
"message": "Make sure {field name} amount is above minimum"
}
],
"traceId": "{trace id}"
}
}

</code></pre></td></tr><tr><td>resource\_already\_exists</td><td>X-REQUEST-ID is already exists</td><td><p></p><pre class="language-json"><code class="lang-json">{
"error": {
"type": "API\_ERROR",
"details": \[
{
"field": "",
"message": "Use unique X-EXTERNAL-ID"
}
],
"traceId": "{trace id}"
}
}

</code></pre></td></tr><tr><td>resource\_already\_exists</td><td>ID is already exists</td><td><p></p><pre class="language-json"><code class="lang-json">{
"error": {
"type": "API\_ERROR",
"details": \[
{
"field": "{field name}",
"message": "Use unique {field name}"
}
],
"traceId": "{trace id}"
}
}

</code></pre></td></tr><tr><td>service\_unavailable</td><td>Gateway / Partner service is unavailable</td><td><p></p><pre class="language-json"><code class="lang-json">{
"error": {
"type": "GATEWAY\_ERROR",
"details": \[
{
"field": "",
"message": "Please hit periodically"
}
],
"traceId": "{trace id}"
}
} </code></pre></td></tr><tr><td>balance\_insufficient</td><td>Merchant Balance is Insufficient</td><td><pre class="language-json"><code class="lang-json">{
"error": {
"type": "API\_ERROR",
"details": \[
{
"field": "",
"message": "Re Top-up your Balance"
}
],
"traceId": "{trace id}"
}
} </code></pre></td></tr><tr><td>unsupported\_channel\_code</td><td>Channel Code is currently not supported</td><td><p></p><pre class="language-json"><code class="lang-json">{
"error": {
"type": "API\_ERROR",
"details": \[
{
"field": "{field name}",
"message": "Make sure channel code following on the API Document"
}
],
"traceId": "{trace id}"
}
}

</code></pre></td></tr><tr><td>resource\_missing</td><td>Payout ID is not exist</td><td><p></p><pre class="language-json"><code class="lang-json">{
"error": {
"type": "API\_ERROR",
"details": \[
{
"field": "",
"message": "Make sure payout id is correct"
}
],
"traceId": "{trace id}"
}
} </code></pre></td></tr><tr><td>format\_invalid</td><td>Payout format is invalid</td><td><p></p><pre class="language-json"><code class="lang-json">{
"error": {
"type": "API\_ERROR",
"details": \[
{
"field": "",
"message": "Make sure payout object no more than 1000 items"
}
],
"traceId": "{trace id}"
}
}

</code></pre></td></tr><tr><td>resource\_missing</td><td>Inquiry ID is not exist</td><td><p></p><pre class="language-json"><code class="lang-json">{
"error": {
"type": "API\_ERROR",
"details": \[
{
"field": "{field name}",
"message": "Make sure inquiry id is correct"
}
],
"traceId": "{trace id}"
}
}

</code></pre></td></tr><tr><td>general\_error</td><td>General Error</td><td><p></p><pre class="language-json"><code class="lang-json"><strong>{ </strong>  "error": {
"type": "API\_ERROR",
"details": \[
{
"field": "",
"message": "Please contact our representative team"
}
],
"traceId": "{trace id}"
}
}

</code></pre></td></tr><tr><td>amount\_above\_limit</td><td>Amount value above the maximum</td><td><pre class="language-json"><code class="lang-json">{
"error": {
"type": "API\_ERROR",
"details": \[
{
"field": "{field name}",
"message": "Make sure {field name} amount is below maximum"
}
],
"traceId": "{trace id}"
}
} </code></pre></td></tr><tr><td>daily\_payout\_limit\_exceeded</td><td>Exceed daily Payout limit</td><td><pre class="language-json"><code class="lang-json">{
"error": {
"type": "API\_ERROR",
"details": \[
{
"field": "",
"message": "Remaining amount today: Rp \[current Payout balance]. Please try again tomorrow or contact Helpdesk"
}
],
"trace\_id": "{trace id}"
}
} </code></pre></td></tr><tr><td>payouts\_in\_process</td><td>Payouts are being process</td><td><pre class="language-json"><code class="lang-json">{
"error": {
"type": "API\_ERROR",
"details": \[
{
"field": "",
"message": "Wait a moment to retrieve the Payout"
}
],
"trace\_id": "{trace id}"
}
} </code></pre></td></tr><tr><td>format\_invalid</td><td>Payouts format is invalid</td><td><pre class="language-json"><code class="lang-json">{
"error": {
"type": "API\_ERROR",
"details": \[
{
"field": "",
"message": "Make sure Payout request format is correct"
}
],
"trace\_id": "{trace id}"
}
} </code></pre></td></tr></tbody></table>

## Failure Reason

Failure reason will appear whenever Payout Transaction Status is "FAILED"

| Failure Reason                    | Description                                                  |
| --------------------------------- | ------------------------------------------------------------ |
| Invalid account                   | Beneficiary account is invalid or doesn't exist              |
| Inactive account                  | Beneficiary account is inactive                              |
| Dormant account                   | Beneficiary account is closed or deactivated                 |
| Failed to process by Bank Network | Bank is failed to process the transaction                    |
| Feature not allowed at this time  | Merchant is not eligible to access the feature at the moment |
| Unknown Bank Network error        | Undefined Bank error response                                |
| Declined due to beneficiary limit | Beneficiary account has already reached the daily limit      |


# Test Scenarios

<table><thead><tr><th width="126">Scenario</th><th width="174">Data</th><th>Expected Results</th></tr></thead><tbody><tr><td>Success</td><td>999966660001</td><td><p></p><pre class="language-json"><code class="lang-json">{
    "code": "00",
    "message": "Success",
    "data": {
        "created": "2024-07-30T04:35:03Z",
        "merchantId": "922e39ab-7565-49f6-b84f-fb56122821ae",
        "payoutResults": {
            "totalFailedAmount": 0,
            "totalFailedCount": 0,
            "totalPendingAmount": 0,
            "totalPendingCount": 0,
            "totalSuccessAmount": 20000,
            "totalSuccessCount": 1
        },
        "payouts": [
            {
                "amount": {
                    "currency": "IDR",
                    "value": "10000"
                },
                "channelCode": "BRI",
                "channelInformation": {
                    "accountName": "Reforza Pivot",
                    "accountNumber": "999966660001"
                },
                "created": "2024-07-30T04:35:03Z",
                "description": "Testing Success",
                "inquiryId": "",
                "reason": "",
                "referenceId": "2024052400083464",
                "status": "SUCCESS",
                "updated": "2024-07-30T04:35:04Z"
            }
        ],
        "status": "DONE",
        "updated": "2024-07-30T04:35:04Z",
        "uuid": "98d3deee-f6fa-48b8-906a-0b99279d4687"
    },
    "pagination": {
        "page": 1,
        "perPage": 1,
        "totalItems": 1,
        "totalPages": 1
    }
}
</code></pre></td></tr><tr><td>Inactive Account</td><td>999966660002</td><td><p></p><pre class="language-json"><code class="lang-json">{
    "code": "00",
    "message": "Success",
    "data": {
        "created": "2024-07-30T04:10:54Z",
        "merchantId": "922e39ab-7565-49f6-b84f-fb56122821ae",
        "payoutResults": {
            "totalFailedAmount": 20000,
            "totalFailedCount": 1,
            "totalPendingAmount": 0,
            "totalPendingCount": 0,
            "totalSuccessAmount": 0,
            "totalSuccessCount": 0
        },
        "payouts": [
            {
                "amount": {
                    "currency": "IDR",
                    "value": "10000"
                },
                "channelCode": "BRI",
                "channelInformation": {
                    "accountName": "Reforza Pivot",
                    "accountNumber": "999966660002"
                },
                "created": "2024-07-30T04:10:54Z",
                "description": "Testing Inactive Account",
                "inquiryId": "",
                "reason": "Inactive account",
                "referenceId": "2024052400083458",
                "status": "FAILED",
                "updated": "2024-07-30T04:10:54Z"
            }
        ],
        "status": "DONE",
        "updated": "2024-07-30T04:10:54Z",
        "uuid": "6619572d-650e-49e7-9ce3-bd955a2257b2"
    },
    "pagination": {
        "page": 1,
        "perPage": 1,
        "totalItems": 1,
        "totalPages": 1
    }
}
</code></pre></td></tr><tr><td>Invalid Account</td><td>999966660003</td><td><p></p><pre class="language-json"><code class="lang-json">{
    "code": "00",
    "message": "Success",
    "data": {
        "created": "2024-07-30T04:15:03Z",
        "merchantId": "922e39ab-7565-49f6-b84f-fb56122821ae",
        "payoutResults": {
            "totalFailedAmount": 25000,
            "totalFailedCount": 1,
            "totalPendingAmount": 0,
            "totalPendingCount": 0,
            "totalSuccessAmount": 0,
            "totalSuccessCount": 0
        },
        "payouts": [
            {
                "amount": {
                    "currency": "IDR",
                    "value": "15000"
                },
                "channelCode": "BRI",
                "channelInformation": {
                    "accountName": "Reforza Pivot",
                    "accountNumber": "999966660003"
                },
                "created": "2024-07-30T04:15:03Z",
                "description": "Testing Invalid Account",
                "inquiryId": "",
                "reason": "Invalid account",
                "referenceId": "2024052400083459",
                "status": "FAILED",
                "updated": "2024-07-30T04:15:03Z"
            }
        ],
        "status": "DONE",
        "updated": "2024-07-30T04:15:03Z",
        "uuid": "7a296b29-3b82-4745-8de3-8efa3606ae5e"
    },
    "pagination": {
        "page": 1,
        "perPage": 1,
        "totalItems": 1,
        "totalPages": 1
    }
}
</code></pre></td></tr><tr><td>Dormant Account</td><td>999966660006</td><td><p></p><pre class="language-json"><code class="lang-json">{
    "code": "00",
    "message": "Success",
    "data": {
        "created": "2024-07-30T04:20:35Z",
        "merchantId": "922e39ab-7565-49f6-b84f-fb56122821ae",
        "payoutResults": {
            "totalFailedAmount": 20000,
            "totalFailedCount": 1,
            "totalPendingAmount": 0,
            "totalPendingCount": 0,
            "totalSuccessAmount": 0,
            "totalSuccessCount": 0
        },
        "payouts": [
            {
                "amount": {
                    "currency": "IDR",
                    "value": "10000"
                },
                "channelCode": "BRI",
                "channelInformation": {
                    "accountName": "Reforza Pivot",
                    "accountNumber": "999966660006"
                },
                "created": "2024-07-30T04:20:35Z",
                "description": "Testing Dormant Account",
                "inquiryId": "",
                "reason": "Dormant account",
                "referenceId": "2024052400083461",
                "status": "FAILED",
                "updated": "2024-07-30T04:20:35Z"
            }
        ],
        "status": "DONE",
        "updated": "2024-07-30T04:20:35Z",
        "uuid": "9b108a66-f88b-4fa6-adb0-4a8830d2ff81"
    },
    "pagination": {
        "page": 1,
        "perPage": 1,
        "totalItems": 1,
        "totalPages": 1
    }
}            
</code></pre></td></tr><tr><td>Insufficient Balance</td><td>999966660007</td><td><p></p><pre class="language-json"><code class="lang-json">{
    "code": "00",
    "message": "Success",
    "data": {
        "created": "2024-07-30T04:21:55Z",
        "merchantId": "922e39ab-7565-49f6-b84f-fb56122821ae",
        "payoutResults": {
            "totalFailedAmount": 0,
            "totalFailedCount": 0,
            "totalPendingAmount": 20000,
            "totalPendingCount": 1,
            "totalSuccessAmount": 0,
            "totalSuccessCount": 0
        },
        "payouts": [
            {
                "amount": {
                    "currency": "IDR",
                    "value": "10000"
                },
                "channelCode": "BRI",
                "channelInformation": {
                    "accountName": "Reforza Pivot",
                    "accountNumber": "999966660007"
                },
                "created": "2024-07-30T04:21:55Z",
                "description": "Testing Insufficient Balance",
                "inquiryId": "",
                "reason": "",
                "referenceId": "2024052400083462",
                "status": "APPROVED",
                "updated": "2024-07-30T04:21:56Z"
            }
        ],
        "status": "PENDING",
        "updated": "2024-07-30T04:21:56Z",
        "uuid": "eab4c929-fbbc-4dbb-a12d-251b86885b60"
    },
    "pagination": {
        "page": 1,
        "perPage": 1,
        "totalItems": 1,
        "totalPages": 1
    }
}
</code></pre></td></tr><tr><td>Timeout</td><td>999966660008</td><td><p></p><pre class="language-json"><code class="lang-json">{
    "code": "service_unavailable",
    "message": "Gateway / Partner service is unavailable",
    "error": {
        "type": "GATEWAY_ERROR",
        "details": [
            {
                "field": "",
                "message": "Please hit periodically"
            }
        ],
        "trace_id": "fa6bf3d419b9ae2ff2a71cac548eb7ac"
    }
}
</code></pre></td></tr></tbody></table>


# Channel Codes

## Bank Destination

<table><thead><tr><th width="159">Bank Code</th><th>Name</th><th>Channel Code</th></tr></thead><tbody><tr><td>002</td><td>BANK RAKYAT INDONESIA</td><td>BRI</td></tr><tr><td>003</td><td>BANK INDONESIA EXIMBANK (formerly Bank Ekspor Indonesia)</td><td>EXIMBANK</td></tr><tr><td>008</td><td>BANK MANDIRI</td><td>MANDIRI</td></tr><tr><td>009</td><td>BANK NEGARA INDONESIA</td><td>BNI</td></tr><tr><td>011</td><td>BANK DANAMON INDONESIA</td><td>DANAMON</td></tr><tr><td>011</td><td>BANK DANAMON UUS</td><td>DANAMON_UUS</td></tr><tr><td>013</td><td>BANK PERMATA</td><td>PERMATA</td></tr><tr><td>013</td><td>BANK PERMATA UUS</td><td>PERMATA_UUS</td></tr><tr><td>014</td><td>BANK CENTRAL ASIA (BCA)</td><td>BCA</td></tr><tr><td>016</td><td>BANK MAYBANK INDONESIA</td><td>MAYBANK</td></tr><tr><td>019</td><td>BANK PANIN INDONESIA</td><td>PANIN</td></tr><tr><td>020</td><td>BANK ARTA NIAGA KENCANA</td><td>ARTA_NIAGA_KENCANA</td></tr><tr><td>022</td><td>BANK CIMB NIAGA</td><td>CIMB</td></tr><tr><td>022</td><td>BANK CIMB NIAGA SYARIAH</td><td>CIMB_SYR</td></tr><tr><td>022</td><td>BANK CIMB NIAGA UUS</td><td>CIMB_UUS</td></tr><tr><td>023</td><td>BANK UOB INDONESIA</td><td>UOB</td></tr><tr><td>023</td><td>TMRW BY UOB INDONESIA</td><td>TMRW</td></tr><tr><td>026</td><td>BANK LIPPO</td><td>LIPPO</td></tr><tr><td>028</td><td>BANK OCBC NISP</td><td>OCBC</td></tr><tr><td>028</td><td>BANK OCBC NISP UUS</td><td>OCBC_UUS</td></tr><tr><td>028</td><td>BPR DANAGUNG ABADI</td><td>DANAGUNG_ABADI</td></tr><tr><td>028</td><td>BPR DANAGUNG BAKTI</td><td>DANAGUNG_BAKTI</td></tr><tr><td>028</td><td>BPR DANAGUNG RAMULTI</td><td>DANAGUNG_RAMULTI</td></tr><tr><td>030</td><td>AMERICAN EXPRESS BANK LTD</td><td>AMEX</td></tr><tr><td>031</td><td>BANK CITIBANK</td><td>CITIBANK</td></tr><tr><td>032</td><td>JP MORGAN CHASE BANK</td><td>JPMORGAN</td></tr><tr><td>033</td><td>BANK OF AMERICA MERILL-LYNCH</td><td>BAML</td></tr><tr><td>034</td><td>BANK ING INDONESIA</td><td>ING</td></tr><tr><td>036</td><td>BANK CCB INDONESIA</td><td>CCB</td></tr><tr><td>036</td><td>BANK MULTICOR</td><td>MULTICOR</td></tr><tr><td>037</td><td>BANK ARTHA GRAHA INTERNATIONAL</td><td>ARTHA</td></tr><tr><td>039</td><td>BANK CREDIT AGRICOLE INDOSUEZ</td><td>CREDIT_AGRICOLE</td></tr><tr><td>040</td><td>THE BANGKOK BANK COMPANY</td><td>BANGKOK_BANK</td></tr><tr><td>042</td><td>BANK MITSUBISHI UFJ FINANCIAL GROUP (MUFG)</td><td>MUFG</td></tr><tr><td>045</td><td>BANK SUMITOMO MITSUI INDONESIA</td><td>SUMITOMO</td></tr><tr><td>046</td><td>BANK DBS INDONESIA</td><td>DBS</td></tr><tr><td>046</td><td>DIGIBANK</td><td>DIGIBANK</td></tr><tr><td>047</td><td>BANK RESONA PERDANIA</td><td>RESONA</td></tr><tr><td>048</td><td>BANK MIZUHO INDONESIA</td><td>MIZUHO</td></tr><tr><td>050</td><td>BANK STANDARD CHARTERED</td><td>STANDARD_CHARTERED</td></tr><tr><td>052</td><td>BANK ABN AMRO</td><td>ABN_AMRO</td></tr><tr><td>053</td><td>BANK KEPPEL TATLEE BUANA</td><td>KEPPEL</td></tr><tr><td>054</td><td>BANK CAPITAL INDONESIA</td><td>CAPITAL</td></tr><tr><td>057</td><td>BANK BNP PARIBAS INDONESIA</td><td>BNP_PARIBAS</td></tr><tr><td>059</td><td>KOREAN EXCHANGE BANK DANAMON (KEB Indonesia)</td><td>KEB_INDONESIA</td></tr><tr><td>060</td><td>BANK RABOBANK INTERNATIONAL INDONESIA</td><td>RABOBANK</td></tr><tr><td>061</td><td>BANK ANZ INDONESIA</td><td>ANZ</td></tr><tr><td>067</td><td>DEUTSCHE BANK</td><td>DEUTSCHE</td></tr><tr><td>068</td><td>BANK WOORI INDONESIA</td><td>WOORI</td></tr><tr><td>069</td><td>BANK OF CHINA</td><td>BOC</td></tr><tr><td>076</td><td>BANK BUMI ARTA</td><td>BUMI_ARTA</td></tr><tr><td>087</td><td>BANK HONGKONG AND SHANGHAI BANK CORPORATION (HSBC)<br><br>(formerly Bank Ekonomi Raharja)</td><td>HSBC</td></tr><tr><td>087</td><td>BANK HONGKONG AND SHANGHAI BANK CORPORATION (HSBC) UUS</td><td>HSBC_UUS</td></tr><tr><td>088</td><td>BANK ANTARDAERAH</td><td>ANTARDAERAH</td></tr><tr><td>089</td><td>BANK HAGA</td><td>HAGA</td></tr><tr><td>093</td><td>BANK IFI</td><td>IFI</td></tr><tr><td>095</td><td>BANK J TUST INDONESIA <br>(Formerly Bank Mutiara)</td><td>JTRUST</td></tr><tr><td>097</td><td>BANK MAYAPADA</td><td>MAYAPADA</td></tr><tr><td>110</td><td>BANK JABAR DAN BANTEN (BJB)</td><td>BJB</td></tr><tr><td>111</td><td>BANK DKI</td><td>DKI</td></tr><tr><td>111</td><td>BANK DKI UUS</td><td>DKI_UUS</td></tr><tr><td>112</td><td>BPD DAERAH ISTIMEWA YOGYAKARTA (DIY)</td><td>DAERAH_ISTIMEWA</td></tr><tr><td>112</td><td>BPD DAERAH ISTIMEWA YOGYAKARTA (DIY) UUS</td><td>DAERAH_ISTIMEWA_UUS</td></tr><tr><td>113</td><td>BPD JAWA TENGAH</td><td>JAWA_TENGAH</td></tr><tr><td>113</td><td>BPD JAWA TENGAH UUS</td><td>JAWA_TENGAH_UUS</td></tr><tr><td>114</td><td>BPD JAWA TIMUR</td><td>JAWA_TIMUR</td></tr><tr><td>114</td><td>BPD JAWA TIMUR UUS</td><td>JAWA_TIMUR_UUS</td></tr><tr><td>115</td><td>BPD JAMBI</td><td>JAMBI</td></tr><tr><td>115</td><td>BPD JAMBI UUS</td><td>JAMBI_UUS</td></tr><tr><td>116</td><td>BPD ACEH</td><td>ACEH</td></tr><tr><td>116</td><td>BPD ACEH UUS</td><td>ACEH_UUS</td></tr><tr><td>116</td><td>BPD ACEH SYARIAH</td><td>ACEH_SYR</td></tr><tr><td>117</td><td>BPD SUMATERA UTARA (SUMUT)</td><td>SUMUT</td></tr><tr><td>117</td><td>BPD SUMATERA UTARA (SUMUT) UUS</td><td>SUMUT_UUS</td></tr><tr><td>118</td><td>BPD SUMATERA BARAT (SUMBAR)</td><td>SUMATERA_BARAT</td></tr><tr><td>118</td><td>BPD SUMATERA BARAT (SUMBAR) UUS</td><td>SUMATERA_BARAT_UUS</td></tr><tr><td>119</td><td>BPD KALIMANTAN TIMUR</td><td>KALIMANTAN_TIMUR</td></tr><tr><td>119</td><td>BPD KALIMANTAN TIMUR UUS</td><td>KALIMANTAN_TIMUR_UUS</td></tr><tr><td>119</td><td>BPD RIAU DAN KEPRI</td><td>RIAU_DAN_KEPRI</td></tr><tr><td>119</td><td>BPD RIAU DAN KEPRI UUS</td><td>RIAU_DAN_KEPRI_UUS</td></tr><tr><td>120</td><td>BPD SUMSEL DAN BABEL</td><td>SUMSEL_DAN_BABEL</td></tr><tr><td>120</td><td>BPD SUMSEL DAN BABEL UUS</td><td>SUMSEL_DAN_BABEL_UUS</td></tr><tr><td>121</td><td>BPD LAMPUNG</td><td>LAMPUNG</td></tr><tr><td>122</td><td>BPD KALIMANTAN SELATAN</td><td>KALIMANTAN_SELATAN</td></tr><tr><td>122</td><td>BPD KALIMANTAN SELATAN UUS</td><td>KALIMANTAN_SELATAN_UUS</td></tr><tr><td>123</td><td>BPD KALIMANTAN BARAT</td><td>KALIMANTAN_BARAT</td></tr><tr><td>123</td><td>BPD KALIMANTAN BARAT UUS</td><td>KALIMANTAN_BARAT_UUS</td></tr><tr><td>124</td><td>BANK KALTIM KALTARA</td><td>KALIMANTAN_TIMUR</td></tr><tr><td>125</td><td>BPD KALIMANTAN TENGAH</td><td>KALIMANTAN_TENGAH</td></tr><tr><td>126</td><td>BPD SULAWESI SELATAN DAN BARAT (SULSELBAR)</td><td>SULSELBAR</td></tr><tr><td>126</td><td>BPD SULAWESI SELATAN DAN BARAT (SULSELBAR) UUS</td><td>SULSELBAR_UUS</td></tr><tr><td>127</td><td>BPD SULAWESI UTARA DAN GORONTALO (SULUTGO)</td><td>SULUT</td></tr><tr><td>128</td><td>BPD NUSA TENGGARA BARAT</td><td>NUSA_TENGGARA_BARAT</td></tr><tr><td>128</td><td>BPD NUSA TENGGARA BARAT UUS</td><td>NUSA_TENGGARA_BARAT_UUS</td></tr><tr><td>129</td><td>BPD BALI</td><td>BALI</td></tr><tr><td>130</td><td>BPD NUSA TENGGARA TIMUR</td><td>NUSA_TENGGARA_TIMUR</td></tr><tr><td>131</td><td>BPD MALUKU DAN MALUKU UTARA</td><td>MALUKU</td></tr><tr><td>132</td><td>BPD PAPUA</td><td>PAPUA</td></tr><tr><td>133</td><td>BPD BENGKULU</td><td>BENGKULU</td></tr><tr><td>134</td><td>BPD SULAWESI TENGAH</td><td>SULAWESI</td></tr><tr><td>135</td><td>BPD SULAWESI TENGGARA</td><td>SULAWESI_TENGGARA</td></tr><tr><td>137</td><td>BPD BANTEN<br>(Formerly Bank Pundi Indonesia)</td><td>BANTEN</td></tr><tr><td>145</td><td>BANK NUSANTARA PARAHYANGAN</td><td>NUSANTARA_PARAHYANGAN</td></tr><tr><td>146</td><td>BANK OF INDIA INDONESIA</td><td>INDIA</td></tr><tr><td>147</td><td>BANK MUAMALAT</td><td>MUAMALAT</td></tr><tr><td>151</td><td>BANK MESTIKA DHARMA</td><td>MESTIKA_DHARMA</td></tr><tr><td>152</td><td>BANK SHINHAN<br>(Formerly Bank Metro Express)</td><td>SHINHAN</td></tr><tr><td>153</td><td>BANK SINARMAS</td><td>SINARMAS</td></tr><tr><td>153</td><td>BANK SINARMAS UUS</td><td>SINARMAS_UUS</td></tr><tr><td>157</td><td>BANK MASPION INDONESIA</td><td>MASPION</td></tr><tr><td>159</td><td>BANK HAGAKITA</td><td>HAGAKITA</td></tr><tr><td>161</td><td>BANK GANESHA</td><td>GANESHA</td></tr><tr><td>162</td><td>BANK WINDU KENTJANA</td><td>WINDU_KENTJANA</td></tr><tr><td>164</td><td>BANK ICBC INDONESIA</td><td>ICBC</td></tr><tr><td>166</td><td>BANK HARMONI INTERNATIONAL</td><td>HARMONI</td></tr><tr><td>167</td><td>BANK QNB INDONESIA<br>(Formerly Bank QNB Kesawan)</td><td>QNB_INDONESIA</td></tr><tr><td>200</td><td>BANK TABUNGAN NEGARA (BTN)</td><td>BTN</td></tr><tr><td>200</td><td>BANK TABUNGAN NEGARA (BTN) UUS</td><td>BTN_UUS</td></tr><tr><td>212</td><td>BANK HIMPUNAN SAUDARA 1906</td><td>HIMPUNAN_SAUDARA</td></tr><tr><td>212</td><td>BANK WOORI SAUDARA</td><td>WOORI_SAUDARA</td></tr><tr><td>213</td><td>BANK SMBC INDONESIA</td><td>SMBC_INDONESIA</td></tr><tr><td>213</td><td>JENIUS</td><td>JENIUS</td></tr><tr><td>213</td><td>PT BANK BTPN TBK</td><td>TABUNGAN_PENSIUNAN_NASIONAL</td></tr><tr><td>333</td><td>KOP INTIDANA</td><td>KOP_INTIDANA</td></tr><tr><td>405</td><td>BANK SWAGUNA</td><td>SWAGUNA</td></tr><tr><td>405</td><td>BANK VICTORIA SYARIAH</td><td>VICTORIA_SYR</td></tr><tr><td>422</td><td>BANK SYARIAH INDONESIA (Formerly BRI Syariah)</td><td>BRI_SYR</td></tr><tr><td>425</td><td>BANK JAWA DAN BANTEN (BJB) SYARIAH</td><td>BJB_SYR</td></tr><tr><td>426</td><td>BANK MEGA</td><td>MEGA</td></tr><tr><td>427</td><td>BANK SYARIAH INDONESIA (Formerly BNI Syariah)</td><td>BNI_SYR</td></tr><tr><td>441</td><td>BANK KB BUKOPIN</td><td>BUKOPIN</td></tr><tr><td>451</td><td>BANK SYARIAH INDONESIA</td><td>BSI</td></tr><tr><td>459</td><td>BANK BISNIS INTERNASIONAL (BANK KROM)</td><td>BISNIS_INTERNASIONAL</td></tr><tr><td>466</td><td>BANK ANDARA <br>(Formerly Bank Sri Partha)</td><td>ANDARA</td></tr><tr><td>472</td><td>BANK JASA JAKARTA</td><td>JASA_JAKARTA</td></tr><tr><td>484</td><td>BANK KEB HANA<br>(Formerly Bank Bintang Manunggal)</td><td>HANA</td></tr><tr><td>485</td><td>BANK MNC INTERNATIONAL</td><td>MNC_INTERNASIONAL</td></tr><tr><td>490</td><td>BANK NEO COMMERCE<br>(Formerly Bank Yudha Bakti)</td><td>BNC</td></tr><tr><td>491</td><td>BANK MITRANIAGA</td><td>MITRANIAGA</td></tr><tr><td>494</td><td>BANK RAYA<br>(Formerly Bank BRI Agroniaga)</td><td>AGRONIAGA</td></tr><tr><td>498</td><td>BANK SBI INDONESIA</td><td>SBI_INDONESIA</td></tr><tr><td>501</td><td>BANK CENTRAL ASIA (BCA) DIGITAL (BluBCA)</td><td>BCA_DIGITAL</td></tr><tr><td>503</td><td>BANK NATIONAL NOBU</td><td>NATIONALNOBU</td></tr><tr><td>506</td><td>BANK MEGA SYARIAH</td><td>MEGA_SYR</td></tr><tr><td>513</td><td>BANK INA PERDANA</td><td>INA_PERDANA</td></tr><tr><td>517</td><td>BANK PANIN DUBAI SYARIAH<br>(Formerly Bank Harfa)</td><td>PANIN_SYR</td></tr><tr><td>520</td><td>BANK PRIMA MASTER</td><td>PRIMA_MASTER</td></tr><tr><td>521</td><td>BANK KB BUKOPIN SYARIAH</td><td>BUKOPIN_SYR</td></tr><tr><td>523</td><td>BANK SAHABAT SAMPOERNA</td><td>SAHABAT_SAMPOERNA</td></tr><tr><td>525</td><td>BANK BARCLAYS</td><td>BARCLAYS</td></tr><tr><td>526</td><td>BANK DINAR INDONESIA</td><td>DINAR_INDONESIA</td></tr><tr><td>526</td><td>BANK OKE<br>(Formerly Bank Andara)</td><td>OKE</td></tr><tr><td>531</td><td>ANGLOMAS INTERNATIONAL BANK</td><td>ANGLOMAS</td></tr><tr><td>531</td><td>BANK AMAR INDONESIA</td><td>AMAR</td></tr><tr><td>535</td><td>SEABANK<br>(Formerly Bank Kesejahteraan Ekonomi)</td><td>SEABANK</td></tr><tr><td>536</td><td>BANK CENTRAL ASIA (BCA) SYARIAH</td><td>BCA_SYR</td></tr><tr><td>542</td><td>BANK JAGO<br>(Formerly Bank Artos Indonesia)</td><td>JAGO</td></tr><tr><td>547</td><td>BANK BTPN SYARIAH</td><td>BTPN_SYARIAH</td></tr><tr><td>548</td><td>BANK MULTI ARTA SENTOSA</td><td>MULTI_ARTA_SENTOSA</td></tr><tr><td>548</td><td>BANK MULTIARTA SENTOSA</td><td>MAS</td></tr><tr><td>553</td><td>BANK MAYORA INDONESIA</td><td>MAYORA</td></tr><tr><td>555</td><td>BANK INDEX SELINDO</td><td>INDEX_SELINDO</td></tr><tr><td>558</td><td>BANK PUNDI<br>(Formerly Bank Eksekutif)</td><td>PUNDI</td></tr><tr><td>559</td><td>BANK CENTRATAMA NASIONAL BANK</td><td>CNB</td></tr><tr><td>562</td><td>BANK FAMA INTERNASIONAL</td><td>FAMA</td></tr><tr><td>564</td><td>BANK MANDIRI TASPEN POS</td><td>MANDIRI_TASPEN</td></tr><tr><td>566</td><td>BANK VICTORIA INTERNASIONAL</td><td>VICTORIA_INTERNASIONAL</td></tr><tr><td>567</td><td>ALLO BANK INDONESIA<br>(Formerly Bank Harda Internasional)</td><td>HARDA_INTERNASIONAL</td></tr><tr><td>600</td><td>BPR SUPRA ARTAPERSADA</td><td>SUPRA</td></tr><tr><td>608</td><td>MANDIRI - BPR</td><td>MANDIRI_BPR</td></tr><tr><td>688</td><td>BPR KS (KARYAJATNIKA SEDAYA)</td><td>KS</td></tr><tr><td>867</td><td>BANK EKA BUMI ARTHA</td><td>EKA</td></tr><tr><td>945</td><td>BANK IBK INDONESIA <br>(Formerly Bank Agris)</td><td>IBK</td></tr><tr><td>945</td><td>BANK AGRIS</td><td>AGRIS</td></tr><tr><td>946</td><td>BANK MERINCORP</td><td>MERINCORP</td></tr><tr><td>947</td><td>BANK ALADIN SYARIAH<br>(Formerly Bank Maybank Syariah Indonesia)</td><td>ALADIN</td></tr><tr><td>948</td><td>BANK OCBC INDONESIA</td><td>OCBC_INDONESIA</td></tr><tr><td>949</td><td>BANK CTBC INDONESIA</td><td>CTBC</td></tr><tr><td>950</td><td>BANK COMMONWEALTH</td><td>COMMONWEALTH</td></tr></tbody></table>

## E Wallet Destination

| Name      | Channel Code |
| --------- | ------------ |
| GoPay     | GOPAY        |
| OVO       | OVO          |
| ShopeePay | SHOPEEPAY    |
| DANA      | DANA         |
| LinkAja   | LINKAJA      |

## Virtual Account Destination

| Name                            | Channel Code |
| ------------------------------- | ------------ |
| BANK NEO COMMERCE               | BNC          |
| BANK PERMATA                    | PERMATA      |
| BANK DANAMON INDONESIA          | DANAMON      |
| BANK CIMB NIAGA — *TBA*         | CIMB         |
| BANK CENTRAL ASIA (BCA) — *TBA* | BCA          |
| BANK RAKYAT INDONESIA — *TBA*   | BRI          |
| BANK NEGARA INDONESIA — *TBA*   | BNI          |


# Payout (International)

Send in **Rupiah**, and your recipient receives the full amount in **local currency** — faster, safer, and simpler.

**How it works:**

1. **Initiate global payouts** via API or dashboard
2. **Send money in IDR** — no hidden FX surprises
3. **Recipient gets full amount** in their local currency

## API Flow

<figure><img src="https://627965603-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FImVr2HJay0snj5ukhBJK%2Fuploads%2FuMHZXvmx48ICAGRq2erj%2Fimage.png?alt=media&#x26;token=507f71a3-4fa8-44eb-a3af-b91a9305c124" alt=""><figcaption></figcaption></figure>


# Get FX Rate

## Method and URL

<mark style="color:green;">`GET`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/xb/fx-rate

## **Request Params**

| Key                 | Value                   |
| ------------------- | ----------------------- |
| destinationCurrency | {{destinationCurrency}} |
| sourceCurrency      | IDR                     |

## Response

**Response Body**

```json
{
    "code": "00",
    "message": "Success",
    "data": {
        "fxRate": "0.000066142872",
        "destinationFxRate": "15118.7871007476058796",
        "expiryAt": "2024-09-27T09:00:00Z"
    }
}
```

**Detail Parameter Response**

<table><thead><tr><th width="208">Parameter</th><th width="110">Data Type</th><th width="133">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>code</td><td>String</td><td>M</td><td>Response code</td></tr><tr><td>message</td><td>String</td><td>M</td><td>Response description</td></tr><tr><td>data</td><td>Object</td><td>M</td><td><br></td></tr><tr><td><ul><li>fxRate</li></ul></td><td>String</td><td>M</td><td>Conversion rate from source currency to destination currency</td></tr><tr><td><ul><li>destinationFxRate</li></ul></td><td>String</td><td>M</td><td>Conversion rate from destination currency to source currency</td></tr><tr><td><ul><li>expiryAt</li></ul></td><td>String</td><td>M</td><td>FX rate object expired time in ISO-8601 format. i.e. 2024-10-02T08:36:44.967496538Z<br></td></tr></tbody></table>


# Sender

# Create Sender

## Method and URL

<mark style="color:green;">`POST`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/xb/sender

## **Request Params**

**Request body**

```json
{
    "name": "Indonesah Newjeans",
    "countryCode": "ID",
    "state": "Jawa Barat",
    "city": "Bandung",
    "address": "Jl Street",
    "postcode": "12345",
    "accountType": "Individual",
    "dob": "1990-12-01", //conditional, only for individual
    "bankAccountNumber": "98723293", //conditional, only for beneficiary country Korea
    "identificationType": "Passport",
    "identificationNumber": "X123457",
    "contactCountryCode": "+62",
    "contactNumber": "123134123",
    "sourceOfIncome": "Salary"
}
```

## Response

**Response Body**

```json
{
    "code": "00",
    "message": "Success",
    "data": {
        "uuid": "da9fb196-3f8f-4bb7-a838-c50c40d13581",
        "name": "Indonesah Newjeans",
        "countryCode": "ID",
        "state": "Jawa Barat",
        "city": "Bandung",
        "address": "Jl Street",
        "postcode": "12345",
        "accountType": "Individual",
        "identificationType": "Passport",
        "identificationNumber": "X123457",
        "bankAccountNumber": "98723293",
        "dob": "1990-12-01",
        "contactCountryCode": "+62",
        "contactNumber": "123134123",
        "sourceOfIncome": "Salary",
        "createdAt": "2024-11-06T03:10:25Z"
    }
}
```


# Update Sender

## Method and URL

<mark style="color:green;">`PUT`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/xb/sender/:id

## **Request Params**

**Request body**

```json
{
    "name": "Indonesah Newjeans",
    "countryCode": "ID",
    "state": "Jawa Barat",
    "city": "Bandung",
    "address": "Jl Street",
    "postcode": "12345",
    "accountType": "Individual",
    "dob": "1990-12-01", //conditional, only for individual
    "bankAccountNumber": "98723293", //conditional, only for beneficiary country Korea
    "identificationType": "Passport",
    "identificationNumber": "X123457",
    "contactCountryCode": "+62",
    "contactNumber": "123134123",
    "sourceOfIncome": "Salary"
}
```

## Response

**Response Body**

```json
{
    "code": "00",
    "message": "Success",
    "data": {
        "uuid": "da9fb196-3f8f-4bb7-a838-c50c40d13581",
        "name": "Indonesah Newjeans",
        "countryCode": "ID",
        "state": "Jawa Barat",
        "city": "Bandung",
        "address": "Jl Street",
        "postcode": "12345",
        "accountType": "Individual",
        "identificationType": "Passport",
        "identificationNumber": "X123457",
        "bankAccountNumber": "98723293",
        "dob": "1990-12-01",
        "contactCountryCode": "+62",
        "contactNumber": "123134123",
        "sourceOfIncome": "Salary",
        "createdAt": "2024-11-06T03:10:25Z"
    }
}

```

**Sender Object**

<table><thead><tr><th>Parameter</th><th width="220">Data Type</th><th>Requirement</th><th>Description</th></tr></thead><tbody><tr><td>uuid</td><td>String Generated</td><td>M</td><td>Object unique identifier</td></tr><tr><td>merchantId</td><td>String Generated</td><td>M</td><td>Merchant unique identifier</td></tr><tr><td>referenceId</td><td>String</td><td>M</td><td>Merchant remitter reference ID</td></tr><tr><td>name</td><td>String <br></td><td>M</td><td><p>Remitter name<br>^[A-Za-z0-9 -]{1,40}$</p><p><br></p><p>Max 40</p><p>Can only contain the special characters</p></td></tr><tr><td>countryCode</td><td>Enum </td><td>M</td><td>Remitter two-letter country code based on ISO 3166-1</td></tr><tr><td>state</td><td>String</td><td>M</td><td>Remitter state<br>Length: Max 255</td></tr><tr><td>city</td><td>String</td><td>M</td><td>Remitter city<br>Length: Max 35</td></tr><tr><td>address</td><td>String</td><td>M</td><td>Remitter address<br><br>Length: Max 200</td></tr><tr><td>postcode</td><td>Number </td><td>M</td><td><p>Remitter postcode<br><br>^[a-zA-Z0-9\s\-]{0,16}$</p><p><br></p><p>Max 16</p><p>Can only contain the special characters -</p></td></tr><tr><td>accountType</td><td>Enum </td><td>M</td><td><p>Remitter account type (individual or company)<br><br></p><p>Value:</p><p>Should be either</p><ul><li>Individual</li><li>Company</li></ul></td></tr><tr><td>bankAccountNumber</td><td>String</td><td>C<br>Required if beneficiary country code is KR</td><td><p>Remitter bank name</p><p><br><br>Length: Max 50</p></td></tr><tr><td>nationality</td><td>Enum </td><td>M</td><td><p>Remitter nationality in two-letter country code based on ISO 3166-1<br></p><p>Value: Can be the same as remitterCountryCode</p></td></tr><tr><td>identificationType</td><td><p>Enum</p><p></p></td><td>M</td><td><p>Remitter ID type according to account type<br><br></p><p>Value:</p><p>If Individual, should be either</p><ul><li>Kartu Tanda Penduduk</li><li>Passport</li></ul><p><br></p><p>If Company, should be either</p><ul><li>Business Registration Number</li><li>ACRA</li><li>Travel Agent License Number</li><li>ABN</li><li>ACN</li><li>ARBN</li></ul></td></tr><tr><td>identificationNumber</td><td>String </td><td>M</td><td><p>Remitter ID number based on the ID type selected<br><br>^[A-Za-z0-9\s-.]{1,30}$</p><p><br></p><p>Max 30</p><p>Can only contain the special characters </p></td></tr><tr><td>dob</td><td>String </td><td>C</td><td><p>Remitter date of birth</p><p>Required if account type is Individual</p><p></p><p>Format: YYYY/MM/DD</p></td></tr><tr><td>contactCountryCode</td><td>String</td><td>M</td><td>Remitter contact country code<br><br>Length: Max 5</td></tr><tr><td>contactNumber</td><td>String </td><td>M</td><td><p>Remitter contact number<br></p><p>^[0-9+/-\\s]{0,17}$<br></p><p>Length: Max 17</p></td></tr><tr><td>sourceOfIncome</td><td>Enum </td><td>M</td><td><p>Remitter source of income<br><br></p><p>Value:</p><p>Should be either</p><ul><li>Salary</li><li>Personal Savings</li><li>Personal Wealth</li><li>Retirement Funds</li><li>Business Owner</li><li>Shareholder</li><li>Loan Facility</li><li>Personal Account</li><li>Corporate Account</li></ul></td></tr></tbody></table>


# Deactivate Sender

## Method and URL

<mark style="color:green;">`PATCH`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/xb/sender/:id/deactivate

## **Request Params**

| Key | Value    |
| --- | -------- |
| id  | {{uuid}} |

## Response

**Response Body**

```json
{
    "code": "00",
    "message": "Success",
    "data": {
        "uuid": "da9fb196-3f8f-4bb7-a838-c50c40d13581",
        "name": "Indonesah Newjeans",
        "countryCode": "ID",
        "state": "Jawa Barat",
        "city": "Bandung",
        "address": "Jl Street",
        "postcode": "12345",
        "accountType": "Individual",
        "identificationType": "Passport",
        "identificationNumber": "X123457",
        "bankAccountNumber": "98723293",
        "dob": "1990-12-01",
        "contactCountryCode": "+62",
        "contactNumber": "123134123",
        "sourceOfIncome": "Salary",
        "createdAt": "2024-11-06T03:10:25Z",
        "updatedAt": "2024-11-06T10:37:51.469524721Z",
        "deactivatedAt": "2024-11-06T10:37:51.469524721Z"
    }
}
```


# Get Sender by ID

## Method and URL

<mark style="color:green;">`GET`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/xb/sender/:id

## **Request Params**

| Key | Value         |
| --- | ------------- |
| id  | {{sender id}} |

&#x20;

## Response

**Response Body**

```json
{
    "code": "00",
    "message": "Success",
    "data": {
        "uuid": "da9fb196-3f8f-4bb7-a838-c50c40d13581",
        "name": "Indonesah Newjeans",
        "countryCode": "ID",
        "state": "Jawa Barat",
        "city": "Bandung",
        "address": "Jl Street",
        "postcode": "12345",
        "accountType": "Individual",
        "identificationType": "Passport",
        "identificationNumber": "X123457",
        "bankAccountNumber": "98723293",
        "dob": "1990-12-01",
        "contactCountryCode": "+62",
        "contactNumber": "123134123",
        "sourceOfIncome": "Salary",
        "createdAt": "2024-11-06T03:10:25Z",
        "updatedAt": "2024-11-06T10:35:05Z",
        "deactivatedAt": "2024-11-06T10:35:05Z"
    }
}
```


# Get Sender List

## Method and URL

<mark style="color:green;">`GET`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/xb/sender/list

## Response

**Response Body**

```json
{
    "code": "00",
    "message": "Success",
    "data": [
        {
            "accountType": "Individual",
            "address": "JL Tepok",
            "bankAccountNumber": "",
            "city": "Kabupaten Nduga",
            "contactCountryCode": "+675",
            "contactNumber": "8976416255",
            "countryCode": "ID",
            "createdAt": "2024-10-25T10:01:55Z",
            "dob": "2024/10/24",
            "identificationNumber": "35000736213",
            "identificationType": "Passport",
            "merchantId": "922e39ab-7565-49f6-b84f-fb56122821ae",
            "name": "Benef Name",
            "postcode": "65162",
            "sourceOfFunds": "Corporate account",
            "sourceOfIncome": "Business Owner",
            "state": "Papua Pegunungan",
            "updatedAt": "2024-10-25T10:01:55Z",
            "uuid": "8bfe2ed8-b49b-44c4-8807-3814f9bf1ef4"
        },
        {
            "accountType": "Individual",
            "address": "Kebon Jeruk",
            "bankAccountNumber": "",
            "city": "Kabupaten Sumbawa Barat",
            "contactCountryCode": "+62",
            "contactNumber": "81331046443",
            "countryCode": "ID",
            "createdAt": "2024-10-25T09:11:38Z",
            "dob": "2002/07/08",
            "identificationNumber": "35000090909098",
            "identificationType": "Kartu Tanda Penduduk",
            "merchantId": "922e39ab-7565-49f6-b84f-fb56122821ae",
            "name": "Vio Putri",
            "postcode": "541777",
            "sourceOfFunds": "Corporate account",
            "sourceOfIncome": "Salary",
            "state": "Nusa Tenggara Barat",
            "updatedAt": "2024-10-25T09:12:23Z",
            "uuid": "ab2bee5f-770d-4fd8-9788-b9a0c5cf3fdf"
        }
    ],
    "pagination": {
        "page": 2,
        "perPage": 2,
        "totalItems": 33,
        "totalPages": 17,
        "fetchAll": false
    }
}

```

# Beneficiary


# Create Beneficiary

## Method and URL

<mark style="color:green;">`POST`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/xb/beneficiary

## **Request Params**

#### **Request Body**

```json
{
    "name": "Merci Beacou Supa",
    "countryCode": "US",
    "state": "New York",
    "city": "New York City",
    "address": "Jl Amerika",
    "postcode": "12345",
    "accountType": "Individual",
    "accountNumber": "35628342",
    "identificationType": "Passport",
    "identificationNumber": "X123456",
    "bankName": "Bank of America"
    // "bankCode": "123", → only for beneficiary country Korea
    // "contactCountryCode": "+81", → only for beneficiary country Korea
    // "contactNumber": "123134123", → only for beneficiary country Korea
    // "email": "halo@email.com", → only for beneficiary country Korea
    // “payoutMethod”: “WALLET” → only for sending to Alipay (BANK/WALLET/CASH)
}
```

## Response

**Response Body**

```json
{
    "code": "00",
    "message": "Success",
    "data": {
        "uuid": "62b39dd6-85dc-4c33-b9d9-edc992251bf3",
        "name": "Merci Beacou Supa",
        "accountType": "Individual",
        "address": "Jl Amerika",
        "city": "New York City",
        "postcode": "12345",
        "state": "New York",
        "countryCode": "US",
        "identificationType": "Passport",
        "identificationNumber": "X123456",
        "accountNumber": "35628342",
        "bankName": "Bank of America",
        "bankCode": "",
        "contactCountryCode": "",
        "contactNumber": "",
        "email": "",
        "createdAt": "2024-11-07T02:43:52Z"
    }
}
```


# Get Beneficiary by ID

## Method and URL

<mark style="color:green;">`GET`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/xb/beneficiary/:id

## **Request Params**

| Key | Value        |
| --- | ------------ |
| id  | `{{ uuid }}` |

## Response

**Response Body**

```json
{
    "code": "00",
    "message": "Success",
    "data": {
        "uuid": "88597577-edc6-43f0-90ac-378683a9640b",
        "name": "Mark Jobs",
        "accountType": "Individual",
        "address": "New York City",
        "city": "New York City",
        "postcode": "10005",
        "state": "New York",
        "countryCode": "US",
        "identificationType": "Kartu Tanda Penduduk",
        "identificationNumber": "13711189286238",
        "accountNumber": "52342346545101",
        "bankName": "Bank of America",
        "bankCode": "545343545345354",
        "contactCountryCode": "+1",
        "contactNumber": "0867876234",
        "email": "markjacobs@gmail.com",
        “payoutMethod”: “WALLET”, → not yet
        "createdAt": "2024-09-04T18:22:51Z",
        "updatedAt": "2024-11-04T05:46:22Z",
        "deactivatedAt": "2024-11-04T04:57:05Z"
    }
}

```


# Get Beneficiary List

## Method and URL

<mark style="color:green;">`GET`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/xb/beneficiary/:id

## **Request Params**

| Key             | Value                                             |
| --------------- | ------------------------------------------------- |
| showDeactivated | {{true}} → to also show deactivated beneficiaries |
| name            | {{name}} → to filter by name                      |
| accountNumber   | {{accountNumber}} → to filter by account number   |
| countryCode     | {{countryCode}} → to filter by country            |

## Response

**Response Body**

```json
{
    "code": "00",
    "message": "Success",
    "data": [
        {
            "accountNumber": "12312",
            "accountType": "Individual",
            "address": "JL Tepok",
            "bankCode": "",
            "bankName": "Bank Indo",
            "city": "Musselshell County",
            "contactCountryCode": "",
            "contactNumber": "",
            "countryCode": "US",
            "createdAt": "2024-10-23T12:46:33Z",
            "email": "",
            “payoutMethod”: “WALLET”, → not yet
            "identificationNumber": "",
            "identificationType": "",
            "merchantId": "922e39ab-7565-49f6-b84f-fb56122821ae",
            "name": "Benef Name",
            "postcode": "65162",
            "state": "Montana",
            "updatedAt": "2024-10-23T12:46:33Z",
            "uuid": "f86769fe-2dc3-4a03-936b-fbedd9132ead"
        },
        {
            "accountNumber": "Test gan",
            "accountType": "Individual",
            "address": "JL Tepok",
            "bankCode": "",
            "bankName": "Bank Indo",
            "city": "Musselshell County",
            "contactCountryCode": "",
            "contactNumber": "",
            "countryCode": "US",
            "createdAt": "2024-10-23T12:43:11Z",
            "email": "",
            "identificationNumber": "",
            "identificationType": "",
            "merchantId": "922e39ab-7565-49f6-b84f-fb56122821ae",
            "name": "Benef Name",
            "postcode": "65162",
            "state": "Montana",
            "updatedAt": "2024-10-23T12:45:42Z",
            "uuid": "7243ea6a-04b4-4eb4-a488-2bfd83cc3d70"
        },
        {
            "accountNumber": "22342346545133",
            "accountType": "Individual",
            "address": "Jalan Letkol Slamet Wardoyo 214 Labruk Lor Lumajang",
            "bankCode": "545343545345354",
            "bankName": "Bank of America",
            "city": "Washington County",
            "contactCountryCode": "",
            "contactNumber": "",
            "countryCode": "US",
            "createdAt": "2024-10-17T03:21:28Z",
            "email": "",
            "identificationNumber": "",
            "identificationType": "",
            "merchantId": "922e39ab-7565-49f6-b84f-fb56122821ae",
            "name": "Rudi Susilo",
            "postcode": "67312",
            "state": "Alabama",
            "updatedAt": "2024-10-17T03:21:28Z",
            "uuid": "2969390f-725d-4fe4-90b9-76995ecf900d"
        },
        {
            "accountNumber": "612312312312",
            "accountType": "Company",
            "address": "JL Tepok",
            "bankCode": "4431",
            "bankName": "BANK INDO",
            "city": "Scobey",
            "contactCountryCode": "",
            "contactNumber": "",
            "countryCode": "US",
            "createdAt": "2024-09-25T07:34:07Z",
            "email": "",
            "identificationNumber": "",
            "identificationType": "",
            "merchantId": "922e39ab-7565-49f6-b84f-fb56122821ae",
            "name": "Benef Name",
            "postcode": "65162",
            "state": "Montana",
            "updatedAt": "2024-09-25T07:34:07Z",
            "uuid": "ad43a379-dcb3-4aa3-9f2c-e7a180a9abed"
        },
        {
            "accountNumber": "92342346545151",
            "accountType": "Individual",
            "address": "Jalan Letkol Slamet Wardoyo 214 Labruk Lor Lumajang",
            "bankCode": "545343545345356",
            "bankName": "Bank of America",
            "city": "New York",
            "contactCountryCode": "",
            "contactNumber": "",
            "countryCode": "US",
            "createdAt": "2024-09-13T07:14:36Z",
            "email": "",
            "identificationNumber": "",
            "identificationType": "",
            "merchantId": "922e39ab-7565-49f6-b84f-fb56122821ae",
            "name": "Jumarin Lur",
            "postcode": "67312",
            "state": "New York",
            "updatedAt": "2024-09-13T07:14:36Z",
            "uuid": "1549efed-c078-4e3e-ad6a-1d6ee971f6da"
        },
        {
            "accountNumber": "1234567",
            "accountType": "Individual",
            "address": "Jl Street",
            "bankCode": "123",
            "bankName": "Bank Name",
            "city": "Austin",
            "contactCountryCode": "+1",
            "contactNumber": "123134123",
            "countryCode": "US",
            "createdAt": "2024-09-13T07:07:35Z",
            "email": "Halo@email.com",
            "identificationNumber": "",
            "identificationType": "",
            "merchantId": "922e39ab-7565-49f6-b84f-fb56122821ae",
            "name": "James Chandra",
            "postcode": "12345",
            "state": "Texas",
            "updatedAt": "2024-11-06T11:24:52Z",
            "uuid": "58721a0b-c040-4083-b105-1dc5c14d6539"
        },
        {
            "accountNumber": "82342346545151",
            "accountType": "Individual",
            "address": "Jalan Letkol Slamet Wardoyo 214 Labruk Lor Lumajang",
            "bankCode": "545343545345356",
            "bankName": "Bank of America",
            "city": "Thorsby",
            "contactCountryCode": "",
            "contactNumber": "",
            "countryCode": "US",
            "createdAt": "2024-09-13T07:04:51Z",
            "email": "",
            "identificationNumber": "",
            "identificationType": "",
            "merchantId": "922e39ab-7565-49f6-b84f-fb56122821ae",
            "name": "Muhammad Ariyanto",
            "postcode": "67312",
            "state": "Alabama",
            "updatedAt": "2024-10-18T10:24:08Z",
            "uuid": "ab092904-a4ce-418e-8d81-28564369ca3b"
        },
        {
            "accountNumber": "62342346545150",
            "accountType": "Individual",
            "address": "America St.",
            "bankCode": "545343545345355",
            "bankName": "Bank of America",
            "city": "New York",
            "contactCountryCode": "",
            "contactNumber": "",
            "countryCode": "US",
            "createdAt": "2024-09-11T06:44:16Z",
            "email": "",
            "identificationNumber": "350810001001001",
            "identificationType": "Registration ID",
            "merchantId": "922e39ab-7565-49f6-b84f-fb56122821ae",
            "name": "Jumari",
            "postcode": "12345",
            "state": "New York",
            "updatedAt": "2024-09-11T06:44:16Z",
            "uuid": "89abf5c7-9682-491b-959b-18681637e4e8"
        },
        {
            "accountNumber": "12342346545128",
            "accountType": "Individual",
            "address": "New York City, USA",
            "bankCode": "545343545345354",
            "bankName": "Bank of America",
            "city": "New York",
            "contactCountryCode": "",
            "contactNumber": "",
            "countryCode": "US",
            "createdAt": "2024-09-04T04:20:23Z",
            "email": "",
            "identificationNumber": "12345678-X",
            "identificationType": "Company Organization Code",
            "merchantId": "922e39ab-7565-49f6-b84f-fb56122821ae",
            "name": "Mark Jobs",
            "postcode": "10005",
            "state": "New York",
            "updatedAt": "2024-09-04T04:20:23Z",
            "uuid": "eed31009-9cbe-4123-8e42-72549c4ca967"
        }
    ],
    "pagination": {
        "page": 1,
        "perPage": 50,
        "totalItems": 9,
        "totalPages": 1,
        "fetchAll": false
    }
}
```


# Update Beneficiary

## Method and URL

<mark style="color:green;">`PUT`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/xb/beneficiary/:id

## Response

**Response Body**

```json
{
    "code": "00",
    "message": "Success",
    "data": {
        "uuid": "75bc3516-88b0-49b3-9e80-bcbd3f74b80d",
        "name": "Merci Beacou",
        "accountType": "Individual",
        "address": "Jl Singapore",
        "city": "Singapore",
        "postcode": "12345",
        "state": "Central Singapore",
        "countryCode": "SG",
        "identificationType": "Passport",
        "identificationNumber": "X123456",
        "accountNumber": "981237293",
        "bankName": "Bank Name",
        "bankCode": "789127",
        "contactCountryCode": "",
        "contactNumber": "",
        "email": "",
        "createdAt": "2024-11-04T05:52:01Z",
        "updatedAt": "2024-11-04T06:27:01.171990049Z"
    }
}
```


# Deactivate Beneficiary

## Method and URL

<mark style="color:green;">`PATCH`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/xb/beneficiary/:id

## Response

**Response Body**

```json
{
    "code": "00",
    "message": "Success",
    "data": {
        "uuid": "75bc3516-88b0-49b3-9e80-bcbd3f74b80d",
        "name": "Merci Beacou",
        "accountType": "Individual",
        "address": "Jl Singapore",
        "city": "Singapore",
        "postcode": "12345",
        "state": "Central Singapore",
        "countryCode": "SG",
        "identificationType": "Passport",
        "identificationNumber": "X123456",
        "accountNumber": "981237293",
        "bankName": "Bank Name",
        "bankCode": "789127",
        "contactCountryCode": "",
        "contactNumber": "",
        "email": "",
        "createdAt": "2024-11-04T05:52:01Z",
        "updatedAt": "2024-11-06T02:23:55.328629103Z",
        "deactivatedAt": "2024-11-06T02:23:55.328629103Z"
    }
}

```

# Transaction


# Create Transaction


# Create Payout Session

## Method and URL

<mark style="color:green;">`POST`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/xb/payouts

## **Request Params**

**Request body**

```json
{
    "referenceId": "{{randomRequestId}}",
    "sourceCurrency": "IDR",
    "destinationCurrency": "USD",
    "destinationAmount": "0.01", // Destination Amount
    "beneficiaryId": "62b39dd6-85dc-4c33-b9d9-edc992251bf3", 
    "senderId": "ab2bee5f-770d-4fd8-9788-b9a0c5cf3fdf",
    "remark": "Test normal flow", // Description
    "purposeCode": "IR001", // Purpose Code
    "routingValue": "USBKUS44IMT"
}
```

## Response

**Response Body**

```json
{
    "code": "00",
    "message": "Success",
    "data": {
        "uuid": "019232ab-5af7-7bd5-9de2-05ae615b3ed6",
        "merchantId": "922e39ab-7565-49f6-b84f-fb56122821ae",
        "referenceId": "12344321",
        "sourceCurrency": "IDR",
        "destinationCurrency": "USD",
        "destinationAmount": "100",
        "fxRate": "0.000066142872",
        "destinationFxRate": "15118.7871007476058796",
        "fee": "0",
        "totalAmount": "1511878.7100747605879587",
        “remark”: “sample”,
        "createdAt": "2024-09-27T08:49:03Z",
        "expiredAt": "2024-09-27T09:04:03Z",
        "status": "WAITING",
        "beneficiaryData": {
            "name": "Zulkifli",
            "address": "Jl Sweethome",
            "city": "Chickasaw",
            "postcode": "123124",
            "state": "Alabama",
            "country": "US",
            "accountNumber": "612312312312",
            "bankName": "Bank of America",
            "bankCode": "4431",
            "transferMethod": "SWIFT",
            "transferMethodCode": "CMFGUS33"
        },
        "senderData": {
            "name": "Reyga Virgiawan",
            "country": "ID",
            "state": "Lampung",
            "city": "Bandar Lampung",
            "address": "Jl Jalan Aja",
            "postcode": "35144",
            "accountType": "Individual",
            "identificationType": "Kartu Tanda Penduduk",
            "identificationNumber": "123456789"
        }
    “routingCode”: “xxx”,
    “routingValue”: “xxx”
    }
}
```


# Upload Document

## Method and URL

<mark style="color:green;">`POST`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/xb/payouts/:id/upload

### **Request Params**

| Key  | Value                      |
| ---- | -------------------------- |
| uuid | {{XB\_PAYOUT\_LAST\_UUID}} |

### **Request Body**

| Key      | Value                             |
| -------- | --------------------------------- |
| document | {{file}} → must be .zip, max 20MB |

<br>

### **Response Body**

```json
{
    “documentReference”: “xx”
}
```

<br>


# Confirm Payout Session

## Method and URL

<mark style="color:green;">`POST`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/xb/payouts/:id/confirm

## Response

**Response Body**

```json
{
    "code": "00",
    "message": "Success",
    "data": {
        "uuid": "019232ab-5af7-7bd5-9de2-05ae615b3ed6",
        "merchantId": "922e39ab-7565-49f6-b84f-fb56122821ae",
        "referenceId": "12344321",
        "sourceCurrency": "IDR",
        "destinationCurrency": "USD",
        "destinationAmount": "100",
        "fxRate": "0.00006614",
        "destinationFxRate": "15119.4436044753553069",
        "fee": "0",
        "totalAmount": "1511878.71007476",
        "createdAt": "2024-09-27T08:49:04Z",
        "status": "PENDING",
        "beneficiaryData": {
            "name": "Zulkifli",
            "address": "Jl Sweethome",
            "city": "Chickasaw",
            "postcode": "123124",
            "state": "Alabama",
            "country": "US",
            "accountNumber": "612312312312",
            "bankName": "Bank of America",
            "bankCode": "4431",
            "transferMethod": "SWIFT",
            "transferMethodCode": "CMFGUS33"
        },
        "senderData": {
            "name": "Reyga Virgiawan",
            "country": "ID",
            "state": "Lampung",
            "city": "Bandar Lampung",
            "address": "Jl Jalan Aja",
            "postcode": "35144",
            "accountType": "Individual",
            "identificationType": "Kartu Tanda Penduduk",
            "identificationNumber": "123456789"
        }
    }
}

```


# Payout Notification

## Method and URL

<mark style="color:green;">`POST`</mark> \[<mark style="color:orange;">Merchant Callback URL</mark>]

## Request

**Request Body**

```json
{
   "event":"INTERNATIONAL_PAYOUT.SUCCESS",
   "data":{
      "beneficiaryData":{
         "accountNumber":"92342346545151",
         "address":"Jalan Letkol Slamet Wardoyo 214 Labruk Lor Lumajang",
         "bankCode":"545343545345356",
         "bankName":"Bank of America",
         "city":"New York",
         "country":"US",
         "name":"Jumarin Lur",
         "postcode":"67312",
         "state":"New York"
      },
      "beneficiaryId":"1549efed-c078-4e3e-ad6a-1d6ee971f6da",
      "createdAt":"2024-09-13T07:14:36Z",
      "destinationAmount":"200",
      "destinationCurrency":"USD",
      "destinationFxRate":"15393.6317899924398796",
      "expiredAt":"2024-09-13T07:29:36Z",
      "fee":"0",
      "fxRate":"0.000064961928",
      "merchantId":"922e39ab-7565-49f6-b84f-fb56122821ae",
      "purposeCode":"IR001",
      "referenceId":"XB1726211675",
      "remark":"Review",
      "senderData":{
         "accountType":"Individual",
         "address":"Jalan Letkol Slamet Wardoyo 214 Labruk Lor Lumajang",
         "city":"Malang",
         "country":"ID",
         "identificationNumber":"12345665556",
         "identificationType":"Registration ID",
         "name":"Jon Do",
         "postcode":"67312",
         "state":"Malang"
      },
      "sourceAmount":"3078726.36",
      "sourceCurrency":"IDR",
      "status":"SUCCESS",
      "statusDescription":"Payout success and has been received by beneficiary",
      "totalAmount":"3078726.36",
      "updatedAt":"2024-09-13T07:16:53Z",
      "uuid":"0191ea3b-d6a8-7a1a-bbed-e24dd0073871"
   }
}

```

### IF require RFI

```json
{
  "event": "INTERNATIONAL_PAYOUT.DOCUMENT_REQUESTED",
  "data": {
    "uuid": "01956f44-b20a-793f-839c-07f9dea5ceb9",
    "merchantId": "93cc50b8-f8e6-4771-a808-bf397c0be568",
    "referenceId": "QA202503071322",
    "sourceCurrency": "IDR",
    "destinationCurrency": "USD",
    "destinationAmount": "5",
    "fxRate": "0.00006104",
    "destinationFxRate": "16382.6998689384010485",
    "sourceAmount": "81913.5",
    "fee": "0",
    "totalAmount": "81913.5",
    "createdAt": "2025-03-07T06:22:09Z",
    "updatedAt": "2025-03-07T06:28:16Z",
    "expiredAt": "2025-03-07T06:37:09Z",
    "status": "DOCUMENT_REQUESTED",
    "statusDescription": "Further information (RFI) requested by compliance",
    "purposeCode": "IR001",
    "remark": "mock INFO_REQUESTED",
    "senderData": {
      "name": "QA Merchant",
      "countryCode": "",
      "state": "DKI Jakarta",
      "city": "Kota Administrasi Jakarta Pusat",
      "address": "Jl Setiabudi",
      "postcode": "577123",
      "accountType": "Individual",
      "identificationType": "Passport",
      "identificationNumber": "12345678",
      "bankAccountNumber": "888277123",
      "dob": "1990/11/05",
      "contactCountryCode": "+62",
      "contactNumber": "8989784533",
      "sourceOfIncome": "Salary"
    },
    "beneficiaryId": "8048f34b-f972-4a9c-885f-5e46db212263",
    "beneficiaryData": {
      "name": "John Doe",
      "countryCode": "",
      "state": "Central Singapore",
      "city": "Singapore",
      "address": "123 Queens Blvd, Apt 4, Forest Hill",
      "postcode": "12345",
      "accountType": "",
      "accountNumber": "8909090909",
      "bankName": "DBS",
      "bankCode": "123",
      "contactCountryCode": "+81",
      "contactNumber": "123134123",
      "email": "halo@email.com"
    },
    "routingCode": "",
    "routingValue": ""
  }
}
```

Then please get payout to retrieve RFI details

```json
{
  "code": "00",
  "message": "Success",
  "data": {
    "uuid": "01956f44-b20a-793f-839c-07f9dea5ceb9",
    "merchantId": "93cc50b8-f8e6-4771-a808-bf397c0be568",
    "referenceId": "QA202503071322",
    "sourceCurrency": "IDR",
    "destinationCurrency": "USD",
    "destinationAmount": "5",
    "fxRate": "0.00006104",
    "destinationFxRate": "16382.6998689384010485",
    "fee": "0",
    "totalAmount": "81913.49934469",
    "remark": "mock INFO_REQUESTED",
    "createdAt": "2025-03-07T06:22:09Z",
    "beneficiaryData": {
      "name": "John Doe",
      "countryCode": "SG",
      "countryName": "Singapore",
      "state": "Central Singapore",
      "city": "Singapore",
      "address": "123 Queens Blvd, Apt 4, Forest Hill",
      "postcode": "12345",
      "accountType": "Individual",
      "accountNumber": "8909090909",
      "bankName": "DBS",
      "bankCode": "123",
      "contactCountryCode": "+81",
      "contactNumber": "123134123",
      "email": "halo@email.com"
    },
    "senderData": {
      "name": "QA Merchant",
      "countryCode": "ID",
      "countryName": "Indonesia",
      "state": "DKI Jakarta",
      "city": "Kota Administrasi Jakarta Pusat",
      "address": "Jl Setiabudi",
      "postcode": "577123",
      "accountType": "Individual",
      "identificationType": "Passport",
      "identificationNumber": "12345678",
      "bankAccountNumber": "888277123",
      "dob": "1990/11/05",
      "contactCountryCode": "+62",
      "contactNumber": "8989784533",
      "sourceOfIncome": "Salary"
    },
    "status": "DOCUMENT_REQUESTED",
    "statusDescription": "Additional Remitter / Beneficiary information requested for compliance verification",
    "rfiDetails": [
      {
        "documentId": "26ccc822-83d8-44aa-b25e-e2aadc75d81d",
        "actor": "REMITTER",
        "entity": "DRIVING_LICENSE",
        "type": "FILE",
        "comment": "Driving License is Required",
        "status": "received",
        "requestedAt": "2021-08-02T08:24:37Z"
      },
      {
        "documentId": "3548c501-ab53-48d8-816f-9e86d92df3d4",
        "actor": "BENEFICIARY",
        "entity": "DRIVING_LICENSE",
        "type": "FILE",
        "comment": "Driving License is Required",
        "status": "pending",
        "requestedAt": "2021-08-02T08:24:37Z"
      },
      {
        "documentId": "5670d362-2791-4732-807d-a8fcfd0c8edc",
        "actor": "REMITTER",
        "entity": "BANK_STATEMENT",
        "type": "FILE",
        "comment": "Last 6 months bank statement required",
        "status": "pending",
        "requestedAt": "2021-08-02T08:24:37Z"
      },
      {
        "documentId": "67f71def-130d-403a-b5c9-a6049bd06ad0",
        "actor": "BENEFICIARY",
        "entity": "BANK_STATEMENT",
        "type": "FILE",
        "comment": "Last 6 months bank statement required",
        "status": "pending",
        "requestedAt": "2021-08-02T08:24:37Z"
      },
      {
        "documentId": "6956ad94-e231-42c1-90bb-ff8be9bf4faa",
        "actor": "BENEFICIARY",
        "entity": "ADDRESS",
        "type": "TEXT",
        "comment": "Residentional address proof is required ",
        "status": "pending",
        "requestedAt": "2021-08-02T08:24:37Z"
      },
      {
        "documentId": "a227d93b-df69-44fd-9384-dbd181ed2ec1",
        "actor": "BENEFICIARY",
        "entity": "NATIONALITY",
        "type": "TEXT",
        "comment": "Proof of Nationality required",
        "status": "pending",
        "requestedAt": "2021-08-02T08:24:37Z"
      },
      {
        "documentId": "a792deab-70e9-47d2-bb88-4e7072ea21b6",
        "actor": "REMITTER",
        "entity": "FULL_NAME",
        "type": "TEXT",
        "comment": "Full name Required",
        "status": "received",
        "requestedAt": "2021-08-02T08:24:37Z"
      },
      {
        "documentId": "b2b80515-0771-4d06-9f22-6c4e2ece85c0",
        "actor": "BENEFICIARY",
        "entity": "DATE_OF_BIRTH",
        "type": "DATE",
        "comment": "Date of Birth Required",
        "status": "received",
        "requestedAt": "2021-08-02T08:24:37Z"
      },
      {
        "documentId": "bde62506-ae7b-4569-bed4-1155f37009f3",
        "actor": "BENEFICIARY",
        "entity": "FULL_NAME",
        "type": "TEXT",
        "comment": "Full name Required",
        "status": "pending",
        "requestedAt": "2021-08-02T08:24:37Z"
      },
      {
        "documentId": "da005e25-ad0c-408a-bdde-e8a1464ac7df",
        "actor": "REMITTER",
        "entity": "DATE_OF_BIRTH",
        "type": "DATE",
        "comment": "Date of Birth Required",
        "status": "received",
        "requestedAt": "2021-08-02T08:24:37Z"
      }
    ],
    "routingCode": "SWIFT",
    "routingValue": "MFBBMYKLXXX"
  }
}

```

<br>


# Get Payout List

## Method and URL

<mark style="color:green;">`GET`</mark> \[<mark style="color:orange;">BASE URL</mark>]/xb/payouts/list

## Response

**Response Body**

```json
{
    "code": "00",
    "message": "Success",
    "data": [
        {
            "uuid": "0193490f-6fc8-7abe-bf6f-398c85b8f64e",
            "merchantId": "922e39ab-7565-49f6-b84f-fb56122821ae",
            "referenceId": "000000001732097568619",
            "sourceCurrency": "IDR",
            "destinationCurrency": "USD",
            "destinationAmount": "0.01",
            "fxRate": "0.00006278",
            "destinationFxRate": "15928.6396941701178719",
            "fee": "0",
            "totalAmount": "0.01",
            "remark": "Test normal flow",
            "createdAt": "2024-11-20T10:12:50Z",
            "beneficiaryData": {
                "name": "Yve Sven",
                "country": "US",
                "state": "New York",
                "city": "New York City",
                "address": "Jl Amerika",
                "postcode": "12345",
                "accountType": "Individual",
                "accountNumber": "35628343",
                "bankName": "Bank of America",
                "bankCode": "",
                "contactCountryCode": "",
                "contactNumber": "",
                "email": ""
            },
            "senderData": {
                "name": "Sender Name",
                "country": "ID",
                "state": "Virgin",
                "city": "Malang",
                "address": "JL Tepok",
                "postcode": "65162",
                "accountType": "Company",
                "identificationType": "Registration ID",
                "identificationNumber": "123456",
                "bankAccountNumber": "",
                "dob": "",
                "contactCountryCode": "",
                "contactNumber": "",
                "sourceOfIncome": ""
            },
            "status": "WAITING_FOR_CONFIRMATION",
            "statusDescription": "Waiting for merchant to confirm payout",
            "routingCode": "LOCAL",
            "routingValue": "xxx"
        },
        {
            "uuid": "01934859-b47e-7546-887e-47e154aa06b7",
            "merchantId": "922e39ab-7565-49f6-b84f-fb56122821ae",
            "referenceId": "0e23a23d-3deb-482a-b4e7-f212a788f6be",
            "sourceCurrency": "IDR",
            "destinationCurrency": "USD",
            "destinationAmount": "0.01",
            "fxRate": "0.00006278",
            "destinationFxRate": "15928.6396941701178719",
            "fee": "0",
            "totalAmount": "0.01",
            "remark": "Test normal flow",
            "createdAt": "2024-11-20T06:54:19Z",
            "beneficiaryData": {
                "name": "Merci Beacou Supa",
                "country": "US",
                "state": "New York",
                "city": "New York City",
                "address": "Jl Amerika",
                "postcode": "12345",
                "accountType": "Individual",
                "accountNumber": "35628342",
                "bankName": "Bank of America",
                "bankCode": "",
                "contactCountryCode": "",
                "contactNumber": "",
                "email": ""
            },
            "senderData": {
                "name": "Test Fund",
                "country": "ID",
                "state": "Jawa Barat",
                "city": "Bogor",
                "address": "Jl Street",
                "postcode": "12345",
                "accountType": "Individual",
                "identificationType": "Kartu Tanda Penduduk",
                "identificationNumber": "11122233544566",
                "bankAccountNumber": "123424234",
                "dob": "1990-12-01",
                "contactCountryCode": "",
                "contactNumber": "919391234",
                "sourceOfIncome": "Salary"
            },
            "status": "WAITING_FOR_CONFIRMATION",
            "statusDescription": "Waiting for merchant to confirm payout",
            "routingCode": "LOCAL",
            "routingValue": "SWIFT_CODE_123"
        }
    ],
    "pagination": {
        "page": 1,
        "perPage": 2,
        "totalItems": 5,
        "totalPages": 3
    }
}

```


# Get Payout Detail

## Method and URL

<mark style="color:green;">`GET`</mark> \[<mark style="color:orange;">BASE URL</mark>]/xb/payouts/:id

## Response

**Response Body**

```json
{
    "code": "00",
    "message": "Success",
    "data": {
        "uuid": "019232ab-5af7-7bd5-9de2-05ae615b3ed6",
        "merchantId": "922e39ab-7565-49f6-b84f-fb56122821ae",
        "referenceId": "12344321",
        "sourceCurrency": "IDR",
        "destinationCurrency": "USD",
        "destinationAmount": "100",
        "fxRate": "0.00006614",
        "destinationFxRate": "15119.4436044753553069",
        "fee": "0",
        "totalAmount": "1511878.71007476",
        "createdAt": "2024-09-27T08:49:04Z",
        "beneficiaryData": {
            "name": "Zulkifli",
            "address": "Jl Sweethome",
            "city": "Chickasaw",
            "postcode": "123124",
            "state": "Alabama",
            "country": "US",
            "accountNumber": "612312312312",
            "bankName": "Bank of America",
            "bankCode": "4431",
            "transferMethod": "SWIFT",
            "transferMethodCode": "CMFGUS33"
        },
        "senderData": {
            "name": "Reyga Virgiawan",
            "country": "ID",
            "state": "Lampung",
            "city": "Bandar Lampung",
            "address": "Jl Jalan Aja",
            "postcode": "35144",
            "accountType": "Individual",
            "identificationType": "Kartu Tanda Penduduk",
            "identificationNumber": "123456789"
        },
        "status": "AWAITING_FUNDS",
        "statusDescription": "Insufficient Funds"
    }
}
```


# Upload RFI

## Method and URL

<mark style="color:green;">`POST`</mark> \[<mark style="color:orange;">BASE URL</mark>]/xb/payouts/rfi/:id

## Request Params

| Key  | Value               |
| ---- | ------------------- |
| uuid | {{PayoutSessionId}} |

## Request Body

| Key        | Value                                           |
| ---------- | ----------------------------------------------- |
| documentId | {{documentID}} → from payout detail             |
| comment    | <p><br></p>                                     |
| value      | {{text}} → for RFI entities of text/date format |
| document   | {{file}} → must be .zip                         |

## Response

**Response Body**

```json
{
    "code": "00",
    "message": "Success",
    "data": {
        "uuid": "0193012f-8b1e-74da-a764-b26f80bd8d02",
        "merchantId": "922e39ab-7565-49f6-b84f-fb56122821ae",
        "referenceId": "1730891713215",
        "documentId": "df20425c-f94f-4b8a-9f97-1d561ec235a2",
        "actor": "BENEFICIARY",
        "entity": "BANK_STATEMENT",
        "type": "FILE",
        "url": "https://storage.googleapis.com/staging-xb-core-processor/rfi-docs/66de486c6bfe65462cea3485/66de51234e68cfb436774c5f-bank_statement.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=kubernetes-secretmanager%40paper-pg-dev.iam.gserviceaccount.com%2F20241106%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20241106T112126Z&X-Goog-Expires=604799&X-Goog-Signature=7eb2f4a6a9a509d789ff29246f17ccc030142dd5cbc17146516c3309bf11ec81e22703864dd0aa6e6c3b64bc686739765f2d4a9b6e3504f38d71ebdcb6828f88f51f8f5952d66e108c9ec465403bf6e3d96feb479fc6ad36d3f1aa7ebc539ab5afa96330f1d825c57515cb1a934d21474f40646e44d37c88c74963f02d9fb48983a8b72f8856ffb22660e5cdb031778754903a02f74d3211862c94a14876022ad8ae2624735c78075374f9c877866f8316bb3ba1037a0d27a71df8a042aa5e71d827103d36e8f56d669cc0cf31aa6106f2da922febf8abc50e95e6cebc903beee368e97897000dc4c06a869afcc69c34866da29b4811480d430fbc4a40bfa544&X-Goog-SignedHeaders=host",
        "status": "received",
        "requestedAt": "2024-09-09T01:36:36Z"
    }
}

```


# Retrieve Master Data

### Get List of Account Types

`GET` \[BASE\_URL]/xb/master/account-type/list

**Response Body**

```json
{
    "code": "00",
    "message": "Success",
    "data": [
        {
            "accountType": "Individual",
            "createdAt": "2024-09-11T16:01:56Z",
            "updatedAt": "2024-09-11T16:01:56Z",
            "uuid": "73318bd1-f1a1-41ee-ad14-877c25c01ace"
        },
        {
            "accountType": "Company",
            "createdAt": "2024-09-11T16:01:56Z",
            "updatedAt": "2024-09-11T16:01:56Z",
            "uuid": "aa210983-c7d1-48b8-b6a0-be82897ca00e"
        }
    ],
    "pagination": {
        "page": 1,
        "perPage": 10,
        "totalItems": 2,
        "totalPages": 1,
        "fetchAll": false
    }
}
```

### Get List of Identification Types

`GET` \[BASE\_URL]/xb/master/identification-type/list

**Response Body**

```json
{
    "code": "00",
    "message": "Success",
    "data": [
        {
            "accountType": "Individual",
            "createdAt": "2024-09-25T03:09:03Z",
            "identificationType": "Passport",
            "updatedAt": "2024-09-25T04:28:30Z",
            "uuid": "3103da22-eeba-4877-ab8a-bbbc49091571"
        },
        {
            "accountType": "Individual",
            "createdAt": "2024-09-25T03:09:03Z",
            "identificationType": "Kartu Tanda Penduduk",
            "updatedAt": "2024-09-25T04:28:30Z",
            "uuid": "3d94f0c8-54ca-4937-89c5-040f3152352a"
        },
        {
            "accountType": "Company",
            "createdAt": "2024-09-10T19:51:10Z",
            "identificationType": "Business Registration Number",
            "updatedAt": "2024-09-25T04:28:19Z",
            "uuid": "0ea31c52-baa1-452b-8ed0-59018150cccb"
        },
        {
            "accountType": "Company",
            "createdAt": "2024-09-10T19:51:10Z",
            "identificationType": "ACRA",
            "updatedAt": "2024-09-25T04:28:19Z",
            "uuid": "22300004-4073-479b-8939-f303a2f07ba3"
        },
        {
            "accountType": "Company",
            "createdAt": "2024-09-10T19:51:10Z",
            "identificationType": "Company Registration No",
            "updatedAt": "2024-09-25T04:28:19Z",
            "uuid": "47058afc-e0b3-4861-807c-db4fda78b632"
        },
        {
            "accountType": "Company",
            "createdAt": "2024-09-10T19:51:10Z",
            "identificationType": "Registration Number",
            "updatedAt": "2024-09-25T04:28:19Z",
            "uuid": "4a45cb28-3a62-4cc5-8707-7cd3f8276099"
        },
        {
            "accountType": "Company",
            "createdAt": "2024-09-10T19:51:10Z",
            "identificationType": "ABN",
            "updatedAt": "2024-09-25T04:28:19Z",
            "uuid": "d4cb1781-b952-499b-835e-16c4c923b2a2"
        },
        {
            "accountType": "Company",
            "createdAt": "2024-09-10T19:51:10Z",
            "identificationType": "ACN",
            "updatedAt": "2024-09-25T04:28:19Z",
            "uuid": "d60591fc-ddda-4486-83a3-38fee485c0d7"
        },
        {
            "accountType": "Company",
            "createdAt": "2024-09-10T19:51:10Z",
            "identificationType": "ARBN",
            "updatedAt": "2024-09-25T04:28:19Z",
            "uuid": "db5b943e-6c8a-4f6c-8c2d-a639381b10a9"
        },
        {
            "accountType": "Company",
            "createdAt": "2024-09-10T19:51:10Z",
            "identificationType": "Travel agent License number",
            "updatedAt": "2024-09-25T04:28:19Z",
            "uuid": "df81ed23-de6c-40a4-8a5e-ce399820f4d5"
        }
    ],
    "pagination": {
        "page": 1,
        "perPage": 10,
        "totalItems": 12,
        "totalPages": 2,
        "fetchAll": false
    }
}
```

### Get List of Currencies

`GET` \[BASE\_URL]/xb/master/currency/list

**Request Params**

| Key         | Value                                  |
| ----------- | -------------------------------------- |
| countryCode | {{countryCode}} → to filter by country |

<br>

**Response Body**

```json
{
    "code": "00",
    "message": "Success",
    "data": [
        {
            "code": "IDR",
            "countryCode": "ID",
            "countryUuid": "62663647-ee95-42b0-991d-1b72d4201261",
            "createdAt": "2024-09-24T08:40:23Z",
            "isActive": true,
            "name": "Indonesia Rupiah",
            "updatedAt": "2024-09-24T08:41:10Z",
            "uuid": "a038631e-0926-4f2c-891b-f28df4cf83d1"
        },
        {
            "code": "SGD",
            "countryCode": "SG",
            "countryUuid": "24b9265a-3318-4a70-9a3b-7220d36b2586",
            "createdAt": "2024-09-10T06:28:55Z",
            "isActive": true,
            "name": "Singapore Dollar",
            "updatedAt": "2024-09-10T07:22:58Z",
            "uuid": "069eb898-6555-4fe3-a41e-ab495cc0d6e9"
        },
        {
            "code": "CAD",
            "countryCode": "CA",
            "countryUuid": "1c9283ea-12b8-4124-b095-51f8d031ef28",
            "createdAt": "2024-09-10T06:28:55Z",
            "isActive": true,
            "name": "Canadian Dollar",
            "updatedAt": "2024-09-10T07:22:58Z",
            "uuid": "2ae4089f-1f75-4daa-ab6e-e800d0243ef0"
        },
        {
            "code": "GBP",
            "countryCode": "GB",
            "countryUuid": "ffb385cc-6e0a-4a9c-ac9a-46dba7316c13",
            "createdAt": "2024-09-10T06:28:55Z",
            "isActive": true,
            "name": "British Pound",
            "updatedAt": "2024-09-10T07:22:58Z",
            "uuid": "331a7f74-517a-4db3-8def-dd3c94c6f5ec"
        },
        {
            "code": "THB",
            "countryCode": "TH",
            "countryUuid": "62258ed0-6301-4e49-ab0c-5b7f57278139",
            "createdAt": "2024-09-10T06:28:55Z",
            "isActive": true,
            "name": "Thai Baht",
            "updatedAt": "2024-09-10T07:22:58Z",
            "uuid": "376bb186-8ce6-4c4b-90ff-df24275ad7e7"
        },
        {
            "code": "CHF",
            "countryCode": "CH",
            "countryUuid": "ba041c4a-e50a-49a5-b382-0ecb0241af3c",
            "createdAt": "2024-09-10T06:28:55Z",
            "isActive": true,
            "name": "Swiss Franc",
            "updatedAt": "2024-09-10T07:22:58Z",
            "uuid": "65b56af6-0b31-47e3-9212-a50f4b80a3c9"
        },
        {
            "code": "CNY",
            "countryCode": "CN",
            "countryUuid": "432dddfb-55eb-409b-86ef-e0ceb590f31f",
            "createdAt": "2024-09-10T06:28:55Z",
            "isActive": true,
            "name": "Chinese Yuan",
            "updatedAt": "2024-09-10T07:22:58Z",
            "uuid": "73f65a9f-a899-4a3f-a463-3820cdbf9205"
        },
        {
            "code": "MYR",
            "countryCode": "MY",
            "countryUuid": "3ff32cfb-42a4-4d95-a858-37712f6252d4",
            "createdAt": "2024-09-10T06:28:55Z",
            "isActive": true,
            "name": "Malaysian Ringgit",
            "updatedAt": "2024-09-10T07:22:58Z",
            "uuid": "a09722fb-f02d-42e3-a465-f6aec5f60dda"
        },
        {
            "code": "AUD",
            "countryCode": "AU",
            "countryUuid": "2e4ee9be-c4c1-4a06-b7f2-1d01cc3bc812",
            "createdAt": "2024-09-10T06:28:55Z",
            "isActive": true,
            "name": "Australian Dollar",
            "updatedAt": "2024-09-10T07:22:58Z",
            "uuid": "b65e2e8f-5789-4a3b-b349-0ff2b968878d"
        },
        {
            "code": "NZD",
            "countryCode": "NZ",
            "countryUuid": "7fd083bf-bafb-4082-ac96-a3a526abf05c",
            "createdAt": "2024-09-10T06:28:55Z",
            "isActive": true,
            "name": "New Zealand Dollar",
            "updatedAt": "2024-09-10T07:22:58Z",
            "uuid": "c8a67a62-2f92-4205-955f-73ab539b700b"
        }
    ],
    "pagination": {
        "page": 1,
        "perPage": 10,
        "totalItems": 14,
        "totalPages": 2,
        "fetchAll": false
    }
}
```

### Get List Currency Map

`GET` \[BASE\_URL]/xb/master/currency/map/list

**Request Params**

| Key         | Value                                  |
| ----------- | -------------------------------------- |
| countryCode | {{countryCode}} → to filter by country |

<br>

**Response Body**

```json
{
    "code": "00",
    "message": "Success",
    "data": [
        {
            "availableCurrencyCode": "SGD",
            "availableCurrencyUuid": "069eb898-6555-4fe3-a41e-ab495cc0d6e9",
            "countryCode": "JP",
            "countryUuid": "04479083-e61b-4760-b2c7-142f327439f7",
            "createdAt": "2024-10-24T05:21:27Z",
            "maximumPaymentAmount": "0",
            "minimumPaymentAmount": "0",
            "transferMethod": "SWIFT",
            "routingCode": "xxx",
            "updatedAt": "2024-10-24T05:21:27Z",
            "uuid": "d22be1f2-a578-4a75-89ea-d5cf6048ff84"
        },
        {
            "availableCurrencyCode": "AUD",
            "availableCurrencyUuid": "b65e2e8f-5789-4a3b-b349-0ff2b968878d",
            "countryCode": "JP",
            "countryUuid": "04479083-e61b-4760-b2c7-142f327439f7",
            "createdAt": "2024-10-24T05:21:27Z",
            "maximumPaymentAmount": "0",
            "minimumPaymentAmount": "0",
            "transferMethod": "SWIFT",
            "updatedAt": "2024-10-24T05:21:27Z",
            "uuid": "f5f835e8-ffcd-4c03-a7a0-6dda8d96516e"
        },
        {
            "availableCurrencyCode": "USD",
            "availableCurrencyUuid": "f82780fb-c7e9-4912-b412-3ac8ba5f8dbd",
            "countryCode": "JP",
            "countryUuid": "04479083-e61b-4760-b2c7-142f327439f7",
            "createdAt": "2024-10-24T05:21:27Z",
            "maximumPaymentAmount": "0",
            "minimumPaymentAmount": "0",
            "transferMethod": "SWIFT",
            "updatedAt": "2024-10-24T05:21:27Z",
            "uuid": "08be6c52-26a6-416d-a20d-b32cdc3e1a64"
        },
        {
            "availableCurrencyCode": "SGD",
            "availableCurrencyUuid": "069eb898-6555-4fe3-a41e-ab495cc0d6e9",
            "countryCode": "KR",
            "countryUuid": "bfa9d489-98c9-4e20-af3b-7500e1ae6356",
            "createdAt": "2024-10-24T05:20:44Z",
            "maximumPaymentAmount": "0",
            "minimumPaymentAmount": "0",
            "transferMethod": "SWIFT",
            "updatedAt": "2024-10-24T05:20:44Z",
            "uuid": "416218b0-62c0-412d-b907-1523a9668338"
        },
        {
            "availableCurrencyCode": "KRW",
            "availableCurrencyUuid": "48528946-e884-40a5-807c-2882ddbc3a70",
            "countryCode": "KR",
            "countryUuid": "bfa9d489-98c9-4e20-af3b-7500e1ae6356",
            "createdAt": "2024-10-24T05:20:44Z",
            "maximumPaymentAmount": "5500000",
            "minimumPaymentAmount": "0",
            "transferMethod": "LOCAL",
            "updatedAt": "2024-10-24T05:20:44Z",
            "uuid": "f4b8e1ee-451b-42c5-abb3-149b6dd7e216"
        },
        {
            "availableCurrencyCode": "AUD",
            "availableCurrencyUuid": "b65e2e8f-5789-4a3b-b349-0ff2b968878d",
            "countryCode": "KR",
            "countryUuid": "bfa9d489-98c9-4e20-af3b-7500e1ae6356",
            "createdAt": "2024-10-24T05:20:44Z",
            "maximumPaymentAmount": "0",
            "minimumPaymentAmount": "0",
            "transferMethod": "SWIFT",
            "updatedAt": "2024-10-24T05:20:44Z",
            "uuid": "ea09e6ba-7e1c-4fe3-a059-ddec2a89313e"
        },
        {
            "availableCurrencyCode": "USD",
            "availableCurrencyUuid": "f82780fb-c7e9-4912-b412-3ac8ba5f8dbd",
            "countryCode": "KR",
            "countryUuid": "bfa9d489-98c9-4e20-af3b-7500e1ae6356",
            "createdAt": "2024-10-24T05:20:44Z",
            "maximumPaymentAmount": "0",
            "minimumPaymentAmount": "0",
            "transferMethod": "SWIFT",
            "updatedAt": "2024-10-24T05:20:44Z",
            "uuid": "f088e3b5-cb2e-41a4-8941-f2a4b176e6ea"
        },
        {
            "availableCurrencyCode": "CNY",
            "availableCurrencyUuid": "73f65a9f-a899-4a3f-a463-3820cdbf9205",
            "countryCode": "CN",
            "countryUuid": "432dddfb-55eb-409b-86ef-e0ceb590f31f",
            "createdAt": "2024-10-16T13:17:26Z",
            "maximumPaymentAmount": "0",
            "minimumPaymentAmount": "0",
            "transferMethod": "LOCAL",
            "updatedAt": "2024-10-16T13:17:26Z",
            "uuid": "27481d8a-4fc2-4686-97fe-2052919925ad"
        },
        {
            "availableCurrencyCode": "SGD",
            "availableCurrencyUuid": "069eb898-6555-4fe3-a41e-ab495cc0d6e9",
            "countryCode": "CN",
            "countryUuid": "432dddfb-55eb-409b-86ef-e0ceb590f31f",
            "createdAt": "2024-09-10T08:09:23Z",
            "maximumPaymentAmount": "0",
            "minimumPaymentAmount": "0",
            "transferMethod": "SWIFT",
            "updatedAt": "2024-10-07T18:33:25Z",
            "uuid": "72cb3c1b-0370-4a02-8361-5fb9c5ac51ff"
        },
        {
            "availableCurrencyCode": "AUD",
            "availableCurrencyUuid": "b65e2e8f-5789-4a3b-b349-0ff2b968878d",
            "countryCode": "CN",
            "countryUuid": "432dddfb-55eb-409b-86ef-e0ceb590f31f",
            "createdAt": "2024-09-10T08:09:23Z",
            "maximumPaymentAmount": "0",
            "minimumPaymentAmount": "0",
            "transferMethod": "SWIFT",
            "updatedAt": "2024-10-07T18:33:25Z",
            "uuid": "c9429277-1cbe-4f67-9d2a-1ddee2e8916b"
        },
        {
            "availableCurrencyCode": "USD",
            "availableCurrencyUuid": "f82780fb-c7e9-4912-b412-3ac8ba5f8dbd",
            "countryCode": "CN",
            "countryUuid": "432dddfb-55eb-409b-86ef-e0ceb590f31f",
            "createdAt": "2024-09-10T08:09:23Z",
            "maximumPaymentAmount": "0",
            "minimumPaymentAmount": "0",
            "transferMethod": "SWIFT",
            "updatedAt": "2024-10-07T18:33:25Z",
            "uuid": "022f2237-dabe-496d-959d-01000b69f1b6"
        },
        {
            "availableCurrencyCode": "SGD",
            "availableCurrencyUuid": "069eb898-6555-4fe3-a41e-ab495cc0d6e9",
            "countryCode": "US",
            "countryUuid": "dc3fbfda-9dc3-4710-90ed-c30dc06d7f4a",
            "createdAt": "2024-09-10T08:08:31Z",
            "maximumPaymentAmount": "0",
            "minimumPaymentAmount": "0",
            "transferMethod": "SWIFT",
            "updatedAt": "2024-10-07T18:33:25Z",
            "uuid": "eb08bba0-4cb5-4f3f-830a-dc5f2c284bf4"
        },
        {
            "availableCurrencyCode": "AUD",
            "availableCurrencyUuid": "b65e2e8f-5789-4a3b-b349-0ff2b968878d",
            "countryCode": "US",
            "countryUuid": "dc3fbfda-9dc3-4710-90ed-c30dc06d7f4a",
            "createdAt": "2024-09-10T08:08:31Z",
            "maximumPaymentAmount": "0",
            "minimumPaymentAmount": "0",
            "transferMethod": "SWIFT",
            "updatedAt": "2024-10-07T18:33:25Z",
            "uuid": "b73aa878-6cef-486f-860c-a76e0da6a8f3"
        },
        {
            "availableCurrencyCode": "SGD",
            "availableCurrencyUuid": "069eb898-6555-4fe3-a41e-ab495cc0d6e9",
            "countryCode": "AU",
            "countryUuid": "2e4ee9be-c4c1-4a06-b7f2-1d01cc3bc812",
            "createdAt": "2024-09-10T08:08:15Z",
            "maximumPaymentAmount": "0",
            "minimumPaymentAmount": "0",
            "transferMethod": "SWIFT",
            "updatedAt": "2024-10-07T18:33:25Z",
            "uuid": "c41d39a4-92d4-4041-8617-d84e0709f4c8"
        },
        {
            "availableCurrencyCode": "USD",
            "availableCurrencyUuid": "f82780fb-c7e9-4912-b412-3ac8ba5f8dbd",
            "countryCode": "AU",
            "countryUuid": "2e4ee9be-c4c1-4a06-b7f2-1d01cc3bc812",
            "createdAt": "2024-09-10T08:08:15Z",
            "maximumPaymentAmount": "0",
            "minimumPaymentAmount": "0",
            "transferMethod": "SWIFT",
            "updatedAt": "2024-10-07T18:33:25Z",
            "uuid": "c7514b97-63ad-4e7e-9e22-875702234125"
        },
        {
            "availableCurrencyCode": "SGD",
            "availableCurrencyUuid": "069eb898-6555-4fe3-a41e-ab495cc0d6e9",
            "countryCode": "MY",
            "countryUuid": "3ff32cfb-42a4-4d95-a858-37712f6252d4",
            "createdAt": "2024-09-10T08:07:46Z",
            "maximumPaymentAmount": "0",
            "minimumPaymentAmount": "0",
            "transferMethod": "SWIFT",
            "updatedAt": "2024-10-07T18:33:25Z",
            "uuid": "2d784a0e-899a-4e42-8474-9a390461bb8d"
        },
        {
            "availableCurrencyCode": "AUD",
            "availableCurrencyUuid": "b65e2e8f-5789-4a3b-b349-0ff2b968878d",
            "countryCode": "MY",
            "countryUuid": "3ff32cfb-42a4-4d95-a858-37712f6252d4",
            "createdAt": "2024-09-10T08:07:46Z",
            "maximumPaymentAmount": "0",
            "minimumPaymentAmount": "0",
            "transferMethod": "SWIFT",
            "updatedAt": "2024-10-07T18:33:25Z",
            "uuid": "09bdde98-a180-4338-8ffa-01a9673ee758"
        },
        {
            "availableCurrencyCode": "USD",
            "availableCurrencyUuid": "f82780fb-c7e9-4912-b412-3ac8ba5f8dbd",
            "countryCode": "MY",
            "countryUuid": "3ff32cfb-42a4-4d95-a858-37712f6252d4",
            "createdAt": "2024-09-10T08:07:46Z",
            "maximumPaymentAmount": "0",
            "minimumPaymentAmount": "0",
            "transferMethod": "SWIFT",
            "updatedAt": "2024-10-07T18:33:25Z",
            "uuid": "3f387591-594c-40e6-8de2-801838360625"
        },
        {
            "availableCurrencyCode": "SGD",
            "availableCurrencyUuid": "069eb898-6555-4fe3-a41e-ab495cc0d6e9",
            "countryCode": "TH",
            "countryUuid": "62258ed0-6301-4e49-ab0c-5b7f57278139",
            "createdAt": "2024-09-10T08:06:17Z",
            "maximumPaymentAmount": "0",
            "minimumPaymentAmount": "0",
            "transferMethod": "SWIFT",
            "updatedAt": "2024-10-07T18:33:25Z",
            "uuid": "58f74c62-de54-4f11-8415-c2ad91eed63c"
        },
        {
            "availableCurrencyCode": "AUD",
            "availableCurrencyUuid": "b65e2e8f-5789-4a3b-b349-0ff2b968878d",
            "countryCode": "TH",
            "countryUuid": "62258ed0-6301-4e49-ab0c-5b7f57278139",
            "createdAt": "2024-09-10T08:06:17Z",
            "maximumPaymentAmount": "0",
            "minimumPaymentAmount": "0",
            "transferMethod": "SWIFT",
            "updatedAt": "2024-10-07T18:33:25Z",
            "uuid": "c6209a98-cefb-40d5-8783-082e4c36bde5"
        },
        {
            "availableCurrencyCode": "USD",
            "availableCurrencyUuid": "f82780fb-c7e9-4912-b412-3ac8ba5f8dbd",
            "countryCode": "TH",
            "countryUuid": "62258ed0-6301-4e49-ab0c-5b7f57278139",
            "createdAt": "2024-09-10T08:06:17Z",
            "maximumPaymentAmount": "0",
            "minimumPaymentAmount": "0",
            "transferMethod": "SWIFT",
            "updatedAt": "2024-10-07T18:33:25Z",
            "uuid": "bdc4ca7d-1094-4a08-83e7-5d5cb4fe30e9"
        },
        {
            "availableCurrencyCode": "AUD",
            "availableCurrencyUuid": "b65e2e8f-5789-4a3b-b349-0ff2b968878d",
            "countryCode": "SG",
            "countryUuid": "24b9265a-3318-4a70-9a3b-7220d36b2586",
            "createdAt": "2024-09-10T08:05:42Z",
            "maximumPaymentAmount": "0",
            "minimumPaymentAmount": "0",
            "transferMethod": "SWIFT",
            "updatedAt": "2024-10-07T18:33:25Z",
            "uuid": "b2498a9d-e274-4ff0-8aeb-b2b88c7e4466"
        },
        {
            "availableCurrencyCode": "USD",
            "availableCurrencyUuid": "f82780fb-c7e9-4912-b412-3ac8ba5f8dbd",
            "countryCode": "SG",
            "countryUuid": "24b9265a-3318-4a70-9a3b-7220d36b2586",
            "createdAt": "2024-09-10T08:05:42Z",
            "maximumPaymentAmount": "0",
            "minimumPaymentAmount": "0",
            "transferMethod": "SWIFT",
            "updatedAt": "2024-10-07T18:33:25Z",
            "uuid": "1e7e896c-c3f4-44be-815f-25ea1347446d"
        },
        {
            "availableCurrencyCode": "SGD",
            "availableCurrencyUuid": "069eb898-6555-4fe3-a41e-ab495cc0d6e9",
            "countryCode": "SG",
            "countryUuid": "24b9265a-3318-4a70-9a3b-7220d36b2586",
            "createdAt": "2024-09-10T07:36:20Z",
            "maximumPaymentAmount": "0",
            "minimumPaymentAmount": "1",
            "transferMethod": "LOCAL",
            "updatedAt": "2024-10-07T18:33:25Z",
            "uuid": "9af52e1c-7f8e-46aa-badc-f0199c308f68"
        },
        {
            "availableCurrencyCode": "THB",
            "availableCurrencyUuid": "376bb186-8ce6-4c4b-90ff-df24275ad7e7",
            "countryCode": "TH",
            "countryUuid": "62258ed0-6301-4e49-ab0c-5b7f57278139",
            "createdAt": "2024-09-10T07:36:20Z",
            "maximumPaymentAmount": "2000000",
            "minimumPaymentAmount": "0",
            "transferMethod": "LOCAL",
            "updatedAt": "2024-10-07T18:33:25Z",
            "uuid": "421451bc-9f98-40c6-b85d-e8984658369b"
        },
        {
            "availableCurrencyCode": "MYR",
            "availableCurrencyUuid": "a09722fb-f02d-42e3-a465-f6aec5f60dda",
            "countryCode": "MY",
            "countryUuid": "3ff32cfb-42a4-4d95-a858-37712f6252d4",
            "createdAt": "2024-09-10T07:36:20Z",
            "maximumPaymentAmount": "0",
            "minimumPaymentAmount": "0",
            "transferMethod": "LOCAL",
            "updatedAt": "2024-10-07T18:33:25Z",
            "uuid": "87525e8d-81de-4362-9712-ec41e80b5fe5"
        },
        {
            "availableCurrencyCode": "AUD",
            "availableCurrencyUuid": "b65e2e8f-5789-4a3b-b349-0ff2b968878d",
            "countryCode": "AU",
            "countryUuid": "2e4ee9be-c4c1-4a06-b7f2-1d01cc3bc812",
            "createdAt": "2024-09-10T07:36:20Z",
            "maximumPaymentAmount": "0",
            "minimumPaymentAmount": "0",
            "transferMethod": "LOCAL",
            "updatedAt": "2024-11-07T03:23:44Z",
            "uuid": "f2ba28ba-3d51-46d2-b2df-447d0529a8b2"
        },
        {
            "availableCurrencyCode": "USD",
            "availableCurrencyUuid": "f82780fb-c7e9-4912-b412-3ac8ba5f8dbd",
            "countryCode": "US",
            "countryUuid": "dc3fbfda-9dc3-4710-90ed-c30dc06d7f4a",
            "createdAt": "2024-09-10T07:36:20Z",
            "maximumPaymentAmount": "1000000",
            "minimumPaymentAmount": "0",
            "transferMethod": "LOCAL",
            "updatedAt": "2024-11-07T03:23:17Z",
            "uuid": "76c66af5-90bd-45db-8ed4-2fc7ec8553f4"
        }
    ],
    "pagination": {
        "page": 1,
        "perPage": 50,
        "totalItems": 28,
        "totalPages": 1,
        "fetchAll": false
    }
}
```

### Get List of Countries

`GET` \[BASE\_URL]/xb/master/country/list

<br>

**Request Params**

| Key        | Value                                       |
| ---------- | ------------------------------------------- |
| activeOnly | {{true}} → to filter by supported countries |

<br>

**Response Body**

```json
{
    "code": "00",
    "message": "Success",
    "data": [
        {
            "code": "ID",
            "createdAt": "2024-09-20T11:25:54Z",
            "isActive": true,
            "name": "Indonesia",
            "updatedAt": "2024-09-20T11:25:54Z",
            "uuid": "62663647-ee95-42b0-991d-1b72d4201261"
        },
        {
            "code": "JP",
            "createdAt": "2024-09-10T06:27:08Z",
            "isActive": true,
            "name": "Japan",
            "updatedAt": "2024-09-10T07:22:57Z",
            "uuid": "04479083-e61b-4760-b2c7-142f327439f7"
        },
        {
            "code": "SG",
            "createdAt": "2024-09-10T06:27:08Z",
            "isActive": true,
            "name": "Singapore",
            "updatedAt": "2024-09-10T07:22:57Z",
            "uuid": "24b9265a-3318-4a70-9a3b-7220d36b2586"
        },
        {
            "code": "AU",
            "createdAt": "2024-09-10T06:27:08Z",
            "isActive": true,
            "name": "Australia",
            "updatedAt": "2024-09-10T07:22:57Z",
            "uuid": "2e4ee9be-c4c1-4a06-b7f2-1d01cc3bc812"
        },
        {
            "code": "MY",
            "createdAt": "2024-09-10T06:27:08Z",
            "isActive": true,
            "name": "Malaysia",
            "updatedAt": "2024-09-10T07:22:57Z",
            "uuid": "3ff32cfb-42a4-4d95-a858-37712f6252d4"
        },
        {
            "code": "CN",
            "createdAt": "2024-09-10T06:27:08Z",
            "isActive": true,
            "name": "China",
            "updatedAt": "2024-09-10T07:22:57Z",
            "uuid": "432dddfb-55eb-409b-86ef-e0ceb590f31f"
        },
        {
            "code": "TH",
            "createdAt": "2024-09-10T06:27:08Z",
            "isActive": true,
            "name": "Thailand",
            "updatedAt": "2024-09-10T07:22:57Z",
            "uuid": "62258ed0-6301-4e49-ab0c-5b7f57278139"
        },
        {
            "code": "US",
            "createdAt": "2024-09-10T06:27:08Z",
            "isActive": true,
            "name": "United States",
            "updatedAt": "2024-09-10T07:22:57Z",
            "uuid": "dc3fbfda-9dc3-4710-90ed-c30dc06d7f4a"
        }
    ],
    "pagination": {
        "page": 1,
        "perPage": 10,
        "totalItems": 8,
        "totalPages": 1,
        "fetchAll": false
    }
}
```

### Get List of States

`GET` \[BASE\_URL]/xb/master/state/list

**Request Params**

| Key         | Value                                  |
| ----------- | -------------------------------------- |
| countryCode | {{countryCode}} → to filter by country |

<br>

**Response Body**

```json
{
    "code": "00",
    "message": "Success",
    "data": [
        {
            "countryCode": "ID",
            "countryUuid": "62663647-ee95-42b0-991d-1b72d4201261",
            "createdAt": "2024-09-20T11:32:51Z",
            "name": "Nusa Tenggara Barat",
            "updatedAt": "2024-09-20T11:32:51Z",
            "uuid": "05b77316-b17a-426c-8295-1de5bb744861"
        },
        {
            "countryCode": "ID",
            "countryUuid": "62663647-ee95-42b0-991d-1b72d4201261",
            "createdAt": "2024-09-20T11:32:51Z",
            "name": "Papua Selatan",
            "updatedAt": "2024-09-20T11:32:51Z",
            "uuid": "0dd453cc-8887-406d-8c80-31cb6e03576d"
        },
        {
            "countryCode": "ID",
            "countryUuid": "62663647-ee95-42b0-991d-1b72d4201261",
            "createdAt": "2024-09-20T11:32:51Z",
            "name": "Papua Pegunungan",
            "updatedAt": "2024-09-20T11:32:51Z",
            "uuid": "11a9348a-fcb2-4b31-8beb-bc5d08c624a0"
        },
        {
            "countryCode": "ID",
            "countryUuid": "62663647-ee95-42b0-991d-1b72d4201261",
            "createdAt": "2024-09-20T11:32:51Z",
            "name": "Bali",
            "updatedAt": "2024-09-20T11:32:51Z",
            "uuid": "12826b31-b122-4df7-954c-aac6a938f344"
        },
        {
            "countryCode": "ID",
            "countryUuid": "62663647-ee95-42b0-991d-1b72d4201261",
            "createdAt": "2024-09-20T11:32:51Z",
            "name": "Sulawesi Tengah",
            "updatedAt": "2024-09-20T11:32:51Z",
            "uuid": "19a7368c-efbd-4464-af21-3e9083179091"
        },
        {
            "countryCode": "ID",
            "countryUuid": "62663647-ee95-42b0-991d-1b72d4201261",
            "createdAt": "2024-09-20T11:32:51Z",
            "name": "Sumatera Barat",
            "updatedAt": "2024-09-20T11:32:51Z",
            "uuid": "1cb270c0-784a-445e-83b0-839a87783284"
        },
        {
            "countryCode": "ID",
            "countryUuid": "62663647-ee95-42b0-991d-1b72d4201261",
            "createdAt": "2024-09-20T11:32:51Z",
            "name": "Jawa Tengah",
            "updatedAt": "2024-09-20T11:32:51Z",
            "uuid": "1eefc21d-ff7e-4cad-89b4-8ff6cf6a4540"
        },
        {
            "countryCode": "ID",
            "countryUuid": "62663647-ee95-42b0-991d-1b72d4201261",
            "createdAt": "2024-09-20T11:32:51Z",
            "name": "DI Yogyakarta",
            "updatedAt": "2024-09-20T11:32:51Z",
            "uuid": "247e3afd-3bf5-44ab-aeba-c8e622bb52d6"
        },
        {
            "countryCode": "ID",
            "countryUuid": "62663647-ee95-42b0-991d-1b72d4201261",
            "createdAt": "2024-09-20T11:32:51Z",
            "name": "Sulawesi Utara",
            "updatedAt": "2024-09-20T11:32:51Z",
            "uuid": "3f943bbd-f4ce-4498-8e40-5569b689c10e"
        },
        {
            "countryCode": "ID",
            "countryUuid": "62663647-ee95-42b0-991d-1b72d4201261",
            "createdAt": "2024-09-20T11:32:51Z",
            "name": "Maluku",
            "updatedAt": "2024-09-20T11:32:51Z",
            "uuid": "413b42b1-3af9-47a1-842b-4ee1d7c98b0d"
        }
    ],
    "pagination": {
        "page": 1,
        "perPage": 10,
        "totalItems": 38,
        "totalPages": 4,
        "fetchAll": false
    }
}
```

### Get List of Cities

`GET` \[BASE\_URL]/xb/master/city/list

**Request Params**

| Key       | Value                              |
| --------- | ---------------------------------- |
| stateUuid | {{stateUuid}} → to filter by state |

<br>

**Response Body**

```json
{
    "code": "00",
    "message": "Success",
    "data": [
        {
            "createdAt": "2024-09-20T11:32:52Z",
            "name": "Kota Payakumbuh",
            "stateUuid": "1cb270c0-784a-445e-83b0-839a87783284",
            "updatedAt": "2024-09-20T11:32:52Z",
            "uuid": "00364f3a-9953-43cf-a6b5-523cd3cc5a00"
        },
        {
            "createdAt": "2024-09-20T11:32:52Z",
            "name": "Sijunjung",
            "stateUuid": "1cb270c0-784a-445e-83b0-839a87783284",
            "updatedAt": "2024-09-20T11:32:52Z",
            "uuid": "0df30f10-5fce-4253-912e-4bc995ac3283"
        },
        {
            "createdAt": "2024-09-20T11:32:52Z",
            "name": "Kabupaten Kepulauan Mentawai",
            "stateUuid": "1cb270c0-784a-445e-83b0-839a87783284",
            "updatedAt": "2024-09-20T11:32:52Z",
            "uuid": "14a9c31f-e61e-4115-8ed2-4548d152f6e8"
        },
        {
            "createdAt": "2024-09-20T11:32:52Z",
            "name": "Kota Padang Panjang",
            "stateUuid": "1cb270c0-784a-445e-83b0-839a87783284",
            "updatedAt": "2024-09-20T11:32:52Z",
            "uuid": "31065511-06f1-4da8-8385-cdb003483624"
        },
        {
            "createdAt": "2024-09-20T11:32:52Z",
            "name": "Padang",
            "stateUuid": "1cb270c0-784a-445e-83b0-839a87783284",
            "updatedAt": "2024-09-20T11:32:52Z",
            "uuid": "33f4667d-1433-4d7a-adce-7c42a918f11a"
        },
        {
            "createdAt": "2024-09-20T11:32:52Z",
            "name": "Kabupaten Pasaman Barat",
            "stateUuid": "1cb270c0-784a-445e-83b0-839a87783284",
            "updatedAt": "2024-09-20T11:32:52Z",
            "uuid": "347fa428-85e5-4bc2-891f-90d26b28e85e"
        },
        {
            "createdAt": "2024-09-20T11:32:52Z",
            "name": "Kabupaten Agam",
            "stateUuid": "1cb270c0-784a-445e-83b0-839a87783284",
            "updatedAt": "2024-09-20T11:32:52Z",
            "uuid": "41266bdc-2a44-4345-91e0-0430f9991208"
        },
        {
            "createdAt": "2024-09-20T11:32:52Z",
            "name": "Kabupaten Sijunjung",
            "stateUuid": "1cb270c0-784a-445e-83b0-839a87783284",
            "updatedAt": "2024-09-20T11:32:52Z",
            "uuid": "46a10542-4615-4a73-9381-e00856b74a55"
        },
        {
            "createdAt": "2024-09-20T11:32:52Z",
            "name": "Payakumbuh",
            "stateUuid": "1cb270c0-784a-445e-83b0-839a87783284",
            "updatedAt": "2024-09-20T11:32:52Z",
            "uuid": "4bd46661-bc09-401f-bfdd-38097c9f0ff2"
        },
        {
            "createdAt": "2024-09-20T11:32:52Z",
            "name": "Kabupaten Pasaman",
            "stateUuid": "1cb270c0-784a-445e-83b0-839a87783284",
            "updatedAt": "2024-09-20T11:32:52Z",
            "uuid": "4e8b18fe-c1e1-4d1d-9d34-c38e07d145ec"
        }
    ],
    "pagination": {
        "page": 1,
        "perPage": 10,
        "totalItems": 25,
        "totalPages": 3,
        "fetchAll": false
    }
}
```

### Get List of Purpose Codes

`GET` \[BASE\_URL]/xb/master/purpose/list

**Response Body**

```json
{
    "code": "00",
    "data": {
        "results": [
            {
                "uuid": "02f243ed-b77b-4323-8699-9c432821b0fc",
                "code": "IR01802",
                "description": "Advertising & Public relations-related expenses",
                "available_account_type": [
                    "B2B"
                ],
                "created_at": "2024-09-11T16:10:58Z",
                "updated_at": "2025-08-01T12:49:37Z"
            },
            {
                "uuid": "0f9d0c18-351e-4dbd-8969-527d0b89a027",
                "code": "IR011",
                "description": "Payment of Property Rental",
                "available_account_type": [
                    "P2P"
                ],
                "created_at": "2024-09-11T16:10:58Z",
                "updated_at": "2025-08-01T12:49:16Z"
            },
            {
                "uuid": "0fa54ea6-b61a-4ebc-8767-a4675c97ea12",
                "code": "IR003",
                "description": "Education-related student expenses",
                "available_account_type": [
                    "P2P"
                ],
                "created_at": "2024-09-11T16:10:58Z",
                "updated_at": "2025-08-01T12:49:16Z"
            },
            {
                "uuid": "1373c043-c6c7-4b00-88c5-394106074843",
                "code": "IR016",
                "description": "Investment in Shares",
                "available_account_type": [
                    "P2P"
                ],
                "created_at": "2024-09-11T16:10:58Z",
                "updated_at": "2025-08-01T12:49:16Z"
            },
            {
                "uuid": "158e412c-ec43-430e-8cc0-ba3095d515e8",
                "code": "IR020",
                "description": "Salary",
                "available_account_type": [
                    "B2P"
                ],
                "created_at": "2024-09-11T16:10:58Z",
                "updated_at": "2025-08-01T12:49:22Z"
            },
            {
                "uuid": "2bb6a2ff-bbb1-4a38-810a-5b0afa316762",
                "code": "IR013",
                "description": "Product indemnity insurance",
                "available_account_type": [
                    "P2P"
                ],
                "created_at": "2024-09-11T16:10:58Z",
                "updated_at": "2025-08-01T12:49:16Z"
            },
            {
                "uuid": "2c2f8926-ad8b-481c-8867-79d59df196b7",
                "code": "IR01808",
                "description": "Transportation fees for goods",
                "available_account_type": [
                    "B2B"
                ],
                "created_at": "2024-09-11T16:10:58Z",
                "updated_at": "2025-08-01T12:49:38Z"
            },
            {
                "uuid": "47300b3a-7c72-4e96-8f6c-56651680bc11",
                "code": "IR01801",
                "description": "Information Service Charges",
                "available_account_type": [
                    "B2B"
                ],
                "created_at": "2024-09-11T16:10:58Z",
                "updated_at": "2025-08-01T12:49:37Z"
            },
            {
                "uuid": "4a9a1cd9-e01b-4199-9615-3cd969f610be",
                "code": "IR007",
                "description": "Utility Bills",
                "available_account_type": [
                    "P2P"
                ],
                "created_at": "2024-09-11T16:10:58Z",
                "updated_at": "2025-08-01T12:49:16Z"
            },
            {
                "uuid": "4f46be33-f339-4fb3-8252-8983d6d647fe",
                "code": "IR01810",
                "description": "Delivery fees for goods",
                "available_account_type": [
                    "B2B"
                ],
                "created_at": "2024-09-11T16:10:58Z",
                "updated_at": "2025-08-01T12:49:38Z"
            }
        ],
        "pagination": {
            "page": 1,
            "per_page": 10,
            "total_items": 29,
            "total_pages": 3,
            "fetch_all": false
        }
    }
}
```

### Get List of Source of Income

`GET` \[BASE\_URL]/xb/master/source-of-income/list

**Response Body**

```json
{
    "code": "00",
    "message": "Success",
    "data": [
        {
            "createdAt": "2024-10-22T10:42:42Z",
            "name": "Salary",
            "updatedAt": "2024-10-22T10:42:42Z",
            "uuid": "09b63fc2-d6ca-4005-8003-0c44bb5ad808"
        }
    ],
    "pagination": {
        "page": 1,
        "perPage": 10,
        "totalItems": 1,
        "totalPages": 1,
        "fetchAll": false
    }
}


```

### Get SWIFT Code

`GET` \[BASE\_URL]/xb/master/swift

**Response Body**

```json
{
    "code": "00",
    "data": {
        "branchName": "TANAH ABANG BRANCH",
        "cityName": "JAKARTA",
        "institutionName": "PT. BANK RAKYAT INDONESIA (PERSERO), TBK",
        "swiftCode": "BRINIDJA018",
        "uuid": "0109c9a8-701d-47be-baa7-d4b776398706"
    }
}
```

\ <br>


# FX

<table><thead><tr><th width="208">Parameter</th><th width="110">Data Type</th><th width="133">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>fxRate</td><td>String</td><td>M</td><td>Conversion rate from source currency to destination currency</td></tr><tr><td>destinationFxRate</td><td>String</td><td>M</td><td>Conversion rate from destination currency to source currency</td></tr><tr><td>expiryAt</td><td>String</td><td>M</td><td>FX rate object expired time in ISO-8601 format. i.e. 2024-10-02T08:36:44.967496538Z<br></td></tr></tbody></table>


# Sender

<table><thead><tr><th>Parameter</th><th width="220">Data Type</th><th>Requirement</th><th>Description</th></tr></thead><tbody><tr><td>uuid</td><td>String Generated</td><td>M</td><td>Object unique identifier</td></tr><tr><td>merchantId</td><td>String Generated</td><td>M</td><td>Merchant unique identifier</td></tr><tr><td>referenceId</td><td>String</td><td>M</td><td>Merchant remitter reference ID</td></tr><tr><td>name</td><td>String <br></td><td>M</td><td><p>Remitter name<br>^[A-Za-z0-9 -]{1,40}$</p><p><br></p><p>Max 40</p><p>Can only contain the special characters</p></td></tr><tr><td>countryCode</td><td>Enum </td><td>M</td><td>Remitter two-letter country code based on ISO 3166-1</td></tr><tr><td>state</td><td>String</td><td>M</td><td>Remitter state<br>Length: Max 255</td></tr><tr><td>city</td><td>String</td><td>M</td><td>Remitter city<br>Length: Max 35</td></tr><tr><td>address</td><td>String</td><td>M</td><td>Remitter address<br><br>Length: Max 200</td></tr><tr><td>postcode</td><td>Number </td><td>M</td><td><p>Remitter postcode<br><br>^[a-zA-Z0-9\s\-]{0,16}$</p><p><br></p><p>Max 16</p><p>Can only contain the special characters -</p></td></tr><tr><td>accountType</td><td>Enum </td><td>M</td><td><p>Remitter account type (individual or company)<br><br></p><p>Value:</p><p>Should be either</p><ul><li>Individual</li><li>Company</li></ul></td></tr><tr><td>bankAccountNumber</td><td>String</td><td>C<br>Required if beneficiary country code is KR</td><td><p>Remitter bank name</p><p><br><br>Length: Max 50</p></td></tr><tr><td>nationality</td><td>Enum </td><td>M</td><td><p>Remitter nationality in two-letter country code based on ISO 3166-1<br></p><p>Value: Can be the same as remitterCountryCode</p></td></tr><tr><td>identificationType</td><td><p>Enum</p><p></p></td><td>M</td><td><p>Remitter ID type according to account type<br><br></p><p>Value:</p><p>If Individual, should be either</p><ul><li>Kartu Tanda Penduduk</li><li>Passport</li></ul><p><br></p><p>If Company, should be either</p><ul><li>Business Registration Number</li><li>ACRA</li><li>Travel Agent License Number</li><li>ABN</li><li>ACN</li><li>ARBN</li></ul></td></tr><tr><td>identificationNumber</td><td>String </td><td>M</td><td><p>Remitter ID number based on the ID type selected<br><br>^[A-Za-z0-9\s-.]{1,30}$</p><p><br></p><p>Max 30</p><p>Can only contain the special characters </p></td></tr><tr><td>dob</td><td>String </td><td>C</td><td><p>Remitter date of birth</p><p>Required if account type is Individual</p><p></p><p>Format: YYYY/MM/DD</p></td></tr><tr><td>contactCountryCode</td><td>String</td><td>M</td><td>Remitter contact country code<br><br>Length: Max 5</td></tr><tr><td>contactNumber</td><td>String </td><td>M</td><td><p>Remitter contact number<br></p><p>^[0-9+/-\\s]{0,17}$<br></p><p>Length: Max 17</p></td></tr><tr><td>sourceOfIncome</td><td>Enum </td><td>M</td><td><p>Remitter source of income<br><br></p><p>Value:</p><p>Should be either</p><ul><li>Salary</li><li>Personal Savings</li><li>Personal Wealth</li><li>Retirement Funds</li><li>Business Owner</li><li>Shareholder</li><li>Loan Facility</li><li>Personal Account</li><li>Corporate Account</li></ul></td></tr></tbody></table>


# Beneficiary

| uuid                   | String Generated                 | M                                                 | Object unique identifier                                                                                                                                                                                                                                                                                                             |
| ---------------------- | -------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| merchantID             | String Generated                 | M                                                 | Merchant unique identifier                                                                                                                                                                                                                                                                                                           |
| referenceID            | String                           | M                                                 | Merchant beneficiary reference ID                                                                                                                                                                                                                                                                                                    |
| <p>name</p><p><br></p> | String                           | M                                                 | <p>Beneficiary name<br><br>^\[a-zA-Z\s]{1,70}$</p><p><br></p><p>Length Max 70</p>                                                                                                                                                                                                                                                    |
| countryCode            | Enum                             | M                                                 | <p>Beneficiary two-letter country code based on ISO 3166-1<br><br></p><p><br></p><p>Value:</p><p>Should be either</p><ul><li>SG</li><li>MY</li><li>TH</li><li>JP</li><li>CN</li><li>AU</li><li>US</li><li>KR</li><li>GB</li><li>DE</li><li>NL</li><li>ES</li><li>IT</li><li>TW</li><li>VN</li><li>HK</li><li>PL</li><li>SE</li></ul> |
| state                  | String                           | M                                                 | <p>Beneficiary state<br><br>Length: Max 50</p>                                                                                                                                                                                                                                                                                       |
| city                   | String                           | M                                                 | <p>Beneficiary city<br><br>Length: Max 35</p>                                                                                                                                                                                                                                                                                        |
| address                | String                           | M                                                 | <p>Beneficiary address<br><br>^.{1,200}$</p><p>Length Max 200</p>                                                                                                                                                                                                                                                                    |
| postcode               | Number                           | M                                                 | <p>Beneficiary postcode<br><br>Length: Max 15</p>                                                                                                                                                                                                                                                                                    |
| accountType            | <p>Enum </p><p><br></p>          | M                                                 | <p>Beneficiary account type (individual or company)<br><br></p><p>Value Should be either</p><ul><li>Individual</li><li>Company</li></ul>                                                                                                                                                                                             |
| bankName               | String                           | M                                                 | <p>Beneficiary bank name<br><br>^\[A-z0-9., -]{1,100}$</p><p><br></p><p>Max 100</p><p>Only allows special characters . , -</p>                                                                                                                                                                                                       |
| bankCode               | <p>String </p><p><br></p><p></p> | <p>C<br>Required if beneficiary country is KR</p> | <p>Beneficiary bank code</p><p>Length: Max 3</p>                                                                                                                                                                                                                                                                                     |
| accountNumber          | String                           | M                                                 | Beneficiary bank account number                                                                                                                                                                                                                                                                                                      |
| contactCountryCode     | String                           | <p>C<br>Required if beneficiary country is KR</p> | <p>Beneficiary contact country code</p><p><br>Length: Max 5</p>                                                                                                                                                                                                                                                                      |
| contactNumber          | <p>String <br></p><p></p>        | <p>C<br>Required if beneficiary country is KR</p> | <p>Beneficiary contact number</p><p><br><br>^\[0-9+/-\s]{0,17}$</p><p><br></p><p>Max 17</p><p>Can contain + - space numbers</p>                                                                                                                                                                                                      |
| email                  | String                           | <p>C<br>Required if beneficiary country is KR</p> | <p>Beneficiary email</p><p><br><br>Max 100</p>                                                                                                                                                                                                                                                                                       |


# International Payout

| Parameter           | Data Type                         | Requirement | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |                                                                                                                                                               |                                                                                                                           |
| ------------------- | --------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| uuid                | <p>String<br>Generated</p>        | M           | Object unique identifier                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |                                                                                                                                                               |                                                                                                                           |
| merchantId          | String Generated                  | M           | Merchant unique identifier                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |                                                                                                                                                               |                                                                                                                           |
| referenceId         | String                            | M           | Merchant payout reference ID                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |                                                                                                                                                               |                                                                                                                           |
| remitterId          | String                            | M           | Remitter ID                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |                                                                                                                                                               |                                                                                                                           |
| beneficiaryId       | String                            | M           | Beneficiary ID                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |                                                                                                                                                               |                                                                                                                           |
| sourceCurrency      | <p>Enum </p><p><br></p><p></p>    | M           | <p>Three-letter source currency code based on ISO 4217<br><br>Value: Should be IDR</p>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |                                                                                                                                                               |                                                                                                                           |
| destinationCurrency | Enum                              | M           | Three-letter destination currency code based on ISO 4217                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |                                                                                                                                                               |                                                                                                                           |
| destinationAmount   | <p>String Required</p><p><br></p> | M           | <p>Amount to be received by beneficiary in destination currency<br><br></p><p>For others</p><ul><li>Max decimal 2</li><li>Min amount 1</li></ul><p></p><p>For KR & JP</p><ul><li>Max decimal 0</li><li>Max amount KRW 5,500,000</li></ul><p></p><p>For US</p><ul><li>Max amount USD 1,000,000</li></ul>                                                                                                                                                                                                                                                                                                                    |                                                                                                                                                               |                                                                                                                           |
| purposeCode         | <p>Enum </p><p><br></p>           | M           | <p>Purpose of payout<br><br>Value:</p><p></p><p>Should be either</p><ul><li>IR001</li><li>IR002</li><li>IR003</li><li>IR004</li><li>IR005</li><li>IR006</li><li>IR007</li><li>IR008</li><li>IR009</li><li>IR010</li><li>IR011</li><li>IR012</li><li>IR013</li><li>IR014</li><li>IR015</li><li>IR016</li><li>IR017</li><li>IR020</li><li>IR01801</li><li>IR01802</li><li>IR01803</li><li>IR01804</li><li>IR01805</li><li>IR01806</li><li>IR01807</li><li>IR01808</li><li>IR01809</li><li>IR01810</li><li>IR01811</li></ul>                                                                                                  |                                                                                                                                                               |                                                                                                                           |
| remarks             | <p>String</p><p></p>              | M           | <p>Payout remarks<br><br>^\[a-zA-Z0-9\_\s]+$</p><p><br></p><p>Max 20</p><p>Can only include special character \_</p>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |                                                                                                                                                               |                                                                                                                           |
| routingValue        | String                            | C           | <p>SWIFT or ACH or BSB code, depending on the selected country and currency<br><br></p><p>For SG, MY, TH, JP, CN:</p><ul><li>To local currency: SWIFT Code</li><li>To foreign currency: SWIFT Code</li></ul><p><br></p><p>For AU:</p><ul><li>To local currency: BSB Code</li><li>To foreign currency: SWIFT Code</li></ul><p><br></p><p>For US:</p><ul><li>To local currency: ACH Code</li><li>To foreign currency: SWIFT Code</li></ul><p><br></p><p>For KR:</p><ul><li>To local currency: No code required</li><li>To foreign currency: No code required</li></ul><p><br></p><p>SWIFT Codes</p><ul><li>^\[A-Za-z0-9]{8}$ | ^\[A-Za-z0-9]{11}$</li><li>Length: 8 or 11</li><li>Special Character: None allowed</li></ul><p><br></p><p>BSB Code</p><ul><li>^\[0-9]{6}$ , ^\[A-Za-z0-9]{8}$ | ^\[A-Za-z0-9]{11}$</li><li>Length: 6</li></ul><p><br></p><p>ACH Code</p><ul><li>/^\[0-9]{9}$/</li><li>Length: 9</li></ul> |
| fxRate              | Number Generated                  | M           | Conversion rate from source currency to destination currency                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |                                                                                                                                                               |                                                                                                                           |
| destinationFxRate   | Number Generated                  | M           | Conversion rate from destination currency to source currency                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |                                                                                                                                                               |                                                                                                                           |
| fee                 | Number Generated                  | M           | Payout fee                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |                                                                                                                                                               |                                                                                                                           |
| totalAmount         | Number Generated                  | M           | Total amount to be paid                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |                                                                                                                                                               |                                                                                                                           |
| createdAt           | String Generated                  | M           | Payout object created time in ISO-8601 format. i.e. 2024-10-02T08:21:44.967496538Z                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |                                                                                                                                                               |                                                                                                                           |
| expiredAt           | String Generated                  | M           | Payout object expired time in ISO-8601 format. i.e. 2024-10-02T08:36:44.967496538Z                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |                                                                                                                                                               |                                                                                                                           |
| status              | Enum Generated                    | M           | Payout status                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |                                                                                                                                                               |                                                                                                                           |
| payoutMethod        | Enum                              | O           | <p>Specify as WALLET if want to perform payout to Alipay</p><p>If not specified, then default will be BANK\_ACCOUNT</p>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |                                                                                                                                                               |                                                                                                                           |

# List of Purpose Code

| Available Account Type | Code    | Description                                                                                             |
| ---------------------- | ------- | ------------------------------------------------------------------------------------------------------- |
| Any                    | IR001   | Transfer to own account                                                                                 |
| Any                    | IR002   | Family Maintenance                                                                                      |
| Any                    | IR003   | Education-related student expenses                                                                      |
| Any                    | IR004   | Medical Treatment                                                                                       |
| Any                    | IR005   | Hotel Accommodation                                                                                     |
| Any                    | IR006   | Travel                                                                                                  |
| Any                    | IR007   | Utility Bills                                                                                           |
| Any                    | IR008   | Repayment of Loans                                                                                      |
| Any                    | IR009   | Tax Payment                                                                                             |
| Any                    | IR010   | Purchase of Residential Property                                                                        |
| Any                    | IR011   | Payment of Property Rental                                                                              |
| Any                    | IR012   | Insurance Premium                                                                                       |
| Any                    | IR013   | Product indemnity insurance                                                                             |
| Any                    | IR014   | Insurance Claims Payment                                                                                |
| Any                    | IR015   | Mutual Fund Investment                                                                                  |
| Any                    | IR016   | Investment in Shares                                                                                    |
| Any                    | IR017   | Donations                                                                                               |
| B2P                    | IR020   | Salary                                                                                                  |
| Any                    | IR01801 | Information Service Charges                                                                             |
| Any                    | IR01802 | Advertising & Public relations-related expenses                                                         |
| Any                    | IR01803 | Royalty fees, trademark fees, patent fees, and copyright fees                                           |
| Any                    | IR01804 | Fees for brokers, front end fee, commitment fee, guarantee fee and custodian fee                        |
| Any                    | IR01805 | Fees for advisors, technical assistance, and academic knowledge, including remuneration for specialists |
| Any                    | IR01806 | Representative office expenses                                                                          |
| Any                    | IR01807 | Construction costs/expenses                                                                             |
| Any                    | IR01808 | Transportation fees for goods                                                                           |
| Any                    | IR01809 | For payment of exported goods                                                                           |
| Any                    | IR01810 | Delivery fees for goods                                                                                 |
| Any                    | IR01811 | General Goods Trades - Offline trade                                                                    |


# Payout Status

<figure><img src="https://627965603-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FImVr2HJay0snj5ukhBJK%2Fuploads%2F10dCnFuGpeF1EFLvSNrx%2Fimage.png?alt=media&#x26;token=529bd76d-7e46-4a3f-8b08-d80ff7296c61" alt=""><figcaption></figcaption></figure>

| Status                     | Description                                                                  |
| -------------------------- | ---------------------------------------------------------------------------- |
| WAITING\_FOR\_CONFIRMATION | Waiting for merchant to confirm payout                                       |
| INSUFFICIENT\_BALANCE      | Payout confirmed but merchant’s balance is insufficient                      |
| EXPIRED                    | Payout session has expired and merchant needs to create a new payout session |
| PENDING                    | Payout request sent                                                          |
| DOCUMENT\_REQUESTED        | Further information (RFI) requested by compliance                            |
| IN\_REVIEW                 | RFI submitted and in review by compliance                                    |
| PARTNER\_REJECTED          | Payout rejected by partner’s compliance                                      |
| IN\_REVIEW                 | RFI submitted and in review by compliance                                    |
| PROCESSING                 | Payout in process and instruction being sent to the bank                     |
| PROCESSING                 | Payout in process and instruction being sent to the bank                     |
| BENEFICIARY\_REJECTED      | Payout rejected by beneficiary through bank                                  |
| FAILED                     | Payout failed                                                                |
| REFUNDED                   | Payout refunded                                                              |
| SUCCESS                    | Payout successful                                                            |


# Country Mapping

| Country | To Local Currency | To Foreign Currency |
| ------- | ----------------- | ------------------- |
| SG      | SWIFT             | SWIFT               |
| MY      | SWIFT             | SWIFT               |
| TH      | SWIFT             | SWIFT               |
| JP      | Not Available     | SWIFT               |
| CN      | SWIFT             | SWIFT               |
| AU      | BSB CODE          | SWIFT               |
| US      | ACH CODE          | SWIFT               |
| KR      | Not required      | Not required        |


# RFI Entities

| Entity                     | Type |
| -------------------------- | ---- |
| FULL\_NAME                 | TEXT |
| OFFICIAL\_ID               | TEXT |
| ADDRESS                    | TEXT |
| DATE\_OF\_BIRTH            | DATE |
| NATIONALITY                | TEXT |
| PURPOSE                    | TEXT |
| PROVIDE\_SOURCE\_OF\_FUNDS | FILE |
| PURPOSE\_OF\_TRANSACTIONS  | FILE |
| COMMENT                    | TEXT |
| PASSPORT                   | FILE |
| DRIVING\_LICENSE           | FILE |
| BANK\_STATEMENT            | FILE |
| UTILITY\_BILLS             | FILE |
| NRIC                       | FILE |
| FIN                        | FILE |
| GOVERNMENT\_LETTER         | FILE |
| GOVERNMENT\_DOCUMENT       | FILE |
| HKID                       | FILE |
| INVOICE                    | FILE |
| SHIPPING\_INVOICE          | FILE |



# Wallet (Account Linkage)

Customizable digital wallet solution, allowing you to brand and tailor to your business needs.<br>

How it works:

* Create and bind Pivot Pay account to your app
* Create transaction (top up, merchant payment, QRIS payment, etc) from your app using Pivot Pay balance

<figure><img src="https://627965603-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FImVr2HJay0snj5ukhBJK%2Fuploads%2FFnLpnt69ChHYaehnkXX8%2Fimage.png?alt=media&#x26;token=d8846291-5069-4f5a-930f-0ce4d88182f7" alt=""><figcaption></figcaption></figure>

User Activation

<figure><img src="https://627965603-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FImVr2HJay0snj5ukhBJK%2Fuploads%2FgeSDLI12zKjqSv5isXzp%2Funknown.png?alt=media&#x26;token=e53eb79d-e9b6-45d2-bbab-44409c65744b" alt=""><figcaption></figcaption></figure>

Top Up

<figure><img src="https://627965603-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FImVr2HJay0snj5ukhBJK%2Fuploads%2FtRBBkjUlobbH8hXZD2aK%2Funknown.png?alt=media&#x26;token=d5d2529f-5112-4f4b-af5c-e265a799e484" alt=""><figcaption></figcaption></figure>

Merchant Payment

<figure><img src="https://627965603-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FImVr2HJay0snj5ukhBJK%2Fuploads%2FohbCAwxRcAWqtUPLChQQ%2Funknown.png?alt=media&#x26;token=084ac382-0a68-412e-b2fd-c40fbf46c257" alt=""><figcaption></figcaption></figure>

QRIS Payment

<figure><img src="https://627965603-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FImVr2HJay0snj5ukhBJK%2Fuploads%2FXYUqGog2CWmk98wpDouN%2Funknown.png?alt=media&#x26;token=4e30157e-95e5-499f-bd32-e4c060938ae4" alt=""><figcaption></figcaption></figure>

<br>

# Authentication

You need to send a request to get an access token to Pivot Server, then you will receive the access token that will expire in 900 seconds (15 minutes). Whenever it expires, you should send another request to get a new access token.

{% hint style="info" %}
**Tips!**

You could create a cron job that generates an access token request that runs every 14 minutes, stores the access token in your system, and uses the access token for every next request.
{% endhint %}

## Access Token B2B

### **Method and URL**

<mark style="color:green;">`POST`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/snap/v1.0/access-token/b2b

### Request

**Request Header**

<table><thead><tr><th>Key</th><th width="115.1787109375">Data Type</th><th width="131.38671875">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>X-TIMESTAMP</td><td>String</td><td>M</td><td>Client's current local time in yyyy-MMddTHH:mm:ssTZD format</td></tr><tr><td>X-CLIENT-KEY</td><td>String</td><td>M</td><td>Client ID</td></tr><tr><td>X-SIGNATURE</td><td>String</td><td>M</td><td><p>Non-repudiation &#x26; integrity checking:<br>asymmetric signature SHA256withRSA<br><br>X-SIGNATURE: SHA256withRSA<br>(Private_Key, stringToSign) </p><p>stringToSign = client_ID + “|” + X-TIMESTAMP</p></td></tr></tbody></table>

**Request Body**

```json
{
  "grantType": "client_credentials",
  "additionalInfo": {}
}
```

### Response

**Response Body**

```json
{
  "responseCode": "2007300",
  "responseMessage": "Successful",
  "accessToken": "***",
  "tokenType": "Bearer",
  "expiresIn": "900"
}
```

## Access Token B2B2C

### **Method and URL**

<mark style="color:green;">`POST`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/snap/v1.0/access-token/b2b2c

### Request

**Request Header**

<table><thead><tr><th>Key</th><th width="115.1787109375">Data Type</th><th width="131.38671875">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>X-TIMESTAMP</td><td>String</td><td>M</td><td>Client's current local time in yyyy-MMddTHH:mm:ssTZD format</td></tr><tr><td>X-CLIENT-KEY</td><td>String</td><td>M</td><td>Client ID</td></tr><tr><td>X-SIGNATURE</td><td>String</td><td>M</td><td><p>Non-repudiation &#x26; integrity checking:<br>asymmetric signature SHA256withRSA<br><br>X-SIGNATURE : SHA256withRSA</p><p>(Private_Key, stringToSign) </p><p>stringToSign = client_ID + “|” + X-TIMESTAMP</p></td></tr></tbody></table>

**Request Body**

```json
{
 "grantType":"authorization_code",
 "authCode":"{{bindingId}}", // obtained from account creation and binding callback
 "refreshToken":"{{customerRefreshToken}}",
 "additionalInfo":{
 }
}
```

### Response

**Response Body**

```json
{
  "accessToken": "***",
  "accessTokenExpiryTime": "2025-11-27T10:46:03+07:00",
  "refreshToken": "***",
  "refreshTokenExpiryTime": "2025-11-26T10:46:03+07:00",
  "responseCode": "2007400",
  "responseMessage": "Successful",
  "tokenType": "Bearer"
}
```


# Account Creation & Binding

<figure><img src="https://627965603-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FImVr2HJay0snj5ukhBJK%2Fuploads%2FTkFfu08gwOouR51hHCRB%2Funknown.png?alt=media&#x26;token=7ed8c792-d74c-4136-9bd6-6bb2ebbbad24" alt=""><figcaption></figcaption></figure>

## **Method and URL**

`POST` \[BASE\_URL]/wallet-backend/snap/v1.0/registration-account-creation

Purpose: Create and bind an account.<br>

Authorization:

* B2B Token&#x20;

## **Request**

**Request Header**

<table><thead><tr><th width="252.0615234375">Header</th><th width="121.7216796875">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>Content-Type</td><td>Mandatory</td><td>application/json</td></tr><tr><td>Authorization</td><td>Mandatory</td><td>Bearer {B2B_access_token}</td></tr><tr><td>X-SIGNATURE</td><td>Mandatory</td><td><p>HMAC signature generated as per SNAP specification</p><p><br></p><p>HMAC_SHA512 (clientSecret, stringToSign) </p><p>stringToSign = HTTPMethod +”:“+ EndpointUrl +":"+ AccessToken +":“+ Lowercase(HexEncode(SHA-256(minify(RequestBody))))+ ":“ + TimeStamp</p></td></tr><tr><td>X-TIMESTAMP</td><td>Mandatory</td><td>Request timestamp in yyyy-MM-dd'T'HH:mm:ssXXX (ISO 8601 with offset)</td></tr><tr><td>X-PARTNER-ID</td><td>Mandatory</td><td>Partner ID assigned by Pivot</td></tr><tr><td>X-EXTERNAL-ID</td><td>Mandatory</td><td>Unique ID per request for idempotency / tracing</td></tr><tr><td>CHANNEL-ID</td><td>Mandatory</td><td>Channel identifier (e.g., 12345)</td></tr></tbody></table>

**Request Body**

```json
{
  "partnerReferenceNo": "USER081800008888",
  "merchantId": "88042168-bfa6-4e5c-bcca-5abf1d40a181",
  "name": "Brasco Zig",
  "phoneNo": "081800008888",
  "redirectUrl": "https://www.test.com/"
}
```

**Request Parameter Detail**&#x20;

<table><thead><tr><th>Parameter</th><th width="115.970703125">Data Type</th><th width="120.7626953125">Character Limir</th><th width="115.8447265625">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>partnerReferenceNo</td><td>String</td><td>64</td><td>Mandatory</td><td>Unique reference number from partner/merchant for this account creation request.</td></tr><tr><td>merchantId</td><td>String</td><td>36</td><td>Mandatory</td><td>Merchant ID assigned by Pivot Pay.</td></tr><tr><td>phoneNo</td><td>String</td><td>15</td><td>Mandatory</td><td>User’s phone number in MSISDN format (e.g., 6281234567890).</td></tr><tr><td>name</td><td>String</td><td>50</td><td>Mandatory</td><td>User’s full name.</td></tr><tr><td>redirectUrl</td><td>String (URL)</td><td>255</td><td>Mandatory</td><td>URL to redirect the user after creation/onboarding is completed.</td></tr></tbody></table>

\ <br>

## **Response**

**Response Body**

```json
{
  "additionalInfo": {
    "activationLink": "https://wallet-stg.harsya.com/whitelabel/account-linkage-bind?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ3YWxsZXQtYmFja2VuZCIsInN1YiI6IjAxOTY1NjcwLWZmYzYtN2U3MC05YjY5LTRkODU0MDkwNzdjOSIsImV4cCI6MTc1NDI5NTg2NywiaWRlbnRpZmllclZhbHVlIjoiMDE5NjU2NzAtZmZjNi03ZTcwLTliNjktNGQ4NTQwOTA3N2M5IiwibWVyY2hhbnRJZCI6Ijg4MDQyMTY4LWJmYTYtNGU1Yy1iY2NhLTVhYmYxZDQwYTE4MSIsInNlc3Npb25JZCI6Ijg4MDQyMTY4LWJmYTYtNGU1Yy1iY2NhLTVhYmYxZDQwYTE4MSJ9.QXWxTNm3JwHXRdHENn7vxzkxLCUp3a13uuRke_uRuGQ",
    "expiredAt": "2025-08-04T15:24:27.415024635+07:00"
  },
  "referenceNo": "01987420-dc76-7ea6-a8d0-34956542b2b4",
  "responseCode": "2000600",
  "responseMessage": "Successful"
}
```

**Response Parameter Detail**

<table><thead><tr><th>Parameter</th><th width="108.82421875">Data Type</th><th width="112.740234375">Character Limit</th><th width="128.2470703125">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>additionalInfo</td><td>Object</td><td>-</td><td>Mandatory</td><td>Contains the activation link and expiration details.</td></tr><tr><td>additionalInfo.activationLink</td><td>String (URL)</td><td>255</td><td>Mandatory</td><td>Activation URL that redirects the user to complete their onboarding process.</td></tr><tr><td>additionalInfo.expiredAt</td><td>String (ISO 8601)</td><td>25</td><td>Mandatory</td><td>Expiration date and time of the activation link.</td></tr><tr><td>referenceNo</td><td>String</td><td>100</td><td>Mandatory</td><td>Description of the API result (e.g., "OK" or error message).</td></tr><tr><td>responseCode</td><td>String</td><td>7</td><td>Mandatory</td><td>Response status code.</td></tr><tr><td>responseMessage</td><td>String</td><td>100</td><td>Mandatory</td><td>Description of the result.</td></tr></tbody></table>

\ <br>


# Account Unbinding

## **Method and URL**

<mark style="color:green;">`POST`</mark> \[<mark style="color:orange;">BASE\_URL</mark>]/wallet-backend/snap/v1.0/registration-account-unbinding

Purpose: Unbind or disconnect an already-bound Pivot Pay wallet account from the merchant’s application.<br>

Authorization:

* B2B Token&#x20;

## **Request**

**Request Header**

<table><thead><tr><th>Header</th><th width="139.87890625">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>Content-Type</td><td>Mandatory</td><td>application/json</td></tr><tr><td>Authorization</td><td>Mandatory</td><td>Bearer {B2B_access_token}</td></tr><tr><td>X-SIGNATURE</td><td>Mandatory</td><td><p>HMAC signature generated as per SNAP specification</p><p><br></p><p>HMAC_SHA512 (clientSecret, stringToSign) </p><p>stringToSign = HTTPMethod +”:“+ EndpointUrl +":"+ AccessToken +":“+ Lowercase(HexEncode(SHA-256(minify(RequestBody))))+ ":“ + TimeStamp</p></td></tr><tr><td>X-TIMESTAMP</td><td>Mandatory</td><td>Request timestamp in yyyy-MM-dd'T'HH:mm:ssXXX (ISO 8601 with offset)</td></tr><tr><td>X-PARTNER-ID</td><td>Mandatory</td><td>Partner ID assigned by Pivot</td></tr><tr><td>X-EXTERNAL-ID</td><td>Mandatory</td><td>Unique ID per request for idempotency / tracing</td></tr><tr><td>CHANNEL-ID</td><td>Mandatory</td><td>Channel identifier (e.g., 12345)</td></tr></tbody></table>

**Request Body**

```json
{
  "additionalInfo": {
    "failedRedirectUrl": "https://test.com",
    "redirectUrl": "https://test.com"
  },
  "merchantId": "88042168-bfa6-4e5c-bcca-5abf1d40a181",
  "tokenId": "78042168-bfa6-4e5c-bcca-5abf1d40a182"
}
```

**Request Parameter Detail**&#x20;

<table><thead><tr><th>Parameter</th><th width="109.8056640625">Data Type</th><th width="105.7724609375">Character Limit</th><th width="131.0283203125">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>additionalInfo</td><td>Object</td><td>-</td><td>Optional</td><td>Container for additional information.</td></tr><tr><td>additionalInfo.failedRedirectionUrl</td><td>String (URL)</td><td>255</td><td>Optional</td><td>URL to redirect the user if unbinding fails.</td></tr><tr><td>additionalInfo.redirectionUrl</td><td>String (URL)</td><td>255</td><td>Optional</td><td>URL to redirect the user if unbinding is completed.</td></tr><tr><td>merchantId</td><td>String</td><td>36</td><td>Mandatory</td><td>Merchant ID assigned by Pivot Pay.</td></tr><tr><td>tokenId</td><td>String</td><td>36</td><td>Mandatory</td><td>User Binding ID, Same ID used in generate B2B2C token</td></tr></tbody></table>

## **Response**

**Response Body**

```json
{
  "additionalInfo": {
    "expiredIn": "2025-08-04T16:54:03+07:00",
    "redirectUrl": "https://wallet-stg.harsya.com/whitelabel/account-linkage-unbind?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ3YWxsZXQtYmFja2VuZCIsInN1YiI6IjE0NzFlNGFjLTI3N2ItNGJiNi04MmQ4LWFlZTY4ODNhNTg2ZCIsImV4cCI6MTc1NDMwMTI0MywiaWRlbnRpZmllclZhbHVlIjoiMTQ3MWU0YWMtMjc3Yi00YmI2LTgyZDgtYWVlNjg4M2E1ODZkIiwibWVyY2hhbnRJZCI6Ijg4MDQyMTY4LWJmYTYtNGU1Yy1iY2NhLTVhYmYxZDQwYTE4MSIsInNlc3Npb25JZCI6Ijg4MDQyMTY4LWJmYTYtNGU1Yy1iY2NhLTVhYmYxZDQwYTE4MSJ9.CHlfFBK8DopiJNnlzI_-SAagTXmqjLVq2DP2wpE1x-k"
  },
  "responseCode": "2000900",
  "responseMessage": "Successful"
}
```

**Response Parameter Detail**

<table><thead><tr><th>Parameter</th><th width="108.23828125">Data Type</th><th width="116.841796875">Character Limit</th><th width="126.4853515625">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>additionalInfo</td><td>Object</td><td>-</td><td>Optional</td><td>Response status code. "00" indicates success, other codes indicate failure or specific error states.</td></tr><tr><td>additionalInfo.expiredIn</td><td>String (ISO 8601)</td><td>25</td><td>Mandatory</td><td>Expiration date and time of the unbinding link.</td></tr><tr><td>additionalInfo.redirectUrl</td><td>String (URL)</td><td>255</td><td>Optional</td><td>URL to redirect the user to complete unbinding process.</td></tr><tr><td>responseCode</td><td>String</td><td>7</td><td>Mandatory</td><td>Response status code.</td></tr><tr><td>responseMessage</td><td>String</td><td>100</td><td>Mandatory</td><td>Description of the result.</td></tr></tbody></table>

\ <br>


# Balance Inquiry

## **Method and URL**

`POST` \[BASE\_URL]/wallet-backend/snap/v1.0/balance-inquiry

Purpose:  View a user’s current wallet balance.<br>

Authorization:

* B2B Token&#x20;
* B2B2C Token

## **Request**

**Request Header**

<table><thead><tr><th>Header</th><th width="130.6015625">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>Content-Type</td><td>Mandatory</td><td>application/json</td></tr><tr><td>Authorization</td><td>Mandatory</td><td>Bearer {B2B_access_token}</td></tr><tr><td>Authorization-Customer</td><td>Mandatory</td><td>Bearer {B2B2C_access_token}</td></tr><tr><td>X-SIGNATURE</td><td>Mandatory</td><td><p>HMAC signature generated as per SNAP specification</p><p><br></p><p>HMAC_SHA512 (clientSecret, stringToSign) </p><p>stringToSign = HTTPMethod +”:“+ EndpointUrl +":"+ AccessToken +":“+ Lowercase(HexEncode(SHA-256(minify(RequestBody))))+ ":“ + TimeStamp</p></td></tr><tr><td>X-TIMESTAMP</td><td>Mandatory</td><td>Request timestamp in yyyy-MM-dd'T'HH:mm:ssXXX (ISO 8601 with offset)</td></tr><tr><td>X-PARTNER-ID</td><td>Mandatory</td><td>Partner ID assigned by Pivot</td></tr><tr><td>X-EXTERNAL-ID</td><td>Mandatory</td><td>Unique ID per request for idempotency / tracing</td></tr><tr><td>CHANNEL-ID</td><td>Mandatory</td><td>Channel identifier (e.g., 12345)</td></tr></tbody></table>

**Request Body**

```json
{
  "additionalInfo": {}
}
```

**Request Parameter Detail**&#x20;

<table><thead><tr><th>Parameter</th><th width="103.3505859375">Data Type</th><th width="113.1044921875">Character Limit</th><th width="122.8203125">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>additionalInfo</td><td>Object</td><td>-</td><td>Optional</td><td>Container for additional information.</td></tr></tbody></table>

<br>

## **Response**

**Response Body**

```json
{
  "accountInfos": [
    {
      "availableBalance": {
        "currency": "IDR",
        "value": "8463186.00"
      },
      "balanceType": "CASH"
    }
  ],
  "responseCode": "2001100",
  "responseMessage": "Successful"
}
```

**Response Parameter Detail**

<table><thead><tr><th>Parameter</th><th width="111.275390625">Data Type</th><th width="111.4609375">Character Limit</th><th width="127.900390625">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>accountInfos</td><td>Array</td><td>-</td><td>Mandatory</td><td>List of balance information objects for the user’s account.</td></tr><tr><td>accountInfos[].availableBalance</td><td>Object</td><td>-</td><td>Mandatory</td><td>Object containing the available balance details.</td></tr><tr><td>accountInfos[].availableBalance.currency</td><td>String</td><td>3</td><td>Mandatory</td><td>Currency code of the balance, e.g., IDR.</td></tr><tr><td>accountInfos[].availableBalance.value</td><td>String</td><td>20</td><td>Mandatory</td><td>Available balance amount in decimal string format (e.g., "8463186.00").</td></tr><tr><td>accountInfos[].balanceType</td><td>String</td><td>20</td><td>Mandatory</td><td>Type of balance, e.g., CASH.</td></tr><tr><td>responseCode</td><td>String</td><td>7</td><td>Mandatory</td><td>Response status code. "2001100" indicates successful balance inquiry.</td></tr><tr><td>responseMessage</td><td>String</td><td>100</td><td>Mandatory</td><td>Description of the result, e.g., "Successful".</td></tr></tbody></table>

\ <br>


# Payment to Merchant

<figure><img src="https://627965603-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FImVr2HJay0snj5ukhBJK%2Fuploads%2F8XvFFJ0EPOGZ2I9aieeU%2Funknown.png?alt=media&#x26;token=d43ee799-d44c-41d1-9e76-49dd67136df4" alt=""><figcaption></figcaption></figure>

## **Method and URL**

`POST` \[BASE\_URL]/wallet-backend/snap/v1.0/debit/payment-host-to-host

Purpose:  Initiate a debit/payment transaction using the customer’s Pivot Pay balance via host-to-host integration. The API returns a web redirect URL for the payment authorization page.<br>

Authorization:

* B2B Token&#x20;
* B2B2C Token

## **Request**

**Request Header**

<table><thead><tr><th>Header</th><th width="128.3310546875">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>Content-Type</td><td>Mandatory</td><td>application/json</td></tr><tr><td>Authorization</td><td>Mandatory</td><td>Bearer {B2B_access_token}</td></tr><tr><td>Authorization-Customer</td><td>Mandatory</td><td>Bearer {B2B2C_access_token}</td></tr><tr><td>X-SIGNATURE</td><td>Mandatory</td><td><p>HMAC signature generated as per SNAP specification</p><p><br></p><p>HMAC_SHA512 (clientSecret, stringToSign) </p><p>stringToSign = HTTPMethod +”:“+ EndpointUrl +":"+ AccessToken +":“+ Lowercase(HexEncode(SHA-256(minify(RequestBody))))+ ":“ + TimeStamp</p></td></tr><tr><td>X-TIMESTAMP</td><td>Mandatory</td><td>Request timestamp in yyyy-MM-dd'T'HH:mm:ssXXX (ISO 8601 with offset)</td></tr><tr><td>X-PARTNER-ID</td><td>Mandatory</td><td>Partner ID assigned by Pivot</td></tr><tr><td>X-EXTERNAL-ID</td><td>Mandatory</td><td>Unique ID per request for idempotency / tracing</td></tr><tr><td>CHANNEL-ID</td><td>Mandatory</td><td>Channel identifier (e.g., 12345)</td></tr></tbody></table>

**Request Body**

```json
{
  "additionalInfo": {},
  "subMerchantId": "88042168-bfa6-4e5c-bcca-5abf1d40a181",
  "partnerReferenceNo": "ref04080002",
  "amount": {
    "value": "10000.00",
    "currency": "IDR"
  },
  "urlParams": [
    {
      "url": "https://test.com",
      "type": "PAY_RETURN",
      "isDeeplink": false
    }
  ]
}
```

**Request Parameter Detail**&#x20;

<table><thead><tr><th>Parameter</th><th width="108.0625">Data Type</th><th width="113.9609375">Character Limit</th><th width="131.66015625">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>additionalInfo</td><td>Object</td><td>-</td><td>Optional</td><td>Container for additional fields</td></tr><tr><td>subMerchantId</td><td>String</td><td>36</td><td>Mandatory</td><td>Merchant ID.</td></tr><tr><td>partnerReferenceNo</td><td>String</td><td>64</td><td>Mandatory</td><td>Unique reference number from the merchant for this payment request.</td></tr><tr><td>amount</td><td>Object</td><td>-</td><td>Mandatory</td><td>Payment amount object.</td></tr><tr><td>amount.value</td><td>String</td><td>20</td><td>Mandatory</td><td>Payment amount in decimal string (e.g., "10000.00").</td></tr><tr><td>amount.currency</td><td>String</td><td>3</td><td>Mandatory</td><td>Currency code of the transaction, e.g., IDR.</td></tr><tr><td>urlParams</td><td>Array</td><td>-</td><td>Mandatory</td><td>List of URL parameter objects used for redirect handling.</td></tr><tr><td>urlParams[].url</td><td>String</td><td>255</td><td>Mandatory</td><td>URL for redirecting the user after payment (e.g., payment result page).</td></tr><tr><td>urlParams[].type</td><td>String</td><td>20</td><td>Mandatory</td><td>URL type. In this example: PAY_RETURN.</td></tr><tr><td>urlParams[].isDeeplink</td><td>Boolean</td><td>-</td><td>Mandatory</td><td>Indicates whether the URL is a deeplink (true) or a standard HTTP/HTTPS URL (false).</td></tr></tbody></table>

## **Response**

**Response Body**

```json
{
  "additionalInfo": {
    "urlExpiredAt": "2025-08-04T17:24:42+07:00"
  },
  "referenceNo": "0198748e-f3ff-7eaf-a8fa-9b4532d2a6f8",
  "responseCode": "2005400",
  "responseMessage": "Successful",
  "webRedirectUrl": "https://wallet-stg.harsya.com/whitelabel/payment?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ3YWxsZXQtYmFja2VuZCIsInN1YiI6IjE0NzFlNGFjLTI3N2ItNGJiNi04MmQ4LWFlZTY4ODNhNTg2ZCIsImV4cCI6MTc1NDMwMzA4MiwiaWRlbnRpZmllclZhbHVlIjoiMTQ3MWU0YWMtMjc3Yi00YmI2LTgyZDgtYWVlNjg4M2E1ODZkIiwibWVyY2hhbnRJZCI6Ijg4MDQyMTY4LWJmYTYtNGU1Yy1iY2NhLTVhYmYxZDQwYTE4MSIsInNlc3Npb25JZCI6IjAxOTg3NDhlLWYzZmYtN2VhZi1hOGZhLTliNDUzMmQyYTZmOCJ9.YRcwtvEXguqL_ugmoMbRtfzYyL-jb6CZwava8mXdOwk"
}
```

**Response Parameter Detail**

<table><thead><tr><th>Parameter</th><th width="108.3505859375">Data Type</th><th width="109.48828125">Character Limit</th><th width="125.462890625">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>additionalInfo</td><td>Object</td><td>-</td><td>Optional</td><td>Additional response information.</td></tr><tr><td>additionalInfo.urlExpiredAt</td><td>String</td><td>30</td><td>Mandatory</td><td>Expiration timestamp for the webRedirectUrl in ISO 8601 format with timezone.</td></tr><tr><td>referenceNo</td><td>String</td><td>64</td><td>Mandatory</td><td>System-generated reference number for this payment transaction.</td></tr><tr><td>responseCode</td><td>String</td><td>7</td><td>Mandatory</td><td>Response status code. 2005400 indicates the payment request was created successfully.</td></tr><tr><td>responseMessage</td><td>String</td><td>100</td><td>Mandatory</td><td>Description of the result, e.g., Successful.</td></tr><tr><td>webRedirectUrl</td><td>String (URL)</td><td>2048</td><td>Mandatory</td><td>URL to which the user should be redirected to authorize/complete the payment.</td></tr></tbody></table>

\ <br>


# Inquiry Payment Status

## **Method and URL**

`POST` \[BASE\_URL]/wallet-backend/snap/v1.0/debit/status

Purpose:  Initiate a debit/payment transaction using the customer’s Pivot Pay balance via host-to-host integration. The API returns a web redirect URL for the payment authorization page.<br>

Authorization:

* B2B Token&#x20;
* B2B2C Token

## **Request**

**Request Header**

<table><thead><tr><th>Header</th><th width="130.6796875">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>Content-Type</td><td>Mandatory</td><td>application/json</td></tr><tr><td>Authorization</td><td>Mandatory</td><td>Bearer {B2B_access_token}</td></tr><tr><td>Authorization-Customer</td><td>Mandatory</td><td>Bearer {B2B2C_access_token}</td></tr><tr><td>X-SIGNATURE</td><td>Mandatory</td><td><p>HMAC signature generated as per SNAP specification</p><p><br></p><p>HMAC_SHA512 (clientSecret, stringToSign) </p><p>stringToSign = HTTPMethod +”:“+ EndpointUrl +":"+ AccessToken +":“+ Lowercase(HexEncode(SHA-256(minify(RequestBody))))+ ":“ + TimeStamp</p></td></tr><tr><td>X-TIMESTAMP</td><td>Mandatory</td><td>Request timestamp in yyyy-MM-dd'T'HH:mm:ssXXX (ISO 8601 with offset)</td></tr><tr><td>X-PARTNER-ID</td><td>Mandatory</td><td>Partner ID assigned by Pivot</td></tr><tr><td>X-EXTERNAL-ID</td><td>Mandatory</td><td>Unique ID per request for idempotency / tracing</td></tr><tr><td>CHANNEL-ID</td><td>Mandatory</td><td>Channel identifier (e.g., 12345)</td></tr></tbody></table>

**Request Body**

```json
{
  "originalPartnerReferenceNo": "partner-ref-9",
  "serviceCode": "54"
}
```

**Request Parameter Detail**&#x20;

<table><thead><tr><th>Parameter</th><th width="106.2705078125">Data Type</th><th width="108.4912109375">Character Limit</th><th width="122.9130859375">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>originalPartnerReferenceNo</td><td>String</td><td>64</td><td>Mandatory</td><td>The partner’s original reference number for the payment request being checked.</td></tr><tr><td>serviceCode</td><td>String</td><td>5</td><td>Mandatory</td><td>SNAP service code for debit payment status inquiry (54).</td></tr></tbody></table>

## **Response**

**Response Body**

```json
{
  "feeAmount": {
    "currency": "IDR",
    "value": "0.00"
  },
  "latestTransactionStatus": "05",
  "originalPartnerReferenceCode": "partner-ref-9",
  "paidTime": "2025-05-23T03:35:41+07:00",
  "responseCode": "2005500",
  "responseMessage": "Successful",
  "serviceCode": "54",
  "transAmount": {
    "currency": "IDR",
    "value": "1245.00"
  },
  "transactionStatusDesc": "Cancelled"
}
```

**Response Parameter Detail**

<table><thead><tr><th>Parameter</th><th width="108.951171875">Data Type</th><th width="116.2900390625">Character Limit</th><th width="123.638671875">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>feeAmount</td><td>Object</td><td>-</td><td>Mandatory</td><td>Fee charged for the transaction.</td></tr><tr><td>feeAmount.currency</td><td>String</td><td>3</td><td>Mandatory</td><td>Currency code, e.g., IDR.</td></tr><tr><td>feeAmount.value</td><td>String</td><td>20</td><td>Mandatory</td><td>Fee amount in decimal string.</td></tr><tr><td>latestTransactionStatus</td><td>String</td><td>5</td><td>Mandatory</td><td>Latest status code of the transaction. Example: 05.</td></tr><tr><td>originalPartnerReferenceCode</td><td>String</td><td>64</td><td>Mandatory</td><td>Partner’s original reference number (same as request).</td></tr><tr><td>paidTime</td><td>String (ISO 8601)</td><td>30</td><td>Optional</td><td>Time the transaction was completed (if applicable).</td></tr><tr><td>responseCode</td><td>String</td><td>7</td><td>Mandatory</td><td>Response code. 2005500 indicates success.</td></tr><tr><td>responseMessage</td><td>String</td><td>100</td><td>Mandatory</td><td>Description of the result, e.g., Successful.</td></tr><tr><td>serviceCode</td><td>String</td><td>5</td><td>Mandatory</td><td>Service code (54).</td></tr><tr><td>transAmount</td><td>Object</td><td>-</td><td>Mandatory</td><td>Transaction amount details.</td></tr><tr><td>transAmount.currency</td><td>String</td><td>3</td><td>Mandatory</td><td>Currency of the original debit transaction.</td></tr><tr><td>transAmount.value</td><td>String</td><td>20</td><td>Mandatory</td><td>Transaction amount in decimal string.</td></tr><tr><td>transactionStatusDesc</td><td>String</td><td>20</td><td>Mandatory</td><td>Description of the latest status</td></tr></tbody></table>

\ <br>


# QRIS Payment Link - Apply OTT

<figure><img src="https://627965603-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FImVr2HJay0snj5ukhBJK%2Fuploads%2FUsZNYF1Ycbo8U5u7yPlC%2Funknown.png?alt=media&#x26;token=8630f0f2-80f2-46cd-adbe-6ffc722c221c" alt=""><figcaption></figcaption></figure>

## **Method and URL**

`POST` \[BASE\_URL]/wallet-backend/snap/v1.0/qr/apply-ott

Purpose:  Create QRIS payment link for users to scan QRIS and make payment using balance. Use this if you want to use Pivot’s webview.<br>

Authorization:

* B2B Token&#x20;
* B2B2C Token

## **Request**

**Request Header**

<table><thead><tr><th>Header</th><th width="131.34375">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>Content-Type</td><td>Mandatory</td><td>application/json</td></tr><tr><td>Authorization</td><td>Mandatory</td><td>Bearer {B2B_access_token}</td></tr><tr><td>Authorization-Customer</td><td>Mandatory</td><td>Bearer {B2B2C_access_token}</td></tr><tr><td>X-SIGNATURE</td><td>Mandatory</td><td><p>HMAC signature generated as per SNAP specification</p><p><br></p><p>HMAC_SHA512 (clientSecret, stringToSign) </p><p>stringToSign = HTTPMethod +”:“+ EndpointUrl +":"+ AccessToken +":“+ Lowercase(HexEncode(SHA-256(minify(RequestBody))))+ ":“ + TimeStamp</p></td></tr><tr><td>X-TIMESTAMP</td><td>Mandatory</td><td>Request timestamp in yyyy-MM-dd'T'HH:mm:ssXXX (ISO 8601 with offset)</td></tr><tr><td>X-PARTNER-ID</td><td>Mandatory</td><td>Partner ID assigned by Pivot</td></tr><tr><td>X-EXTERNAL-ID</td><td>Mandatory</td><td>Unique ID per request for idempotency / tracing</td></tr><tr><td>CHANNEL-ID</td><td>Mandatory</td><td>Channel identifier (e.g., 12345)</td></tr></tbody></table>

**Request Body**

```json
{
   "userResources":[
      "OTT"
   ],
   "additionalInfo":{
    "partnerReferenceNo":"ref-20251125004",
    "mode":"JIT",
    "redirectUrl":"https://www.google.com",
    "failedRedirectUrl":"https://www.google.com"
   }
}
```

**Request Parameter Detail**&#x20;

<table><thead><tr><th>Parameter</th><th width="106.0166015625">Data Type</th><th width="112.0263671875">Character Limit</th><th width="129.125">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>userResources</td><td>Array of String</td><td>512</td><td>Mandatory</td><td>Mandatory value OTT</td></tr><tr><td>additionalInfo</td><td>Object</td><td><br></td><td>Optional</td><td>Additional information for custom use that are not provided by SNAP</td></tr><tr><td>partnerReferenceNo</td><td>String</td><td>64</td><td>Mandatory</td><td>Unique reference number generated by the merchant to identify and track the transaction.</td></tr><tr><td>redirectionUrl</td><td>String (URL)</td><td>255</td><td>Mandatory</td><td>URL to redirect the user after the transaction is successfully processed.</td></tr><tr><td>failedRedirectionUrl</td><td>String (URL)</td><td>255</td><td>Optional</td><td>URL to redirect the user if the transaction fails or is canceled.</td></tr><tr><td>mode</td><td>String</td><td>10</td><td>Optional</td><td>Transaction mode. "JIT" (Just-In-Time) means the wallet will be funded only at the moment of payment.</td></tr></tbody></table>

## **Response**

**Response Body**

```json
{
    "additionalInfo": {
        "paymentUrl": "http://localhost:3004/whitelabel/qris-payment?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ3YWxsZXQtYmFja2VuZCIsInN1YiI6Ijk4NzI4MDgxLWZjZTgtNGNkYi04MmJmLTYxYWE2MjU5YzQxYyIsImV4cCI6MTc2NDA2MzIyNiwiaWRlbnRpZmllclZhbHVlIjoiOTg3MjgwODEtZmNlOC00Y2RiLTgyYmYtNjFhYTYyNTljNDFjIiwibWVyY2hhbnRJZCI6IjVmZmQ0NjQzLWQxMjktNDMzZi04NWNiLWNkNWViYjNmMTdhNiIsInNlc3Npb25JZCI6IjAxOWFiYTRlLWVkNzktNzc5NS1hMTZmLTgwZTNhZTBlNTBlMiJ9.R_0RArJTR0fF4WQB5LSVSo7NOaO1Z41bizWZgDze6Ak",
        "urlExpiry": "2025-11-25T16:33:46.138844+07:00"
    },
    "responseCode": "2004900",
    "responseMessage": "Successful",
    "userResources": [
        {
            "resourceType": "OTT",
            "value": "019aba4e-ed79-7795-a16f-80e3ae0e50e2"
        }
    ]
}
```

**Response Parameter Detail**

<table><thead><tr><th>Parameter</th><th width="108.5263671875">Data Type</th><th width="123.892578125">Character Limit</th><th width="123.9833984375">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>responseCode</td><td>String</td><td>7</td><td>Mandatory</td><td>Response code. 2005500 indicates success.</td></tr><tr><td>responseMessage</td><td>String</td><td>100</td><td>Mandatory</td><td>Description of the result, e.g., Successful.</td></tr><tr><td>serviceCode</td><td>String</td><td>5</td><td>Mandatory</td><td>Service code (54).</td></tr><tr><td>userResources</td><td>Object</td><td><br></td><td>Optional</td><td><br></td></tr><tr><td>resourceType</td><td>String</td><td>10</td><td>Mandatory</td><td>Default value, e.g., OTT</td></tr><tr><td>value</td><td>String</td><td>64</td><td>Mandatory</td><td>Service provider transaction id  value</td></tr><tr><td>additionalInfo</td><td>Object</td><td><br></td><td>Optional</td><td>Additional information for custom use that are not provided by SNAP</td></tr><tr><td>paymentUrl</td><td>String</td><td>512</td><td>Mandatory</td><td>Link to access webview to do QRIS payment</td></tr><tr><td>urlExpiry</td><td>String (ISO 8601)</td><td>25</td><td>Mandatory</td><td>Expiration date and time of the payment link.</td></tr></tbody></table>

\ <br>


# Decode QRIS

## **Method and URL**

`POST` \[BASE\_URL]/wallet-backend/snap/v1.0/qr/qr-mpm-decode

Purpose:  Endpoint to decode qr content to get QRIS detail. Use this if you want to use your own UI.<br>

Authorization:

* B2B Token&#x20;
* B2B2C Token

## **Request**

**Request Header**

<table><thead><tr><th>Header</th><th width="124.7080078125">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>Content-Type</td><td>Mandatory</td><td>application/json</td></tr><tr><td>Authorization</td><td>Mandatory</td><td>Bearer {B2B_access_token}</td></tr><tr><td>Authorization-Customer</td><td>Mandatory</td><td>Bearer {B2B2C_access_token}</td></tr><tr><td>X-SIGNATURE</td><td>Mandatory</td><td><p>HMAC signature generated as per SNAP specification</p><p><br></p><p>HMAC_SHA512 (clientSecret, stringToSign) </p><p>stringToSign = HTTPMethod +”:“+ EndpointUrl +":"+ AccessToken +":“+ Lowercase(HexEncode(SHA-256(minify(RequestBody))))+ ":“ + TimeStamp</p></td></tr><tr><td>X-TIMESTAMP</td><td>Mandatory</td><td>Request timestamp in yyyy-MM-dd'T'HH:mm:ssXXX (ISO 8601 with offset)</td></tr><tr><td>X-PARTNER-ID</td><td>Mandatory</td><td>Partner ID assigned by Pivot</td></tr><tr><td>X-EXTERNAL-ID</td><td>Mandatory</td><td>Unique ID per request for idempotency / tracing</td></tr><tr><td>CHANNEL-ID</td><td>Mandatory</td><td>Channel identifier (e.g., 12345)</td></tr></tbody></table>

**Request Body**

```json
{
    "qrContent": "00020101021126660014ID.LINKAJA.WWW011893600911000000000802152103124400000080303UMI51440014ID.CO.QRIS.WWW0215ID20210652077750303UMI5204839853033605802ID5922YAY BAKTI KAMAJAYA IND6006SLEMAN61055528162070703A016304FA4D",
    "scanTime": "2025-12-18T15:27:11+07:00",
    "additionalInfo": {}
}
```

**Request Parameter Detail**&#x20;

<table><thead><tr><th>Parameter</th><th width="102.7744140625">Data Type</th><th width="122.5576171875">Character Limit</th><th width="128.8486328125">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>qrContent</td><td>String</td><td>512</td><td>Mandatory</td><td>QR String MPM</td></tr><tr><td>scanTime</td><td>String</td><td>25</td><td>Mandatory</td><td><p>The time when the QRIS scanned by the User</p><p>ISO 8601</p></td></tr><tr><td>additionalInfo</td><td>Object</td><td><br></td><td>Optional</td><td>Additional information for custom use that are not provided by SNAP</td></tr></tbody></table>

## **Response**

**Response Body**

```json
{
    "additionalInfo": {
        "merchantId": "210312440000008",
        "qrisId": "028e52ff-4427-42be-9b91-f0b9d0ad9a23",
        "qrisType": "ISSUING_STATIC"
    },
    "merchantCategory": "8398",
    "merchantInfos": [
        {
            "acquirerName": "LINKAJA",
            "merchantPAN": "9360091100000000080"
        }
    ],
    "merchantLocation": "SLEMAN        55281 ID",
    "merchantName": "YAY BAKTI KAMAJAYA IND",
    "responseCode": "2004800",
    "responseMessage": "Successful"
}

```

**Response Parameter Detail**

<table><thead><tr><th>Parameter</th><th width="102.935546875">Data Type</th><th width="135.7998046875">Character Limit</th><th width="122.0859375">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>responseCode</td><td>String</td><td>7</td><td>Mandatory</td><td>Response code. 2005500 indicates success.</td></tr><tr><td>responseMessage</td><td>String</td><td>100</td><td>Mandatory</td><td>Description of the result, e.g., Successful.</td></tr><tr><td>merchantCategory</td><td>String</td><td>32</td><td>Mandatory</td><td>Merchant category Mandatory if H2H mode</td></tr><tr><td>merchantInfos</td><td>Object</td><td><br></td><td>Mandatory</td><td><br></td></tr><tr><td>merchantInfos.acquirerName</td><td>String</td><td>50</td><td>Mandatory</td><td>Acquirer Name , Mandatory if using Host to Host mode for transaction</td></tr><tr><td>merchantInfos.merchantPAN</td><td>String</td><td>19</td><td>Mandatory</td><td>Merchant location Mandatory if H2H mode</td></tr><tr><td>merchantLocation</td><td>String</td><td>25</td><td>Mandatory</td><td>Merchant location Mandatory if H2H mode</td></tr><tr><td>merchantName</td><td>String</td><td>25</td><td>Mandatory</td><td>Reference name Mandatory if H2H mode</td></tr><tr><td>additionalInfo</td><td>Object</td><td><br></td><td>Optional</td><td>Additional information for custom use that are not provided by SNAP</td></tr><tr><td>additionalInfo.merchantId</td><td>String</td><td>20</td><td>Mandatory</td><td><br></td></tr><tr><td>additionalInfo.qrisId</td><td>String</td><td>32</td><td>Mandatory</td><td><br></td></tr><tr><td>additionalInfo.qrisType</td><td>String</td><td>20</td><td>Mandatory</td><td><br></td></tr></tbody></table>

\ <br>


# QRIS Payment H2H

<figure><img src="https://627965603-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FImVr2HJay0snj5ukhBJK%2Fuploads%2FtXaMv75O32z1soKvXqnc%2Funknown.png?alt=media&#x26;token=0cbcf8c7-9bb5-424f-8e89-43ce859e9c5d" alt=""><figcaption></figcaption></figure>

## **Method and URL**

`POST` \[BASE\_URL]/wallet-backend/snap/v1.0/qr/qr-mpm-payment

Purpose:  Create QRIS payment link for users to scan QRIS and make payment using balance. Use this if you want to use your own UI.<br>

Authorization:

* B2B Token&#x20;
* B2B2C Token

## **Request**

**Request Header**

<table><thead><tr><th>Header</th><th width="140.62109375">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>Content-Type</td><td>Mandatory</td><td>application/json</td></tr><tr><td>Authorization</td><td>Mandatory</td><td>Bearer {B2B_access_token}</td></tr><tr><td>Authorization-Customer</td><td>Mandatory</td><td>Bearer {B2B2C_access_token}</td></tr><tr><td>X-SIGNATURE</td><td>Mandatory</td><td><p>HMAC signature generated as per SNAP specification</p><p><br></p><p>HMAC_SHA512 (clientSecret, stringToSign) </p><p>stringToSign = HTTPMethod +”:“+ EndpointUrl +":"+ AccessToken +":“+ Lowercase(HexEncode(SHA-256(minify(RequestBody))))+ ":“ + TimeStamp</p></td></tr><tr><td>X-TIMESTAMP</td><td>Mandatory</td><td>Request timestamp in yyyy-MM-dd'T'HH:mm:ssXXX (ISO 8601 with offset)</td></tr><tr><td>X-PARTNER-ID</td><td>Mandatory</td><td>Partner ID assigned by Pivot</td></tr><tr><td>X-EXTERNAL-ID</td><td>Mandatory</td><td>Unique ID per request for idempotency / tracing</td></tr><tr><td>CHANNEL-ID</td><td>Mandatory</td><td>Channel identifier (e.g., 12345)</td></tr></tbody></table>

**Request Body**

```json
{
  "partnerReferenceNo": "ref-20251125002",
  "amount": {
    "value": "36000",
    "currency": "IDR"
  },
  "feeAmount": {
    "value": "",
    "currency": ""
  },
  "additionalInfo": {
    "qrisId": "028e52ff-4427-42be-9b91-f0b9d0ad9a23",
    "mode": "JIT",
    "redirectUrl": "https://www.google.com",
    "failedRedirectUrl": "https://www.google.com"
  }
}
```

**Request Parameter Detail**&#x20;

<table><thead><tr><th>Parameter</th><th width="105.2109375">Data Type</th><th width="112.7490234375">Character Limit</th><th width="130.052734375">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>partnerReferenceNo</td><td>String</td><td>64</td><td>Mandatory</td><td>Unique reference number generated by the merchant to identify and track the transaction.</td></tr><tr><td>amount</td><td>Object</td><td><br></td><td>Mandatory</td><td><br></td></tr><tr><td>value</td><td>String</td><td>16,2</td><td>Mandatory</td><td><p>Net amount of the transaction.</p><p>If it's IDR then value includes 2 decimal digits.</p><p>e.g. IDR 10.000,- will be placed with 10000.00</p></td></tr><tr><td>currency</td><td>String</td><td>3</td><td>Mandatory</td><td>Currency (ISO4217)</td></tr><tr><td>feeAmount</td><td>Object</td><td><br></td><td>Optional</td><td><br></td></tr><tr><td>value</td><td>String</td><td>16,2</td><td>Mandatory</td><td><p>Net amount of the transaction.</p><p>If it's IDR then value includes 2 decimal digits.</p><p>e.g. IDR 10.000,- will be placed with 10000.00</p></td></tr><tr><td>currency</td><td>String</td><td>3</td><td>Mandatory</td><td>Currency (ISO4217)</td></tr><tr><td>additionalInfo</td><td>Object</td><td><br></td><td>Optional</td><td>Additional information for custom use that are not provided by SNAP</td></tr><tr><td>qrisId</td><td>String</td><td>32</td><td>Mandatory</td><td>QRIS Id from Decode endpoint additionalInfo.qrisId</td></tr><tr><td>redirectionUrl</td><td>String (URL)</td><td>255</td><td>Mandatory</td><td>URL to redirect the user after the transaction is successfully processed.</td></tr><tr><td>failedRedirectionUrl</td><td>String (URL)</td><td>255</td><td>Optional</td><td>URL to redirect the user if the transaction fails or is canceled.</td></tr><tr><td>mode</td><td>String</td><td>10</td><td>Optional</td><td>Transaction mode. "JIT" (Just-In-Time) means the wallet will be funded only at the moment of payment.</td></tr></tbody></table>

## **Response**

**Response Body**

```json
{
  "additionalInfo": {
    "paymentUrl": "http://localhost:3004/whitelabel/qris-payment?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ3YWxsZXQtYmFja2VuZCIsInN1YiI6Ijk4NzI4MDgxLWZjZTgtNGNkYi04MmJmLTYxYWE2MjU5YzQxYyIsImV4cCI6MTc2NDA0NjExMSwiaWRlbnRpZmllclZhbHVlIjoiOTg3MjgwODEtZmNlOC00Y2RiLTgyYmYtNjFhYTYyNTljNDFjIiwibWVyY2hhbnRJZCI6IjVmZmQ0NjQzLWQxMjktNDMzZi04NWNiLWNkNWViYjNmMTdhNiIsInNlc3Npb25JZCI6IjAxOWFiOTQ5LWM2M2MtNzM1Zi1iMGU5LTc2OTIyNmZjNDkwOCJ9.cNzyZafajq_A2GY0ALEJ9mFXlCo10nIorg7hPxr9uCo",
    "urlExpiry": "2025-11-25T11:48:31.198284+07:00"
  },
  "amount": {
    "currency": "IDR",
    "value": "36000.00"
  },
  "feeAmount": {
    "currency": "IDR",
    "value": "0.00"
  },
  "partnerReferenceNo": "ref-20251125002",
  "referenceNo": "019ab949-c63c-735f-b0e9-769226fc4908",
  "responseCode": "2005000",
  "responseMessage": "Successful"
}
```

**Response Parameter Detail**

<table><thead><tr><th>Parameter</th><th width="108.775390625">Data Type</th><th width="122.4326171875">Character Limit</th><th width="125.2763671875">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>responseCode</td><td>String</td><td>7</td><td>Mandatory</td><td>Response code. 2005500 indicates success.</td></tr><tr><td>responseMessage</td><td>String</td><td>100</td><td>Mandatory</td><td>Description of the result, e.g., Successful.</td></tr><tr><td>amount</td><td>Object</td><td><br></td><td>Mandatory</td><td><br></td></tr><tr><td>value</td><td>String</td><td>16,2</td><td>Mandatory</td><td><p>Net amount of the transaction.</p><p>If it's IDR then value includes 2 decimal digits.</p><p>e.g. IDR 10.000,- will be placed with 10000.00</p></td></tr><tr><td>currency</td><td>String</td><td>3</td><td>Mandatory</td><td>Currency (ISO4217)</td></tr><tr><td>feeAmount</td><td>Object</td><td><br></td><td>Optional</td><td><br></td></tr><tr><td>value</td><td>String</td><td>16,2</td><td>Mandatory</td><td><p>Net amount of the transaction.</p><p>If it's IDR then value includes 2 decimal digits.</p><p>e.g. IDR 10.000,- will be placed with 10000.00</p></td></tr><tr><td>currency</td><td>String</td><td>3</td><td>Mandatory</td><td>Currency (ISO4217)</td></tr><tr><td>partnerReferenceNo</td><td>String</td><td>64</td><td>Mandatory</td><td>Transaction identifier on service provider system. Must be filled upon successful transaction</td></tr><tr><td>additionalInfo</td><td>Object</td><td><br></td><td>Optional</td><td>Additional information for custom use that are not provided by SNAP</td></tr><tr><td>paymentUrl</td><td>String</td><td>512</td><td>Mandatory</td><td>Link to access webview to do QRIS payment</td></tr><tr><td>urlExpiry</td><td>String (ISO 8601)</td><td>25</td><td>Mandatory</td><td>Expiration date and time of the payment link.</td></tr></tbody></table>

\ <br>


# Transaction History List

## **Method and URL**

`POST` \[BASE\_URL]/wallet-backend/snap/v1.0/transaction-history-list

Purpose:  Retrieve a paginated list of the customer’s wallet transaction history within a specified date and time range.<br>

Authorization:

* B2B Token&#x20;
* B2B2C Token

## **Request**

**Request Header**

<table><thead><tr><th>Header</th><th width="140.328125">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>Content-Type</td><td>Mandatory</td><td>application/json</td></tr><tr><td>Authorization</td><td>Mandatory</td><td>Bearer {B2B_access_token}</td></tr><tr><td>Authorization-Customer</td><td>Mandatory</td><td>Bearer {B2B2C_access_token}</td></tr><tr><td>X-SIGNATURE</td><td>Mandatory</td><td><p>HMAC signature generated as per SNAP specification</p><p><br></p><p>HMAC_SHA512 (clientSecret, stringToSign) </p><p>stringToSign = HTTPMethod +”:“+ EndpointUrl +":"+ AccessToken +":“+ Lowercase(HexEncode(SHA-256(minify(RequestBody))))+ ":“ + TimeStamp</p></td></tr><tr><td>X-TIMESTAMP</td><td>Mandatory</td><td>Request timestamp in yyyy-MM-dd'T'HH:mm:ssXXX (ISO 8601 with offset)</td></tr><tr><td>X-PARTNER-ID</td><td>Mandatory</td><td>Partner ID assigned by Pivot</td></tr><tr><td>X-EXTERNAL-ID</td><td>Mandatory</td><td>Unique ID per request for idempotency / tracing</td></tr><tr><td>CHANNEL-ID</td><td>Mandatory</td><td>Channel identifier (e.g., 12345)</td></tr></tbody></table>

**Request Body**

```json
{
  "partnerReferenceNo": "",
  "fromDateTime": "2025-07-22T00:00:00+07:00",
  "toDateTime": "2025-07-23T12:08:56+07:00",
  "pageSize": "10",
  "pageNumber": "1",
  "additionalInfo": {}
}
```

**Request Parameter Detail**&#x20;

<table><thead><tr><th>Parameter</th><th width="111.6611328125">Data Type</th><th width="105.4208984375">Character Limit</th><th width="126.595703125">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>partnerReferenceNo</td><td>String</td><td>64</td><td>Optional</td><td>Partner’s reference number to filter a specific transaction. Empty string ("") means no filter by reference.</td></tr><tr><td>fromDateTime</td><td>String (ISO 8601)</td><td>30</td><td>Mandatory</td><td>Start date-time (inclusive) of the transaction search range, with timezone offset.</td></tr><tr><td>toDateTime</td><td>String (ISO 8601)</td><td>30</td><td>Mandatory</td><td>End date-time (inclusive) of the transaction search range, with timezone offset.</td></tr><tr><td>pageSize</td><td>String</td><td>3</td><td>Mandatory</td><td>Number of records per page (e.g., "10").</td></tr><tr><td>pageNumber</td><td>String</td><td>5</td><td>Mandatory</td><td>Page number to retrieve, starting from "1".</td></tr><tr><td>additionalInfo</td><td>Object</td><td>-</td><td>Optional</td><td>Reserved for future/extra filtering parameters. Empty object {} in the example.</td></tr></tbody></table>

## **Response**

**Response Body**

```json
{
  "detailData": [
    {
      "dateTime": "2025-07-23T05:54:17+07:00",
      "status": "SUCCESS",
      "type": "TOP_UP",
      "amount": {
        "value": "79150.00",
        "currency": "IDR"
      },
      "additionalInfo": {
        "referenceNo": "019835d8-cacc-7790-ab78-15b25bb89d12",
        "partnerReferenceNo": "REF/20250723/0001"
      }
    },
    {
      "dateTime": "2025-07-22T03:30:19+07:00",
      "status": "SUCCESS",
      "type": "TOP_UP",
      "amount": {
        "value": "799150.00",
        "currency": "IDR"
      },
      "additionalInfo": {
        "referenceNo": "0198302e-a058-7e78-82f2-9d009208bdf7",
        "partnerReferenceNo": "REF/20250523/0012"
      }
    }
  ],
  "responseCode": "2001200",
  "responseMessage": "Successful"
}
```

**Response Parameter Detail**

<table><thead><tr><th>Parameter</th><th width="109.9423828125">Data Type</th><th width="118.7119140625">Character Limit</th><th width="128.9228515625">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>detailData</td><td>Array</td><td>-</td><td>Mandatory</td><td>List of transaction records returned for the requested page.</td></tr><tr><td>detailData[].dateTime</td><td>String (ISO 8601)</td><td>30</td><td>Mandatory</td><td>Date and time of the transaction with timezone offset.</td></tr><tr><td>detailData[].status</td><td>String</td><td>20</td><td>Mandatory</td><td>Transaction status, e.g., SUCCESS.</td></tr><tr><td>detailData[].type</td><td>String</td><td>20</td><td>Mandatory</td><td>Transaction type, e.g., TOP_UP, PAYMENT, etc.</td></tr><tr><td>detailData[].amount</td><td>Object</td><td>-</td><td>Mandatory</td><td>Amount information of the transaction.</td></tr><tr><td>detailData[].amount.value</td><td>String</td><td>20</td><td>Mandatory</td><td>Transaction amount in decimal string format.</td></tr><tr><td>detailData[].amount.currency</td><td>String</td><td>3</td><td>Mandatory</td><td>Currency code, e.g., IDR.</td></tr><tr><td>detailData[].additionalInfo</td><td>Object</td><td>-</td><td>Optional</td><td>Additional information related to the transaction.</td></tr><tr><td>detailData[].additionalInfo.referenceNo</td><td>String</td><td>64</td><td>Mandatory</td><td>Internal system reference number for the transaction.</td></tr><tr><td>detailData[].additionalInfo.partnerReferenceNo</td><td>String</td><td>64</td><td>Optional</td><td>Partner’s reference number associated with the transaction.</td></tr><tr><td>responseCode</td><td>String</td><td>7</td><td>Mandatory</td><td>Response status code. 2001200 indicates successful retrieval.</td></tr><tr><td>responseMessage</td><td>String</td><td>100</td><td>Mandatory</td><td>Description of the result, e.g., Successful.</td></tr></tbody></table>

\ <br>


# Transaction History Detail

## **Method and URL**

`POST` \[BASE\_URL]/wallet-backend/snap/v1.0/transaction-history-detail

Purpose:  Retrieve detailed information for a specific transaction using the partner’s reference number.<br>

Authorization:

* B2B Token&#x20;
* B2B2C Token

## **Request**

**Request Header**

<table><thead><tr><th>Header</th><th width="138.6240234375">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>Content-Type</td><td>Mandatory</td><td>application/json</td></tr><tr><td>Authorization</td><td>Mandatory</td><td>Bearer {B2B_access_token}</td></tr><tr><td>Authorization-Customer</td><td>Mandatory</td><td>Bearer {B2B2C_access_token}</td></tr><tr><td>X-SIGNATURE</td><td>Mandatory</td><td><p>HMAC signature generated as per SNAP specification</p><p><br></p><p>HMAC_SHA512 (clientSecret, stringToSign) </p><p>stringToSign = HTTPMethod +”:“+ EndpointUrl +":"+ AccessToken +":“+ Lowercase(HexEncode(SHA-256(minify(RequestBody))))+ ":“ + TimeStamp</p></td></tr><tr><td>X-TIMESTAMP</td><td>Mandatory</td><td>Request timestamp in yyyy-MM-dd'T'HH:mm:ssXXX (ISO 8601 with offset)</td></tr><tr><td>X-PARTNER-ID</td><td>Mandatory</td><td>Partner ID assigned by Pivot</td></tr><tr><td>X-EXTERNAL-ID</td><td>Mandatory</td><td>Unique ID per request for idempotency / tracing</td></tr><tr><td>CHANNEL-ID</td><td>Mandatory</td><td>Channel identifier (e.g., 12345)</td></tr></tbody></table>

**Request Body**

```json
{
  "originalPartnerReferenceNo": "REF/20250723/0001",
  "additionalInfo": {}
}
```

**Request Parameter Detail**&#x20;

<table><thead><tr><th>Parameter</th><th width="105.8896484375">Data Type</th><th width="114.9462890625">Character Limit</th><th width="125.5126953125">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>originalPartnerReferenceNo</td><td>String</td><td>64</td><td>Mandatory</td><td>Partner’s reference number for the transaction whose details are being requested.</td></tr><tr><td>additionalInfo</td><td>Object</td><td>-</td><td>Optional</td><td>Reserved for future extensions (empty object {} in the example).</td></tr></tbody></table>

## **Response**

**Response Body**

```json
{
  "amount": {
    "currency": "IDR",
    "value": "79150.00"
  },
  "dateTime": "2025-07-23T05:54:17+07:00",
  "partnerReferenceNo": "REF/20250723/0001",
  "referenceNo": "019835d8-cacc-7790-ab78-15b25bb89d12",
  "responseCode": "2001300",
  "responseMessage": "Successful",
  "status": "SUCCESS",
  "type": "TOP_UP"
}
```

**Response Parameter Detail**

<table><thead><tr><th>Parameter</th><th width="114.21484375">Data Type</th><th width="125.9736328125">Character Limit</th><th width="129.3369140625">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>amount</td><td>Object</td><td>-</td><td>Mandatory</td><td>Transaction amount details.</td></tr><tr><td>amount.currency</td><td>String</td><td>3</td><td>Mandatory</td><td>Currency code, e.g., IDR.</td></tr><tr><td>amount.value</td><td>String</td><td>20</td><td>Mandatory</td><td>Transaction amount in decimal string format.</td></tr><tr><td>dateTime</td><td>String (ISO 8601)</td><td>30</td><td>Mandatory</td><td>Date and time when the transaction occurred.</td></tr><tr><td>partnerReferenceNo</td><td>String</td><td>64</td><td>Mandatory</td><td>Partner’s original reference number associated with the transaction.</td></tr><tr><td>referenceNo</td><td>String</td><td>64</td><td>Mandatory</td><td>Internal system reference number for the transaction.</td></tr><tr><td>responseCode</td><td>String</td><td>7</td><td>Mandatory</td><td>Response status code. 2001300 indicates successful detail retrieval.</td></tr><tr><td>responseMessage</td><td>String</td><td>100</td><td>Mandatory</td><td>Description of the request result (e.g., Successful).</td></tr><tr><td>status</td><td>String</td><td>20</td><td>Mandatory</td><td>Transaction status, e.g. SUCCESS.</td></tr><tr><td>type</td><td>String</td><td>20</td><td>Mandatory</td><td>Transaction type, e.g. TOP_UP.</td></tr></tbody></table>

\ <br>


# Response Codes

<table><thead><tr><th width="109.6064453125">Category</th><th width="90.6123046875">HTTP Code</th><th width="95.765625">Service Code</th><th width="90.3662109375">Case Code</th><th>Response Message</th><th>Description</th></tr></thead><tbody><tr><td>Success</td><td>200</td><td>any</td><td>00</td><td>Successful</td><td>Successful</td></tr><tr><td>Success</td><td>202</td><td>any</td><td>00</td><td>Request In Progress</td><td>Transaction still on process</td></tr><tr><td>System</td><td>400</td><td>any</td><td>00</td><td>Bad Request</td><td>General request failed error, including message parsing failed.</td></tr><tr><td>Message</td><td>400</td><td>any</td><td>01</td><td>Invalid Field Format {field name}</td><td>Invalid format</td></tr><tr><td>Message</td><td>400</td><td>any</td><td>02</td><td>Invalid Mandatory Field {field name}</td><td>Missing or invalid format on mandatory field</td></tr><tr><td>System</td><td>401</td><td>any</td><td>00</td><td>Unauthorized. [reason]</td><td>General unauthorized error (No Interface Def, API is Invalid, Oauth Failed, Verify Client Secret Fail, Client Forbidden Access API, Unknown Client, Key not Found)</td></tr><tr><td>System</td><td>401</td><td>any</td><td>01</td><td>Invalid Token (B2B)</td><td>Token found in request is invalid (Access Token Not Exist, Access Token Expiry)</td></tr><tr><td>System</td><td>401</td><td>any</td><td>02</td><td>Invalid Customer Token</td><td>Token found in request is invalid (Access Token Not Exist, Access Token Expiry)</td></tr><tr><td>System</td><td>401</td><td>any</td><td>03</td><td>Token Not Found (B2B)</td><td>Token not found in the system. This occurs on any API that requires token as input parameter</td></tr><tr><td>System</td><td>401</td><td>any</td><td>04</td><td>Customer Token Not Found</td><td>Token not found in the system. This occurs on any API that requires token as input parameter</td></tr><tr><td>Business</td><td>403</td><td>any</td><td>00</td><td>Transaction Expired</td><td>Transaction expired</td></tr><tr><td>System</td><td>403</td><td>any</td><td>01</td><td>Feature Not Allowed [Reason]</td><td>This merchant is not allowed to call Direct Debit APIs</td></tr><tr><td>Business</td><td>403</td><td>any</td><td>02</td><td>Exceeds Transaction Amount Limit</td><td>Exceeds Transaction Amount Limit</td></tr><tr><td>Business</td><td>403</td><td>any</td><td>03</td><td>Suspected Fraud</td><td>Suspected Fraud</td></tr><tr><td>Business</td><td>403</td><td>any</td><td>04</td><td>Activity Count Limit Exceeded</td><td>Too many request, Exceeds Transaction Frequency Limit</td></tr><tr><td>Business</td><td>403</td><td>any</td><td>05</td><td>Do Not Honor</td><td>Account or User status is abnormal</td></tr><tr><td>System</td><td>403</td><td>any</td><td>06</td><td>Feature Not Allowed At This Time. [reason]</td><td>Cut off In Progress</td></tr><tr><td>Business</td><td>403</td><td>any</td><td>07</td><td>Card Blocked</td><td>The payment card is blocked</td></tr><tr><td>Business</td><td>403</td><td>any</td><td>08</td><td>Card Expired</td><td>The payment card is expired</td></tr><tr><td>Business</td><td>403</td><td>any</td><td>09</td><td>Dormant Account</td><td>The account is dormant</td></tr><tr><td>Business</td><td>403</td><td>any</td><td>10</td><td>Need To Set Token Limit</td><td>Need to set token limit</td></tr><tr><td>System</td><td>403</td><td>any</td><td>11</td><td>OTP Blocked</td><td>OTP has been blocked</td></tr><tr><td>System</td><td>403</td><td>any</td><td>12</td><td>OTP Lifetime Expired</td><td>OTP has been expired</td></tr><tr><td>System</td><td>403</td><td>any</td><td>13</td><td>OTP Sent To Cardholer</td><td>initiates request OTP to the issuer</td></tr><tr><td>Business</td><td>403</td><td>any</td><td>14</td><td>Insufficient Funds</td><td>Insufficient Funds</td></tr><tr><td>Business</td><td>403</td><td>any</td><td>15</td><td>Transaction Not Permitted.[reason]</td><td>Transaction Not Permitted</td></tr><tr><td>Business</td><td>403</td><td>any</td><td>16</td><td>Suspend Transaction</td><td>Suspend Transaction</td></tr><tr><td>Business</td><td>403</td><td>any</td><td>17</td><td>Token Limit Exceeded</td><td>Purchase amount exceeds the token limit set prior</td></tr><tr><td>Business</td><td>403</td><td>any</td><td>18</td><td>Inactive Card/Account/Customer</td><td>Indicates inactive account</td></tr><tr><td>Business</td><td>403</td><td>any</td><td>19</td><td>Merchant Blacklisted</td><td>Merchant is suspended from calling any APIs</td></tr><tr><td>Business</td><td>403</td><td>any</td><td>20</td><td>Merchant Limit Exceed</td><td>Merchant aggregated purchase amount on that day exceeds the agreed limit</td></tr><tr><td>Business</td><td>403</td><td>any</td><td>21</td><td>Set Limit Not Allowed</td><td>Set limit not allowed on particular token</td></tr><tr><td>Business</td><td>403</td><td>any</td><td>22</td><td>Token Limit Invalid</td><td>The token limit desired by the merchant is not within the agreed range between the merchant and the Issuer</td></tr><tr><td>Business</td><td>403</td><td>any</td><td>23</td><td>Account Limit Exceed</td><td>Account aggregated purchase amount on that day exceeds the agreed limit</td></tr><tr><td>Business</td><td>404</td><td>any</td><td>00</td><td>Invalid Transaction Status</td><td>Invalid transaction status</td></tr><tr><td>Business</td><td>404</td><td>any</td><td>01</td><td>Transaction Not Found</td><td>Transaction not found</td></tr><tr><td>System</td><td>404</td><td>any</td><td>02</td><td>Invalid Routing</td><td>Invalid Routing</td></tr><tr><td>System</td><td>404</td><td>any</td><td>03</td><td>Bank Not Supported By Switch</td><td>Bank not supported by switch</td></tr><tr><td>Business</td><td>404</td><td>any</td><td>04</td><td>Transaction Cancelled</td><td>Transaction is cancelled by customer</td></tr><tr><td>Business</td><td>404</td><td>any</td><td>05</td><td>Merchant Is Not Registered For Card Registration Services</td><td>Merchant is not registered for Card Registration services</td></tr><tr><td>System</td><td>404</td><td>any</td><td>06</td><td>Need To Request OTP</td><td>Need to request OTP</td></tr><tr><td>System</td><td>404</td><td>any</td><td>07</td><td>Journey Not Found</td><td>The journeyId cannot be found in the system</td></tr><tr><td>Business</td><td>404</td><td>any</td><td>08</td><td>Invalid Merchant</td><td>Merchant does not exist or status abnormal</td></tr><tr><td>Business</td><td>404</td><td>any</td><td>09</td><td>No Issuer</td><td>No issuer</td></tr><tr><td>System</td><td>404</td><td>any</td><td>10</td><td>Invalid API Transition</td><td>Invalid API transition within a journey</td></tr><tr><td>Business</td><td>404</td><td>any</td><td>11</td><td>Invalid Card/Account/Customer [info]/Virtual Account</td><td>Card information may be invalid, or the card account may be blacklisted, or Virtual Account number maybe invalid.</td></tr><tr><td>Business</td><td>404</td><td>any</td><td>12</td><td>Invalid Bill/Virtual Account [Reason]</td><td><p>The bill is blocked/ suspended/not found.</p><p>Virtual account is suspend/not found.</p></td></tr><tr><td>Business</td><td>404</td><td>any</td><td>13</td><td>Invalid Amount</td><td>The amount doesn't match with what supposed to</td></tr><tr><td>Business</td><td>404</td><td>any</td><td>14</td><td>Paid Bill</td><td>The bill has been paid</td></tr><tr><td>System</td><td>404</td><td>any</td><td>15</td><td>Invalid OTP</td><td>OTP is incorrect</td></tr><tr><td>Business</td><td>404</td><td>any</td><td>16</td><td>Partner Not Found</td><td>Partner number can't be found</td></tr><tr><td>Business</td><td>404</td><td>any</td><td>17</td><td>Invalid Terminal</td><td>Terminal does not exist in the system</td></tr><tr><td>Business</td><td>404</td><td>any</td><td>18</td><td>Inconsistent Request</td><td>Inconsistent request parameter found for the same partner reference number/transaction id.</td></tr><tr><td>Business</td><td>404</td><td>any</td><td>19</td><td>Invalid Bill/Virtual Account</td><td><p>The bill is expired.</p><p>The virtual account is expired.</p></td></tr><tr><td>System</td><td>405</td><td>any</td><td>00</td><td>Requested Function Is Not Supported</td><td>Requested function is not supported</td></tr><tr><td>Business</td><td>405</td><td>any</td><td>01</td><td>Requested Operation Is Not Allowed</td><td>Requested operation to cancel/refund transaction Is not allowed at this time.</td></tr><tr><td>System</td><td>409</td><td>any</td><td>00</td><td>Conflict</td><td>Cannot use same X-EXTERNAL-ID in same day</td></tr><tr><td>System</td><td>409</td><td>any</td><td>01</td><td>Duplicate partnerReferenceNo</td><td>Transaction has previously been processed indicates the same partnerReferenceNo already success</td></tr><tr><td>System</td><td>429</td><td>any</td><td>00</td><td>Too Many Requests</td><td>Maximum transaction limit exceeded</td></tr><tr><td>System</td><td>500</td><td>any</td><td>00</td><td>General Error</td><td>General Error</td></tr><tr><td>System</td><td>500</td><td>Any</td><td>01</td><td>Internal Server Error</td><td>Unknown Internal Server Failure, Please retry the process again</td></tr><tr><td>System</td><td>500</td><td>Any</td><td>02</td><td>External Server Error</td><td>Backend system failure, etc</td></tr><tr><td>System</td><td>504</td><td>any</td><td>00</td><td>Timeout</td><td>timeout from the issuer</td></tr></tbody></table>

<br>


# Page 1
