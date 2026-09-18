# Sass Utility Generator

A small Sass module that turns lists and maps into utility classes.

You choose the class names, values, and CSS rules. The generator adds variants
for states like hover, group states, media queries, and responsive breakpoints.

## Requirements

This package requires [Dart Sass](https://sass-lang.com/dart-sass/).
You can use either `sass` or `sass-embedded`.

## Installation

Install the package along with Dart Sass:

```sh
npm install -D @ramstack/sass-utility-generator sass
```

In Vite and other tools with Sass package support, import it by name:

```scss
@use "@ramstack/sass-utility-generator" as utilities;
```

For the Dart Sass CLI (1.71.0+), add `pkg:` to the import and enable the
[Node.js package importer](https://sass-lang.com/documentation/cli/dart-sass/#pkg-importer-node):

```scss
@use "pkg:@ramstack/sass-utility-generator" as utilities;
```

```sh
npx sass --pkg-importer=node src/styles.scss dist/styles.css
```

With the JavaScript API, use the same `pkg:` import and add the importer:

```js
import * as sass from "sass";

const result = sass.compile("src/styles.scss", {
  importers: [new sass.NodePackageImporter()],
});
```

If your tool doesn't support package imports, add the package directory to
the Sass load path and use the file name:

```sh
npx sass --load-path=node_modules/@ramstack/sass-utility-generator src/styles.scss dist/styles.css
```

```scss
@use "utility-generator" as utilities;
```

The examples below use the first import form.

## Quick start

```scss
@use "@ramstack/sass-utility-generator" as utilities;

.opacity {
  @include utilities.options((50: 0.5, 100: 1), hover) using ($name, $value) {
    opacity: $value;
  }
}
```

Generated CSS:

```css
.opacity-50,
.hover\:opacity-50:hover {
  opacity: 0.5;
}

.opacity-100,
.hover\:opacity-100:hover {
  opacity: 1;
}
```

Use the classes in your HTML:

```html
<button class="opacity-50 hover:opacity-100">...</button>
```

## Samples

Each sample is a complete stylesheet you can compile on its own:

1. [Basic utility](samples/01-basic-utility.scss)
2. [List options](samples/02-list-options.scss)
3. [Map options](samples/03-map-options.scss)
4. [State variants](samples/04-state-variants.scss)
5. [Group variant](samples/05-group-variant.scss)
6. [Responsive utilities](samples/06-responsive.scss)
7. [Custom breakpoints](samples/07-custom-breakpoints.scss)
8. [Custom media variants](samples/08-custom-media.scss)
9. [Combining variants](samples/09-combining-variants.scss)

To build all samples, run these commands from the repository root.
The CSS goes in `samples/css/`:

```sh
npm install
npm run build:samples
```

## How it works

Options add a suffix like `-block`. Variants add a prefix like `hover:`
and a condition for when the styles apply:

| Input                                 | Generated selector or rule            |
|---------------------------------------|---------------------------------------|
| `.display` with option `block`        | `.display-block`                      |
| `.display-block` with variant `hover` | `.hover\:display-block:hover`         |
| `.display-block` with breakpoint `md` | `@media (...) { .md\:display-block }` |

The base class, such as `.display-block`, is always included alongside its variants.

## Variants

Use `variants($variants...)` to add states such as `hover` and `focus-visible`:

```scss
@use "@ramstack/sass-utility-generator" as utilities;

.text-red {
  @include utilities.variants(hover, focus-visible) {
    color: red;
  }
}
```

Generated CSS:

```css
.text-red,
.hover\:text-red:hover,
.focus-visible\:text-red:focus-visible {
  color: red;
}
```

Names such as `hover` and `focus-visible` become CSS pseudo-classes.
The generator doesn't check these names, so it accepts new and vendor-specific
pseudo-classes, but won't catch typos.

### Group variants

Add `group-` before a state to react to that state on a `.group` ancestor.
For example, `group-hover` applies when that ancestor is hovered:

```scss
.bg-gray {
  @include utilities.variants(group-hover) {
    background-color: #555;
  }
}
```

```css
.bg-gray,
.group:hover .group-hover\:bg-gray {
  background-color: #555;
}
```

Put `group` on a containing element and `group-hover:bg-gray` on the element
you want to style:

```html
<div class="group">
  <span class="group-hover:bg-gray">...</span>
</div>
```

### Built-in media variants

| Variant      | Media query                               |
|--------------|-------------------------------------------|
| `light`      | `(prefers-color-scheme: light)`           |
| `dark`       | `(prefers-color-scheme: dark)`            |
| `pointer`    | `(pointer: fine)`                         |
| `touch`      | `(pointer: coarse)`                       |
| `contrast`   | `(prefers-contrast: more)`                |
| `reduce`     | `(prefers-reduced-motion: reduce)`        |
| `motion`     | `(prefers-reduced-motion: no-preference)` |
| `print`      | `print`                                   |
| `responsive` | All configured non-zero breakpoints       |

`pointer` and `touch` check the primary pointing device, even when several
pointing devices are available.

Each media variant gets its own `@media` rule:

```scss
.text-red {
  @include utilities.variants(dark, print) {
    color: red;
  }
}
```

```css
.text-red {
  color: red;
}

@media (prefers-color-scheme: dark) {
  .dark\:text-red {
    color: red;
  }
}

@media print {
  .print\:text-red {
    color: red;
  }
}
```

`print` uses the base selector and does not combine with pseudo-class variants
passed in the same call.

## Responsive variants

Use `responsive` to generate variants for your breakpoints:

```scss
.display-block {
  @include utilities.variants(responsive) {
    display: block;
  }
}
```

The default breakpoints are:

```scss
(
  xs: 0,
  sm: 576px,
  md: 768px,
  lg: 992px,
  xl: 1200px,
  xxl: 1400px
)
```

The base `.display-block` works at all screen sizes. With these breakpoints,
`responsive` adds `.sm\:display-block` through `.xxl\:display-block` inside
`min-width` media queries. The `xs: 0` entry uses the base class, so there's
no separate `xs:` class.

To use your own breakpoints, set `$grid-breakpoints` in `@use`:

```scss
@use "@ramstack/sass-utility-generator" as utilities with (
  $grid-breakpoints: (
    mobile: 0,
    tablet: 48rem,
    desktop: 75rem
  )
);
```

Use lengths such as `576px` or `48rem`, or `0` for the base size.
Negative values aren't allowed. Choose names that aren't already used by
media variants or `responsive`.

## Custom media variants

Define your own media variants with `$custom-media-queries`:

```scss
@use "@ramstack/sass-utility-generator" as utilities with (
  $custom-media-queries: (
    landscape: "(orientation: landscape)",
    retina: "(min-resolution: 2dppx)"
  )
);

.visible {
  @include utilities.variants(landscape, retina) {
    visibility: visible;
  }
}
```

Write media queries as strings. Names already used by built-in variants or
`responsive` are reserved.

## Options

Use `options($options, $variants...)` to reuse CSS rules across a list or map of values:

### Sass lists

With a simple list, each item becomes both the class suffix and the CSS value:

```scss
.display {
  @include utilities.options(block inline none, responsive) using ($value...) {
    display: $value;
  }
}
```

This generates `.display-block`, `.display-inline`, and `.display-none`, plus
their responsive variants.

The `$value...` parameter collects the two arguments passed by `options()`:
the list item and `null`. Sass leaves `null` out of the CSS, so `display`
receives just the item.

For values with multiple parts, such as `1px solid red`, use a map.

### Sass maps

Use a map to give each value its own class suffix:

```scss
.text {
  $colors: (
    muted: #666,
    danger: #c00
  );

  @include utilities.options($colors, hover) using ($name, $value) {
    color: $value;
  }
}
```

This generates `.text-muted`, `.text-danger`, and their `hover:` variants.

For a default value, use `null` or `""` as the key to keep the original class name:

```scss
.rounded {
  @include utilities.options((null: 0.25rem, pill: 9999px)) using ($name, $value) {
    border-radius: $value;
  }
}
```

The result contains `.rounded` and `.rounded-pill`.

### Options with pseudo-classes

To make an option apply only on hover or focus, nest those states inside `options()`:

```scss
.link {
  @include utilities.options((
    primary: #2563eb,
    danger: #dc2626
  )) using ($name, $color) {
    &:hover,
    &:focus-visible {
      color: $color;
    }
  }
}
```

This creates selectors such as `.link-primary:hover` and `.link-danger:focus-visible`.
The colors apply only in these states; no base color or `hover:` class is generated.
Use `options(..., hover)` when you also want base classes and `hover:` variants.

Keep `:hover` and similar states inside the mixin block. Calling `options()`
inside `.link:hover` isn't supported.

### Root options

Outside a selector, map keys become complete class names:

```scss
@include utilities.options((visible: visible, invisible: hidden)) using ($name, $value) {
  visibility: $value;
}
```

This generates `.visible` and `.invisible`. Keys can't be `null` or `""` here
because there's no existing class name to use.

## Combining variants

Pass state and media variants together to combine them (except for `print`):

```scss
.text-red {
  @include utilities.variants(hover, dark) {
    color: red;
  }
}
```

This creates `.text-red` and its `hover:` variant, then adds `dark:` versions
of both inside the media query.

Each media variant in a call gets a separate media rule. To require both
conditions at once, nest mixins:

```scss
.text-red {
  @include utilities.responsive() {
    @include utilities.colorschemes() {
      color: red;
    }
  }
}
```

Alongside the responsive and color-scheme variants, this generates combinations such as:

```css
@media (min-width: 576px) and (prefers-color-scheme: dark) {
  .dark\:sm\:text-red {
    color: red;
  }
}
```

The inner mixin's prefix comes first in the class name. Swap the nesting
to get `.sm\:dark\:text-red` instead.

## Shorthands

| Mixin            | Equivalent call         |
|------------------|-------------------------|
| `responsive()`   | `variants(responsive)`  |
| `light()`        | `variants(light)`       |
| `dark()`         | `variants(dark)`        |
| `colorschemes()` | `variants(light, dark)` |
| `print()`        | `variants(print)`       |

```scss
.text-red {
  @include utilities.dark() {
    color: red;
  }
}
```

## Selector rules and limitations

- Call `variants()` inside a class selector.
- Descendant selectors and selector lists work too, as long as each target
  ends in a single class: `.card .title, .dialog .title`.
- For pseudo-elements such as `::before`, nest them inside the mixin block:

  ```scss
  .icon {
    @include utilities.variants(hover) {
      &::before {
        color: red;
      }
    }
  }
  ```

- Targets such as `.button.active` aren't supported: the generator can't tell
  which class to modify.
- Option keys, variant names, and breakpoint names become part of CSS class names.
  Use valid class-name fragments; the generator doesn't escape spaces, slashes,
  or punctuation.

## API reference

| API                               | Purpose                                      |
|-----------------------------------|----------------------------------------------|
| `$grid-breakpoints`               | Configures responsive min-width variants     |
| `$custom-media-queries`           | Adds named media variants                    |
| `variants($variants...)`          | Adds pseudo-class, group, and media variants |
| `options($options, $variants...)` | Generates classes from a list or map         |
| `responsive()`                    | Adds all responsive variants                 |
| `light()` / `dark()`              | Adds one color-scheme variant                |
| `colorschemes()`                  | Adds both color-scheme variants              |
| `print()`                         | Adds the print variant                       |

## Development

Install dependencies, compile each sample to `samples/css/`, and run the test suite:

```sh
npm install
npm run build:samples
npm test
```

The project is licensed under the [MIT License](LICENSE).
