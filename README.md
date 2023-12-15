# Utility Generator for SCSS

This utility simplifies the process of creating utility classes in SASS/SCSS, automating the generation of styles based on variants and options.

## Variants

Variants allow the application of specific utility styles under defined conditions. This utility includes two main mixins: `variants` and `options`. While there are additional helper variants, they are essentially shorthands for the `variants` mixin with matching names: `responsive`, `light`, `dark`, `colorschemes`, and `print`.

### Examples

```scss
.text-red {
    @include variants(hover, active) {
        color: red;
    }
}
```

Generated CSS:

```css
.text-red, .hover\:text-red:hover, .active\:text-red:active {
    color: red;
}
```

The `variants` mixin accepts a list of valid CSS pseudo-class names, such as `valid`, `invalid`, `visited`, `focus-within`, `focus-visible`, and others. In addition, it includes: `responsive`, `light`, `dark`, `colorschemes` and `print`.

```scss
.text-red {
    @include variants(light, dark, print) {
        color: red;
    }
}
```

Generated CSS:

```css
.text-red {
    color: red;
}

@media (prefers-color-scheme: light) {
    .light\:text-red {
        color: red;
    }
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

Variants can be combined with pseudo-class variants:

```scss
.text-red {
    @include variants(active, focus, light, dark) {
        color: red;
    }
}
```

Generated CSS:

```css
.text-red,
.active\:text-red:active,
.focus\:text-red:focus {
    color: red;
}

@media (prefers-color-scheme: light) {
    .light\:text-red,
    .light\:active\:text-red:active,
    .light\:focus\:text-red:focus {
        color: red;
    }
}

@media (prefers-color-scheme: dark) {
    .dark\:text-red,
    .dark\:active\:text-red:active,
    .dark\:focus\:text-red:focus {
        color: red;
    }
}
```

Exploring another variant - `responsive`:

The `responsive` variant is a feature that facilitates the creation of responsive utility classes. This variant allows you to generate styles tailored to different screen sizes by utilizing predefined breakpoints.

The `responsive` variant relies on the variable `$grid-breakpoints`, which contains default breakpoints for various screen sizes. By default, it includes breakpoints for extra-small (`xs`), small (`sm`), medium (`md`), large (`lg`), extra-large (`xl`), and double extra-large (`xxl`) screens.

```scss
$grid-breakpoints: (
  xs: 0,
  sm: 576px,
  md: 768px,
  lg: 992px,
  xl: 1200px,
  xxl: 1400px
) !default;
```

```scss
.sr-only {
    @include variants(responsive) {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
    }
}
```

Generated CSS:

```css
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
}

@media (min-width: 576px) {
    .sm\:sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
    }
}
```

For brevity, generated code for other breakpoints have been omitted.

For example:

```scss
.not-sr-only {
    @include variants(focus, responsive) {
        position: static;
        width: auto;
        height: auto;
        padding: 0;
        margin: 0;
        overflow: visible;
        clip: auto;
        white-space: normal;
    }
}
```

Generated CSS:

```css
.not-sr-only, .focus\:not-sr-only:focus {
    position: static;
    width: auto;
    height: auto;
    padding: 0;
    margin: 0;
    overflow: visible;
    clip: auto;
    white-space: normal;
}

@media (min-width: 576px) {
    .sm\:not-sr-only, .sm\:focus\:not-sr-only:focus {
        position: static;
        width: auto;
        height: auto;
        padding: 0;
        margin: 0;
        overflow: visible;
        clip: auto;
        white-space: normal;
    }
}
```

Again, generated code for other breakpoints are omitted.

You can customize the breakpoints by defining your own `$grid-breakpoints` variable before including the `_utility-generator.scss` file in your project.

```scss
$custom-breakpoints: (
  xs: 0,
  sm: 480px,
  md: 768px,
  lg: 1024px,
  xl: 1200px
);

@import 'path/to/_utility-generator.scss';
```

By using the `responsive` variant, you can efficiently generate responsive utility classes for different screen sizes without manually writing extensive CSS rules for each breakpoint.


## Shorthands

When using only one variant from the list (`responsive`, `light`, `dark`, `colorschemes`, `print`), the corresponding shorthand can be used instead:

```scss
.text-red {
    // @include variants(dark)
    @include dark() {
        color: red;
    }
}
```

## Group variants

The `variants` mixin also supports variants with the `group-{modifier}` prefix, allowing styling based on the parent element's state.

For example:

```scss
.bg-gray {
    @include variants(group-hover) {
        background-color: #555;
    }
}
```

Generated CSS:

```css
.bg-gray, .group:hover .group-hover\:bg-gray {
    background-color: #555;
}
```

This allows styling inner elements based on the parent's state. To achieve this, assign the `.group` class to the parent and use the corresponding prefixed class for the child element (e.g., `.group-hover:bg-gray`).

```html
<div class="group">
    <div class="flex items-center">
        <svg >...</svg>
        <span class="text-green group-hover:bg-gray">Some text</span>
    </div>
