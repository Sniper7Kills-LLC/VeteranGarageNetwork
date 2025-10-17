/**
 * List Public Club Chapters Resolver
 * Returns only approved chapters for a specific club
 * Access: Guest + Authenticated
 */

export function request(ctx) {
  const { clubId, minLat, maxLat, minLng, maxLng } = ctx.args;
  
  // Build filter expression
  let expression = 'approved = :approved AND clubId = :clubId';
  const expressionValues = {
    ':approved': { BOOL: true },
    ':clubId': { S: clubId }
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
    console.error('Error listing public club chapters:', ctx.error);
    return [];
  }
  
  return ctx.result.items || [];
}
