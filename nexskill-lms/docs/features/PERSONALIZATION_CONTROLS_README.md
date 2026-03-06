# Global Personalization Controls - Implementation Guide

## 📁 Files Created

### Context
- `src/context/UiPreferencesContext.tsx` - Central state management for UI preferences

### Components
- `src/components/system/MultiLanguageSelector.tsx` - Language selection dropdown
- `src/components/system/DarkModeToggle.tsx` - Light/dark mode toggle switch
- `src/components/system/GlobalTopBarControls.tsx` - Combined controls container

### Updated Files
- `src/App.tsx` - Wrapped with UiPreferencesProvider
- `src/layouts/AdminAppLayout.tsx` - Added GlobalTopBarControls to header
- `src/layouts/StudentAppLayout.tsx` - Added GlobalTopBarControls to header
- `src/layouts/CoachAppLayout.tsx` - Added GlobalTopBarControls to header
- `tailwind.config.js` - Added fadeIn/scaleIn animations

## 🎯 Features

### Multi-Language Selector (187)
- **Languages**: English, Filipino, Spanish
- **Storage**: Persisted to localStorage as `ui-language`
- **Default**: English (en)
- **UI**: Dropdown with flag emojis and language names
- **Extensible**: Pass custom `availableLanguages` prop to add more languages

### Dark Mode Toggle (188)
- **Modes**: Light, Dark (System mode marked as TODO)
- **Storage**: Persisted to localStorage as `ui-theme`
- **Default**: Light mode
- **Implementation**: Toggles `dark` class on document.documentElement
- **UI**: Animated slider with sun/moon icons

## 🔌 Integration

### Context Provider (Already Done)
The UiPreferencesProvider is already wrapped around the entire app in App.tsx:

```tsx
<UiPreferencesProvider>
  <ErrorBoundary>
    <BrowserRouter>
      {/* All routes */}
    </BrowserRouter>
  </ErrorBoundary>
</UiPreferencesProvider>
```

### Layout Integration (Already Done)
GlobalTopBarControls are already integrated into:
- AdminAppLayout (top-right corner)
- StudentAppLayout (top-right corner)
- CoachAppLayout (top-right corner)

## 📖 Usage

### Using Context in Components

```tsx
import { useUiPreferences } from '../context/UiPreferencesContext';

function MyComponent() {
  const { language, theme, setLanguage, setTheme } = useUiPreferences();
  
  // Read current preferences
  console.log('Current language:', language); // 'en', 'fil', or 'es'
  console.log('Current theme:', theme); // 'light', 'dark', or 'system'
  
  // Update preferences
  const switchToSpanish = () => setLanguage('es');
  const toggleDarkMode = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  
  return <div>...</div>;
}
```

### Adding Custom Language Strings (Future)

When you implement actual i18n:

```tsx
// Create a translations file
const translations = {
  en: {
    welcome: "Welcome",
    dashboard: "Dashboard",
  },
  fil: {
    welcome: "Maligayang pagdating",
    dashboard: "Dashboard",
  },
  es: {
    welcome: "Bienvenido",
    dashboard: "Tablero",
  },
};

// Use in component
function MyComponent() {
  const { language } = useUiPreferences();
  const t = translations[language];
  
  return <h1>{t.welcome}</h1>;
}
```

### Customizing Available Languages

```tsx
import MultiLanguageSelector from './components/system/MultiLanguageSelector';

function CustomLanguageSelector() {
  const customLanguages = [
    { code: 'en', label: 'English', emoji: '🇺🇸' },
    { code: 'fil', label: 'Filipino', emoji: '🇵🇭' },
    { code: 'es', label: 'Spanish', emoji: '🇪🇸' },
    { code: 'fr', label: 'French', emoji: '🇫🇷' },
    { code: 'de', label: 'German', emoji: '🇩🇪' },
  ];
  
  return <MultiLanguageSelector availableLanguages={customLanguages} />;
}
```

## 🎨 Design Implementation

All components follow design tokens from `ux/design.json`:

### Colors
- Brand primary: `#304DB5`
- Brand soft: `#E0E5FF`
- Text primary: `#111827`
- Text secondary: `#5F6473`
- Border: `#EDF0FB`

### Spacing
- Gap between controls: `12px` (gap-3)
- Padding: `12px x 8px` (px-3 py-2)
- Border radius: `999px` (rounded-full for pills)
- Dropdown radius: `20px` (rounded-xl)

### Shadows
- Button: `shadow-sm` with hover `shadow-md`
- Dropdown: `shadow-[0_12px_30px_rgba(20,46,130,0.12)]`

### Animations
- Dropdown: `animate-fadeIn` (0.2s ease)
- Toggle slider: `transition-transform duration-200`
- Chevron rotation: `transition-transform`

## 🔧 Technical Details

### localStorage Keys
- Language: `ui-language`
- Theme: `ui-theme`

### Document Classes
- Dark mode: Adds/removes `dark` class on `document.documentElement`
- This enables Tailwind's dark mode utilities (e.g., `dark:bg-gray-900`)

### Click Outside Detection
- MultiLanguageSelector uses `useRef` + `useEffect` to detect clicks outside dropdown
- Automatically closes dropdown when clicking elsewhere

### State Management
- Centralized in UiPreferencesContext
- No prop drilling needed
- Accessible via `useUiPreferences()` hook from any component

## 🚀 Next Steps

### Implementing Full i18n
1. Install i18n library (e.g., `react-i18next`)
2. Create translation JSON files for each language
3. Update components to use translation keys
4. Connect i18n library's language setting with `useUiPreferences().language`

### Implementing System Theme Detection
Update UiPreferencesContext.tsx:

```tsx
useEffect(() => {
  if (theme === 'system') {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', isDarkMode);
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle('dark', e.matches);
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }
}, [theme]);
```

### Configuring Tailwind Dark Mode
Update `tailwind.config.js`:

```javascript
export default {
  darkMode: 'class', // Use class-based dark mode
  // ... rest of config
}
```

Then use dark mode utilities in components:

```tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  Content that adapts to theme
</div>
```

## 📍 Current State

✅ **Implemented:**
- Context provider with localStorage persistence
- Multi-language selector UI (3 languages)
- Dark/light mode toggle UI
- Document class toggling for dark mode
- Integration with all 3 main layouts
- Smooth animations and transitions
- Click-outside detection
- Tailwind animation utilities

⏳ **Not Yet Implemented (Future Work):**
- Actual string translations (i18n)
- System theme detection
- Tailwind dark mode color schemes
- RTL (right-to-left) language support
- Language-specific date/number formatting

## 🧪 Testing

You can test the controls by:

1. Navigate to any admin/student/coach page
2. Click the language selector (top-right corner)
3. Select different languages - preference persists on refresh
4. Toggle dark/light mode - `dark` class is added/removed from `<html>`
5. Refresh the page - preferences are restored from localStorage

## 🎯 Benefits

- **Reusable**: Works across all layouts without duplication
- **Persistent**: Preferences saved to localStorage
- **Performant**: Minimal re-renders with context
- **Accessible**: Proper ARIA labels and keyboard navigation
- **Extensible**: Easy to add more languages or themes
- **Type-safe**: Full TypeScript support
