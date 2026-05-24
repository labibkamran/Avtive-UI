export function buildRedirectUrl(
  requestUrl: string,
  pathname: string,
  params?: Record<string, string>,
) {
  const url = new URL(pathname, requestUrl);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  return url;
}
