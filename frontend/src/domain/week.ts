const TIME_ZONE = "America/Argentina/Buenos_Aires";

function utcDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
}

export function todayIso(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

export function addDays(iso: string, days: number) {
  const date = utcDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function weekStartIso(iso: string) {
  const day = utcDate(iso).getUTCDay();
  const delta = day === 0 ? -6 : 1 - day;
  return addDays(iso, delta);
}

export function weekDays(start: string) {
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export function greetingFor(now = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      hour: "numeric",
      hourCycle: "h23",
    }).format(now),
  );
  if (hour < 12) {
    return "Buen día";
  }
  if (hour < 19) {
    return "Buenas tardes";
  }
  return "Buenas noches";
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function longDate(iso: string) {
  const formatted = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(utcDate(iso));
  return capitalize(formatted);
}

export function dayHeading(iso: string) {
  const formatted = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(utcDate(iso));
  return capitalize(formatted);
}

export function weekRangeLabel(start: string) {
  const end = addDays(start, 6);
  const startDate = utcDate(start);
  const endDate = utcDate(end);
  const day = new Intl.DateTimeFormat("es-AR", { day: "numeric", timeZone: "UTC" });
  const month = new Intl.DateTimeFormat("es-AR", { month: "short", timeZone: "UTC" })
    .format(endDate)
    .replace(".", "");
  if (startDate.getUTCMonth() === endDate.getUTCMonth()) {
    return `${day.format(startDate)}–${day.format(endDate)} ${month}`;
  }
  const startMonth = new Intl.DateTimeFormat("es-AR", { month: "short", timeZone: "UTC" })
    .format(startDate)
    .replace(".", "");
  return `${day.format(startDate)} ${startMonth} – ${day.format(endDate)} ${month}`;
}
