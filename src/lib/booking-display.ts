export type CourtFilter = "ALL" | "Indoor" | "Outdoor";

export function bookingDays() {
  const today = new Date();
  return Array.from({ length: 8 }, (_, offset) => {
    const day = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + offset,
      12,
    );
    const date = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    return {
      date,
      day:
        offset === 0
          ? "Hari ini"
          : day.toLocaleDateString("id-ID", { weekday: "short" }),
      number: day.getDate(),
      month: day.toLocaleDateString("id-ID", { month: "short" }),
      fullLabel: `${offset === 0 ? "Hari ini, " : ""}${day.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}`,
    };
  });
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
