# Billing System End-to-End Documentation

This document captures the complete billing implementation across backend and frontend, including pricing, overage computation, checkout/payment flow, invoice generation, reminder emails, 15-day lock behavior, and data contracts.

## 1) Business Rules

- Free-plan resources and rates:
  - Posts: `₹10` per post, free `2`
  - Post Cells: `₹20` per cell, free `15`
  - UIUX Cells: `₹5` per unit, free `150`
  - Courses: `₹900` per course, free `1`
  - Storage (Drive/S3): `₹50` per GB, free `1 GB`
  - Total Memory Size (postcells): `₹20` per MB, free `1 MB`
- Tax: `18% GST`
- Billing lock grace: `15 days`
- Reminder schedule: day `0, 3, 7, 10, 14` after exceed anchor.

## 2) Metric Separation (Critical)

- `Total Memory Size`:
  - Source: sum of `PostCell.memory_size`
  - Unit: bytes (display as MB)
  - Billing resource: `Total Memory Size (MB)`
- `Total Storage`:
  - Source: sum of `S3File.size_bytes` for drive files
  - Unit: bytes (display as KB/MB/GB)
  - Billing resource: `Storage (GB)`

These two metrics are intentionally different and must not be mixed.

## 3) Backend Architecture

### Core policy engine
- File: `backend/src/services/billingPolicy.service.ts`
- Entry: `getBillingStatusForUser(userId)`
- Responsibilities:
  - Collect usage:
    - posts, postcells, uiux, courses
    - storage sum and max file size from S3 files
  - Resolve effective free units:
    - base free units + settlement notes from latest paid payment
  - Build billing line items with:
    - `resource`, `freeUnits`, `consumedUnits`, `overageUnits`, `unitPriceInr`, `amountInr`
  - Compute:
    - `subtotalInr`, `taxInr`, `totalDueInr`
  - Determine exceed anchor and lock:
    - `overdueDays`, `isLocked`, `canModify`
  - Send reminder emails on configured reminder days.

### Write-lock middleware
- File: `backend/src/middleware/billingAccess.middleware.ts`
- Middleware: `enforceBillingWriteAccess`
- Behavior:
  - If billing lock active, blocks create/update/delete with `402`.
  - Admin role bypass supported.

### Analytics totals contract
- Files:
  - `backend/src/services/postCellAnalytics.service.ts`
  - `backend/src/types/postCellAnalytics.ts`
- Endpoint data includes:
  - `totalPostCells`, `totalMemorySize`, `totalUiuxCount`
  - `totalPosts`, `totalCourses`, `totalFiles`
  - `totalStorageBytes`, `maxFileSizeBytes`
  - `billing` object with line items and lock metadata.

### Payment persistence behavior
- File: `backend/src/services/payment.service.ts`
- Behavior:
  - Creates payment record.
  - Settlement flag support:
    - `billing_settlement`
    - `billing_overage_settled`
  - Skips course-enrollment creation for billing settlements.

## 4) Frontend Architecture

### Billing page
- File: `console/src/pages/billing/Billing.tsx`
- Responsibilities:
  - Displays usage cards and free-plan matrix.
  - Uses backend billing line-item `freeUnits` as effective limits.
  - Builds computed line items and due using:
  - `overage = max(0, consumed - limit)`
  - `amount = overage * unitPrice`
  - `totalDue = subtotal + GST`
  - Shows bill section when any metric exceeds:
    - posts/postcells/memory/uiux/courses/storage.
  - Navigates to checkout with contract:
    - effective limits
    - unit prices
    - billing line items
    - current totals.

### Checkout page
- File: `console/src/pages/billing/checkout.tsx`
- Responsibilities:
  - Uses billing-passed effective limits + pricing (single source of truth).
  - Recalculates line items live on input changes.
  - Subtotal is derived from current adjusted line-item amounts.
  - GST and total derive from subtotal.
  - Passes overage units to payment pages for invoice parity.

