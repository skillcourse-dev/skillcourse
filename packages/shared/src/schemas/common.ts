import { z } from 'zod';

export const localizedString = z
  .object({ en: z.string().min(1) })
  .catchall(z.string());

export type LocalizedString = z.infer<typeof localizedString>;
