## BusinessServicesFeaturesPartnersPremium Integration

### Overview

`BusinessServicesFeaturesPartnersPremium` is a premium partner-logos feature section for the Business Services About experience. It renders a responsive grid of partner cards with logos, imagery, and interactive click behavior. This document explains how the widget is wired across model data, layout editor, renderer, and painter.

---

### File Structure & Integration Points

- **Model definition**: `src/drafting/modelData/about.ts`
- **Model registration**: `src/drafting/modelData/index.ts`
- **Layout tree entry**: `src/drafting/layoutEditor/fileStructure.json`
- **Painter component**: `src/drafting/painter/about/businessServicesFeaturesPartnersPremiumPainter.tsx`
- **Painter switch registration**: `src/drafting/painter/DesignItemRenderer.tsx`

#### 1. Model Data Definition (`about.ts`)

The full model object is defined in `about.ts`:

```typescript
export const businessServicesFeaturesPartnersPremium = {
  id: "BusinessServicesFeaturesPartnersPremium",
  type: "Type1",
  typeDropdown: ["Type1"],
  data: {
    header: {
      badge: "Our Partners",
      title: "Trusted by Industry Leaders",
      description:
        "We collaborate with innovative companies and organizations that share our commitment to excellence and innovation.",
    },
    partners: [
      {
        name: "UrbaNest",
        logo: "https://logo.clearbit.com/urbanest.com",
        image: "https://images.unsplash.com/...",
        website: "https://urbanest.com",
        link: "https://urbanest.com",
        clickType: "href",
      },
      // ...more partner items...
    ],
  },
 mediaCells: {
    topView: [
      {
        type: "html",
        htmlView: "<p class='text-gray-600 leading-relaxed'>A highly scalable REST API structure designed with <span class='font-medium text-gray-900'>modular controllers</span>, service layers, middleware patterns, and clean folder organization.</p>",
      },
      {
        type: "cellLink",
        link: "",
      },
    ],
    bottomView: [
      {
        type: "html",
        htmlView: "<p class='text-gray-600 leading-relaxed'>A highly scalable REST API structure designed with <span class='font-medium text-gray-900'>modular controllers</span>, service layers, middleware patterns, and clean folder organization.</p>",
      },
      {
        type: "cellLink",
        link: "",
      },
    ],
  },

  css: {
    tailwind: {
      global: "bg-gradient-to-br from-[#E0F9FF] via-[#A3F0FF] to-[#66E6FF] min-h-screen py-16 md:py-24",
      container: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
      header: "text-center mb-12 md:mb-16 space-y-6",
      badge: "inline-block text-sm font-semibold uppercase tracking-wider text-[#006B8C] bg-[#00D9FF]/30 px-4 py-2 rounded-full backdrop-blur-sm",
      title: "text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-[#006B8C] tracking-tight",
      description: "text-base md:text-lg leading-relaxed text-[#00A5CC] max-w-2xl mx-auto",
      partnersGrid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8",
      partnerCard: "group relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-md shadow-lg ring-1 ring-[#00D9FF]/30 transition-all duration-500 hover:shadow-2xl hover:ring-[#00A5CC]/50 hover:-translate-y-2 cursor-pointer",
      partnerCardGradient: "absolute inset-0 bg-gradient-to-br from-[#E0F9FF]/0 via-[#A3F0FF]/0 to-[#66E6FF]/0 group-hover:from-[#E0F9FF]/20 group-hover:via-[#A3F0FF]/30 group-hover:to-[#66E6FF]/40 transition-all duration-500",
      partnerCardContent: "relative z-10 p-6 md:p-8",
      partnerImageContainer: "relative mb-6 rounded-xl overflow-hidden bg-gradient-to-br from-[#66E6FF] to-[#00D9FF] aspect-square",
      partnerImage: "w-full h-full object-cover transition-transform duration-500 group-hover:scale-110",
      partnerLogoContainer: "absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500",
      partnerLogo: "w-24 h-24 object-contain",
      partnerName: "text-xl md:text-2xl font-bold leading-tight text-[#006B8C] mb-2 group-hover:text-[#00A5CC] transition-colors duration-300 text-center",
      partnerWebsite: "text-sm text-[#00A5CC]/70 text-center group-hover:text-[#00A5CC] transition-colors duration-300",
      decorativeAccent: "absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#66E6FF] via-[#00D9FF] to-[#00A5CC] opacity-0 group-hover:opacity-100 transition-opacity duration-500",
      decorativePattern: "absolute inset-0 opacity-5 pointer-events-none",
    },
    antd: {},
    mui: {},
    customCss: {},
  },
  settings: {
    type: "BusinessServicesFeaturesPartnersPremium",
    animations: {
      fadeIn: true,
      slideIn: true,
      hover: true,
      stagger: true,
    },
    interactions: {
      hover: true,
      scroll: false,
    },
    overlays: {
      clickTypeOptions: ["", "href", "modal", "dialog", "popover"],
      tailwind: {
        modal: { /* modal styles */ },
        dialog: { /* dialog styles */ },
        popover: { /* popover styles */ },
      },
    },
  },
  checkboxes: {
    isReverse: false,
    isPostCellVisible: true,
    isListVisible: true,
  },
  list: {
    type: "row",
    settings: {},
    css: { tailwind: { global: "", item: "" } },
    items: [],
  },
  wrapper: [],
    animations: [],
  hints:{}
};
```

