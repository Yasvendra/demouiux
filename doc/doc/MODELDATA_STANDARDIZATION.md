# ModelData Standardization Documentation

## Overview

This document describes the **standardized data structure** for ALL component objects in the `src/drafting/modelData/` folder. The canonical reference is **`about.ts`** — specifically the **`aboutModern`** export (lines 743–1127). Every component object MUST follow this structure.

---

## 1. Identity & Type

At the top level, every component object MUST include:

| Property        | Type     | Description |
|----------------|----------|-------------|
| `id`           | `string` | Unique identifier; **PascalCase** matching the component name (e.g. `"AboutModern"`). |
| `type`         | `string` | Current layout/variant (e.g. `"Type1"`, `"Type2"`). |
| `typeDropdown` | `string[]` | All allowed variant options (e.g. `["Type1", "Type2", "Type3", "Type4"]`). |

```typescript
id: "AboutModern",
type: "Type1",
typeDropdown: ["Type1", "Type2", "Type3", "Type4"],
```

---

## 2. Data (JSON object)

`data` holds **component-specific content** as a JSON object. Structure varies by component; the About pattern includes:

- **header**: `title`, `titleHighlight`, `subtitle`, `description`, **features** (array of `{ title, description, icon }`).
- **media**: `main` and `overlay`, each with nested `media: { mediaLink, mediaType, alt? }`.
- **statistics**: array of `{ count, label }`.
- **cta**: `primary` (and optionally `secondary`) with `text`, `link`, `clickType`, **icon** (see §7).

All user-facing copy, links, and media URLs live here. **Icons** inside `data` (e.g. in features or cta) MUST use the **Material UI icon format** (see §7).

### 2.1 header.features

```typescript
features: [
  {
    title: "Global Reach",
    description: "Worldwide logistics network spanning 150+ countries",
    icon: {
      iconName: "Public",
      type: "Filled",
      fontSize: "medium",
    },
  },
],
```

### 2.2 media

```typescript
media: {
  main: {
    media: {
      mediaLink: "https://...",
      mediaType: "image",
      alt: "Logistics worker with clipboard",
    },
  },
  overlay: {
    media: {
      mediaLink: "https://...",
      mediaType: "image",
    },
  },
},
```

### 2.3 statistics & cta

```typescript
statistics: [{ count: "15,350+", label: "Clients Worldwide" }],
cta: {
  primary: {
    text: "More About Us",
    link: "/about",
    clickType: "href",
    icon: { iconName: "ArrowForward", type: "Filled", fontSize: "medium" },
  },
},
```

---

## 3. mediaCells (HTML-form content)

`mediaCells` stores **HTML-form content** per slot. Each slot is an **array** of items. Item types:

- `{ mediaType: "html", mediaLink: "<p class='...'>...</p>" }` — inline HTML string (Tailwind classes allowed; prefer CSS variables such as `var(--about-textMuted,#4A5D73)`).
- `{ mediaType: "cell", mediaLink: "" }` — optional cell slot; use `""` when empty.

**Required slots:**

| Slot             | Typical content |
|------------------|-----------------|
| `topView`        | `[html, cell]` |
| `bottomView`     | `[html, cell]` |
| `leftTopView`    | `[html]` |
| `leftBottomView` | `[html]` |
| `rightTopView`   | `[html]` |
| `rightBottomView`| `[html]` |
| `insertView`     | `[html, cell]` |

Example:

```typescript
mediaCells: {
  topView: [
    {
      mediaType: "html",
      mediaLink:
        "<p class='text-left text-base leading-relaxed text-[var(--about-textMuted,#4A5D73)]'>Trusted by industry leaders for <span class='font-semibold text-[var(--about-text,#1E2430)]'>reliable logistics</span> and end-to-end supply chain excellence.</p>",
    },
    { mediaType: "cell", mediaLink: "" },
  ],
  bottomView: [
    { mediaType: "html", mediaLink: "..." },
    { mediaType: "cell", mediaLink: "" },
  ],
  leftTopView: [{ mediaType: "html", mediaLink: "..." }],
  leftBottomView: [{ mediaType: "html", mediaLink: "..." }],
  rightTopView: [{ mediaType: "html", mediaLink: "..." }],
  rightBottomView: [{ mediaType: "html", mediaLink: "..." }],
  insertView: [
    { mediaType: "html", mediaLink: "..." },
    { mediaType: "cell", mediaLink: "" },
  ],
},
```

---

## 4. CSS (theme, typography, borders, layout, tailwind)

`css` MUST include the following sub-objects. Tailwind classes SHOULD use CSS variables (e.g. `var(--about-primary,#2A3F6D)`) with fallbacks so the painter can apply theme/typography/borders/layout.

