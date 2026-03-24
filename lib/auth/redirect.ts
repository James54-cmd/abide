const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

function toUrl(value?: string | null) {
  if (!value) return null;
  try {
    return new URL(value.trim());
  } catch {
    return null;
  }
}

function isLocalUrl(url: URL) {
  return LOCAL_HOSTNAMES.has(url.hostname.toLowerCase());
}

type AuthRedirectOptions = {
  requestedRedirectTo?: string | null;
  siteUrl?: string | null;
  fallbackOrigin?: string | null;
  callbackPath?: string;
};

export function getSafeAuthRedirectUrl({
  requestedRedirectTo,
  siteUrl,
  fallbackOrigin,
  callbackPath = "/auth/callback",
}: AuthRedirectOptions) {
  const requested = toUrl(requestedRedirectTo);
  if (requested && !isLocalUrl(requested)) {
    return `${requested.origin}${callbackPath}`;
  }

  const site = toUrl(siteUrl);
  if (site && !isLocalUrl(site)) {
    return `${site.origin}${callbackPath}`;
  }

  const fallback = toUrl(fallbackOrigin);
  if (fallback) {
    return `${fallback.origin}${callbackPath}`;
  }

  return null;
}
