/**
 * List Unapproved Clubs Resolver
 * Returns only unapproved clubs for admin review
 * Access: Admin only
 */

export function request(ctx) {
  return {
    operation: 'Scan',
    filter: {
      expression: 'approved = :approved',
      expressionValues: {
        ':approved': { BOOL: false }
      }
    }
  };
}

export function response(ctx) {
  if (ctx.error) {
    console.error('Error listing unapproved clubs:', ctx.error);
    return [];
  }
  
  return ctx.result.items || [];
}
