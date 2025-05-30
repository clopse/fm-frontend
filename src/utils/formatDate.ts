// utils/formatDate.ts

/**
 * Converts dates like "01-Mar-25" to ISO format "2025-03-01".
 * Returns "" if invalid.
 */
export function convertToISODate(input: string): string {
  if (!input || typeof input !== "string") return "";

  const match = input.match(/^(\d{2})-([A-Za-z]{3})-(\d{2})$/);
  if (!match) return "";

  const [_, day, monthStr, year] = match;

  const months: { [key: string]: string } = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04",
    May: "05", Jun: "06", Jul: "07", Aug: "08",
    Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  };

  const month = months[monthStr];
  if (!month) return "";

  const yearNum = parseInt(year, 10);
  const fullYear = yearNum >= 50 ? `19${year}` : `20${year}`;

  return `${fullYear}-${month}-${day}`;
}
