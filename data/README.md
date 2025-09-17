# Catalog Data

This directory contains the JSON files for the product catalog.

## `categories.json`

This file contains the list of product categories.

**Schema:**

```json
[
  {
    "category_id": "string",
    "category_name": "string"
  }
]
```

## `products.json`

This file contains the list of products.

**Schema:**

```json
[
  {
    "title": "string",
    "description": "string",
    "shortDescription": "string",
    "grindSize": "string[]",
    "coffeType": "string[]",
    "category_ids": "string[]",
    "images": [
      { "image": "string" }
    ],
    "variants": [
      {
        "weight": "string",
        "price": "number",
        "sku": "string",
        "quantity": "number"
      }
    ]
  }
]
```
