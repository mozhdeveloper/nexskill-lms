# React-Supabase Separation of Concerns and Coding Practices Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Folder Structure](#folder-structure)
3. [React Component Best Practices](#react-component-best-practices)
4. [Supabase Integration Patterns](#supabase-integration-patterns)
5. [State Management](#state-management)
6. [API Layer Design](#api-layer-design)
7. [Testing Strategies](#testing-strategies)
8. [Security Considerations](#security-considerations)
9. [Performance Optimization](#performance-optimization)
10. [Code Quality Standards](#code-quality-standards)

## Introduction

This guide establishes best practices for developing React applications with Supabase, focusing on separation of concerns, maintainability, and scalability. Following these practices will ensure consistent code quality and efficient collaboration among team members.

## Folder Structure

Recommended project structure for optimal separation of concerns:

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Shared components (buttons, inputs, modals)
│   ├── ui/              # Presentational components
│   └── forms/           # Form-specific components
├── pages/               # Route-level components
├── hooks/               # Custom React hooks
│   ├── auth/            # Authentication-related hooks
│   └── data/            # Data fetching hooks
├── services/            # Business logic and API services
│   ├── supabase/        # Supabase client and operations
│   ├── api/             # External API integrations
│   └── utils/           # Helper functions
├── store/               # State management (if using Redux/Zustand)
├── types/               # TypeScript type definitions
├── constants/           # Application constants
├── contexts/            # React Context providers
├── layouts/             # Page layout components
├── assets/              # Static assets (images, fonts, etc.)
└── styles/              # Global styles and CSS modules
```

### Key Principles:
- **Separation of Concerns**: Each folder has a specific responsibility
- **Scalability**: Easy to add new features without disrupting existing code
- **Maintainability**: Clear boundaries between different parts of the application

## React Component Best Practices

### 1. Component Organization
```typescript
// Good: Single responsibility principle
const UserProfileCard = () => {
  // Component logic here
};

export default UserProfileCard;
```

### 2. Component Composition Over Inheritance
```typescript
// Good: Using composition
const Layout = ({ children, sidebar }) => (
  <div>
    {sidebar && <Sidebar />}
    <main>{children}</main>
  </div>
);
```

### 3. Prop Drilling Solutions
- Use React Context for global state
- Create custom hooks for shared logic
- Consider state management libraries for complex applications

### 4. Performance Optimization
- Use React.memo for components that rarely change
- Implement useCallback and useMemo appropriately
- Lazy load components that aren't immediately needed

```typescript
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

const App = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <HeavyComponent />
  </Suspense>
);
```

### 5. Error Boundaries
```typescript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}
```

## Supabase Integration Patterns

### 1. Client Configuration
Create a centralized Supabase client:

```typescript
// services/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### 2. Service Layer Pattern
Create service functions that encapsulate Supabase operations:

```typescript
// services/supabase/userService.ts
import { supabase } from '../client';

export const userService = {
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
```

### 3. Real-time Subscriptions
Handle real-time updates properly:

```typescript
// hooks/useRealtimeUpdates.ts
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase/client';

export const useRealtimeUpdates = (tableName: string, userId?: string) => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const channel = supabase
      .from(tableName)
      .on('INSERT', (payload) => {
        setData(prev => [...prev, payload.new]);
      })
      .on('UPDATE', (payload) => {
        setData(prev => 
          prev.map(item => 
            item.id === payload.new.id ? payload.new : item
          )
        );
      })
      .on('DELETE', (payload) => {
        setData(prev => prev.filter(item => item.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName]);

  return data;
};
```

### 4. Authentication Handling
```typescript
// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase/client';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);

      // Listen for auth changes
      const { data: { subscription } } = await supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(session?.user || null);
          setLoading(false);
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    };

    getSession();
  }, []);

  return { user, loading };
};
```

## State Management

### 1. Local State vs Global State
- Use component state (`useState`) for component-specific data
- Use context/redux for data shared across multiple components
- Consider Zustand or Jotai for simpler global state needs

### 2. Context Pattern
```typescript
// contexts/AppContext.tsx
import React, { createContext, useContext, useReducer } from 'react';

interface AppState {
  user: any;
  theme: string;
}

type AppAction = 
  | { type: 'SET_USER'; payload: any }
  | { type: 'TOGGLE_THEME' };

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | undefined>(undefined);

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };
    default:
      return state;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, { user: null, theme: 'light' });

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
```

## API Layer Design

### 1. Service Abstraction
```typescript
// services/api/types.ts
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// services/api/baseService.ts
export abstract class BaseService {
  protected async request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error.message, success: false };
    }
  }
}
```

### 2. Error Handling
```typescript
// services/api/errorHandler.ts
export const handleApiError = (error: any) => {
  if (error.response) {
    // Server responded with error status
    switch (error.response.status) {
      case 401:
        // Handle unauthorized
        break;
      case 403:
        // Handle forbidden
        break;
      case 500:
        // Handle server error
        break;
      default:
        // Handle other errors
    }
  } else if (error.request) {
    // Request was made but no response received
  } else {
    // Something else happened
  }
};
```

## Testing Strategies

### 1. Unit Testing
```typescript
// __tests__/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../../src/components/common/Button';

describe('Button Component', () => {
  it('renders correctly with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 2. Integration Testing
```typescript
// __tests__/pages/Dashboard.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../../src/pages/Dashboard';
import { QueryClient, QueryClientProvider } from 'react-query';

const queryClient = new QueryClient();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    </MemoryRouter>
  );
};

describe('Dashboard Page', () => {
  it('displays user profile after data loads', async () => {
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Welcome,/)).toBeInTheDocument();
    });
  });
});
```

### 3. Supabase Mocking
```typescript
// __tests__/__mocks__/supabase.ts
export const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: {}, error: null }),
  data: jest.fn().mockResolvedValue({}),
  error: jest.fn().mockResolvedValue(null),
};
```

## Security Considerations

### 1. Environment Variables
Never expose sensitive information in client-side code:
```typescript
// .env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
```

### 2. Row Level Security (RLS)
Enable RLS on Supabase tables and define policies:
```sql
-- Example policy
CREATE POLICY "Allow users to view their own profiles"
  ON profiles FOR SELECT
  USING (auth.uid() = id);