### 4.1 colorPalette (theme)

- **theme**: `"light"` | `"dark"` (default active theme).
- **light** and **dark**: each with:
  - `primary`, `primaryDark`, `accent`
  - `background`, `backgroundAlt`, `surface`, `border`
  - `text`, `textMuted`, `onPrimary`

```typescript
colorPalette: {
  theme: "light",
  light: {
    primary: "#2A3F6D",
    primaryDark: "#1E2430",
    accent: "#6B8BBE",
    background: "#F6F5F1",
    backgroundAlt: "#EFEDE6",
    surface: "#FFFFFF",
    border: "#C9CED6",
    text: "#1E2430",
    textMuted: "#4A5D73",
    onPrimary: "#F6F5F1",
  },
  dark: {
    primary: "#93C5FD",
    primaryDark: "#BFDBFE",
    accent: "#60A5FA",
    background: "#1E293B",
    backgroundAlt: "#334155",
    surface: "#0F172A",
    border: "#475569",
    text: "#F8FAFC",
    textMuted: "#CBD5E1",
    onPrimary: "#1E293B",
  },
},
```

### 4.2 typography

- **fontFamily**: `sans`, `serif` (string values).
- **standard**:
  - **fontSize**: xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl, title (e.g. rem).
  - **lineHeight**: tight, normal, relaxed.
  - **letterSpacing**: wider, widest.

```typescript
typography: {
  fontFamily: {
    sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', Times, serif",
  },
  standard: {
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem",
      title: "2.75rem",
    },
    lineHeight: { tight: "1.25", normal: "1.5", relaxed: "1.75" },
    letterSpacing: { wider: "0.05em", widest: "0.2em" },
  },
},
```

### 4.3 borders

Section-level border/radius. Values: Tailwind-style names (`"lg"`, `"2xl"`, `"full"`) or directional (e.g. `"b-lg"`, `"tl-xl"`, `"tr-2xl"`, `"bl-md"`, `"br-full"`). Resolved in painter to `--{prefix}-radius-{section}-{tl|tr|br|bl}` etc.

```typescript
borders: {
  features: "lg",
  quoteCard: "2xl",
  descriptionCard: "2xl",
  cta: "xl",
  statistics: "2xl",
  statsPattern: "full",
  frameDesign: "2xl",
  cornerElement: "full",
  mainImage: "xl",
  overlayImage: "xl",
  floatingAccent: "full",
},
```

### 4.4 layout

Section-level spacing (padding, margin, gap, width, height). Values: Tailwind spacing numbers (e.g. `"4"`, `"6"`, `"8"`) or CSS (e.g. `"1rem"`, `"1.5rem"`). Resolved in painter to `--{prefix}-layout-{section}-{key}`.

```typescript
layout: {
  container: { paddingX: "6", paddingXSm: "8", paddingY: "16", paddingYMd: "24" },
  title: { marginBottom: "3" },
  featuresContainer: { marginTop: "8", gap: "4" },
  featureItem: { gap: "4", padding: "4" },
  ctaContainer: { paddingTop: "4" },
  ctaButton: { paddingX: "8", paddingY: "3" },
  ctaArrow: { width: "5", height: "5" },
  leftColumn: { gap: "6" },
  grid: { gap: "12", gapLg: "20" },
  rightColumn: {},
  imageContainer: { marginBottom: "8" },
  mainImage: { height: "80" },
  overlayImage: {},
  statsCard: { padding: "5" },
},
```

### 4.5 tailwind

String values for each UI region. Use CSS variables with fallbacks for colors, typography, borders, and layout (e.g. `var(--about-primary,#2A3F6D)`, `var(--about-layout-container-paddingX,1.5rem)`).

Common keys (About): `global`, `container`, `grid`, `gridSingleColumn`, `leftColumn`, `title`, `mainTitle`, `highlightTitle`, `subtitle`, `description`, `featuresContainer`, `featureItem`, `featureIcon`, `featureContent`, `featureTitle`, `featureDescription`, `ctaContainer`, `ctaButton`, `ctaArrow`, `rightColumn`, `imageContainer`, `mainImage`, `image`, `overlayImage`, `overlayImageZ`, `statsCard`, `statsCount`, `statsLabel`.

### 4.6 antd, mui, customCss

- **antd**: `{}` (or Ant Design overrides).
- **mui**: `{}` (or MUI overrides).
- **customCss**: `{}` (or custom rules).

```typescript
css: {
  colorPalette: { ... },
  typography: { ... },
  borders: { ... },
  layout: { ... },
  tailwind: { ... },
  antd: {},
  mui: {},
  customCss: {},
},
```

