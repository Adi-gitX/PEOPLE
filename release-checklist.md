# PEOPLE Production Release Checklist

## Environment & Secrets
- [ ] `server/.env` production values set for Firebase, Stripe, email provider, and `FRONTEND_URL` allowlist.
- [ ] No development/test keys in production environment.
- [ ] `WITHDRAWAL_PROCESSING_FEE` set intentionally (default is `0`).
- [ ] `VITE_API_URL` points to production API.
- [ ] Optional social links set (`VITE_SOCIAL_GITHUB`, `VITE_SOCIAL_X`, `VITE_SOCIAL_LINKEDIN`) or left unset intentionally.

## Build & Quality Gates
- [ ] `client`: `npm run lint && npm run test && npm run build`
- [ ] `server`: `npm run lint && npm run typecheck && npm run test && npm run build`
- [ ] Confirm no failing CI jobs.

## Core Product Promises
- [ ] 0% platform fee copy and behavior verified (`Landing`, `Pricing`, `FAQ`, `Terms`, escrow/wallet/invoice calculations).
- [ ] No credit card required at signup; payment appears only at escrow funding / withdrawal interactions.
- [ ] Waitlist and newsletter forms submit to real endpoints (`/api/v1/leads/waitlist`, `/api/v1/leads/newsletter`).

## Security Checks
- [ ] Admin access restricted via Firestore role (`users.primaryRole`).
- [ ] CORS allowlist rejects unknown origins.
- [ ] Notification mutate endpoints enforce ownership.
- [ ] Conversation read/send endpoints reject non-participants.
- [ ] Rate limiting active on auth/payment/messaging critical endpoints.

## Connectivity & UX
- [ ] No dead internal links (navbar/footer/cards/buttons/routes).
- [ ] Chat background asset exists (`/grid-pattern.svg`).
- [ ] No fake success actions on core/public forms.
- [ ] Wallet withdraw action performs real API request.

## Post-Deploy Validation
- [ ] Run `scripts/post-deploy-smoke.sh` with `BASE_URL`.
- [ ] Run authenticated checks with `AUTH_TOKEN` for private routes.
- [ ] Manual smoke: signup -> create mission -> apply -> accept/assign -> chat -> wallet.
