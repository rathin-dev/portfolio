# Rathin Baraiya — portfolio

A one-page static site: plain HTML, CSS and JavaScript, with no build step and nothing to install.

```
index.html            the whole page
assets/css/style.css  styles
assets/js/main.js     the pinned scenes, the drawn blue line, the progress rail, the menu, counters and reveals
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

**Smooth scrolling.** Mouse wheels, trackpads, Page Down, the space bar and in-page links glide instead of jumping. It is a few lines in `assets/js/main.js` (search for `Smooth scrolling`), with no library. The glide strength is the `0.085` in that block: lower feels floatier, higher feels snappier. Touch screens keep their own native scrolling, and it switches off for visitors who have reduced motion turned on.

**3D scroll scenes.** On screens at least 901px wide and 600px tall, every section from the hero to the "Selected Work" title is a pinned scene. Each `<section class="scene" data-pin>` is taller than the screen, and its `.stage` stays pinned while it scrolls past. The next scene rises over it as a rounded card while the old one tilts back and falls into shadow, and the blue line carries on into the new card. While a scene is pinned on its own, it plays its own animation: the name splits apart, the figures grow in, the years of the journey come and go one at a time, and the service words drift towards you. Phones and shorter windows scroll normally, with only the hero and the "Selected Work" title pinned. With reduced motion on, nothing is pinned and everything sits flat.

`main.js` only publishes numbers, and `style.css` decides what they do (search for `3D scroll`):

- on each scene: `--rise` (sliding into place), `--hold` (pinned on its own), `--cover` (the next scene rising over it), `--pin` (the whole pinned stretch), each from 0 to 1;
- on blocks marked `data-fx`: `--in`, `--p` and `--q` for the 3D entrances. Inside a pinned scene they keep running as if it still scrolled, so its contents carry on arriving while it is pinned.

A scene's length is its height in the block that starts `@media (min-width: 901px) and (min-height: 600px)` (for example `.scene--journey { height: 480vh; }`). The last screen of it is when the next scene rises; the rest is the hold. Each scene also has `margin-top: -100vh` so it starts rising over the one before. If you add text to a scene, check that it still fits on one screen at about 1024×600.

**Appear on scroll.** Add `class="reveal"` to any block to make it rise out of a soft blur when it scrolls into view. Add `data-split` to a heading to make its words rise one after another. `style="--d:.1s"` delays either one.

**The blue line.** Elements with `data-thread="x,y x,y …"` add points to the line. `x` is a fraction of the page width (0 = left edge, 1 = right edge), and `y` is a fraction of that element's height. `data-thread-sm` is used instead on screens 900px wide or less, and an empty `data-thread-sm=""` leaves that element out there. While a scene is pinned, its stage uses `data-thread-scene` (and `data-thread-scene-sm`) instead, with `y` as a fraction of the screen-high stage; that piece of the line is drawn inside the stage, so it holds still with the scene and fades as the next one arrives. `data-sweep` on a scene sets how far down its stage the line is drawn by the time it is pinned (the hero uses `.86`, the journey `.42`).

A few rules keep it looking like one line:

- a scene's route leaves its stage going straight down, at the same `x` where the next scene's route comes in;
- on the edges of the page, step away from the edge gradually, or the curve swings off-screen;
- the line never runs over body text, labels, buttons, screenshots or the photo. It may cross the big display headings.

The line is rebuilt automatically when the layout changes. Screenshots also sit above the line, as a safety net.

**Your photo.** The About section shows your portrait as a black-dot halftone with the background removed (`assets/img/rathin-halftone.webp`). To change it, replace that file with another transparent image of the same kind: a photo on a plain background works best with the dot effect.

## Before you publish

**Link previews.** Once you have a domain, change the `og:image` value in `index.html` to the full address, e.g. `https://your-domain/assets/img/og.jpg`. WhatsApp and LinkedIn ignore relative paths.
