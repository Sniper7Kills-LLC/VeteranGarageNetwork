/**
 * List all approved clubs
 * Public access (guest + authenticated)
 * 
 * Returns: Array of approved clubs
 */

export function request(ctx) {
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
    nextToken: nextToken
  };
}

export function response(ctx) {
  return ctx.result.items || [];
}
