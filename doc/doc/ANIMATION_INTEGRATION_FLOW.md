# Animation Integration Flow

This document describes the complete flow of how animations are defined, registered, and applied within the drafting system.

## Overview

The animation system follows a three-tier architecture:
1. **Model Data Definition** - Animation configurations stored in `animationsItems`
2. **Component Implementation** - React components that execute the animations
3. **Runtime Application** - Wrapper components that apply animations to design items

## Architecture Flow

```
animationsItems (Model Data)
    ↓
AnimationComponent (React Component)
    ↓
AnimationComponents Registry
    ↓
Animations Wrapper
    ↓
Design Item Rendering
```

## 1. Model Data Definition

**Location**: `src/drafting/modelData/index.ts`

All animation configurations are defined in the `animationsItems` export object. Each animation entry follows this structure:

```typescript
export const animationsItems = {
  depthSlideDown: {
    type: "depthSlideDown",              // Unique identifier (must match component name)
    css: {
      tailwind: { global: "" },          // Optional Tailwind classes
      customCss: {
        transform: "translateY(-24px) translateZ(-120px) scale(.96)",  // Initial transform
        opacity: 0,                      // Initial opacity
        additionalClasses: " ",          // Additional CSS classes
        style: {}                        // Custom inline styles
      },
    },
    settings: {
      trigger: "normal",                 // Animation trigger type
      duration: 800,                     // Duration in milliseconds
      delay: 0,                          // Delay in milliseconds
      direction: "normal",               // Animation direction
      fillMode: "forwards",              // Fill mode behavior
      playState: "running",              // Play state
      keyframes: "none",                 // Custom keyframes (usually "none")
      curve: "ease-out",                 // Timing function
      iterations: 1,                     // Number of iterations
    },
  },
  // ... other animations
};
```

### Key Properties

#### `type` (string)
- Must match the component name in camelCase
- Used to look up the corresponding React component in `AnimationComponents` registry
- Example: `"depthSlideDown"` maps to `DepthSlideDown` component

#### `css.customCss`
- Defines the **initial state** of the animation
- The `transform` property represents the starting position/scale/rotation
- The `opacity` property defines initial visibility
- These values are what the element looks like **before** the animation plays

#### `settings`
- Controls animation behavior and timing
- `trigger`: When the animation should start
  - `"normal"`: Starts automatically after delay
  - `"onhover"`: Starts on mouse hover
  - `"onView"`: Starts when element enters viewport
  - `"scroll"`: Starts on scroll (legacy, use onView instead)
  - `"click"`: Starts on click
  - `"manual"`: Manual trigger control

## 2. Component Implementation

**Location**: `src/drafting/animation/[AnimationName].tsx`

Each animation has its own React component file. Example: `DepthSlideDown.tsx`

### Component Structure

```typescript
import React, { useEffect, useMemo } from "react";
import { 
  useAnimationTrigger, 
  computeAnimationDelayMs, 
  computeAnimationDurationMs, 
  computeAnimationIterationCount, 
  computeAnimationTimingFunction 
} from ".";
import type { AnimationCss, AnimationSettings } from ".";

type Props = { 
  css?: AnimationCss; 
  settings?: AnimationSettings; 
  children?: React.ReactNode 
};

export default function DepthSlideDown({ css, settings, children }: Props) {
  // 1. Handle animation triggers (normal, onhover, onView, etc.)
  const { isActive, containerRef, eventHandlers } = useAnimationTrigger(settings);

  // 2. Inject CSS keyframes into document head
  useEffect(() => {
    const id = "@kf-depth-slide-down";
    if (document.getElementById(id)) return; // Avoid duplicates
    
    const styleEl = document.createElement("style");
    styleEl.id = id;
    styleEl.textContent = `@keyframes depth-slide-down{
      0%{
        transform:translateY(-24px) translateZ(-120px) scale(.96);
        opacity:0
      }
      100%{
        transform:none;
        opacity:1
      }
    }`;
    document.head.appendChild(styleEl);
  }, []);

  // 3. Compute CSS classes
  const className = useMemo(() => {
    const parts: string[] = [];
    const tail = (css?.tailwind?.global || "").trim();
    if (tail) parts.push(tail);
    const add = css?.customCss?.additionalClasses;
    if (typeof add === "string" && add.trim()) parts.push(add.trim());
    if (Array.isArray(add)) 
      add.forEach((c) => typeof c === "string" && c.trim() && parts.push(c.trim()));
    return parts.join(" ");
  }, [css]);

  // 4. Compute inline styles with animation properties
  const style: React.CSSProperties = useMemo(() => {
    const iterations = computeAnimationIterationCount(settings?.iterations);
    return {
      animationName: isActive ? "depth-slide-down" : undefined,
      animationDuration: computeAnimationDurationMs(settings?.duration ?? 800),
      animationTimingFunction: computeAnimationTimingFunction(settings?.curve || "ease-out"),
      animationDelay: computeAnimationDelayMs(settings?.delay ?? 0),
      animationFillMode: settings?.fillMode || "forwards",
      animationDirection: settings?.direction || "normal",
      animationPlayState: settings?.playState || "running",
      animationIterationCount: iterations,
      ...(css?.customCss?.style || {}),
    };
  }, [css, isActive, settings]);

  // 5. Render wrapper div with animation
  return (
    <div ref={containerRef} className={className} style={style} {...eventHandlers}>
      {children}
    </div>
  );
}
```

