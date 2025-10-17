/**
 * List Public Chapter Associations Resolver
 * Returns only approved shop associations for a specific chapter
 * Access: Guest + Authenticated
 */

export function request(ctx) {
  const { chapterId } = ctx.args;
  
  return {
    operation: 'Scan',
    filter: {
      expression: 'approved = :approved AND chapterId = :chapterId',
      expressionValues: {
        ':approved': { BOOL: true },
        ':chapterId': { S: chapterId }
      }
    }
  };
}

export function response(ctx) {
  if (ctx.error) {
    console.error('Error listing public chapter associations:', ctx.error);
    return [];
  }
  
  return ctx.result.items || [];
}
