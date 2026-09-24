import fs from "fs";
import path from "path";

export type CourtType = "Indoor" | "Outdoor";
export type TimeBand = "Regular" | "Peak";
export type SlotStatus = "open" | "held" | "booked" | "blocked";
export type BookingStatus = "Confirmed" | "Checked-In" | "No-Show" | "Rescheduled";
export type PaymentMethod = "QRIS" | "VA_BCA" | "VA_MANDIRI" | "WALK_IN";
export type PaymentStatus = "unpaid" | "settled" | "expired" | "conflict";

export interface VenueRecord {
  id: string;
  name: string;
  location: string;
  openingTime: string;
  closingTime: string;
}

export interface CourtRecord {
  id: string;
  venueId: string;
  name: string;
  type: CourtType;
  isActive: boolean;
}

export interface ScheduleSlotRecord {
  id: string;
  courtId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  timeBand: TimeBand;
  price: number;
  status: SlotStatus;
  blockReason?: string | null;
}

export interface SlotHoldRecord {
  id: string;
  slotId: string;
  courtId: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  racketsCount: number;
  ballsCount: number;
  expiresAt: Date;
  status: "active" | "converted" | "released" | "expired";
  createdAt: Date;
}

export interface BookingRecord {
  id: string;
  bookingRef: string;
  slotId: string;
  courtId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  racketsCount: number;
  ballsCount: number;
  slotPrice: number;
  addonsPrice: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: BookingStatus;
  checkedInAt?: Date | null;
  qrSignature: string;
  createdAt: Date;
}

export interface CustomerRecord {
  phone: string;
  name: string;
  email: string;
  noShowCount: number;
  isFlagged: boolean;
  createdAt: Date;
}

export interface EquipmentPoolRecord {
  id: string;
  date: string;
  timeSlot: string;
  totalRackets: number;
  rentedRackets: number;
  totalBalls: number;
  soldBalls: number;
}

interface SerializedStoreData {
  venue: VenueRecord;
  courts: Record<string, CourtRecord>;
  slots: Record<string, ScheduleSlotRecord>;
  holds: Record<string, Omit<SlotHoldRecord, "expiresAt" | "createdAt"> & { expiresAt: string; createdAt: string }>;
  bookings: Record<string, Omit<BookingRecord, "createdAt" | "checkedInAt"> & { createdAt: string; checkedInAt?: string | null }>;
  customers: Record<string, Omit<CustomerRecord, "createdAt"> & { createdAt: string }>;
  equipment: Record<string, EquipmentPoolRecord>;
}

export class DatabaseStore {
  private venue: VenueRecord;
  private courts: Map<string, CourtRecord> = new Map();
  private slots: Map<string, ScheduleSlotRecord> = new Map();
  private holds: Map<string, SlotHoldRecord> = new Map();
  private bookings: Map<string, BookingRecord> = new Map();
  private customers: Map<string, CustomerRecord> = new Map();
  private equipment: Map<string, EquipmentPoolRecord> = new Map();

  constructor() {
    this.venue = {
      id: "venue-padel-prime",
      name: "Padel Prime Club",
      location: "Senayan Central Park, Jakarta",
      openingTime: "06:00",
      closingTime: "23:00",
    };

    const loaded = this.loadFromFile();
    if (!loaded) {
      this.seedDefaultData();
      this.persistToFile();
    }
  }

  private getStoreFilePath(): string {
    return path.resolve(process.cwd(), ".data", "db_store.json");
  }