**Key points:**
- `id` must be `"BusinessServicesFeaturesPartnersPremium"` and is used everywhere else for lookup.
- `typeDropdown` currently exposes a single layout type (`"Type1"`); extending layouts requires updating both model and painter.
- `partners` is the primary content array; each item should at minimum provide a non-empty `name` (others are optional but recommended).
- `css.tailwind` centralizes all Tailwind classes and is always accessed through `createSafeTailwind` in the painter.
- `settings.overlays` follows the shared overlay configuration, enabling `href`, `modal`, `dialog`, and `popover` click behaviors.

#### 2. Model Registration (`modelData/index.ts`)

In `modelData/index.ts`, the model is imported and attached to the global `modelData` map:

```typescript
import { businessServicesFeaturesPartnersPremium } from "./about";

export const modelData = {
  // ... other models ...
  BusinessServicesFeaturesPartnersPremium: businessServicesFeaturesPartnersPremium,
  // ...
};
```

This is what allows the drafting system to fetch the correct data object when an item with `id: "BusinessServicesFeaturesPartnersPremium"` is requested.

#### 3. Layout Tree Entry (`layoutEditor/fileStructure.json`)

Under the `"About"` section in `fileStructure.json`, the widget is registered as:

```json
{
  "name": "BusinessServicesFeaturesPartnersPremium",
  "link": "http://localhost:5175/drafting?postId=ca72ca99-ba42-4d43-b25b-e7e2713bc556&tag=BusinessServicesFeaturesPartnersPremium",
  "isValidate": false
}
```

**Notes:**
- `name` must match the model id/tag used elsewhere.
- `tag` in the URL is `BusinessServicesFeaturesPartnersPremium`, which is what the editor uses to locate the correct model + painter combination.
- `isValidate` can be flipped to `true` once the widget is fully tested and considered stable.

#### 4. Painter Component (`businessServicesFeaturesPartnersPremiumPainter.tsx`)

The painter is responsible for rendering the premium partners section:

```typescript
type BusinessServicesFeaturesPartnersPremiumModel =
  typeof import("../../modelData/about").businessServicesFeaturesPartnersPremium;

type BusinessServicesFeaturesPartnersPremiumProps = {
  item: BusinessServicesFeaturesPartnersPremiumModel;
};

type PartnerItem = NonNullable<
  NonNullable<BusinessServicesFeaturesPartnersPremiumModel["data"]>["partners"]
>[number];
```

