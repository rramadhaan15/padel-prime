# Padel Court Booking Platform Specification

Status: ready-for-agent

## Problem Statement

Padel enthusiasts face significant frustration when attempting to reserve courts at sports clubs. Availability information is fragmented across informal channels like WhatsApp chats or manual phone calls, leading to double-booked courts, delayed confirmations, and uncertainty about equipment availability. When plans shift, resolving schedule changes requires manual negotiation with venue personnel.

At the same time, club operators struggle with operational chaos. Stated court availability on manual spreadsheets frequently falls out of sync with actual arrivals. Prime-time slots risk being monopolized or held hostage without payment, while last-minute cancellations leave courts idle with zero recourse. Staff members must simultaneously manage walk-ins, equipment rentals, payment verifications, and on-site check-ins without a unified source of truth.

## Solution

A responsive, high-integrity booking platform for a single-venue padel club that operates on discrete, fixed schedule slots and a robust concurrency model:

1. **Deterministic Inventory & Fast Checkout**: Customers view real-time court availability across morning, evening, and weekend time bands within a rolling 7-day window. A frictionless checkout flow identifies customers via their WhatsApp number and phone without requiring tedious prior account registration.
2. **Pessimistic Hold with Zero Double-Booking**: Selecting a slot initiates a 10-minute temporary lock backed by a distributed locking mechanism. An automated background worker combined with active payment inquiry guarantees that expired holds are released promptly without conflicting with late payment webhooks.
3. **Integrated Add-on Equipment Management**: Customers can bundle racket rentals and ball purchases directly into their booking, bound by a time-bucket equipment pool that enforces strict per-slot rental caps so on-site physical stock never runs out.
4. **Reschedule-Only Self-Service**: Customers can modify confirmed bookings up to 24 hours prior to game time. Asymmetrical price adjustments ensure that moving to a higher-tier time band requires an instant delta payment, while downgrades forfeit the difference, entirely eliminating cash refunds.
5. **Streamlined Operations & Check-in**: Automated dual-channel dispatch delivers digital tickets with QR codes via WhatsApp and official PDF invoices via email. Staff members validate customer arrival at the venue via a camera QR scanner or phone lookup, while un-checked-in slots automatically transition to no-show status post-session.

## User Stories

1. As a Customer, I want to view a real-time availability calendar of all Courts at the Venue, so that I can see which Schedule Slots are open, held, or booked.
2. As a Customer, I want to filter the schedule by date within a rolling 7-day Advance Window, so that I can plan my upcoming games without encountering unreleased dates.
3. As a Customer, I want to see clear pricing for each Schedule Slot based on its Time Band (Regular vs. Peak) and Court type (Indoor vs. Outdoor), so that I know the exact cost before reserving.
4. As a Customer, I want selecting a Schedule Slot to place an immediate 10-minute Slot Hold on that slot, so that no other customer can book it while I complete my details.
5. As a Customer, I want to see a live 10-minute countdown timer on the checkout screen, so that I know how much time remains before my Slot Hold expires.
6. As a Customer, I want to provide my Name, Email, and WhatsApp number during checkout without creating a password or registering an account, so that I can complete my booking with minimal friction.
7. As a Customer, I want to add racket rentals and ball purchases as Add-ons during checkout, so that my equipment is guaranteed and prepared before I arrive at the Venue.
8. As a Customer, I want the system to restrict my racket rental Add-ons to a maximum of 4 rackets per Schedule Slot, so that I do not accidentally over-rent equipment for a single court.
9. As a Customer, I want to see an out-of-stock indicator when the Venue's Equipment Pool for my chosen time slot is exhausted, so that I am not charged for unavailable rental gear.
10. As a Customer, I want to pay for my Booking and Add-ons using a dynamic QRIS code, so that I can instantly complete the transaction from my preferred banking or e-wallet application.
11. As a Customer, I want the option to pay via Virtual Account (BCA or Mandiri), so that I can execute higher-value transactions without e-wallet balance limits.
12. As a Customer, I want to receive immediate on-screen payment confirmation once the payment gateway settles the transaction, so that I know my Booking is confirmed.
13. As a Customer, I want to receive a Ticket containing a secure QR code and booking summary directly via WhatsApp, so that I have offline-accessible entry proof on my mobile device.
14. As a Customer, I want to receive an itemized invoice and backup copy of my Ticket via Email, so that I have a formal receipt for corporate reimbursement and record-keeping.
15. As a Customer, I want to view a self-service Reschedule link on my digital Ticket, so that I can shift my game time if my schedule changes.
16. As a Customer, I want the system to permit Reschedule requests only when submitted at least 24 hours prior to the original Schedule Slot (before the Reschedule Cutoff), so that the club's inventory remains protected.
17. As a Customer, I want to be informed that cash refunds are not supported, so that I understand all booking adjustments must be resolved via Reschedule.
18. As a Customer, I want to be prompted to pay a Price Adjustment via instant QRIS if I Reschedule to a higher-priced Time Band, so that my new slot is secured upon settling the difference.
19. As a Customer, I want to be clearly notified that moving to a lower-priced Time Band forfeits the price difference without cash back, so that I can decide whether to proceed with the change.
20. As a Customer, I want to present my Ticket QR code to Staff upon arriving at the Venue, so that my check-in is verified in seconds.
21. As a Staff member, I want to access a secure operational dashboard, so that I can monitor daily Schedule Slot occupancy and revenue across all Courts.
22. As a Staff member, I want to scan a Customer's Ticket QR code using a tablet or mobile device camera, so that I can complete their Check-in instantly.
23. As a Staff member, I want to look up a Customer's Booking by their WhatsApp number or Name, so that I can perform Check-in if their mobile device runs out of battery.
24:24. As a Staff member, I want to manually reserve a Schedule Slot for walk-in or telephone bookings, so that off-platform reservations are accurately reflected in the system.
25:25. As a Staff member, I want to apply a Slot Block to any Schedule Slot, so that courts undergoing routine maintenance or hosting internal club tournaments cannot be reserved by the public.
26:26. As a Staff member, I want to remove an active Slot Block when maintenance concludes early, so that the Court becomes immediately available for booking.
27:27. As a Staff member, I want the system to automatically transition confirmed Bookings to No-Show status if Check-in has not occurred by the end of the Schedule Slot, so that attendance reports remain accurate.
28:28. As a Staff member, I want to see a Flagged indicator next to Customer records that have accumulated 3 or more No-Show events, so that I can address attendance reliability.
29:29. As a Staff member, I want to view the real-time allocation of the Equipment Pool across all slots, so that on-site staff can stage the correct number of rackets and balls at the front desk.
30:30. As a Staff member, I want to receive an urgent dashboard notification when a late payment conflict is flagged, so that I can manually contact the Customer and assign an alternative slot.

