export function getClientName(): string {
  return process.env.NEXT_PUBLIC_ODOOFLOW_CLIENT || "";
}

export function getClientAssetPath(filename: string): string {
  const client = getClientName();
  if (!client) return `/${filename}`;
  return `/assets/${client}/${filename}`;
}

export function getLogoSrc(): string {
  return getClientAssetPath("logo.png");
}

export function getLogoIconSrc(): string {
  return getClientAssetPath("logo-icon.ico");
}