**Safe extraction & setup:**

```typescript
const data = safeObject<BusinessServicesFeaturesPartnersPremiumModel["data"]>(
  item?.data
);
const css = safeObject<BusinessServicesFeaturesPartnersPremiumModel["css"]>(
  item?.css
);
const tw = createSafeTailwind(css?.tailwind);
const settings = safeObject<
  BusinessServicesFeaturesPartnersPremiumModel["settings"]
>(item?.settings);

const overlaysTailwind = safeObject<LinkInteractionTailwindConfig>(
  settings?.overlays?.tailwind
);
const linkInteractionTailwind =
  Object.keys(overlaysTailwind).length > 0 ? overlaysTailwind : undefined;

const {
  handleClick: handleLinkClick,
  renderModalContent,
  renderDialogContent,
  
  transitionContent,
  isTransition,
} = useLinkInteractions({
  tailwind: linkInteractionTailwind,
});

const header =
  safeObject<BusinessServicesFeaturesPartnersPremiumModel["data"]["header"]>(
    data?.header
  );
const partners = safeArray<PartnerItem>(data?.partners);
```

**Click handling:**

```typescript
const handleClickType = (
  event: React.MouseEvent<HTMLElement>,
  link?: string,
  clickType?: string
) => {
  handleLinkClick({
    clickType: clickType,
    defaultClickType: "href",
    link: link,
    event,
  });
};
```

- Respects `clickType` per partner (`href`, `modal`, `dialog`, `popover`, or `""`).
- Defaults to `"href"` when `clickType` is missing.

**Transition and empty-state guards:**

```typescript
if (isTransition && transitionContent) {
  return <>{transitionContent}</>;
}

if (!partners || partners.length === 0) {
  return null;
}
```

**Header rendering:**

```typescript
const renderHeader = () => {
  if (!header || (!header?.badge && !header?.title && !header?.description)) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className={tw.header ?? ""}
    >
      {header?.badge && (
        <span className={tw.badge ?? ""}>{safeString(header.badge)}</span>
      )}
      {header?.title && (
        <h1 className={tw.title ?? ""}>{safeString(header.title)}</h1>
      )}
      {header?.description && (
        <p className={tw.description ?? ""}>
          {safeString(header.description)}
        </p>
      )}
    </motion.div>
  );
};
```

**Partner card rendering:**

```typescript
const renderPartnerCard = (partner: PartnerItem, index: number) => {
  if (!partner) return null;

  const partnerName = safeString(partner?.name);
  const partnerImage = safeString(partner?.image);
  const partnerLogo = safeString(partner?.logo);
  const partnerWebsite = safeString(partner?.website);
  const partnerLink = safeString(partner?.link);

  if (!partnerName || partnerName.length === 0) return null;

  return (
    <motion.div
      key={`partner-${index}`}
      variants={itemVariants}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={tw.partnerCard ?? ""}
      onClick={(event) => {
        if (partnerLink && partnerLink.trim() !== "") {
          handleClickType(event, partnerLink, partner?.clickType);
        }
      }}
      role={partnerLink ? "button" : undefined}
      tabIndex={partnerLink ? 0 : undefined}
    >
      {/* Gradient overlay and decorative accent */}
      <div className={tw.partnerCardGradient ?? ""}></div>
      <div className={tw.decorativeAccent ?? ""}></div>

      <div className={tw.partnerCardContent ?? ""}>
        {partnerImage && (
          <div className={tw.partnerImageContainer ?? ""}>
            <img
              src={partnerImage}
              alt={partnerName}
              className={tw.partnerImage ?? ""}
              loading="lazy"
            />
            {partnerLogo && (
              <div className={tw.partnerLogoContainer ?? ""}>
                <img
                  src={partnerLogo}
                  alt={`${partnerName} logo`}
                  className={tw.partnerLogo ?? ""}
                  onError={(e) => {
                    const target = e.currentTarget.parentElement;
                    if (target) {
                      target.style.display = "none";
                    }
                  }}
                />
              </div>
            )}
          </div>
        )}

        {partnerName && (
          <h3 className={tw.partnerName ?? ""}>{partnerName}</h3>
        )}

        {partnerWebsite && (
          <p className={tw.partnerWebsite ?? ""}>{partnerWebsite}</p>
        )}
      </div>
    </motion.div>
  );
};
```

