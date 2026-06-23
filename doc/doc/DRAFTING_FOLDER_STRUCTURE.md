# Drafting Module Folder Structure Documentation

## Overview

The `drafting` module is the core visual design and layout system of the application. It provides a comprehensive architecture for creating, editing, and rendering design components through a structured data-driven approach.

**Location:** `/src/drafting`

**Purpose:** 
- Visual page/component builder and editor
- Design system with reusable components
- Data-driven rendering system
- Layout management and responsive design tools

---

## Table of Contents

1. [Directory Structure](#directory-structure)
2. [Core Files](#core-files)
3. [Module Breakdown](#module-breakdown)
4. [Architecture Patterns](#architecture-patterns)
5. [Naming Conventions](#naming-conventions)
6. [File Organization Guidelines](#file-organization-guidelines)
7. [Import/Export Patterns](#importexport-patterns)
8. [Component Relationships](#component-relationships)
9. [Best Practices](#best-practices)
10. [Maintenance Guidelines](#maintenance-guidelines)

---

## Directory Structure

```
src/drafting/
├── drafting.tsx                 # Main drafting editor component
├── Preview.tsx                  # Preview component for designs
├── PathPostCellDetailsPanel.tsx # Path and cell details sidebar panel
├── index.ts                     # Public API exports
│
├── animation/                   # Animation components library
│   ├── index.tsx               # Animation exports registry
│   └── [140+ animation files]  # Individual animation components
│
├── layoutEditor/               # Layout editing utilities
│   ├── DesignItemSettingsSidebar.tsx
│   ├── FileStructureSidebar.tsx
│   ├── fileStructure.json
│   ├── htmlPreviewRenderer.tsx
│   ├── responsiveChecker.tsx
│   ├── reuseAbleCellLink.tsx
│   ├── verticalTagging.tsx
│   └── viewCellLink.tsx
│
├── list/                       # List rendering components
│   ├── index.tsx              # List exports and main component
│   ├── componentsMap.ts       # List component registry
│   ├── resolveItems.tsx       # Item resolution utilities
│   └── [103 list variant files] # Various list layout components
│
├── modelData/                  # Data model definitions
│   ├── index.ts               # Model data exports registry
│   └── [30 widget type files] # Widget-specific data models
│       ├── about.ts
│       ├── hero.ts
│       ├── feature.ts
│       ├── cta.ts
│       └── ... (other widget types)
│
├── painter/                    # Component renderers (painters)
│   ├── DesignItemRenderer.tsx # Main renderer orchestrator
│   ├── utils/                 # Painter utilities
│   └── [widget-type folders]/ # Organized by widget category
│       ├── about/            # About section painters
│       ├── hero/             # Hero section painters
│       ├── feature/          # Feature section painters
│       ├── cta/              # Call-to-action painters
│       ├── footer/           # Footer painters
│       ├── header/           # Header painters
│       ├── navigation/       # Navigation painters
│       ├── stats/            # Statistics painters
│       ├── testimonial/      # Testimonial painters
│       ├── team/             # Team section painters
│       └── ... (other widget categories)
│
├── utils/                      # Shared utility functions
│   ├── mapFileTreePathToModelKey.ts
│   ├── navigation.ts
│   ├── safeAccess.ts
│   └── tailwindHelpers.ts
│
└── wrapper/                    # Wrapper components library
    ├── index.tsx              # Wrapper exports and composer
    └── [73 wrapper files]     # Individual wrapper components
```

---

## Core Files

### `drafting.tsx`
**Purpose:** Main drafting editor interface component

**Responsibilities:**
- Three-panel layout (file structure sidebar, main content, settings sidebar)
- Resizable sidebar management
- Path selection and routing
- Theme integration (dark/light mode)

**Key Exports:**
- Default export: Main `Drafting` component

**Dependencies:**
- `PathPostCellDetailsPanel` - Right details panel
- `FileStructureSidebar` - Left file tree
- `DesignItemSettingsSidebar` - Right settings panel
- Theme hooks

---

### `Preview.tsx`
**Purpose:** Preview component for rendered designs

**Responsibilities:**
- Render preview of design components
- Handle preview-specific interactions
- Display responsive preview states

---

### `PathPostCellDetailsPanel.tsx`
**Purpose:** Details panel showing path and cell information

**Responsibilities:**
- Display selected path details
- Show cell/post information
- Edit path-related settings
- Map file tree paths to model keys

**Size:** ~1860 lines (maintains complex state and UI logic)

---

### `index.ts`
**Purpose:** Public API for the drafting module

**Current Exports:**
```typescript
export { default as Drafting } from './drafting';
export { default as FileStructureSidebar } from './layoutEditor/FileStructureSidebar';
export { default as PathDetailsPanel } from './PathPostCellDetailsPanel';
export { default as ListOfItems, RowList, ColumnList, GridList, StackList, AutoRowScroll } from './list';
export type { ListType, ListOfItemsProps } from './list';
```

**Guidelines:**
- Only export what's needed by external consumers
- Maintain clear public API surface
- Include TypeScript types for exported components

---

## Module Breakdown

### 1. `animation/` - Animation Components Library

**Purpose:** Reusable animation components for UI elements

**Structure:**
- Single file per animation type
- Centralized export via `index.tsx`
- ~140+ animation variants

**Naming Pattern:**
- PascalCase: `FadeIn.tsx`, `SlideLeft.tsx`, `ZoomIn.tsx`
- Descriptive action names
- Animation type suffixes when needed

**Examples:**
- Basic: `FadeIn`, `SlideLeft`, `ZoomIn`
- Advanced: `PerspectiveFlipX`, `ParallaxLift`, `LiquidSwipeIn`
- Interactive: `CardHoverLift`, `TiltParallaxHover`, `MagneticPop`

**Usage Pattern:**
Animations are applied via the `animations` array in model data or through wrapper components.

---

### 2. `layoutEditor/` - Layout Editing Tools

**Purpose:** Utilities and components for layout editing functionality

**Key Components:**

#### `FileStructureSidebar.tsx`
- Displays hierarchical file structure
- Handles path selection
- Resizable sidebar with width management

#### `DesignItemSettingsSidebar.tsx`
- Settings panel for design items
- Property editors
- Configuration UI

#### `htmlPreviewRenderer.tsx`
- Renders HTML previews
- Preview generation utilities

#### `responsiveChecker.tsx`
- Responsive design validation
- Breakpoint checking utilities

#### `fileStructure.json`
- File structure configuration
- Hierarchy definitions

**Guidelines:**
- Keep layout editor components isolated from painter logic
- Maintain clear separation between editing and rendering

---

### 3. `list/` - List Rendering Components

**Purpose:** Flexible list layout components with various display patterns

**Structure:**
- `index.tsx` - Main `ListOfItems` component and exports
- `componentsMap.ts` - Registry mapping list types to components
- `resolveItems.tsx` - Item resolution and normalization logic
- 103+ list variant components

**Naming Patterns:**
- Suffix: `List.tsx` (e.g., `GridList.tsx`, `RowList.tsx`)
- Descriptive prefixes: `MasonryList`, `CarouselList`, `TimelineList`
- Pattern-based: `FibonacciTilingGridList`, `GoldenRatioGridList`

**List Types:**
- Basic layouts: `RowList`, `ColumnList`, `GridList`, `StackList`
- Advanced layouts: `MasonryList`, `BentoGridList`, `IsometricGridList`
- Interactive: `CarouselList`, `CubeFlipCarouselList`, `LiquidSwipeRowList`
- Specialized: `TimelineList`, `StepperList`, `TagsCloudList`

**Registration Pattern:**
List components must be registered in `componentsMap.ts` to be available.

---

### 4. `modelData/` - Data Model Definitions

**Purpose:** Standardized data structures for all widget types

**Structure:**
- One file per widget category (e.g., `about.ts`, `hero.ts`)
- Central `index.ts` for exports
- ~30 widget type files

**Standard Data Structure:**
See `WIDGET_DATA_STRUCTURE.md` for complete structure documentation.

**Required Structure:**
```typescript
{
  id: string;
  data: object;              // Widget-specific data
  css: {
    tailwind: object;
    antd: object;
    mui: object;
    customCss: object;
  };
  settings: {
    type: string;
    animations: object;
    interactions: object;
  };
  checkboxes: {
    isReverse: boolean;
    isPostCellVisible: boolean;
    isListVisible: boolean;
    // ... widget-specific checkboxes
  };
  list: {
    type: string;
    settings: object;
    css: { tailwind: { global: string; item: string } };
    items: array;
  };
  wrapper: array;
  animations: array;
}
```

**Naming Convention:**
- File names: camelCase matching widget type (`about.ts`, `hero.ts`)
- Export names: camelCase descriptive names (`aboutModern`, `heroGradient`)

**Guidelines:**
- Follow standardized structure strictly
- All models must include required checkboxes
- Maintain consistency across widget types

---

### 5. `painter/` - Component Renderers

**Purpose:** React components that render widgets based on model data

**Structure:**
```
painter/
├── DesignItemRenderer.tsx    # Main renderer orchestrator
├── utils/                     # Painter-specific utilities
└── [widget-type]/            # One folder per widget category
    ├── index.ts              # Category exports
    └── [component files]     # Individual painter components
```

**Naming Pattern:**
- Files: `[widgetName]Painter.tsx` (e.g., `aboutModernPainter.tsx`)
- Folders: Match widget category names from `modelData/`
- Exports: Match file names (camelCase)

**Organization:**
- Group related painters in category folders
- One painter per design variant
- Category-level `index.ts` for exports

**Examples:**
```
painter/
├── hero/
│   ├── heroGradientPainter.tsx
│   ├── heroSplitPainter.tsx
│   └── index.ts
├── feature/
│   ├── featureGridPainter.tsx
│   ├── featureListPainter.tsx
│   └── index.ts
└── about/
    ├── aboutModernPainter.tsx
    ├── aboutClassicPainter.tsx
    └── index.ts
```

**Painter Component Pattern:**
```typescript
// Receive model data as props
const AboutModernPainter = ({ data, css, settings, checkboxes }: ModelData) => {
  // Render component based on data
  return (
    <div className={css.tailwind.global}>
      {/* Component structure */}
    </div>
  );
};
```

**Key Principles:**
1. Painters are pure renderers - no business logic
2. Data comes from model data structure
3. Use checkboxes for conditional rendering
4. Apply CSS from model data
5. Support wrapper and animation composition

---

### 6. `utils/` - Shared Utilities

**Purpose:** Reusable utility functions used across the drafting module

**Files:**

#### `mapFileTreePathToModelKey.ts`
- Maps file tree paths to model data keys
- Path resolution utilities

#### `navigation.ts`
- Navigation-related utilities
- Path management helpers

#### `safeAccess.ts`
- Safe object property access
- Null/undefined handling utilities

#### `tailwindHelpers.ts`
- Tailwind CSS utility functions
- Class name manipulation
- Style generation helpers

**Guidelines:**
- Keep utilities pure and stateless when possible
- Export named exports
- Include TypeScript types
- Document complex utilities

---

### 7. `wrapper/` - Wrapper Components Library

**Purpose:** Composable wrapper components for styling and effects

**Structure:**
- 73 wrapper components
- Central `index.tsx` with `WrapperComponents` registry
- `ComposeWrappers` function for composition

**Wrapper Types:**
- Layout: `Flex`, `Grid`, `Position`, `AbsoluteFill`
- Styling: `Padding`, `Margin`, `Border`, `Shadow`, `Rounded`
- Effects: `Blur`, `Opacity`, `Gradient`, `Backdrop`
- Transforms: `Rotate`, `Scale`, `Skew`, `Translate`
- Interaction: `Interactivity`, `Hover`, `Sticky`, `ScrollSnap`
- Advanced: `ClipPath`, `Mask`, `Filter`, `Perspective`

**Naming Pattern:**
- PascalCase: `Padding.tsx`, `Flex.tsx`
- Descriptive single-word names when possible
- Compound names for complex wrappers: `AbsoluteFill`, `BackdropFilter`

**Composition Pattern:**
Wrappers are composed via the `wrapper` array in model data:
```typescript
wrapper: [
  { type: 'padding', ...props },
  { type: 'flex', ...props },
  { type: 'rounded', ...props }
]
```

**Registration:**
All wrappers must be registered in `wrapper/index.tsx` `WrapperComponents` object.

---

## Architecture Patterns

### Data Flow

```
Model Data (modelData/)
    ↓
DesignItemRenderer (painter/DesignItemRenderer.tsx)
    ↓
Painter Component (painter/[widget-type]/)
    ↓
Wrapper Composition (wrapper/)
    ↓
List Rendering (list/)
    ↓
Animation Application (animation/)
    ↓
Final Rendered Output
```

### Component Resolution

1. **Path Selection** → `drafting.tsx` handles path selection
2. **Path to Model Key** → `mapFileTreePathToModelKey.ts` converts path
3. **Model Data Lookup** → Retrieve from `modelData/` registry
4. **Painter Selection** → `DesignItemRenderer.tsx` selects appropriate painter
5. **Rendering** → Painter component renders with model data
6. **Composition** → Wrappers and animations applied via composition

### Registry Pattern

Multiple registries used throughout:

1. **Animation Registry** (`animation/index.tsx`)
   - Maps animation names to components
   - Centralized animation lookup

2. **List Registry** (`list/componentsMap.ts`)
   - Maps list types to list components
   - Enables dynamic list rendering

3. **Wrapper Registry** (`wrapper/index.tsx`)
   - Maps wrapper types to wrapper components
   - Enables dynamic wrapper composition

4. **Painter Registry** (`painter/DesignItemRenderer.tsx`)
   - Maps widget types to painter components
   - Dynamic component loading

---

## Naming Conventions

### Files

| Type | Convention | Example |
|------|-----------|---------|
| Component files | PascalCase | `FadeIn.tsx` |
| Model data files | camelCase | `about.ts` |
| Utility files | camelCase | `safeAccess.ts` |
| Painter files | camelCase + "Painter" | `aboutModernPainter.tsx` |
| List files | PascalCase + "List" | `GridList.tsx` |
| Animation files | PascalCase | `SlideLeft.tsx` |

### Exports

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `FadeIn`, `GridList` |
| Models | camelCase | `aboutModern`, `heroGradient` |
| Utilities | camelCase | `mapFileTreePathToModelKey` |
| Types | PascalCase | `ListType`, `ListOfItemsProps` |

### Folders

| Type | Convention | Example |
|------|-----------|---------|
| Widget categories | camelCase | `about/`, `hero/` |
| Module folders | camelCase | `layoutEditor/`, `modelData/` |

---

## File Organization Guidelines

### 1. One Component Per File
- Each React component in its own file
- File name matches component name
- Exception: Related small components can share a file with clear separation

### 2. Index Files for Exports
- Use `index.ts` or `index.tsx` for module exports
- Centralize public API
- Re-export from individual files

**Example:**
```typescript
// animation/index.tsx
export { default as FadeIn } from './FadeIn';
export { default as SlideLeft } from './SlideLeft';
// ... more exports
```

### 3. Group Related Files
- Keep related files in folders
- Use category folders for organization
- Maintain clear hierarchy

### 4. Separate Concerns
- Keep rendering logic separate from business logic
- Utils for shared logic
- Clear module boundaries

---

## Import/Export Patterns

### Default Exports
Use for main component exports:
```typescript
// Component file
export default function FadeIn() { ... }

// Index file
export { default as FadeIn } from './FadeIn';
```

### Named Exports
Use for utilities, types, and multiple exports:
```typescript
// Utility file
export function mapFileTreePathToModelKey(path: string) { ... }

// Type exports
export type { ListType, ListOfItemsProps };
```

### Barrel Exports
Use `index.ts` files to create barrel exports:
```typescript
// modelData/index.ts
export * from './about';
export * from './hero';
export * from './feature';
```

### Import Organization
1. React and external libraries
2. Internal components
3. Utilities
4. Types
5. Relative imports (use sparingly)

**Example:**
```typescript
import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { mapFileTreePathToModelKey } from './utils/mapFileTreePathToModelKey';
import type { ModelData } from './types';
```

---

## Component Relationships

### Hierarchy

```
Drafting (drafting.tsx)
├── FileStructureSidebar (layoutEditor/)
├── PathPostCellDetailsPanel
└── DesignItemRenderer (painter/DesignItemRenderer.tsx)
    ├── Painter Components (painter/[widget-type]/)
    │   ├── Model Data (modelData/)
    │   ├── Wrappers (wrapper/)
    │   ├── Lists (list/)
    │   └── Animations (animation/)
    └── Preview (Preview.tsx)
```

### Dependencies

```
drafting.tsx
  ↓ uses
layoutEditor/ (file structure, settings)
  ↓ uses
modelData/ (data lookup)
  ↓ used by
painter/ (rendering)
  ↓ uses
wrapper/, list/, animation/ (composition)
```

---

## Best Practices

### 1. Maintain Standardized Structures
- Follow model data structure strictly
- Use required checkboxes consistently
- Maintain list/wrapper/animations structure

### 2. Component Organization
- Keep components focused and single-purpose
- Extract reusable logic to utils
- Use composition over inheritance

### 3. Type Safety
- Use TypeScript types consistently
- Export types for external use
- Avoid `any` types

### 4. Performance
- Use React.lazy for code splitting (painters)
- Memoize expensive computations
- Optimize re-renders with React.memo when appropriate

### 5. Code Style
- Follow existing naming conventions
- Maintain consistent formatting
- Document complex logic

### 6. Testing Considerations
- Keep components testable
- Separate logic from rendering
- Use pure functions when possible

---

## Maintenance Guidelines

### Adding New Widget Type

1. **Create Model Data**
   - Add file in `modelData/` (e.g., `newWidget.ts`)
   - Follow standardized structure
   - Export from `modelData/index.ts`

2. **Create Painter Folder**
   - Create folder in `painter/` (e.g., `painter/newWidget/`)
   - Add painter components
   - Create `index.ts` for exports

3. **Register in DesignItemRenderer**
   - Add mapping in `DesignItemRenderer.tsx`
   - Use lazy loading for performance

4. **Update Documentation**
   - Update this file if structure changes
   - Document widget-specific patterns

### Adding New List Type

1. **Create List Component**
   - Add file in `list/` (e.g., `NewLayoutList.tsx`)
   - Implement list component

2. **Register in componentsMap**
   - Add entry in `list/componentsMap.ts`
   - Use lowercase key

3. **Export from index**
   - Add export to `list/index.tsx` if public

### Adding New Wrapper

1. **Create Wrapper Component**
   - Add file in `wrapper/` (e.g., `NewWrapper.tsx`)
   - Implement wrapper logic

2. **Register in WrapperComponents**
   - Add entry in `wrapper/index.tsx`
   - Use lowercase key matching file name

### Adding New Animation

1. **Create Animation Component**
   - Add file in `animation/` (e.g., `NewAnimation.tsx`)
   - Implement animation logic

2. **Export from index**
   - Add export to `animation/index.tsx`

### File Size Guidelines

- **Components:** Aim for < 300 lines per file
- **Large components:** Split into sub-components
- **Utilities:** Keep focused and small
- **Model data files:** Can be larger but maintain readability

### Refactoring Guidelines

1. **Maintain API compatibility** when possible
2. **Update all references** when renaming
3. **Update documentation** with changes
4. **Test affected components** after refactoring

---

## Related Documentation

- `WIDGET_DATA_STRUCTURE.md` - Detailed model data structure
- `MODELDATA_STANDARDIZATION.md` - Data standardization guidelines
- `ABOUT_PAINTER_PATTERN.md` - Painter component patterns
- `NEW_WIDGET_ADDITION.md` - Guide for adding new widgets
- `THEME_DOCUMENTATION.md` - Theme system documentation

---

## Summary

The `drafting` module follows a clear, organized structure:

1. **Separation of Concerns**: Clear boundaries between data, rendering, and utilities
2. **Registry Pattern**: Centralized component lookup and composition
3. **Standardization**: Consistent data structures and naming conventions
4. **Scalability**: Easy to add new widgets, lists, wrappers, and animations
5. **Maintainability**: Clear organization and documentation

This structure enables:
- Rapid widget development
- Consistent design patterns
- Easy maintenance and updates
- Clear developer onboarding
- Scalable architecture

---

**Last Updated:** [Date will be maintained by development team]
**Maintained By:** Development Team
**Version:** 1.0.0

