# Post-Cell Modification & Painter Standard

This document defines the **standard architecture, data contract, and painter implementation** for post-cell (two-column) sections. Use it when updating painters and model data at scale.

**Canonical references**

| Artifact | Path |
|----------|------|
| Model data | `src/drafting/modelData/about.ts` → **`aboutModern`** (from line 748; **selectors 750–755**) |
| Painter | `src/drafting/painter/about/aboutModernPainter.tsx` (`pickLeftCss`, `pickRightCss`, column branches) |
| Editor | `src/drafting/layoutEditor/DesignItemSettingsSidebar.tsx` (Type / Left / Right dropdowns) |
| Data standard | `src/doc/twocoulmmodification/MODELDATA_STANDARDIZATION.md` |

Every post-cell painter and its model object MUST align with these references.

---

## Table of contents

1. [Model ↔ painter contract](#1-model--painter-contract)
2. [Dependencies & responsibilities](#2-dependencies--responsibilities)
3. [Painter imports (standard)](#3-painter-imports-standard)
4. [Painter execution order](#4-painter-execution-order)
5. [CSS in model, not in painter](#5-css-in-model-not-in-painter)
6. [Null safety](#6-null-safety)
7. [Theme, CSS variables, borders, layout, typography](#7-theme-css-variables-borders-layout-typography)
8. [Background studio](#8-background-studio)
9. [Enhancers](#9-enhancers)
10. [Data rendering (header, media, statistics, CTA)](#10-data-rendering-header-media-statistics-cta)
11. [mediaCells slots (formerly mediaCells)](#11-mediacells-slots-formerly-mediaCells)
12. [HTML & preview in data and mediaCells](#12-html--preview-in-data-and-mediacells)
13. [Framer Motion & first-time appearance](#13-framer-motion--first-time-appearance)
14. [Hover effects](#14-hover-effects)
15. [Click properties & link interactions](#15-click-properties--link-interactions)
16. [Layout types (Type1–Type4)](#16-layout-types-type1type4)
17. [Section shell structure](#17-section-shell-structure)
18. [Responsive & media behavior](#18-responsive--media-behavior)
19. [Accessibility](#19-accessibility)
20. [Migration from legacy painters](#20-migration-from-legacy-painters)
21. [Validation checklist](#21-validation-checklist)
22. [Reference files](#22-reference-files)
23. [Chunk-by-chunk execution reference](#23-chunk-by-chunk-execution-reference)
24. [Clone checklist: new component in same format](#24-clone-checklist-new-component-in-same-format)
25. [Cross-cutting concerns summary (878–1010)](#25-cross-cutting-concerns-summary-8781010)
26. [Independent column variants — architecture & flow](#26-independent-column-variants--architecture--flow)
27. [Painter implementation — pickLeftCss / pickRightCss](#27-painter-implementation--pickleftcss--pickrightcss)
28. [Adding TypeN to model + painter (repeatable workflow)](#28-adding-typen-to-model--painter-repeatable-workflow)

---

## 1. Model ↔ painter contract

Top-level model shape (see `aboutModern`):

```typescript
{
  id: string;                    // PascalCase, e.g. "AboutModern"
  type: string;                  // Section shell: grid order / single-column
  typeDropdown: string[];
  left?: string;                 // Left column internal layout
  leftDropdown?: string[];
  right?: string;                // Right column internal layout
  rightDropdown?: string[];

  data: { header, media, statistics, cta, /* optional html/preview fields */ };
  mediaCells: { topView, bottomView, leftTopView, leftBottomView, rightTopView, rightBottomView, insertView };
  css: { colorPalette, typography, borders, layout, tailwind, antd, mui, customCss };
  background?: { type, settings };
  enhancers?: EnhancerItem[];
  settings: { type, animations, interactions, reducedMotion, overlays? };
  checkboxes: { isPostCellVisible, isListVisible, ... };
  list: { type, settings, css, items };
  wrapper: [];
  animations: [];
}
```

> **Key rename:** Use **`mediaCells`**, not `mediaCells`. `aboutModernPainter` reads `item.mediaCells`.

### 1.1 `data.header`

| Field | Type | Painter usage |
|-------|------|----------------|
| `title` | `string?` | `mainTitle` span inside `title` h2 |
| `titleHighlight` | `string?` | `highlightTitle` span |
| `subtitle` | `string?` | `subtitle` motion.p |
| `description` | `string?` | `description` motion.p |
| `features` | `array?` | Each: `{ title, description, icon }` — **not** legacy `{ text, icon }` |

### 1.2 `data.media`

Nested media objects (not flat `images.main` URL):

```typescript
media: {
  main: {
    media: { mediaLink: string; mediaType: string; alt?: string };
  };
  overlay: {
    media: { mediaLink: string; mediaType: string; alt?: string };
  };
};
```

Painter reads `media?.main`, `media?.overlay`, passes each slot to **`renderMedia`**.

Supported types: `image`, `gif`, `youtube`, `mp4`, `iframe`, `audio`, `html`, `markdown`, `preview`, `cell`.

### 1.3 `data.statistics`

Array of `{ count, label }`. **`aboutModernPainter` renders only the first item** (`statisticsList[0]`) in the stats card overlay on the right column.

### 1.4 `data.cta`

```typescript
cta: {
  primary: {
    text: string;
    link: string;
    clickType?: string;   // default "href"
    icon?: { iconName, type, fontSize };
  };
  secondary?: { ... };    // optional; wire same pattern if needed
};
```

- `clickType === "href"` → `<motion.a href={link}>`
- Otherwise → `<motion.button type="button">` + `handleClickType`
- **Every button MUST be wired** to `useLinkInteractions` (modal, dialog, transition, link, href).

### 1.5 `mediaCells` (model)

Each slot is an array of **media items**:

```typescript
{ mediaType: "html", mediaLink: "<p class='...'>...</p>" }
{ mediaType: "cell", mediaLink: "" }   // empty = placeholder cell
{ mediaType: "preview", mediaLink: "https://example.com" }
```

Prefer theme CSS variables in HTML: `var(--about-textMuted,#4A5D73)` (prefix matches your component).

Legacy `{ type: "html", htmlView }` / `{ type: "cellLink", link }` still work in **GetBuildView** but new model data MUST use `mediaType` + `mediaLink`.

### 1.6 `css.tailwind`

All UI regions are string class names. Use `createSafeTailwind(css.tailwind)` → `finalCss?.container`, `finalCss?.featureItem`, etc. Keys in `aboutModern` include:

`global`, `container`, `grid`, `gridSingleColumn`, `leftColumn`, `title`, `mainTitle`, `highlightTitle`, `subtitle`, `description`, `featuresContainer`, `featureItem`, `featureIcon`, `featureContent`, `featureTitle`, `featureDescription`, `ctaContainer`, `ctaButton`, `ctaArrow`, `rightColumn`, `imageContainer`, `mainImage`, `image`, `overlayImage`, `overlayImageZ`, `statsCard`, `statsCount`, `statsLabel`.

### 1.7 CSS variable prefix

`aboutModernPainter` uses prefix **`about`** → `--about-primary`, `--about-layout-container-paddingX`, `--about-radius-features-tl`, etc.

When cloning for another component (e.g. Hero), replace **`about`** consistently in:

- Model `css.tailwind` fallbacks
- Painter `cssVariables` loop keys (or parameterize prefix)
- `mediaCells` inline HTML `var(--hero-...)`

---

## 2. Dependencies & responsibilities

| Module | Path | Responsibility |
|--------|------|----------------|
| **GetBuildView** | `layoutEditor/reusebleFunction/getBuildView` | Renders `mediaCells` slot arrays via unified media pipeline |
| **GetBuildEnhancer** | `layoutEditor/enhancer` | Renders `enhancers[]` (paragraph, heading, …) |
| **filterEnhancersByAlign** | `layoutEditor/enhancer` | Splits enhancers into `top` / `bottom` |
| **renderMedia** | `layoutEditor/media/media` | Images, html, markdown, cell, preview, video, etc. |
| **normalizeMediaType** | `layoutEditor/media/media` | Normalizes `mediaType` string |
| **renderBackgroundStudio** | `layoutEditor/backgroundStudio/backgrounds` | Decorative backgrounds (`FloatingBlobs`, …) |
| **useLinkInteractions** | `painter/utils/useLinkInteractions` | href / modal / dialog / transition / link |
| **renderIconFromDataWithTheme** | `painter/utils/renderIconFromData` | MUI icons with theme color from palette |
| **safeAccess** | `utils/safeAccess` | `safeObject`, `safeArray`, `createSafeTailwind` |
| **framer-motion** | — | `motion`, `useReducedMotion`, `useInView` |

### 2.1 GetBuildView

**Props**

```typescript
interface GetBuildViewProps {
  uiView?: ViewItem[] | null;
  markdownColorPalette?: MarkdownColorPaletteConfig;  // pass item.css.colorPalette
}
```

**ViewItem** (current + legacy)

```typescript
interface ViewItem {
  mediaType?: string;   // "html" | "markdown" | "cell" | "preview" | "image" | ...
  mediaLink?: string;
  alt?: string;
  // legacy (still resolved):
  type?: "html" | "cellLink";
  htmlView?: string;
  link?: string;
}
```

**Behavior**

- Returns `null` if `uiView` is null, undefined, or empty.
- Resolves each item → `renderMedia({ mediaLink, mediaType, alt, markdownColorPalette })`.
- Wraps output in `<div className="w-full max-w-full min-w-0">`.

**Painter helper** (canonical — reads `mediaCells`):

```typescript
const mediaCells = safeObject<Model["mediaCells"]>(item?.mediaCells);

const getMediaCellView = (key: MediaCellViewKey): ViewItem[] => {
  if (mediaCells == null || typeof mediaCells !== "object") return [];
  const raw = (mediaCells as Record<string, unknown>)[key];
  return safeArray<ViewItem>(raw);
};

const renderMediaCellView = (key: MediaCellViewKey) => {
  const view = getMediaCellView(key);
  if (view.length === 0) return null;
  return <GetBuildView uiView={view} markdownColorPalette={colorPalette} />;
};
```

> `aboutModernPainter` still names helpers `getHtmlView` / `renderHtmlView` internally — they read **`mediaCells`**.

### 2.2 renderMedia

Supported types include: `image`, `gif`, `youtube`, `mp4`, `iframe`, `audio`, `html`, `markdown`, `cell`, `preview`.

Always pass `markdownColorPalette: colorPalette` when rendering markdown/html that should respect section theme.

### 2.3 useLinkInteractions

```typescript
const {
  handleClick: handleLinkClick,
  renderModalContent,
  renderDialogContent,
  transitionContent,
  isTransition,
} = useLinkInteractions({ tailwind: linkInteractionTailwind });
```

`linkInteractionTailwind` = `settings.overlays.tailwind` when non-empty.

**handleClickType** wrapper:

```typescript
const handleClickType = (event, link?, clickType?) => {
  handleLinkClick?.({
    clickType,
    defaultClickType: "href",
    link,
    event,
  });
};
```

### 2.4 renderIconFromDataWithTheme

```typescript
renderIconFromDataWithTheme(icon, colorCode: string): ReactNode
```

- **icon**: `{ iconName, type, fontSize }` (Material UI) — defined in model `data`, not in painter.
- **colorCode**: resolved hex from active `colorPalette`.

**Theme colors in aboutModernPainter**

| Usage | Variable | Typical value (light) |
|-------|----------|------------------------|
| Feature icons | `iconColorPrimary` | `resolvedThemeColors.primary` |
| CTA arrow icon | `iconColorOnPrimary` | `resolvedThemeColors.onPrimary` |

---

## 3. Painter imports (standard)

```typescript
import React, { useMemo, useRef } from "react";
import { motion, useReducedMotion, useInView } from "framer-motion";
import { createSafeTailwind, safeObject, safeArray } from "../../utils/safeAccess";
import {
  useLinkInteractions,
  type LinkInteractionTailwindConfig,
} from "../utils/useLinkInteractions";
import { renderIconFromDataWithTheme } from "../utils/renderIconFromData";
import GetBuildView, { type ViewItem } from "../../layoutEditor/reusebleFunction/getBuildView";
import GetBuildEnhancer, {
  filterEnhancersByAlign,
  type EnhancerAlign,
} from "../../layoutEditor/enhancer";
import {
  normalizeMediaType,
  renderMedia,
  type MediaType,
} from "../../layoutEditor/media/media";
import { renderBackgroundStudio } from "../../layoutEditor/backgroundStudio/backgrounds";
```

Optional: type the model from modelData:

```typescript
type AboutModernModel = typeof import("../../modelData/about").aboutModern;
```

---

## 4. Painter execution order

Follow this order inside the painter component (matches `aboutModernPainter.tsx`):

| Step | What |
|------|------|
| 1 | Hooks: `useReducedMotion`, `sectionRef`, `useInView` |
| 2 | Safe reads: `data`, **`mediaCells`**, `css`, `enhancers`, `background`, `settings` |
| 3 | `getHtmlView(key)` / `getMediaCellView(key)` helper; `renderHtmlView`, `renderEnhancers` helpers |
| 4 | Resolve `themeMode`, icon colors, `cssVariables` (`useMemo`) |
| 5 | `createSafeTailwind` → `finalCss` |
| 6 | `useLinkInteractions` + `handleClickType` |
| 7 | **Early return** if `isTransition && transitionContent` |
| 8 | Destructure `header`, `media`, `statistics`, `cta` |
| 9 | Define `reducedState`, `layoutTransition`, renderers (`renderLeftColumn`, `renderRightColumn`, `renderPrimaryCta`) |
| 10 | `backgroundLayer` via `useMemo` + `renderBackgroundStudio` |
| 11 | `renderLayout` / `renderLayoutSingleColumn` + `contentRenderers` map |
| 12 | Invoke renderer by `item.type` (fallback `Type1`) |

---

## 5. CSS in model, not in painter

**Rule:** Painters MUST NOT contain Tailwind class strings, hex colors, or hover styling. All visual design lives in the model JSON:

| Concern | Model location | Painter responsibility |
|---------|----------------|------------------------|
| Colors / theme | `css.colorPalette` | Emit `--{prefix}-*` CSS variables |
| Font family / size | `css.typography` | Emit `--{prefix}-fontFamily-*`, `--{prefix}-fontSize-*` |
| Corner radius | `css.borders` | Emit `--{prefix}-radius-{section}-{corner}` |
| Spacing / gaps | `css.layout` | Emit `--{prefix}-layout-{section}-{prop}` |
| All UI classes | `css.tailwind` | `createSafeTailwind` → `finalCss?.title`, etc. |
| Hover / group-hover | `css.tailwind` | e.g. `group-hover:text-[var(--about-primary)]` on `featureItem` |
| Modal / dialog chrome | `settings.overlays.tailwind` | Passed to `useLinkInteractions` |
| Enhancer styling | `enhancers[].css.tailwind` | Rendered by `GetBuildEnhancer` |
| Button / icon layout | `css.tailwind` (`ctaButton`, `ctaArrow`) + `css.layout` | Painter applies `className={finalCss?.ctaButton}` only |

Painters may contain **layout helpers** (`resolveLayoutValue`, `parseRoundedDirection`) that translate model tokens into CSS variables — not visual class strings.

---

## 6. Null safety

```typescript
const data = safeObject<Model["data"]>(item?.data);
const mediaCells = safeObject<Model["mediaCells"]>(item?.mediaCells);
const css = safeObject<Model["css"]>(item?.css);
const enhancers = safeArray<unknown>((item as { enhancers?: unknown })?.enhancers);

const getHtmlView = (key: MediaCellViewKey): ViewItem[] => {
  if (mediaCells == null || typeof mediaCells !== "object") return [];
  const raw = (mediaCells as Record<string, unknown>)[key];
  return safeArray<ViewItem>(raw);
};
```

**Column null guards**

- **Left column**: return `null` if no `title`, `titleHighlight`, `subtitle`, `description`, `features.length`, or `cta.primary`.
- **Right column**: return `null` if no `main`/`overlay` media link and no `firstStat.count`.
- **Features**: skip items missing both `title` and `description`; skip non-object entries.
- **Media slot**: skip if missing `mediaLink` or `mediaType`.
- **mediaCells slot**: return `null` from renderer when array is empty (never crash on missing key).

**Tailwind**: `createSafeTailwind(tailwind)` — every key returns `""` when missing.

**Optional chaining everywhere:** `header?.title`, `cta?.primary?.icon`, `feature?.description`.

---

## 7. Theme, CSS variables, borders, layout, typography

### 7.1 colorPalette

```typescript
const themeMode = colorPalette?.theme === "dark" ? "dark" : "light";
const resolvedThemeColors =
  themeMode === "dark" ? colorPalette?.dark : colorPalette?.light;
```

Emit one CSS variable per palette key:

```typescript
for (const [key, value] of Object.entries(colors)) {
  colorEntries.push([`--about-${key}`, String(value)]);
}
```

Apply on `<section style={cssVariables} data-theme={themeMode}>`.

### 7.2 borders → radius CSS variables

`css.borders` maps section names to Tailwind radius tokens (`"lg"`, `"2xl"`, `"full"`) or directional (`"t-lg"`, `"tl-xl"`).

Painter helpers (copy into each painter or extract shared):

- `resolveRoundedValue` — maps `lg` → `0.5rem`, etc.
- `parseRoundedDirection` — `t-`, `b-`, `tl-`, … → corner list
- Output: `--about-radius-{section}-{tl|tr|br|bl}`

Sections in `aboutModern`: `features`, `quoteCard`, `descriptionCard`, `cta`, `statistics`, `statsPattern`, `frameDesign`, `cornerElement`, `mainImage`, `overlayImage`, `floatingAccent`.

Tailwind classes in **model** reference them:

```text
rounded-tl-[var(--about-radius-features-tl,0.5rem)]
```

### 7.3 layout → spacing CSS variables

```typescript
function resolveLayoutValue(value: string): string {
  const num = parseFloat(value.trim());
  if (Number.isNaN(num)) return value.trim();
  const rem = Math.abs(num) * 0.25;
  return num < 0 ? `-${rem}rem` : `${rem}rem`;
}
```

Emit: `--about-layout-{section}-{prop}` (e.g. `--about-layout-container-paddingX`).

### 7.4 typography

From `css.typography`:

- `fontFamily.sans`, `fontFamily.serif` → `--about-fontFamily-sans`, `--about-fontFamily-serif`
- `standard.fontSize.*` → `--about-fontSize-xs`, …, `--about-fontSize-title`
- `standard.lineHeight.*` → `--about-lineHeight-tight`, …
- `standard.letterSpacing.*` → `--about-letterSpacing-wider`, …

Tailwind in model uses these vars, e.g.:

```text
text-[var(--about-fontSize-lg,1.125rem)]
leading-[var(--about-lineHeight-relaxed,1.75)]
[font-family:var(--about-fontFamily-sans)]
```

---

## 8. Background studio

**Model**

```typescript
background: {
  type: "FloatingBlobs",
  settings: [
    { className: "w-72 h-72 top-10 left-10", duration: 10, colorKey: "primary" },
    { className: "w-96 h-96 bottom-10 right-10", duration: 14, colorKey: "accent" },
  ],
},
```

**Painter**

```typescript
const backgroundLayer = useMemo(
  () =>
    renderBackgroundStudio(background, {
      colorPalette,
      prefersReducedMotion,
      isInView,
    }),
  [background, colorPalette, prefersReducedMotion, isInView],
);
```

**Section placement**

- Section: `relative overflow-hidden` (via `finalCss.global`).
- Background wrapper: `absolute inset-0 overflow-hidden pointer-events-none z-0` + `aria-hidden="true"`.
- Content wrapper: `relative z-10`.

`renderBackgroundStudio` returns `null` when `background` is missing, `type` is empty, or `type === "None"`.

---

## 9. Enhancers

**Model** (`aboutModern.enhancers`)

```typescript
enhancers: [
  {
    type: "paragraph",
    align: "bottom",
    data: { text: "..." },
    css: {
      colorKey: "textMuted",
      tailwind: { global, wrapper, text },
    },
  },
  {
    type: "heading",
    align: "top",
    data: {
      text: "...",
      emphasisWords: ["timeless", "innovation"],
      animateBy: "character",
    },
    css: {
      colorKey: "text",
      emphasisColorKey: "primary",
      tailwind: { global, wrapper, text, emphasis },
    },
  },
],
```

**Painter**

```typescript
const renderEnhancers = (align: EnhancerAlign) => {
  const items = filterEnhancersByAlign(enhancers, align);
  if (items.length === 0) return null;
  return <GetBuildEnhancer items={items} colorPalette={colorPalette} />;
};
```

**Placement in section** (inside `relative z-10` wrapper)

| align | Render where |
|-------|----------------|
| `"top"` | Before `topView`, above container |
| `"bottom"` | After `bottomView`, below container |

Registered enhancer types: `heading`, `paragraph`, `images`, `video`, `youtube` (see `enhancerRegistry.tsx`).

`colorKey` / `emphasisColorKey` reference keys from `colorPalette` (e.g. `primary`, `textMuted`).

---

## 10. Data rendering (header, media, statistics, CTA)

### 10.1 Left column order

1. `renderHtmlView("leftTopView")`
2. Animated block (`leftColumn`):
   - Title (h2: `mainTitle` + `highlightTitle`)
   - Subtitle
   - Description
   - **`renderHtmlView("insertView")`** — between description and features
   - Features list (`role="list"`)
   - CTA container → `renderPrimaryCta()`
3. `renderHtmlView("leftBottomView")`

### 10.2 Right column order

1. `renderHtmlView("rightTopView")`
2. Animated block (`rightColumn`):
   - `imageContainer`:
     - Main media (`mainImage` frame + `renderMediaSlot`)
     - Overlay media (`overlayImage` + `overlayImageZ`)
     - Stats card (first statistic only)
3. `renderHtmlView("rightBottomView")`

### 10.3 Media slots

```typescript
const FLOW_MEDIA_TYPES = new Set(["markdown", "html", "preview", "cell"]);

function isFlowMediaType(mediaType: string | undefined): boolean {
  const normalized = normalizeMediaType(mediaType);
  return normalized != null && FLOW_MEDIA_TYPES.has(normalized);
}
```

| mediaType category | Frame classes | Hover scale |
|--------------------|---------------|-------------|
| `image`, video, etc. | Fixed height frame (`mainImage`), `finalCss.image` on element | `whileHover: { scale: 1.05 }` when allowed |
| Flow types | `!h-auto !min-h-0 !overflow-visible` on frame | No scale hover |

```typescript
const renderMediaSlot = (slot, fallbackAlt) => {
  const slotMedia = slot?.media;
  if (!slotMedia?.mediaLink || !slotMedia?.mediaType) return null;
  const rendered = renderMedia({
    mediaLink: slotMedia.mediaLink,
    mediaType: slotMedia.mediaType,
    alt: slotMedia.alt ?? fallbackAlt,
    markdownColorPalette: colorPalette,
  });
  // cloneElement to apply getMediaElementClassName(...)
};
```

### 10.4 Features

```typescript
{header.features.map((feature, index) => (
  <motion.div className={finalCss?.featureItem} whileHover={...}>
    {featureIcon && (
      <div className={finalCss?.featureIcon} aria-hidden="true">
        {renderIconFromDataWithTheme(featureIcon, iconColorPrimary)}
      </div>
    )}
    <div className={finalCss?.featureContent}>
      <h3 className={finalCss?.featureTitle}>{featureTitle}</h3>
      <p className={finalCss?.featureDescription}>{featureDescription}</p>
    </div>
  </motion.div>
))}
```

Visual hover (border, text color) comes from **`css.tailwind.featureItem`** / **`featureTitle`** group-hover classes.

### 10.5 Primary CTA

- `ctaButton` uses layout gap: `gap-[var(--about-layout-ctaButton-gap,0.5rem)]` — defined in model
- `ctaArrow` wraps icon: `className={finalCss?.ctaArrow}` (e.g. `flex-shrink-0`)
- Icon: `renderIconFromDataWithTheme(cta.primary.icon, iconColorOnPrimary)`
- `whileHover` / `whileTap` on button unless `prefersReducedMotion`
- `onClick` → `handleClickType(event, ctaLink, clickType)` for all non-href types

---

## 11. mediaCells slots (formerly mediaCells)

All seven keys:

```typescript
const MEDIA_CELL_VIEW_KEYS = [
  "topView", "bottomView",
  "leftTopView", "leftBottomView",
  "rightTopView", "rightBottomView",
  "insertView",
] as const;
```

| Slot | Position |
|------|----------|
| `topView` | Section content, after top enhancers, before container |
| `bottomView` | After container, before bottom enhancers |
| `leftTopView` | Top of left column wrapper (outside motion block) |
| `leftBottomView` | Bottom of left column wrapper |
| `rightTopView` | Top of right column wrapper |
| `rightBottomView` | Bottom of right column wrapper |
| `insertView` | Left column: after description, before features |

Always use `renderHtmlView(key)` — never inline `GetBuildView` without length check.

### Post-testing cleanup

After verifying slot placement and theme variables in the layout editor:

1. Remove temporary HTML strings from `mediaCells` slots.
2. Leave slot keys in place (empty arrays or cell-only placeholders are fine).
3. Do not commit duplicate lorem HTML across all seven slots to production.

---

## 12. HTML & preview in data and mediaCells

### mediaCells — inline HTML

```typescript
{
  mediaType: "html",
  mediaLink: "<p class='text-[var(--about-textMuted,#4A5D73)]'>...</p>",
}
```

Use HTML tags (`<p>`, `<span>`, `<strong>`, `<a>`, …) inside `mediaLink`. Always prefer `var(--{prefix}-*)` over hardcoded hex.

### mediaCells — link preview

```typescript
{ mediaType: "preview", mediaLink: "https://example.com/article" }
```

Renders `LinkMetadataPreview` (Open Graph card).

### data — optional HTML / preview fields

Add component-specific keys under `data` using the same nested `media` shape:

```typescript
data: {
  // …
  richNote: {
    media: {
      mediaType: "html",
      mediaLink: "<p>HTML content in <strong>data</strong></p>",
    },
  },
  externalPreview: {
    media: {
      mediaType: "preview",
      mediaLink: "https://example.com",
    },
  },
},
```

Wire in painter via `renderMedia({ ...slot.media, markdownColorPalette: colorPalette })` when the component needs it.

---

## 13. Framer Motion & first-time appearance

```typescript
const prefersReducedMotion = useReducedMotion();
const sectionRef = useRef<HTMLElement>(null);
const isInView = useInView(sectionRef, { once: true, amount: 0.1 });

const reducedState = { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 };
const layoutTransition = prefersReducedMotion
  ? { duration: 0 }
  : { type: "spring", stiffness: 400, damping: 17, delay: 0.4 };
```

| Element | initial (motion on) | animate when in view |
|---------|---------------------|----------------------|
| Left column | `opacity: 0, x: -50` | `opacity: 1, x: 0` |
| Right column | `opacity: 0, x: 50` | `opacity: 1, x: 0` |
| Title | `opacity: 0, y: 20` | delay `0.5` |
| Subtitle / description | fade | delays `0.6`, `0.7` |
| Features container | `y: 20` | delay `0.8` |
| Each feature | `x: -20` | delay `0.9 + index * 0.1` |
| Overlay / stats | `scale: 0.8` | delays `0.8`, `1.0` |

When `prefersReducedMotion`: use `reducedState` for `initial` and `animate`; set `transition: { duration: 0 }`.

Respect `settings.reducedMotion` together with OS preference via `useReducedMotion()`.

Section class: add `motion-reduce` when `prefersReducedMotion`.

---

## 14. Hover effects

Hover behavior is split between **model CSS** and **Framer motion**:

| Component | Model (`css.tailwind`) | Painter (Framer) |
|-----------|------------------------|------------------|
| Feature cards | `hover:border-[var(--about-primary)]/40`, `group-hover:text-[var(--about-primary)]` on title | `whileHover: { x: 4 }` |
| CTA button | `hover:bg-[var(--about-primary)]`, `hover:text-[var(--about-onPrimary)]` | `whileHover: { scale: 1.05, boxShadow: "..." }`, `whileTap: { scale: 0.98 }` |
| Main / overlay image | — | `whileHover: { scale: 1.05 }` (non-flow media only) |
| Stats card | — | `whileHover: { scale: 1.05, y: -5 }` |

Disable Framer hover when `prefersReducedMotion` is true. Tailwind hover classes remain in model and respect user agent reduced-motion where applicable.

Check `settings.interactions.hover` when adding new interactive regions.

---

## 15. Click properties & link interactions

From model:

```typescript
settings: {
  overlays: {
    clickTypeOptions: ["", "href", "modal", "dialog", "transition", "link"],
    tailwind: { modal: {...}, dialog: {...} },
  },
},
```

Painter:

1. Pass overlay tailwind into `useLinkInteractions`.
2. Wire CTA `onClick` → `handleClickType(event, ctaLink, clickType)`.
3. Early return: `if (isTransition && transitionContent) return <>{transitionContent}</>;`
4. After main section markup: `{renderModalContent?.()}` `{renderDialogContent?.()}`

**All buttons** (primary CTA, future secondary CTAs, feature links if added) MUST use this pattern — never dead `onClick` handlers or plain `<div>` buttons.

Modal/dialog **styling** is entirely in `settings.overlays.tailwind` — not hardcoded in painter.

---

## 16. Layout types — section shell (`type`) vs column variants (`left` / `right`)

### 16.1 Section shell — `item.type` + `typeDropdown`

Controls **only** the outer grid shell and column **order**. Does **not** change feature cards, image frames, or services layout.

```typescript
// aboutModern lines 750–753
type: "Type1",
typeDropdown: ["Type1", "Type2", "Type3", "Type4"],
```

```typescript
const contentRenderers: Record<string, () => React.ReactNode> = {
  Type1: () => renderLayout(renderLeftColumn, renderRightColumn),
  Type2: () => renderLayout(renderRightColumn, renderLeftColumn),
  Type3: () => renderLayoutSingleColumn(renderLeftColumn, renderRightColumn),
  Type4: () => renderLayoutSingleColumn(renderRightColumn, renderLeftColumn),
};

const renderContent =
  (type && contentRenderers[type]) || contentRenderers.Type1;
```

| `type` | Grid class | Column order |
|--------|------------|--------------|
| Type1 | `finalCss.grid` | Left, Right |
| Type2 | `finalCss.grid` | Right, Left |
| Type3 | `finalCss.gridSingleColumn \|\| finalCss.grid` | Left, then Right (stacked) |
| Type4 | `finalCss.gridSingleColumn \|\| finalCss.grid` | Right, then Left (stacked) |

### 16.2 Column variants — `item.left` / `item.right` + dropdowns

```typescript
// aboutModern lines 751–755
left: "Type1",
right: "Type1",
leftDropdown: ["Type1", "Type2", "Type3", "Type4", "Type5", "Type6"],
rightDropdown: ["Type1", "Type2", "Type3", "Type4", "Type5", "Type6"],
```

| Key | Painter entry point | Purpose |
|-----|---------------------|---------|
| `left` | `pickLeftCss`, `renderLeftColumn` | Intro, features, stats strip, CTAs |
| `right` | `pickRightCss`, `renderRightColumn` | Image, services, overlay, stats card |

**Editor:** `DesignItemSettingsSidebar` shows three independent selects when dropdown arrays exist on the model. Changing **Left** writes `item.left`; changing **Right** writes `item.right`; changing **Type** writes `item.type`.

**Combination example:** `{ type: "Type2", left: "Type6", right: "Type5" }` → two-column grid with right column first, monograph left text, salon portrait right media.

See **§26–§28** for full architecture and clone workflow.

---

## 17. Section shell structure

```tsx
<section
  ref={sectionRef}
  id={item?.id}
  data-theme={themeMode}
  className={`${finalCss?.global} relative overflow-hidden ${prefersReducedMotion ? "motion-reduce" : ""}`}
  style={cssVariables}
  aria-label="About section"
>
  {/* z-0 background */}
  {backgroundLayer != null && (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      {backgroundLayer}
    </div>
  )}

  <div className="relative z-10">
    {renderEnhancers("top")}
    {renderHtmlView("topView")}

    <div className={finalCss?.container}>
      <div className={finalCss?.grid /* or gridSingleColumn */}>
        {leftRenderer?.()}
        {rightRenderer?.()}
      </div>
    </div>

    {renderHtmlView("bottomView")}
    {renderEnhancers("bottom")}
  </div>

  {renderModalContent?.()}
  {renderDialogContent?.()}
</section>
```

Modal/dialog portals render **inside** `<section>` after the z-10 content wrapper.

---

## 18. Responsive & media behavior

- **Responsiveness** comes from Tailwind breakpoints in **`css.tailwind`** and spacing tokens in **`css.layout`** / **`css.typography`** — not from painter conditionals.
- Container padding uses responsive vars: `px-[var(--about-layout-container-paddingX)] sm:px-[var(--about-layout-container-paddingXSm)]`.
- Title scales: `text-[var(--about-fontSize-3xl)] md:text-[var(--about-fontSize-4xl)] lg:text-[var(--about-fontSize-5xl)]`.
- Column wrappers use `w-full min-w-0 max-w-full` to prevent overflow in grid layouts.
- Images from `renderMedia` use `loading="lazy"` and `decoding="async"` where applicable.
- Flow media types (`html`, `markdown`, `preview`, `cell`) must not use fixed `h-80` behavior — use `getMediaFrameClassName` override (`!h-auto !min-h-0 !overflow-visible`).
- Type3/Type4 require `css.tailwind.gridSingleColumn` with width constraints (e.g. `w-full md:w-[80%] lg:w-[60%] mx-auto`).

---

## 19. Accessibility

| Element | Requirement |
|---------|-------------|
| Section | `aria-label` (e.g. `"About section"`) |
| Features list | `role="list"`, `aria-label="Key features"` |
| Feature icons | `aria-hidden="true"` on decorative wrapper |
| CTA | `aria-label` including text + link for href |
| Stats card | `role="article"`, `aria-label` with count + label |
| Background | `aria-hidden="true"` |
| CTA control | Native `<a>` or `<button type="button">` |

---

## 20. Migration from legacy painters

Use this when updating older `aboutPainter.tsx`-style files:

| Legacy | Modern (`aboutModern`) |
|--------|-------------------------|
| `data.images.main` URL string | `data.media.main.media.{ mediaLink, mediaType, alt }` |
| `header.features[].text` | `title` + `description` |
| **`mediaCells`** | **`mediaCells`** with `{ mediaType, mediaLink }` |
| `mediaCells` `{ type, htmlView }` | `{ mediaType: "html", mediaLink }` |
| `GetBuildView` without palette | Pass `markdownColorPalette={colorPalette}` |
| Hardcoded `#4A5D73` in HTML | `var(--about-textMuted,#4A5D73)` |
| Hardcoded Tailwind in painter | Move to `css.tailwind` in model |
| No `background` / `enhancers` | Add optional blocks; wire `renderBackgroundStudio` + `GetBuildEnhancer` |
| `renderIconFromData` | `renderIconFromDataWithTheme(icon, themeColor)` |
| Inline `<img src={...}>` | `renderMedia` / `renderMediaSlot` |
| Missing `gridSingleColumn` | Add to model `css.tailwind` for Type3/Type4 |
| Painter reads `item.mediaCells` | Painter reads **`item.mediaCells`** |

**Painter file checklist**: Copy helper functions (`resolveLayoutValue`, border parsers, `isFlowMediaType`) or move to a shared `painter/utils/themeCssVariables.ts` when many painters need them.

---

## 21. Validation checklist

### Model data

- [ ] `id`, `type`, `typeDropdown` present
- [ ] If using column variants: `left`, `right`, `leftDropdown`, `rightDropdown`; values ∈ dropdown arrays
- [ ] Each left/right type has matching `{region}TypeN` keys in `css.tailwind` + `css.layout` tokens
- [ ] `data.header.features[]` uses `{ title, description, icon }`
- [ ] `data.media` uses nested `media` objects
- [ ] **`mediaCells`** (not `mediaCells`) — all seven slots; `mediaType` + `mediaLink`
- [ ] Test HTML removed from `mediaCells` after slot verification
- [ ] `css`: colorPalette, typography, borders, layout, tailwind (+ antd/mui/customCss)
- [ ] `css.tailwind` uses `var(--{prefix}-*)` with fallbacks; responsive breakpoints present
- [ ] Hover classes on interactive tailwind keys (`featureItem`, `ctaButton`, …)
- [ ] Optional `background`, `enhancers`
- [ ] `settings.overlays.tailwind` for modal/dialog
- [ ] `settings.overlays.clickTypeOptions` includes modal, dialog, transition, link, href
- [ ] `checkboxes`, `list`, `wrapper`, `animations`
- [ ] CTA `clickType` + `link` set; icons use `{ iconName, type, fontSize }`

### Painter

- [ ] Imports: GetBuildView, GetBuildEnhancer, renderMedia, renderBackgroundStudio, useLinkInteractions, renderIconFromDataWithTheme, safeAccess, framer-motion
- [ ] Reads **`item.mediaCells`** (not `mediaCells`)
- [ ] `getHtmlView` → `[]` when missing; `renderHtmlView` passes `markdownColorPalette`
- [ ] `cssVariables` useMemo: colors, typography, borders (radius), layout
- [ ] `data-theme`, `style={cssVariables}` on section
- [ ] **No hardcoded CSS** — only `finalCss?.key` from model
- [ ] Background layer z-0; content z-10
- [ ] Enhancers top/bottom via `filterEnhancersByAlign`
- [ ] All seven mediaCells slots in correct positions
- [ ] Media via `renderMediaSlot`; flow vs fixed media handled
- [ ] Icons via `renderIconFromDataWithTheme` + correct color keys
- [ ] `useReducedMotion` + `useInView`; `reducedState` when needed
- [ ] `useLinkInteractions`; early transition return; modal/dialog at end
- [ ] All buttons wired to `handleClickType`
- [ ] Type1–Type4 `contentRenderers` with fallback Type1
- [ ] `pickLeftCss` / `pickRightCss` (or equivalent) for `item.left` / `item.right`
- [ ] Column variant branches in `renderLeftColumn` / `renderRightColumn` where structure differs
- [ ] Column null guards; no render of empty blocks
- [ ] Responsive wrappers (`min-w-0`, `max-w-full`)

---

## 22. Reference files

| File | Role |
|------|------|
| `src/drafting/painter/about/aboutModernPainter.tsx` | **Canonical** post-cell painter (`pickLeftCss`, `pickRightCss`) |
| `src/drafting/modelData/about.ts` | `aboutModern` model (selectors **750–755**, suffixed tailwind ~1148–1610) |
| `src/drafting/layoutEditor/DesignItemSettingsSidebar.tsx` | Type / Left / Right dropdowns → `item.type`, `item.left`, `item.right` |
| `src/doc/twocoulmmodification/MODELDATA_STANDARDIZATION.md` | Model shape standard |
| `src/drafting/layoutEditor/reusebleFunction/getBuildView.tsx` | mediaCells → media pipeline |
| `src/drafting/layoutEditor/enhancer/` | Enhancer registry + components |
| `src/drafting/layoutEditor/media/media.tsx` | `renderMedia`, `normalizeMediaType`, `preview` |
| `src/drafting/layoutEditor/backgroundStudio/backgrounds/` | `renderBackgroundStudio` |
| `src/drafting/painter/utils/useLinkInteractions.tsx` | Clicks & overlays |
| `src/drafting/painter/utils/renderIconFromData.tsx` | Icons |

---

## 23. Chunk-by-chunk execution reference

Use this section when modifying **any** post-cell painter or model. Each chunk lists: **model JSON** → **painter code** → **what runs at render time** → **how to copy for another file**.

### 23.0 End-to-end runtime flow

```
DesignItemRenderer passes item (full model object)
        │
        ▼
AboutModernPainter({ item })
        │
        ├─ Hooks: useReducedMotion, useRef, useInView
        ├─ safeObject/safeArray reads (data, mediaCells, css, …)
        ├─ cssVariables useMemo → inline style on <section>
        ├─ createSafeTailwind → finalCss
        ├─ useLinkInteractions → handleClickType, modal/dialog portals
        ├─ if isTransition → early return (full page swap)
        ├─ renderLeftColumn / renderRightColumn (column guards)
        ├─ backgroundLayer useMemo
        ├─ contentRenderers[item.type]() → renderLayout / renderLayoutSingleColumn
        └─ JSX tree mounts → Framer animates when isInView === true
```

---

### 23.1 Top-level model keys — execution per chunk

#### Chunk: `id`

| | |
|---|---|
| **Model** | `id: "AboutModern"` |
| **Painter** | `id={item?.id}` on `<section>` |
| **Execution** | Sets DOM `id` for anchor links and editor highlighting. No logic branch. |
| **Clone** | Match export name: `export const heroModern = { id: "HeroModern", … }` |

---

#### Chunk: `type` + `typeDropdown`

| | |
|---|---|
| **Model** | `type: "Type1"`, `typeDropdown: ["Type1",…,"Type4"]` |
| **Painter** | `const type = item?.type` → `contentRenderers[type] \|\| Type1` |
| **Execution** | Picks layout function: two-column vs single-column, column order swapped for Type2/4. Editor dropdown writes `type`; painter only reads it. |
| **Clone** | Keep same Type1–4 pattern unless component needs fewer variants; always provide fallback `Type1`. |

---

#### Chunk: `left` + `leftDropdown` / `right` + `rightDropdown`

| | |
|---|---|
| **Model** | `left: "Type1"`, `leftDropdown: ["Type1",…,"Type6"]`, same for `right` |
| **Painter** | `leftType` / `rightType` → `pickLeftCss` / `pickRightCss`; column render branches |
| **Execution** | Independent of `type`. Editor **Left**/**Right** selects call `handleChangeLeft` / `handleChangeRight`. Tailwind suffixed keys (`titleType4`, `mainImageType5`) selected at runtime. |
| **Clone** | Copy full pick helper + flags + branches; copy suffixed tailwind block from `aboutModern`. See §28. |

---

#### Chunk: `data.header.title` / `titleHighlight`

| | |
|---|---|
| **Model** | `header: { title: "…", titleHighlight: "…" }` |
| **Painter** | `renderLeftColumn` → `motion.h2` with `finalCss.title`, inner `mainTitle` + `highlightTitle` spans |
| **Execution** | 1) Left column null-guard checks both fields. 2) If either exists, h2 mounts. 3) Framer: `y: 20 → 0`, delay `0.5s` when in view. 4) Text color/size from `css.tailwind.title` (uses `--about-fontSize-*`, `--about-text`). |
| **Clone** | Add both spans even if your design merges them — keeps null-guard compatible. |

---

#### Chunk: `data.header.subtitle` / `description`

| | |
|---|---|
| **Model** | `subtitle: "…"`, `description: "…"` |
| **Painter** | Separate `motion.p` blocks, `finalCss.subtitle` / `finalCss.description` |
| **Execution** | Each field renders independently if string is truthy. Fade-in delays `0.6` / `0.7`. Styling only from model tailwind keys. |
| **Clone** | Omit key entirely if unused; painter skips block. |

---

#### Chunk: `data.header.features[]`

| | |
|---|---|
| **Model** | `{ title, description, icon: { iconName, type, fontSize } }` |
| **Painter** | `header.features.map` → `motion.div` per item, `renderIconFromDataWithTheme(featureIcon, iconColorPrimary)` |
| **Execution** | 1) Skip non-objects. 2) Skip if both title and description empty. 3) Container `role="list"`. 4) Each item: stagger delay `0.9 + index * 0.1`. 5) `whileHover: { x: 4 }` unless reduced motion. 6) Border/radius from `css.borders.features` → `--about-radius-features-*` used in `finalCss.featureItem`. |
| **Clone** | Never use legacy `{ text, icon }`. Icon color from palette, not icon object. |

---

#### Chunk: `data.media.main` / `data.media.overlay`

| | |
|---|---|
| **Model** | `main: { media: { mediaLink, mediaType, alt? } }` |
| **Painter** | `renderMediaSlot(mainMedia, "Main image")` inside `getMediaFrameClassName(finalCss.mainImage, mediaType)` |
| **Execution** | 1) `renderMedia` dispatches by `mediaType` (image → `<img lazy>`, html → `HtmlRenderer`, preview → `LinkMetadataPreview`). 2) `cloneElement` applies `finalCss.image` or flow classes. 3) Fixed images: `whileHover scale 1.05`. 4) Flow types: frame gets `!h-auto !overflow-visible`. |
| **Clone** | Always nest `media: { … }` — never flat URL at `data.images.main`. |

---

#### Chunk: `data.statistics[]`

| | |
|---|---|
| **Model** | `[{ count: "15,350+", label: "Clients Worldwide" }]` |
| **Painter** | `statisticsList = safeArray(...)`, `firstStat = statisticsList[0]` → stats card in right column |
| **Execution** | Only **index 0** renders. Card positioned via `finalCss.statsCard` (absolute in `imageContainer`). Animates scale `0.8 → 1`, delay `1.0`. |
| **Clone** | For multiple stats, extend painter — default pattern is first item only. |

---

#### Chunk: `data.cta.primary`

| | |
|---|---|
| **Model** | `{ text, link, clickType, icon }` |
| **Painter** | `renderPrimaryCta()` |
| **Execution** | 1) `clickType \|\| "href"`. 2) `href` → `<motion.a href>`. 3) Else → `<motion.button type="button">`. 4) Both call `onClick → handleClickType(event, link, clickType)`. 5) `useLinkInteractions` opens modal/dialog or navigates. 6) Visual style: `finalCss.ctaButton`, `finalCss.ctaArrow`. 7) Framer hover scale unless reduced motion. |
| **Clone** | Wire **every** button through `handleClickType`; copy `settings.overlays` from model. |

---

#### Chunk: `mediaCells.{slot}[]`

| | |
|---|---|
| **Model** | Seven slots; items `{ mediaType, mediaLink }` |
| **Painter** | `getHtmlView(key)` reads `mediaCells[key]` → `renderHtmlView(key)` → `GetBuildView` |
| **Execution** | 1) Missing key → `[]` → returns `null` (no DOM). 2) `GetBuildView` maps each item to `renderMedia`. 3) `mediaType: "html"` → parses `mediaLink` as HTML string. 4) `mediaType: "cell"` → `PostCellPreview`. 5) Passes `markdownColorPalette={colorPalette}` for themed markdown/html. |
| **Slot execution order in DOM** | See table below. |

| Slot | When it runs | Parent wrapper |
|------|----------------|----------------|
| `topView` | After top enhancers, before container | `relative z-10` |
| `bottomView` | After container, before bottom enhancers | `relative z-10` |
| `leftTopView` | First child of left column | `w-full min-w-0` |
| `leftBottomView` | Last child of left column | same |
| `rightTopView` | First child of right column | same |
| `rightBottomView` | Last child of right column | same |
| `insertView` | After description, before features | inside `motion.div` leftColumn |

| **Clone** | Rename nothing in slots — same seven keys. Change CSS prefix inside HTML strings only. |

---

#### Chunk: `css.colorPalette`

| | |
|---|---|
| **Model** | `{ theme: "light", light: { primary, … }, dark: { … } }` |
| **Painter** | `cssVariables` useMemo → `--about-primary`, etc. on `<section style>` + `data-theme={themeMode}` |
| **Execution** | 1) Read `theme` → pick light or dark object. 2) Loop entries → CSS custom properties. 3) Tailwind classes in model reference `var(--about-primary,#fallback)`. 4) Icons use `resolvedThemeColors.primary` / `onPrimary` directly as hex for SVG fill. |
| **Clone** | Replace prefix `about` → `hero` in painter useMemo **and** all model tailwind/html fallbacks. |

---

#### Chunk: `css.typography`

| | |
|---|---|
| **Model** | `fontFamily: { sans, serif }`, `standard: { fontSize, lineHeight, letterSpacing }` |
| **Painter** | Second loop in `cssVariables` → `--about-fontFamily-sans`, `--about-fontSize-lg`, `--about-lineHeight-relaxed`, … |
| **Execution** | Values become CSS vars; tailwind strings consume them. No font logic in painter beyond emission. |
| **Clone** | Copy `standard.fontSize` keys verbatim so tailwind fallbacks stay consistent. |

---

#### Chunk: `css.borders`

| | |
|---|---|
| **Model** | `{ features: "lg", cta: "xl", mainImage: "xl", … }` or directional `"tl-2xl"` |
| **Painter** | `parseRoundedDirection` + `resolveRoundedValue` → `--about-radius-{section}-{tl\|tr\|br\|bl}` |
| **Execution** | 1) `"lg"` on `features` → all four corners get `0.5rem`. 2) `"t-lg"` → only `tl`, `tr`. 3) Tailwind uses `rounded-tl-[var(--about-radius-features-tl,0.5rem)]`. |
| **Clone** | Add section keys to `radiusSectionKeys` array in painter if you add new bordered regions. |

---

#### Chunk: `css.layout`

| | |
|---|---|
| **Model** | `{ container: { paddingX: "6", … }, grid: { gap: "12", gapLg: "20" }, … }` |
| **Painter** | `resolveLayoutValue("6")` → `"1.5rem"` → `--about-layout-container-paddingX` |
| **Execution** | Numeric strings = Tailwind spacing scale (× 0.25rem). Non-numeric passed through as-is. Consumed in tailwind via `var(--about-layout-grid-gap,3rem)`. |
| **Clone** | Mirror layout section names with tailwind keys that reference the same vars. |

---

#### Chunk: `css.tailwind.{key}`

| | |
|---|---|
| **Model** | `tailwind: { global, container, grid, title, featureItem, ctaButton, … }` |
| **Painter** | `finalCss = createSafeTailwind(css?.tailwind)` → `finalCss?.title`, etc. |
| **Execution** | `createSafeTailwind` returns proxy: missing key → `""` (never undefined). Every visible region uses one tailwind key. Hover/responsive/breakpoints live **here only**. |
| **Clone** | List all keys your JSX references; add empty string defaults for optional regions. |

---

#### Chunk: `css.antd` / `css.mui` / `css.customCss`

| | |
|---|---|
| **Model** | `{}` placeholders |
| **Painter** | Not read in `aboutModernPainter` |
| **Execution** | Reserved for future Ant/MUI/custom overrides. Keep `{}` for schema consistency. |
| **Clone** | Always include empty objects. |

---

#### Chunk: `background`

| | |
|---|---|
| **Model** | `{ type: "FloatingBlobs", settings: [{ className, duration, colorKey }] }` |
| **Painter** | `backgroundLayer = useMemo(() => renderBackgroundStudio(background, { colorPalette, prefersReducedMotion, isInView }), [...])` |
| **Execution** | 1) Returns `null` if missing/`None`. 2) Renders animated blobs using `colorKey` from palette. 3) Placed in `absolute inset-0 z-0 pointer-events-none`. 4) Respects reduced motion + in-view for performance. |
| **Clone** | Omit key entirely if no background; painter handles null. |

---

#### Chunk: `enhancers[]`

| | |
|---|---|
| **Model** | `{ type, align, data, css: { colorKey, tailwind } }` |
| **Painter** | `filterEnhancersByAlign(enhancers, "top"\|"bottom")` → `GetBuildEnhancer` |
| **Execution** | 1) Filter by `align`. 2) Registry picks component (`paragraph`, `heading`, …). 3) Each enhancer reads **its own** `css.tailwind` — not main `css.tailwind`. 4) `colorKey` maps to palette for text color. |
| **Clone** | Copy enhancer block structure exactly; styling stays inside enhancer `css`. |

---

#### Chunk: `settings`

| | |
|---|---|
| **Model** | `{ type, animations, interactions, reducedMotion, overlays }` |
| **Painter** | `useLinkInteractions({ tailwind: settings.overlays.tailwind })` |
| **Execution** | `animations` / `interactions` / `reducedMotion` are editor metadata + documentation; painter uses `useReducedMotion()` from OS. `overlays.tailwind` styles modal/dialog DOM when CTA `clickType` is modal/dialog. |
| **Clone** | Always copy full `overlays.clickTypeOptions` + modal/dialog tailwind scaffold. |

---

#### Chunk: `checkboxes`

| | |
|---|---|
| **Model** | `{ isPostCellVisible: true, isListVisible: true }` |
| **Painter** | Not read inside `aboutModernPainter` (parent/editor may use) |
| **Execution** | Layout editor / wrapper components toggle post-cell and list UI visibility. Keep flags for editor compatibility. |
| **Clone** | Include both booleans even if painter ignores them. |

---

#### Chunk: `list`

| | |
|---|---|
| **Model** | `{ type: "row", settings: {}, css: { tailwind: { global, item } }, items: [] }` |
| **Painter** | Not read in `aboutModernPainter` |
| **Execution** | Standard scaffold for list-driven variants. Empty `items: []` until feature needs rows. |
| **Clone** | Copy scaffold verbatim. |

---

#### Chunk: `wrapper` / `animations`

| | |
|---|---|
| **Model** | `wrapper: []`, `animations: []` |
| **Painter** | Not read in `aboutModernPainter` |
| **Execution** | Reserved for wrapper system and animation presets. Must exist as arrays. |
| **Clone** | Default to `[]`. |

---

### 23.2 Painter file blocks — line-by-line responsibility

Copy this block order when creating a new painter file.

| Block | Lines (aboutModern) | Responsibility | Runs when |
|-------|---------------------|----------------|-----------|
| **Imports** | 1–25 | Wire dependencies only | Module load |
| **resolveLayoutValue** | 27–34 | Spacing number → rem | `cssVariables` build |
| **ROUNDED_* helpers** | 36–79 | Border token → CSS rem + corner direction | `cssVariables` build |
| **Model type + props** | 81–85 | TypeScript contract | Compile time |
| **MEDIA_CELL_VIEW_KEYS** | 87–96 | Allowed slot names | `getHtmlView` lookup |
| **FLOW_MEDIA_TYPES + isFlowMediaType** | 98–108 | Detect html/markdown/preview/cell | Media frame sizing |
| **Hooks** | 111–113 | Motion preference + in-view detection | Every render; `isInView` updates once |
| **Safe reads** | 115–161 | Null-safe model extraction | Every render |
| **themeMode** | 163 | light/dark switch | Every render |
| **renderHtmlView / renderEnhancers** | 165–175 | Slot + enhancer helpers | Called from layout |
| **Icon colors** | 177–190 | Hex for MUI icons | Icon render |
| **cssVariables useMemo** | 192–292 | Inline CSS vars on section | When palette/layout/borders change |
| **finalCss** | 294–297 | Tailwind class lookup | Every render |
| **useLinkInteractions** | 300–332 | Click + overlay system | Every render; modal stateful |
| **Early transition return** | 334–337 | Full-page transition | When `clickType: transition` fired |
| **Data destructuring** | 339–343 | Shorthand for header/media/cta | Every render after guard |
| **reducedState + layoutTransition** | 345–349 | Motion defaults | Used by all motion.* |
| **renderPrimaryCta** | 351–403 | CTA button/link | Left column when cta.primary |
| **renderLeftColumn** | 405–624 | Full left stack | Layout renderer |
| **statisticsList + media helpers** | 626–687 | Right column data prep | Before renderRightColumn |
| **renderRightColumn** | 689–821 | Full right stack | Layout renderer |
| **backgroundLayer useMemo** | 823–831 | Background animation | When bg deps change |
| **sectionShellClassName** | 833 | Global section classes | Section root |
| **renderLayout** | 835–874 | Two-column shell + slots | Type1/Type2 |
| **renderLayoutSingleColumn** | 876–915 | Stacked shell | Type3/Type4 |
| **contentRenderers map** | 917–927 | Type → layout picker | Final return |
| **Final return** | 929–933 | Invoke chosen renderer | Mount |

---

### 23.3 Dependency execution — what happens when each import runs

#### `safeObject` / `safeArray` / `createSafeTailwind`

```
Input: item?.data (may be undefined)
  → safeObject returns {} or typed object
  → never throws on null/undefined

Input: css.tailwind.title missing
  → finalCss.title returns ""
  → className="" (safe)
```

#### `GetBuildView`

```
Input: uiView = [{ mediaType: "html", mediaLink: "<p>…</p>" }]
  → map each item
  → renderMedia({ mediaLink, mediaType, markdownColorPalette })
  → wrap in div.w-full.max-w-full.min-w-0
Output: React fragment or null
```

#### `renderMedia`

```
mediaType "image"  → <img loading="lazy" />
mediaType "html"   → <HtmlRenderer htmlString={mediaLink} />
mediaType "preview"→ <LinkMetadataPreview url={mediaLink} /> (fetch metadata)
mediaType "cell"   → <PostCellPreview postCellId={…} />
mediaType "markdown" → <MarkdownPreviewRenderer … colorPalette />
```

#### `useLinkInteractions`

```
User clicks CTA with clickType "modal"
  → handleClickType prevents default if needed
  → sets internal open state
  → renderModalContent() returns portal JSX at section bottom
  → styled via settings.overlays.tailwind.modal.*
```

#### `renderIconFromDataWithTheme`

```
Input: { iconName: "Public", type: "Filled", fontSize: "medium" }, "#2A3F6D"
  → resolves MUI icon component
  → applies fontSize + colorCode as fill/SVG props
Output: <PublicIcon … />
```

#### `renderBackgroundStudio`

```
Input: { type: "FloatingBlobs", settings: [...] }
  → picks renderer by type
  → animates blobs with framer-motion unless prefersReducedMotion
  → colors from colorPalette[colorKey]
```

#### `useInView` + Framer `motion.*`

```
sectionRef attached to <section>
  → intersection observer fires once (once: true, amount: 0.1)
  → isInView becomes true
  → animate props switch from hidden → visible states
  → if prefersReducedMotion: reducedState skips animation
```

---

### 23.4 `renderLayout` DOM tree — execution order

When `Type1` runs, React mounts in this **exact order**:

```
<section id style data-theme className=global>     ← cssVariables applied here
  <div z-0>                                         ← backgroundLayer (if any)
  <div z-10>
    1. GetBuildEnhancer align=top                   ← enhancers[].align==="top"
    2. GetBuildView topView                         ← mediaCells.topView
    3. <div container>
         <div grid>
           4. renderLeftColumn()
              4a. GetBuildView leftTopView
              4b. motion.div leftColumn
                  - h2 title / highlight
                  - p subtitle
                  - p description
                  - GetBuildView insertView
                  - features map
                  - renderPrimaryCta
              4c. GetBuildView leftBottomView
           5. renderRightColumn()
              5a. GetBuildView rightTopView
              5b. motion.div rightColumn
                  - main image slot
                  - overlay image slot
                  - stats card (first stat)
              5c. GetBuildView rightBottomView
    6. GetBuildView bottomView                      ← mediaCells.bottomView
    7. GetBuildEnhancer align=bottom
  renderModalContent()                              ← portal siblings
  renderDialogContent()
</section>
```

Type2 swaps step 4 ↔ 5. Type3/Type4 use `gridSingleColumn` instead of `grid`.

---

### 23.5 Helper functions — when to copy verbatim

| Helper | Copy to new painter? | Change when cloning |
|--------|----------------------|---------------------|
| `resolveLayoutValue` | Yes | None |
| `resolveRoundedValue` / `parseRoundedDirection` | Yes | None |
| `isFlowMediaType` | Yes | Add types if needed |
| `getMediaElementClassName` | Yes | Prefer flow classes in shared util if duplicated |
| `getMediaFrameClassName` | Yes | Same |
| `renderMediaSlot` | Yes | Same |
| `cssVariables` useMemo | Yes | **Replace `--about-` prefix** |
| `radiusSectionKeys` array | Yes | Add keys for new bordered components |

---

## 24. Clone checklist: new component in same format

Follow this sequence when creating e.g. `heroModern` + `heroModernPainter`:

### Step A — Model file (`modelData/hero.ts`)

1. Duplicate `aboutModern` object.
2. Rename export + `id: "HeroModern"`.
3. Replace content in `data.*` (keep shape).
4. Keep `mediaCells` seven slots (clear test HTML after verification).
5. Replace CSS prefix `about` → `hero` in:
   - `css.tailwind` all `var(--about-*)` → `var(--hero-*)`
   - `mediaCells` HTML strings
6. Copy `settings`, `checkboxes`, `list`, `wrapper`, `animations` scaffold.
7. Register in `modelData/index.ts`.

### Step B — Painter file (`painter/hero/heroModernPainter.tsx`)

1. Copy `aboutModernPainter.tsx`.
2. Change model type import to `heroModern`.
3. Replace every `--about-` in `cssVariables` with `--hero-`.
4. Update `radiusSectionKeys` if you added border sections.
5. Keep execution order identical (§23.2 table).
6. Register in painter index + `DesignItemRenderer`.

### Step C — Verify each chunk executes

| Test | Expected |
|------|----------|
| Remove `data.header.title` | Left column hidden if nothing else left |
| Empty `mediaCells.topView` | No DOM for top slot |
| `type: "Type3"` | Single column, centered width from `gridSingleColumn` |
| `cta.clickType: "modal"` | Modal opens; styled from `settings.overlays.tailwind.modal` |
| Toggle OS reduced motion | No Framer movement; content visible immediately |
| Dark `css.colorPalette.theme` | `data-theme="dark"`, dark vars on section |

---

## 25. Cross-cutting concerns summary (878–1010)

Quick answer: **yes**, all topics below are documented. Full token→tailwind tables live in **`MODELDATA_STANDARDIZATION.md` §4.7**.

| Concern | Model (about.ts) | tailwind (961–1010) | Painter |
|---------|------------------|---------------------|---------|
| **Theme** | `colorPalette` 878–904 | `var(--about-primary)`, `var(--about-text)`, … in every key | `cssVariables` useMemo → `style` on `<section>`; `data-theme` |
| **Typography** | `typography` 905–926 | `var(--about-fontSize-*)`, `lineHeight`, `letterSpacing`, `fontFamily` | Emits `--about-fontSize-lg` etc. |
| **Borders / corners** | `borders` 927–939 | `rounded-*-[var(--about-radius-{section}-{corner})]` on featureItem, ctaButton, mainImage, statsCard | `parseRoundedDirection` + `resolveRoundedValue` |
| **Layout spacing** | `layout` 940–960 | `px-[var(--about-layout-container-paddingX)]`, `gap-[var(--about-layout-grid-gap)]`, etc. | `resolveLayoutValue` (number × 0.25rem) |
| **Responsive** | layout tokens + breakpoints in tailwind strings | `sm:`, `md:`, `lg:` on container, grid, title, gridSingleColumn | No JS breakpoints — `finalCss` only |
| **Hover (visual)** | — | `featureItem` hover border/bg; `featureTitle` group-hover; `ctaButton` hover bg/text | `group` class on featureItem + ctaButton |
| **Hover (motion)** | `settings.interactions.hover: true` | — | Framer `whileHover` on features, CTA, images, stats |
| **Framer animation** | `settings.animations` (metadata) | — | `useInView`, stagger delays, `reducedState` when `useReducedMotion()` |
| **Null safety** | Optional fields everywhere | Fallback hex after comma in `var(--about-x,#fallback)` | `safeObject`, `safeArray`, column guards, `createSafeTailwind` |
| **Clickable buttons** | `data.cta.primary.clickType` + `link` | `ctaButton` styling only | `useLinkInteractions`; modal/dialog from `settings.overlays.tailwind` 1075–1106 |

### Two-layer flow (must understand when cloning)

```
878–904  colorPalette  ──┐
905–926  typography    ──┼──► painter cssVariables ──► --about-* on <section>
927–939  borders       ──┤
940–960  layout         ──┘
                                    │
                                    ▼
961–1010 tailwind strings read var(--about-*) with #fallback
         finalCss?.title, .featureItem, .ctaButton … applied in JSX
```

See **`MODELDATA_STANDARDIZATION.md` §4.7.1–4.7.10** for line-by-line mapping of every token to every tailwind key in `aboutModern`.

---

## 26. Independent column variants — architecture & flow

### 26.1 Runtime execution order

When `DesignItemRenderer` mounts `AboutModernPainter({ item })`:

```
1. Read item.type     → contentRenderers     → renderLayout / renderLayoutSingleColumn
2. Read item.left     → pickLeftCss          → renderLeftColumn (structure + classes)
3. Read item.right    → pickRightCss         → renderRightColumn (structure + classes)
4. data + mediaCells  → same for all combos  → shared content pipeline
5. css.tailwind       → finalCss via suffix    → TypeN classes per left/right
```

`type`, `left`, and `right` are evaluated **independently** on every render. Changing only `left` in the editor re-renders the left column with new classes/JSX; the section shell (`type`) and right column stay unless they change too.

### 26.2 Data flow diagram

```mermaid
sequenceDiagram
  participant E as DesignItemSettingsSidebar
  participant M as item JSON on cell
  participant P as aboutModernPainter
  participant D as DOM

  E->>M: handleChangeLeft("Type5") sets left
  E->>M: handleChangeRight("Type3") sets right
  E->>M: handleChangeType("Type1") sets type
  P->>M: safeString item.left / item.right / item.type
  P->>P: pickLeftCss / pickRightCss → finalCss keys
  P->>P: renderLeftColumn / renderRightColumn branches
  P->>D: section grid from type; columns from left+right
```

### 26.3 Model CSS layer for column variants

For each visual region, add suffixed keys in `css.tailwind`:

```
featureItem          ← left Type1 (base)
featureItemType2     ← left Type2
…
featureItemType6     ← left Type6

mainImage            ← right Type1
mainImageType4       ← right Type4
statsCardType6       ← right Type6
```

Add matching **`css.layout`** entries for spacing (`featureItemType5: { paddingY: "5" }`, etc.).

**Prefix:** All vars remain `--about-*` (component prefix). The `TypeN` suffix is only on **tailwind key names**, not on CSS variable names.

### 26.4 `aboutModern` reference matrix

**Left (`item.left`):**

| Type | Concept |
|------|---------|
| Type1 | Bordered vertical feature list |
| Type2 | 3-column feature grid |
| Type3 | Soft intro panel + 2-col shadow cards |
| Type4 | Dark masthead + hairline feature list |
| Type5 | Folio ledger + numbered features |
| Type6 | Monograph timeline + pull-quote description |

**Right (`item.right`):**

| Type | Concept |
|------|---------|
| Type1 | Absolute services + stats on image stack |
| Type2 | Reversed split grid (stats/overlay \| image+services) |
| Type3 | Corner-frame + 2×2 services + dark stats block |
| Type4 | Glass hero + top services strip + glass stats pill |
| Type5 | Cream mat + arch portrait + vertical services ribbon |
| Type6 | Diptych panel + pediment image + inscribed stats tablet |

---

## 27. Painter implementation — `pickLeftCss` / `pickRightCss`

### 27.1 Read selectors (after `finalCss`)

```typescript
const type = item?.type;
const leftType = safeString((item as { left?: unknown })?.left, "Type1");
const rightType = safeString((item as { right?: unknown })?.right, "Type1");
```

### 27.2 Layout boolean flags

Derive flags once; use in motion, branches, and icon color:

```typescript
// Left
const isFeaturesRowLayout = leftType === "Type2";
const isLeftPremiumLayout = leftType === "Type3";
const isLeftClassicLayout = leftType === "Type4";
const isLeftFolioLayout = leftType === "Type5";
const isLeftMonographLayout = leftType === "Type6";

// Right
const isRightSplitLayout = rightType === "Type2";
const isRightPremiumLayout = rightType === "Type3";
const isRightGlassLayout = rightType === "Type4";
const isRightSalonLayout = rightType === "Type5";
const isRightDiptychLayout = rightType === "Type6";
```

### 27.3 `pickLeftCss` pattern (canonical)

```typescript
const pickLeftCss = (baseKey: string, options?: {
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
  type6?: string;
  type2UseBase?: boolean;
}): string => {
  if (leftType === "Type6") return finalCss?.[`${baseKey}Type6`] || options?.type6 || "";
  if (leftType === "Type5") return finalCss?.[`${baseKey}Type5`] || options?.type5 || "";
  if (leftType === "Type4") return finalCss?.[`${baseKey}Type4`] || options?.type4 || "";
  if (leftType === "Type3") return finalCss?.[`${baseKey}Type3`] || options?.type3 || "";
  if (leftType === "Type2") {
    return finalCss?.[`${baseKey}Type2`]
      || (options?.type2UseBase ? finalCss?.[baseKey] : "")
      || options?.type2 || "";
  }
  return finalCss?.[baseKey] || options?.type1 || "";
};
```

`pickRightCss` is identical but uses `rightType` and checks `Type6` down to `Type2` first.

**Resolve once at top:**

```typescript
const featureItemClass = pickLeftCss("featureItem", { type2UseBase: true });
const statsCardClass = pickRightCss("statsCard", {
  type1: finalCss?.statsCard || "",
  type2: "…explicit Type2 fallback if needed…",
  type2UseBase: true,
});
```

### 27.4 Structural branches (when CSS alone is not enough)

**`renderLeftColumn`:** Intro block switches on layout flags (Type3 panel → Type4 masthead → Type5 folio → Type6 overline/pull-quote). Features may add Type5 index or Type6 timeline node elements.

**`renderRightColumn`:** Nested ternary / if-chain:

```
isRightDiptychLayout ? (diptych grid + stats below)
  : isRightSalonLayout ? (mat + arch image + ribbon services)
  : isRightGlassLayout ? (…)
  : isRightPremiumLayout ? (frame + corner dots)
  : isRightSplitLayout ? (split grid)
  : (Type1 default stack)
```

**Shared helpers:** `renderServicesPanel()`, `renderOverlayMedia()`, `renderStatisticsHighlights()` use classes from `pickRightCss` / `pickLeftCss` — ensure new types define `servicesPanelTypeN`, `statsHighlightsRowTypeN`, etc.

### 27.5 Icon theme colors per layout

MUI icons use inline hex from `renderIconFromDataWithTheme`, not CSS `text-*`:

```typescript
const leftFeatureIconColor =
  leftType === "Type1" || leftType === "Type5" || leftType === "Type6"
    ? iconColorPrimary
    : iconColorOnPrimary;

const rightServiceIconColor = isRightSalonLayout
  ? iconColorOnPrimary   // dark ribbon
  : iconColorPrimary;    // light panels
```

Update when new variant uses dark-on-light or light-on-dark icon containers.

### 27.6 Painter blocks touched for column variants

| Block | Change when adding column type |
|-------|-------------------------------|
| `pickLeftCss` / `pickRightCss` | Add `TypeN` branch |
| Class constants | `pickLeftCss("…")` for new regions |
| `renderLeftColumn` | Optional intro/features branch |
| `renderRightColumn` | Optional media/services branch |
| `renderStatisticsHighlights` | Dividers, separators, icon visibility |
| `renderOverlayMedia` | Position rules (Type1-only hide) |
| Framer `initial`/`animate` | Per-flag motion on column wrappers |
| **Not** `contentRenderers` | Unless new **section shell** needed |

---

## 28. Adding TypeN to model + painter (repeatable workflow)

Use this when scaling to **n painters** and **n modelData** files.

### Step 1 — Model (`about.ts` or component file)

1. Add `"TypeN"` to `leftDropdown` and/or `rightDropdown` (and `left`/`right` defaults if needed).
2. Add `css.layout` tokens: `featureItemTypeN`, `statsHighlightsTypeN`, `mainImageTypeN`, …
3. Add full `css.tailwind` suffixed keys for **every** region that changes.
4. Keep alignment tokens consistent (`text-left` on left column text).
5. Do **not** add to `typeDropdown` unless the new type changes the **section grid shell**.

### Step 2 — Painter

1. `const isLeft…Layout = leftType === "TypeN"` (or right).
2. Extend `pickLeftCss` / `pickRightCss` with `if (leftType === "TypeN")` **before** lower types.
3. Add `options?.typeN` to helper type if using fallbacks.
4. Declare new class picks (`leftFooClass = pickLeftCss("leftFoo")`).
5. Add conditional JSX in `renderLeftColumn` / `renderRightColumn`.
6. Adjust `leftFeatureIconColor` / `rightServiceIconColor` if needed.
7. Update stats/feature motion if the variant needs distinct animation.

### Step 3 — Editor (usually zero code)

If `leftDropdown` / `rightDropdown` on the model include `"TypeN"`, `DesignItemSettingsSidebar` shows the new option automatically.

### Step 4 — QA matrix

| Test | Pass criteria |
|------|----------------|
| Each `left` with `type: Type1` | Column renders; no missing class crashes |
| Each `right` with `type: Type1` | Image/services/stats visible per variant |
| `type` Type3 + extreme left/right | Single column stack still correct |
| Icon contrast | Icons visible on dark and light containers |
| Editor persist | Reload cell — `left`/`right` values retained |

### Step 5 — Clone to another component

1. Copy `pickLeftCss` / `pickRightCss` + flags + branches into new painter.
2. Copy suffixed tailwind block from `aboutModern.css.tailwind`.
3. Replace CSS prefix `about` → `yourPrefix` in model tailwind + `cssVariables` useMemo.
4. Register model + painter in indexes.
5. Add `leftDropdown` / `rightDropdown` to new model top-level.

---

## Summary

Post-cell painters MUST:

1. Consume the **standardized model** (`aboutModern` shape with **`mediaCells`**).
2. Use **null-safe** access (`safeObject`, `safeArray`, `createSafeTailwind`, `getHtmlView` → `[]`).
3. Keep **all CSS in the model** — painter only resolves CSS variables and applies `finalCss` keys.
4. Resolve **theme** via `colorPalette` → CSS variables (`--{prefix}-*`), `data-theme`, and **renderIconFromDataWithTheme**.
5. Map **borders**, **layout**, and **typography** from model to CSS variables.
6. Render **background** (`renderBackgroundStudio`) and **enhancers** (`GetBuildEnhancer` + align filter).
7. Render **media** through **`renderMedia`** (including mediaCells and `data.media` slots); handle **flow** media types.
8. Place all **seven mediaCells** slots and **insertView** in the documented order; remove test HTML after verification.
9. Animate with **Framer Motion** + **useInView**, respecting **prefersReducedMotion**.
10. Wire **all clicks** through **useLinkInteractions** (modal, dialog, transition, href, link).
11. Define **hover styling** in `css.tailwind`; use Framer `whileHover` only for motion transforms.
12. Support **Type1–Type4** section shells (`item.type`) with responsive classes from model `css.tailwind`.
13. Support **independent left/right column variants** (`item.left`, `item.right`) via `pickLeftCss` / `pickRightCss`, suffixed `css.tailwind` keys, and conditional column renderers (§26–§28).
14. Expose **`leftDropdown` / `rightDropdown`** on the model so the layout editor can persist column choices without painter edits.

When adding a new component family, duplicate the `aboutModern` / `aboutModernPainter` pair first, then rename the CSS prefix and tailwind keys consistently across model + painter + mediaCells HTML. When adding a new **column** type, follow **§28** — only add to `typeDropdown` if the section shell itself changes.
