export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function getPagination(page: number, limit: number) {
  return {
    skip: (page - 1) * limit,
    limit,
  };
}

export function buildPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export function buildTextSearchQuery(
  search: string | undefined,
  fields: string[]
): Record<string, unknown> {
  if (!search?.trim()) return {};

  const pattern = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  return {
    $or: fields.map((field) => ({ [field]: pattern })),
  };
}
