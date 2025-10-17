/**
 * List My Events Resolver
 * Returns events owned by the authenticated user
 * Optionally filter by approved status and geographic bounds
 * Access: Authenticated only
 */

export function request(ctx) {
  const userId = ctx.identity.sub;
  const { approved, minLat, maxLat, minLng, maxLng } = ctx.args;
  
  // Build filter expression
  let expression = 'contains(#owners, :userId)';
  const expressionNames = {
    '#owners': 'owners'
  };
  const expressionValues = {
    ':userId': { S: userId }
  };
  
  // Add optional approved filter
  if (approved !== null && approved !== undefined) {
    expression += ' AND approved = :approved';
    expressionValues[':approved'] = { BOOL: approved };
  }
  
  // Add geographic bounds if provided
  if (minLat !== null && minLat !== undefined && 
      maxLat !== null && maxLat !== undefined &&
      minLng !== null && minLng !== undefined &&
      maxLng !== null && maxLng !== undefined) {
    expression += ' AND latitude BETWEEN :minLat AND :maxLat AND longitude BETWEEN :minLng AND :maxLng';
    expressionValues[':minLat'] = { N: minLat.toString() };
    expressionValues[':maxLat'] = { N: maxLat.toString() };
    expressionValues[':minLng'] = { N: minLng.toString() };
    expressionValues[':maxLng'] = { N: maxLng.toString() };
  }
  
  return {
    operation: 'Scan',
    filter: {
      expression,
      expressionNames,
      expressionValues
    }
  };
}

export function response(ctx) {
  if (ctx.error) {
    console.error('Error listing my events:', ctx.error);
    return [];
  }
  
  return ctx.result.items || [];
}