### Component Responsibilities

1. **Keyframe Injection**: Dynamically injects CSS `@keyframes` into the document head
2. **Trigger Handling**: Uses `useAnimationTrigger` hook to manage animation activation
3. **Style Computation**: Combines CSS classes and inline styles from configuration
4. **Wrapper Rendering**: Wraps children in a div with animation properties

### Keyframe Naming Convention

- CSS keyframe name: `"depth-slide-down"` (kebab-case)
- Component name: `DepthSlideDown` (PascalCase)
- Registry key: `"depthSlideDown"` (camelCase)
- Style element ID: `"@kf-depth-slide-down"` (prefixed with `@kf-`)

## 3. Component Registration

**Location**: `src/drafting/animation/index.tsx`

All animation components must be registered in the `AnimationComponents` object:

```typescript
import DepthSlideDown from "./DepthSlideDown.tsx";
// ... other imports

export const AnimationComponents: Record<string, AnimationComponent> = {
  slideLeft: SlideLeft,
  slideRight: SlideRight,
  // ...
  depthSlideDown: DepthSlideDown,  // ← Must match the 'type' field in model data
  // ...
};
```

### Registration Rules

1. **Key must match `type` field**: The object key must exactly match the `type` value in `animationsItems`
2. **Component must be imported**: The React component must be imported at the top of the file
3. **CamelCase convention**: Use camelCase for the key (e.g., `depthSlideDown`)

## 4. Animation Wrapper Component

**Location**: `src/drafting/animation/index.tsx`

The `Animations` component is responsible for applying animations to design items:

```typescript
export default function Animations({
  animations,
  children,
}: {
  animations?: AnimationConfig | AnimationConfig[] | null | undefined;
  children: React.ReactNode;
}) {
  const list = animations
    ? (Array.isArray(animations) ? animations : [animations])
    : [];
  if (list.length === 0) return <>{children}</>;

  // Wrap children with animation components in reverse order
  const wrapped = list.reduceRight<React.ReactNode>((acc, item, idx) => {
    const key = String(item?.type || "");
    const Cmp = (AnimationComponents as any)[key] || Passthrough;
    return (
      <Cmp key={`anim-${idx}-${key}`} {...(item as any)}>
        {acc}
      </Cmp>
    );
  }, children);

  return <>{wrapped}</>;
}
```

### How It Works

1. **Normalizes input**: Converts single animation config to array
2. **Reverse wrapping**: Uses `reduceRight` to wrap from inner to outer
3. **Component lookup**: Finds animation component by `type` key
4. **Passthrough fallback**: If component not found, uses `Passthrough` (renders children as-is)
5. **Props spreading**: Spreads entire animation config as props to component

### Multiple Animations

When multiple animations are provided, they are nested:
```tsx
<Animations animations={[anim1, anim2, anim3]}>
  <Child />
</Animations>
// Renders as:
<Anim1>
  <Anim2>
    <Anim3>
      <Child />
    </Anim3>
  </Anim2>
</Anim1>
```

## 5. Usage in Design Items

**Location**: Various painter and layout editor files

Animations are applied to design items through the `Animations` wrapper:

```tsx
<ComposeWrappers wrappers={item?.wrapper || []}>
  <Animations animations={item?.animations || []}>
    <DesignItemRenderer item={item} />
  </Animations>
</ComposeWrappers>
```

### Data Flow

1. **Design Item** contains an `animations` array
2. **Animations array** contains animation config objects (or references to `animationsItems`)
3. **Animations wrapper** receives the array and applies each animation
4. **Animation components** wrap the design item and apply CSS animations

### Example Usage

```typescript
const designItem = {
  id: "item-1",
  animations: [
    {
      type: "depthSlideDown",
      css: { /* ... */ },
      settings: { /* ... */ }
    },
    {
      type: "fadeIn",
      css: { /* ... */ },
      settings: { /* ... */ }
    }
  ],
  // ... other item properties
};
```

## 6. Animation Trigger System

**Location**: `src/drafting/animation/index.tsx` - `useAnimationTrigger` hook

