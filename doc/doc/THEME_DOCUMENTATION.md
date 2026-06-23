# Theme System Documentation

## Overview

This application implements a professional dark/light theme system using Redux for state management, with TypeScript support and Material-UI integration. The theme system is designed to be scalable, maintainable, and user-friendly.

## Features

- 🌙 **Dark/Light Theme Toggle**: Seamless switching between themes
- 🖥️ **System Preference Detection**: Automatically detects and follows system theme preference
- 💾 **Persistent Storage**: Theme preferences are saved in localStorage and Redux persist
- 🎨 **Smooth Transitions**: CSS transitions for smooth theme switching
- 📱 **Mobile Optimized**: Theme-aware meta tags for mobile browsers
- 🎯 **TypeScript Support**: Full type safety throughout the theme system
- 🔧 **Customizable**: Easy to extend with additional themes or custom colors

## Architecture

### 1. Redux Store Structure

```typescript
// Theme state structure
interface ThemeState {
  mode: 'light' | 'dark';
  systemPreference: boolean;
}
```

### 2. Core Files

- `src/redux/slices/themeSlice.ts` - Redux slice for theme state management
- `src/hooks/useTheme.ts` - Main theme hook with all theme functionality
- `src/hooks/useThemeContext.ts` - Extended theme hook with utility classes
- `src/components/ThemeToggle.tsx` - Theme toggle component with dropdown menu
- `src/components/ThemeProvider.tsx` - Theme provider for initialization
- `tailwind.config.js` - Tailwind configuration with theme colors
- `src/index.css` - Global CSS with theme variables and transitions

## Usage

### Basic Theme Hook

```typescript
import { useTheme } from '../hooks/useTheme';

const MyComponent = () => {
  const { 
    mode,           // 'light' | 'dark'
    isDark,         // boolean
    isLight,        // boolean
    toggle,         // function to toggle theme
    setLight,       // function to set light theme
    setDark,        // function to set dark theme
    systemPreference, // boolean
    enableSystemPreference,  // function
    disableSystemPreference  // function
  } = useTheme();

  return (
    <div className={isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}>
      Current theme: {mode}
      <button onClick={toggle}>Toggle Theme</button>
    </div>
  );
};
```

### Extended Theme Hook

```typescript
import { useThemeContext } from '../hooks/useThemeContext';

const MyComponent = () => {
  const { colors, classes } = useThemeContext();

  return (
    <div className={`${colors.background} ${colors.text}`}>
      <div className={classes.card}>
        <h1 className={colors.text}>Title</h1>
        <p className={colors.textSecondary}>Description</p>
        <button className={classes.button}>Click me</button>
      </div>
    </div>
  );
};
```

### Theme Toggle Component

```typescript
import ThemeToggle from '../components/ThemeToggle';

const Header = () => {
  return (
    <header>
      <nav>
        {/* Your navigation content */}
        <ThemeToggle />
      </nav>
    </header>
  );
};
```

## Theme Colors

### Light Theme Colors
- Primary: `#1976d2`
- Secondary: `#dc004e`
- Background: `#ffffff`
- Surface: `#f8f9fa`
- Text Primary: `#212121`
- Text Secondary: `#757575`
- Border: `#e0e0e0`

### Dark Theme Colors
- Primary: `#90caf9`
- Secondary: `#f48fb1`
- Background: `#121212`
- Surface: `#1e1e1e`
- Text Primary: `#ffffff`
- Text Secondary: `#b3b3b3`
- Border: `#333333`

## CSS Classes

### Utility Classes
- `.theme-card` - Card styling with theme-aware colors
- `.theme-button` - Button styling with hover effects
- `.theme-input` - Input styling with theme colors
- `.theme-text` - Primary text color
- `.theme-text-secondary` - Secondary text color

### Tailwind Classes
- `dark:` prefix for dark theme specific styles
- `transition-colors duration-200` for smooth transitions

## Customization

### Adding New Themes

1. Update the `ThemeMode` type in `themeSlice.ts`:
```typescript
export type ThemeMode = 'light' | 'dark' | 'custom';
```

2. Add theme colors to `tailwind.config.js`:
```javascript
extend: {
  colors: {
    custom: {
      primary: '#your-color',
      // ... other colors
    }
  }
}
```

3. Update CSS variables in `index.css`:
```css
.custom {
  --color-primary: #your-color;
  /* ... other variables */
}
```

### Custom Theme Toggle

Create a custom theme toggle component by extending the existing one:

```typescript
const CustomThemeToggle = () => {
  const { mode, toggle } = useTheme();
  
  return (
    <button 
      onClick={toggle}
      className="custom-theme-toggle"
    >
      {mode === 'dark' ? '🌙' : '☀️'}
    </button>
  );
};
```

## Best Practices

1. **Always use the theme hook**: Don't hardcode colors, use the theme system
2. **Use CSS variables**: Leverage CSS custom properties for consistent theming
3. **Test both themes**: Ensure your components look good in both light and dark modes
4. **Smooth transitions**: Add transition classes for better UX
5. **Accessibility**: Ensure sufficient contrast ratios in both themes
6. **Mobile optimization**: Test theme switching on mobile devices

## Troubleshooting

### Theme not persisting
- Check if Redux persist is properly configured
- Verify localStorage is available in your environment
- Ensure theme slice is included in persist whitelist

### Theme not applying
- Check if ThemeProvider is wrapping your app
- Verify CSS classes are being applied to document root
- Ensure Tailwind dark mode is set to 'class'

### Performance issues
- Use `useMemo` for expensive theme calculations
- Avoid inline styles, prefer CSS classes
- Consider code splitting for theme-specific components

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support with meta theme-color

## Future Enhancements

- [ ] High contrast theme
- [ ] Custom color schemes
- [ ] Theme presets
- [ ] Animation preferences
- [ ] Reduced motion support
- [ ] Theme export/import functionality 