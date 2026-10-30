export function localDate(date = new Date(), timeZone?: string): string {
  if (timeZone) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const value = (type: string) =>
      parts.find((part) => part.type === type)!.value;
    return `${value("year")}-${value("month")}-${value("day")}`;
  }
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

export function validDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export function offsetDate(days: number, from = localDate()): string {
  const date = new Date(`${from}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function formatDate(value: string, long = false): string {
  // Stored appointment values are clinic wall times, not browser-local instants.
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "UTC",
    day: "numeric",
    month: long ? "long" : "short",
    ...(long ? { weekday: "long" as const } : {}),
  }).format(new Date(`${value.slice(0, 10)}T12:00:00Z`));
}

// For a heading: "Lunes, 19 de octubre", never title case.
export function capitalizeFirst(value: string): string {
  return value.charAt(0).toLocaleUpperCase("es-ES") + value.slice(1);
}

export function clinicToday(
  state: { timeZone: string },
  now = new Date(),
): string {
  return localDate(now, state.timeZone);
}

// Wall time in the clinic, "YYYY-MM-DDTHH:MM", comparable with appointments.
export function clinicNow(
  state: { timeZone: string },
  now = new Date(),
): string {
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: state.timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
  return `${clinicToday(state, now)}T${time}`;
}

export function validTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || !value) return false;
  try {
    new Intl.DateTimeFormat("es", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}
