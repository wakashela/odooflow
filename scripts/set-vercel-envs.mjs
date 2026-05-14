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

async function apiRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      `https://api.vercel.com${path}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
          ...(body ? { "Content-Length": Buffer.byteLength(body) } : {}),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
        });
      }
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function getExistingEnvId(key) {
  const result = await apiRequest("GET", `/v10/projects/${PID}/env`);
  if (result.status !== 200 || !result.body || !result.body.envs) return null;
  const match = result.body.envs.find(
    (e) => e.key === key && e.target.includes("production")
  );
  return match ? match.id : null;
}

async function setEnvVar(key, value) {
  // Try create first
  const createBody = JSON.stringify({
    key,
    value,
    type: "plain",
    target: ["production", "preview", "development"],
  });

  const createResult = await apiRequest("POST", `/v10/projects/${PID}/env`, createBody);

  if (createResult.status === 200 || createResult.status === 201) {
    console.log(`Set ${key}: OK (created)`);
    return;
  }

  // If already exists, find and update it
  if (createResult.status === 400 || createResult.status === 409) {
    const existingId = await getExistingEnvId(key);
    if (existingId) {
      const updateBody = JSON.stringify({ key, value, type: "plain" });
      const updateResult = await apiRequest("PATCH", `/v10/projects/${PID}/env/${existingId}`, updateBody);
      if (updateResult.status === 200) {
        console.log(`Set ${key}: OK (updated ${existingId})`);
        return;
      }
    }
  }

  throw new Error(`Failed to set ${key}: HTTP ${createResult.status}`);
}

let failed = false;

// Fetch existing envs once for reuse
let cachedEnvList = null;
async function getEnvIdFromCache(key) {
  if (!cachedEnvList) {
    const result = await apiRequest("GET", `/v10/projects/${PID}/env`);
    if (result.status === 200 && result.body && result.body.envs) {
      cachedEnvList = result.body.envs;
    }
  }
  if (!cachedEnvList) return null;
  const match = cachedEnvList.find((e) => e.key === key && e.target.includes("production"));
  return match ? match.id : null;
}

async function upsertEnvVar(name, value) {
  const body = JSON.stringify({
    key: name,
    value,
    type: "plain",
    target: ["production", "preview", "development"],
  });

  const createResult = await apiRequest("POST", `/v10/projects/${PID}/env`, body);

  if (createResult.status === 200 || createResult.status === 201) {
    console.log(`Set ${name}: OK (created)`);
    return;
  }

  const existingId = await getEnvIdFromCache(name);
  if (existingId) {
    const updateBody = JSON.stringify({ key: name, value, type: "plain" });
    const updateResult = await apiRequest("PATCH", `/v10/projects/${PID}/env/${existingId}`, updateBody);
    if (updateResult.status === 200) {
      console.log(`Set ${name}: OK (updated)`);
      return;
    }
    throw new Error(`Update failed: HTTP ${updateResult.status}`);
  }

  throw new Error(`Create failed: HTTP ${createResult.status}`);
}

for (const name of vars) {
  const value = process.env[name];
  if (value === undefined || value === "") {
    console.error(`Skipping ${name}: not set`);
    continue;
  }
  try {
    await upsertEnvVar(name, value);
  } catch (err) {
    console.error(`Set ${name}: FAILED - ${err.message}`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log("All environment variables set successfully.");
