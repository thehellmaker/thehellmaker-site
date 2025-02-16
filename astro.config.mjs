// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: 'https://thehellmaker.com',
  integrations: [mdx(), sitemap()],
  // output: "server",
  // adapter: cloudflare(),
  // redirects: {
  //   '/blog/how-deploy-deepseek-r1-671b-model-multi-node-multi-gpu-using-vllm-ray-cluster': '',
  //   '/blog/event-loops-multi-threading-and-multi-processing': ''
  // }
});