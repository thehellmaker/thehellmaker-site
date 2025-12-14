import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		draft: z.boolean().optional().default(false),
		tags: z.string().optional(),
		group: z.string().optional(),
		heroImage: z.string().optional(),
		authors: z.array(z.string()),
	}),
});

export const collections = { blog };
