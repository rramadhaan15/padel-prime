import { db } from "../db";
import { releaseSlotHold } from "../holds";
import {
  inquirePaymentGateway,
  generateGatewaySignature,
  processPaymentWebhook,
} from "../payments";

export interface ConflictAlert {
  id: string;
  orderId: string;
  holdId: string;
  slotId: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  resolved: boolean;
  createdAt: Date;
}

// In-memory conflict alerts for staff dashboard
const globalForWorker = globalThis as unknown as {
  __padelConflictAlerts?: ConflictAlert[];
};
const conflictAlerts: ConflictAlert[] = globalForWorker.__padelConflictAlerts ?? [];
globalForWorker.__padelConflictAlerts = conflictAlerts;

export function listConflictAlerts(): ConflictAlert[] {
  return [...conflictAlerts];
}

export function resolveConflictAlert(id: string): boolean {
  const alert = conflictAlerts.find((a) => a.id === id);
  if (!alert) return false;
  alert.resolved = true;
  return true;
}

export interface HoldEvaluationResult {
  holdId: string;
  action: "confirmed" | "released" | "conflict";
  message: string;
}

/**
 * Evaluates an expired or expiring hold using Active Payment Inquiry.
 */
export async function evaluateHoldExpiry(holdId: string): Promise<HoldEvaluationResult> {
  const hold = db.getSlotHold(holdId);
  if (!hold) {
    return { holdId, action: "released", message: `Hold ${holdId} does not exist.` };
  }

  if (hold.status !== "active") {
    return { holdId, action: "released", message: `Hold ${holdId} is already ${hold.status}.` };
  }

  const orderId = `PAY-${hold.id}`;
  const inquiry = await inquirePaymentGateway(orderId);

  const slot = db.getScheduleSlot(hold.slotId);

  if (inquiry.isSettled) {
    // Payment was settled!
    if (slot && slot.status === "held") {
      // Slot is still reserved for this hold, convert to Confirmed booking
      const signature = generateGatewaySignature(orderId, "200", inquiry.amount || 0);
      await processPaymentWebhook({
        orderId,
        statusCode: "200",
        grossAmount: inquiry.amount || 0,
        transactionStatus: "settlement",
        signature,
      });

      return {
        holdId,
        action: "confirmed",
        message: "Payment verified as settled during active inquiry. Booking converted to Confirmed.",
      };
    } else {
      // Slot was already taken/booked by another customer! Late payment conflict
      const alert: ConflictAlert = {
        id: `alert-${Date.now()}`,
        orderId,
        holdId: hold.id,
        slotId: hold.slotId,
        customerName: hold.customerName || "Customer",
        customerPhone: hold.customerPhone || "N/A",
        amount: inquiry.amount || 0,
        resolved: false,
        createdAt: new Date(),
      };
      conflictAlerts.push(alert);
      db.updateSlotHold(hold.id, { status: "expired" });

      return {
        holdId,
        action: "conflict",
        message: "Overdue_Payment_Conflict: Payment was settled late but slot is no longer available.",
      };
    }
  }

  // Not settled: safely release the hold and equipment stock back to Available
  await releaseSlotHold(hold.id);
  db.updateSlotHold(hold.id, { status: "expired" });

  return {
    holdId,
    action: "released",
    message: "Hold unpaid after 10 minutes. Resources successfully returned to available pool.",
  };
}

/**
 * Sweep runner that evaluates all active holds that have exceeded their TTL.
 */
export async function runHoldExpirySweep(): Promise<HoldEvaluationResult[]> {
  const expiredHolds = db.listExpiredHolds();
  const results: HoldEvaluationResult[] = [];

  for (const hold of expiredHolds) {
    const res = await evaluateHoldExpiry(hold.id);
    results.push(res);
  }

  return results;
}
