# CLAUDE.md

Tech blog built with Astro.

## Stack

- Astro 5.x (static)
- Tailwind CSS
- React 18 for interactive stuff
- KaTeX for math
- Framer Motion / anime.js for animation

## Structure

```
src/content/blog/    # posts (.md or .mdx)
src/components/      # React and Astro components
src/layouts/         # page layouts
public/              # images, fonts
```

## Blog Post Frontmatter

```yaml
---
title: 'Post Title'
description: 'SEO description'
pubDate: 'Dec 14 2024'
heroImage: '/image.jpg'  # optional
authors: ['thehellmaker']
---
```

## Commands

```bash
npm run dev      # localhost:4321
npm run build    # production build
npm run preview  # preview build
```

## Math

Inline: `$x^2$`
Block: `$$\sum_{i=1}^n x_i$$`

## Interactive Components

Put React components in `src/components/blog/`, use in MDX:

```mdx
import MyViz from '../../components/blog/MyViz.tsx';

<MyViz client:load />
```
