/**
 * List all approved clubs
 * Public access (guest + authenticated)
 * 
 * Returns: ClubConnection with pagination support
 */

export function request(ctx: any) {
  const { limit, nextToken } = ctx.args;
  
  return {
    operation: 'Scan',
    filter: {
      approved: { eq: true }
    },
    limit: limit || 1000,
    nextToken: nextToken || undefined
  };
}

export function response(ctx: any) {
  return {
    items: ctx.result.items || [],
    nextToken: ctx.result.nextToken || null,
    scannedCount: ctx.result.scannedCount || 0
  };
}
