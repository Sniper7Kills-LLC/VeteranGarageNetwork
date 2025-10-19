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
  const previousResult = ctx.prev.result;
  
  // Handle both array and connection type inputs
  const chapters = previousResult.items || previousResult;
  
  if (!chapters || chapters.length === 0) {
    return { operation: 'Scan', limit: 0 };
  }
  
  // Get unique chapter IDs
  const chapterIds = chapters.map((chapter: any) => chapter.id);
  
  // Build filter to fetch roles for these chapters
  const filter = chapterIds.length === 1
    ? { chapterId: { eq: chapterIds[0] } }
    : { or: chapterIds.map((id: any) => ({ chapterId: { eq: id } })) };
  
  return {
    operation: 'Scan',
    filter
  };
}

export function response(ctx: any) {
  const previousResult = ctx.prev.result;
  const roles = ctx.result.items || [];
  
  // Handle both array and connection type inputs
  const chapters = previousResult.items || previousResult;
  
  // Merge roles into chapters
  const chaptersWithRoles = chapters.map((chapter: any) => ({
    ...chapter,
    roles: roles.filter((role: any) => role.chapterId === chapter.id)
  }));
  
  // If previous result was a connection type, preserve pagination metadata
  if (previousResult.items) {
    return {
      items: chaptersWithRoles,
      nextToken: previousResult.nextToken || null,
      scannedCount: previousResult.scannedCount || 0
    };
  }
  
  // Otherwise return just the array
  return chaptersWithRoles;
}
