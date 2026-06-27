export type Pagination = {
  page: number;
  limit: number;
  skip: number;
};

export function parsePagination(
  searchParams: URLSearchParams,
  maxLimit = 50,
): Pagination {
  const page = Math.max(
    1,
    Number.parseInt(searchParams.get("page") || "1", 10),
  );
  const limit = Math.min(
    maxLimit,
    Math.max(1, Number.parseInt(searchParams.get("limit") || "20", 10)),
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}
