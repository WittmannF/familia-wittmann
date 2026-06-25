import { defineCollection, z } from 'astro:content';

const mediaSchema = z.object({
  type: z.enum(['image', 'audio', 'video', 'none']).default('none'),
  src: z.string().default(''),
  alt: z.string().default('')
}).default({ type: 'none', src: '', alt: '' });

const people = defineCollection({
  type: 'content',
  schema: z.object({
    id: z.string(),
    // Astro treats `slug` as a reserved content field; keep it optional in frontmatter.
    slug: z.string().optional(),
    name: z.string(),
    full_name: z.string(),
    birth_date: z.string().default(''),
    death_date: z.string().default(''),
    cover_image: z.string().default(''),
    familysearch_url: z.string().default(''),
    publish: z.boolean().default(false)
  })
});
const memories = defineCollection({
  type: 'content',
  schema: z.object({
    person: z.string(), title: z.string(), author: z.string(), relationship: z.string().default(''),
    date_received: z.string(), memory_date: z.string().default(''), location: z.string().default(''),
    source: z.string().default('manual'), source_submission_id: z.string().default(''),
    permission_to_publish: z.boolean().default(false), show_author_name: z.boolean().default(true),
    publish: z.boolean().default(false), media: mediaSchema
  })
});
const guestbook = defineCollection({
  type: 'content',
  schema: z.object({
    person: z.string(), author: z.string(), city: z.string().default(''), relationship: z.string().default(''),
    date_received: z.string(), source: z.string().default('manual'), source_submission_id: z.string().default(''),
    permission_to_publish: z.boolean().default(false), show_author_name: z.boolean().default(true), publish: z.boolean().default(false)
  })
});
const timeline = defineCollection({
  type: 'content',
  schema: z.object({ person: z.string(), date: z.string().default(''), year: z.number().optional(), title: z.string(), order: z.number().default(999), publish: z.boolean().default(false), media: mediaSchema })
});
const photos = defineCollection({
  type: 'content',
  schema: z.object({ person: z.string(), title: z.string(), date: z.string().default(''), approximate_date: z.boolean().default(true), description: z.string().default(''), people_in_photo: z.array(z.string()).default([]), src: z.string(), publish: z.boolean().default(false) })
});
const videos = defineCollection({ type: 'content', schema: z.object({ person: z.string(), title: z.string(), date: z.string().default(''), description: z.string().default(''), src: z.string(), publish: z.boolean().default(false) }) });
const audio = defineCollection({ type: 'content', schema: z.object({ person: z.string(), title: z.string(), date: z.string().default(''), description: z.string().default(''), src: z.string(), publish: z.boolean().default(false) }) });
const familyHistory = defineCollection({ type: 'content', schema: z.object({ title: z.string(), slug: z.string().optional(), publish: z.boolean().default(false) }) });

export const collections = { people, memories, guestbook, timeline, photos, videos, audio, 'family-history': familyHistory };
