import { NextRequest } from "next/server";

export const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export type Page = { page: number; limit: number; from: number; to: number };

/**
 * Read `?page` / `?limit` off a request.
 *
 * Capped at MAX_PAGE_SIZE so a client can't ask for the whole table back and
 * undo the point of paginating. Callers pass `from`/`to` straight to
 * PostgREST's `.range()`, which is inclusive on both ends.
 */
export function readPage(req: NextRequest, fallbackSize = DEFAULT_PAGE_SIZE): Page {
  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(sp.get("limit")) || fallbackSize));
  const from = (page - 1) * limit;
  return { page, limit, from, to: from + limit - 1 };
}

export type Paged<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

/** Shape every paginated list endpoint returns, so the client can be generic. */
export function paged<T>(data: T[] | null, total: number | null, p: Page): Paged<T> {
  const t = total ?? 0;
  return {
    data: data ?? [],
    total: t,
    page: p.page,
    limit: p.limit,
    pages: Math.max(1, Math.ceil(t / p.limit)),
  };
}
