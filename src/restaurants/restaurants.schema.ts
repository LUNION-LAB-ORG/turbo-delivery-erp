import { z } from 'zod';

// Add Collection
export const updateCommissionSchema = z.object({
  restoId: z.string(),
  type: z.string(),
  commission: z.number(),
});
export type _updateCommissionSchema = z.infer<typeof updateCommissionSchema>;
