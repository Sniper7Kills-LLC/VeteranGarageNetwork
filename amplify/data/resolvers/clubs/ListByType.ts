/**
 * List approved clubs filtered by type and search query
 * Public access (guest + authenticated)
 * 
 * Arguments:
 *   - types: Array of club types to filter by (optional)
 *   - searchQuery: Search string for name or description (optional)
 *   - limit: Pagination limit (optional, default 1000)
 *   - nextToken: Pagination token (optional)
 * 
 * Returns: ClubConnection with pagination support
 */

export function request(ctx: any) {
  const { types, searchQuery, limit, nextToken } = ctx.args;
  
  // Start with approved filter
  const filters: any[] = [{ approved: { eq: true } }];
  
  // Add type filter if provided
  if (types && types.length > 0) {
    if (types.length === 1) {
      filters.push({ type: { eq: types[0] } });
    } else {
      filters.push({
        or: types.map((type: string) => ({ type: { eq: type } }))
      });
    }
  }
  
  // Add search filter if provided (searches name OR description)
  if (searchQuery && searchQuery.trim()) {
    filters.push({
      or: [
        { name: { contains: searchQuery.trim() } },
        { description: { contains: searchQuery.trim() } }
      ]
    });
  }
  
  // Combine all filters with AND logic
  const filter = filters.length > 1 ? { and: filters } : filters[0];
  
  return {
    operation: 'Scan',
    filter,
    limit: limit || 1000,
    nextToken: nextToken || undefined
  };
}

export function response(ctx: any) {
  return ctx.result.items || [];
}
