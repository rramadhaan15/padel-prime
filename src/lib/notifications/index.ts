import { db } from "../db";
import { createTicketQrToken } from "../tickets";

export interface WhatsAppDispatchEvent {
  id: string;
  phone: string;
  customerName: string;
  bookingRef: string;
  message: string;
  ticketUrl: string;
  dispatchedAt: Date;
}

export interface EmailDispatchEvent {
  id: string;
  email: string;
  customerName: string;
  bookingRef: string;
  subject: string;
  invoiceNumber: string;
  totalAmount: number;
  pdfAttachmentName: string;
  dispatchedAt: Date;
}

const globalForNotifications = globalThis as unknown as {
  __padelWhatsAppLog?: WhatsAppDispatchEvent[];
  __padelEmailLog?: EmailDispatchEvent[];
};
const whatsappLog: WhatsAppDispatchEvent[] = globalForNotifications.__padelWhatsAppLog ?? [];
const emailLog: EmailDispatchEvent[] = globalForNotifications.__padelEmailLog ?? [];
globalForNotifications.__padelWhatsAppLog = whatsappLog;
globalForNotifications.__padelEmailLog = emailLog;

export function getWhatsAppLog(): WhatsAppDispatchEvent[] {
  return [...whatsappLog];
}

export function getEmailLog(): EmailDispatchEvent[] {
  return [...emailLog];
}

export function clearNotificationLogs(): void {
  whatsappLog.length = 0;
  emailLog.length = 0;
}

/**
 * Dispatches WhatsApp message with interactive confirmation and ticket link.
 */
export async function dispatchWhatsAppNotification(params: {
  phone: string;
  customerName: string;
  bookingRef: string;
  courtName: string;
  date: string;
  startTime: string;
  ticketUrl: string;
}): Promise<WhatsAppDispatchEvent> {
  const message = `Halo ${params.customerName}! 🎾\nBooking Padel Anda di Padel Prime Club telah terkonfirmasi.\n\n` +
    `🔖 Ref: ${params.bookingRef}\n` +
    `🏟️ Lapangan: ${params.courtName}\n` +
    `📅 Tanggal: ${params.date}\n` +
    `⏰ Jam: ${params.startTime} WIB\n\n` +
    `Buka tiket digital Anda untuk check-in:\n${params.ticketUrl}`;

  const event: WhatsAppDispatchEvent = {
    id: `wa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    phone: params.phone,
    customerName: params.customerName,
    bookingRef: params.bookingRef,
    message,
    ticketUrl: params.ticketUrl,
    dispatchedAt: new Date(),
  };

  whatsappLog.push(event);
  return event;
}

/**
 * Dispatches official itemized PDF invoice via email.
 */
export async function dispatchEmailInvoice(params: {
  email: string;
  customerName: string;
  bookingRef: string;
  totalAmount: number;
  ticketUrl: string;
}): Promise<EmailDispatchEvent> {
  const event: EmailDispatchEvent = {
    id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    email: params.email,
    customerName: params.customerName,
    bookingRef: params.bookingRef,
    subject: `[INVOICE RESMI] Bukti Pembayaran Padel Prime - ${params.bookingRef}`,
    invoiceNumber: `INV-${params.bookingRef}`,
    totalAmount: params.totalAmount,
    pdfAttachmentName: `Invoice-${params.bookingRef}.pdf`,
    dispatchedAt: new Date(),
  };

  emailLog.push(event);
  return event;
}

/**
 * Orchestrates dual-channel dispatch upon booking confirmation.
 */
export async function dispatchBookingConfirmations(bookingId: string, baseUrl = "http://localhost:3000"): Promise<{
  whatsapp: WhatsAppDispatchEvent;
  email: EmailDispatchEvent;
}> {
  const booking = db.getBooking(bookingId);
  if (!booking) {
    throw new Error(`Booking ${bookingId} not found.`);
  }

  const slot = db.getScheduleSlot(booking.slotId);
  const court = db.getCourt(booking.courtId);
  const ticketUrl = `${baseUrl}/ticket/${booking.id}`;

  const whatsapp = await dispatchWhatsAppNotification({
    phone: booking.customerPhone,
    customerName: booking.customerName,
    bookingRef: booking.bookingRef,
    courtName: court ? court.name : "Court Padel",
    date: slot ? slot.date : "Hari Ini",
    startTime: slot ? slot.startTime : "08:00",
    ticketUrl,
  });

  const email = await dispatchEmailInvoice({
    email: booking.customerEmail,
    customerName: booking.customerName,
    bookingRef: booking.bookingRef,
    totalAmount: booking.totalAmount,
    ticketUrl,
  });

  return { whatsapp, email };
}
