# About Features — One-Column Modification Standard

This document is the **canonical guide** for the **About Features** post-cell (`aboutFeatures`) and the **clone template** for other **single-column** cells (model data + painter).

It extends the two-column standards — same contracts, null-safety, CSS two-layer system, Framer Motion, background, enhancers, `mediaCells`, and link interactions — but replaces the **three-axis** layout (`type` + `left` + `right`) with a **single-axis** layout (`type` only).

---

## Document map & parent standards

| Doc | Path | Role for one-column cells |
|-----|------|---------------------------|
| **This doc** | `src/doc/oneColumnModification/ABOUT_FEATURES_ONE_COLUMN_MODIFICATION.md` | `aboutFeatures` + clone template |
| **Model standard** | `src/doc/twocoulmmodification/MODELDATA_STANDARDIZATION.md` | Top-level keys, `css.*` tokens, `mediaCells`, icons, chunk map (§Chunk execution map) |
| **Painter standard** | `src/doc/twocoulmmodification/POST_CELL_MODIFICATION.md` | Execution order (§4), null safety (§6), cross-cutting concerns (§25), clone steps (§24), add TypeN (§28) |

**Canonical implementation (one-column):**

| Layer | File | Export / symbol |
|-------|------|-----------------|
| Model | `src/drafting/modelData/about.ts` | `aboutFeatures` (~lines 4561–5955) |
| Painter | `src/drafting/painter/about/aboutFeaturesPainter.tsx` | `AboutFeaturesPainter` |

**Canonical implementation (two-column reference):**

| Layer | File | Export / symbol |
|-------|------|-----------------|
| Model | `src/drafting/modelData/about.ts` | `aboutModern` (~line 748) |
| Painter | `src/drafting/painter/about/aboutModernPainter.tsx` | `AboutModernPainter` |

---

## Table of contents

