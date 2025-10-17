/**
 * List All Clubs Resolver
 * Returns all clubs with optional approved filter
 * Access: Admin only
 */

export function request(ctx) {
  // If approved filter is provided, use it
  if (ctx.args.approved !== null && ctx.args.approved !== undefined) {
    return {
      operation: 'Scan',
      filter: {
        expression: 'approved = :approved',
        expressionValues: {
          ':approved': { BOOL: ctx.args.approved }
        }
      }
    };
  }
  
  // Otherwise return all clubs
  return {
    operation: 'Scan'
  };
}

export function response(ctx) {
  if (ctx.error) {
    console.error('Error listing all clubs:', ctx.error);
    return [];
  }
  
  return ctx.result.items || [];
}
