# Vercel Setup for CI/CD

## Status: Client Secrets ✅ | Vercel Secrets ⏳

All client-specific secrets (IPATECHS and JENSEN) have been created successfully in GitHub.

## Remaining Secrets to Create

You need to manually create 2 final secrets for Vercel deployment to work.

### 1. VERCEL_TOKEN

**What it is:** Your Vercel API authentication token

**How to get it:**
1. Go to https://vercel.com/account/tokens
2. Click "Create Token"
3. Name it: `GitHub Actions CI/CD`
4. Scope: Select your team/account
5. Copy the generated token

**How to add it to GitHub:**

**Option A: Via Web Interface**
1. Go to: https://github.com/wakashela/odooflow/settings/secrets/actions
2. Click "New repository secret"
3. Name: `VERCEL_TOKEN`
4. Value: (paste your token here)
5. Click "Add secret"

**Option B: Via CLI (if you prefer)**
```bash
# Use the gh CLI to set the secret
echo "YOUR_VERCEL_TOKEN_HERE" | gh secret set VERCEL_TOKEN --repo wakashela/odooflow
```

### 2. VERCEL_ORG_ID

**What it is:** Your Vercel Organization/Team ID

**How to get it:**

**Method 1: Via Vercel Dashboard**
1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Click on your account/team name (top left)
3. Go to "Settings" tab
4. Look for "Team ID" or "Organization ID" (usually starts with `team_`)

**Method 2: Via Vercel CLI (run locally)**
```bash
# Login to Vercel
vercel login

# Get your team/org ID
vercel teams list

# Or check your local config
cat ~/.local/share/com.vercel.cli/auth.json | grep -o '"id":"[^"]*"'
```

**How to add it:**

**Option A: Via Web Interface**
1. Go to: https://github.com/wakashela/odooflow/settings/secrets/actions
2. Click "New repository secret"
3. Name: `VERCEL_ORG_ID`
4. Value: (your org ID, e.g., `team_xxxxxxxx`)
5. Click "Add secret"

**Option B: Via CLI**
```bash
echo "YOUR_VERCEL_ORG_ID" | gh secret set VERCEL_ORG_ID --repo wakashela/odooflow
```

## Quick Setup Script

Once you have both values, run this locally to set both secrets at once:

```bash
#!/bin/bash
# Save as setup-vercel-secrets.sh and run locally

REPO="wakashela/odooflow"

# Prompt for inputs
echo "Enter your VERCEL_TOKEN (get it from https://vercel.com/account/tokens):"
read -s VERCEL_TOKEN
echo ""

echo "Enter your VERCEL_ORG_ID (get it from https://vercel.com/dashboard > Settings):"
read -s VERCEL_ORG_ID
echo ""

# Set secrets
echo "$VERCEL_TOKEN" | gh secret set VERCEL_TOKEN --repo "$REPO"
echo "$VERCEL_ORG_ID" | gh secret set VERCEL_ORG_ID --repo "$REPO"

echo "✅ Vercel secrets set successfully!"
```

## Verification

After setting both secrets, verify with:

```bash
gh secret list --repo wakashela/odooflow
```

You should see:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- All `IPATECHS_*` secrets
- All `JENSEN_*` secrets
- **Total: 36 secrets**

## Next Steps

1. ✅ Client secrets created (32 secrets)
2. ⏳ Create Vercel projects: `ipatechs-odooflow` and `jensen-odooflow`
3. ⏳ Add `VERCEL_TOKEN` secret to GitHub
4. ⏳ Add `VERCEL_ORG_ID` secret to GitHub
5. ⏳ Push code to trigger first deployment

## Creating Vercel Projects

Before deployments will succeed, you need to create the Vercel projects:

1. Go to https://vercel.com/new
2. Import your GitHub repository `wakashela/odooflow`
3. For the first project:
   - Project name: `ipatechs-odooflow`
   - Framework: Next.js
   - Environment variables: Add them from GitHub secrets or leave empty (CI/CD will handle it)
4. For the second project:
   - Project name: `jensen-odooflow`
   - Framework: Next.js

**Alternative: Use Vercel CLI to create projects**

```bash
# Create projects via CLI
vercel projects add ipatechs-odooflow
vercel projects add jensen-odooflow
```

## Testing Deployment

Once everything is set up, test by pushing code:

```bash
git add .
git commit -m "test: trigger CI/CD deployment"
git push origin main
```

Then check the Actions tab: https://github.com/wakashela/odooflow/actions

## Troubleshooting

### "Error: Project not found"
- Make sure the Vercel projects exist with the exact names: `ipatechs-odooflow` and `jensen-odooflow`

### "Error: No token found"
- Check that `VERCEL_TOKEN` is correctly set in GitHub secrets

### "Error: Team not found"
- Verify `VERCEL_ORG_ID` matches your Vercel team/account ID

### Deployment succeeds but app doesn't work
- Check that all Odoo environment variables are correctly set
- Verify the Odoo URL is accessible from Vercel's servers