1. [Two-column vs one-column mapping](#1-two-column-vs-one-column-mapping)
2. [What one-column means](#2-what-one-column-means)
3. [Top-level model shape](#3-top-level-model-shape)
4. [Identity & `type` system (Type1–Type30)](#4-identity--type-system-type1type30)
5. [`data` — content, CTA, features](#5-data--content-cta-features)
6. [Icons](#6-icons)
7. [CSS two-layer system](#7-css-two-layer-system)
8. [`mediaCells`](#8-mediacells)
9. [Background](#9-background)
10. [Enhancers](#10-enhancers)
11. [`settings`, overlays, checkboxes](#11-settings-overlays-checkboxes)
12. [Link interactions & clickType](#12-link-interactions--clicktype)
13. [Framer Motion](#13-framer-motion)
14. [Hover effects](#14-hover-effects)
15. [Responsive behavior](#15-responsive-behavior)
16. [Accessibility](#16-accessibility)
17. [Null safety](#17-null-safety)
18. [Painter architecture](#18-painter-architecture)
19. [Painter execution order](#19-painter-execution-order)
20. [Chunk execution map (`aboutFeatures`)](#20-chunk-execution-map-aboutfeatures)
21. [Cross-cutting concerns summary](#21-cross-cutting-concerns-summary)
22. [Adding TypeN (repeatable workflow)](#22-adding-typen-repeatable-workflow)
23. [Clone checklist (N cells)](#23-clone-checklist-n-cells)
24. [Per-chunk modify order](#24-per-chunk-modify-order)
25. [Validation checklist](#25-validation-checklist)
26. [Reference files](#26-reference-files)
27. [Render tree](#27-render-tree)

---

## 1. Two-column vs one-column mapping

Use this when porting from `aboutModern` → `aboutFeatures` or when reading parent docs.

| Concern | Two-column (`aboutModern`) | One-column (`aboutFeatures`) |
|---------|---------------------------|------------------------------|
| Layout axes | `type` + `left` + `right` | **`type` only** |
| Editor dropdowns | Type, Left, Right | **Type** only |
| CSS picker | `pickLeftCss`, `pickRightCss` | **`pickTypeCss`** |
| Column renderers | `renderLeftColumn`, `renderRightColumn` | **`renderContentBody`** (single column) |
| `data` shape | `header`, `media`, `statistics`, `cta` | **`title`, `subtitle`, `description`, `features`, `cta`** (flat under `data`) |
| Features path | `data.header.features` | **`data.features`** |
| Media in data | `data.media.main` / `overlay` | **Not used** — use `mediaCells` or extend `data` if needed |
| Statistics | `data.statistics[0]` on right | **Not used** |
| `mediaCells` slots used | All seven + `insertView` | **`topView`, `bottomView` only** (others optional / unused) |
| CSS prefix | `--about-` | **`--aboutFeatures-`** |
| Section shell types | Type1–4 (grid order) | **Type1–30** (full layout systems) |
| Special layouts | Left/right column branches | Type11 marginalia shell, Type12 hub grid, Type17 almanac row, Type19–30 decorators |

Everything else from parent docs **still applies**: `colorPalette`, `typography`, `borders`, `layout`, `tailwind`, `background`, `enhancers`, `settings.overlays`, `useLinkInteractions`, `GetBuildView`, `GetBuildEnhancer`, `renderBackgroundStudio`, Framer + reduced motion.

See **`POST_CELL_MODIFICATION.md` §16** for two-column `type` semantics; **do not** apply Type1–4 grid-order rules to `aboutFeatures` — those control column order only in `aboutModern`.

---

## 2. What one-column means

`aboutFeatures` is a **single-column section**:

```
enhancers (top) → topView → header → features grid → CTA → bottomView → enhancers (bottom)
```

- **No** `left` / `right` keys on the model.
- **`item.type`** (`Type1` … `Type30`) controls the **entire** visual system: section background, header ornaments, grid topology, card shell, per-card decorators, motion, CTA chrome.
- **Internal card layout** = per-type `cardContentTypeN`, `iconTypeN`, optional decorator keys.
- Each new `TypeN` must be a **distinct** classic or innovation design — no duplicate UI/UX.

---

## 3. Top-level model shape

Aligned with **`MODELDATA_STANDARDIZATION.md` §Top-level keys** — minus `left` / `right`:

```typescript
export const aboutFeatures = {
  id: "AboutFeatures",
  type: "Type1",
  typeDropdown: ["Type1", /* … */ "Type30"],

  data: { title, subtitle, description, features, cta },
  mediaCells: {},                    // or full seven-slot object
  css: {
    colorPalette, typography, borders, layout,
    tailwind, antd, mui, customCss,
  },
  background: {},                    // optional — see §9
  enhancers: [],                     // optional — see §10
  settings: { /* §11 */ },
  checkboxes: { isPostCellVisible: true, isListVisible: true },
  list: {
    type: "row",
    settings: {},
    css: { tailwind: { global: "", item: "" } },
    items: [],
  },
  wrapper: [],
  animations: [],
  hints: { typeVariants, featureFields, mediaCells },
};
```

> **CSS rule** (`POST_CELL_MODIFICATION.md` §5): Painters MUST NOT hardcode Tailwind, hex colors, or hover styling. All design lives in model `css` (+ enhancer `css`, `settings.overlays.tailwind`).

**CSS variable prefix:** `--aboutFeatures-` — replace consistently when cloning (see §23).

---

## 4. Identity & `type` system (Type1–Type30)

### 4.1 Model keys

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | `"AboutFeatures"` — PascalCase, unique |
| `type` | `string` | Active section variant |
| `typeDropdown` | `string[]` | Every implemented type; editor **Type** dropdown |

Unlike `aboutModern`, there is **no** `leftDropdown` / `rightDropdown`.

### 4.2 Painter wiring

```
item.type → sectionType
          → isXxxLayout flags (e.g. isBentoLayout = type === "Type7")
          → pickTypeCss(baseKey) → finalCss[`${baseKey}TypeN`]
          → contentRenderers[sectionType] → renderSection()
```

`pickTypeCss` evaluates **highest type number first** (Type30 → Type1), then base keys (`header`, `title`, `grid`, `card`, …).

### 4.3 Base `css.tailwind` keys (Type1 defaults)

| Key | Purpose |
|-----|---------|
| `global`, `section` | Section shell |
| `container`, `contentNarrow` | Width + padding |
| `header`, `title`, `subtitle`, `description` | Header block |
| `grid` | Feature list/grid |
| `card`, `cardContent`, `icon`, `content` | Feature card |
| `featureTitle`, `featureDescription` | Feature text |
| `ctaContainer`, `ctaButton`, `ctaArrow` | Primary CTA |

### 4.4 Per-type naming convention

For `TypeN`, add suffixed keys:

```
headerTypeN, titleTypeN, subtitleTypeN, descriptionTypeN,
gridTypeN, cardTypeN, cardContentTypeN, iconTypeN,
featureTitleTypeN, featureDescriptionTypeN,
ctaContainerTypeN, ctaButtonTypeN,
sectionXxxTypeN, headerXxxTypeN, featureXxxTypeN,
cardTypeNLeft, cardTypeNWide, … (index modifiers)
```

Also add `css.layout` tokens (`cardTypeN: { padding, paddingMd }`) and `css.borders` radius keys → `RADIUS_SECTION_KEYS` in painter.

### 4.5 Type inventory (current)

| Type | Style | Concept |
|------|-------|---------|
| Type1 | Classic | Default 2-col grid cards |
| Type2 | Classic | Premium 3-col mosaic |
| Type3 | Classic | Refined centered intro panel |
| Type4 | Classic | Executive divide-y list + primary band |
| Type5 | Classic | Folio ledger serif |
| Type6 | Classic | Monograph timeline |
| Type7 | Innovation | Glass bento |
| Type8 | Classic | Heritage column |
| Type9 | Innovation | Wave stagger |
| Type10 | Classic | Commendation seal |
| Type11 | Classic | Manuscript marginalia |
| Type12 | Innovation | Observatory hub |
| Type13 | Classic | Salon scroll |
| Type14 | Innovation | Prismatic fault |
| Type15 | Classic | Colonnade arcade |
| Type16 | Innovation | Constellation mesh |
| Type17 | Classic | Almanac index |
| Type18 | Innovation | Aurora bands |
| Type19 | Classic | Blueprint spec |
| Type20 | Innovation | Helix strand |
| Type21 | Classic | Rotunda vault |
| Type22 | Innovation | Sonar pulse |
| Type23 | Classic | Epistle scroll |
| Type24 | Innovation | Flux weave |
| Type25 | Classic | Brass plaque wall |
| Type26 | Classic | Gilded folio spread |
| Type27 | Innovation | Hex lattice |
| Type28 | Classic | Atelier mat frames |
| Type29 | Innovation | Tide current |
| Type30 | Classic | Heraldic crest shields |

Update `hints.typeVariants` when adding types.

### 4.6 Painter-only layout branches

| Type | Special behavior |
|------|------------------|
| Type11 | `shellType11` + marginalia line |
| Type12 | Header as hub cell inside grid |
| Type17 | Almanac row inner layout |
| Type19 | Blueprint spec row |
| Type20 | Helix spine + connectors |
| Type21–30 | Custom `inner` / grid ornaments |

---

## 5. `data` — content, CTA, features

### 5.1 Header

| Key | Type | Painter |
|-----|------|---------|
| `title` | `string?` | `<h2 className={titleClass}>` |
| `subtitle` | `string?` | `<p className={subtitleClass}>` (Type6: overline via `headerOverlineType6`) |
| `description` | `string?` | `HtmlRenderer` or `<p>` via `descriptionLooksLikeHtml()` |

`hasHeaderContent` = any of the three non-empty.

### 5.2 Primary CTA

```typescript
cta: {
  primary: {
    text: string;
    link: string;
    clickType?: string;   // default "href" — see §12
    icon?: { iconName, type, fontSize };
  },
}
```

| `clickType` | Behavior (`POST_CELL_MODIFICATION.md` §15) |
|-------------|---------------------------------------------|
| `"href"` | `<motion.a href={link}>` |
| `"modal"` / `"dialog"` | Overlay via `useLinkInteractions` |
| `"transition"` | Early return — full painter swap |
| `"link"` | Custom handler |
| `""` | Falls back to `"href"` |

**CTA visibility fix:** `renderPrimaryCta()` sets **inline** `style={{ color }}` on label + arrow wrapper. Gradient buttons use `#FFFFFF` (light) / `surface` (dark). Strip `hover:` / `focus:` / `active:` / `group-hover` from class string before detecting default text color.

### 5.3 Features

```typescript
features: [
  {
    title: "Global Network",
    description: "…",           // plain or HTML
    icon: { iconName, type, fontSize },
    link: "/about",
    clickType: "href",
  },
],
```

- Path: **`data.features`** (not `data.header.features`).
- Filter: drop items with neither `title` nor `description`.
- Interactive when `link` non-empty: `motion.a` or `motion.div` + keyboard + `aria-label`.

### 5.4 HTML in descriptions

- HTML detected → `HtmlRenderer`
- Plain text → `<p className={featureDescriptionClass}>`
- Prefer valid tags only; no scripts. Theme vars in HTML: `var(--aboutFeatures-textMuted,#4A5D73)`.

---

## 6. Icons

Per **`MODELDATA_STANDARDIZATION.md` §8**:

```typescript
icon: {
  iconName: "Public",   // PascalCase MUI
  type: "Filled",       // "Filled" | "Outlined"
  fontSize: "medium",   // scaled via iconForContainerScale → "inherit"
}
```

- **Borderless:** `p-0 m-0` on icon Tailwind — no border/background on wrapper.
- Render: `renderIconFromDataWithTheme(iconForContainerScale(icon), color)`.
- `featureIconColor` — layout-dependent map in painter (`iconColorPrimary` / `iconColorAccent` / `iconColorText`).
- CTA arrow: `currentColor` + `[&_svg]:fill-current [&_svg]:text-inherit` on `ctaArrow`.

---

## 7. CSS two-layer system

Same two-layer flow as **`MODELDATA_STANDARDIZATION.md` §4** and **`POST_CELL_MODIFICATION.md` §25**:

```
colorPalette  ──┐
typography    ──┼──► painter cssVariables ──► --aboutFeatures-* on <section>
borders       ──┤
layout        ──┘
                      │
                      ▼
tailwind strings read var(--aboutFeatures-*) with #fallback
finalCss?.title, .card, .ctaButton … applied in JSX
```

### 7.1 `colorPalette`

- `theme`: `"light"` | `"dark"`
- `light` / `dark`: `primary`, `primaryDark`, `accent`, `background`, `backgroundAlt`, `surface`, `border`, `text`, `textMuted`, `onPrimary`
- Painter: `data-theme={themeMode}` on `<section>` and CTA elements

### 7.2 `typography`, `borders`, `layout`

- Typography → `--aboutFeatures-fontSize-*`, `--aboutFeatures-lineHeight-*`, `--aboutFeatures-fontFamily-*`
- Borders → `--aboutFeatures-radius-{sectionKey}-{tl|tr|br|bl}` via `RADIUS_SECTION_KEYS`
- Layout numbers → `--aboutFeatures-layout-{sectionKey}-{prop}` via `resolveLayoutValue` (× 0.25rem)

### 7.3 Theme-readable text

All visible text must use palette vars:

- Body: `text-[var(--aboutFeatures-text)]` / `textMuted`
- On primary bands (Type4): `text-[var(--aboutFeatures-onPrimary)]`
- Never hardcode theme-dependent hex in painter TSX

---

## 8. `mediaCells`

Per **`MODELDATA_STANDARDIZATION.md` §3** and **`POST_CELL_MODIFICATION.md` §11**.

### 8.1 Item format (preferred)

```typescript
{ mediaType: "html", mediaLink: "<p class='…'>…</p>" }
{ mediaType: "cell", mediaLink: "" }
{ mediaType: "preview", mediaLink: "https://…" }
{ mediaType: "markdown", mediaLink: "…" }
```

**Legacy** (still resolved by `GetBuildView`):

```typescript
{ type: "html", htmlView: "…" }
{ type: "cellLink", link: "…" }
```

### 8.2 Slots

| Slot | `aboutFeatures` painter | Position |
|------|-------------------------|----------|
| `topView` | **Yes** | Above content body |
| `bottomView` | **Yes** (if `checkboxes.isPostCellVisible !== false`) | Below content body |
| `leftTopView` | No | — |
| `leftBottomView` | No | — |
| `rightTopView` | No | — |
| `rightBottomView` | No | — |
| `insertView` | No | — |

`mediaCells: {}` is valid — `getHtmlView` returns `[]`.

### 8.3 Pipeline

```
mediaCells[slot] → getHtmlView(key) → safeArray → GetBuildView(uiView, markdownColorPalette)
```

Pass `colorPalette` from `item.css.colorPalette` into `GetBuildView`.

### 8.4 Testing workflow

Per **`MODELDATA_STANDARDIZATION.md` §3.4**: populate test HTML during development; **remove placeholder HTML** before production. Keep slot keys (even as `[]`).

---

## 9. Background

Per **`POST_CELL_MODIFICATION.md` §8**:

```typescript
background: {
  type: "FloatingBlobs",
  settings: [
    { className: "w-64 h-64 …", duration: 12, colorKey: "primary" },
    { className: "w-80 h-80 …", duration: 16, colorKey: "accent" },
  ],
},
```

```typescript
const backgroundLayer = useMemo(
  () =>
    renderBackgroundStudio(background, {
      colorPalette,
      prefersReducedMotion: shouldReduceMotion,
      isInView,
    }),
  [background, colorPalette, shouldReduceMotion, isInView],
);
```

Rendered: `absolute inset-0 z-0`, `aria-hidden="true"`. `background: {}` → no layer.

---

## 10. Enhancers

Per **`POST_CELL_MODIFICATION.md` §9**:

```typescript
enhancers: [
  {
    type: "heading" | "paragraph",
    align: "top" | "bottom",
    data: { text, emphasisWords?, animateBy? },
    css: {
      colorKey: "text",
      emphasisColorKey: "primary",
      tailwind: { global, wrapper, text, emphasis? },
    },
  },
],
```

```typescript
const items = filterEnhancersByAlign(enhancers, "top" | "bottom");
return <GetBuildEnhancer items={items} colorPalette={colorPalette} />;
```

`enhancers: []` is valid.

---

## 11. `settings`, overlays, checkboxes

```typescript
settings: {
  type: "Features",
  animations: { fadeIn: true, slideIn: true },
  interactions: { hover: true },
  reducedMotion: true,
  overlays: {
    clickTypeOptions: ["", "href", "modal", "dialog", "transition", "link"],
    tailwind: { modal: { … }, dialog: { … } },
  },
},
checkboxes: {
  isPostCellVisible: true,   // gates bottomView
  isListVisible: true,
},
```

- Overlay chrome uses `var(--aboutFeatures-*)` in `settings.overlays.tailwind`.
- `settings.reducedMotion` + `useReducedMotion()` disable Framer transitions.

---

## 12. Link interactions & clickType

Per **`POST_CELL_MODIFICATION.md` §15**:

```typescript
const { handleClick, renderModalContent, renderDialogContent, transitionContent, isTransition } =
  useLinkInteractions({ tailwind: linkInteractionTailwind });
```

1. Wire feature cards + CTA through `handleClickType(event, link, clickType)`.
2. Early return: `if (isTransition && transitionContent) return <>{transitionContent}</>;`
3. End of section: `{renderModalContent?.()}` `{renderDialogContent?.()}`
4. Feature with link: `role="button"`, `tabIndex={0}`, Enter/Space on `onKeyDown`
5. `defaultClickType: "href"`

---

## 13. Framer Motion

Per **`POST_CELL_MODIFICATION.md` §13** (adapted for `aboutFeatures`):

```typescript
const prefersReducedMotion = useReducedMotion();
const isInView = useInView(sectionRef, { once: true, amount: 0.1 });
const reducedState = { opacity: 1, x: 0, y: 0, scale: 1 };
const shouldReduceMotion = prefersReducedMotion || settings?.reducedMotion;
```

| Element | Initial (typical) | Animate | Stagger |
|---------|-------------------|---------|---------|
| Header | `opacity:0, y:24` | `opacity:1, y:0` | delay `0.15` |
| Feature card | per-type `motionInitial` | `opacity:1, x:0, y:0, scale:1` | `0.35 + index * 0.08` |
| CTA | `opacity:0, y:16` | `opacity:1, y:0` | delay `0.9` |

- Gate animate on `isInView`
- `transition: { duration: 0 }` when reduced motion
- Section class: `motion-reduce` when `shouldReduceMotion`
- Never rely on motion alone for meaning

---

## 14. Hover effects

Per **`POST_CELL_MODIFICATION.md` §14**:

| Layer | Location | Example |
|-------|----------|---------|
| Visual hover | `css.tailwind` | `hover:border-[var(--aboutFeatures-primary)]`, `group-hover:text-*` on `card` / `featureTitle` |
| Motion hover | Painter Framer | `whileHover` on cards (per-type), CTA `scale` / `boxShadow` |

- Framer `whileHover` on features only when `link` present (and not reduced motion).
- `settings.interactions.hover: true` documents intent; visual hover stays in model tailwind.

---

## 15. Responsive behavior

Per **`POST_CELL_MODIFICATION.md` §18** — **no JS breakpoints**; all in model tailwind:

| Token / key | Pattern |
|-------------|---------|
| `css.layout.section` | `paddingY` → `paddingYSm` → `paddingYMd` → `paddingYLg` |
| `css.layout.container` | `paddingX` → … → `paddingXXl` |
| `css.tailwind.grid` / `gridTypeN` | `grid-cols-1` → `sm:` / `md:` / `lg:` |
| Typography | `sm:` / `md:` steps with `--aboutFeatures-fontSize-*` |
| `contentNarrow` | `md:w-[88%] lg:w-[72%] xl:w-[64%]` |

Use `min-w-0` on flex/grid children.

---

## 16. Accessibility

Per **`POST_CELL_MODIFICATION.md` §19**:

| Element | Requirement |
|---------|-------------|
| Section | `aria-label="Features section"` |
| Features grid | `role="list"`, `aria-label="Key features"` |
| Feature icons | `aria-hidden="true"` on decorative wrappers |
| Feature link | `aria-label` with title + URL |
| CTA | `aria-label` with text + link |
| Background | `aria-hidden="true"` |
| Interactive control | Native `<a>` or `<button type="button">` |
| Ornaments | `aria-hidden="true"` on decorative spans |

---

## 17. Null safety

Per **`POST_CELL_MODIFICATION.md` §6**:

```typescript
const data = safeObject(item?.data);
const mediaCells = safeObject(item?.mediaCells);
const css = safeObject(item?.css);
const settings = safeObject(item?.settings);
const checkboxes = safeObject(item?.checkboxes);
const enhancers = safeArray(item?.enhancers);
const background = safeObject(item?.background);
const finalCss = createSafeTailwind(css?.tailwind);
```

**One-column guards:**

| Guard | Rule |
|-------|------|
| Whole section | `hasContent` = header OR features OR CTA; else `return null` |
| Header | `hasHeaderContent` |
| Features | filter invalid items; require title or description |
| CTA | `hasCta` = primary text non-empty |
| `mediaCells` slot | `getHtmlView` → `[]` if missing |
| Tailwind key | `createSafeTailwind` → `""` |

Prefer `""` over deleting keys when tailwind expects a variable fallback.

---

## 18. Painter architecture

### 18.1 Standard imports

Per **`POST_CELL_MODIFICATION.md` §3**:

- `safeObject`, `safeArray`, `safeString`, `createSafeTailwind`
- `useLinkInteractions`, `renderIconFromDataWithTheme`
- `GetBuildView`, `GetBuildEnhancer`, `filterEnhancersByAlign`
- `renderBackgroundStudio`, `HtmlRenderer`
- `motion`, `useReducedMotion`, `useInView`

### 18.2 Key helpers (in painter)

- `resolveLayoutValue`, `resolveRoundedValue`, `parseRoundedDirection`
- `descriptionLooksLikeHtml`, `iconForContainerScale`
- `pickTypeCss` — equivalent to `pickLeftCss` + `pickRightCss` combined for one-column
- `resolveFeatureCardClass(index)` — per-type card modifiers
- `renderHeader`, `renderFeatureCard`, `renderPrimaryCta`, `renderContentBody`, `renderSection`

### 18.3 `RADIUS_SECTION_KEYS`

Must include every `css.borders` key the painter resolves — see `aboutFeaturesPainter.tsx` (`featureCard`, `helixPod`, `brassPlaque`, …).

---

## 19. Painter execution order

Mirrors **`POST_CELL_MODIFICATION.md` §4** for `AboutFeaturesPainter`:

| Step | What |
|------|------|
| 1 | Hooks: `useReducedMotion`, `sectionRef`, `useInView` |
| 2 | Safe reads: `data`, `mediaCells`, `css`, `settings`, `checkboxes`, `enhancers`, `background` |
| 3 | `getHtmlView` / `renderHtmlView`, `renderEnhancers` helpers |
| 4 | `themeMode`, icon colors, `cssVariables` (`useMemo`) |
| 5 | `createSafeTailwind` → `finalCss`; `sectionType`; layout flags; `pickTypeCss` picks |
| 6 | `useLinkInteractions` + `handleClickType` |
| 7 | **Early return** if `isTransition && transitionContent` |
| 8 | Destructure title, subtitle, description, features, cta; compute `hasContent` guards |
| 9 | `reducedState`, `layoutTransition`, `renderHeader`, `renderFeatureCard`, `renderPrimaryCta`, `renderContentBody` |
| 10 | `backgroundLayer` via `useMemo` + `renderBackgroundStudio` |
| 11 | `renderSection` + `contentRenderers` map |
| 12 | Invoke `contentRenderers[sectionType]` (fallback `Type1`) |

---

## 20. Chunk execution map (`aboutFeatures`)

Extends **`MODELDATA_STANDARDIZATION.md` §Chunk execution map** for this cell.

### Identity

| Chunk | Model | Painter | Editor |
|-------|-------|---------|--------|
| `id` | `"AboutFeatures"` | `id={item?.id}` on `<section>` | Cell identity |
| `type` | `"Type1"` | `pickTypeCss`, flags, `contentRenderers` | **Type** dropdown |
| `typeDropdown` | `["Type1",…,"Type30"]` | Not read directly | Dropdown options |

### `data.*`

| Chunk | Path | Painter | Notes |
|-------|------|---------|-------|
| Title | `data.title` | `renderHeader` → `titleClass` | Optional |
| Subtitle | `data.subtitle` | `subtitleClass` | Skipped in Type6 monograph flow |
| Description | `data.description` | `HtmlRenderer` or `<p>` | Optional |
| Feature | `data.features[i]` | `renderFeatureCard` | `{ title, description, icon, link?, clickType? }` |
| Feature icon | `features[i].icon` | `renderThemedIcon` | MUI format |
| CTA | `data.cta.primary` | `renderPrimaryCta` | href → `<a>`; else `<button>` |
| CTA icon | `cta.primary.icon` | arrow wrapper + `currentColor` | Inline color from §5.2 |

### `mediaCells.*` (this painter)

| Slot | Painter call | DOM position |
|------|--------------|--------------|
| `topView` | `renderHtmlView("topView")` | After enhancers top, before content body |
| `bottomView` | `renderHtmlView("bottomView")` | After content body, if `isPostCellVisible` |

### `css.*`

Same as parent chunk map — prefix **`aboutFeatures`** instead of `about`. See §7 and **`POST_CELL_MODIFICATION.md` §25**.

### Optional chunks

| Chunk | Painter |
|-------|---------|
| `background` | `renderBackgroundStudio` z-0 |
| `enhancers[]` | `GetBuildEnhancer` top/bottom |
| `settings.overlays` | `useLinkInteractions` |
| `settings.reducedMotion` | with `useReducedMotion()` |
| `checkboxes.isPostCellVisible` | gates `bottomView` |
| `list`, `wrapper`, `animations` | scaffold (not rendered in this painter) |
| `hints` | editor only |

---

## 21. Cross-cutting concerns summary

Aligned with **`POST_CELL_MODIFICATION.md` §25**:

| Concern | Model (`aboutFeatures`) | tailwind | Painter |
|---------|-------------------------|----------|---------|
| **Theme** | `css.colorPalette` | `var(--aboutFeatures-primary)`, `var(--aboutFeatures-text)`, … | `cssVariables` + `data-theme` |
| **Typography** | `css.typography` | `var(--aboutFeatures-fontSize-*)`, `fontFamily`, `lineHeight` | typography loop in `useMemo` |
| **Borders** | `css.borders` | `rounded-*-[var(--aboutFeatures-radius-{key}-{corner})]` | `RADIUS_SECTION_KEYS` loop |
| **Layout spacing** | `css.layout` | `var(--aboutFeatures-layout-{section}-{prop})` | `resolveLayoutValue` |
| **Responsive** | layout + breakpoints in tailwind | `sm:`, `md:`, `lg:` on grid, container, title | `finalCss` only — no JS |
| **Hover (visual)** | — | `group-hover`, `hover:` on `card`, `featureTitle`, `ctaButton` | `group` on card |
| **Hover (motion)** | `settings.interactions.hover` | — | Framer `whileHover` per type |
| **Framer** | `settings.animations` | — | `useInView`, stagger, `reducedState` |
| **Null safety** | optional fields | `#fallback` in `var()` | `safe*` + guards |
| **Clickable** | `clickType` + `link` on CTA + features | `ctaButton` styling only | `useLinkInteractions` + overlays |

---

## 22. Adding TypeN (repeatable workflow)

Adapted from **`POST_CELL_MODIFICATION.md` §28** (one-column: only `type` axis).

### Step 1 — Model

1. Add `"TypeN"` to `typeDropdown`.
2. Add `css.borders.{radiusKey}` if new radius family.
3. Add `css.layout` tokens (`cardTypeN`, `cardContentTypeN`, …).
4. Add full `css.tailwind` suffixed block for every region that changes.
5. Use theme CSS vars on all text (§7.3).
6. Update `hints.typeVariants`.

### Step 2 — Painter

1. `const isNewLayout = sectionType === "TypeN"`.
2. Add `TypeN` branch at **top** of `pickTypeCss`.
3. Add `typeN` to all `pickTypeCss(..., { typeN: … })` fallbacks.
4. Declare `featureXxxTypeN` class reads.
5. Extend `sectionShellClassName`, `resolveFeatureCardClass`, `motionInitial`, `whileHover`.
6. Add `renderHeader` / `renderFeatureCard` inner / grid decorators if needed.
7. `contentRenderers.TypeN = () => renderSection()`.
8. Add radius key to `RADIUS_SECTION_KEYS` if new.

### Step 3 — Editor

If `typeDropdown` includes `"TypeN"`, **DesignItemSettingsSidebar** shows it automatically.

### Step 4 — QA

| Test | Pass |
|------|------|
| Switch to TypeN | Renders without missing-class crash |
| Light + dark theme | Text, icons, CTA readable |
| Feature `clickType: "modal"` | Modal styled from `settings.overlays` |
| Reduced motion | No movement; content visible |
| Empty `data.features` | Section still shows header/CTA if present |
| Responsive | No horizontal overflow at `sm` / `md` |

### Step 5 — Do not

- Modify existing Type1–(N−1) tailwind or painter branches when adding TypeN.
- Hardcode colors in painter.
- Add icon borders.

---

## 23. Clone checklist (N cells)

Adapted from **`POST_CELL_MODIFICATION.md` §24**:

### Step A — Model

1. Duplicate `aboutFeatures` object in your `modelData/*.ts` file.
2. Rename export + `id` (e.g. `"AboutServices"`).
3. Adjust `data` keys if needed (`features` → `services`, etc.) — keep painter in sync.
4. Replace CSS prefix **`aboutFeatures` → `yourPrefix`** in all `css.tailwind` `var(--…)` and `mediaCells` HTML.
5. Keep `mediaCells` scaffold; clear test HTML after verification.
6. Copy `settings`, `checkboxes`, `list`, `wrapper`, `animations`, `hints`.
7. Register in `modelData/index.ts`.

### Step B — Painter

1. Copy `aboutFeaturesPainter.tsx`.
2. Change model type import.
3. Replace `--aboutFeatures-` with `--yourPrefix-` in `cssVariables` (`PREFIX` constant).
4. Update `RADIUS_SECTION_KEYS` to match your `css.borders`.
5. Keep execution order identical (§19).
6. Register in painter index + `DesignItemRenderer`.

### Step C — Verify

| Test | Expected |
|------|----------|
| Empty `data.title` + no features + no CTA | `return null` |
| Empty `topView` | No top slot DOM |
| `type: "Type7"` | Bento layout renders |
| `cta.clickType: "modal"` | Modal from overlays tailwind |
| OS reduced motion | Static appearance |
| `colorPalette.theme: "dark"` | `data-theme="dark"`, readable text |

---

## 24. Per-chunk modify order

From **`MODELDATA_STANDARDIZATION.md` §Per-chunk modify guide** — use when standardizing any one-column cell:

1. `id`, `type`, `typeDropdown`
2. `data` — copy, URLs, icons, features array, CTA
3. `mediaCells` — slots; test HTML; remove placeholders
4. `css.colorPalette` — light/dark + `theme`
5. `css.typography`
6. `css.borders` — match `RADIUS_SECTION_KEYS`
7. `css.layout`
8. `css.tailwind` — base keys + per-type suffixes; responsive + hover
9. `background` / `enhancers` (optional)
10. `settings.overlays`
11. `checkboxes`, `list`, `wrapper`, `animations`, `hints`
12. Painter — duplicate `aboutFeaturesPainter`; change import + prefix; keep §19 order

---

## 25. Validation checklist

### Model

- [ ] `id` PascalCase, unique; `type` ∈ `typeDropdown`
- [ ] `data.title` / `subtitle` / `description` are strings or `""`
- [ ] `data.features` array; each item has title and/or description
- [ ] `data.cta.primary` shape correct; `clickType` + `link` when interactive
- [ ] Icons: `{ iconName, type, fontSize }`
- [ ] `css.colorPalette` light + dark; `theme` set
- [ ] `css.tailwind` uses `var(--aboutFeatures-*)` with fallbacks
- [ ] Every `typeDropdown` value has complete `*TypeN` tailwind set
- [ ] `settings.reducedMotion: true`; overlays tailwind themed
- [ ] `checkboxes`, `list`, `wrapper`, `animations` scaffold
- [ ] Test HTML removed from `mediaCells`

### Painter

- [ ] Imports per §18.1
- [ ] `getHtmlView` → `[]`; `GetBuildView` gets `colorPalette`
- [ ] `cssVariables` + `data-theme` on section
- [ ] No hardcoded Tailwind/colors in TSX
- [ ] `pickTypeCss` covers every type
- [ ] `contentRenderers` entry per `typeDropdown` value
- [ ] `hasContent` guard
- [ ] CTA inline colors (§5.2); arrow `currentColor`
- [ ] `HtmlRenderer` / plain `<p>` for descriptions
- [ ] Feature links: click + keyboard + `aria-label`
- [ ] `useLinkInteractions`; transition early return; modal/dialog at end
- [ ] Background z-0; content z-10
- [ ] Enhancers + topView/bottomView order (§27)
- [ ] `checkboxes.isPostCellVisible` gates bottomView
- [ ] Reduced motion respected

---

## 26. Reference files

| File | Role |
|------|------|
| `src/drafting/modelData/about.ts` | `aboutFeatures` model |
| `src/drafting/painter/about/aboutFeaturesPainter.tsx` | One-column painter |
| `src/drafting/modelData/about.ts` | `aboutModern` (two-column reference) |
| `src/drafting/painter/about/aboutModernPainter.tsx` | Two-column painter reference |
| `src/doc/twocoulmmodification/MODELDATA_STANDARDIZATION.md` | Global model standard |
| `src/doc/twocoulmmodification/POST_CELL_MODIFICATION.md` | Global painter standard |
| `src/drafting/painter/utils/safeAccess.ts` | Null-safe helpers |
| `src/drafting/painter/utils/useLinkInteractions.tsx` | clickType / overlays |
| `src/drafting/painter/utils/renderIconFromData.tsx` | Themed icons |
| `src/drafting/layoutEditor/reusebleFunction/getBuildView.tsx` | mediaCells pipeline |
| `src/drafting/layoutEditor/enhancer` | `GetBuildEnhancer` |
| `src/drafting/layoutEditor/backgroundStudio/backgrounds` | `renderBackgroundStudio` |

---

## 27. Render tree

```
<section data-theme style={cssVariables} aria-label="Features section">
  [background layer — z-0, aria-hidden]
  <div relative z-10>
    GetBuildEnhancer (align: top)
    GetBuildView (topView)
    <container>
      renderHeader()
      <div role="list" gridClass>
        [grid decorators: spine, sonar, tide, constellation field, …]
        renderFeatureCard × N
      </div>
      <ctaContainer> renderPrimaryCta() </ctaContainer>
    </container>
    GetBuildView (bottomView)   ← if checkboxes.isPostCellVisible
    GetBuildEnhancer (align: bottom)
  </div>
  renderModalContent()
  renderDialogContent()
</section>
```

---

## Summary

One-column painters (`aboutFeatures` pattern) MUST:

1. Follow **`MODELDATA_STANDARDIZATION.md`** top-level shape (without `left`/`right`).
2. Follow **`POST_CELL_MODIFICATION.md`** execution order, null safety, CSS-in-model, theme vars, background, enhancers, `mediaCells`, Framer, and link interactions.
3. Use **`pickTypeCss`** + `typeDropdown` as the **only** layout variant axis.
4. Keep prefix **`--aboutFeatures-`** consistent across model tailwind, `cssVariables`, and inline HTML in `mediaCells`.
5. Add new layouts via **§22** without changing existing types.

When in doubt, compare against `aboutModern` / `aboutModernPainter` for shared patterns, and against `aboutFeatures` / `aboutFeaturesPainter` for one-column specifics.
