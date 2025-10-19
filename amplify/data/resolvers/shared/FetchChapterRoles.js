/**
 * Shared Resolver: Fetch roles for chapters
 * 
 * Input: ctx.prev.result should contain array of chapters with 'id' field
 * 
 * Output: Chapters with nested roles array
 */

export function request(ctx) {
  const chapters = ctx.prev.result;
  
  if (!chapters || chapters.length === 0) {
    return { operation: 'Scan', limit: 0 };
  }
  
  // Get unique chapter IDs
  const chapterIds = chapters.map((chapter) => chapter.id);
  
  // Build filter expression
  const expressionNames = { '#chapterId': 'chapterId' };
  const expressionValues = {};
  
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
    const expressions = chapterIds.map((id, index) => {
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

export function response(ctx) {
  const chapters = ctx.prev.result;
  const roles = ctx.result.items || [];
  
  // Merge roles into chapters and return array
  return chapters.map((chapter) => ({
    ...chapter,
    roles: roles.filter((role) => role.chapterId === chapter.id)
  }));
}
