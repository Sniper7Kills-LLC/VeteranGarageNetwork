/**
 * List approved chapters with geographic bounds and club filters
 * Public access (guest + authenticated)
 * 
 * Arguments:
 *   - clubIds: Array of club IDs to filter by (required)
 *   - minLat: Minimum latitude for geographic bounds (optional)
 *   - maxLat: Maximum latitude for geographic bounds (optional)
 *   - minLng: Minimum longitude for geographic bounds (optional)
 *   - maxLng: Maximum longitude for geographic bounds (optional)
 *   - limit: Pagination limit (optional, default 1000)
 *   - nextToken: Pagination token (optional)
 * 
 * Returns: ChapterConnection with pagination support
 * Note: This is the first step in a pipeline. Next step will fetch roles.
 */

export function request(ctx: any) {
  const { clubIds, minLat, maxLat, minLng, maxLng, limit, nextToken } = ctx.args;
  
  // Start with approved filter
  const filters: any[] = [{ approved: { eq: true } }];
  
  // Add club ID filter (required)
  if (clubIds && clubIds.length > 0) {
    if (clubIds.length === 1) {
      filters.push({ clubId: { eq: clubIds[0] } });
    } else {
      filters.push({
        or: clubIds.map((clubId: string) => ({ clubId: { eq: clubId } }))
      });
    }
  }
  
  // Add geographic bounds filters if provided
  if (minLat !== undefined && maxLat !== undefined) {
    filters.push({
      latitude: { between: [minLat, maxLat] }
    });
  }
  
  if (minLng !== undefined && maxLng !== undefined) {
    filters.push({
      longitude: { between: [minLng, maxLng] }
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
  // Return connection type with pagination metadata
  // This will be passed to the next pipeline step (FetchChapterRoles)
  return {
    items: ctx.result.items || [],
    nextToken: ctx.result.nextToken || null,
    scannedCount: ctx.result.scannedCount || 0
  };
}