The `useAnimationTrigger` hook handles different animation trigger types:

### Trigger Types

#### `"normal"`
- Starts automatically after the specified delay
- Uses `setTimeout` to activate after delay

#### `"onhover"`
- Activates on `mouseenter`
- Deactivates on `mouseleave`
- Returns `onMouseEnter` and `onMouseLeave` handlers

#### `"onView"` / `"scroll"`
- Uses `IntersectionObserver` API
- Activates when element enters viewport
- `onView`: Toggles based on visibility (can replay)
- `scroll`: Activates once on first view

#### `"click"`
- Toggles animation state on click
- Returns `onClick` handler

#### `"manual"`
- Requires manual control via `setActive` function

### Hook Return Value

```typescript
{
  isActive: boolean;           // Whether animation should be active
  setActive: (v: boolean) => void;  // Manual control function
  containerRef: React.RefObject<HTMLDivElement>;  // Ref for IntersectionObserver
  eventHandlers: {             // Event handlers for triggers
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onClick?: () => void;
  };
}
```

## 7. Adding a New Animation

To add a new animation to the system:

### Step 1: Define in Model Data

Add entry to `src/drafting/modelData/index.ts`:

```typescript
export const animationsItems = {
  // ... existing animations
  myNewAnimation: {
    type: "myNewAnimation",
    css: {
      tailwind: { global: "" },
      customCss: {
        transform: "translateX(-100px)",  // Initial state
        opacity: 0,
        additionalClasses: " ",
      },
    },
    settings: {
      trigger: "normal",
      duration: 1000,
      delay: 0,
      direction: "normal",
      fillMode: "forwards",
      playState: "running",
      keyframes: "none",
      curve: "ease-out",
      iterations: 1,
    },
  },
};
```

### Step 2: Create Component

Create `src/drafting/animation/MyNewAnimation.tsx`:

```typescript
import React, { useEffect, useMemo } from "react";
import { useAnimationTrigger, computeAnimationDelayMs, computeAnimationDurationMs, computeAnimationIterationCount, computeAnimationTimingFunction } from ".";
import type { AnimationCss, AnimationSettings } from ".";

type Props = { css?: AnimationCss; settings?: AnimationSettings; children?: React.ReactNode };

export default function MyNewAnimation({ css, settings, children }: Props) {
  const { isActive, containerRef, eventHandlers } = useAnimationTrigger(settings);

  useEffect(() => {
    const id = "@kf-my-new-animation";
    if (document.getElementById(id)) return;
    const styleEl = document.createElement("style");
    styleEl.id = id;
    styleEl.textContent = `@keyframes my-new-animation{
      0%{transform:translateX(-100px);opacity:0}
      100%{transform:none;opacity:1}
    }`;
    document.head.appendChild(styleEl);
  }, []);

  const className = useMemo(() => {
    const parts: string[] = [];
    const tail = (css?.tailwind?.global || "").trim();
    if (tail) parts.push(tail);
    const add = css?.customCss?.additionalClasses;
    if (typeof add === "string" && add.trim()) parts.push(add.trim());
    if (Array.isArray(add)) add.forEach((c) => typeof c === "string" && c.trim() && parts.push(c.trim()));
    return parts.join(" ");
  }, [css]);

  const style: React.CSSProperties = useMemo(() => {
    const iterations = computeAnimationIterationCount(settings?.iterations);
    return {
      animationName: isActive ? "my-new-animation" : undefined,
      animationDuration: computeAnimationDurationMs(settings?.duration ?? 1000),
      animationTimingFunction: computeAnimationTimingFunction(settings?.curve || "ease-out"),
      animationDelay: computeAnimationDelayMs(settings?.delay ?? 0),
      animationFillMode: settings?.fillMode || "forwards",
      animationDirection: settings?.direction || "normal",
      animationPlayState: settings?.playState || "running",
      animationIterationCount: iterations,
      ...(css?.customCss?.style || {}),
    };
  }, [css, isActive, settings]);

  return (
    <div ref={containerRef} className={className} style={style} {...eventHandlers}>
      {children}
    </div>
  );
}
```

### Step 3: Register Component

Add to `src/drafting/animation/index.tsx`:

```typescript
import MyNewAnimation from "./MyNewAnimation.tsx";
// ... other imports

export const AnimationComponents: Record<string, AnimationComponent> = {
  // ... existing components
  myNewAnimation: MyNewAnimation,  // Key must match 'type' in model data
};
```

### Step 4: Use in Design Items

The animation can now be used in any design item:

```typescript
const item = {
  animations: [
    {
      type: "myNewAnimation",
      // ... config will be used from animationsItems or can be overridden
    }
  ]
};
```

