[Skip to main content](https://biteship.com/id/docs/errors#docusaurus_skipToContent_fallback)

# Errors

Biteship uses conventional HTTP response codes to show success or failure of an API request. Codes in the 2xx range shows a success, codes for the 4xx range shows an error that resulted from the provided information (e.g. a required field was missing, wrong format, etc.), and codes in the 5xx range indicate an error with Biteship's servers.

# Status

Error List Summary

```jsx
200 - Works fine.

400 - Bad request. Missing required parameters or other else.

401 - Request is not authorized

402 - Request is failed

403 - Key doesn't have access to request API calls

404 - The request is not exist

500 - Something's wrong with Biteship's internal server
```

This is how Biteship respond to error request

Error List Summary

```jsx
{
     success: false,
     error: "Required parameter is missing"
}
```