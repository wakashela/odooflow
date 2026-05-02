# OdooFlow

OdooFlow is a specialized Next.js application designed to streamline Odoo operations, focusing on document management, PDF generation, and automated workflows.

## Key Features

- **Document Management**: View and manage Quotations, Invoices, Purchase Orders, and Delivery Notes integrated directly with Odoo.
- **PDF Generation**: Dynamically generate professional, branded PDF documents for all major sales and purchasing workflows.
- **Workflow Automation**: Simplified status tracking and document lifecycle management.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **State Management**: Zustand
- **PDF Engine**: `@react-pdf/renderer`
- **Data Fetching**: Custom Odoo JSON-RPC client

## Development Setup

1. **Clone the repository**
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Environment Variables**: Create a `.env.local` file with your Odoo connection details:
   ```env
   ODOO_URL=your_odoo_instance_url
   ODOO_DB=your_database_name
   ODOO_USER=your_username
   ODOO_PASSWORD=your_api_key
   ```
4. **Run development server**:
   ```bash
   npm run dev
   ```

## Project Structure

- `app/`: Next.js App Router pages and API routes.
- `components/`: Reusable UI and document-specific components.
- `lib/`: Core logic including Odoo API clients and PDF generators.
- `store/`: Zustand state stores for authentication and document data.
- `types/`: TypeScript definitions for Odoo models and domain documents.

## License

This project is proprietary and confidential.
