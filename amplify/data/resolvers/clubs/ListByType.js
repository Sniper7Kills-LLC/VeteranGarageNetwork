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
 * Returns: Array of approved clubs
 */

export function request(ctx) {
  const { types, searchQuery, limit, nextToken } = ctx.args;
  
  // Build filter expression parts
  const expressions = ['#approved = :approved'];
  const expressionNames = { '#approved': 'approved' };
  const expressionValues = { ':approved': { BOOL: true } };
  
  // Add type filter if provided
  if (types && types.length > 0) {
    if (types.length === 1) {
      expressions.push('#type = :type0');
      expressionNames['#type'] = 'type';
      expressionValues[':type0'] = { S: types[0] };
    } else {
      const typeExpressions = types.map((type, index) => {
        expressionValues[`:type${index}`] = { S: type };
        return `#type = :type${index}`;
      });
      expressions.push(`(${typeExpressions.join(' OR ')})`);
      expressionNames['#type'] = 'type';
    }
  }
  
  // Add search filter if provided (searches name OR description)
  if (searchQuery && searchQuery.trim()) {
    expressions.push('(contains(#name, :search) OR contains(#description, :search))');
    expressionNames['#name'] = 'name';
    expressionNames['#description'] = 'description';
    expressionValues[':search'] = { S: searchQuery.trim() };
  }
  
  return {
    operation: 'Scan',
    filter: {
      expression: expressions.join(' AND '),
      expressionNames,
      expressionValues
    },
    limit: limit || 1000,
    nextToken: nextToken
  };
}

export function response(ctx) {
  return ctx.result.items || [];
}
