/**
 * Get Public Club Resolver
 * Returns a single approved club by ID
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
    console.error('Error getting public club:', ctx.error);
    return null;
  }
  
  const item = ctx.result;
  
  // Only return if approved
  if (item && item.approved === true) {
    return item;
  }
  
  return null;
}
