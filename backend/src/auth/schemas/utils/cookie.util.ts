export function getCookieValue(
  cookieHeader: string | undefined,
  name: string,
) {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';');

  for (const cookie of cookies) {
    const separatorIndex = cookie.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = cookie
      .slice(0, separatorIndex)
      .trim();

    const value = cookie
      .slice(separatorIndex + 1)
      .trim();

    if (key === name) {
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }

  return null;
}