  private loadFromFile(): boolean {
    try {
      const filePath = this.getStoreFilePath();
      if (!fs.existsSync(filePath)) return false;

      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(raw) as SerializedStoreData;
      if (!parsed || !parsed.venue) return false;

      this.venue = parsed.venue;
      if (parsed.courts) this.courts = new Map(Object.entries(parsed.courts));
      if (parsed.slots) this.slots = new Map(Object.entries(parsed.slots));
      if (parsed.holds) {
        const holdEntries: Array<[string, SlotHoldRecord]> = Object.entries(parsed.holds).map(([k, v]) => [
          k,
          { ...v, expiresAt: new Date(v.expiresAt), createdAt: new Date(v.createdAt) },
        ]);
        this.holds = new Map(holdEntries);
      }
      if (parsed.bookings) {
        const bookingEntries: Array<[string, BookingRecord]> = Object.entries(parsed.bookings).map(([k, v]) => [
          k,
          {
            ...v,
            createdAt: new Date(v.createdAt),
            checkedInAt: v.checkedInAt ? new Date(v.checkedInAt) : null,
          },
        ]);
        this.bookings = new Map(bookingEntries);
      }
      if (parsed.customers) {
        const custEntries: Array<[string, CustomerRecord]> = Object.entries(parsed.customers).map(([k, v]) => [
          k,
          { ...v, createdAt: new Date(v.createdAt) },
        ]);
        this.customers = new Map(custEntries);
      }
      if (parsed.equipment) this.equipment = new Map(Object.entries(parsed.equipment));

      return true;
    } catch {
      return false;
    }
  }

  private persistToFile(): void {
    try {
      const filePath = this.getStoreFilePath();
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const payload: SerializedStoreData = {
        venue: this.venue,
        courts: Object.fromEntries(this.courts.entries()),
        slots: Object.fromEntries(this.slots.entries()),
        holds: Object.fromEntries(
          Array.from(this.holds.entries()).map(([k, v]) => [
            k,
            { ...v, expiresAt: new Date(v.expiresAt).toISOString(), createdAt: new Date(v.createdAt).toISOString() },
          ])
        ),
        bookings: Object.fromEntries(
          Array.from(this.bookings.entries()).map(([k, v]) => [
            k,
            {
              ...v,
              createdAt: new Date(v.createdAt).toISOString(),
              checkedInAt: v.checkedInAt ? new Date(v.checkedInAt).toISOString() : null,
            },
          ])
        ),
        customers: Object.fromEntries(
          Array.from(this.customers.entries()).map(([k, v]) => [
            k,
            { ...v, createdAt: new Date(v.createdAt).toISOString() },
          ])
        ),
        equipment: Object.fromEntries(this.equipment.entries()),
      };

      fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf-8");
    } catch {
      // In environment with restricted FS, continue with in-memory state
    }
  }

  public reset(): void {
    this.courts.clear();
    this.slots.clear();
    this.holds.clear();
    this.bookings.clear();
    this.customers.clear();
    this.equipment.clear();
    this.seedDefaultData();
    this.persistToFile();
  }

