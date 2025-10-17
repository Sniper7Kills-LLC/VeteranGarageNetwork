/**
 * List Unapproved Shops Resolver
 * Returns only unapproved shops for admin review
 * Optionally filter by geographic bounds
 * Access: Admin only
 */

export function request(ctx) {
  const { minLat, maxLat, minLng, maxLng } = ctx.args;
  
  // Build filter expression
  let expression = 'approved = :approved';
  const expressionValues = {
    ':approved': { BOOL: false }
  };
  
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
      expressionValues
    }
  };
}

export function response(ctx) {
  if (ctx.error) {
    console.error('Error listing unapproved shops:', ctx.error);
    return [];
  }
  
  return ctx.result.items || [];
}
