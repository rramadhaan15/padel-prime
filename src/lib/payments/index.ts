import crypto from "crypto";
import { db, BookingRecord, PaymentMethod, PaymentStatus } from "../db";
import { RACKET_RENTAL_PRICE, BALL_CAN_PRICE } from "../equipment";

export const PAYMENT_GATEWAY_SERVER_KEY = process.env.PAYMENT_SERVER_KEY || "padel_prime_secret_server_key_2026";

/**
 * Normalizes phone numbers to standard international E.164 format.
 * Defaults to Indonesia (+62) for local 08xx or 8xx numbers.
 */
export function normalizePhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[^0-9+]/g, "");
  if (!cleaned) {
    throw new Error("Phone number cannot be empty.");
  }

  if (cleaned.startsWith("+")) {
    if (cleaned.length < 10 || cleaned.length > 16) {
      throw new Error("Invalid E.164 international phone number format.");
    }
    return cleaned;
  }

  // Indonesian local formats
  if (cleaned.startsWith("0")) {
    return `+62${cleaned.slice(1)}`;
  }
  if (cleaned.startsWith("62")) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith("8")) {
    return `+62${cleaned}`;
  }

  return `+${cleaned}`;
}

/**
 * Generates cryptographic signature for gateway transactions and webhooks.
 * SHA512(orderId + statusCode + grossAmount + serverKey)
 */
export function generateGatewaySignature(
  orderId: string,
  statusCode: string,
  grossAmount: number,
  serverKey = PAYMENT_GATEWAY_SERVER_KEY
): string {
  const raw = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  return crypto.createHash("sha512").update(raw).digest("hex");
}

/**
 * Verifies incoming gateway webhook signature.
 */
