# Monetization & Razorpay payout onboarding — documentation

This document describes the **creator monetization** experience in the admin console: **KYC**, **bank details**, **document uploads**, **Razorpay payout registration** (contact + fund account), and **withdrawals** (wallet balance, fees, requests). It aligns with `console/src/pages/monetization/Monetization.tsx`, `MonetizationWithdrawTab.tsx`, and `/api/v1/monetization`.

**Frontend integration (hooks, `apiRequest`, types, pagination):** see **[MONETIZATION_FRONTEND_INTEGRATION.md](./MONETIZATION_FRONTEND_INTEGRATION.md)**. **Backend API contracts:** `backend/doc/MONETIZATION_PAYOUT_API.md`.

---

## 1) Goals

| Goal | Description |
|------|-------------|
| **Identity** | Collect legal name, PAN, optional DOB, and an identity proof file for payout compliance. |
| **Bank** | Collect beneficiary bank account metadata and a bank statement file. |
| **Razorpay** | Register the creator as a **payout beneficiary** via Razorpay **Contacts** and **Fund accounts** APIs. |
| **Security** | Full bank account number is **not** stored on the server; only last four digits and a fingerprint. Full number is sent to Razorpay only during the explicit verify step. |

---

## 2) Console UI structure

### 2.1 Page

- **Route / file:** `console/src/pages/monetization/Monetization.tsx`
- **Hook:** `console/src/hooks/useMonetizationPayout.ts`
- **Types:** `console/src/interfaces/monetizationPayout.ts`

### 2.2 Main tabs

| Tab | Purpose |
|-----|---------|
| **Payout setup** | Primary workflow: stepper + forms for KYC, bank, and Razorpay verify. |
| **Bank & documents** | Read-only style summary: KYC/bank chips, Razorpay IDs, timestamps, and **Drive document** rows (ID proof, bank statement) with refresh / open download. |
| **Withdraw** | Wallet summary (gross earnings, reserved, available), fee preview (10% platform + 18% GST on requested amount), submit withdrawal, history table, disclaimers. |

### 2.3 Stepper labels (Payout setup)

The horizontal stepper shows three phases (completion is driven by API status, not only navigation):

1. **KYC & identity**
2. **Bank & statement**
3. **Verify with Razorpay**

---

## 3) End-to-end steps (operator checklist)

Follow these in order. Each step lists **what to enter** and **what happens on the server**.

### Prerequisites

- User is **signed in** with a valid JWT.
- **Profile** includes **email** and **phone** (required for Razorpay contact creation on sync).
- **Drive (S3) uploads** work for the user (upload uses `POST /api/v1/s3-files` with field `file`). If billing lock blocks writes, uploads may fail until billing is resolved.
- **Backend** has Razorpay **key id** and **secret** configured (see §6).

---

### Step 1 — KYC & identity (tab: *Payout setup*)

| # | Action | User input | Server / notes |
|---|--------|------------|----------------|
| 1.1 | Fill legal name | **Legal name** (as per PAN) | Stored on `creator_payout_kyc.legal_name`. |
| 1.2 | Fill PAN | **PAN** (`ABCDE1234F`) | Validated; stored uppercase. API returns **masked** PAN only. |
| 1.3 | Optional DOB | **Date of birth** | Optional `YYYY-MM-DD`. |
| 1.4 | Upload ID proof | **File** (PDF or image) | Uploaded to Drive; response gives **S3 file UUID**. Must click **Save KYC** so `id_proof_s3_file_id` is persisted. |
| 1.5 | Save | **Save KYC** | `PUT /monetization/payout/kyc`. If ID proof is linked: status **`submitted`**; else **`draft`**. |

**Statuses (KYC):** `draft` → `submitted` → (after Razorpay sync) `verified`, or `rejected` if you extend admin rejection with `rejection_reason`.

---

### Step 2 — Bank & statement (tab: *Payout setup*)

| # | Action | User input | Server / notes |
|---|--------|------------|----------------|
| 2.1 | Account holder | **Account holder name** | Must match bank records as appropriate for your policy. |
| 2.2 | IFSC | **IFSC** (11 chars, e.g. `HDFC0001234`) | Normalized uppercase. |
| 2.3 | Account number | **Full account number** (9–18 digits) | Used to compute **last4** + **fingerprint**; full number **not** stored. Changing account/IFSC clears Razorpay linkage until re-sync. |
| 2.4 | Optional bank name | **Bank name** | Optional. |
| 2.5 | Upload statement | **Bank statement** file | Same Drive upload flow; then **Save bank details**. |
| 2.6 | Save | **Save bank details** | `PUT /monetization/payout/bank`. Status typically **`submitted`** (or **`active`** if unchanged after prior success). |

**Statuses (bank):** `draft` → `submitted` → `razorpay_pending` (during sync) → **`active`** on success, or **`failed`** with `sync_error`.

---

### Step 3 — Verify with Razorpay (tab: *Payout setup*)

