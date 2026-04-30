/**
 * Read a fetch Response body and parse JSON when valid.
 * Avoids throwing when the server returns HTML, plain text, or empty body.
 */
export async function readResponseJson(res: Response): Promise<
  | { okParse: true; data: unknown }
  | { okParse: false; bodyPreview: string }
> {
  const raw = await res.text();
  const trimmed = raw.trim();
  if (!trimmed) {
    return { okParse: true, data: null };
  }
  try {
    return { okParse: true, data: JSON.parse(raw) as unknown };
  } catch {
    const bodyPreview =
      raw.length > 240 ? `${raw.slice(0, 240).trim()}…` : raw.trim();
    return { okParse: false, bodyPreview };
  }
}
