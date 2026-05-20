# Rental ERP Tenant Dashboard

A small, low-cost starting point for a rental management ERP. This first version focuses only on tenant details and a reactive dashboard.

## Recommended Stack

- Frontend: plain HTML, CSS, JavaScript
- Database: Firebase Firestore
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

## Connect Firebase

1. Create a Firebase project.
2. Open Firestore Database and create a database.
3. Start in test mode for a private demo, or paste the rules from `firestore.rules`.
4. Open Project Settings > General > Your apps.
5. Add a Web app and copy the Firebase config values.
6. Paste them into `config.js`:

```js
window.RENTAL_ERP_CONFIG = {
  FIREBASE_API_KEY: "your-api-key",
  FIREBASE_AUTH_DOMAIN: "your-project.firebaseapp.com",
  FIREBASE_PROJECT_ID: "your-project-id",
  FIREBASE_STORAGE_BUCKET: "your-project.firebasestorage.app",
  FIREBASE_MESSAGING_SENDER_ID: "your-sender-id",
  FIREBASE_APP_ID: "your-app-id",
};
```

Refresh the app. The sidebar should show `Live database`.

## Deployment

The cheapest deployment path is static hosting:

- Vercel: import this folder/repo and deploy as a static site.
- Netlify: drag-and-drop the folder or connect a repo.
- GitHub Pages: works too, since there is no build step.

For real use, add authentication before sharing the URL beyond trusted people. The included Firestore rule is intentionally permissive for a prototype.

## Next Modules

1. Properties and units
2. Rent ledger
3. Payment receipts
4. Deposits
5. Owner settlement
6. Auth and audit log