## Implementation Decisions

### Module Boundaries & Interfaces

The system is organized into six core domain modules:

1. **Inventory & Scheduling Module**:
   - Manages `Court` configurations, discrete `Schedule Slot` intervals, and `Time Band` classifications.
   - Enforces the 7-day rolling `Advance Window`.
   - Exposes queries for court availability grids: `getAvailabilityGrid(venueId, date)`.
   - Exposes staff administrative actions: `blockSlot(slotId, reason)`, `unblockSlot(slotId)`.

2. **Hold & Concurrency Module**:
   - Manages distributed locking and lifecycle transitions for `Slot Hold`.
   - Restricts checkouts to a single Court and Schedule Slot per transaction boundary.
   - Manages hold timers with a 10-minute time-to-live.
   - Coordinates dual-layer expiry: primary delayed worker event and lazy just-in-time check on availability queries.
   - Executes `acquireSlotHold(courtId, slotId, customerId)` and `releaseExpiredHolds()`.

3. **Pricing & Reschedule Engine**:
   - Calculates the authoritative price matrix: `(CourtType, DayType, TimeBand) -> Price`.
   - Computes `Price Adjustment` for `Reschedule` flows:
     - If $\Delta \text{Price} > 0$: creates a pending adjustment transaction requiring instant settlement.
     - If $\Delta \text{Price} \le 0$: confirms slot migration immediately; marks surplus as forfeited.
   - Validates the `Reschedule Cutoff` rule ($T_{\text{now}} \le T_{\text{slot\_start}} - 24\text{ hours}$).

4. **Equipment Pool Module**:
   - Tracks real-time stock of `Add-on` items (rackets, balls) partitioned by discrete time buckets.
   - Enforces a per-slot limit of 4 rackets and validates availability against the venue's total physical inventory pool before granting a hold.
   - Atomically binds Add-on reservations to the corresponding `Slot Hold`.

5. **Payment Gateway Integration & Webhook Handler**:
   - Integrates with the payment provider (Midtrans / Xendit) for dynamic QRIS generation and Virtual Account issuance.
   - Implements idempotent webhook ingestion with signature verification.
   - Implements **Active Payment Inquiry**: queries the payment gateway API before releasing an expired `Slot Hold`. If paid, converts to `Booking`; if unpaid, safely releases inventory.
   - Flags edge-case conflicts (`Overdue_Payment_Conflict`) to staff when a late settlement cannot be resolved.

6. **Notification & Verification Dispatcher**:
   - Coordinates dual-channel delivery: dispatches interactive WhatsApp messages containing the digital `Ticket` and QR code, while dispatching formal invoices via email.
   - Generates and signs tamper-evident QR code payloads containing the `BookingId` and cryptographic verification nonce.
   - Handles the on-site `Check-in` verification interface and automated `No-Show` evaluation worker.

### Technical & Architectural Decisions

