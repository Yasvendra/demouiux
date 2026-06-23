# Wrapper System Documentation

## Overview

The Wrapper System is a composable component architecture that allows styling, effects, and transformations to be applied to design items in a declarative, reusable manner. Wrappers are React components that wrap children and apply CSS styles, transformations, and interactive behaviors.

## Architecture

### Core Components

1. **Wrapper Components** (`src/drafting/wrapper/`)
   - Individual wrapper implementations (e.g., `Rotate.tsx`, `InteractiveViewer.tsx`)
   - Each wrapper is a React component that accepts `css` and `children` props

2. **Wrapper Registry** (`src/drafting/wrapper/index.tsx`)
   - Central registry mapping wrapper types to components
   - `WrapperComponents` object: `Record<string, WrapperComponent>`
   - `ComposeWrappers` function: Composes multiple wrappers in order

3. **Model Data** (`src/drafting/modelData/index.ts`)
   - `wrapperItems` object: Default configurations for all wrapper types
   - Provides type-safe defaults and structure

### Integration Flow

```
Model Data (modelData/index.ts)
    ↓
Design Item (with wrapper array)
    ↓
ComposeWrappers (wrapper/index.tsx)
    ↓
Wrapper Components (wrapper/[Component].tsx)
    ↓
Rendered Output
```

## How Wrappers Work

### 1. Model Data Structure

Wrappers are defined in the model data as an array on design items:

```typescript
{
  id: "item-1",
  type: "text",
  wrapper: [
    {
      type: "global",
      css: {
        tailwind: { global: "p-4" },
        customCss: {
          all: 16,
          additionalClasses: " ",
          style: {}
        }
      },
      settings: {}
    },
    {
      type: "interactiveViewer",
      css: {
        tailwind: { global: "touch-pan-y touch-pan-x overflow-hidden" },
        customCss: {
          minScale: 0.5,
          maxScale: 3,
          initialScale: 1,
          enablePan: true,
          enableWheelZoom: true,
          enablePinchZoom: false,
          origin: "center",
          additionalClasses: " ",
          style: {}
        }
      },
      settings: {}
    }
  ]
}
```

### 2. Composition Process

The `ComposeWrappers` function processes wrappers using `reduceRight` to nest components from outer to inner:

```typescript
export function ComposeWrappers({
  wrappers,
  children,
}: {
  wrappers?: any[];
  children: React.ReactNode;
}) {
  if (!Array.isArray(wrappers) || wrappers.length === 0) {
    return <>{children}</>;
  }

  const composed = wrappers.reduceRight<React.ReactNode>((acc, wrapperItem, index) => {
    const typeKey = String(wrapperItem?.type || "").toLowerCase();
    const Component = WrapperComponents[typeKey] || Passthrough;
    const props = { ...wrapperItem };
    return <Component key={`wrapper-${index}-${typeKey}`} {...props}>{acc}</Component>;
  }, children);

  return <>{composed}</>;
}
```

**Key Points:**
- Uses `reduceRight` to apply wrappers from last to first (outermost to innermost)
- Converts type to lowercase for registry lookup
- Falls back to `Passthrough` component if wrapper type not found
- Each wrapper receives all props from the wrapper item

### 3. Usage in Rendering

Wrappers are applied in various rendering contexts:

```typescript
// Example from Preview.tsx
<ComposeWrappers wrappers={(item as any)?.wrapper}>
  <Animations animations={(item as any)?.animations}>
    <DesignItemRenderer item={item as any} />
  </Animations>
</ComposeWrappers>
```

**Order of Application:**
1. Wrappers (outermost styling/effects)
2. Animations (motion effects)
3. DesignItemRenderer (actual content)

## Wrapper Component Structure

### Standard Props Interface

All wrapper components follow a consistent structure:

```typescript
type WrapperProps = {
  css?: {
    tailwind?: { global?: string };
    antd?: { global?: string };
    mui?: { global?: string };
    className?: string;
    customCss?: {
      // Wrapper-specific properties
      additionalClasses?: string | string[];
      style?: React.CSSProperties;
    };
  };
  children?: React.ReactNode;
  [key: string]: any; // Allows additional props
};
```

