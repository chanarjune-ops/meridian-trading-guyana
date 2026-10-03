# Meridian Trading — Guyana Online Store

Responsive e-commerce starter for Meridian Trading using the supplied branding/product photos.

## Run locally
1. Install Node.js 18+.
2. Copy `.env.example` to `.env` and set a strong `ADMIN_PASSWORD`.
3. Run `npm start`.
4. Open `http://localhost:3000`.
5. Admin: `http://localhost:3000/admin.html`.

## Live deployment
Deploy the folder to a Node-capable host. Put secrets in the host's environment variables, not in source files. Use HTTPS and a real database for production.

## Payments
The UI supports Cash on Delivery, MMG, WiPay/card, bank/local payment and Western Union as checkout choices. Live MMG/WiPay processing requires the merchant account credentials and provider onboarding. Do not collect card details on Meridian Trading's own pages; use the provider's hosted checkout/API.

MMG merchant services: https://mmg.gy/business/
MMG checkout docs: https://developer.mmg.gy/assets/checkout-api.pdf
WiPay Guyana API docs: https://docs.wipayfinancial.com/payments-api

The current backend stores products/orders in JSON as a starter. For production, move these tables to PostgreSQL/Supabase or another managed database and add staff roles, audit logs, image uploads, inventory locking, delivery zones, refunds and payment webhooks.