```

### 3. Input Validation
Validate all user inputs both client-side and server-side:
```typescript
// utils/validation.ts
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};
```

### 4. Authentication Guards
Protect routes that require authentication:
```typescript
// components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};
```

## Performance Optimization

### 1. Code Splitting
```typescript
// App.tsx
import { lazy, Suspense } from 'react';
import LoadingSpinner from './components/LoadingSpinner';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));

const App = () => (
  <Suspense fallback={<LoadingSpinner />}>
    {/* Routes */}
  </Suspense>
);
```

### 2. Image Optimization
```typescript
// components/OptimizedImage.tsx
import { useState } from 'react';

const OptimizedImage = ({ src, alt, ...props }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      {isLoading && <div className="skeleton">Loading...</div>}
      <img 
        src={src} 
        alt={alt} 
        {...props}
        onLoad={() => setIsLoading(false)}
        style={{ display: isLoading ? 'none' : 'block' }}
      />
    </>
  );
};
```

### 3. Database Query Optimization
- Use indexes on frequently queried columns
- Limit the amount of data retrieved with `.limit()`
- Use `.select()` to retrieve only needed fields

## Code Quality Standards

### 1. TypeScript Best Practices
```typescript
// Use strict typing
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// Use discriminated unions for complex state
type LoadingState = { status: 'loading' };
type SuccessState = { status: 'success'; data: User[] };
type ErrorState = { status: 'error'; error: string };

type AppState = LoadingState | SuccessState | ErrorState;
```

### 2. Naming Conventions
- Components: PascalCase (UserProfileCard)
- Functions: camelCase (getUserData)
- Constants: UPPER_SNAKE_CASE (MAX_FILE_SIZE)
- Types: PascalCase (UserData)

### 3. Documentation
```typescript
/**
 * Fetches user profile data from Supabase
 * @param userId - The unique identifier for the user
 * @returns Promise resolving to user profile data
 * @throws Error if user is not found or request fails
 */
export const fetchUserProfile = async (userId: string): Promise<UserProfile> => {
  // Implementation
};
```

### 4. Linting and Formatting
Use ESLint and Prettier with consistent rules across the team:
```json
// .eslintrc.json
{
  "extends": [
    "react-app",
    "react-app/jest"
  ],
  "rules": {
    "no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn"
  }
}
```

This guide provides a solid foundation for building maintainable and scalable React-Supabase applications. Regularly review and update these practices as your team grows and technology evolves.