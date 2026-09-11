import assert from "node:assert/strict";
import { test } from "node:test";
import { dirname, resolve } from "node:path";
import { fileURLToPath as file_url_to_path } from "node:url";
import { compileString as compile_sass } from "sass";

const project_root = resolve(dirname(file_url_to_path(import.meta.url)), "..");

function compile(source, breakpoints, media_queries) {
  const settings = [];

  if (breakpoints) {
    settings.push(`$grid-breakpoints: ${breakpoints}`);
  }

  if (media_queries) {
    settings.push(`$custom-media-queries: ${media_queries}`);
  }

  const configuration = settings.length
    ? ` with (${settings.join(", ")})`
    : "";

  return compile_sass(
    `@use "utility-generator" as utilities${configuration};\n${source}`,
    {
      loadPaths: [project_root],
      style: "expanded",
    },
  ).css.trim();
}

function expected_media_variant(variant, query) {
  return String.raw`.x {
  color: red;
}

@media ${query} {
  .${variant}\:x {
    color: red;
  }
}`;
}

test("variants generates base and pseudo-class selectors", () => {
  const actual = compile(`
    .button {
      @include utilities.variants(hover, focus-visible) {
        color: red;
      }
    }
  `);

  assert.equal(
    actual,
    String.raw`.button, .hover\:button:hover, .focus-visible\:button:focus-visible {
  color: red;
}`,
  );
});

test("variants modifies the final segment of every selector", () => {
  const actual = compile(`
    .layout .item, .menu .item {
      @include utilities.variants(focus) {
        color: red;
      }
    }
  `);

  assert.equal(
    actual,
    String.raw`.layout .item, .menu .item, .layout .focus\:item:focus, .menu .focus\:item:focus {
  color: red;
}`,
  );
});

test("group variants require group- at the start of the name", () => {
  const actual = compile(`
    .x {
      @include utilities.variants(group-hover, foo-group-hover) {
        color: red;
      }
    }
  `);

  assert.equal(
    actual,
    String.raw`.x, .group:hover .group-hover\:x, .foo-group-hover\:x:foo-group-hover {
  color: red;
}`,
  );
});

test("group variants combine with media variants", () => {
  const actual = compile(
    `
      .x {
        @include utilities.variants(group-hover, responsive) {
          color: red;
        }
      }
    `,
    "(phone: 400px)",
  );

  assert.equal(
    actual,
    String.raw`.x, .group:hover .group-hover\:x {
  color: red;
}

@media (min-width: 400px) {
  .phone\:x, .group:hover .phone\:group-hover\:x {
    color: red;
  }
}`,
  );
});

test("built-in media variants generate their query and class prefix", () => {
  const variants = new Map([
    ["light", "(prefers-color-scheme: light)"],
    ["dark", "(prefers-color-scheme: dark)"],
    ["pointer", "(pointer: fine)"],
    ["touch", "(pointer: coarse)"],
    ["contrast", "(prefers-contrast: more)"],
    ["reduce", "(prefers-reduced-motion: reduce)"],
    ["motion", "(prefers-reduced-motion: no-preference)"],
  ]);

  for (const [variant, query] of variants) {
    const actual = compile(`
      .x {
        @include utilities.variants(${variant}) {
          color: red;
        }
      }
    `);

    assert.equal(actual, expected_media_variant(variant, query), variant);
  }
});

test("responsive omits zero and generates configured breakpoints in order", () => {
  const actual = compile(
    `
      .x {
        @include utilities.responsive() {
          color: red;
        }
      }
    `,
    "(zero: 0, phone: 400px, wide: 900px)",
  );

  assert.equal(
    actual,
    String.raw`.x {
  color: red;
}

@media (min-width: 400px) {
  .phone\:x {
    color: red;
  }
}
@media (min-width: 900px) {
  .wide\:x {
    color: red;
  }
}`,
  );
});

