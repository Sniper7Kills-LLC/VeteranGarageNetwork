# Lambda Implementation Plan - Association Approval

## Executive Summary

This document outlines the implementation plan for Lambda functions to handle association approval in the VGN (Veteran Garage Network) application. Unlike simple data filtering (which uses VTL resolvers), association approval requires cross-table authorization checks that can only be accomplished with Lambda functions.

**Last Updated**: October 16, 2025

---

## Table of Contents

1. [Association Approval Requirements](#association-approval-requirements)
2. [Why Lambda Functions Are Required](#why-lambda-functions-are-required)
3. [Required Lambda Functions](#required-lambda-functions)
4. [Authorization Logic](#authorization-logic)
5. [Visibility Rules](#visibility-rules)
6. [Schema Changes](#schema-changes)
7. [Lambda Function Implementations](#lambda-function-implementations)
8. [Frontend Integration](#frontend-integration)
9. [Implementation Phases](#implementation-phases)
10. [Testing Strategy](#testing-strategy)

---

## Association Approval Requirements

### Current Problem

The current schema has three types of associations:

1. **ClubAssociation** (Shop ↔ Club)
2. **ChapterAssociation** (Shop ↔ Chapter)  
3. **EventChapterAssociation** (Event ↔ Chapter)

**Current Issues:**
- Associations default to `approved: true` (insecure)
- Only the association creator or admin can approve
- **Club/Chapter owners cannot approve associations with their entities**
- No visibility control for pending associations

### Required Behavior

**Approval Authority:**
- ✅ Club/Chapter owners can approve associations with their entities
- ✅ Admins can approve any association
- ✅ "approvers" group can approve any association
- ❌ Association creator cannot self-approve

**Visibility Rules:**
- Pending associations visible to:
  - Association owner (creator)
  - Club/Chapter owners (the entity being associated)
  - Admins
  - Approvers group
- Approved associations visible to everyone

**Default State:**
- New associations should default to `approved: false`
- Require explicit approval from authorized users

---

## Why Lambda Functions Are Required

### VTL Limitations

VTL resolvers **cannot** handle association approval because:

1. **Cross-table lookups**: Must check if user owns the Club/Chapter in a different table
2. **Complex authorization**: Need to verify ownership relationships across tables
3. **Conditional logic**: Different rules for different user types
4. **Update operations**: Need to modify records based on related table ownership

### Lambda Advantages

Lambda functions provide:
- ✅ Full DynamoDB query capabilities
- ✅ Cross-table authorization checks
- ✅ Complex conditional logic
- ✅ Proper error handling
- ✅ Detailed logging for debugging

---

## Required Lambda Functions

### 1. Approval Mutations

| Function Name | Purpose | Authorization |
|--------------|---------|---------------|
| `approveClubAssociation` | Approve shop-club association | Club owner, admin, approvers |
| `approveChapterAssociation` | Approve shop-chapter association | Chapter owner, admin, approvers |
| `approveEventChapterAssociation` | Approve event-chapter association | Chapter owner, admin, approvers |

### 2. Listing Queries

| Function Name | Purpose | Authorization |
|--------------|---------|---------------|
| `listPendingClubAssociations` | List pending club associations | Authenticated (filtered by visibility) |
| `listPendingChapterAssociations` | List pending chapter associations | Authenticated (filtered by visibility) |
| `listPendingEventAssociations` | List pending event associations | Authenticated (filtered by visibility) |

### 3. Rejection Mutations (Optional)

| Function Name | Purpose | Authorization |
|--------------|---------|---------------|
| `rejectClubAssociation` | Reject/delete club association | Same as approve |
| `rejectChapterAssociation` | Reject/delete chapter association | Same as approve |
| `rejectEventChapterAssociation` | Reject/delete event association | Same as approve |

---

## Authorization Logic

### Authorization Flow

```
User requests to approve association
    ↓
Extract user identity (userId, groups)
    ↓
Fetch association from DynamoDB
    ↓
Check authorization:
    - Is user in 'admin' group? → ALLOW
    - Is user in 'approvers' group? → ALLOW
    - Is user owner of the Club/Chapter? → ALLOW
    - Otherwise → DENY
    ↓
If authorized: Update association.approved = true
If not: Throw authorization error
```

### Authorization Checks

#### For ClubAssociation:

```typescript
async function canApproveClubAssociation(
  clubId: string,
  userId: string,
  userGroups: string[]
): Promise<boolean> {
  // Admin or approver can always approve
  if (userGroups.includes('admin') || userGroups.includes('approvers')) {
    return true;
  }
  
  // Check if user owns the club
  const clubTable = await findTableName('Club');
  const club = await getItem(clubTable, clubId);
  
  if (!club) return false;
  
  return club.owners?.includes(userId) || false;
}
```

#### For ChapterAssociation:

```typescript
async function canApproveChapterAssociation(
  chapterId: string,
  userId: string,
  userGroups: string[]
): Promise<boolean> {
  // Admin or approver can always approve
  if (userGroups.includes('admin') || userGroups.includes('approvers')) {
    return true;
  }
  
  // Check if user owns the chapter
  const chapterTable = await findTableName('ClubChapter');
  const chapter = await getItem(chapterTable, chapterId);
  
  if (!chapter) return false;
  
  return chapter.owners?.includes(userId) || false;
}
```

#### For EventChapterAssociation:

```typescript
async function canApproveEventAssociation(
  chapterId: string,
  userId: string,
  userGroups: string[]
): Promise<boolean> {
  // Same logic as ChapterAssociation
  return canApproveChapterAssociation(chapterId, userId, userGroups);
}
```

---

## Visibility Rules

### Visibility Logic

```typescript
async function canViewAssociation(
  association: any,
  userId: string,
  userGroups: string[]
): Promise<boolean> {
  // If approved, everyone can see it
  if (association.approved) {
    return true;
  }
  
  // For pending associations:
  
  // Admin or approver can see all
  if (userGroups.includes('admin') || userGroups.includes('approvers')) {
    return true;
  }
  
  // Association owner can see their own
  if (association.owner === userId) {
    return true;
  }
  
  // Club/Chapter owner can see associations with their entity
  const isEntityOwner = await checkEntityOwnership(
    association,
    userId
  );
  
  return isEntityOwner;
}
```

### Entity Ownership Check

```typescript
async function checkEntityOwnership(
  association: any,
  userId: string
): Promise<boolean> {
  // For ClubAssociation
  if (association.clubId) {
    const clubTable = await findTableName('Club');
    const club = await getItem(clubTable, association.clubId);
    if (club?.owners?.includes(userId)) return true;
  }
  
  // For ChapterAssociation or EventChapterAssociation
  if (association.chapterId) {
    const chapterTable = await findTableName('ClubChapter');
    const chapter = await getItem(chapterTable, association.chapterId);
    if (chapter?.owners?.includes(userId)) return true;
  }
  
  return false;
}
```

---

## Schema Changes

### Step 1: Update Association Models

**Change default approved value from `true` to `false`:**

```typescript
// Current (INSECURE)
ClubAssociation: a.model({
  approved: a.boolean().default(true),  // ⚠️ Change to false
  // ...
})

// Recommended (SECURE)
ClubAssociation: a.model({
  approved: a.boolean().default(false),  // ✅ Require approval
  // ...
})
```

**Note**: This is a documentation recommendation. Actual code changes should be made separately.

### Step 2: Add Custom Mutations

```typescript
const schema = a.schema({
  // ... existing models ...

  // ============================================================================
  // ASSOCIATION APPROVAL MUTATIONS
  // ============================================================================
  
  // Club Association Approval
  approveClubAssociation: a
    .mutation()
    .arguments({
      associationId: a.id().required()
    })
    .returns(a.json())
    .handler(a.handler.function(approveClubAssociationFunction))
    .authorization((allow) => [allow.authenticated()]),

  rejectClubAssociation: a
    .mutation()
    .arguments({
      associationId: a.id().required()
    })
    .returns(a.json())
    .handler(a.handler.function(rejectClubAssociationFunction))
    .authorization((allow) => [allow.authenticated()]),

  // Chapter Association Approval
  approveChapterAssociation: a
    .mutation()
    .arguments({
      associationId: a.id().required()
    })
    .returns(a.json())
    .handler(a.handler.function(approveChapterAssociationFunction))
    .authorization((allow) => [allow.authenticated()]),

  rejectChapterAssociation: a
    .mutation()
    .arguments({
      associationId: a.id().required()
    })
    .returns(a.json())
    .handler(a.handler.function(rejectChapterAssociationFunction))
    .authorization((allow) => [allow.authenticated()]),

  // Event Chapter Association Approval
  approveEventChapterAssociation: a
    .mutation()
    .arguments({
      associationId: a.id().required()
    })
    .returns(a.json())
    .handler(a.handler.function(approveEventChapterAssociationFunction))
    .authorization((allow) => [allow.authenticated()]),

  rejectEventChapterAssociation: a
    .mutation()
    .arguments({
      associationId: a.id().required()
    })
    .returns(a.json())
    .handler(a.handler.function(rejectEventChapterAssociationFunction))
    .authorization((allow) => [allow.authenticated()]),

  // ============================================================================
  // PENDING ASSOCIATIONS QUERIES
  // ============================================================================
  
  listPendingClubAssociations: a
    .query()
    .returns(a.json())
    .handler(a.handler.function(listPendingClubAssociationsFunction))
    .authorization((allow) => [allow.authenticated()]),

  listPendingChapterAssociations: a
    .query()
    .returns(a.json())
    .handler(a.handler.function(listPendingChapterAssociationsFunction))
    .authorization((allow) => [allow.authenticated()]),

  listPendingEventAssociations: a
    .query()
    .returns(a.json())
    .handler(a.handler.function(listPendingEventAssociationsFunction))
    .authorization((allow) => [allow.authenticated()]),
});
```

---

## Lambda Function Implementations

### Function 1: approveClubAssociation

```typescript
// amplify/functions/approveClubAssociation/handler.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Cache for table names
let tableCache: Record<string, string> = {};

async function findTableName(pattern: string): Promise<string> {
  if (tableCache[pattern]) {
    return tableCache[pattern];
  }
  
  const { ListTablesCommand } = await import("@aws-sdk/client-dynamodb");
  const result = await client.send(new ListTablesCommand({}));
  const tables = result.TableNames || [];
  
  const tableName = tables.find((name: string) => name.includes(pattern));
  if (!tableName) {
    throw new Error(`Table not found: ${pattern}`);
  }
  
  tableCache[pattern] = tableName;
  return tableName;
}

async function getItem(tableName: string, id: string) {
  const result = await docClient.send(new GetCommand({
    TableName: tableName,
    Key: { id }
  }));
  return result.Item;
}

async function canApproveClubAssociation(
  clubId: string,
  userId: string,
  userGroups: string[]
): Promise<boolean> {
  // Admin or approver can always approve
  if (userGroups.includes('admin') || userGroups.includes('approvers')) {
    return true;
  }
  
  // Check if user owns the club
  const clubTable = await findTableName('Club');
  const club = await getItem(clubTable, clubId);
  
  if (!club) return false;
  
  return club.owners?.includes(userId) || false;
}

export const handler = async (event: any) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    const { associationId } = event.arguments;
    const userId = event.identity?.sub;
    const userGroups = event.identity?.groups || [];
    
    if (!userId) {
      throw new Error('Unauthorized: User not authenticated');
    }
    
    if (!associationId) {
      throw new Error('Missing required argument: associationId');
    }
    
    // Get the association
    const associationTable = await findTableName('ClubAssociation');
    const association = await getItem(associationTable, associationId);
    
    if (!association) {
      throw new Error('Association not found');
    }
    
    // Check if already approved
    if (association.approved) {
      return {
        success: true,
        message: 'Association already approved',
        association
      };
    }
    
    // Check authorization
    const canApprove = await canApproveClubAssociation(
      association.clubId,
      userId,
      userGroups
    );
    
    if (!canApprove) {
      throw new Error('Unauthorized: You do not have permission to approve this association');
    }
    
    // Update association
    await docClient.send(new UpdateCommand({
      TableName: associationTable,
      Key: { id: associationId },
      UpdateExpression: 'SET approved = :approved, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':approved': true,
        ':updatedAt': new Date().toISOString()
      }
    }));
    
    console.log(`Association ${associationId} approved by user ${userId}`);
    
    return {
      success: true,
      message: 'Association approved successfully',
      associationId
    };
    
  } catch (error) {
    console.error('Error approving association:', error);
    throw error;
  }
};
```

### Function 2: listPendingClubAssociations

```typescript
// amplify/functions/listPendingClubAssociations/handler.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

let tableCache: Record<string, string> = {};

async function findTableName(pattern: string): Promise<string> {
  if (tableCache[pattern]) {
    return tableCache[pattern];
  }
  
  const { ListTablesCommand } = await import("@aws-sdk/client-dynamodb");
  const result = await client.send(new ListTablesCommand({}));
  const tables = result.TableNames || [];
  
  const tableName = tables.find((name: string) => name.includes(pattern));
  if (!tableName) {
    throw new Error(`Table not found: ${pattern}`);
  }
  
  tableCache[pattern] = tableName;
  return tableName;
}

async function getItem(tableName: string, id: string) {
  const result = await docClient.send(new GetCommand({
    TableName: tableName,
    Key: { id }
  }));
  return result.Item;
}

async function canViewAssociation(
  association: any,
  userId: string,
  userGroups: string[]
): Promise<boolean> {
  // Admin or approver can see all
  if (userGroups.includes('admin') || userGroups.includes('approvers')) {
    return true;
  }
  
  // Association owner can see their own
  if (association.owner === userId) {
    return true;
  }
  
  // Club owner can see associations with their club
  const clubTable = await findTableName('Club');
  const club = await getItem(clubTable, association.clubId);
  
  if (club?.owners?.includes(userId)) {
    return true;
  }
  
  return false;
}

export const handler = async (event: any) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    const userId = event.identity?.sub;
    const userGroups = event.identity?.groups || [];
    
    if (!userId) {
      throw new Error('Unauthorized: User not authenticated');
    }
    
    // Get all pending associations
    const associationTable = await findTableName('ClubAssociation');
    const result = await docClient.send(new ScanCommand({
      TableName: associationTable,
      FilterExpression: 'approved = :approved',
      ExpressionAttributeValues: {
        ':approved': false
      }
    }));
    
    const allAssociations = result.Items || [];
    
    // Filter based on visibility rules
    const visibleAssociations = [];
    
    for (const association of allAssociations) {
      const canView = await canViewAssociation(association, userId, userGroups);
      if (canView) {
        visibleAssociations.push(association);
      }
    }
    
    console.log(`User ${userId} can view ${visibleAssociations.length} of ${allAssociations.length} pending associations`);
    
    return {
      success: true,
      associations: visibleAssociations,
      count: visibleAssociations.length
    };
    
  } catch (error) {
    console.error('Error listing pending associations:', error);
    throw error;
  }
};
```

### Function 3: rejectClubAssociation

```typescript
// amplify/functions/rejectClubAssociation/handler.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Similar structure to approve function
// Check authorization, then delete the association

export const handler = async (event: any) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    const { associationId } = event.arguments;
    const userId = event.identity?.sub;
    const userGroups = event.identity?.groups || [];
    
    if (!userId) {
      throw new Error('Unauthorized: User not authenticated');
    }
    
    // Get association and check authorization (same as approve)
    // ...
    
    // Delete the association
    const associationTable = await findTableName('ClubAssociation');
    await docClient.send(new DeleteCommand({
      TableName: associationTable,
      Key: { id: associationId }
    }));
    
    console.log(`Association ${associationId} rejected/deleted by user ${userId}`);
    
    return {
      success: true,
      message: 'Association rejected successfully',
      associationId
    };
    
  } catch (error) {
    console.error('Error rejecting association:', error);
    throw error;
  }
};
```

---

## Frontend Integration

### Using Approval Mutations

```typescript
// In a component (e.g., PendingAssociations.tsx)
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/../amplify/data/resource';

const client = generateClient<Schema>();

async function handleApprove(associationId: string) {
  try {
    const result = await client.mutations.approveClubAssociation({
      associationId
    });
    
    if (result.data?.success) {
      toast.success('Association approved successfully');
      // Refresh list
      fetchPendingAssociations();
    }
  } catch (error) {
    console.error('Error approving association:', error);
    toast.error('Failed to approve association');
  }
}

async function handleReject(associationId: string) {
  try {
    const result = await client.mutations.rejectClubAssociation({
      associationId
    });
    
    if (result.data?.success) {
      toast.success('Association rejected');
      fetchPendingAssociations();
    }
  } catch (error) {
    console.error('Error rejecting association:', error);
    toast.error('Failed to reject association');
  }
}
```

### Listing Pending Associations

```typescript
async function fetchPendingAssociations() {
  try {
    const result = await client.queries.listPendingClubAssociations();
    
    if (result.data?.success) {
      setPendingAssociations(result.data.associations);
    }
  } catch (error) {
    console.error('Error fetching pending associations:', error);
  }
}
```

### UI Component Example

```typescript
function PendingAssociationsCard({ association }: { association: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{association.relationship}</CardTitle>
        <CardDescription>
          Shop: {association.shopName} → Club: {association.clubName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {association.details && (
          <p className="text-sm text-muted-foreground">{association.details}</p>
        )}
        
        <div className="flex gap-2 mt-4">
          <Button
            onClick={() => handleApprove(association.id)}
            variant="default"
          >
            Approve
          </Button>
          <Button
            onClick={() => handleReject(association.id)}
            variant="destructive"
          >
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## Implementation Phases

### Phase 1: Create Lambda Functions (Week 1)

**Tasks:**
1. Create function directories for all 9 functions
2. Implement handler.ts for each function
3. Create resource.ts configurations
4. Add package.json with dependencies
5. Install dependencies in each function directory

**Deliverables:**
- 9 Lambda function directories
- All handler implementations
- Resource configurations
- Dependencies installed

### Phase 2: Update Schema (Week 1)

**Tasks:**
1. Add custom mutations to schema
2. Add custom queries to schema
3. Import Lambda functions in schema
4. Register functions in backend.ts
5. Deploy to dev environment

**Deliverables:**
- Updated schema file
- Updated backend.ts
- Deployed functions

### Phase 3: Update Association Defaults (Week 2)

**Tasks:**
1. Change ClubAssociation default to `approved: false`
2. Change ChapterAssociation default to `approved: false`
3. Change EventChapterAssociation default to `approved: false`
4. Deploy schema changes
5. Test association creation

**Deliverables:**
- Updated association models
- Deployment verification
- Test results

### Phase 4: Frontend Integration (Week 2)

**Tasks:**
1. Create PendingAssociations component
2. Add to Approvals page or create new page
3. Implement approve/reject handlers
4. Add to club/chapter owner dashboards
5. Update association creation flows

**Deliverables:**
- New UI components
- Updated pages
- Integration tests

### Phase 5: Testing & Deployment (Week 3)

**Tasks:**
1. Test as association creator
2. Test as club/chapter owner
3. Test as admin
4. Test as approver
5. Security testing
6. Deploy to production

**Deliverables:**
- Test results
- Security audit
- Production deployment

---

## Testing Strategy

### Unit Tests (Lambda Level)

Test each Lambda function with:

```typescript
// Test approve function
const testEvent = {
  arguments: {
    associationId: 'test-assoc-123'
  },
  identity: {
    sub: 'user-123',
    groups: ['admin']
  }
};

// Should succeed for admin
const result = await handler(testEvent);
expect(result.success).toBe(true);

// Should fail for non-owner
const unauthorizedEvent = {
  arguments: { associationId: 'test-assoc-123' },
  identity: { sub: 'other-user', groups: [] }
};

await expect(handler(unauthorizedEvent)).rejects.toThrow('Unauthorized');
```

### Integration Tests

**Test Case 1: Club Owner Approves Association**
```typescript
// 1. Create shop (as user A)
// 2. Create club (as user B)
// 3. Create association (as user A, shop owner)
// 4. Verify association is pending
// 5. Approve as user B (club owner) - should succeed
// 6. Verify association is approved
```

**Test Case 2: Non-Owner Cannot Approve**
```typescript
// 1. Create association (pending)
// 2. Try to approve as random user - should fail
// 3. Verify association still pending
```

**Test Case 3: Visibility Rules**
```typescript
// 1. Create pending association
// 2. List as association owner - should see it
// 3. List as club owner - should see it
// 4. List as random user - should NOT see it
// 5. List as admin - should see it
```

### Security Tests

Verify:
- ✅ Non-owners cannot approve associations
- ✅ Pending associations not visible to unauthorized users
- ✅ Approved associations visible to everyone
- ✅ Admin/approvers can approve any association
- ✅ Club/chapter owners can only approve their own associations

---

## File Structure

```
amplify/
└── functions/
    ├── approveClubAssociation/
    │   ├── handler.ts
    │   ├── resource.ts
    │   ├── package.json
    │   └── tsconfig.json
    ├── approveChapterAssociation/
    │   ├── handler.ts
    │   ├── resource.ts
    │   ├── package.json
    │   └── tsconfig.json
    ├── approveEventChapterAssociation/
    │   ├── handler.ts
    │   ├── resource.ts
    │   ├── package.json
    │   └── tsconfig.json
    ├── rejectClubAssociation/
    │   ├── handler.ts
    │   ├── resource.ts
    │   ├── package.json
    │   └── tsconfig.json
    ├── rejectChapterAssociation/
    │   ├── handler.ts
    │   ├── resource.ts
    │   ├── package.json
    │   └── tsconfig.json
    ├── rejectEventChapterAssociation/
    │   ├── handler.ts
    │   ├── resource.ts
    │   ├── package.json
    │   └── tsconfig.json
    ├── listPendingClubAssociations/
    │   ├── handler.ts
    │   ├── resource.ts
    │   ├── package.json
    │   └── tsconfig.json
    ├── listPendingChapterAssociations/
    │   ├── handler.ts
    │   ├── resource.ts
    │   ├── package.json
    │   └── tsconfig.json
    └── listPendingEventAssociations/
        ├── handler.ts
        ├── resource.ts
        ├── package.json
        └── tsconfig.json
```

---

## Dependencies

Each function needs:

```json
{
  "name": "function-name",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.0.0",
    "@aws-sdk/lib-dynamodb": "^3.0.0"
  }
}
```

**Important**: Install dependencies in each function directory:
```bash
cd amplify/functions/approveClubAssociation
npm install
```

---

## Next Steps

1. **Review this plan** with the team
2. **Approve the implementation approach**
3. **Create Lambda functions** (Phase 1)
4. **Update schema** (Phase 2)
5. **Change association defaults** (Phase 3)
6. **Integrate frontend** (Phase 4)
7. **Test and deploy** (Phase 5)

---

## Summary

Association approval requires Lambda functions because:
- ✅ Cross-table authorization checks needed
- ✅ Complex visibility rules
- ✅ Cannot be done with VTL resolvers

Implementation includes:
- 9 Lambda functions (3 approve, 3 reject, 3 list)
- Schema updates with custom mutations
- Frontend integration for approval UI
- Comprehensive testing strategy

**Key Takeaway**: Lambda functions enable secure, flexible association approval that respects ownership across tables.

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-16 | System | Initial document creation |

---

**End of Document**
