# GitHub Pages setup (free account)

## Your store URL

### **https://yunusbashashaik.github.io/Social_Store-Bahrain/**

---

## How deploy works

GitHub is currently serving this repo from **`main` / (root)**. The built homepage, `assets/`, `logo.png`, and wallpaper therefore live at the **repository root** as well as in `docs/`. If those files are missing from root, the store URL is a blank white page (the HTML loads, the JS bundle 404s).

Pushing to `main` also runs **Deploy to GitHub Pages**, which publishes `client/dist` to the `gh-pages` branch. That branch is the preferred source once Settings → Pages is pointed at `gh-pages` / (root) or at **GitHub Actions**.

After changing logo, wallpaper, or copy, rebuild with:

```bash
VITE_BASE_PATH=/Social_Store-Bahrain/ npm run build -w client
cp -a client/dist/. docs/
cp client/dist/index.html docs/404.html
cp -a docs/.nojekyll docs/assets docs/*.html docs/*.png docs/*.ico docs/*.js docs/*.xml docs/*.JPG docs/*.htaccess . 2>/dev/null
```

Then commit the updated root + `docs/` files so a `main`-root Pages deploy stays in sync.

Do **not** keep a “Deploy static content to Pages” workflow that uploads the whole source tree — it fights the real deploy.

## If Actions shows “pages build and deployment” stuck / in progress

That workflow is GitHub’s **legacy branch deploy**. When it hangs or the site status is `errored` / stuck `building`, do this once:

1. Open **https://github.com/Yunusbashashaik/Social_Store-Bahrain/settings/pages**
2. Under **Build and deployment** → **Source**, choose **GitHub Actions**
3. Save, then open **Actions** → **Deploy Pages (GitHub Actions)** → **Run workflow**
4. Wait 1–2 minutes, then hard-refresh the store URL above

### Fallback (keep branch deploy)

1. Same Pages settings page
2. **Source:** Deploy from a branch
3. **Branch:** `gh-pages` · **Folder:** `/ (root)`
4. Click **Save** again (even if already selected) — this clears an `errored` / stuck `building` state
5. Cancel any hung **Deploy static content to Pages** / **Deploy Pages (GitHub Actions)** runs in the Actions tab
6. Wait for the new `pages-build-deployment` run to finish (often 2–8 minutes), or re-run **Deploy to GitHub Pages**

---

## Wrong URLs

| URL | Result |
|-----|--------|
| `yunusbashashaik.github.io` | Not your store |
| `yunusbashashaik.github.io/Social_Store-Bahrain/` | **Correct homepage** |
