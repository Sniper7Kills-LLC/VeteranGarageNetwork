/**
 * List Public Club Associations Resolver
 * Returns only approved shop associations for a specific club
 * Access: Guest + Authenticated
 */

export function request(ctx) {
  const { clubId } = ctx.args;
  
  return {
    operation: 'Scan',
    filter: {
      expression: 'approved = :approved AND clubId = :clubId',
      expressionValues: {
        ':approved': { BOOL: true },
        ':clubId': { S: clubId }
      }
    }
  };
}

export function response(ctx) {
  if (ctx.error) {
    console.error('Error listing public club associations:', ctx.error);
    return [];
  }
  
  return ctx.result.items || [];
}
