import { env } from '../config/env.js';

export interface PaginationQuery {
  page: number;
  limit: number;
  skip: number;
}

export function parsePagination(query: Record<string, unknown>): PaginationQuery {
  const requestedPage = Number.parseInt(String(query.page ?? '1'), 10);
  const requestedLimit = Number.parseInt(String(query.limit ?? env.DEFAULT_PAGE_SIZE), 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const limit = Math.min(
    Number.isFinite(requestedLimit) && requestedLimit > 0 ? requestedLimit : env.DEFAULT_PAGE_SIZE,
    env.MAX_PAGE_SIZE
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}
