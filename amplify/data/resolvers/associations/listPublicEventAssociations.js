/**
 * List Public Event Associations Resolver
 * Returns only approved chapter associations for a specific event
 * Access: Guest + Authenticated
 */

export function request(ctx) {
  const { eventId } = ctx.args;
  
  return {
    operation: 'Scan',
    filter: {
      expression: 'approved = :approved AND eventId = :eventId',
      expressionValues: {
        ':approved': { BOOL: true },
        ':eventId': { S: eventId }
      }
    }
  };
}

export function response(ctx) {
  if (ctx.error) {
    console.error('Error listing public event associations:', ctx.error);
    return [];
  }
  
  return ctx.result.items || [];
}
