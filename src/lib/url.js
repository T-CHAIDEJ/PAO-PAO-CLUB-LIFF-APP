// A link_url typed into the DB/Admin without a scheme (e.g. "tiktok.com"
// instead of "https://tiktok.com") is a relative path to a browser, not an
// external site — clicking it silently navigates to our own domain
// ("oursite.com/tiktok.com") instead of leaving the app. Found this exact
// case live in 015_banners. Normalizes by assuming https:// when no scheme
// (or another known non-http scheme like tel:/mailto:/line:) is present.
export function normalizeExternalUrl(url) {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed; // already has a scheme
  return `https://${trimmed}`;
}
