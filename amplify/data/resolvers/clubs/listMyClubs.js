/**
 * List My Clubs Resolver
 * Returns clubs owned by the authenticated user
 * Optionally filter by approved status
 * Access: Authenticated only
 */

export function request(ctx) {
  const userId = ctx.identity.sub;
  
  // Build filter expression
  let expression = 'contains(#owners, :userId)';
  const expressionNames = {
    '#owners': 'owners'
  };
  const expressionValues = {
    ':userId': { S: userId }
  };
  
  // Add optional approved filter
  if (ctx.args.approved !== null && ctx.args.approved !== undefined) {
    expression += ' AND approved = :approved';
    expressionValues[':approved'] = { BOOL: ctx.args.approved };
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
    console.error('Error listing my clubs:', ctx.error);
    return [];
  }
  
  return ctx.result.items || [];
}