### Common Patterns

1. **Class Name Building:**
   ```typescript
   const classNameParts: string[] = [];
   if (tailwindGlobal) classNameParts.push(tailwindGlobal);
   if (antdGlobal) classNameParts.push(antdGlobal);
   if (muiGlobal) classNameParts.push(muiGlobal);
   if (extraClassName) classNameParts.push(extraClassName);
   if (custom.additionalClasses) {
     // Handle string or array
   }
   const className = classNameParts.filter(Boolean).join(" ");
   ```

2. **Style Object Building:**
   ```typescript
   const style: React.CSSProperties = {};
   // Apply wrapper-specific styles
   if (custom && typeof custom.style === "object" && custom.style) {
     Object.assign(style, custom.style); // Merge custom overrides
   }
   ```

3. **Tailwind Token Detection:**
   Many wrappers support both Tailwind classes and numeric values:
   ```typescript
   function isTailwindToken(value: unknown): boolean {
     if (typeof value !== "string") return false;
     const trimmed = value.trim();
     if (trimmed.length === 0) return false;
     return /[a-zA-Z\[]/.test(trimmed);
   }
   ```

## Available Wrappers

### Layout Wrappers
- **global**: Padding and spacing utilities
- **grid**: CSS Grid layout
- **position**: Position (relative, absolute, fixed, sticky)
- **sticky**: Sticky positioning
- **columnslayout**: Multi-column layout

### Transform Wrappers
- **rotate**: Rotation transform
- **rotatedBox**: Rotated box with inline display
- **translate**: Translation transform
- **skew**: Skew transform
- **perspective**: 3D perspective

### Visual Effect Wrappers
- **backgroundImage**: Background image with overlay
- **backgroundLayer**: Advanced background layer
- **gradient**: CSS gradients
- **backdropFilter**: Backdrop blur and filters
- **backdropOverlay**: Overlay with blend modes
- **mask**: CSS mask properties
- **clipPath**: Custom clip paths
- **clipOval**: Circular/elliptical clipping
- **clipRRect**: Rounded rectangle clipping

### Interactive Wrappers
- **interactiveViewer**: Pan and zoom functionality
- **inView**: Intersection Observer based visibility
- **ripple**: Ripple effect on interaction
- **transition**: CSS transitions
- **ring**: Focus ring styling

### Utility Wrappers
- **gridPaper**: Grid paper background
- **gridOverlay**: Grid overlay for design
- **badge**: Badge/counter overlay
- **scrollbar**: Custom scrollbar styling
- **shapeOutside**: CSS shape-outside for text wrapping

## Example: InteractiveViewer Wrapper

### Model Data Configuration

```typescript
interactiveViewer: {
  type: "interactiveViewer",
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
    tailwind: { global: "touch-pan-y touch-pan-x overflow-hidden" },
    customCss: {
      minScale: 0.5,
      maxScale: 3,
      initialScale: 1,
      enablePan: true,
      enableWheelZoom: true,
      enablePinchZoom: false,
      origin: "center",
      additionalClasses: " ",
      style: {},
    },
  },
  settings: {},
}
```

### Component Implementation

```typescript
export default function InteractiveViewer(props: InteractiveViewerProps) {
  const { children, css } = props;
  const custom = css?.customCss || {};
  
  const [scale, setScale] = useState(custom.initialScale ?? 1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  
  // Event handlers for pan and zoom
  const onWheel = (e) => { /* zoom logic */ };
  const onMouseDown = (e) => { /* pan start */ };
  // ... more handlers
  
  const innerStyle: React.CSSProperties = {
    transformOrigin: custom.origin || "center center",
    transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
    willChange: "transform",
  };
  
  return (
    <div className={className} style={styleOuter} {...handlers}>
      <div style={innerStyle}>{children}</div>
    </div>
  );
}
```

### Usage in Model Data