| # | Action | User input | Server / notes |
|---|--------|------------|----------------|
| 3.1 | Confirm account number | **Full account number again** | Must match **same** account as step 2 (last four checked). |
| 3.2 | Run sync | **Create contact & fund account** | `POST /monetization/payout/sync-razorpay` with `{ "account_number": "..." }`. Creates **Contact** (`POST /v1/contacts`) and **Fund account** (`POST /v1/fund_accounts`). On success: KYC → **`verified`**, bank → **`active`**. |

**Why re-enter the account number?** The API does not retain the full number; Razorpay requires it once to create the fund account.

**When the step shows “complete”:** If KYC is `verified` and bank is `active`, the form is **disabled** — no further input.

---

### Step 4 — Review documents (tab: *Bank & documents*)

| # | Action | Notes |
|---|--------|--------|
| 4.1 | Inspect chips | KYC and bank status chips mirror **Payout setup**. |
| 4.2 | Razorpay IDs | Shows `razorpay_contact_id`, `razorpay_fund_account_id`, fund status when present. |
| 4.3 | Document rows | **Identity proof** and **Bank statement**: load metadata, open pre-signed URL in a new tab. |

This tab does **not** replace saving in **Payout setup**; it is for **verification and audit** after data exists.

---

## 4) Backend API reference

**Base URL:** same as other console calls — `VITE_API_BASE_URL` (e.g. `http://localhost:8080/api/v1`).

All routes require **`Authorization: Bearer <access_token>`**.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/monetization/payout/status` | Combined snapshot: `kyc`, `bank`, `razorpay_configured`, `ready_for_payout_sync`. |
| `PUT` | `/monetization/payout/kyc` | Upsert KYC (Joi-validated body). |
| `PUT` | `/monetization/payout/bank` | Upsert bank (full account number in body; only last4 stored). |
| `POST` | `/monetization/payout/sync-razorpay` | Body: `{ "account_number": "<digits>" }`. Calls Razorpay. |

**Backend files (reference):**

- Routes: `backend/src/routes/monetizationPayout.routes.ts`
- Service: `backend/src/services/monetizationPayout.service.ts`
- Models: `backend/src/models/creatorPayoutKyc.model.ts`, `creatorPayoutBank.model.ts`
- Validation: `backend/src/validation/monetizationPayout.validation.ts`

**Swagger:** Tag **Monetization** (when `/api-docs` includes these routes).

---

## 5) Response shapes (console)

The console expects the standard envelope:

```json
{
  "statusCode": 200,
  "message": "…",
  "data": { }
}
```

**`GET .../status` → `data`:**

- `kyc`: nullable object with `pan_masked`, `status`, `id_proof_s3_file_id`, etc.
- `bank`: nullable object with `account_number_last4`, `status`, `razorpay_contact_id`, `razorpay_fund_account_id`, `sync_error`, etc.
- `razorpay_configured`: boolean (server keys present).
- `ready_for_payout_sync`: boolean (documents + bank saved; not failed; keys configured).

---

## 6) Environment variables

### Backend (secrets — never commit)

| Variable | Role |
|----------|------|
| `RAZORPAY_KEY_ID` or `RAZORPAY_LIVE_API_KEY` | Razorpay key id |
| `RAZORPAY_KEY_SECRET` or `RAZORPAY_LIVE_KEY_SECREAT` | Razorpay secret |

Configured in `backend/src/config/env.config.ts` (aliases merged into `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` for the app).

### Console (publishable only)

| Variable | Role |
|----------|------|
| `VITE_RAZORPAY_KEY_ID` | Used by **checkout** UIs; **not** used for payout API calls (those are server-side). |

**Do not** put Razorpay **secret** in `console/.env`.

---

## 7) Status reference

### KYC (`creator_payout_kyc.status`)

| Value | Meaning in UI |
|-------|------------------|
| `draft` | Saved without required ID proof link, or incomplete. |
| `submitted` | ID proof linked and saved; awaiting Razorpay sync for `verified`. |
| `verified` | Set after **successful** Razorpay sync in current implementation. |
| `rejected` | Optional manual/admin path; `rejection_reason` shown if set. |

### Bank (`creator_payout_bank.status`)

| Value | Meaning in UI |
|-------|------------------|
| `draft` | Not meaningfully used if user saved once; treat as early. |
| `submitted` | Bank row saved; Razorpay verify not done or pending retry. |
| `razorpay_pending` | Sync in progress / transitional. |
| `active` | Fund account created; payout beneficiary registered. |
| `failed` | Razorpay error; `sync_error` explains; fix and retry. |

---

## 8) Troubleshooting

| Symptom | Likely cause | What to do |
|---------|----------------|------------|
| Upload fails | Billing lock, auth, or network | Check `402` / JWT; confirm Drive upload works elsewhere. |
| Sync: phone/email error | Missing profile fields | Add phone + email on user profile, retry. |
| Sync: Razorpay error text | Product not enabled, invalid keys, or validation | Check Razorpay dashboard (Payouts / RazorpayX eligibility), test vs live keys. |
| `reference_id` length error | (Fixed in backend) use `userId` only (≤40 chars with UUID). | Update backend if on old revision. |
| “Confirm account number” mismatch | Different number than saved in step 2 | Re-save bank with correct number, or type same full number as step 2. |
| Step 3 disabled | `ready_for_payout_sync` false | Ensure both documents uploaded **and** KYC + bank **saved**; bank not `failed`; server keys set. |

---

## 9) Creator withdrawals & wallet

### 9.1 Flow

1. **Gross earnings** come from the same aggregation as **`GET /api/v1/payments/creator-earnings`** (course sales where `courses_ids` overlaps courses you own; billing settlement rows excluded). See `backend/doc/CREATOR_EARNINGS.md`.
2. **Reserved balance** = sum of `requested_amount_inr` for withdrawals in **`pending`**, **`processing`**, or **`completed`**.
3. **Available** = `gross_earnings_inr - reserved_total_inr` (never negative).
4. Submitting a new request **increases reserved** by the requested amount, so **available drops immediately** even before bank transfer.
5. **Payout profile** must be ready (**KYC `verified`** and **bank `active`**) before `POST /monetization/withdrawals` is allowed.

### 9.2 Fees (policy constants)

| Deduction | Rate | Applied to |
|-----------|------|------------|
| Platform fee | **10%** | Requested withdrawal amount |
| GST | **18%** | Requested withdrawal amount |

**Net to creator** = `requested - platform_fee - gst` (rounded to 2 decimals). Disclaimers in API and UI state this is **not tax/legal advice**.

### 9.3 Settlement messaging

Creators see a **T+7 calendar-day** settlement estimate from the request date (`expected_settlement_at`). Actual timing depends on **Razorpay** and **bank** processing (business days, holidays, product limits). Align ops with your Razorpay payout product.

### 9.4 API (authenticated)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/monetization/withdrawals/balance` | `gross_earnings_inr`, `reserved_total_inr`, `available_inr`, `payout_profile_ready`, fee %, settlement copy, disclaimers. |
| `GET` | `/monetization/withdrawals` | Paginated list (`page`, `pageSize`). |
| `POST` | `/monetization/withdrawals` | Body: `{ "requested_amount_inr": number }` (min ₹100). Creates row `pending`, calls Razorpay **`POST /v1/payouts`** (net amount in paise, `reference_id` = withdrawal id), then sets `processing` / `completed` / `failed` from the response. `expected_settlement_at` = now + 7 days (policy copy). |

