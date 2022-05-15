# Ryan Bagley's Blog

## Custom Fonts
Local font files are used to custom fonts. A combination of technics are leveraged to accomplish the optimal font loading strategy. But the first thing to keep in mind when using any font files it the naming script. So a few rules to keep in mind:
1. All fonts require a `woff` and `woff2` variants.
2. All files should have a normal and subsetted version (created with the help of [glyphhanger](https://github.com/zachleat/glyphhanger)). That is, one with only a subset of the charset need; the minimum for the site to load. Usually, that is US_ASCII.
3. Naming should be as follows:
  - `<NAME>-<WEIGHT/STYLE>.<TYPE>`, e.g.: `SourceSerifPro-Black.woff`
  - `<NAME>-<WEIGHT/STYLE>-subset.<TYPE>`, e.g.: `SourceSerifPro-BlackItalic-subset.woff2`
4. Files should be placed in the `./static/fonts` directory.
5. Set the font name in the `config.yml` file under `params > font`.

As long as you follow these rules, you can load any file you like.

3 templates are utilized to accomplish this setup:
- `layouts/partials/font-preloading.html`: `<link>` tags are used to preload subset files **before** CSS reads the files via `@font-face`.
- `assets/css/fonts.css`: generates the `@font-face` rules and applies the font to the doc.
- `layouts/partials/font-swap.html`: after the subset files are read, a custom script uses the `FontFace()` constructor to load the full font files.

This flow ends up looking something like this:
```mermaid
graph TD
    A[Preload Subsets] --> B[CSS displays custom font]
    B --> C[FontFace API loads complete files]
```

## Image Pipeline
Images are processed with the help of [Node Sharp](https://sharp.pixelplumbing.com). There are two flows: **template** images and **markdown** images. All images start as a single **PNG** file, which is then used to generate resized variants.

3 variants are created:
- jpeg
- webp
- avif

The image are then placed inside a `<picture>` tag and loaded with the help of a couple `<source>` tags, followed by an `<img>` tag. The browser will then load the smallest file supported by it's engine.

### Template
These are images used in the HTML templates. Called with the help of the `img.html` partial. Files are accessed from the `/assets/img` directory, following the [Hugo Pipes](https://gohugo.io/hugo-pipes/introduction/) flow.

```mermaid
graph TD
    A[PNG] --> B[assets/img]
    B --> C[srcipts/images.js]
    C -->|Sharp| D[assets/img]
    D -->|layouts/partials/img.html| E[Template]
    E -->|hugo build| F[public]
```

The partial utilized like so:
```html
{{ partial "img.html" (dict "src" "home.jpeg" "alt" "meadow" "width" "720" "height" "900") }}
```
The partial takes in the following parameters:
- `src`: **required** - Image name. No file path is required, as all images are stored in `/assets/img`.
- `alt`: **required** - Image alt text.
- `width`: **required** - `<img>` width attribute. Max image width size should be used. This prevents layout shift.
- `height`: **optional** - `<img>` height attribute. Auto calculated with ommited.
- `hidden`: **optional** - `<img>` aria-hidden attribute. Used to remove image from screen readers. _Does not remove image from UI._
- `picClasses`: **optional** - `<picture>` custom classes.
- `imgClasses`: **optional** - `<img>` custom classes.

### Markdown
These are images used in content files placed in the `/content/posts` directory.

```mermaid
graph TD
    A[PNG] --> B[content/posts/**/images]
    B --> C[srcipts/images.js]
    C -->|Sharp| D[assets/img]
    D -->|layouts/_default/_markup/render-image.html| E[Content]
    E -->|hugo build| F[public]
```

These are utilized inlined like so:
```md
![meadow](images/broadwater-large.jpeg)
```

A `width` attribute value is automatically added based on the maximum image width possible based on the parent container.

### Rendered Output
Both flows render the same output:
```html
<picture class="img-wrap">
  <source srcset="/img/home.avif" type="image/avif" />
  <source srcset="/img/home.webp" type="image/webp" />
  <img
    src="/img/home.jpeg"
    alt="meadow"
    width="720"
    loading="lazy"
  />
</picture>
```
This ensures the smallest image size is always loaded. On top of that, native lazy loading is utilized to only load images until they are in view.

### Generating Images
The image script runs at build time via npm script. When running `npm run build:prod`, the script runs before Hugo's build command does. If you only run `hugo`, it is possible you will get errors due to missing assets. So using the npm script is always recommended.

## Service Worker
A service worker template is rendered on every build. This template auto-generates the app name, site url, and version number at compile time. However, a helper Node script is used to attach the list of assets to cache post-build. This is done because assets are fingerprinter at build time with a hash. However, the helper script runs via npm script with the `npm run build:prod` script.

The worker caches all JS, CSS, Image, and Font assets. Once the site is loaded on a client, assets are cached and moving forward, every request for them is intercepted and local version is loaded instead.