```typescript
{
  id: "zoomable-content",
  type: "container",
  wrapper: [
    {
      type: "interactiveViewer",
      css: {
        tailwind: { global: "touch-pan-y touch-pan-x overflow-hidden" },
        customCss: {
          minScale: 0.5,
          maxScale: 3,
          initialScale: 1,
          enablePan: true,
          enableWheelZoom: true,
          enablePinchZoom: false,
          origin: "center"
        }
      }
    }
  ],
  // ... content
}
```

## Example: Global Wrapper

### Model Data Configuration

```typescript
global: {
  type: "global",
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
      global: "p-0",
    },
    customCss: {
      top: 10,
      bottom: 10,
      left: 10,
      right: 10,
      horizontal: 10,
      vertical: 10,
      all: 10,
      none: 0,
      additionalClasses: " ",
      style: {},
    },
  },
  settings: {},
}
```

### Component Features

- Supports numeric values (converted to px)
- Supports Tailwind tokens (e.g., "p-4", "px-2")
- Supports CSS length units (px, rem, em, vh, vw, %)
- Supports CSS keywords (auto, initial, inherit)
- Handles `all`, `vertical`, `horizontal`, and individual sides

## Wrapper Registration

All wrappers must be registered in `src/drafting/wrapper/index.tsx`:

```typescript
export const WrapperComponents: Record<string, WrapperComponent> = {
  rotate: Rotate,
  rotatedbox: RotatedBox,
  clipoval: ClipOval,
  cliprrect: ClipRRect,
  clippath: ClipPath,
  interactiveviewer: InteractiveViewer,
  gridpaper: GridPaper,
  backdropfilter: BackdropFilter,
  backgroundimage: BackgroundImage,
  gradient: Gradient,
  badge: Badge,
  grid: Grid,
  position: Position,
  translate: Translate,
  transition: Transition,
  sticky: Sticky,
  skew: Skew,
  perspective: Perspective,
  backgroundlayer: BackgroundLayer,
  mask: Mask,
  scrollbar: Scrollbar,
  columnslayout: ColumnsLayout,
  shapeoutside: ShapeOutside,
  inview: InView,
  backdropoverlay: BackdropOverlay,
  ripple: Ripple,
  ring: Ring,
  gridoverlay: GridOverlay,
  global: Global,
};
```

**Registration Rules:**
- Keys must be lowercase
- Keys should match the `type` field in model data (lowercased)
- Component names are PascalCase
- Import statements must be added at the top

## Adding a New Wrapper

### Step 1: Create Component File

Create `src/drafting/wrapper/YourWrapper.tsx`:

```typescript
import React from "react";

type YourWrapperProps = {
  css?: {
    tailwind?: { global?: string };
    antd?: { global?: string };
    mui?: { global?: string };
    className?: string;
    customCss?: {
      // Your wrapper-specific properties
      property1?: string | number;
      property2?: boolean;
      additionalClasses?: string | string[];
      style?: React.CSSProperties;
    };
  };
  children?: React.ReactNode;
  [key: string]: any;
};

export default function YourWrapper(props: YourWrapperProps) {
  const { children, css } = props;
  const tailwindGlobal = (css?.tailwind?.global || "").trim();
  const custom = css?.customCss || {};
  
  // Build className
  const classNameParts: string[] = [];
  if (tailwindGlobal) classNameParts.push(tailwindGlobal);
  // Add additional classes from customCss.additionalClasses
  
  // Build style
  const style: React.CSSProperties = {};
  // Apply your wrapper-specific styles
  if (custom && typeof custom.style === "object" && custom.style) {
    Object.assign(style, custom.style);
  }
  
  const className = classNameParts.filter(Boolean).join(" ");
  
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}
```

### Step 2: Register in index.tsx

Add import and registration:

```typescript
import YourWrapper from "./YourWrapper.tsx";

export const WrapperComponents: Record<string, WrapperComponent> = {
  // ... existing wrappers
  yourwrapper: YourWrapper, // lowercase key
};
```