</div>
```

## Options

The `options` mixin enables the use of additional parameters for class name generation.

Returning to our `.text-red` class example, creating classes for various colors using only the `variants` mixin would require manually writing a loop, which is inconvenient. Hence, the `options` mixin.

```scss
.text {
    $colors: (red, green, blue);

    @include options($colors) using ($value...) {
        color: $value;
    }
}
```

This generates class names according to the values in the provided array: `.text-red`, `.text-green`, `.text-blue`. The array values at each step are obtained using the `using ($value...)` operator, used to set the class color.

The `options` mixin also supports maps. In cases where the key name is distinct from its corresponding value, as demonstrated in the following example, you can utilize maps for enhanced flexibility:

```scss
.text {
    $colors: (red: #FF0000, green: #00FF00, blue: #0000FF);

    @include options($colors) using ($key, $value) {
        color: $value;
    }
}
```

This generates the following CSS:

```css
.text-red {
    color: #FF0000;
}

.text-green {
    color: #00FF00;
}

.text-blue {
    color: #0000FF;
}
```

By using `null` as a key, the name is used as-is, allowing us to use it as a default value:

```scss
.text {
    $colors: (null: #000, red: #FF0000, green: #00FF00, blue: #0000FF);

    @include options($colors) using ($key, $value) {
        color: $value;
    }
}
```

Generated CSS:

```css
.text {
    color: #000;
}

.text-red {
    color: #FF0000;
}

.text-green {
    color: #00FF00;
}

.text-blue {
    color: #0000FF;
}
```

The `options` mixin also allows the use of variants:

```scss
.text {
    $colors: (null: #232323, red: #FF0000, green: #00FF00, blue: #0000FF);

    @include options($colors, active, hover, responsive) using ($key, $value) {
        color: $value;
    }
}
```

One additional feature of the `options` mixin is when the map's names already define class names. In such cases, it can be used as follows:

```scss
$colors: (red: #FF0000, green: #00FF00, blue: #0000FF);

@include options($colors, active, hover) using ($key, $value) {
    color: $value;
}
```

This generates classes where the key is used as the class name:

```css
.red, .active\:red:active, .hover\:red:hover {
    color: #FF0000;
}

.green, .active\:green:active, .hover\:green:hover {
    color: #00FF00;
}

.blue, .active\:blue:active, .hover\:blue:hover {
    color: #0000FF;
}
```

## Refinements

Note that the options `responsive`, `light`, `dark`, `colorschemes`, and `print` are equivalent, meaning classes will be generated separately for each variant. However, if you need to combine classes, for example, for light/dark and responsive variants, you should write the code as follows:

```scss
.text-red {
  @include responsive() {
    @include variants(light, dark) {
      color: red;
    }
  }
}
```

The class `.text-red` will be generated separately for `light`, `dark`, and `responsive` variants, as well as colorscheme and responsive combinations:

```scss
.text-red {
  color: red;
}

@media (prefers-color-scheme: light) {
  .light\:text-red {
    color: red;
  }
}

@media (prefers-color-scheme: dark) {
  .dark\:text-red {
    color: red;
  }
}

@media (min-width: 576px) {
  .sm\:text-red {
    color: red;
  }
}

@media (min-width: 576px) and (prefers-color-scheme: light) {
  .light\:sm\:text-red {
    color: red;
  }
}

@media (min-width: 576px) and (prefers-color-scheme: dark) {
  .dark\:sm\:text-red {
    color: red;
  }
}
```

Also, note that the last used mixin takes precedence, meaning its prefix will come first. In our case, we get `dark:sm:text-red`. If we had used the responsive mixin last, the class names would be `sm:dark:text-red`.

```scss
.text-red {
  @include variants(light, dark) {
    @include responsive() {
      color: red;
    }
  }
}
```

To add or modify the media types you can use, edit the map in the `-create-media-queries-map` function as needed, as it is relevant to your requirements.

```scss
$map: (
  light: "(prefers-color-scheme: light)",
  dark: "(prefers-color-scheme: dark)",
  pointer: "(pointer: fine)",
  touch: "(pointer: coarse)",
  contrast: "(prefers-contrast: more)",
  reduce: "(prefers-reduced-motion: reduce)",
  motion: "(prefers-reduced-motion: no-preference)",
  print: "print"
);
```