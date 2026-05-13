# CI/CD Setup for Multi-Client Vercel Deployment

This document describes how to set up automated deployments to multiple Vercel projects from a single GitHub repository.

## Overview

The CI/CD pipeline automatically deploys to all client Vercel projects when code is pushed to the `main` branch.

```
GitHub Repository (main branch)
         │
         ▼
GitHub Actions
   ├── Test (Lint + Type Check)
   └── Deploy (Matrix Strategy)
         ├── Deploy to ipatechs-odooflow
         └── Deploy to jensen-odooflow
```

## GitHub Secrets Configuration

Go to your GitHub repository settings: **Settings > Secrets and variables > Actions**

Add the following secrets:

### Required Global Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `VERCEL_TOKEN` | Vercel API token | vercel_dE7... |
| `VERCEL_ORG_ID` | Vercel Organization ID | team_abc... |

### Generating Vercel Token

1. Go to [Vercel Tokens](https://vercel.com/account/tokens)
2. Create a new token with name "GitHub Actions"
3. Copy the token to GitHub Secrets

### Getting Vercel Organization ID

1. Go to Vercel Dashboard > Settings > General
2. Copy the Organization ID from the URL or settings page

### Client-Specific Secrets

For each client, add secrets in the format `{CLIENT}_{SECRET}`. The client names should be lowercase.

#### For IPATECHS

| Secret Name | Value |
|-------------|-------|
| `IPATECHS_ODOO_URL` | https://odoo-211283-0.cloudclusters.net |
| `IPATECHS_ODOO_DB` | admin |
| `IPATECHS_ODOO_USER` | ipatechs.co.ltd@gmail.com |
| `IPATECHS_ODOO_PASSWORD` | (your password) |
| `IPATECHS_ODOO_COMPANY_NAME` | IPATECHS COMPANY LIMITED |
| `IPATECHS_ODOO_COMPANY_TIN` | 178-821-709 |
| `IPATECHS_ODOO_COMPANY_VRN` | 40-322042-K |
| `IPATECHS_ODOO_COMPANY_ADDRESS` | Makongo road postal code 14129 |
| `IPATECHS_ODOO_COMPANY_PHONE` | +255750304097 |
| `IPATECHS_ODOO_COMPANY_EMAIL` | info@ipatechs.com |
| `IPATECHS_ODOO_COMPANY_WEBSITE` | www.ipatechs.com |
| `IPATECHS_ODOO_COMPANY_CITY` | Dar es Salaam |
| `IPATECHS_ODOO_COMPANY_COUNTRY` | Tanzania |
| `IPATECHS_ODOOFLOW_PDF_PRIMARY` | #FF6B00 |
| `IPATECHS_ODOOFLOW_PDF_PRIMARY_DARK` | #D65A00 |
| `IPATECHS_ODOOFLOW_PDF_ACCENT` | #2C3E50 |

#### For JENSEN

| Secret Name | Value |
|-------------|-------|
| `JENSEN_ODOO_URL` | https://odoo-211283-0.cloudclusters.net |
| `JENSEN_ODOO_DB` | jensenintl |
| `JENSEN_ODOO_USER` | admin |
| `JENSEN_ODOO_PASSWORD` | admin |
| `JENSEN_ODOO_COMPANY_NAME` | JENSEN AUTOMATIONS TECHNOLOGY LIMITED |
| `JENSEN_ODOO_COMPANY_TIN` | 168-782-179 |
| `JENSEN_ODOO_COMPANY_VRN` | 40-315066-K |
| `JENSEN_ODOO_COMPANY_ADDRESS` | 21493 Dar es Salaam, TANZANIA |
| `JENSEN_ODOO_COMPANY_PHONE` | +255745205050 |
| `JENSEN_ODOO_COMPANY_EMAIL` | info@jensenintl.com |
| `JENSEN_ODOO_COMPANY_WEBSITE` | www.jensenintl.com |
| `JENSEN_ODOO_COMPANY_CITY` | Dar es Salaam |
| `JENSEN_ODOO_COMPANY_COUNTRY` | Tanzania |
| `JENSEN_ODOOFLOW_PDF_PRIMARY` | #2C3E50 |
| `JENSEN_ODOOFLOW_PDF_PRIMARY_DARK` | #1A252F |
| `JENSEN_ODOOFLOW_PDF_ACCENT` | #4DB6AC |

## Adding New Clients

To add a new client:

1. **Add to GitHub Secrets**: Add all required secrets with the new client prefix (e.g., `CLIENTNAME_ODOO_URL`, `CLIENTNAME_ODOO_DB`, etc.)

2. **Update the Workflow**: Edit `.github/workflows/deploy.yml` and add the new client to the matrix:

```yaml
strategy:
  matrix:
    include:
      - client: ipatechs
        project_name: ipatechs-odooflow
      - client: jensen
        project_name: jensen-odooflow
      - client: newclient
        project_name: newclient-odooflow  # Add this
```

3. **Create Vercel Project**: Create the Vercel project named `newclient-odooflow`

4. **Connect GitHub Repo**: Connect the GitHub repository to the Vercel project (do this manually once in Vercel dashboard)

## Manual Deployment

You can trigger deployments manually from GitHub:

1. Go to **Actions > Deploy to Vercel**
2. Click **Run workflow**
3. Select specific client or choose "all"
4. Click **Run workflow**

## Deployment Status

After setting up, you can see deployment status in:
- GitHub Actions tab
- Vercel Dashboard > Deployments

## Troubleshooting

### Deployment Fails

1. Check GitHub Actions logs for error details
2. Verify all secrets are correctly configured
3. Ensure Vercel project exists and is connected

### Environment Variables Not Available

Make sure the secret naming follows the pattern: `{CLIENT}_{VARIABLE}` where CLIENT matches the matrix `client` value exactly (lowercase).

## Deployment Flow

```
1. Push to main branch
       │
       ▼
2. Test workflow runs
   - ESLint
   - TypeScript check
       │
       ▼
3. Deploy jobs run (parallel)
   - ipatechs-odooflow
   - jensen-odooflow
       │
       ▼
4. Production deployment
   to respective Vercel projects
```

## Security Notes

- Never commit actual credentials to the repository
- All sensitive data should be stored in GitHub Secrets
- The `.env.example` file contains only placeholder values
- Each client has isolated secrets for data separation