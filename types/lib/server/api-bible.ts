type ApiBibleItem = Record<string, unknown>;

function readEnv(name: string) {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : null;
}

export function getApiBibleConfig() {
  const apiKey = readEnv("API_BIBLE_KEY");
  const baseUrl = readEnv("API_BIBLE_BASE_URL") ?? "https://api.scripture.api.bible";
  const nivId = readEnv("API_BIBLE_ID_NIV");
  const nltId = readEnv("API_BIBLE_ID_NLT");

  if (!apiKey) {
    throw new Error("Missing API_BIBLE_KEY.");
  }

  return { apiKey, baseUrl, nivId, nltId };
}

export function getBibleIdForTranslation(translation: string) {
  const { nivId, nltId } = getApiBibleConfig();
  if (translation === "NIV" && nivId) return nivId;
  if (translation === "NLT" && nltId) return nltId;
  throw new Error(`Missing API_BIBLE_ID_${translation}.`);
}

export async function apiBibleGet(path: string) {
  const { apiKey, baseUrl } = getApiBibleConfig();
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { "api-key": apiKey },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as {
    data?: unknown;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(payload.message || `API.Bible request failed (${response.status}).`);
  }

  return payload.data;
}

export function normalizeText(input: unknown) {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function toItemArray(value: unknown): ApiBibleItem[] {
  return Array.isArray(value) ? (value as ApiBibleItem[]) : [];
}
