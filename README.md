---
published: false
---

# Social_Store-Bahrain

> **Open the website (iPad / phone):** [https://yunusbashashaik.github.io/Social_Store-Bahrain/](https://yunusbashashaik.github.io/Social_Store-Bahrain/)  
> Do **not** use `yunusbashashaik.github.io` alone — that is not your store URL.

Social Store — bilingual digital subscription marketplace for Bahrain (BHD).

## Development

Requirements: Node.js 20+.

```bash
npm install
npm run dev
```

- **Client:** http://localhost:5173 (Vite dev server; proxies `/api` to the backend)
- **API:** http://localhost:3001 (`GET /api/health`, `GET /api/services`, `GET /api/settings`, `POST /api/complaints`, `POST /api/admin/login`)

```bash
npm run lint
npm run test
npm run build
npm start   # serves built client + API on port 3001
```

### Dynamic database (SQLite)

Admin edits and public catalog/settings are stored **outside the git folder** in `~/social-store-bahrain-data/` (SQLite or JSON, plus uploads). Existing `server/data/` files are copied there once on first start. Replacing the app folder on GoDaddy therefore cannot reset prices, new services, complaint email, WhatsApp numbers, or About Us.

Optional env:

- `DATA_DIR` — override the persistent data folder
- `DATABASE_PATH` — custom SQLite file path
- `ADMIN_USERNAME` (default: `admin`)
- `ADMIN_PASSWORD` (default: `Qz@02846?`)
- `ADMIN_SESSION_SECRET` — signs admin session tokens
- `ALLOW_FACTORY_SEED=1` — **dev only**. Production must omit this. Without it the API never inserts `shared/defaultServices.js`.
- `CATALOG_BACKUP_TOKEN` or `GITHUB_TOKEN` or `GH_TOKEN` — GitHub token with `repo` contents access for automatic catalog backup
- `CATALOG_BACKUP_REPO` — `owner/name` (example: `Yunusbashashaik/Social_Store-Bahrain`). Falls back to `GITHUB_REPOSITORY` if set.
- `CATALOG_BACKUP_PATH` — file in that repo (default `catalog-backup/admin-state.json`)
- `CATALOG_BACKUP_BRANCH` — default `main`
- `CATALOG_BACKUP_URL` — optional raw JSON URL used to **restore** when local disks are empty

On every admin save the API writes `admin-state.json` and `admin-state.backup.json` to `/local`, `/root`, and `$HOME` data dirs, then pushes the custom catalog to GitHub. On boot, if the local catalog is empty (or only factory defaults), it hydrates from those replicas first, then from GitHub / `CATALOG_BACKUP_URL`, and **does not** factory-fill.

### Admin panel

Click the **Admin** icon in the header. A modal prompts for credentials, then opens the Admin Dashboard:

- **Add Services** — JPEG image, name, EN/AR descriptions, 1-month and 1-year prices, optional Eid/Special offer with expiry
- **Edit Services** — dropdown for Services, Complaint Email ID, Contact Details (WhatsApp), and About Us / social links
- **Export / Import catalog backup** — download or restore `admin-state.json`

Default credentials: `admin` / `Qz@02846?` (override with `ADMIN_USERNAME` / `ADMIN_PASSWORD`).

Out-of-stock services use price `0`, show an **Out of Stock** note, and disable Add to Cart.

### Deploy on GoDaddy (Node.js)

Admin login needs a **running Node app**. If `https://YOUR-DOMAIN/api/health` does not return `{"ok":true}`, login cannot work.

**cPanel Application Manager (Passenger)**

1. Setup → Application Manager → Register Application  
2. Application root = this repo folder  
3. Application URL = your domain (or subdomain) **root**, not a `/public_html` static copy  
4. Application startup file: `app.js`  
5. Node.js version: 20+  
6. In the app directory:
   ```bash
   npm install
   npm run build
   ```
7. Restart the application  
8. Visit `https://YOUR-DOMAIN/api/health` — you must see JSON `ok: true`  
9. Then sign in with `admin` / `Qz@02846?`

Do **not** FTP only `client/dist` into `public_html`. That is static hosting and `/api/health` will 404.

If Apache serves static files and Node is on port 3001, copy `docs/godaddy.htaccess` to `public_html/.htaccess` (requires `mod_proxy`).

If the website and API use different URLs, edit `client/public/runtime-config.js` after build:

```js
window.__GLOBALSTORE_CONFIG__ = { apiUrl: "https://your-node-api-url" };
```

Keep admin data in `~/social-store-bahrain-data/` (or `DATA_DIR`). Do **not** upload over that folder when you deploy code.

**GoDaddy env (Application Manager → Environment Variables)** so the live catalog restores itself after a recycled `/local` disk:

| Variable | Required | Purpose |
|----------|----------|---------|
| `CATALOG_BACKUP_TOKEN` | yes | GitHub PAT with contents:write on the backup repo |
| `CATALOG_BACKUP_REPO` | yes | `Yunusbashashaik/Social_Store-Bahrain` (or your fork) |
| `CATALOG_BACKUP_PATH` | no | default `catalog-backup/admin-state.json` |
| `CATALOG_BACKUP_BRANCH` | no | default `main` |
| `CATALOG_BACKUP_URL` | no | extra restore URL (raw JSON) |
| `ALLOW_FACTORY_SEED` | **must be unset** | never set this on GoDaddy |

After deploy, sign in once, change any service, and confirm `GET /api/health` shows `offHostBackupConfigured: true`, `factorySeedDisabled: true`, and `snapshotCustom: true`. `catalogSeededThisBoot` must stay `false` on later restarts.

### Complaint email

Complaints are sent by **email only** (not WhatsApp). The destination address is stored in the database (default `global2stor2@gmail.com`) and can be changed from the admin panel.

- **Static hosting (GitHub Pages):** FormSubmit classic multipart POST fallback
- **Node API + SMTP:** screenshot embedded + attached

Optional env: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `COMPLAINT_EMAIL` / `VITE_COMPLAINT_EMAIL`

See `Tech. Document` for full product requirements.

## Deployment (GitHub Pages)

This repo is public. GitHub Pages serves **`main` / (root)**.

After a push to **`main`**, wait 1–2 minutes, then open:

**https://yunusbashashaik.github.io/Social_Store-Bahrain/**

The homepage catalog is loaded from the Node API. Factory names in `shared/defaultServices.js` are **not** inserted in production. Custom names survive Node restarts because they are mirrored locally and to GitHub `catalog-backup/admin-state.json`. Keep admin data in `~/social-store-bahrain-data/` (or `DATA_DIR` / `/local/social-store-bahrain-data`). Do **not** upload over that folder when you deploy code.
