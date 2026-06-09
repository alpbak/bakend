import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const docSchema = z.object({
  title: z.string().optional(),
});

const docs = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "../docs" }),
  schema: docSchema,
});

const tutorials = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "../tutorials" }),
  schema: docSchema,
});

export const collections = { docs, tutorials };
