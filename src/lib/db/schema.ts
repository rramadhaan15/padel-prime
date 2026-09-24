import { pgTable, text, timestamp, integer, boolean, uuid, date } from "drizzle-orm/pg-core";

export const venues = pgTable("venues", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  openingTime: text("opening_time").notNull().default("06:00"),
  closingTime: text("closing_time").notNull().default("23:00"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const courts = pgTable("courts", {
  id: text("id").primaryKey(),
  venueId: text("venue_id").notNull().references(() => venues.id),
  name: text("name").notNull(),
  type: text("type").$type<"Indoor" | "Outdoor">().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const scheduleSlots = pgTable("schedule_slots", {
  id: text("id").primaryKey(),
  courtId: text("court_id").notNull().references(() => courts.id),
  date: text("date").notNull(), // YYYY-MM-DD
  startTime: text("start_time").notNull(), // HH:mm (e.g. "07:00")
  endTime: text("end_time").notNull(), // HH:mm (e.g. "08:30")
  timeBand: text("time_band").$type<"Regular" | "Peak">().notNull(),
  price: integer("price").notNull(), // in IDR
  status: text("status").$type<"open" | "held" | "booked" | "blocked">().default("open").notNull(),
  blockReason: text("block_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const slotHolds = pgTable("slot_holds", {
  id: text("id").primaryKey(),
  slotId: text("slot_id").notNull().references(() => scheduleSlots.id),
  courtId: text("court_id").notNull().references(() => courts.id),
  customerId: text("customer_id"),
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  racketsCount: integer("rackets_count").default(0).notNull(),
  ballsCount: integer("balls_count").default(0).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  status: text("status").$type<"active" | "converted" | "released" | "expired">().default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bookings = pgTable("bookings", {
  id: text("id").primaryKey(),
  bookingRef: text("booking_ref").notNull().unique(), // e.g. "BK-20260924-XXXX"
  slotId: text("slot_id").notNull().references(() => scheduleSlots.id),
  courtId: text("court_id").notNull().references(() => courts.id),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(), // E.164 format
  racketsCount: integer("rackets_count").default(0).notNull(),
  ballsCount: integer("balls_count").default(0).notNull(),
  slotPrice: integer("slot_price").notNull(),
  addonsPrice: integer("addons_price").notNull(),
  totalAmount: integer("total_amount").notNull(),
  paymentMethod: text("payment_method").$type<"QRIS" | "VA_BCA" | "VA_MANDIRI" | "WALK_IN">().notNull(),
  paymentStatus: text("payment_status").$type<"unpaid" | "settled" | "expired" | "conflict">().default("unpaid").notNull(),
  status: text("status").$type<"Confirmed" | "Checked-In" | "No-Show" | "Rescheduled">().default("Confirmed").notNull(),
  checkedInAt: timestamp("checked_in_at"),
  qrSignature: text("qr_signature").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customers = pgTable("customers", {
  phone: text("phone").primaryKey(), // E.164
  name: text("name").notNull(),
  email: text("email").notNull(),
  noShowCount: integer("no_show_count").default(0).notNull(),
  isFlagged: boolean("is_flagged").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const equipmentPools = pgTable("equipment_pools", {
  id: text("id").primaryKey(),
  date: text("date").notNull(), // YYYY-MM-DD
  timeSlot: text("time_slot").notNull(), // HH:mm
  totalRackets: integer("total_rackets").notNull().default(24),
  rentedRackets: integer("rented_rackets").notNull().default(0),
  totalBalls: integer("total_balls").notNull().default(100),
  soldBalls: integer("sold_balls").notNull().default(0),
});
