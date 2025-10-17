/**
 * List Public Events Resolver
 * Returns only approved events with optional geographic filtering
 * Access: Guest + Authenticated
 */

export function request(ctx) {
  const { minLat, maxLat, minLng, maxLng } = ctx.args;
  
  // Build filter expression
  let expression = 'approved = :approved';
  const expressionValues = {
    ':approved': { BOOL: true }
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
    console.error('Error listing public events:', ctx.error);
    return [];
  }
  
  return ctx.result.items || [];
}
