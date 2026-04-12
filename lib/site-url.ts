const DEFAULT_SITE_URL = "https://tourbots.ai";

export function getSiteUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  const siteUrl = configuredUrl || DEFAULT_SITE_URL;
  return siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl;
}

export function getSiteMetadataBase(): URL {
  return new URL(getSiteUrl());
}
