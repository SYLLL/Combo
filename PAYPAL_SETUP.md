# PayPal Integration Setup Guide

## Environment Variables Required

Add these environment variables to your `.env` file:

```bash
# PayPal Configuration
# Get these from your PayPal Developer Dashboard: https://developer.paypal.com/

# PayPal Client ID (Live for production - RECOMMENDED)
PAYPAL_CLIENT_ID_LIVE=your_live_client_id_here
PAYPAL_CLIENT_SECRET_LIVE=your_live_client_secret_here

# PayPal Client ID (Sandbox for development/testing)
PAYPAL_CLIENT_ID_SANDBOX=your_sandbox_client_id_here
PAYPAL_CLIENT_SECRET_SANDBOX=your_sandbox_client_secret_here

# Business Account Email (where payments will be sent)
PAYPAL_BUSINESS_EMAIL=suyiliu561@gmail.com

# Webhook URL (for production, this should be your actual domain)
PAYPAL_WEBHOOK_URL=https://your-domain.com/api/paypal/webhook
```

## Frontend Environment Variables

For the React app, add these to your `.env` file:

```bash
# PayPal Client IDs for frontend (Vite uses VITE_ prefix)
VITE_PAYPAL_CLIENT_ID_LIVE=your_live_client_id_here
VITE_PAYPAL_CLIENT_ID_SANDBOX=your_sandbox_client_id_here
```

## Setup Steps

1. **Create PayPal Developer Account**
   - Go to https://developer.paypal.com/
   - Sign in with your PayPal account (suyiliu561@gmail.com)
   - Create a new application

2. **Get Sandbox Credentials**
   - In the Developer Dashboard, create a new app
   - Choose "Sandbox" environment
   - Copy the Client ID and Client Secret
   - Add them to your `.env` file

3. **Get Live Credentials (for production)**
   - Switch to "Live" environment in PayPal Developer Dashboard
   - Create a new app for production
   - Copy the Client ID and Client Secret
   - Add them to your `.env` file

4. **Configure Webhook (for production)**
   - In PayPal Developer Dashboard, go to your app settings
   - Add webhook URL: `https://your-domain.com/api/paypal/webhook`
   - Select events: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`

## Testing

- Use PayPal Sandbox for testing
- Create test accounts at https://www.sandbox.paypal.com/
- Test payments will not charge real money

## Production Deployment

- Update environment variables to use live credentials
- Ensure webhook URL is accessible from the internet
- Test with small amounts first