### Step 3: Add to Model Data

Add default configuration to `src/drafting/modelData/index.ts`:

```typescript
export const wrapperItems = {
  // ... existing wrappers
  yourWrapper: {
    type: "yourWrapper",
    css: {
      tailwind: { global: "" },
      customCss: {
        property1: "default-value",
        property2: false,
        additionalClasses: " ",
        style: {},
      },
    },
    settings: {},
  },
};
```

## Composition Order

Wrappers are applied from **outermost to innermost** (last to first in array):

```typescript
wrapper: [
  { type: "global" },      // Applied first (outermost)
  { type: "rotate" },       // Applied second
  { type: "backgroundImage" } // Applied last (innermost, closest to content)
]
```

Results in:
```
<Global>
  <Rotate>
    <BackgroundImage>
      {children}
    </BackgroundImage>
  </Rotate>
</Global>
```

## Best Practices

1. **Consistent Props Structure:**
   - Always include `css` prop with `tailwind`, `antd`, `mui`, `className`, and `customCss`
   - Support `additionalClasses` as string or array
   - Support `style` object for custom overrides

2. **Tailwind Token Support:**
   - Detect Tailwind tokens vs numeric values
   - Add Tailwind classes to `className`
   - Convert numeric values to CSS (e.g., px)

3. **Default Values:**
   - Provide sensible defaults in component
   - Define defaults in model data `wrapperItems`
   - Use nullish coalescing (`??`) for defaults

4. **Type Safety:**
   - Define TypeScript types for props
   - Use `React.CSSProperties` for style objects
   - Allow `[key: string]: any` for flexibility

5. **Performance:**
   - Use `useMemo` for expensive computations
   - Use `useCallback` for event handlers when needed
   - Avoid unnecessary re-renders

6. **Accessibility:**
   - Preserve semantic HTML when possible
   - Maintain keyboard navigation
   - Support screen readers

## Common Patterns

### Pattern 1: Simple Style Wrapper

```typescript
export default function SimpleWrapper(props: SimpleWrapperProps) {
  const { children, css } = props;
  const custom = css?.customCss || {};
  
  const style: React.CSSProperties = {
    // Apply styles from customCss
  };
  
  return <div style={style}>{children}</div>;
}
```

### Pattern 2: Interactive Wrapper

```typescript
export default function InteractiveWrapper(props: InteractiveWrapperProps) {
  const { children, css } = props;
  const [state, setState] = useState(initialState);
  
  const handlers = {
    onMouseDown: (e) => { /* ... */ },
    onMouseMove: (e) => { /* ... */ },
    // ... more handlers
  };
  
  return (
    <div {...handlers}>
      {children}
    </div>
  );
}
```

### Pattern 3: Conditional Rendering

```typescript
export default function ConditionalWrapper(props: ConditionalWrapperProps) {
  const { children, css } = props;
  const custom = css?.customCss || {};
  
  if (!custom.enabled) {
    return <>{children}</>;
  }
  
  return <div>{children}</div>;
}
```

## Troubleshooting

### Wrapper Not Rendering

1. Check registration in `WrapperComponents` (lowercase key)
2. Verify type matches (case-insensitive)
3. Check for errors in component implementation
4. Verify wrapper array is not empty

### Styles Not Applying

1. Check `customCss` structure matches component expectations
2. Verify Tailwind classes are valid
3. Check for style conflicts
4. Inspect computed styles in browser DevTools

### Composition Issues

1. Verify wrapper order (outermost to innermost)
2. Check for conflicting transforms
3. Verify z-index stacking if needed
4. Check for overflow issues

## Related Documentation

- [DRAFTING_FOLDER_STRUCTURE.md](./DRAFTING_FOLDER_STRUCTURE.md) - Overall architecture
- [MODELDATA_STANDARDIZATION.md](./MODELDATA_STANDARDIZATION.md) - Model data structure
- [WIDGET_DATA_STRUCTURE.md](./WIDGET_DATA_STRUCTURE.md) - Widget structure
