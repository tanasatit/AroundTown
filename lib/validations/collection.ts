import { z } from 'zod';

export const createCollectionSchema = z.object({
  collectionDate: z.string().refine(
    (date) => {
      const parsed = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return !isNaN(parsed.getTime()) && parsed <= today;
    },
    { message: 'Collection date cannot be in the future' }
  ),
  roundNumber: z.number().int().min(1).max(2, { message: 'Round number must be 1 or 2' }),
  weekNumber: z.number().int().min(1, { message: 'Week number must be at least 1' }),
  machineLocation: z.string()
    .min(3, { message: 'Machine location must be at least 3 characters' })
    .max(200, { message: 'Machine location must be at most 200 characters' }),

  machineCoins10baht: z.number().int().min(0, { message: 'Machine coins cannot be negative' })
    .refine((n) => n % 4 === 0, {
      message: 'Machine coins must be divisible by 4 (4 coins = 1 postcard)',
    }),

  exchangeCoins1baht: z.number().int().min(0).default(0),
  exchangeCoins2baht: z.number().int().min(0).default(0),
  exchangeCoins5baht: z.number().int().min(0).default(0),
  exchangeCoins10baht: z.number().int().min(0).default(0),
  exchangeNote20baht: z.number().int().min(0).default(0),
  exchangeNote50baht: z.number().int().min(0).default(0),
  exchangeNote100baht: z.number().int().min(0).default(0),
  exchangeNote500baht: z.number().int().min(0).default(0),
  exchangeNote1000baht: z.number().int().min(0).default(0),

  postcardsRemaining: z.number().int().min(0, { message: 'Postcards remaining cannot be negative' }),
  costPerPostcard: z.number().min(1).max(50).default(13.766),
  notes: z.string().optional(),
});

export const updateCollectionSchema = createCollectionSchema.partial();

export const listCollectionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).or(z.null()).transform(v => v ?? 1),
  limit: z.coerce.number().int().min(1).max(100).default(10).or(z.null()).transform(v => v ?? 10),
  location: z.string().nullish().transform(v => v ?? undefined),
  week: z.coerce.number().int().min(1).nullish().transform(v => v ?? undefined),
  startDate: z.string().nullish().transform(v => v ?? undefined),
  endDate: z.string().nullish().transform(v => v ?? undefined),
});

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;
export type ListCollectionsQuery = z.infer<typeof listCollectionsQuerySchema>;
