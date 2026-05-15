export function parseDeliveryTime(value: string | undefined): { number: number; unit: "days" | "weeks" } {
  if (!value) return { number: 0, unit: "days" };
  const match = value.trim().match(/^(\d+(?:\.\d+)?)\s*(DAYS|WEEKS|days|weeks)/);
  if (match) {
    return { number: parseFloat(match[1]), unit: match[2].toLowerCase() as "days" | "weeks" };
  }
  const num = parseFloat(value);
  if (!isNaN(num)) return { number: num, unit: "days" };
  return { number: 0, unit: "days" };
}

export function formatDeliveryTime(number: number, unit: "days" | "weeks"): string {
  if (!number) return "";
  const label = unit === "days" ? "DAYS" : "WEEKS";
  return `${number} ${label}`;
}
