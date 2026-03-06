# System Error & Availability Pages

This directory contains all system-level error pages and error handling utilities for NexSkill LMS.

## 📁 File Structure

```
src/
├── layouts/
│   └── PublicSystemLayout.tsx          # Shared layout for system pages
├── pages/system/
│   ├── Error404Page.tsx                # 404 Not Found page
│   ├── Error500Page.tsx                # 500 Server Error page
│   └── MaintenanceModePage.tsx         # Maintenance mode page
├── components/system/
│   ├── ErrorBoundary.tsx               # React error boundary component
│   └── SessionExpiredModal.tsx         # Session expiry modal
├── utils/
│   └── errorHandler.ts                 # API error handling utilities
└── examples/
    └── sessionExpiryExamples.tsx       # Usage examples
```

## 🎯 Features Implemented

### 1. **Error Pages**
- ✅ **404 Page** - Friendly "page not found" with navigation options
- ✅ **500 Page** - Server error page with retry functionality
- ✅ **Maintenance Page** - Scheduled maintenance announcement

### 2. **Error Handling**
- ✅ **ErrorBoundary** - Catches React component errors automatically
- ✅ **Catch-all Route** - Unmatched URLs show 404 page
- ✅ **API Error Handler** - Utility for handling backend errors (ready for integration)

### 3. **Session Management**
- ✅ **SessionExpiredModal** - Reusable modal for session expiry
- ✅ **Usage Examples** - Sample implementations and patterns

## 🚀 Current State

### What's Working Now:

1. **React Errors** → Automatically caught by `ErrorBoundary` → Shows 500 page
2. **Unknown Routes** → Caught by `*` route → Shows 404 page
3. **Manual Navigation** → Can navigate to `/404`, `/500`, `/maintenance`

### What Needs Backend Integration:

1. **API Errors** → Use `handleApiError()` utility when implementing API calls
2. **Session Expiry** → Use `SessionExpiredModal` with your auth system
3. **Maintenance Mode** → Add backend flag to trigger maintenance page

## 📖 Usage Guide

### Using ErrorBoundary (Already Active)

The `ErrorBoundary` is already wrapping your entire app in `App.tsx`. Any React component error will automatically show the 500 page.

```tsx
// Already implemented in App.tsx
<ErrorBoundary>
  <BrowserRouter>
    {/* All your routes */}
  </BrowserRouter>
</ErrorBoundary>
```

### Handling API Errors (For Later)

When you implement backend API calls, use the error handler:

```tsx
import { useNavigate } from 'react-router-dom';
import { handleApiError } from '../utils/errorHandler';

function MyComponent() {
  const navigate = useNavigate();
  
  const fetchData = async () => {
    try {
      const response = await fetch('/api/data');
      
      if (!response.ok) {
        handleApiError(
          { status: response.status, message: response.statusText },
          navigate
        );
        return;
      }
      
      // Handle success
    } catch (error) {
      handleApiError({ message: 'Network error' }, navigate);
    }
  };
}
```

### Using Session Expired Modal

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SessionExpiredModal from '../components/system/SessionExpiredModal';

function App() {
  const [sessionExpired, setSessionExpired] = useState(false);
  const navigate = useNavigate();

  const handleRelogin = () => {
    navigate('/login');
    setSessionExpired(false);
  };

  const handleGoHome = () => {
    navigate('/');
    setSessionExpired(false);
  };

  return (
    <>
      {/* Your app content */}
      <SessionExpiredModal
        open={sessionExpired}
        onRelogin={handleRelogin}
        onGoHome={handleGoHome}
      />
    </>
  );
}
```

## 🎨 Design Implementation

All pages follow the design tokens from `ux/design.json`:

- **Colors**: Brand primary (#304DB5), soft gradients, proper text hierarchy
- **Layout**: Centered cards with rounded-3xl, proper shadows
- **Typography**: Clear headlines (3xl), readable body text (base)
- **Buttons**: Pill-shaped (rounded-full), proper hover states
- **Spacing**: 8px grid system (p-8, gap-3, mb-6, etc.)
- **Responsive**: Mobile-first with sm/md breakpoints

## 🔧 Maintenance Mode

To activate maintenance mode in production:

1. **Option A**: Redirect all traffic to `/maintenance` at server/CDN level
2. **Option B**: Add a feature flag check in App.tsx:

```tsx
function App() {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  
  useEffect(() => {
    // Check maintenance flag from API/config
    checkMaintenanceStatus().then(setIsMaintenanceMode);
  }, []);
  
  if (isMaintenanceMode) {
    return <MaintenanceModePage />;
  }
  
  return <ErrorBoundary>{/* Normal app */}</ErrorBoundary>;
}
```

## 🧪 Testing

You can test the error pages by navigating to:

- `/404` - 404 error page
- `/500` - 500 error page  
- `/maintenance` - Maintenance page
- `/any-invalid-route` - Should show 404
- Throw error in component - Should show 500 (via ErrorBoundary)

## 📝 Next Steps

1. **Integrate with Backend**
   - Add API error handling in your fetch/axios calls
   - Use `handleApiError()` utility
   - Set up axios interceptors if using axios

2. **Add Session Management**
   - Integrate SessionExpiredModal with your auth system
   - Check token expiry on mount and periodically
   - Handle 401 responses from API

3. **Add Maintenance Flag**
   - Create backend endpoint to check maintenance status
   - Add feature flag or environment variable
   - Implement conditional rendering in App.tsx

4. **Error Logging** (Optional)
   - Add error reporting service (Sentry, LogRocket, etc.)
   - Update ErrorBoundary to log errors
   - Track API errors in handleApiError()

## 📚 Reference Files

- See `src/examples/sessionExpiryExamples.tsx` for complete usage examples
- See `src/utils/errorHandler.ts` for API error handling patterns
- See `ux/design.json` for design token reference
