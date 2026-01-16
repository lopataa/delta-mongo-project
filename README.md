# schoolshop :3

"Little paws, big progress."

## setup

requirements:
- Docker
- Docker Compose

1) copy the backend env example and fill in Stripe settings:
   `cp backend/.env.example backend/.env`
2) start the stack:
   `docker compose up --build`
3) open the app:
   - frontend: http://localhost:3000
   - backend: http://localhost:5050/api

## admin auth

> default admin password `schoolshop-admin`

(override with `ADMIN_TOKEN` in `.env` or in `docker-compose.yml`.)

## Stripe env

The backend requires Stripe env values in `.env`:
- `STRIPE_SECRET_KEY` (required)
- `STRIPE_SUCCESS_URL` (required, must include `{CHECKOUT_SESSION_ID}`)
- `STRIPE_CANCEL_URL` (required)
- `STRIPE_CURRENCY` (optional, default `usd`)

Example file: `.env.example`

## Stripe test cards

- `4242 4242 4242 4242` (Visa, payment succeeds)
- `4000 0000 0000 9995` (Visa, payment is declined)
- `4000 0000 0000 0341` (Visa, requires 3D Secure)

Use any future expiry date, any 3-digit CVC.
