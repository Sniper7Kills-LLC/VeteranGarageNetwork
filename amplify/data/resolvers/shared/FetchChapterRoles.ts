/**
 * Shared Resolver: Fetch roles for chapters
 * 
 * Input: ctx.prev.result should contain:
 *   - items: Array of chapters with 'id' field
 *   - nextToken: (optional) pagination token to preserve
 *   - scannedCount: (optional) count to preserve
 * 
 * Output: Chapters with nested roles array
 */

export function request(ctx: any) {
  const chapters = ctx.prev.result;
  
  if (!chapters || chapters.length === 0) {
    return { operation: 'Scan', limit: 0 };
  }
  
  // Get unique chapter IDs
  const chapterIds = chapters.map((chapter: any) => chapter.id);
  
  // Build filter expression
  const expressionNames: Record<string, string> = { '#chapterId': 'chapterId' };
  const expressionValues: Record<string, any> = {};
  
  if (chapterIds.length === 1) {
    expressionValues[':chapterId0'] = { S: chapterIds[0] };
    return {
      operation: 'Scan',
      filter: {
        expression: '#chapterId = :chapterId0',
        expressionNames,
        expressionValues
      }
    };
  } else {
    const expressions = chapterIds.map((id: any, index: number) => {
      expressionValues[`:chapterId${index}`] = { S: id };
      return `#chapterId = :chapterId${index}`;
    });
    
    return {
      operation: 'Scan',
      filter: {
        expression: `(${expressions.join(' OR ')})`,
        expressionNames,
        expressionValues
      }
    };
  }
}

export function response(ctx: any) {
  const chapters = ctx.prev.result;
  const roles = ctx.result.items || [];
  
  // Merge roles into chapters and return array
  return chapters.map((chapter: any) => ({
    ...chapter,
    roles: roles.filter((role: any) => role.chapterId === chapter.id)
  }));
}
