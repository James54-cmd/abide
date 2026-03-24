function readEnv(name: string): string | undefined {
  const value = process.env[name];
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function requireEnv(name: string): string {
  const value = readEnv(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function getSupabasePublicEnv() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!isValidUrl(url)) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a valid http(s) URL.");
  }

  return { url, anonKey };
}

export function getSupabaseServiceRoleKey() {
  return requireEnv("SUPABASE_SERVICE_ROLE_KEY");
}

export function getSiteUrl() {
  const siteUrl = requireEnv("NEXT_PUBLIC_SITE_URL");
  if (!isValidUrl(siteUrl)) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be a valid http(s) URL.");
  }
  return siteUrl;
}

export function getOpenAiApiKey() {
  return readEnv("OPENAI_API_KEY") ?? requireEnv("OPENAI_SK");
}

export function getApiBibleKey() {
  return requireEnv("API_BIBLE_KEY");
}