  private seedDefaultData(): void {
    const courtList: CourtRecord[] = [
      { id: "court-1", venueId: this.venue.id, name: "Court 1 - Grand Arena", type: "Indoor", isActive: true },
      { id: "court-2", venueId: this.venue.id, name: "Court 2 - Pro Indoor", type: "Indoor", isActive: true },
      { id: "court-3", venueId: this.venue.id, name: "Court 3 - Open Sky", type: "Outdoor", isActive: true },
      { id: "court-4", venueId: this.venue.id, name: "Court 4 - Sunset Terrace", type: "Outdoor", isActive: true },
    ];
    courtList.forEach((c) => this.courts.set(c.id, c));

    // Seed slots for today and next 7 days
    const today = new Date();
    for (let dayOffset = 0; dayOffset <= 8; dayOffset++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + dayOffset);
      const dateStr = targetDate.toISOString().split("T")[0];

      // Time slots from 06:00 to 22:30 (90 min slots)
      const times: Array<{ start: string; end: string; band: TimeBand }> = [
        { start: "06:00", end: "07:30", band: "Regular" },
        { start: "07:30", end: "09:00", band: "Regular" },
        { start: "09:00", end: "10:30", band: "Regular" },
        { start: "10:30", end: "12:00", band: "Regular" },
        { start: "12:00", end: "13:30", band: "Regular" },
        { start: "13:30", end: "15:00", band: "Regular" },
        { start: "15:00", end: "16:30", band: "Regular" },
        { start: "16:30", end: "18:00", band: "Peak" },
        { start: "18:00", end: "19:30", band: "Peak" },
        { start: "19:30", end: "21:00", band: "Peak" },
        { start: "21:00", end: "22:30", band: "Peak" },
      ];

      for (const court of courtList) {
        for (const t of times) {
          const slotId = `slot-${court.id}-${dateStr}-${t.start.replace(":", "")}`;
          const isWeekend = targetDate.getDay() === 0 || targetDate.getDay() === 6;
          const effectiveBand: TimeBand = isWeekend && parseInt(t.start.split(":")[0]) >= 8 ? "Peak" : t.band;

          let price = 250000;
          if (court.type === "Indoor") {
            price = effectiveBand === "Peak" ? 450000 : 350000;
          } else {
            price = effectiveBand === "Peak" ? 350000 : 250000;
          }

          this.slots.set(slotId, {
            id: slotId,
            courtId: court.id,
            date: dateStr,
            startTime: t.start,
            endTime: t.end,
            timeBand: effectiveBand,
            price,
            status: "open",
          });
        }
      }
    }
  }

  // Venue
  public getVenue(): VenueRecord {
    return this.venue;
  }

  // Courts
  public listCourts(): CourtRecord[] {
    return Array.from(this.courts.values());
  }

  public getCourt(id: string): CourtRecord | undefined {
    return this.courts.get(id);
  }

  // Slots
  public getScheduleSlots(date: string): ScheduleSlotRecord[] {
    return Array.from(this.slots.values()).filter((s) => s.date === date);
  }

  public getScheduleSlot(id: string): ScheduleSlotRecord | undefined {
    return this.slots.get(id);
  }

  public updateSlotStatus(id: string, status: SlotStatus, blockReason?: string | null): ScheduleSlotRecord {
    const slot = this.slots.get(id);
    if (!slot) throw new Error(`Slot not found: ${id}`);
    slot.status = status;
    slot.blockReason = blockReason ?? null;
    this.slots.set(id, slot);
    this.persistToFile();
    return slot;
  }

  public createSlot(slot: ScheduleSlotRecord): ScheduleSlotRecord {
    this.slots.set(slot.id, slot);
    this.persistToFile();
    return slot;
  }

  // Slot Holds
  public createSlotHold(hold: SlotHoldRecord): SlotHoldRecord {
    this.holds.set(hold.id, hold);
    this.persistToFile();
    return hold;
  }

  public getSlotHold(id: string): SlotHoldRecord | undefined {
    return this.holds.get(id);
  }

  public getActiveHoldForSlot(slotId: string): SlotHoldRecord | undefined {
    return Array.from(this.holds.values()).find(
      (h) => h.slotId === slotId && h.status === "active" && new Date(h.expiresAt).getTime() > Date.now()
    );
  }

  public updateSlotHold(id: string, updates: Partial<SlotHoldRecord>): SlotHoldRecord {
    const hold = this.holds.get(id);
    if (!hold) throw new Error(`SlotHold not found: ${id}`);
    const updated = { ...hold, ...updates };
    this.holds.set(id, updated);
    this.persistToFile();
    return updated;
  }

  public listActiveHolds(): SlotHoldRecord[] {
    const now = Date.now();
    return Array.from(this.holds.values()).filter(
      (h) => h.status === "active" && new Date(h.expiresAt).getTime() > now
    );
  }

  public listExpiredHolds(): SlotHoldRecord[] {
    const now = Date.now();
    return Array.from(this.holds.values()).filter(
      (h) => h.status === "active" && new Date(h.expiresAt).getTime() <= now
    );
  }

  // Bookings
  public createBooking(booking: BookingRecord): BookingRecord {
    this.bookings.set(booking.id, booking);
    this.persistToFile();
    return booking;
  }

  public getBooking(id: string): BookingRecord | undefined {
    return this.bookings.get(id);
  }

  public getBookingByRef(ref: string): BookingRecord | undefined {
    return Array.from(this.bookings.values()).find((b) => b.bookingRef === ref);
  }

  public listBookings(filters?: { date?: string; phone?: string; status?: BookingStatus }): BookingRecord[] {
    let result = Array.from(this.bookings.values());
    if (filters?.phone) {
      result = result.filter((b) => b.customerPhone === filters.phone);
    }
    if (filters?.status) {
      result = result.filter((b) => b.status === filters.status);
    }
    if (filters?.date) {
      result = result.filter((b) => {
        const slot = this.slots.get(b.slotId);
        return slot?.date === filters.date;
      });
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public updateBooking(id: string, updates: Partial<BookingRecord>): BookingRecord {
    const booking = this.bookings.get(id);
    if (!booking) throw new Error(`Booking not found: ${id}`);
    const updated = { ...booking, ...updates };
    this.bookings.set(id, updated);
    this.persistToFile();
    return updated;
  }

  // Customers
  public getCustomer(phone: string): CustomerRecord | undefined {
    return this.customers.get(phone);
  }

  public upsertCustomer(data: { phone: string; name: string; email: string }): CustomerRecord {
    const existing = this.customers.get(data.phone);
    if (existing) {
      existing.name = data.name;
      existing.email = data.email;
      this.customers.set(data.phone, existing);
      this.persistToFile();
      return existing;
    }
    const newCustomer: CustomerRecord = {
      phone: data.phone,
      name: data.name,
      email: data.email,
      noShowCount: 0,
      isFlagged: false,
      createdAt: new Date(),
    };
    this.customers.set(data.phone, newCustomer);
    this.persistToFile();
    return newCustomer;
  }

  public incrementCustomerNoShow(phone: string): CustomerRecord {
    const customer = this.customers.get(phone) || {
      phone,
      name: "Customer",
      email: "",
      noShowCount: 0,
      isFlagged: false,
      createdAt: new Date(),
    };
    customer.noShowCount += 1;
    if (customer.noShowCount >= 3) {
      customer.isFlagged = true;
    }
    this.customers.set(phone, customer);
    this.persistToFile();
    return customer;
  }

  // Equipment Pool
  public getEquipmentStock(date: string, timeSlot: string): EquipmentPoolRecord {
    const key = `${date}_${timeSlot}`;
    let pool = this.equipment.get(key);
    if (!pool) {
      pool = {
        id: `pool-${key}`,
        date,
        timeSlot,
        totalRackets: 24,
        rentedRackets: 0,
        totalBalls: 100,
        soldBalls: 0,
      };
      this.equipment.set(key, pool);
      this.persistToFile();
    }
    return pool;
  }

  public updateEquipmentStock(
    date: string,
    timeSlot: string,
    deltaRackets: number,
    deltaBalls: number
  ): EquipmentPoolRecord {
    const pool = this.getEquipmentStock(date, timeSlot);
    if (pool.rentedRackets + deltaRackets > pool.totalRackets) {
      throw new Error(`Insufficient racket stock: requested ${deltaRackets}, available ${pool.totalRackets - pool.rentedRackets}`);
    }
    if (pool.soldBalls + deltaBalls > pool.totalBalls) {
      throw new Error(`Insufficient ball stock: requested ${deltaBalls}, available ${pool.totalBalls - pool.soldBalls}`);
    }
    pool.rentedRackets = Math.max(0, pool.rentedRackets + deltaRackets);
    pool.soldBalls = Math.max(0, pool.soldBalls + deltaBalls);
    this.equipment.set(`${date}_${timeSlot}`, pool);
    this.persistToFile();
    return pool;
  }
}

// Preserve Singleton across Next.js module re-evaluations and re-compilations
const globalForDb = globalThis as unknown as {
  __padelDb?: DatabaseStore;
};

export const db: DatabaseStore = globalForDb.__padelDb ?? new DatabaseStore();
globalForDb.__padelDb = db;
