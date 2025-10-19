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
  
  // Build filter expression parts
  const expressions: string[] = ['#approved = :approved'];
  const expressionNames: Record<string, string> = { '#approved': 'approved' };
  const expressionValues: Record<string, any> = { ':approved': { BOOL: true } };
  
  // Add club ID filter (required)
  if (clubIds && clubIds.length > 0) {
    if (clubIds.length === 1) {
      expressions.push('#clubId = :clubId0');
      expressionNames['#clubId'] = 'clubId';
      expressionValues[':clubId0'] = { S: clubIds[0] };
    } else {
      const clubIdExpressions = clubIds.map((clubId: string, index: number) => {
        expressionValues[`:clubId${index}`] = { S: clubId };
        return `#clubId = :clubId${index}`;
      });
      expressions.push(`(${clubIdExpressions.join(' OR ')})`);
      expressionNames['#clubId'] = 'clubId';
    }
  }
  
  // Add geographic bounds filters if provided
  if (minLat !== undefined && maxLat !== undefined) {
    expressions.push('#latitude BETWEEN :minLat AND :maxLat');
    expressionNames['#latitude'] = 'latitude';
    expressionValues[':minLat'] = { N: minLat.toString() };
    expressionValues[':maxLat'] = { N: maxLat.toString() };
  }
  
  if (minLng !== undefined && maxLng !== undefined) {
    expressions.push('#longitude BETWEEN :minLng AND :maxLng');
    expressionNames['#longitude'] = 'longitude';
    expressionValues[':minLng'] = { N: minLng.toString() };
    expressionValues[':maxLng'] = { N: maxLng.toString() };
  }
  
  return {
    operation: 'Scan',
    filter: {
      expression: expressions.join(' AND '),
      expressionNames,
      expressionValues
    },
    limit: limit || 1000,
    nextToken: nextToken || undefined
  };
}

export function response(ctx: any) {
  // Return items array - will be passed to the next pipeline step (FetchChapterRoles)
  return ctx.result.items || [];
}
