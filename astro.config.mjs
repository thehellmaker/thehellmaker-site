// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// https://astro.build/config
export default defineConfig({
  site: 'https://thehellmaker.com',
  integrations: [mdx(), sitemap(), react(), tailwind()],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  }
  // output: "server",
  // adapter: cloudflare(),
  // redirects: {
  //   '/blog/how-deploy-deepseek-r1-671b-model-multi-node-multi-gpu-using-vllm-ray-cluster': '',
  //   '/blog/event-loops-multi-threading-and-multi-processing': ''
  // }
});