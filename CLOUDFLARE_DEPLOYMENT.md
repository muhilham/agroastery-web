# Cloudflare Pages Deployment Guide

This guide explains how to deploy the Agroastery web application to Cloudflare Pages with full API support.

## Prerequisites

1. Cloudflare account
2. Domain configured in Cloudflare (optional)
3. Biteship API key

## Deployment Steps

### 1. Connect Repository to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Pages** > **Create a project**
3. Connect your GitHub repository
4. Select the `agroastery-web` repository

### 2. Configure Build Settings (Next on Pages)

- **Framework preset**: None
- **Build command**: `npx @cloudflare/next-on-pages@latest build`
- **Build output directory**: `.vercel/output/static`
- **Functions directory**: `.vercel/output/functions`
- **Root directory**: `/` (leave empty)
- **Node.js version**: `20`

### 3. Environment Variables

Set these environment variables in Cloudflare Pages:

#### Required Variables:
```bash
BITESHIP_API_KEY=sk_live_your_actual_key_here
CATALOG_BASE=https://cdn.agroastery.com/produk
NEXT_PUBLIC_BITESHIP_DEFAULT_COURIERS=anteraja,jne,sicepat
NEXT_PUBLIC_ORIGIN_POSTAL_CODE=12440
ORIGIN_CONTACT_NAME=Agroastery
ORIGIN_CONTACT_PHONE=08123456789
ORIGIN_ADDRESS=Jl. Origin Address
```

#### Optional Variables:
```bash
PACKAGING_EXTRA_GRAMS=0
PACKAGING_EXTRA_PERCENT=0
```

### 4. Compatibility Settings

Ensure these settings are configured:

- **Compatibility date**: `2024-01-01`
- **Compatibility flags**: `nodejs_compat`

### 5. API Routes Configuration

All API routes are configured with `edge` runtime for Cloudflare compatibility:

- `/api/shipping/rates` - Biteship integration
- `/api/catalog/[...slug]` - Product catalog proxy
- `/api/og` - Open Graph image generation

### 6. Custom Domain (Optional)

1. Add your custom domain in Pages settings
2. Configure DNS records as instructed
3. Enable SSL/TLS encryption

## API Endpoints

### Shipping Rates API
- **Endpoint**: `/api/shipping/rates`
- **Method**: POST
- **Runtime**: Edge
- **External API**: Biteship v1/rates/couriers

### Catalog API  
- **Endpoint**: `/api/catalog/products.json` or `/api/catalog/categories.json`
- **Method**: GET
- **Runtime**: Edge
- **External API**: CDN proxy

### OG Image API
- **Endpoint**: `/api/og`
- **Method**: GET
- **Runtime**: Edge
- **Purpose**: Open Graph image generation

## Troubleshooting

### Common Issues:

1. **API Routes Not Working**
   - Ensure `runtime = 'edge'` is set in all API routes
   - Check environment variables are properly set
   - Verify Cloudflare compatibility flags

2. **Biteship API Errors**
   - Verify `BITESHIP_API_KEY` is set correctly
   - Check API key permissions and rate limits
   - Ensure origin postal code is valid

3. **Build Failures**
   - Check Node.js version (use 18 or 20)
   - Verify all dependencies are compatible
   - Review build logs for specific errors

4. **CORS Issues**
   - APIs are configured with proper headers
   - Check if additional CORS configuration is needed

### Performance Optimization:

1. **Caching**
   - Catalog API: 5 minutes cache with 24h stale-while-revalidate
   - Shipping API: No cache (dynamic data)

2. **Timeouts**
   - Shipping API: 30 second timeout
   - Catalog API: 10 second timeout

3. **Edge Runtime**
   - All APIs use edge runtime for global performance
   - Reduced cold start times

## Monitoring

Monitor your deployment:

1. **Cloudflare Analytics**: Track page views and performance
2. **Function Logs**: Monitor API route execution
3. **Error Tracking**: Set up alerts for API failures

## Security

1. **API Keys**: Store sensitive keys as encrypted environment variables
2. **CORS**: APIs are configured with appropriate CORS headers
3. **Rate Limiting**: Consider implementing rate limiting for public APIs

## Support

For deployment issues:
1. Check Cloudflare Pages documentation
2. Review function logs in Cloudflare dashboard
3. Test API endpoints individually
