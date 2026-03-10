# Romantic Anniversary Mini Website (Static Frontend)

This project is a no-build, static HTML/CSS/JS anniversary experience designed for QR-code opening on mobile and desktop.

## Folder Structure

```text
4SDproj/
├─ index.html
├─ style.css
├─ script.js
├─ README.md
└─ assets/
   ├─ bg.png
   ├─ mail-bubble.png
   ├─ mail-icon.png
   ├─ page1.png
   ├─ page2.png
   ├─ page3.png
   ├─ page4.png
   ├─ bg-music.mp3
   ├─ open-mail.mp3
   └─ finale-music.mp3
```

Note: This implementation includes a fallback for `assets/page 2.png` in case your second page file has a space in its filename.

## 1. Run Locally

You can open `index.html` directly, but audio is more reliable through a local server.

```powershell
cd c:\Users\ianmi\Downloads\4SDproj
python -m http.server 8080
```

Then open: `http://localhost:8080`

## 2. Deploy to GitHub Pages (No Build Step)

1. Push this folder to a GitHub repository.
2. In GitHub, go to `Settings -> Pages`.
3. Under `Build and deployment`, choose:
   - `Source: Deploy from a branch`
   - `Branch: main` (or your default branch)
   - `Folder: / (root)`
4. Save and wait for GitHub Pages to publish.
5. Use the generated URL in your QR code.

## 3. Replace Assets

Put replacement files in `assets/` using the same filenames:

- `bg.png`
- `mail-bubble.png`
- `mail-icon.png`
- `page1.png` to `page4.png`
- `bg-music.mp3`
- `open-mail.mp3`
- `finale-music.mp3`

If any image/audio fails to load, the site still runs with built-in graceful fallbacks.

## 4. Adjust Page Order

Edit `CONFIG.pageAssets` in [script.js](./script.js):

```js
pageAssets: [
  ["assets/page1.png"],
  ["assets/page2.png", "assets/page 2.png"],
  ["assets/page3.png"],
  ["assets/page4.png"]
]
```

Reorder lines to change the sequence.

## 5. Tweak Animation Intensity

Edit in [script.js](./script.js):

- `CONFIG.effects.starCount`
- `CONFIG.effects.leafCount`
- `CONFIG.fireworks.*` (burst count, particles, speed, gravity, decay)

Edit in [style.css](./style.css):

- `@keyframes leaf-fall` for drift feel
- `@keyframes twinkle` for star blink feel
- `@keyframes mail-bounce` for mail bounce strength

## 6. Change Text and Ending Message

Edit in [script.js](./script.js):

```js
finalMessage: "Happy 4 Years Love!"
```

This updates the final headline automatically.

To reposition the ending message and control its font, use:

```js
finalMessagePosition: {
  left: "50%",
  top: "50%",
  scale: 1,
  align: "center"
},
finalMessageFontFamily: "\"SVBold\", \"Palatino Linotype\", \"Book Antiqua\", Garamond, serif"
```

## 7. Reposition Mail Bubble/Mail Icon

Quickest way is CSS variables in [style.css](./style.css):

```css
:root {
  --mail-bubble-left: 72%;
  --mail-bubble-top: 68%;
  --mail-bubble-scale: 1;
  --mail-icon-left: 50%;
  --mail-icon-bottom: 28%;
  --mail-icon-scale: 1;
}
```

You can also set them in [script.js](./script.js) under:

```js
mailBubblePosition: {
  left: "72%",
  top: "68%",
  scale: 1
},
mailIconPosition: {
  left: "50%",
  bottom: "28%",
  scale: 1
}
```

## Key Editable Parts

- Scene flow and logic: `script.js`
- Visual style and layout: `style.css`
- Structure of scenes and controls: `index.html`
- Asset paths/page order/audio behavior: `CONFIG` block at top of `script.js`
