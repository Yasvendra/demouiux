# About Data Structure Documentation

## Overview

This document describes the standardized data structure for all About section components in the `src/drafting/modelData/about.ts` file.

## Standard Structure Format

Every About section object in `about.ts` must follow this exact structure:

```typescript
export const componentName = {
  id: "ComponentName",
  data: {
    // Component-specific data
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
      // Tailwind CSS classes
    },
    antd: {},
    mui: {},
    customCss: {},
  },
  settings: {
    type: "About",
    animations: { fadeIn: true, slideIn: true },
    interactions: { hover: true },
  },
  checkboxes: {
    // Visibility toggles (at minimum must include these three)
    isReverse: false,
    isPostCellVisible: true,
    isListVisible: true,
    // Additional component-specific checkboxes
  },
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
  wrapper: [],
    animations: [],
  hints:{}
};
```

## Required Components

### 1. Top-Level Properties

Every object must have these properties in order:

#### `id` (string)
- Unique identifier for the component
- Format: PascalCase matching the component name
- Example: `"ComponentName"`

#### `data` (object)
- Contains all component-specific data
- Structure varies by component type
- Examples: text content, images, buttons, statistics, etc.

#### `css` (object)
- Container for all CSS styling
- Must include four child properties:
  - `tailwind`: Object with Tailwind CSS classes
  - `antd`: Object (usually empty)
  - `mui`: Object (usually empty)
  - `customCss`: Object (usually empty)

#### `settings` (object)
- Configuration and behavior settings
- Must include:
  - `type`: Usually `"About"` or specific type
  - `animations`: Object with animation flags
  - `interactions`: Object with interaction flags

#### `checkboxes` (object)
- Visibility controls for all UI elements
- **MUST** include these three properties at minimum:
  - `isReverse: false`
  - `isPostCellVisible: true`
  - `isListVisible: true`
- Additional checkboxes are component-specific

