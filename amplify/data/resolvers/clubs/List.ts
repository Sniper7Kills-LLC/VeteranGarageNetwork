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
      expression: '#approved = :approved',
      expressionNames: {
        '#approved': 'approved'
      },
      expressionValues: {
        ':approved': { BOOL: true }
      }
    },
    limit: limit || 1000,
    nextToken: nextToken || undefined
  };
}

export function response(ctx: any) {
  return ctx.result.items || [];
}
