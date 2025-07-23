# Netlify Deployment Setup Guide

This guide will help you set up staging and main branch deployments on Netlify.

## Prerequisites

- Your code is pushed to a Git repository (GitHub, GitLab, or Bitbucket)
- You have a Netlify account

## Step 1: Connect Your Repository to Netlify

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Connect your Git provider (GitHub, GitLab, or Bitbucket)
4. Select your repository (`getmoneyclaude`)

## Step 2: Configure Branch Deployments

### Option A: Using Netlify Dashboard (Recommended)

1. In your Netlify site settings, go to **Site settings** → **Build & deploy** → **Continuous Deployment**
2. Configure the following:

#### Production Branch
- **Branch to deploy**: `main`
- **Base directory**: (leave empty)
- **Build command**: `pnpm install && pnpm run build`
- **Publish directory**: `dist`

#### Staging Branch
- **Branch to deploy**: `staging`
- **Base directory**: (leave empty)
- **Build command**: `pnpm install && pnpm run build`
- **Publish directory**: `dist`

### Option B: Using netlify.toml (Already Configured)

The `netlify.toml` file is already configured with:
- **Production**: Deploys from `main` branch
- **Staging**: Deploys from `staging` branch
- **Preview**: Deploys from pull requests and other branches

## Step 3: Create Staging Branch

If you don't have a staging branch yet, create one:

```bash
# Create and switch to staging branch
git checkout -b staging

# Push staging branch to remote
git push -u origin staging
```

## Step 4: Environment Variables (Optional)

You can set different environment variables for staging and production:

### In Netlify Dashboard:
1. Go to **Site settings** → **Environment variables**
2. Add variables with different values for each context:
   - `VITE_API_URL` (production: `https://api.production.com`, staging: `https://api.staging.com`)
   - `VITE_SUPABASE_URL` (your Supabase URLs)
   - `VITE_SUPABASE_ANON_KEY` (your Supabase keys)

### Environment-Specific Variables:
- **Production**: Variables set in production context
- **Staging**: Variables set in staging context
- **Preview**: Variables set in deploy-preview context

## Step 5: Custom Domains (Optional)

### Production Domain
1. Go to **Site settings** → **Domain management**
2. Add your custom domain (e.g., `getmoney.com`)

### Staging Domain
1. Go to **Site settings** → **Domain management**
2. Add a staging subdomain (e.g., `staging.getmoney.com`)

## Step 6: Deployment Workflow

### Development Workflow:
1. **Feature branches**: Create feature branches from `staging`
2. **Staging**: Merge feature branches to `staging` for testing
3. **Production**: Merge `staging` to `main` for production deployment

### Example Git Workflow:
```bash
# Create feature branch
git checkout staging
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push feature branch
git push origin feature/new-feature

# Create pull request to staging
# After review, merge to staging

# When ready for production
git checkout main
git merge staging
git push origin main
```

## Step 7: Verify Deployments

1. **Production**: Visit your main domain or Netlify URL
2. **Staging**: Visit your staging domain or Netlify URL
3. **Preview**: Visit the preview URL provided by Netlify for pull requests

## Troubleshooting

### Common Issues:

1. **Build fails**: Check the build logs in Netlify dashboard
2. **Environment variables not working**: Ensure they're set in the correct context
3. **Functions not working**: Verify the functions directory path in `netlify.toml`

### Useful Commands:
```bash
# Test build locally
pnpm run build

# Test Netlify functions locally
npx netlify dev

# Check Netlify CLI
npx netlify --version
```

## Additional Configuration

### Branch Protection (Recommended):
1. In your Git provider, protect the `main` branch
2. Require pull request reviews before merging
3. Require status checks to pass before merging

### Automatic Deployments:
- **main branch**: Automatically deploys to production
- **staging branch**: Automatically deploys to staging
- **Pull requests**: Automatically creates preview deployments

## Support

If you encounter issues:
1. Check Netlify build logs
2. Verify your `netlify.toml` configuration
3. Ensure all dependencies are properly installed
4. Check environment variables are set correctly 