## 8. Animation Utilities

**Location**: `src/drafting/animation/index.tsx`

Utility functions for computing CSS animation values:

### `computeAnimationIterationCount`
Converts animation iteration settings to valid CSS value:
- `undefined` or `null` → `1`
- `"infinite"` → `"infinite"`
- Number → Validated number (must be > 0)

### `computeAnimationTimingFunction`
Returns timing function string:
- Defaults to `"ease-in-out"` if undefined
- Accepts custom cubic-bezier values

### `computeAnimationDurationMs`
Converts duration to CSS string:
- Formats as `"${duration}ms"`
- Defaults to `"1000ms"` if undefined

### `computeAnimationDelayMs`
Converts delay to CSS string:
- Formats as `"${delay}ms"`
- Defaults to `"0ms"` if undefined

## 9. Type Definitions

### `AnimationSettings`
```typescript
export type AnimationSettings = {
  trigger?: "normal" | "onhover" | "scroll" | "click" | "manual" | "onView";
  duration?: number;
  delay?: number;
  direction?: React.CSSProperties["animationDirection"] | "normal";
  fillMode?: React.CSSProperties["animationFillMode"] | "forwards";
  playState?: React.CSSProperties["animationPlayState"] | "running";
  keyframes?: string | "none";
  curve?: string;
  iterations?: number | "infinite";
  beginValue?: number;
  endValue?: number;
  reverse?: boolean;
};
```

### `AnimationCss`
```typescript
export type AnimationCss = {
  tailwind?: { global?: string };
  customCss?: {
    transform?: string;
    opacity?: number;
    additionalClasses?: string | string[];
    style?: React.CSSProperties;
  };
};
```

### `AnimationConfig`
```typescript
export type AnimationConfig = {
  type: string;
  css?: AnimationCss;
  settings?: AnimationSettings;
  [key: string]: any;
};
```

## 10. Best Practices

### Naming Conventions
- **Model data key**: camelCase (e.g., `depthSlideDown`)
- **Component file**: PascalCase (e.g., `DepthSlideDown.tsx`)
- **CSS keyframes**: kebab-case (e.g., `depth-slide-down`)
- **Style element ID**: `@kf-` prefix + kebab-case (e.g., `@kf-depth-slide-down`)

### Performance
- Keyframes are injected once per page load (checked via `getElementById`)
- Use `useMemo` for computed values (className, style)
- Avoid heavy computations in animation components

### Keyframe Definitions
- Always define `0%` (initial) and `100%` (final) states
- Match initial state with `css.customCss` values from model data
- Keep keyframe definitions inline for simplicity

### Component Structure
- Always use `useAnimationTrigger` for trigger handling
- Always inject keyframes in `useEffect`
- Always compute className and style with `useMemo`
- Always spread `eventHandlers` on wrapper div

## 11. Common Patterns

### Pattern: Multiple Transforms
```typescript
transform: "translateY(-24px) translateZ(-120px) scale(.96)"
// Apply transforms in order: translate → translateZ → scale
```

### Pattern: Opacity + Transform
```typescript
css: {
  customCss: {
    transform: "translateX(-100px)",
    opacity: 0,  // Start invisible
  }
}
// Animation fades in while moving
```

### Pattern: Custom Timing Functions
```typescript
settings: {
  curve: "cubic-bezier(0.2, 0.8, 0.2, 1)"  // Custom easing
}
```

### Pattern: Staggered Animations
Use `staggerChildren` animation type for child element staggering, or implement custom delay logic in component.

## 12. Debugging

### Animation Not Appearing
1. Check `type` matches between model data and registry
2. Verify component is imported and registered
3. Check `isActive` state in component
4. Inspect DOM for keyframe styles
5. Verify animation properties in computed styles

### Animation Not Triggering
1. Check `trigger` type setting
2. Verify `useAnimationTrigger` return values
3. For `onView`: Check IntersectionObserver threshold
4. For `onhover`: Verify event handlers are attached

### Keyframe Issues
1. Verify keyframe name matches `animationName`
2. Check style element is in document head
3. Verify keyframe syntax is valid CSS
4. Check for duplicate keyframe definitions

## Summary

The animation system provides a flexible, type-safe way to add animations to design items:

1. **Define** animations in `animationsItems` with type, CSS, and settings
2. **Implement** React components that inject keyframes and apply styles
3. **Register** components in `AnimationComponents` object
4. **Apply** via `Animations` wrapper component in design item renderers
5. **Control** via trigger system (normal, onhover, onView, click, manual)

This architecture allows for:
- ✅ Type-safe animation configurations
- ✅ Reusable animation components
- ✅ Multiple animations per item
- ✅ Flexible trigger mechanisms
- ✅ Easy addition of new animations
