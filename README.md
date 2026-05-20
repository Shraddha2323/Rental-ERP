# Rental ERP Tenant Dashboard

A small, low-cost starting point for a rental management ERP. This first version focuses only on tenant details and a reactive dashboard.

## Recommended Stack

- Frontend: plain HTML, CSS, JavaScript
- Database: Supabase Postgres
- Hosting: Vercel, Netlify, or any static hosting

This avoids a paid server and keeps maintenance very low. If you later need a full backend, the same database can stay in place.

## Run Locally

From this folder:

```bash
python3 -m http.server 8080
```

Open:

```text
http://localhost:8080
```

Without database credentials the app runs in demo mode and stores added tenants in browser local storage.

## Connect Supabase

1. Create a free Supabase project.
2. Open the Supabase SQL Editor.
3. Run the SQL from `supabase-schema.sql`.
4. Go to Project Settings > API.
5. Copy the Project URL and anon public key.
6. Paste them into `config.js`:

```js
window.RENTAL_ERP_CONFIG = {
  SUPABASE_URL: "https://your-project.supabase.co",
  SUPABASE_ANON_KEY: "your-anon-key",
};
```

Refresh the app. The sidebar should show `Live database`.

## Deployment

The cheapest deployment path is static hosting:

- Vercel: import this folder/repo and deploy as a static site.
- Netlify: drag-and-drop the folder or connect a repo.
- GitHub Pages: works too, since there is no build step.

For real use, add authentication before sharing the URL beyond trusted people. The included SQL policy is intentionally permissive for a prototype.

## Next Modules

1. Properties and units
2. Rent ledger
3. Payment receipts
4. Deposits
5. Owner settlement
6. Auth and audit log