export function verifyGatewaySignature(
  orderId: string,
  statusCode: string,
  grossAmount: number,
  signature: string
): boolean {
  if (!signature || typeof signature !== "string") {
    return false;
  }
  const expected = generateGatewaySignature(orderId, statusCode, grossAmount);
  if (Buffer.byteLength(expected) !== Buffer.byteLength(signature)) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export interface PaymentInitiationResult {
  orderId: string;
  holdId: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentDetails: {
    qrisString?: string;
    virtualAccountNumber?: string;
    bank?: string;
    expiryTime: string;
  };
}

// In-memory simulated gateway ledger for inquiry and webhooks
const gatewayLedger = new Map<string, { status: "pending" | "settled" | "expired"; amount: number }>();

export function getGatewayLedgerEntry(orderId: string) {
  return gatewayLedger.get(orderId);
}

export function setGatewayLedgerStatus(orderId: string, status: "pending" | "settled" | "expired") {
  const entry = gatewayLedger.get(orderId);
  if (entry) {
    entry.status = status;
  }
}

/**
 * Initiates payment transaction with payment gateway.
 */
export async function createPaymentTransaction(params: {
  holdId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
}): Promise<PaymentInitiationResult> {
  const { holdId, customerName, customerEmail, customerPhone, paymentMethod } = params;

  const hold = db.getSlotHold(holdId);
  if (!hold) {
    throw new Error(`Slot hold ${holdId} not found.`);
  }

  if (hold.status !== "active" || new Date(hold.expiresAt).getTime() <= Date.now()) {
    throw new Error("Cannot checkout: Slot hold has expired or is invalid.");
  }

  const slot = db.getScheduleSlot(hold.slotId);
  if (!slot) {
    throw new Error(`Schedule slot ${hold.slotId} not found.`);
  }

  const normalizedPhone = normalizePhoneNumber(customerPhone);

  // Upsert customer guest record
  db.upsertCustomer({
    name: customerName,
    email: customerEmail,
    phone: normalizedPhone,
  });

  // Attach customer details to hold
  db.updateSlotHold(hold.id, {
    customerName,
    customerEmail,
    customerPhone: normalizedPhone,
  });

  const slotPrice = slot.price;
  const addonsPrice = hold.racketsCount * RACKET_RENTAL_PRICE + hold.ballsCount * BALL_CAN_PRICE;
  const totalAmount = slotPrice + addonsPrice;

  const orderId = `PAY-${hold.id}`;
  gatewayLedger.set(orderId, { status: "pending", amount: totalAmount });

  const paymentDetails: PaymentInitiationResult["paymentDetails"] = {
    expiryTime: hold.expiresAt.toISOString(),
  };

  if (paymentMethod === "QRIS") {
    // Dynamic QRIS payload string (EMVCo compliant format simulation)
    paymentDetails.qrisString = `00020101021226600016ID.CO.PADELPRIME.WWW0118936009990${orderId}520458125303360540${totalAmount}5802ID5916PADEL PRIME CLUB6007JAKARTA62070703A016304C92E`;
  } else if (paymentMethod === "VA_BCA") {
    // BCA VA prefix 8277 + digits from phone
    const phoneDigits = normalizedPhone.replace(/[^0-9]/g, "").slice(-8);
    paymentDetails.virtualAccountNumber = `8277${phoneDigits}`;
    paymentDetails.bank = "BCA";
  } else if (paymentMethod === "VA_MANDIRI") {
    // Mandiri VA prefix 8950 + digits from phone
    const phoneDigits = normalizedPhone.replace(/[^0-9]/g, "").slice(-8);
    paymentDetails.virtualAccountNumber = `8950${phoneDigits}`;
    paymentDetails.bank = "MANDIRI";
  }

  return {
    orderId,
    holdId: hold.id,
    totalAmount,
    paymentMethod,
    paymentDetails,
  };
}

/**
 * Idempotently processes payment settlement webhook from the payment gateway.
 */
export async function processPaymentWebhook(payload: {
  orderId: string;
  statusCode: string;
  grossAmount: number;
  transactionStatus: "settlement" | "capture" | "expire" | "cancel";
  signature: string;
}): Promise<{ booking: BookingRecord; isDuplicate: boolean }> {
  const { orderId, statusCode, grossAmount, transactionStatus, signature } = payload;

  // 1. Signature Verification
  const isSignatureValid = verifyGatewaySignature(orderId, statusCode, grossAmount, signature);
  if (!isSignatureValid) {
    throw new Error("Cryptographic webhook signature verification failed.");
  }

  // Extract holdId from orderId (PAY-<holdId>)
  const holdId = orderId.replace(/^PAY-/, "");
  const hold = db.getSlotHold(holdId);
  if (!hold) {
    throw new Error(`Referenced hold ${holdId} does not exist.`);
  }

  // 2. Idempotency Check: if booking was already created for this slot or hold
  const existingBooking = db.listBookings().find((b) => b.slotId === hold.slotId);
  if (existingBooking && existingBooking.paymentStatus === "settled") {
    return { booking: existingBooking, isDuplicate: true };
  }

  // Check transaction status
  if (transactionStatus !== "settlement" && transactionStatus !== "capture") {
    throw new Error(`Transaction status ${transactionStatus} is not a successful settlement.`);
  }

  // Update gateway ledger
  gatewayLedger.set(orderId, { status: "settled", amount: grossAmount });

  const slot = db.getScheduleSlot(hold.slotId);
  if (!slot) {
    throw new Error(`Slot ${hold.slotId} not found.`);
  }

  // Ensure slot has not been stolen by another confirmed booking
  if (slot.status === "booked") {
    // Conflict edge case
    throw new Error("Overdue_Payment_Conflict: Slot has already been allocated to another confirmed reservation.");
  }

  // Generate Booking Reference (BK-YYYYMMDD-XXXX)
  const dateCompact = slot.date.replace(/-/g, "");
  const randAlpha = Math.random().toString(36).substring(2, 6).toUpperCase();
  const bookingRef = `BK-${dateCompact}-${randAlpha}`;

  // Sign cryptographic QR verification code for on-site check-in
  const qrSecret = process.env.QR_SECRET || "padel_qr_hmac_secret_2026";
  const qrPayloadRaw = `${bookingRef}:${slot.id}:${slot.date}:${slot.startTime}`;
  const qrSignature = crypto.createHmac("sha256", qrSecret).update(qrPayloadRaw).digest("hex");

  const slotPrice = slot.price;
  const addonsPrice = hold.racketsCount * RACKET_RENTAL_PRICE + hold.ballsCount * BALL_CAN_PRICE;

  const booking: BookingRecord = {
    id: `bk-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    bookingRef,
    slotId: slot.id,
    courtId: slot.courtId,
    customerName: hold.customerName || "Customer",
    customerEmail: hold.customerEmail || "customer@example.com",
    customerPhone: hold.customerPhone || "+6281200000000",
    racketsCount: hold.racketsCount,
    ballsCount: hold.ballsCount,
    slotPrice,
    addonsPrice,
    totalAmount: slotPrice + addonsPrice,
    paymentMethod: "QRIS", // or VA
    paymentStatus: "settled",
    status: "Confirmed",
    qrSignature,
    createdAt: new Date(),
  };

  // Convert hold to converted & slot to booked
  db.updateSlotHold(hold.id, { status: "converted" });
  db.updateSlotStatus(slot.id, "booked");
  db.createBooking(booking);

  return { booking, isDuplicate: false };
}

/**
 * Active Payment Inquiry: queries gateway directly to inspect order status.
 */
export async function inquirePaymentGateway(orderId: string): Promise<{
  isSettled: boolean;
  status: "pending" | "settled" | "expired" | "unknown";
  amount?: number;
}> {
  const entry = gatewayLedger.get(orderId);
  if (!entry) {
    return { isSettled: false, status: "unknown" };
  }

  return {
    isSettled: entry.status === "settled",
    status: entry.status,
    amount: entry.amount,
  };
}
