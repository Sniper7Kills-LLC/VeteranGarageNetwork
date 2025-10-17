/**
 * List Public Clubs Resolver
 * Returns only approved clubs
 * Access: Guest + Authenticated
 */

export function request(ctx) {
  return {
    operation: 'Scan',
    filter: {
      expression: 'approved = :approved',
      expressionValues: {
        ':approved': { BOOL: true }
      }
    }
  };
}

export function response(ctx) {
  if (ctx.error) {
    console.error('Error listing public clubs:', ctx.error);
    return [];
  }
  
  return ctx.result.items || [];
}
