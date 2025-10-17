/**
 * Get Public Shop Resolver
 * Returns a single approved shop by ID
 * Access: Guest + Authenticated
 */

export function request(ctx) {
  return {
    operation: 'GetItem',
    key: {
      id: { S: ctx.args.id }
    }
  };
}

export function response(ctx) {
  if (ctx.error) {
    console.error('Error getting public shop:', ctx.error);
    return null;
  }
  
  const item = ctx.result;
  
  // Only return if approved
  if (item && item.approved === true) {
    return item;
  }
  
  return null;
}
