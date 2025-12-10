# NexSkill LMS

A comprehensive Learning Management System (LMS) built with React, TypeScript, Vite, and Supabase. Features multi-role support, AI-powered learning tools, course management, analytics, community features, and a modern user interface with dark mode support.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
  - [Running Locally](#running-locally)
- [Project Structure](#-project-structure)
- [User Roles](#-user-roles)
- [Features by Role](#-features-by-role)
- [What's Working](#-whats-working)
- [What Still Needs to Be Done](#-what-still-needs-to-be-done)
- [Role-Based Documentation](#-role-based-documentation)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## ✨ Features

### Current Features
- 🎓 **Multi-Role System**: 9 distinct roles with role-specific dashboards and permissions
- 🌓 **Dark Mode**: Full dark mode support with system theme detection
- 🤖 **AI Integration**: AI-powered study plans, quiz generation, content recommendations, and coaching insights
- 📱 **Responsive Design**: Mobile-first design with Tailwind CSS
- 🎨 **Modern UI**: Beautiful gradients, animations, and interactive components
- 📊 **Analytics Dashboards**: Comprehensive analytics for students, coaches, and admins
- 🔐 **Role-Based Access Control**: Protected routes and role-specific layouts
- 📜 **Blockchain Certificates**: Certificate verification and sharing capabilities
- 💬 **Messaging & Chat**: Student-coach communication tools
- 🎯 **Course Builder**: Visual course creation with drag-and-drop
- 📚 **Content Management**: Review queues, content library, and version control
- 👥 **Community Features**: Discussion boards, groups, and moderation tools
- 💰 **Financial Management**: Billing, payouts, refunds, and coupons
- 🎫 **Support Ticketing**: Customer support system with knowledge base
- 📈 **CRM Tools**: Email campaigns, WhatsApp broadcasts, and segmentation
- 🔧 **System Administration**: API keys, integrations, feature toggles

---

## 🛠️ Tech Stack

### Frontend
- **React 19.2.0** - UI library
- **TypeScript 5.9.3** - Type safety
- **Vite 7.2.4** - Build tool and dev server
- **React Router DOM 7.10.0** - Routing
- **Tailwind CSS 3.4.18** - Styling
- **Lucide React 0.555.0** - Icons

### Backend
- **Supabase 2.86.2** - Backend-as-a-Service (authentication, database, storage)

### Development Tools
- **ESLint** - Code linting
- **TypeScript ESLint** - TypeScript linting
- **PostCSS & Autoprefixer** - CSS processing

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- **Node.js** 20.19+ or 22.12+ ([Download](https://nodejs.org/))
- **npm** (comes with Node.js) or **yarn**
- **Git** ([Download](https://git-scm.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mozhdeveloper/nexskill-lms.git
   cd nexskill-lms/nexskill-lms
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   or
   ```bash
   yarn install
   ```

### Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration (Optional - app works without it)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Note:** The application currently works with **mock data** and does not require Supabase to be configured. You can run it without setting up these environment variables. Supabase integration is planned for future development.

### Running Locally

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Open your browser**
   Navigate to `http://localhost:5173`

3. **Login with demo credentials**
   - Go to the login page at `/auth/login`
   - Select any role from the dropdown
   - **Credentials auto-fill automatically** - just click "Sign In"!
   - All demo accounts use the surname "Doe" (Alex Doe, Jordan Doe, etc.)
   - Password for all accounts: `demo1234`

   📖 **[View all demo credentials →](./docs/DEMO_CREDENTIALS.md)**
   - No password validation required (mock authentication)

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

---

## 📁 Project Structure

```
nexskill-lms/
├── public/                    # Static assets
├── src/
│   ├── assets/               # Images, fonts, branding
│   ├── components/           # React components
│   │   ├── admin/           # Admin-specific components
│   │   ├── ai/              # AI-powered features
│   │   ├── auth/            # Authentication components
│   │   ├── coach/           # Coach tools and features
│   │   ├── coaching/        # Coaching session tools
│   │   ├── community/       # Community features
│   │   ├── content/         # Content management
│   │   ├── courses/         # Course components
│   │   ├── learning/        # Learning interface
│   │   ├── support/         # Support ticketing
│   │   ├── system/          # System administration
│   │   └── ui/              # Reusable UI components
│   ├── constants/           # App constants
│   ├── context/             # React context providers
│   │   ├── AuthContext.tsx  # Authentication state
│   │   └── UiPreferencesContext.tsx  # UI preferences (dark mode)
│   ├── layouts/             # Layout components for each role
│   ├── lib/                 # Libraries and utilities
│   │   └── supabaseClient.ts  # Supabase configuration
│   ├── pages/               # Page components
│   │   ├── admin/          # Admin pages
│   │   ├── auth/           # Auth pages (login, register)
│   │   ├── coach/          # Coach pages
│   │   ├── community/      # Community pages
│   │   ├── content/        # Content editor pages
│   │   ├── org/            # Org owner pages
│   │   ├── owner/          # Platform owner pages
│   │   ├── student/        # Student pages
│   │   ├── subcoach/       # Sub-coach pages
│   │   ├── support/        # Support staff pages
│   │   └── system/         # Public system pages
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # App entry point
│   └── index.css           # Global styles
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── README.md               # This file
```

---

## 👥 User Roles

The system supports 9 distinct user roles:

1. **STUDENT** - Learners taking courses
2. **COACH** - Instructors creating and managing courses
3. **ADMIN** - Platform administrators
4. **PLATFORM_OWNER** - System-wide owners
5. **SUB_COACH** - Assistant coaches with limited permissions
6. **CONTENT_EDITOR** - Content reviewers and editors
7. **COMMUNITY_MANAGER** - Community moderation and management
8. **SUPPORT_STAFF** - Customer support representatives
9. **ORG_OWNER** - Organization-level owners

---

## 🎯 Features by Role

### Student Features
- Course catalog and enrollment
- Video lessons and learning content
- Progress tracking and certificates
- Discussion boards and community
- Live classes and coaching sessions
- AI-powered study plans
- Personal dashboard with analytics
- Billing and subscription management

### Coach Features
- Course builder with drag-and-drop
- Content creation and publishing
- Student management and messaging
- Coaching session tools
- Analytics and insights
- AI tools (quiz generator, content suggestions)
- Revenue tracking
- Calendar and scheduling

### Admin Features
- User management
- Course moderation and approval
- Financial control (transactions, payouts, refunds, coupons)
- CRM tools (email campaigns, WhatsApp broadcasts)
- Analytics dashboards
- System settings and integrations
- Notification management
- Security and audit logs

### Platform Owner Features
- System-wide settings
- User roles and permissions
- Billing and payouts management
- Platform analytics
- Branding customization
- API management

### Content Editor Features
- Content review queue
- Editorial workflows
- Content suggestions review
- Resource library management
- Version control

### Community Manager Features
- Post moderation
- User reporting and flagging
- Community analytics
- Group management

### Support Staff Features
- Ticket management system
- Knowledge base
- Student support tools
- System status monitoring
- Chat and messaging

---

## ✅ What's Working

### Authentication & Authorization
- ✅ Mock login system with role selection
- ✅ Role-based routing and access control
- ✅ Protected routes with role guards
- ✅ User context and session management
- ✅ Role switching capability

### UI & User Experience
- ✅ Fully responsive design (mobile, tablet, desktop)
- ✅ Dark mode with system preference detection
- ✅ Modern gradient-based design system
- ✅ Smooth animations and transitions
- ✅ Consistent component library
- ✅ Interactive forms and modals

### Dashboard & Analytics
- ✅ Role-specific dashboards
- ✅ Mock analytics data visualization
- ✅ Progress tracking interfaces
- ✅ Revenue and financial summaries
- ✅ User engagement metrics

### Course Management
- ✅ Course builder UI (drag-and-drop interface)
- ✅ Course preview and publishing workflow
- ✅ Pricing and payment setup forms
- ✅ Course catalog with filtering
- ✅ Enrollment tracking

### Content Management
- ✅ Content review queue interface
- ✅ Content library with search and filters
- ✅ Editorial workflow UI
- ✅ Content suggestions system

### Community Features
- ✅ Discussion board interface
- ✅ Community groups management
- ✅ Post moderation tools
- ✅ Reporting and flagging system

### Messaging & Communication
- ✅ Student-coach chat interface
- ✅ Session notes panel
- ✅ Messaging UI components

### Financial Tools
- ✅ Transaction history display
- ✅ Payout management interface
- ✅ Refund request handling
- ✅ Coupon creation and management
- ✅ Billing dashboard

### Support System
- ✅ Ticket management interface
- ✅ Knowledge base viewer
- ✅ Student lookup tools
- ✅ System status monitoring

### Admin Tools
- ✅ User management interface
- ✅ CRM campaign builders
- ✅ Email and WhatsApp broadcast tools
- ✅ API key management
- ✅ Integration settings
- ✅ Feature toggle system

### AI Features (UI Only)
- ✅ AI study plan interface
- ✅ AI quiz generator UI
- ✅ AI coaching insights panel
- ✅ AI content recommendations
- ✅ AI chat panel design

---

## 🚧 What Still Needs to Be Done

### Backend Integration
- ❌ **Supabase Setup**
  - Configure Supabase project
  - Create database schema and tables
  - Set up authentication with Supabase Auth
  - Implement row-level security (RLS) policies
  - Configure storage buckets for media files

- ❌ **API Integration**
  - Replace mock data with real API calls
  - Implement CRUD operations for all entities
  - Add error handling and loading states
  - Implement data caching and optimization
  - Add real-time subscriptions (chat, notifications)

### Authentication & Security
- ❌ Real user authentication (email/password, OAuth)
- ❌ Password reset and email verification
- ❌ Two-factor authentication (2FA)
- ❌ Session management and token refresh
- ❌ Role-based permissions enforcement at API level
- ❌ Audit logging for sensitive operations

### Course Features
- ❌ Video upload and streaming
- ❌ Course content actual functionality (lessons, quizzes, assignments)
- ❌ Progress tracking persistence
- ❌ Certificate generation (PDF)
- ❌ Blockchain certificate verification integration
- ❌ Course enrollment payment processing
- ❌ Course reviews and ratings persistence

### Learning Features
- ❌ Video player with controls (play, pause, speed, quality)
- ❌ Quiz taking and submission
- ❌ Assignment submission and grading
- ❌ Live class integration (Zoom/WebRTC)
- ❌ Download course materials
- ❌ Bookmark and notes functionality

### AI Integration
- ❌ OpenAI/Claude API integration
- ❌ AI study plan generation
- ❌ AI quiz generator backend
- ❌ AI content summarization
- ❌ AI coaching recommendations
- ❌ AI chat functionality
- ❌ Cost tracking and optimization

### Communication
- ❌ Real-time chat with WebSocket/Supabase Realtime
- ❌ Push notifications
- ❌ Email notifications (SendGrid/Mailgun)
- ❌ WhatsApp integration (Twilio)
- ❌ In-app notifications system
- ❌ Message read receipts
- ❌ File attachments in chat

### Payment & Financial
- ❌ Stripe/PayPal integration
- ❌ Payment processing for course enrollment
- ❌ Subscription management
- ❌ Automated payout system
- ❌ Refund processing
- ❌ Coupon code validation and application
- ❌ Invoice generation
- ❌ Tax calculation

### Analytics & Reporting
- ❌ Real analytics data collection
- ❌ Report generation (PDF/CSV export)
- ❌ Custom date range filtering
- ❌ Data visualization with real data
- ❌ A/B testing framework
- ❌ Funnel analytics tracking

### Content Management
- ❌ Rich text editor for content creation
- ❌ Media library with upload functionality
- ❌ Version control for content
- ❌ Content approval workflows
- ❌ Scheduled content publishing
- ❌ Content translation support

### Community Features
- ❌ Post creation and editing
- ❌ Comment threading
- ❌ Like/reaction system
- ❌ User mentions and tagging
- ❌ Post search and filtering
- ❌ Community guidelines enforcement

### Support System
- ❌ Ticket creation and assignment
- ❌ Ticket status tracking
- ❌ Support chat integration
- ❌ Knowledge base search
- ❌ SLA tracking
- ❌ Customer satisfaction surveys

### Admin & System
- ❌ User role assignment and management
- ❌ System configuration persistence
- ❌ Feature flag system
- ❌ Email template editor
- ❌ Backup and restore functionality
- ❌ System health monitoring
- ❌ Error tracking (Sentry integration)

### Testing
- ❌ Unit tests for components
- ❌ Integration tests for API calls
- ❌ End-to-end tests (Cypress/Playwright)
- ❌ Performance testing
- ❌ Accessibility testing

### Performance Optimization
- ❌ Code splitting and lazy loading
- ❌ Image optimization
- ❌ Caching strategy
- ❌ Database query optimization
- ❌ CDN integration

### DevOps & Deployment
- ❌ CI/CD pipeline setup
- ❌ Environment management (dev, staging, prod)
- ❌ Database migrations
- ❌ Monitoring and alerting
- ❌ SSL certificate management
- ❌ Domain configuration

### Documentation
- ❌ API documentation
- ❌ Component storybook
- ❌ User guides for each role
- ❌ Admin documentation
- ❌ Developer onboarding guide

---

## 📖 Role-Based Documentation

For detailed feature breakdowns by role, see the comprehensive documentation in the `/docs` folder:

- **[Student Role Documentation](./docs/STUDENT_ROLE.md)** - Complete features for students (15+ major features)
- **[Coach Role Documentation](./docs/COACH_ROLE.md)** - Complete features for coaches (16+ major features)
- **[Admin Role Documentation](./docs/ADMIN_ROLE.md)** - Complete features for admins (15+ major features)
- **[Additional Roles Documentation](./docs/ADDITIONAL_ROLES.md)** - Platform Owner, Content Editor, Community Manager, Sub-Coach, Support Staff, and Org Owner

Each role documentation includes:
- ✅ What's currently working (UI complete)
- ❌ What needs backend implementation
- 🔧 Technical requirements (database, API, integrations)
- 🚀 Recommended implementation priority

**[View All Role Documentation →](./docs/README.md)**

---

## 🚀 Deployment

### Deploy to Vercel

#### Option 1: Deploy via CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

#### Option 2: Deploy via GitHub

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Configure environment variables (if using Supabase)
5. Deploy!

### Environment Variables for Production

Set the following in Vercel dashboard:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is proprietary software. All rights reserved.

---

## 🆘 Support

For support and questions:
- Open an issue on GitHub
- Contact: [Your contact information]

---

## 🙏 Acknowledgments

- Built with [React](https://react.dev/)
- Powered by [Vite](https://vite.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Backend by [Supabase](https://supabase.com/)
- Icons from [Lucide](https://lucide.dev/)

---

**Made with ❤️ by the NexVision Team**

# Deploy to production
vercel --prod
```

### Option 2: Deploy via GitHub

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Add New Project"
4. Import your repository
5. Click "Deploy"

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Project Structure

```
nexskill-lms/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── admin/        # Admin-specific components
│   │   ├── ai/           # AI-powered components
│   │   ├── auth/         # Authentication components
│   │   ├── coach/        # Coach-specific components
│   │   └── ...           # Other role-specific components
│   ├── context/          # React Context providers
│   ├── layouts/          # Layout components for each role
│   ├── pages/            # Page components
│   │   ├── admin/        # Admin pages
│   │   ├── auth/         # Authentication pages
│   │   ├── coach/        # Coach pages
│   │   ├── student/      # Student pages
│   │   └── ...           # Other role pages
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── App.tsx           # Main app component with routing
│   └── main.tsx          # App entry point
├── public/               # Static assets
├── dist/                 # Production build (generated)
└── vercel.json          # Vercel configuration
```

## Available Roles

Access different portals by logging in with these roles:

- **Student** (`/student/*`): Course enrollment, learning, certificates
- **Coach** (`/coach/*`): Course creation, student management, earnings
- **Admin** (`/admin/*`): Platform analytics, user management, system health
- **Platform Owner** (`/owner/*`): Full platform control, role management
- **Sub-Coach** (`/subcoach/*`): Assistant teaching, grading, sessions
- **Content Editor** (`/content/*`): Content review, translations, resources
- **Community Manager** (`/community/*`): Forum moderation, engagement
- **Support Staff** (`/support/*`): Ticket management, student support
- **Org Owner** (`/org/*`): Team management, seat allocation, billing

## Dark Mode

Dark mode is implemented using:
- Tailwind CSS `dark:` variant
- `UiPreferencesContext` for state management
- localStorage for persistence
- System theme detection

Toggle dark mode from the user menu in any layout.

## Technologies

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Lucide React** - Icons

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Environment Variables

Create a `.env.local` file for local development (optional):

```env
VITE_API_URL=https://api.nexskill.com
VITE_APP_NAME=NexSkill LMS
```

## Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [DARK_MODE_README.md](./DARK_MODE_README.md) - Dark mode implementation
- [COURSE_BUILDER_README.md](./COURSE_BUILDER_README.md) - Course builder guide
- [SYSTEM_ERROR_README.md](./SYSTEM_ERROR_README.md) - Error handling guide

## License

Private - All Rights Reserved

## Support

For issues or questions, contact the development team.
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
