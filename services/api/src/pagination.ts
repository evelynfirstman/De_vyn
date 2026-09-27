import { z } from "zod";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type Pagination = z.infer<typeof querySchema>;

export function parsePagination(query: unknown): Pagination {
  return querySchema.parse(query);
}

export function pageEnvelope<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
) {
  return {
    data: items,
    page: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
