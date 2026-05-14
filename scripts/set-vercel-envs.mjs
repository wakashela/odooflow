import https from "https";

const TOKEN = process.env.VERCEL_TOKEN;
const PID = process.env.PROJECT_ID;

const vars = [
  "ODOO_URL",
  "ODOO_DB",
  "ODOO_USER",
  "ODOO_PASSWORD",
  "ODOO_COMPANY_NAME",
  "ODOO_COMPANY_TIN",
  "ODOO_COMPANY_VRN",
  "ODOO_COMPANY_ADDRESS",
  "ODOO_COMPANY_PHONE",
  "ODOO_COMPANY_EMAIL",
  "ODOO_COMPANY_WEBSITE",
  "ODOO_COMPANY_CITY",
  "ODOO_COMPANY_COUNTRY",
  "ODOOFLOW_PDF_PRIMARY",
  "ODOOFLOW_PDF_PRIMARY_DARK",
  "ODOOFLOW_PDF_ACCENT",
  "NEXT_PUBLIC_ODOOFLOW_CLIENT",
];

async function setEnvVar(key: string, value: string): Promise<void> {
  const body = JSON.stringify({
    key,
    value,
    type: "plain",
    target: ["production", "preview", "development"],
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      `https://api.vercel.com/v10/projects/${PID}/env`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log(`Set ${key}: OK (${res.statusCode})`);
          } else if (res.statusCode === 409) {
            console.log(`Set ${key}: already exists (${res.statusCode})`);
          } else {
            console.log(`Set ${key}: ${res.statusCode} ${data}`);
          }
          resolve();
        });
      },
    );

    req.on("error", (e) => {
      console.error(`Failed to set ${key}:`, e.message);
      reject(e);
    });

    req.write(body);
    req.end();
  });
}

let failed = false;
for (const name of vars) {
  const value = process.env[name];
  if (value === undefined) {
    console.error(`Warning: ${name} not set in environment, skipping`);
    continue;
  }
  try {
    await setEnvVar(name, value);
  } catch {
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log("All environment variables set.");