#### `list` (object)
- Standardized structure for list handling
- **MUST** follow this exact format:
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
  }
  ```

#### `wrapper` (array)
- Empty array by default
- Used for wrapper configurations if needed
- **MUST** be present as: `wrapper: []`

#### `animations` (array)
- Empty array by default
- Used for animation configurations if needed
- **MUST** be present as: `animations: []`

## Component-Specific Data Structures

While the outer structure is standardized, the `data` object varies based on component type. Common patterns:

### Hero Sections
```typescript
data: {
  badge?: string,
  title: string,
  titleHighlight?: string,
  subtitle?: string,
  description?: string,
  image?: string,
  button?: { text: string, link: string }
}
```

### Services Sections
```typescript
data: {
  title: string,
  subtitle?: string,
  services: Array<{
    title: string,
    description?: string,
    image?: string,
    link?: string
  }>
}
```

### Statistics Sections
```typescript
data: {
  title?: string,
  subtitle?: string,
  statistics: Array<{
    count: string,
    label: string,
    icon?: string
  }>
}
```

### Features Sections
```typescript
data: {
  title: string,
  subtitle?: string,
  features: Array<{
    icon?: string,
    title: string,
    description?: string
  }>
}
```

## Examples

### Example 1: Simple About Section
```typescript
export const aboutModern = {
  id: "AboutModern",
  data: {
    header: {
      title: "TransMax Logistics",
      titleHighlight: "Around the World",
      subtitle: "Transmax is the world's driving worldwide coordinations supplier...",
      description: "Our value added services ensure..."
    },
    images: {
      main: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop",
      overlay: "https://images.pexels.com/photos/28468468/pexels-photo-28468468.jpeg"
    },
    statistics: {
      count: "15,350+",
      label: "Clients Worldwide"
    },
    cta: {
      primary: {
        text: "More About Us",
        link: "/about"
      }
    }
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
      global: "min-h-screen bg-white",
      container: "container mx-auto px-6 py-16",
      // ... more styles
    },
    antd: {},
    mui: {},
    customCss: {},
  },
  settings: {
    type: "About",
    animations: { fadeIn: true, slideIn: true },
    interactions: { hover: true },
  },
  checkboxes: {
    isVisibleTitle: true,
    isVisibleSubtitle: true,
    isVisibleDescription: true,
    isVisibleImages: true,
    isVisibleStatistics: true,
    isVisibleCTA: true,
    isVisibleOverlayImage: true,
    isReverse: false,
    isPostCellVisible: true,
    isListVisible: true,
  },
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
  wrapper: [],
    animations: [],
  hints:{}
};
```

### Example 2: Complex Services Section
```typescript
export const interiorDesign = {
  id: "InteriorDesign",
  data: {
    introduction: {
      leftImage: {
        src: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7",
        alt: "Modern living room"
      },
      centerContent: {
        title: "Creating Beautiful, Functional Spaces",
        description: "At Danielle Allen Interiors, we transform your home..."
      },
      rightImage: {
        src: "https://images.unsplash.com/photo-1505693314120-0d443867891c",
        alt: "Cozy living room"
      }
    },
    services: {
      title: "Our Services",
      items: [
        {
          title: "Virtual Design (Photoshop Full Room Design)",
          image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7",
          link: "/virtual-design-photoshop"
        }
        // ... more items
      ],
      button: {
        text: "LEARN MORE",
        link: "/learn-more-services"
      }
    },
    recentProject: {
      backgroundImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2",
      button: {
        text: "VIEW OUR RECENT PROJECT",
        link: "/recent-project"
      }
    }
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
      global: "min-h-screen bg-white",
      introductionSection: "py-16 md:py-24 bg-white",
      // ... more styles
    },
    antd: {},
    mui: {},
    customCss: {},
  },
  settings: {
    type: "About",
    animations: { fadeIn: true, slideIn: true },
    interactions: { hover: true },
  },
  checkboxes: {
    isVisibleIntroduction: true,
    isVisibleLeftImage: true,
    isVisibleCenterContent: true,
    isVisibleTitle: true,
    isVisibleDescription: true,
    isVisibleRightImage: true,
    isVisibleServices: true,
    isVisibleServicesTitle: true,
    isVisibleServiceItems: true,
    isVisibleServicesCTA: true,
    isVisibleRecentProject: true,
    isReverse: false,
    isPostCellVisible: true,
    isListVisible: true,
  },
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
  wrapper: [],
    animations: [],
  hints:{}
};
```

## Common Mistakes and Fixes

### ❌ Wrong: Missing Required Checkbox Properties
```typescript
checkboxes: {
  isVisibleTitle: true,
  isVisibleDescription: true,
  // Missing isReverse, isPostCellVisible, isListVisible
}
```

### ✅ Correct: All Required Properties Present
```typescript
checkboxes: {
  isVisibleTitle: true,
  isVisibleDescription: true,
  isReverse: false,
  isPostCellVisible: true,
  isListVisible: true,
}
```

### ❌ Wrong: Custom List Structure
```typescript
list: {
  type: "custom-type",
  settings: {
    layout: "split",
    contentPosition: "right"
  }
}
```

### ✅ Correct: Standard List Structure
```typescript
list: {
  type: "row",
  settings: {},
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
      global: "",
      item: "",
    },
  },
  items: [],
}
```

### ❌ Wrong: Missing Wrapper/Animations
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
  }
};
```

### ✅ Correct: Complete Structure
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
  wrapper: [],
    animations: [],
  hints:{}
};
```

## Validation Checklist

When creating or modifying an About section object, verify:

- [ ] `id` is present and unique
- [ ] `data` object contains component-specific data
- [ ] `css` object has `tailwind`, `antd`, `mui`, and `customCss` properties
- [ ] `settings` object includes `type`, `animations`, and `interactions`
- [ ] `checkboxes` includes `isReverse: false`, `isPostCellVisible: true`, `isListVisible: true`
- [ ] `list` follows standard structure with `type: "row"`, `settings: {}`, `css.tailwind.global: ""`, `css.tailwind.item: ""`, `items: []`
- [ ] `wrapper: []` is present
- [ ] `animations: []` is present
- [ ] No linter errors

## File Location

All About section objects are defined in:
```
src/drafting/modelData/about.ts
```

## Current Count

The file currently contains **53 exported objects**, all following the standardized structure documented above.

## Related Files

- `src/drafting/painter/about/` - Component renderers for About sections
- `src/drafting/modelData/index.ts` - Export registration for models
- `src/drafting/drafting.tsx` - Routing and path mappings

## Notes

- The standardized structure ensures consistency across all About components
- Component-specific customization happens within the `data` object
- The `checkboxes` object controls visibility of all UI elements
- The `list`, `wrapper`, and `animations` properties provide extensibility while maintaining structure

