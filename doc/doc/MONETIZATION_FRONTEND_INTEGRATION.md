# Monetization — frontend integration guide

Technical reference for **calling the monetization APIs from the admin console** (or another React app using the same patterns). For the **product walkthrough** (tabs, steps, troubleshooting), see **[MONETIZATION_PAYOUT_DOCUMENTATION.md](./MONETIZATION_PAYOUT_DOCUMENTATION.md)**. For **exact HTTP contracts and server behaviour**, see **`backend/doc/MONETIZATION_PAYOUT_API.md`**.

---

## 1) Base URL and transport

- **Config:** `console/src/utils/config.ts` → `config.api.baseUrl` (typically `import.meta.env.VITE_API_BASE_URL` with `/api/v1` suffix).
- **HTTP helper:** `console/src/utils/apiUtils.ts` — **`apiRequest<T>(path, options)`** where `path` is **relative to the base URL** (e.g. `"/monetization/payout/status"`).
- **Auth:** Pass the user’s JWT. `apiRequest` attaches **`Authorization: Bearer <token>`** from Redux (`state.user.accessToken`) when available — same as other console modules.
- **Envelope:** Backend returns `{ statusCode, message, data }`. Hooks compare `statusCode` and read `data`.

```ts
import { apiRequest, ApiException } from "../utils/apiUtils";

// Example (pattern used in hooks)
const res = await apiRequest<MyResponse>("/monetization/payout/status", {
  method: "GET",
});
if (res.statusCode === 200 && res.data) {
  // use res.data
}
```

**Errors:** Non-OK HTTP responses throw **`ApiException`** with `statusCode` and `message`. Hooks often catch and set local error strings.

---

## 2) File map (console)

| Concern | Path |
|--------|------|
| Page (tabs: Payout setup, Bank & documents, Withdraw) | `src/pages/monetization/Monetization.tsx` |
| Withdraw tab only | `src/pages/monetization/MonetizationWithdrawTab.tsx` |
| Payout onboarding data hook | `src/hooks/useMonetizationPayout.ts` |
| Withdrawals / wallet hook | `src/hooks/useCreatorWithdrawals.ts` |
| Payout TypeScript types | `src/interfaces/monetizationPayout.ts` |
| Withdrawal TypeScript types | `src/interfaces/creatorWithdrawal.ts` |
| Route | `src/routes/AppRoutes.tsx` — path **`/monetization`** |

**Document uploads (KYC / bank):** Files go through your existing **S3** flow (e.g. `POST /api/v1/s3-files`); the monetization APIs only receive **`…_s3_file_id`** UUIDs. See the product doc §prerequisites and billing docs if uploads return `402`.

---

## 3) `useMonetizationPayout`

**Token:** Reads `accessToken` from Redux; if missing, `loadStatus` clears data and sets a sign-in error.

| Method / state | Role |
|----------------|------|
| `loadStatus()` | `GET /monetization/payout/status` → sets `status` (`MonetizationPayoutStatusResponse`). |
| `saveKyc(body)` | `PUT /monetization/payout/kyc` with JSON body; on success calls `loadStatus()` and sets `successMessage`. |
| `saveBank(body)` | `PUT /monetization/payout/bank`; on success `loadStatus()` + success copy. |
| `syncRazorpay(account_number)` | `POST /monetization/payout/sync-razorpay` with `{ account_number }`; on success sets `status` from response. |
| `status` | `kyc`, `bank`, `razorpay_configured`, `ready_for_payout_sync`. |
| `statusLoading`, `statusError` | Initial load. |
| `kycSaving`, `bankSaving`, `syncing` | Per-action busy flags. |
| `actionError`, `setActionError` | Mutations / sync errors. |
| `successMessage`, `clearSuccess` | User-facing confirmation strings. |

**`saveKyc` body (matches backend Joi):**

- `legal_name`, `pan_number` (required)
- `date_of_birth?`, `id_proof_s3_file_id?` (optional)

**`saveBank` body:**

- `account_holder_name`, `ifsc`, `account_number` (required)
- `bank_name?`, `bank_statement_s3_file_id?` (optional)

---

## 4) `useCreatorWithdrawals`

**Token:** Same Redux `accessToken` pattern.

**Constants (re-export for other screens):**

- **`CREATOR_WITHDRAWALS_DEFAULT_PAGE_SIZE`** — `5` (default page size used by **`MonetizationWithdrawTab`**).
- **`WithdrawalListReload`** — `{ page: number; pageSize: number }` passed into mutations so the history list refreshes the correct page.