- **Full-Stack Monorepo**: Built using Next.js App Router, combining server components for calendar rendering with client components for interactive slot selection and countdown states (ADR 0011).
- **Relational Integrity**: PostgreSQL with Drizzle ORM provides strict ACID guarantees for booking commitments, foreign key references, and financial audit logs (ADR 0011).
- **High-Performance Locking**: Redis manages distributed pessimistic locks (`SET resource_id token NX PX 600000`) and delayed task queues via BullMQ for exact-second hold expirations (ADR 0001, ADR 0005).
- **Asymmetric Reschedule Rule**: No cash refunds; upgrades require payment of difference, downgrades forfeit difference (ADR 0003, ADR 0006).
- **Guest-First Identity**: Phone numbers normalized to E.164 format serve as the primary customer identifier, eliminating registration friction while maintaining historical auditability (ADR 0004).

### State Machine Lifecycle

```
[ AVAILABLE ]
      │
      ├── Customer initiates checkout (10-minute hold acquired)
      ▼
   [ HOLD ] ──────── (10 mins elapsed, Gateway Inquiry = Unpaid) ────────► [ AVAILABLE ]
      │
      ├── Payment confirmed (Webhook or Active Inquiry OK)
      ▼
 [ CONFIRMED ] ◄────── (Reschedule initiated >= H-24 hours) ─────────┐
      │                                                               │
      ├── Customer arrives at venue & QR is scanned                   │
      ▼                                                               │
 [ CHECKED-IN ]                                                       │
      │                                                               │
      ├── Session completes                                           │
      ▼                                                               │
 [ COMPLETED ]                                                        │
                                                                      │
 [ CONFIRMED ] ── (Session elapsed without check-in) ──► [ NO-SHOW ]  │
                                                                      │
                                                (New Slot Reallocated)
```

## Testing Decisions

### What Makes a Good Test

Tests must verify external, observable system behavior across defined boundaries rather than inspecting private state or mock invocations. A test should prove an invariant from a customer's or staff member's perspective (e.g., "slot cannot be reserved by another client while held," "reschedule rejected when under 24 hours to game time," "racket rental capped at 4 units per slot").

### Target Modules & High-Level Testing Seam

All automated tests will be authored against a single, high-level seam: the **HTTP API & Server Action Contract Boundary**.

Using this single high-level seam ensures tests execute complete end-to-end domain logic against real PostgreSQL and Redis instances (via local test containers or test databases) without mocking business rules.

Critical scenarios to cover:

1. **Concurrency & Race Conditions**:
   - Two concurrent hold requests for the exact same `Schedule Slot` must result in exactly one successful `Slot Hold` and one rejected request with a `409 Conflict`.
   - A concurrent hold for the last remaining rackets in the `Equipment Pool` must reject the second request while allowing the court reservation to proceed without the add-on.
2. **Hold Expiry & Active Inquiry**:
   - An unpaid hold past 10 minutes is automatically released and becomes available for new reservations.
   - When hold expiration triggers an active gateway inquiry that returns `settled`, the slot transitions to `Confirmed` rather than being released.
3. **Reschedule Invariants**:
   - Reschedule request submitted 24 hours and 1 minute before game time succeeds.
   - Reschedule request submitted 23 hours and 59 minutes before game time is rejected with a `422 Unprocessable Entity` citing the `Reschedule Cutoff`.
   - Upgrading from Regular to Peak requires paying the calculated `Price Adjustment`.
   - Downgrading from Peak to Regular completes with zero refund and records forfeited amount.
4. **Check-in & No-Show Lifecycle**:
   - Scanning a valid Ticket QR code transitions status to `Checked-In`.
   - Scanning an already-checked-in or expired ticket returns an error.
   - A background sweep transitions past-due unchecked bookings to `No-Show` and increments the customer's no-show count.

## Out of Scope

- **Multi-Tenant SaaS / Marketplace**: No support for independent external venues; all features serve a single club entity.
- **Cash Refunds**: No cash or bank transfer refund processing under any circumstance.
- **Multi-Court Cart Checkout**: Customers cannot bundle multiple courts into a single public checkout transaction.
- **Custom Game Durations**: Durations are strictly constrained to predefined fixed schedule slots (no arbitrary 45-minute or custom start times).
- **Native Mobile Apps (iOS/Android)**: System operates entirely as a responsive web application optimized for mobile browsers.
- **Internal League / Ladder Management**: Tournament brackets, ranking points, and match matchmaking are handled outside this booking platform.

## Further Notes

- **QR Code Security**: Ticket QR codes will encode a signed JWT containing the `booking_id`, `court_id`, `slot_time`, and a cryptographic HMAC-SHA256 signature to prevent spoofing or screenshot sharing among unauthorized parties.
- **WhatsApp Webhook Fallback**: In the event of WhatsApp message delivery degradation, the customer can always view their digital Ticket on the web confirmation page or access it via the transactional email backup.
