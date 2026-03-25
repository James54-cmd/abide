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

export const BIBLE_API_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type BibleCacheEntry = { expiresAt: number; value: unknown };

const bibleResponseCache = new Map<string, BibleCacheEntry>();

export async function apiBibleGetCached(
  path: string,
  ttlMs: number = BIBLE_API_CACHE_TTL_MS
): Promise<unknown> {
  const now = Date.now();
  const hit = bibleResponseCache.get(path);
  if (hit && hit.expiresAt > now) {
    return hit.value;
  }
  const value = await apiBibleGet(path);
  bibleResponseCache.set(path, { expiresAt: now + ttlMs, value });
  return value;
}

const NEW_TESTAMENT_BOOKS = new Set([
  "MAT", "MRK", "LUK", "JHN", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH", "PHP", "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB", "JAS", "1PE", "2PE", "1JO", "2JO", "3JO", "JUD", "REV"
]);

export type BibleBookRow = { id: string; name: string; testament: "OT" | "NT" };
export type BibleChapterRow = { id: string; number: number };
export type BibleVerseRow = { reference: string; text: string; verse: number };

export function mapBibleBooksData(booksData: unknown): BibleBookRow[] {
  return toItemArray(booksData)
    .map((item) => {
      const id = String(item.id ?? "");
      // Prefer nameLong for completeness, fallback to name
      const name = String(item.nameLong || item.name || "");
      const testament: "OT" | "NT" = NEW_TESTAMENT_BOOKS.has(id.toUpperCase()) ? "NT" : "OT";
      return { id, name, testament };
    })
    .filter((item) => item.id && item.name);
}

export function mapBibleChaptersData(chaptersData: unknown): BibleChapterRow[] {
  return toItemArray(chaptersData)
    .map((item) => {
      const id = String(item.id ?? "");
      const rawNumber = item.number ?? item.chapter ?? null;
      const numberFromField =
        typeof rawNumber === "string" || typeof rawNumber === "number"
          ? Number(rawNumber)
          : NaN;
      const numberFromId = Number(id.split(".").pop());
      const number = Number.isFinite(numberFromField) ? numberFromField : numberFromId;
      return { id, number };
    })
    .filter((item) => item.id && Number.isFinite(item.number))
    .sort((a, b) => a.number - b.number);
}

export function mapVersesFromVerseList(verseListRaw: unknown, chapterId: string): BibleVerseRow[] {
  return toItemArray(verseListRaw)
    .map((item, index) => {
      const reference = String(item.reference ?? "");
      const text = normalizeText(item.content ?? item.text ?? "");
      const num = Number(item.verse ?? item.number ?? item.orgId ?? index + 1);
      const numFromRef = Number(reference.split(":").pop());
      const verse = Number.isFinite(num)
        ? num
        : Number.isFinite(numFromRef)
          ? numFromRef
          : index + 1;
      return { reference: reference || `${chapterId}:${verse}`, text, verse };
    })
    .filter((v) => v.text.length > 0);
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