---

## 5. Background (optional)

Decorative background effects applied by the painter (e.g. animated blobs).

```typescript
background: {
  type: "FloatingBlobs",
  settings: [
    {
      className: "w-72 h-72 top-10 left-10",
      duration: 10,
      colorKey: "primary",
    },
    {
      className: "w-96 h-96 bottom-10 right-10",
      duration: 14,
      colorKey: "accent",
    },
  ],
},
```

- **type**: background renderer id (e.g. `"FloatingBlobs"`).
- **settings**: array of effect-specific options (`className`, `duration`, `colorKey` referencing `colorPalette` keys).

---

## 6. Enhancers (optional)

`enhancers` is an array of overlay content blocks (paragraph, heading, etc.) positioned above/below the main section.

### 6.1 paragraph enhancer

```typescript
{
  type: "paragraph",
  align: "bottom",
  data: {
    text: "Lorem ipsum dolor sit amet...",
  },
  css: {
    colorKey: "textMuted",
    tailwind: {
      global: "w-full min-w-0 text-left [font-family:var(--about-fontFamily-sans)]",
      wrapper: "max-w-5xl w-full mx-auto border border-[var(--about-border)] rounded-2xl px-6 py-5 md:px-8 md:py-6 bg-[var(--about-surface)]/80 shadow-sm",
      text: "text-base md:text-lg font-normal leading-relaxed md:leading-[1.8] tracking-[0.015em] antialiased text-pretty",
    },
  },
},
```

### 6.2 heading enhancer

```typescript
{
  type: "heading",
  align: "top",
  data: {
    text: "Craft timeless experiences built for modern innovation",
    emphasisWords: ["timeless", "innovation"],
    animateBy: "character",
  },
  css: {
    colorKey: "text",
    emphasisColorKey: "primary",
    tailwind: {
      global: "w-full min-w-0 text-left [font-family:var(--about-fontFamily-serif,...)]",
      wrapper: "max-w-5xl w-full mx-auto",
      text: "text-3xl md:text-5xl lg:text-6xl font-normal tracking-[0.02em] leading-[1.12] antialiased",
      emphasis: "inline-block align-baseline text-[1.1em] md:text-[1.14em] lg:text-[1.16em] font-semibold italic tracking-[0.03em]",
    },
  },
},
```

- **align**: `"top"` | `"bottom"` (vertical placement relative to section).
- **css.colorKey** / **css.emphasisColorKey**: keys into `colorPalette` for theming.

---

## 7. Material UI icon format (inside `data`)

Any icon used in `data` (e.g. in `header.features[]` or `cta.primary` / `cta.secondary`) MUST follow:

```typescript
icon: {
  iconName: "Public",       // Material UI icon name (PascalCase)
  type: "Filled",           // "Filled" | "Outlined"
  fontSize: "medium",       // "small" | "medium" (and optionally "large" if supported)
}
```

- **iconName**: PascalCase, e.g. `LocalShipping`, `CheckCircle`, `Schedule`, `Public`, `ArrowForward`, `SupportAgent`, `Computer`.
- **type**: `"Filled"` or `"Outlined"`.
- **fontSize**: typically `"small"` or `"medium"`.

---

## 8. Settings

- **type**: Component type label (e.g. `"About"`).
- **animations**: e.g. `{ fadeIn: true, slideIn: true }`.
- **interactions**: e.g. `{ hover: true }`.
- **reducedMotion**: boolean (e.g. `true`).
- **overlays** (optional): `clickTypeOptions` array and **tailwind** for **modal** and **dialog** (backdrop, scrim, container, panel/body, closeButton, closeIcon, content).

```typescript
settings: {
  type: "About",
  animations: { fadeIn: true, slideIn: true },
  interactions: { hover: true },
  reducedMotion: true,
  overlays: {
    clickTypeOptions: ["", "href", "modal", "dialog", "transition", "link"],
    tailwind: {
      modal: { backdrop, scrim, container, panel, body, closeButton, closeIcon, content },
      dialog: { backdrop, scrim, container, closeButton, closeIcon, content },
    },
  },
},
```

---

## 9. Checkboxes

Visibility and behavior toggles. MUST include at least:

- **isPostCellVisible**: boolean (e.g. `true`).
- **isListVisible**: boolean (e.g. `true`).

Component-specific checkboxes (e.g. `isReverse`) may be added where needed.

```typescript
checkboxes: {
  isPostCellVisible: true,
  isListVisible: true,
},
```

---

## 10. List

Standard list structure:

