# CLAUDE.md

Tech blog built with Astro. Learning notes written with LLM assistance.

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

## Writing Guidelines

Technical blog posts. Keep it clean and direct.

### Avoid LLM patterns
- No em dashes (—). Use colons, periods, commas, or parentheses instead
- No "Key insight:", "Intuition:", "Let's dive in", "In this section we will"
- No "fascinating", "elegant", "powerful", "exciting", "remarkable"
- No fake personal discovery intros ("I wanted to understand...", "I was curious about...")
- No numbered "Part 1:", "Part 2:" headers
- No excessive bullet points or tables for everything
- No emojis in technical content
- No perfect parallel structure in every section
- No conclusions that summarize everything said above

### Do instead
- State what the post covers upfront
- Link to source material (repos, videos, papers) early
- Show code, then explain it
- Use short sentences
- Vary sentence and paragraph structure
- Be direct about what things are and how they work

### Attribution
- Credit original authors prominently. If explaining someone's work, say so upfront
- Don't claim knowledge as your own. This is a learning blog, not original research
- Link to original repos, papers, videos, blog posts
- If the post is based on someone's tutorial/course, title should reflect that (e.g., "My Notes on X's Y")
- Include a references section at the end with all sources
