# GitHub Pages setup

## Store URL

**https://yunusbashashaik.github.io/Social_Store-Bahrain/**

GitHub Pages serves this repo from **`main` / (root)**. The built homepage, `assets/`, `logo.png`, and `images/` folder therefore live at the **repository root** as well as in `docs/`. If those files are missing from root, the store URL is a blank white page.

After changing logo, wallpaper, or copy, rebuild with:

```bash
VITE_BASE_PATH=/Social_Store-Bahrain/ npm run build -w client
cp -a client/dist/. docs/
cp client/dist/index.html docs/404.html
cp -a docs/.nojekyll docs/assets docs/images docs/*.html docs/*.png docs/*.ico docs/*.js docs/*.xml docs/*.htaccess . 2>/dev/null
```

Then commit the updated root + `docs/` files so the `main` Pages deploy stays in sync.

## Wrong URLs

| URL | Result |
|-----|--------|
| `yunusbashashaik.github.io` | Not your store |
| `yunusbashashaik.github.io/Social_Store-Bahrain/` | **Correct homepage** |
