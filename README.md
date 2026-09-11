# Sass Utility Generator

A small Sass module for generating utility classes from lists and maps,
with support for state, group, media-query, and responsive variants.

The module provides the generator, not a predefined utility framework.
You choose the class names, values, and CSS declarations that your project needs.

## Requirements

The generator uses the Sass module system and built-in modules, so it requires
[Dart Sass](https://sass-lang.com/dart-sass/). Make `_utility-generator.scss` available
on your Sass load path or place it next to the stylesheet that uses it.

## Quick start

```scss
@use "utility-generator" as utilities;

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

The generated classes can then be used directly in markup:

```html
<button class="opacity-50 hover:opacity-100">...</button>
```

## Samples

The standalone samples build on one another in this order:

1. [Basic utility](samples/01-basic-utility.scss)
2. [List options](samples/02-list-options.scss)
3. [Map options](samples/03-map-options.scss)
4. [State variants](samples/04-state-variants.scss)
5. [Group variant](samples/05-group-variant.scss)
6. [Responsive utilities](samples/06-responsive.scss)
7. [Custom breakpoints](samples/07-custom-breakpoints.scss)
8. [Custom media variants](samples/08-custom-media.scss)
9. [Combining variants](samples/09-combining-variants.scss)

Compile all samples to separate files in `samples/css/`:

```sh
pnpm build:samples
```

## Mental model

The generator builds class names in three steps:

| Input                                 | Generated class                       |
|---------------------------------------|---------------------------------------|
| `.display` with option `block`        | `.display-block`                      |
| `.display-block` with variant `hover` | `.hover\:display-block:hover`         |
| `.display-block` with breakpoint `md` | `@media (...) { .md\:display-block }` |

The original, unprefixed selector is always generated. Variants add selectors;
they do not replace the base selector.

## Variants

Use `variants($variants...)` inside a class selector to add conditional forms of the same utility:

```scss
@use "utility-generator" as utilities;

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

Names that are not registered media variants are emitted as CSS pseudo-classes.
The generator does not validate pseudo-class names,
which allows new and vendor-specific pseudo-classes but also means
that misspellings are not detected.

### Group variants

A variant beginning with `group-` applies a state from a `.group` ancestor:

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

Use `.group` on the parent and the generated variant class on a descendant:

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

`pointer` and `touch` describe the primary pointing device.
They do not test whether any fine or coarse pointer exists on a hybrid device.

Media variants are emitted in their own `@media` rules:

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

`print` intentionally does not combine with pseudo-class variants passed in the same call.
Interactive states such as `hover` and `focus` have no useful meaning in printed output.

## Responsive variants

The `responsive` variant creates one media rule for every configured non-zero
breakpoint:

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

A zero value represents the base selector and does not generate a prefixed class.
With the default configuration, `.display-block` covers `xs`, 
while `.sm\:display-block` through `.xxl\:display-block` are emitted
in min-width media queries.

Configure breakpoints when loading the module:

```scss
@use "utility-generator" as utilities with (
  $grid-breakpoints: (
    mobile: 0,
    tablet: 48rem,
    desktop: 75rem
  )
);
```

Breakpoint values must be zero or non-negative Sass lengths.
Breakpoint names must not conflict with built-in or custom media variant names.

## Custom media variants

Add project-specific media variants through `$custom-media-queries`:

```scss
@use "utility-generator" as utilities with (
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

Media query values must be strings. Custom names cannot replace built-in variants or `responsive`.

## Options

Use `options($options, $variants...)` to generate several utilities from the same declaration block.

### Sass lists

A flat Sass list uses each item as both the class suffix and declaration value:

```scss
.display {
  @include utilities.options(block inline none, responsive) using ($value...) {
    display: $value;
  }
}
```

This generates `.display-block`, `.display-inline`, and `.display-none`, plus
their responsive variants. The rest argument is used because the content block
receives the option key and value; list options have no separate mapped value.

Use a map instead of a structured list when a CSS value contains multiple parts.

### Sass maps

A map separates the class suffix from its CSS value:

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

Inside a selector, a `null` or empty-string key leaves the selector unsuffixed.
This is useful for a default value:

```scss
.rounded {
  @include utilities.options((null: 0.25rem, pill: 9999px)) using ($name, $value) {
    border-radius: $value;
  }
}
```

The result contains `.rounded` and `.rounded-pill`.

### Root options

At the stylesheet root, map keys are complete class names rather than suffixes:

```scss
@include utilities.options((visible: visible, invisible: hidden)) using ($name, $value) {
  visibility: $value;
}
```

This generates `.visible` and `.invisible`. Root options require non-empty keys
because there is no enclosing selector to use as a class name.

## Combining variants

Pseudo-class variants and media variants passed to one mixin are combined automatically:

```scss
.text-red {
  @include utilities.variants(hover, dark) {
    color: red;
  }
}
```

This emits the base and `hover:` selectors, then their `dark:` counterparts
in the dark media query.

Multiple media variants passed to one call are alternatives and produce
separate media rules. Nest mixins when the conditions must be combined with
`and`:

```scss
.text-red {
  @include utilities.responsive() {
    @include utilities.colorschemes() {
      color: red;
    }
  }
}
```

In addition to the separate responsive and color-scheme rules, this produces rules such as:

```css
@media (min-width: 576px) and (prefers-color-scheme: dark) {
  .dark\:sm\:text-red {
    color: red;
  }
}
```

The innermost mixin contributes the leftmost class prefix. Reversing the nesting above
produces `.sm\:dark\:text-red` instead. This affects class names, not CSS cascade precedence.

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

- Call `variants()` inside a selector. Root-level variant generation is not supported.
- Start generation from a class selector. Selector lists and descendant
  selectors work when each final target is a class, such as `.card .title, .dialog .title`.
- Put pseudo-elements inside the generated content block rather than invoking
  a generator on `.class::before`:

  ```scss
  .icon {
    @include utilities.variants(hover) {
      &::before {
        color: red;
      }
    }
  }
  ```

- Compound class targets such as `.button.active` are not supported because it
  is ambiguous which class should receive an option or variant.
- Option keys, variant names, and breakpoint names are inserted into class
  names as-is. They must be valid CSS class-name fragments; the generator does
  not escape spaces, slashes, or punctuation.
- Group variants always use the `.group` ancestor.
- The base selector is always emitted.
- `print` is isolated from interactive pseudo-class variants.

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
pnpm install
pnpm build:samples
pnpm test
```

The project is licensed under the [MIT License](LICENSE).