| Method / state | Role |
|----------------|------|
| `loadBalance()` | `GET /monetization/withdrawals/balance` → `balance`. |
| `loadList(page, pageSize?)` | `GET /monetization/withdrawals?page=&pageSize=` → `list` (withdrawals + pagination). Default `pageSize` is **`CREATOR_WITHDRAWALS_DEFAULT_PAGE_SIZE`**. |
| `requestWithdrawal(amount, reload?)` | `POST /monetization/withdrawals` with `{ requested_amount_inr }`. On **201**, refreshes balance + `loadList(reload.page, reload.pageSize)`. Default `reload` is `{ page: 1, pageSize: CREATOR_WITHDRAWALS_DEFAULT_PAGE_SIZE }`. If response row is **`failed`** with **`failure_reason`**, sets **`error`** so the UI shows backend message (e.g. missing `RAZORPAY_PAYOUTS_ACCOUNT_NUMBER`). |
| `cancelWithdrawal(id, reload)` | `POST /monetization/withdrawals/:id/cancel` (body `{}`). Refreshes with `reload`. |
| `modifyWithdrawal(id, amount, reload)` | `PATCH /monetization/withdrawals/:id` with `{ requested_amount_inr }`. Refreshes with `reload`; on **failed** row after response, may set **`error`** from `failure_reason`. |
| `balance`, `list` | Typed per `creatorWithdrawal` interfaces. |
| `balanceLoading`, `listLoading`, `submitting` | Loading flags. |
| `actionWithdrawalId` | Non-null while cancel/modify in flight (row-level disable). |
| `error`, `setError` | Global alert string for the tab. |

**Typical pagination integration:** Keep `historyPage` and `historyPageSize` in the page component; derive `listReload = { page: historyPage, pageSize: historyPageSize }` and pass into `cancelWithdrawal` / `modifyWithdrawal`. After a **successful new withdrawal**, set page to **`1`** and call `requestWithdrawal(amount, { page: 1, pageSize: historyPageSize })` so the list matches.

---

## 5) TypeScript types (console)

- **`src/interfaces/monetizationPayout.ts`** — `CreatorPayoutKycPublic`, `CreatorPayoutBankPublic`, `MonetizationPayoutStatusResponse`, `MonetizationPayoutApiResponse<T>`.
- **`src/interfaces/creatorWithdrawal.ts`** — `CreatorWithdrawalBalance`, `CreatorWithdrawalRow`, `CreatorWithdrawalsListData`, `CreatorWithdrawalApiResponse<T>`.

Align field names with the backend public DTOs (see backend doc). Status enums are duplicated in the frontend for compile-time safety.

---

## 6) Environment (console)

| Variable | Use |
|----------|-----|
| `VITE_API_BASE_URL` | API origin including `/api/v1` (or whatever `config.ts` expects). |
| `VITE_RAZORPAY_KEY_ID` | **Checkout / client-side Razorpay** only — **not** used for payout onboarding HTTP calls (those are server-side with secret). |

Do **not** put Razorpay **secret** in the console.

---

## 7) Extending or reusing this module

1. **New screen:** Instantiate the same hooks; ensure the app wrapper provides Redux **`accessToken`** after login.
2. **New fields:** Add backend validation + types first, then extend `interfaces/*.ts` and hook bodies.
3. **Webhooks:** Configured only on the **server**; the console does not receive Razorpay payout webhooks.
4. **Testing:** Use the same paths as in **`backend/doc/MONETIZATION_PAYOUT_API.md`** with `curl` or Postman; the console is a thin `apiRequest` client.

---

## 8) Related documentation

| Doc | Focus |
|-----|--------|
| [MONETIZATION_PAYOUT_DOCUMENTATION.md](./MONETIZATION_PAYOUT_DOCUMENTATION.md) | UX, tabs, step-by-step, troubleshooting |
| `backend/doc/MONETIZATION_PAYOUT_API.md` | Full REST reference, webhook path, env vars |
| `backend/doc/CREATOR_EARNINGS.md` | Gross earnings math for wallet |
| [BILLING_SYSTEM_END_TO_END_DOCUMENTATION.md](./BILLING_SYSTEM_END_TO_END_DOCUMENTATION.md) | Locks affecting uploads |

---

*Aligned with `useMonetizationPayout.ts`, `useCreatorWithdrawals.ts`, and `MonetizationWithdrawTab.tsx` pagination defaults.*
