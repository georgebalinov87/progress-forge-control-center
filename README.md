# Forge Control Center Prototype

High-fidelity React and TypeScript prototype for reviewing the Forge Local Control Center experience.

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

For a GitHub Pages build, use:

```bash
DEPLOY_TARGET=github-pages npm run build
```

## GitHub Pages deployment

Push either `main` or `prototype-update-1` to your fork and GitHub Actions will build and deploy the site to GitHub Pages.

In the GitHub repository settings, set Pages to use **GitHub Actions** as the source.

## Vercel deployment

Vercel should use the default build command `npm run build` and output directory `dist`. Do not set a custom base path for Vercel.

The prototype uses local mock data only. It does not connect to Forge, repositories, issue providers, agents, authentication, or cloud infrastructure.
