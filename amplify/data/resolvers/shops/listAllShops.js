/**
 * List All Shops Resolver
 * Returns all shops with optional approved filter and geographic bounds
 * Access: Admin only
 */

export function request(ctx) {
  const { approved, minLat, maxLat, minLng, maxLng } = ctx.args;
  
  // Build filter expression
  let expression = '';
  const expressionValues = {};
  
  // Add optional approved filter
  if (approved !== null && approved !== undefined) {
    expression = 'approved = :approved';
    expressionValues[':approved'] = { BOOL: approved };
  }
  
  // Add geographic bounds if provided
  if (minLat !== null && minLat !== undefined && 
      maxLat !== null && maxLat !== undefined &&
      minLng !== null && minLng !== undefined &&
      maxLng !== null && maxLng !== undefined) {
    const geoExpression = 'latitude BETWEEN :minLat AND :maxLat AND longitude BETWEEN :minLng AND :maxLng';
    expression = expression ? `${expression} AND ${geoExpression}` : geoExpression;
    expressionValues[':minLat'] = { N: minLat.toString() };
    expressionValues[':maxLat'] = { N: maxLat.toString() };
    expressionValues[':minLng'] = { N: minLng.toString() };
    expressionValues[':maxLng'] = { N: maxLng.toString() };
  }
  
  // If no filters, return all shops
  if (!expression) {
    return {
      operation: 'Scan'
    };
  }
  
  return {
    operation: 'Scan',
    filter: {
      expression,
      expressionValues
    }
  };
}

export function response(ctx) {
  if (ctx.error) {
    console.error('Error listing all shops:', ctx.error);
    return [];
  }
  
  return ctx.result.items || [];
}
