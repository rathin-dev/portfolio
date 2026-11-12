# Rathin Baraiya — portfolio

A one-page static site: plain HTML, CSS and JavaScript, with no build step and nothing to install.

```
index.html            the whole page
assets/css/style.css  styles
assets/js/main.js     the 3D world (camera, blue line, pieces), the progress rail, the menu, counters
assets/img/           screenshots, app icon, portrait, favicon, link-preview image (og.jpg)
```

The page still works with JavaScript off: every section shows as an ordinary page and every link works. Visitors who have "reduce motion" switched on in their system settings get that same ordinary page, with nothing moving.

## Preview

Open `index.html` in a browser. Or serve the folder:

```bash
npx serve .
```

## Publish

Any static host works. On Vercel, import the folder as a new project with framework preset "Other" and no build command. Netlify Drop and GitHub Pages also work.

## How the 3D world works

The page is a row of **stops** (`<section data-stop>`) along the blue line. With motion allowed, `main.js` turns it into a 3D world, on phones too:

- The stops sit one behind another in depth. Scrolling flies a camera along the line: it parks in front of each stop for a moment, then flies on to the next. The browser scrolls normally (an empty spacer gives the page its length) and the camera glides after it.
- The blue line is a 3D curve drawn on one canvas. It passes through a chosen point at each stop, and between stops that are far apart it swings out to one side, alternating left and right. It is thick and solid near you and thin and faint in the distance, and its tip stays a little way ahead of you, so the line keeps leading on. On load it comes in from the side to your name.
- Each stop's **pieces** (elements with `data-at`) float around the line. While far ahead they are small, faded, waiting to one side and turned; they settle at their place as the camera parks, then grow and fade as you fly past.
- Around the dark stops (`data-dark`) the colours of the whole page fade to dark.
- Mandli (`data-portal`) opens out of the line as a purple circle that fills the screen, then shrinks away like a card. On a short screen its content scrolls through while the camera holds.

On a stop:

- `data-line="x,y"`: where the line passes it, measured from the middle of the screen as fractions of its width and height (`0,0` is the middle; `0.5,0` the right edge). `data-line-m` is the same for phones.
- `data-gap`: how far it is from the stop before (about one screen's depth per 1).
- `data-hold`: how long the camera stays there, in screens of scrolling.
- `data-swing` / `data-swing-m` (optional): where the line swings out on its way to this stop.
- `data-hud="05|What I do"`: a main stop, with a tick and a label on the progress rail.

On a piece:

- `data-at="x,y"`: its place when the camera is parked, from the middle of the screen. On phones the pieces of a stop stack in a column automatically, except pieces with their own `data-at-m`.
- `data-depth`: nearer (negative) or further (positive) than its stop, which makes it move faster or slower (parallax).
- `data-drift="x,y"`: how far to the side it waits while still far away. `data-turn`: how many degrees it is turned then.

`style.css` uses three numbers that `main.js` puts on every piece: `--far` (1 while far ahead, 0 when parked), `--arrive` and `--leave`. The words of headings marked `data-split` use `--far` to settle into place, the two words of the name use `--leave` to part as you fly on, and the screenshots use `--far` to zoom into their frame.

Blocks of reading text sit on a backing in the page colour, so the line passes behind them instead of showing between the words; the big display words stay see-through.

## Common edits

**Changing a project's link.** Each project has its address twice: on the screenshot and on its "Visit site" link. Change both.

**Adding a project.** Mandli is the featured first project (`<article class="stop mandli" data-portal>`). The other projects are the `<article class="stop project">` stops after it: copy one, and alternate the card between left and right (`data-at="-0.17,0"` / `data-at="0.17,0"`, with the line on the other side: `data-line="0.3,0.27"` / `data-line="-0.3,0.27"`). Then update the `01 / 05` counters on every project, including Mandli's, and the "5 projects" line under "Selected work".

**Changing the pace.** A stop's `data-gap` sets how long the flight to it is, and `data-hold` how long the camera stays. The glide itself is in `main.js` (search for `The loop`): the `5.5` there is how quickly the camera catches up with the scroll position.

**Changing where things sit.** Move a piece with its `data-at`, then check that the stop still fits one screen and that the line runs clear of it, from about 1024×600 up to large screens, and on a phone.

**Your photo.** The About section shows your portrait as a black-dot halftone with the background removed (`assets/img/rathin-halftone.webp`). To change it, replace that file with another transparent image of the same kind: a photo on a plain background works best with the dot effect.

## Before you publish

**Link previews.** Once you have a domain, change the `og:image` value in `index.html` to the full address, e.g. `https://your-domain/assets/img/og.jpg`. WhatsApp and LinkedIn ignore relative paths.