```typescript
list: {
  type: "row",
  settings: {},
  css: {
    tailwind: {
      global: "",
      item: "",
    },
  },
  items: [],
},
```

---

## 11. Wrapper & Animations

- **wrapper**: array (e.g. `[]`).
- **animations**: array (e.g. `[]`).

```typescript
wrapper: [],
  animations: [],
  hints:{}
```

---

## 12. Full standard structure (sketch)

```typescript
export const componentName = {
  id: "ComponentName",
  type: "Type1",
  typeDropdown: ["Type1", "Type2", "Type3", "Type4"],

  data: {
    header: {
      title,
      titleHighlight,
      subtitle,
      description,
      features: [{ title, description, icon: { iconName, type, fontSize } }],
    },
    media: {
      main: { media: { mediaLink, mediaType, alt } },
      overlay: { media: { mediaLink, mediaType } },
    },
    statistics: [{ count, label }],
    cta: { primary: { text, link, clickType, icon } },
  },

  mediaCells: {
    topView: [{ mediaType: "html", mediaLink: "..." }, { mediaType: "cell", mediaLink: "" }],
    bottomView: [...],
    leftTopView: [{ mediaType: "html", mediaLink: "..." }],
    leftBottomView: [...],
    rightTopView: [...],
    rightBottomView: [...],
    insertView: [{ mediaType: "html", mediaLink: "..." }, { mediaType: "cell", mediaLink: "" }],
  },

  css: {
    colorPalette: { theme, light: {...}, dark: {...} },
    typography: { fontFamily: { sans, serif }, standard: { fontSize, lineHeight, letterSpacing } },
    borders: { ... },
    layout: { ... },
    tailwind: { global, container, grid, ... },
    antd: {},
    mui: {},
    customCss: {},
  },

  background: { type: "FloatingBlobs", settings: [...] },
  enhancers: [{ type: "paragraph"|"heading", align, data, css }],

  settings: {
    type: "ComponentType",
    animations: { fadeIn: true, slideIn: true },
    interactions: { hover: true },
    reducedMotion: true,
    overlays: { clickTypeOptions: [...], tailwind: { modal: {...}, dialog: {...} } },
  },

  checkboxes: { isPostCellVisible: true, isListVisible: true },
  list: { type: "row", settings: {}, css: { tailwind: { global: "", item: "" } }, items: [] },
  wrapper: [],
    animations: [],
  hints:{}
};
```

---

## Validation checklist

For EVERY component object, verify:

- [ ] **id** present, unique, PascalCase.
- [ ] **type** and **typeDropdown** present.
- [ ] **data** object exists; features use `{ title, description, icon }`; media uses nested `media: { mediaLink, mediaType, alt? }`; icons use `{ iconName, type, fontSize }`.
- [ ] **mediaCells** has all seven slots: topView, bottomView, leftTopView, leftBottomView, rightTopView, rightBottomView, insertView; each slot is an array of `{ mediaType: "html"|"cell", mediaLink }`.
- [ ] **css** includes: **colorPalette**, **typography**, **borders**, **layout**, **tailwind**, **antd**, **mui**, **customCss**.
- [ ] **background** (if used): `type` and `settings` array.
- [ ] **enhancers** (if used): each item has `type`, `align`, `data`, `css` with `colorKey` and `tailwind`.
- [ ] **settings** includes: type, animations, interactions, reducedMotion; overlays optional.
- [ ] **checkboxes** includes at least isPostCellVisible, isListVisible.
- [ ] **list** has type `"row"`, settings, css.tailwind (global, item), items [].
- [ ] **wrapper**: `[]`, **animations**: `[]`.

---

## Reference

- **Canonical implementation**: `src/drafting/modelData/about.ts` — **`aboutModern`** (export at line 744).
- **Related docs**: `ABOUT_DATA_STRUCTURE.md`, `ABOUT_OUR_WORKS_PAINTER.md`, `DRAFTING_FOLDER_STRUCTURE.md`, `POST_CELL_MODIFICATION.md`.

---

## Common fixes (legacy)

- **Typo**: `chekboxes` → `checkboxes`.
- **mediaCells**: migrate `{ type: "html", htmlView }` → `{ mediaType: "html", mediaLink }`; `{ type: "cellLink", link }` → `{ mediaType: "cell", mediaLink }`.
- **data.images**: migrate to **data.media** with nested `media` objects (`mediaLink`, `mediaType`, `alt`).
- **features**: migrate `{ icon, text }` → `{ title, description, icon }`.
- **Structure**: Ensure mediaCells has all seven slots; css has colorPalette, typography, borders, layout, tailwind; checkboxes at least isPostCellVisible, isListVisible; list follows standard format.
