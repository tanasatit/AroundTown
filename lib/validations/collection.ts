import { z } from 'zod';

// Empty number inputs send NaN via valueAsNumber — .catch(0) falls back to 0
const exchangeField = z.number().int().min(0).catch(0);

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

  exchangeCoins1baht:   exchangeField,
  exchangeCoins2baht:   exchangeField,
  exchangeCoins5baht:   exchangeField,
  exchangeCoins10baht:  exchangeField,
  exchangeNote20baht:   exchangeField,
  exchangeNote50baht:   exchangeField,
  exchangeNote100baht:  exchangeField,
  exchangeNote500baht:  exchangeField,
  exchangeNote1000baht: exchangeField,
  exchangeTransfer:     exchangeField,

  postcardsRemaining: z.number().int().min(0, { message: 'Postcards remaining cannot be negative' }),
  costPerPostcard: z.number().min(1).max(50).default(13.766),
  postcardsAdded: z.number().int().min(0).default(0).optional(),
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
  sort: z.enum(['date', 'week', 'revenue', 'profit']).nullish().transform(v => v ?? 'date'),
  order: z.enum(['asc', 'desc']).nullish().transform(v => v ?? 'desc'),
});

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type CreateCollectionFormInput = z.input<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;
export type ListCollectionsQuery = z.infer<typeof listCollectionsQuerySchema>;
