import { z, defineCollection } from 'astro:content';

const blogCollection = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        description: z.string(),
        date: z.date(),
        tags: z.array(z.string()).optional(),
        draft: z.boolean().optional().default(false),
    }),
});

const projectsCollection = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        description: z.string(),
        date: z.date(),
        tags: z.array(z.string()).optional(),
        github: z.string().optional(),
        demo: z.string().optional(),
        image: z.string().optional(),
        featured: z.boolean().optional().default(false),
    }),
});

export const collections = {
    'blog': blogCollection,
    'projects': projectsCollection,
};