**Backend:** `creatorWithdrawal.model.ts`, `creatorWithdrawal.service.ts`, `creatorWithdrawal.controller.ts`, routes in `monetizationPayout.routes.ts`. **Wallet gross** helper: `getCreatorEarningsWalletTotals` in `payment.service.ts`.

### 9.5 Razorpay payout execution

**Automation:** The backend calls Razorpay payouts immediately after insert (requires **`RAZORPAY_PAYOUTS_ACCOUNT_NUMBER`** = your RazorpayX source account). **Status updates** (`processing` → `completed` / `failed`) are driven by **webhooks** — register in Razorpay Dashboard: **`POST /api/v1/monetization/webhooks/razorpay-payouts`** with events such as `payout.processed`, `payout.failed`, `payout.reversed`, `payout.updated`. Set **`RAZORPAY_PAYOUT_WEBHOOK_SECRET`** for `X-Razorpay-Signature` verification (raw body, same pattern as the Stripe webhook). No manual status step is required once this is configured.

### 9.6 Console files

- `console/src/pages/monetization/MonetizationWithdrawTab.tsx`
- `console/src/hooks/useCreatorWithdrawals.ts`
- `console/src/interfaces/creatorWithdrawal.ts`

---

## 10) Product / compliance note

This module **registers** the beneficiary with Razorpay and **records withdrawal requests**. **Moving money** (Razorpay payouts, settlements, compliance) must match your production process. Fee percentages and T+7 copy are **policy defaults** for transparency and can be centralized in `creatorWithdrawal.service.ts` if you change them.

---

## 11) Related documentation

- **Frontend hooks & integration:** [MONETIZATION_FRONTEND_INTEGRATION.md](./MONETIZATION_FRONTEND_INTEGRATION.md)
- **Backend API (routes, webhook, env):** `backend/doc/MONETIZATION_PAYOUT_API.md`
- Billing and locks (upload write access): `console/src/doc/BILLING_SYSTEM_END_TO_END_DOCUMENTATION.md`
- Backend CRUD checklist: `backend/doc/NEW_ENDPOINT_CRUD_FLOW.md`
- Backend layout index: `backend/doc/structure.md`
- Creator earnings aggregation: `backend/doc/CREATOR_EARNINGS.md`

---

*Last aligned with console monetization: tabs Payout setup, Bank & documents, **Withdraw**; Razorpay onboarding + withdrawal wallet APIs.*
