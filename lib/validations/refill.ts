import { z } from 'zod';

export const createRefillSchema = z.object({
  refillDate: z.string().refine(
    (date) => {
      const parsed = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return !isNaN(parsed.getTime()) && parsed <= today;
    },
    { message: 'Refill date cannot be in the future' }
  ),
  machineLocation: z.string()
    .min(3, { message: 'Machine location must be at least 3 characters' })
    .max(200, { message: 'Machine location must be at most 200 characters' }),
  postcardsAdded: z.number().int().min(1, { message: 'Must add at least 1 postcard' }),
  postcardsBefore: z.number().int().min(0, { message: 'Postcards before cannot be negative' }),
  notes: z.string().optional(),
});

export const updateRefillSchema = createRefillSchema.partial();

export const listRefillsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).or(z.null()).transform(v => v ?? 1),
  limit: z.coerce.number().int().min(1).max(100).default(10).or(z.null()).transform(v => v ?? 10),
  location: z.string().nullish().transform(v => v ?? undefined),
  startDate: z.string().nullish().transform(v => v ?? undefined),
  endDate: z.string().nullish().transform(v => v ?? undefined),
});

export type CreateRefillInput = z.infer<typeof createRefillSchema>;
export type UpdateRefillInput = z.infer<typeof updateRefillSchema>;
export type ListRefillsQuery = z.infer<typeof listRefillsQuerySchema>;
