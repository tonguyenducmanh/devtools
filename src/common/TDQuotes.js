import tdUtility from "./TDUtility.js";

// ── QUOTE DATA ──────────────────────────────────────────────────────────────
export const QUOTES = [
  {
    q: "Mỗi lần nhớ em tôi sẽ mở tool này lên code, nó không giúp tôi hết nhớ em, nhưng sẽ giúp tôi cải thiện skill lập trình",
    a: "Tô Mạnh",
  },
];

/**
 * Lấy quote theo ngày
 * @returns {object} { q, a }
 */
export function getQuoteOfDay() {
  const dayOfYear = tdUtility.getDayOfYear();
  const index = dayOfYear % QUOTES.length;
  return QUOTES[index];
}