test("responsive uses the default breakpoint map", () => {
  const actual = compile(`
    .x {
      @include utilities.responsive() {
        color: red;
      }
    }
  `);

  const queries = [...actual.matchAll(/@media ([^{]+)\s+\{/g)].map((match) =>
    match[1].trim(),
  );
  const prefixes = [...actual.matchAll(/\.([a-z]+)\\:x/g)].map(
    (match) => match[1],
  );

  assert.deepEqual(queries, [
    "(min-width: 576px)",
    "(min-width: 768px)",
    "(min-width: 992px)",
    "(min-width: 1200px)",
    "(min-width: 1400px)",
  ]);
  assert.deepEqual(prefixes, ["sm", "md", "lg", "xl", "xxl"]);
  assert.doesNotMatch(actual, /\.xs\\:x/);
});

test("reserved breakpoint names are rejected", () => {
  const reservedNames = [
    "responsive",
    "light",
    "dark",
    "pointer",
    "touch",
    "contrast",
    "reduce",
    "motion",
    "print",
  ];

  for (const name of reservedNames) {
    assert.throws(
      () => compile("", `(${name}: 900px)`),
      new RegExp(`Breakpoint \`${name}\` conflicts with a media variant\\.`),
      name,
    );
  }
});

test("breakpoints must be zero or non-negative lengths", () => {
  for (const value of ["null", "false", "400", "-1px"]) {
    assert.throws(
      () => compile("", `(invalid: ${value})`),
      /Breakpoint `invalid` must be zero or a non-negative length\./,
      value,
    );
  }
});

test("breakpoints must be a map", () => {
  assert.throws(
    () => compile("", "(phone 400px, wide 900px)"),
    /\$grid-breakpoints must be a map\./,
  );
});

test("custom media variants are configurable", () => {
  const actual = compile(
    `
      .x {
        @include utilities.variants(landscape) {
          color: red;
        }
      }
    `,
    null,
    `(landscape: "(orientation: landscape)")`,
  );

  assert.equal(
    actual,
    expected_media_variant("landscape", "(orientation: landscape)"),
  );
});

test("custom media variants reject reserved names and non-string queries", () => {
  assert.throws(
    () => compile("", null, `(dark: "(color)")`),
    /Custom media variant `dark` conflicts with a built-in variant\./,
  );
  assert.throws(
    () => compile("", null, `(responsive: "(color)")`),
    /Custom media variant `responsive` conflicts with a built-in variant\./,
  );
  assert.throws(
    () => compile("", null, `(landscape: 1)`),
    /Custom media query `landscape` must be a string\./,
  );
});

test("breakpoint names cannot shadow custom media variants", () => {
  assert.throws(
    () =>
      compile(
        "",
        `(landscape: 900px)`,
        `(landscape: "(orientation: landscape)")`,
      ),
    /Breakpoint `landscape` conflicts with a media variant\./,
  );
});

test("responsive combines with pseudo variants", () => {
  const actual = compile(
    `
      .x {
        @include utilities.variants(focus, responsive) {
          color: red;
        }
      }
    `,
    "(phone: 400px)",
  );

  assert.equal(
    actual,
    String.raw`.x, .focus\:x:focus {
  color: red;
}

@media (min-width: 400px) {
  .phone\:x, .phone\:focus\:x:focus {
    color: red;
  }
}`,
  );
});

test("media shorthands generate the corresponding variants", () => {
  const shorthands = new Map([
    ["light", "(prefers-color-scheme: light)"],
    ["dark", "(prefers-color-scheme: dark)"],
    ["print", "print"],
  ]);

  for (const [mixin, query] of shorthands) {
    const actual = compile(`
      .x {
        @include utilities.${mixin}() {
          color: red;
        }
      }
    `);

    assert.equal(actual, expected_media_variant(mixin, query), mixin);
  }
});

test("colorschemes generates light and dark variants", () => {
  const actual = compile(`
    .x {
      @include utilities.colorschemes() {
        color: red;
      }
    }
  `);

  assert.equal(
    actual,
    String.raw`.x {
  color: red;
}

@media (prefers-color-scheme: light) {
  .light\:x {
    color: red;
  }
}
@media (prefers-color-scheme: dark) {
  .dark\:x {
    color: red;
  }
}`,
  );
});

test("nested media mixins combine queries and class prefixes", () => {
  const actual = compile(
    `
      .x {
        @include utilities.responsive() {
          @include utilities.colorschemes() {
            color: red;
          }
        }
      }
    `,
    "(phone: 400px)",
  );

  assert.equal(
    actual,
    String.raw`.x {
  color: red;
}

@media (prefers-color-scheme: light) {
  .light\:x {
    color: red;
  }
}
@media (prefers-color-scheme: dark) {
  .dark\:x {
    color: red;
  }
}

@media (min-width: 400px) {
  .phone\:x {
    color: red;
  }
}
@media (min-width: 400px) and (prefers-color-scheme: light) {
  .light\:phone\:x {
    color: red;
  }
}
@media (min-width: 400px) and (prefers-color-scheme: dark) {
  .dark\:phone\:x {
    color: red;
  }
}`,
  );
});

test("print does not combine with pseudo variants", () => {
  const actual = compile(`
    .x {
      @include utilities.variants(hover, print) {
        color: red;
      }
    }
  `);

  assert.equal(
    actual,
    String.raw`.x, .hover\:x:hover {
  color: red;
}

@media print {
  .print\:x {
    color: red;
  }
}`,
  );
});

test("options preserves list values in responsive variants", () => {
  const actual = compile(
    `
      .display {
        @include utilities.options(block inline none, responsive) using ($value...) {
          display: $value;
        }
      }
    `,
    "(phone: 400px)",
  );

  assert.equal(
    actual,
    `.display-block {
  display: block;
}

.display-inline {
  display: inline;
}

.display-none {
  display: none;
}

@media (min-width: 400px) {
  .phone\\:display-block {
    display: block;
  }
  .phone\\:display-inline {
    display: inline;
  }
  .phone\\:display-none {
    display: none;
  }
}`,
  );
});

test("options treats an empty key as an unsuffixed selector", () => {
  const actual = compile(`
    .text {
      @include utilities.options(("": black)) using ($key, $value) {
        color: $value;
      }
    }
  `);

  assert.equal(
    actual,
    `.text {
  color: black;
}`,
  );
});

test("options supports maps, null keys, and selector lists", () => {
  const actual = compile(`
    .primary .text, .secondary .text {
      @include utilities.options((null: black, danger: red)) using ($key, $value) {
        color: $value;
      }
    }
  `);

  assert.equal(
    actual,
    `.primary .text, .secondary .text {
  color: black;
}

.primary .text-danger, .secondary .text-danger {
  color: red;
}`,
  );
});

test("root options uses map keys as complete class names", () => {
  const actual = compile(`
    @include utilities.options((visible: visible, invisible: hidden)) using ($key, $value) {
      visibility: $value;
    }
  `);

  assert.equal(
    actual,
    `.visible {
  visibility: visible;
}

.invisible {
  visibility: hidden;
}`,
  );
});

test("options combines pseudo, responsive, and print variants", () => {
  const actual = compile(
    `
      .badge {
        @include utilities.options((hot: red), hover, responsive, print) using ($key, $value) {
          color: $value;
        }
      }
    `,
    "(phone: 400px)",
  );

  assert.equal(
    actual,
    String.raw`.badge-hot, .hover\:badge-hot:hover {
  color: red;
}

@media (min-width: 400px) {
  .phone\:badge-hot, .phone\:hover\:badge-hot:hover {
    color: red;
  }
}
@media print {
  .print\:badge-hot {
    color: red;
  }
}`,
  );
});

test("variants rejects selectors whose target is not a class", () => {
  assert.throws(
    () =>
      compile(`
        button {
          @include utilities.variants(hover) {
            color: red;
          }
        }
      `),
    /Expected the final selector segment to be a single class/,
  );
});

test("variants rejects compound classes and pseudo-elements", () => {
  for (const selector of [".x.active", ".x::before"]) {
    assert.throws(
      () =>
        compile(`
          ${selector} {
            @include utilities.variants(hover) {
              color: red;
            }
          }
        `),
      /Expected the final selector segment to be a single class/,
      selector,
    );
  }
});

test("options rejects compound classes and pseudo-elements", () => {
  for (const selector of [".x.active", ".x::before"]) {
    assert.throws(
      () =>
        compile(`
          ${selector} {
            @include utilities.options((red: red)) using ($key, $value) {
              color: $value;
            }
          }
        `),
      /Expected the final selector segment to be a single class/,
      selector,
    );
  }
});

test("pseudo-elements can be nested inside variants", () => {
  const actual = compile(`
    .x {
      @include utilities.variants(hover) {
        &::before {
          color: red;
        }
      }
    }
  `);

  assert.equal(
    actual,
    String.raw`.x::before, .hover\:x:hover::before {
  color: red;
}`,
  );
});

test("variants requires an enclosing selector", () => {
  assert.throws(
    () =>
      compile(`
        @include utilities.variants(hover) {
          color: red;
        }
      `),
    /variants\(\) must be included inside a selector\./,
  );
});

test("root options rejects empty class names", () => {
  assert.throws(
    () =>
      compile(`
        @include utilities.options((null: red)) using ($key, $value) {
          color: $value;
        }
      `),
    /Root options must use non-empty class names\./,
  );
});