**Root JSX composition:**

```typescript
return (
  <>
    <div className={tw.global ?? ""}>
      <div className={tw.container ?? ""}>
        {renderHeader()}
        {partners.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className={tw.partnersGrid ?? ""}
          >
            {partners.map((partner, index) =>
              renderPartnerCard(partner, index)
            )}
          </motion.div>
        )}
      </div>
    </div>
    {renderModalContent()}
    {renderDialogContent()}
    {}
  </>
);
```

---

### Renderer Registration (`DesignItemRenderer.tsx`)

In `DesignItemRenderer.tsx`, the painter is lazy-loaded and wired into the main switch. The pattern matches other About/Feature painters:

```typescript
const BusinessServicesFeaturesPartnersPremiumPainter = React.lazy(
  () => import("./about/businessServicesFeaturesPartnersPremiumPainter")
);

// ...

switch (id) {
  // ...
  case "BusinessServicesFeaturesPartnersPremium":
    return (
      <React.Suspense fallback={null}>
        <BusinessServicesFeaturesPartnersPremiumPainter item={anyItem} />
      </React.Suspense>
    );
  // ...
}
```

**Important:**
- The `case` string must exactly match the model `id`.
- The `item` prop is passed through as `anyItem`, which at runtime is the same object that came from `modelData`.

---

### End-to-End Flow

1. **Editor navigation**
   - User clicks `BusinessServicesFeaturesPartnersPremium` under the `About` group in the layout tree (`fileStructure.json`).
   - The tagging system requests a design item with `id: "BusinessServicesFeaturesPartnersPremium"`.

2. **Model resolution**
   - `modelData/index.ts` resolves `BusinessServicesFeaturesPartnersPremium` to the `businessServicesFeaturesPartnersPremium` object exported from `about.ts`.

3. **Rendering**
   - `DesignItemRendererImpl` receives the item, matches `id` in the `switch`, and renders `BusinessServicesFeaturesPartnersPremiumPainter` via `React.Suspense`.
   - The painter uses `safeObject`, `safeArray`, and `safeString` to read data, derives Tailwind classes via `createSafeTailwind`, wires link interactions via `useLinkInteractions`, and composes the motion-animated grid of partner cards.
   - Overlay components (`modal`, `dialog`, `popover`) are always mounted at the root so any partner with `clickType !== "href"` can show richer content.

---

### Null-Safety & Extension Guidelines

- **Treat everything as optional**
  - Partners array is accessed via `safeArray`, which guarantees an array and filters out falsy values.
  - Header and CSS branches use `safeObject` and optional chaining everywhere.
- **String validation**
  - Only render partner names, images, logos, and websites if `safeString(...)` returns a non-empty string.
  - Partner cards return `null` early when `name` is missing to avoid empty shells.
- **Overlays**
  - Only pass `linkInteractionTailwind` into `useLinkInteractions` when `settings.overlays.tailwind` has keys, to avoid overriding defaults with empty objects.
- **Adding new variants**
  - To introduce new layout types:
    - Extend `typeDropdown` in the model.
    - Add corresponding branches (e.g., separate grid styles) in the painter.
    - Keep the same null-safety and interaction patterns used in `Type1`.

This integration keeps `BusinessServicesFeaturesPartnersPremium` consistent with other About/Feature painters (see `ABOUT_OUR_WORKS_PAINTER.md`, `ABOUT_FEATURES_PAINTER.md`, and `FEATURE_CREATIVE_DESIGN_FEATURES_PAINTER.md`) while focusing on a premium partner grid experience.


