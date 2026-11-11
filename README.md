# Rathin — portfolio

A one-page static site: plain HTML, CSS and JavaScript, with no build step and nothing to install.

```
index.html            the whole page
assets/css/style.css  styles
assets/js/main.js     animations, mobile menu, copy-email button (the page still works without it)
assets/img/           screenshots, app icon, favicon, link-preview image (og.jpg)
```

## Preview

Open `index.html` in a browser. Or serve the folder:

```bash
npx serve .
```

## Publish

Any static host works. On Vercel, import the folder as a new project with framework preset "Other" and no build command. Netlify Drop and GitHub Pages also work.

## Before you publish

1. **Link previews.** Once you have a domain, change the `og:image` value in `index.html` to the full address, e.g. `https://your-domain/assets/img/og.jpg`. WhatsApp and LinkedIn ignore relative paths.
2. **Client sign-off.** RK Creation and Vanisth are not live yet. Check that both are happy to be shown before this page goes public.
3. **When they launch.** Change their "Status" to "Live" and add a "Visit the live site" button, copying the one in the Rescue Foundation section.

## Updating screenshots

The images in `assets/img/` are WebP captures of the live sites and the Mandli Play Store screenshots. Keep the same file names when you replace them, and the page picks them up.
