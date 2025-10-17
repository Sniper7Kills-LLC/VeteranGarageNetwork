/**
 * List Public Chapters Resolver
 * Returns only approved chapters with optional geographic and club filtering
 * Access: Guest + Authenticated
 */

export function request(ctx) {
  const { minLat, maxLat, minLng, maxLng, clubIds } = ctx.args;
  
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
  
  // Add club filter if provided
  if (clubIds && clubIds.length > 0) {
    const clubConditions = clubIds.map((_, i) => `clubId = :clubId${i}`).join(' OR ');
    expression += ` AND (${clubConditions})`;
    clubIds.forEach((id, i) => {
      expressionValues[`:clubId${i}`] = { S: id };
    });
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
    console.error('Error listing public chapters:', ctx.error);
    return [];
  }
  
  return ctx.result.items || [];
}
