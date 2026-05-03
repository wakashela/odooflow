import fs from "fs";
import path from "path";

export function getLogoSrc(): string | null {
  // Prefer embedding the file as a data URI when available on the filesystem
  try {
    const localPath = path.join(process.cwd(), "public", "logo.png");
    if (fs.existsSync(localPath)) {
      const buff = fs.readFileSync(localPath);
      return `data:image/png;base64,${buff.toString("base64")}`;
    }
  } catch (err) {
    // ignore and try other fallbacks
  }

  // If deployed on Vercel, construct a public URL using VERCEL_URL
  const vercelHost = process.env.VERCEL_URL;
  if (vercelHost) {
    const host = vercelHost.startsWith("http") ? vercelHost : `https://${vercelHost}`;
    return `${host.replace(/\/$/, "")}/logo.png`;
  }

  // Try common public site env vars
  const site = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL;
  if (site) {
    return `${site.replace(/\/$/, "")}/logo.png`;
  }

  return null;
}

export default getLogoSrc;
