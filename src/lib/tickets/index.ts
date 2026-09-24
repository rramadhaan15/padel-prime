import crypto from "crypto";
import QRCode from "qrcode";

export const QR_HMAC_SECRET = process.env.QR_SECRET || "padel_qr_hmac_secret_2026";

export interface TicketQrPayload {
  bookingRef: string;
  slotId: string;
  date: string;
  startTime: string;
  customerName: string;
  issuedAt: number;
}

export interface VerifiedTicketPayload extends TicketQrPayload {
  isValid: boolean;
}

/**
 * Creates a tamper-evident signed QR token.
 * Token format: Base64Url(JSON(payload)).HMAC-SHA256
 */
export function createTicketQrToken(payload: TicketQrPayload): string {
  const payloadStr = JSON.stringify(payload);
  const encodedPayload = Buffer.from(payloadStr).toString("base64url");
  const signature = crypto
    .createHmac("sha256", QR_HMAC_SECRET)
    .update(encodedPayload)
    .digest("hex");

  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies a signed QR token, preventing any tampering of the contained payload.
 */
export function verifyTicketQrToken(token: string): {
  isValid: boolean;
  payload?: TicketQrPayload;
  error?: string;
} {
  const parts = token.split(".");
  if (parts.length !== 2) {
    return { isValid: false, error: "Invalid token format." };
  }

  const [encodedPayload, signature] = parts;

  // Recompute expected HMAC
  const expectedSignature = crypto
    .createHmac("sha256", QR_HMAC_SECRET)
    .update(encodedPayload)
    .digest("hex");

  if (Buffer.byteLength(signature) !== Buffer.byteLength(expectedSignature)) {
    return { isValid: false, error: "Tampered QR code signature length mismatch." };
  }

  const isMatch = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );

  if (!isMatch) {
    return { isValid: false, error: "Cryptographic signature mismatch: QR code has been altered or forged." };
  }

  try {
    const jsonStr = Buffer.from(encodedPayload, "base64url").toString("utf8");
    const payload = JSON.parse(jsonStr) as TicketQrPayload;
    return { isValid: true, payload };
  } catch {
    return { isValid: false, error: "Failed to decode ticket payload." };
  }
}

/**
 * Generates an SVG or PNG data URL for displaying the scannable QR code.
 */
export async function generateQrCodeDataUrl(token: string): Promise<string> {
  return QRCode.toDataURL(token, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 320,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
}