### Lock-aware feature pages
- Files:
  - `console/src/hooks/useBillingAccess.ts`
  - `console/src/pages/CreatePost/CreatePost.tsx`
  - `console/src/pages/courses/courses.tsx`
  - `console/src/pages/drive/drive.tsx`
- Behavior:
  - Read billing lock from analytics totals.
  - Disable/guard edit/write actions while locked.

## 5) Payment and Invoice Flow

### Checkout to payment providers
- Files:
  - `console/src/pages/payments/StripeCheckout.tsx`
  - `console/src/pages/payments/RazorpayCheckout.tsx`
- Checkout sends:
  - adjusted absolute values (for limits/settings update where needed)
  - overage values (`ov*`) for exact invoice parity.

### Invoice generation data
- File: `console/src/utils/invoiceGenerator.ts`
- Invoice is built from overage units (not raw totals) to match payable amount.
- Naming aligned with billing resources:
  - `UIUX Cells`
  - `Total Memory Size (MB)`
  - `Storage (GB)`, etc.

### Payment notes for settlements
- Saved notes include:
  - `posts`, `post_cells`, `total_cells`, `courses`, `storage_gb`, `total_memory_mb`
  - settlement flags.
- Backend policy consumes these notes to set effective free units after payment.

## 6) PDF Generation and S3 Upload

- File: `backend/src/utils/invoicePdf.util.ts`
- Uses Puppeteer to render invoice HTML to PDF.
- Browser executable resolution supports:
  - Linux common paths
  - macOS app binary paths
  - Windows common install paths
  - environment override `PUPPETEER_EXECUTABLE_PATH` (validated before use).
- If PDF generation fails:
  - payment record still persists
  - logs error
  - HTML invoice flow continues.

## 7) Exact Calculation Formulas

For each resource:

1. `consumedUnits` from metric source
2. `effectiveLimit` from backend line-item `freeUnits` (or defined fallback)
3. `overageUnits = max(0, consumedUnits - effectiveLimit)`
4. `lineAmount = overageUnits * unitPrice`

Totals:

- `subtotal = sum(lineAmount)`
- `tax = subtotal * 0.18`
- `grandTotal = subtotal + tax`

## 8) Current File Map (Key)

Backend:
- `backend/src/services/billingPolicy.service.ts`
- `backend/src/middleware/billingAccess.middleware.ts`
- `backend/src/services/postCellAnalytics.service.ts`
- `backend/src/services/payment.service.ts`
- `backend/src/types/postCellAnalytics.ts`
- `backend/src/types/payment.ts`
- `backend/src/utils/invoicePdf.util.ts`
- `backend/src/config/email.templetes.ts`

Frontend:
- `console/src/pages/billing/Billing.tsx`
- `console/src/pages/billing/checkout.tsx`
- `console/src/pages/payments/StripeCheckout.tsx`
- `console/src/pages/payments/RazorpayCheckout.tsx`
- `console/src/utils/invoiceGenerator.ts`
- `console/src/interfaces/analytics.ts`
- `console/src/hooks/useBillingAccess.ts`

## 9) Validation Checklist

- [ ] Exceed any one metric and verify bill section appears.
- [ ] Billing and checkout line items show same overage units and prices.
- [ ] Changing any checkout input updates:
  - line-item amount
  - subtotal
  - GST
  - total.
- [ ] After successful payment:
  - payment record saved
  - invoice amount equals checkout payable
  - new effective limits applied on billing view.
- [ ] Reminder emails trigger on configured reminder days.
- [ ] After day 15 overdue, write actions are blocked.

## 10) Operational Notes

- If PDF generation fails with Chrome path issues:
  - confirm `PUPPETEER_EXECUTABLE_PATH` exists on disk
  - or install Chrome/Chromium in standard path.
- Invoice pricing parity depends on overage params (`ov*`) from checkout.
- Keep resource naming consistent across backend and frontend:
  - `UIUX Cells`
  - `Total Memory Size (MB)`
  - `Storage (GB)`.
