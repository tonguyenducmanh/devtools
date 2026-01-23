export function parseHeaders(text) {
  const headers = {};

  if (!text) return headers;

  const lines = text.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const index = trimmed.indexOf(":");
    if (index === -1) continue;

    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();

    if (key && value) {
      headers[key] = value;
    }
  }

  return headers;
}
