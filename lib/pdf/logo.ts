import fs from "fs";
import path from "path";
import { getClientName } from "@/lib/assets";

export function getLogoSrc(logoBase64?: string | false | null): string | null {
  if (logoBase64) {
    return logoBase64.startsWith("data:") ? logoBase64 : `data:image/png;base64,${logoBase64}`;
  }

  const client = getClientName();

  try {
    const localPath = path.join(process.cwd(), "public", client ? `assets/${client}/logo.png` : "logo.png");
    if (fs.existsSync(localPath)) {
      const buff = fs.readFileSync(localPath);
      return `data:image/png;base64,${buff.toString("base64")}`;
    }
  } catch (err) {
    // ignore and try other fallbacks
  }

  const vercelHost = process.env.VERCEL_URL;
  if (vercelHost) {
    const host = vercelHost.startsWith("http") ? vercelHost : `https://${vercelHost}`;
    const assetPath = client ? `/assets/${client}/logo.png` : "/logo.png";
    return `${host.replace(/\/$/, "")}${assetPath}`;
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL;
  if (site) {
    const assetPath = client ? `/assets/${client}/logo.png` : "/logo.png";
    return `${site.replace(/\/$/, "")}${assetPath}`;
  }

  return null;
}

export default getLogoSrc;
