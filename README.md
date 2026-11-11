# Rathin Baraiya — portfolio

A one-page static site: plain HTML, CSS and JavaScript, with no build step and nothing to install.

```
index.html            the whole page
assets/css/style.css  styles
assets/js/main.js     the drawn blue line, the progress rail, the menu, counters and reveals
assets/img/           screenshots, app icon, favicon, link-preview image (og.jpg)
```

The page still works with JavaScript off: every section shows and every link works. With "reduce motion" switched on in the visitor's system settings, nothing animates and the blue line is drawn in full.

## Preview

Open `index.html` in a browser. Or serve the folder:

```bash
npx serve .
```

## Publish

Any static host works. On Vercel, import the folder as a new project with framework preset "Other" and no build command. Netlify Drop and GitHub Pages also work.

## Common edits

**Changing a project's link.** Each project has its address twice: on the screenshot and on its "Visit site" link. Change both.

**Adding a project.** Mandli is the featured first project, in its own purple block (`<article class="mandli">`) at the top of Work. The other projects are the `<article class="project">` blocks after it: copy one, and alternate `project` and `project project--right` so the images zig-zag. Then update the `01 / 05` counters on every project, including Mandli's, and the "5 projects" line under "Selected work".

**The blue line.** Elements with `data-thread="x,y x,y …"` add points to the line. `x` is a fraction of the page width (0 = left edge, 1 = right edge), and `y` is a fraction of that element's height. `data-thread-sm` is used instead on screens narrower than 900px. The line is rebuilt automatically when the layout changes.

**Your photo.** The About section shows a halftone version of the Mandli app. To use a photo of yourself instead, replace the image inside `<div class="halftone">`. A photo on a plain background works best with the dot effect.

## Before you publish

**Link previews.** Once you have a domain, change the `og:image` value in `index.html` to the full address, e.g. `https://your-domain/assets/img/og.jpg`. WhatsApp and LinkedIn ignore relative paths.
