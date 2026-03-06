# Deploying NexSkill LMS to Vercel

## Prerequisites

- A [Vercel](https://vercel.com) account
- Git repository connected to your Vercel account

## Quick Deployment

### Option 1: Using Vercel CLI

1. Install Vercel CLI globally:
   ```bash
   npm install -g vercel
   ```

2. Navigate to your project directory:
   ```bash
   cd nexskill-lms
   ```

3. Deploy to Vercel:
   ```bash
   vercel
   ```

4. Follow the prompts to link your project

5. For production deployment:
   ```bash
   vercel --prod
   ```

### Option 2: Using Vercel Dashboard

1. Push your code to GitHub, GitLab, or Bitbucket

2. Go to [vercel.com](https://vercel.com) and sign in

3. Click "Add New Project"

4. Import your repository

5. Vercel will automatically detect it's a Vite project

6. Click "Deploy"

## Configuration

The project includes a `vercel.json` configuration file with:
- Client-side routing support (SPA rewrites)
- Build command: `npm run build`
- Output directory: `dist`
- Framework: Vite

## Environment Variables

If you need environment variables:

1. Copy `.env.example` to `.env.local` (for local development)
2. Add environment variables in the Vercel dashboard under Project Settings → Environment Variables
3. Make sure all environment variables start with `VITE_` to be accessible in the app

## Build Settings

Vercel will automatically use these settings:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Node Version**: 18.x or higher

## Custom Domain

To add a custom domain:

1. Go to your project in Vercel dashboard
2. Navigate to Settings → Domains
3. Add your domain and follow DNS configuration instructions

## Troubleshooting

### Build Fails

- Ensure all dependencies are in `package.json`
- Check TypeScript errors: `npm run build` locally
- Verify Node.js version compatibility

### 404 Errors on Routes

- The `vercel.json` file handles SPA routing
- All routes redirect to `index.html` for client-side routing

### Dark Mode Not Working

- Dark mode uses localStorage and CSS classes
- Should work automatically on deployment
- No backend configuration needed

## Performance Optimization

Vercel automatically provides:
- Global CDN
- Automatic HTTPS
- Edge caching
- Asset optimization
- Brotli compression

## Monitoring

View deployment logs and analytics in the Vercel dashboard:
- Real-time logs
- Build logs
- Function logs (if using serverless functions)
- Analytics and performance metrics

## Continuous Deployment

Vercel automatically deploys:
- Production: When you push to `main` or `master` branch
- Preview: For all pull requests and other branches

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
