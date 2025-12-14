# CLAUDE.md

This is thehellmaker's personal tech blog built with Astro.

## Tech Stack

- **Framework**: Astro 5.x with static site generation
- **Styling**: Tailwind CSS 3.x
- **Components**: React 18 for interactive components
- **Math**: KaTeX via remark-math and rehype-katex
- **Animation**: Framer Motion, anime.js
- **Deployment**: Cloudflare Pages (adapter available but currently static)

## Project Structure

```
src/
├── content/blog/       # Blog posts in .md or .mdx
├── components/         # Astro and React components
│   ├── blog/          # Post-specific interactive components
│   └── *.astro        # Layout components
├── layouts/           # Page layouts
├── pages/             # Route pages
└── styles/            # Global CSS
public/                # Static assets (images, fonts)
```

## Blog Post Format

Posts go in `src/content/blog/` as `.md` or `.mdx` files.

Frontmatter schema:
```yaml
---
title: 'Post Title'
description: 'Description for SEO'
pubDate: 'Dec 14 2024'
heroImage: '/image-name.jpg'  # optional, from public/
authors: ['thehellmaker']
---
```

## Commands

```bash
npm run dev      # Start dev server at localhost:4321
npm run build    # Build for production
npm run preview  # Preview production build
```

## Writing Style

- Technical deep-dives with code and math
- Use KaTeX for math: inline `$...$`, block `$$...$$`
- Keep explanations direct, avoid fluff
- Include code snippets with proper syntax highlighting
- For interactive visualizations, create React components in `src/components/blog/`

## Common Patterns

### Adding images
Put images in `public/`, reference as `/filename.jpg`

### Interactive components in MDX
```mdx
import MyComponent from '../../components/blog/MyComponent.tsx';

<MyComponent client:load />
```

### React components
- Use TypeScript
- Functional components with hooks
- Tailwind for styling
- Export as default

