# Lambda Functions Guide for AWS Amplify Gen 2

## Table of Contents
1. [What are Lambda Functions?](#what-are-lambda-functions)
2. [Lambda vs VTL Resolvers](#lambda-vs-vtl-resolvers)
3. [When to Use Lambda Functions](#when-to-use-lambda-functions)
4. [Project Structure](#project-structure)
5. [Creating a Lambda Function](#creating-a-lambda-function)
6. [Dependencies Management](#dependencies-management)
7. [Environment Variables](#environment-variables)
8. [DynamoDB Operations](#dynamodb-operations)
9. [Cross-Table Queries](#cross-table-queries)
10. [Authorization Patterns](#authorization-patterns)
11. [Error Handling](#error-handling)
12. [Testing and Debugging](#testing-and-debugging)
13. [Best Practices](#best-practices)
14. [Examples](#examples)

---

## What are Lambda Functions?

**AWS Lambda functions** are serverless compute services that run your code in response to events. In the context of AWS Amplify Gen 2, Lambda functions can be used as:

- **Custom resolvers** for GraphQL queries and mutations
- **Business logic handlers** for complex operations
- **Data processors** for transformations and validations
- **Integration points** with external services

### Key Characteristics:

- **Serverless**: No server management required
- **Event-driven**: Triggered by API calls, database changes, etc.
- **Scalable**: Automatically scales with demand
- **Pay-per-use**: Only charged for execution time
- **Full programming capability**: Use any logic, libraries, or external APIs

---

## Lambda vs VTL Resolvers

| Feature | Lambda Function | VTL Resolver |
|---------|----------------|--------------|
| **Complexity** | Any complexity | Simple operations only |
| **Performance** | Cold start delay (~100-500ms) | No cold start (faster) |
| **Cost** | Per invocation + duration | No additional cost |
| **External APIs** | ✅ Fully supported | ❌ Not possible |
| **Multi-table queries** | ✅ Easy | ❌ Very difficult |
| **Business logic** | ✅ Full capability | ⚠️ Limited |
| **Dependencies** | ✅ Any npm package | ❌ None |
| **Debugging** | ✅ Full CloudWatch logs | ⚠️ Limited |
| **Testing** | ✅ Unit tests possible | ⚠️ Difficult |
| **Code reuse** | ✅ Easy | ❌ Limited |

### Decision Matrix:

**Use VTL when:**
- Simple filtering by field values
- Single-table operations
- No external dependencies
- Performance is critical
- Cost optimization is priority

**Use Lambda when:**
- Complex business logic
- Cross-table authorization checks
- External API integrations
- Data transformations
- Need full programming capabilities

---

## When to Use Lambda Functions

### Perfect Use Cases:

1. **Cross-Table Authorization**
   - Check if user owns a related resource
   - Verify permissions across multiple tables
   - Example: Approve association only if user owns the club

2. **Complex Business Logic**
   - Multi-step operations
   - Conditional workflows
   - Data validation with complex rules

3. **External Integrations**
   - Send emails via SendGrid/SES
   - Process payments via Stripe
   - Fetch data from third-party APIs

4. **Data Aggregation**
   - Calculate statistics across tables
   - Generate reports
   - Example: Your existing `getStats` function

5. **Batch Operations**
   - Process multiple records
   - Bulk updates
   - Data migrations

### Not Recommended For:

- ❌ Simple field filtering (use VTL)
- ❌ Basic CRUD operations (use VTL)
- ❌ High-frequency, low-latency operations (use VTL)

---

## Project Structure

### Amplify Gen 2 Lambda Structure:

```
amplify/
└── functions/
    ├── myFunction/
    │   ├── handler.ts          # Main function code
    │   ├── resource.ts         # Function configuration
    │   ├── package.json        # Dependencies
    │   ├── package-lock.json   # Dependency lock file
    │   └── tsconfig.json       # TypeScript config
    └── anotherFunction/
        ├── handler.ts
        ├── resource.ts
        └── package.json
```

### Key Files:

1. **handler.ts** - Your function logic
2. **resource.ts** - Amplify configuration (timeout, memory, env vars)
3. **package.json** - npm dependencies
4. **tsconfig.json** - TypeScript configuration

---

## Creating a Lambda Function

### Step 1: Create Function Directory

```bash
mkdir -p amplify/functions/myFunction
cd amplify/functions/myFunction
```

### Step 2: Create handler.ts

```typescript
// amplify/functions/myFunction/handler.ts
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

const dynamoClient = new DynamoDBClient({});

export const handler = async (event: any) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    // Your logic here
    const result = await performOperation(event);
    
    return result;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

async function performOperation(event: any) {
  // Implementation
  return { success: true };
}
```

### Step 3: Create resource.ts

```typescript
// amplify/functions/myFunction/resource.ts
import { defineFunction } from '@aws-amplify/backend';

export const myFunction = defineFunction({
  name: 'myFunction',
  entry: './handler.ts',
  timeoutSeconds: 30,
  memoryMB: 512,
  environment: {
    // Environment variables will be added here
  }
});
```

### Step 4: Create package.json

```json
{
  "name": "my-function",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.0.0"
  }
}
```

### Step 5: Install Dependencies

```bash
npm install
```

### Step 6: Register in backend.ts

```typescript
// amplify/backend.ts
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { myFunction } from './functions/myFunction/resource';

defineBackend({
  auth,
  data,
  myFunction
});
```

### Step 7: Use in Schema

```typescript
// amplify/data/resource.ts
import { myFunction } from '../functions/myFunction/resource';

const schema = a.schema({
  myCustomQuery: a
    .query()
    .returns(a.json())
    .handler(a.handler.function(myFunction))
    .authorization((allow) => [allow.authenticated()]),
});
```

---

## Dependencies Management

### Important: Each Function Has Its Own Dependencies

Unlike the main project, **each Lambda function has its own `package.json`** and dependencies.

### Why?

- Lambda functions are deployed independently
- Each function is packaged with its dependencies
- Keeps function size small and deployment fast
- Avoids dependency conflicts

### Example Structure:

```
amplify/functions/
├── getStats/
│   ├── handler.ts
│   ├── package.json          # Has @aws-sdk/client-dynamodb
│   └── package-lock.json
└── approveAssociation/
    ├── handler.ts
    ├── package.json          # Has @aws-sdk/client-dynamodb
    └── package-lock.json
```

### Common Dependencies:

```json
{
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.0.0",
    "@aws-sdk/lib-dynamodb": "^3.0.0",
    "@aws-sdk/client-cognito-identity-provider": "^3.0.0",
    "@aws-sdk/client-ses": "^3.0.0"
  }
}
```

### Installing Dependencies:

```bash
# Navigate to function directory
cd amplify/functions/myFunction

# Install dependencies
npm install @aws-sdk/client-dynamodb

# Or install from package.json
npm install
```

### Important Notes:

1. **Always run `npm install` in the function directory**, not the project root
2. **Dependencies are NOT shared** with the main project's `node_modules`
3. **Keep dependencies minimal** to reduce cold start time
4. **Use specific versions** to ensure consistency

---

## Environment Variables

### Setting Environment Variables:

```typescript
// amplify/functions/myFunction/resource.ts
import { defineFunction } from '@aws-amplify/backend';

export const myFunction = defineFunction({
  name: 'myFunction',
  entry: './handler.ts',
  environment: {
    TABLE_NAME: 'MyTable',
    API_KEY: 'secret-key',
  }
});
```

### Accessing in Handler:

```typescript
// amplify/functions/myFunction/handler.ts
export const handler = async (event: any) => {
  const tableName = process.env.TABLE_NAME;
  const apiKey = process.env.API_KEY;
  
  console.log('Table:', tableName);
  // Use variables...
};
```

### Dynamic Table Names:

Since Amplify generates table names dynamically, you need to find them:

```typescript
import { ListTablesCommand } from "@aws-sdk/client-dynamodb";

async function findTableName(pattern: string) {
  const listTablesCommand = new ListTablesCommand({});
  const result = await dynamoClient.send(listTablesCommand);
  const tables = result.TableNames || [];
  
  return tables.find((name: string) => name.includes(pattern));
}

// Usage
const clubTable = await findTableName('Club');
```

### Passing Table Names from Backend:

```typescript
// amplify/backend.ts
import { defineBackend } from '@aws-amplify/backend';
import { myFunction } from './functions/myFunction/resource';
import { data } from './data/resource';

const backend = defineBackend({
  auth,
  data,
  myFunction
});

// Grant access to data tables
backend.myFunction.resources.lambda.addEnvironment(
  'CLUB_TABLE_NAME',
  backend.data.resources.tables['Club'].tableName
);
```

---

## DynamoDB Operations

### Setup DynamoDB Client:

```typescript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, ScanCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
```

### Get Item:

```typescript
async function getItem(tableName: string, id: string) {
  const command = new GetCommand({
    TableName: tableName,
    Key: { id }
  });
  
  const result = await docClient.send(command);
  return result.Item;
}
```

### Put Item:

```typescript
async function putItem(tableName: string, item: any) {
  const command = new PutCommand({
    TableName: tableName,
    Item: item
  });
  
  await docClient.send(command);
}
```

### Update Item:

```typescript
async function updateItem(tableName: string, id: string, updates: any) {
  const command = new UpdateCommand({
    TableName: tableName,
    Key: { id },
    UpdateExpression: 'SET approved = :approved',
    ExpressionAttributeValues: {
      ':approved': true
    }
  });
  
  await docClient.send(command);
}
```

### Scan (List All):

```typescript
async function scanTable(tableName: string) {
  const command = new ScanCommand({
    TableName: tableName
  });
  
  const result = await docClient.send(command);
  return result.Items || [];
}
```

### Query (With Filter):

```typescript
async function queryByOwner(tableName: string, ownerId: string) {
  const command = new ScanCommand({
    TableName: tableName,
    FilterExpression: 'contains(#owners, :ownerId)',
    ExpressionAttributeNames: {
      '#owners': 'owners'
    },
    ExpressionAttributeValues: {
      ':ownerId': ownerId
    }
  });
  
  const result = await docClient.send(command);
  return result.Items || [];
}
```

---

## Cross-Table Queries

### Example: Check Club Ownership

```typescript
async function isClubOwner(clubId: string, userId: string): Promise<boolean> {
  const clubTable = await findTableName('Club');
  
  const command = new GetCommand({
    TableName: clubTable,
    Key: { id: clubId }
  });
  
  const result = await docClient.send(command);
  const club = result.Item;
  
  if (!club) return false;
  
  // Check if user is in owners array
  return club.owners?.includes(userId) || false;
}
```

### Example: Verify Association Ownership

```typescript
async function canApproveAssociation(
  associationId: string,
  userId: string,
  userGroups: string[]
): Promise<boolean> {
  // Admin can always approve
  if (userGroups.includes('admin') || userGroups.includes('approvers')) {
    return true;
  }
  
  // Get the association
  const associationTable = await findTableName('ClubAssociation');
  const association = await getItem(associationTable, associationId);
  
  if (!association) return false;
  
  // Check if user owns the club
  const isOwner = await isClubOwner(association.clubId, userId);
  
  return isOwner;
}
```

---

## Authorization Patterns

### Pattern 1: Extract User Identity

```typescript
export const handler = async (event: any) => {
  // Extract user identity from event
  const userId = event.identity?.sub;
  const userGroups = event.identity?.groups || [];
  
  if (!userId) {
    throw new Error('Unauthorized: No user identity');
  }
  
  // Use for authorization checks
  const canAccess = await checkPermission(userId, userGroups);
  
  if (!canAccess) {
    throw new Error('Unauthorized: Insufficient permissions');
  }
  
  // Proceed with operation
};
```

### Pattern 2: Group-Based Authorization

```typescript
function isAdmin(userGroups: string[]): boolean {
  return userGroups.includes('admin');
}

function isApprover(userGroups: string[]): boolean {
  return userGroups.includes('admin') || userGroups.includes('approvers');
}
```

### Pattern 3: Resource Ownership Check

```typescript
async function isResourceOwner(
  resourceType: 'Club' | 'Chapter' | 'Shop',
  resourceId: string,
  userId: string
): Promise<boolean> {
  const tableName = await findTableName(resourceType);
  const resource = await getItem(tableName, resourceId);
  
  if (!resource) return false;
  
  return resource.owners?.includes(userId) || false;
}
```

### Pattern 4: Combined Authorization

```typescript
async function canPerformAction(
  userId: string,
  userGroups: string[],
  resourceId: string
): Promise<boolean> {
  // Check if admin
  if (isAdmin(userGroups)) return true;
  
  // Check if approver
  if (isApprover(userGroups)) return true;
  
  // Check if owner
  const isOwner = await isResourceOwner('Club', resourceId, userId);
  if (isOwner) return true;
  
  return false;
}
```

---

## Error Handling

### Best Practices:

```typescript
export const handler = async (event: any) => {
  try {
    // Validate input
    if (!event.arguments?.id) {
      throw new Error('Missing required argument: id');
    }
    
    // Perform operation
    const result = await performOperation(event.arguments);
    
    return {
      success: true,
      data: result
    };
    
  } catch (error) {
    console.error('Error in handler:', error);
    
    // Return user-friendly error
    if (error instanceof Error) {
      throw new Error(`Operation failed: ${error.message}`);
    }
    
    throw new Error('An unexpected error occurred');
  }
};
```

### Error Types:

```typescript
class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

### Usage:

```typescript
if (!userId) {
  throw new UnauthorizedError('User not authenticated');
}

if (!resource) {
  throw new NotFoundError('Club');
}

if (!isValid(input)) {
  throw new ValidationError('Invalid input data');
}
```

---

## Testing and Debugging

### Local Testing:

```typescript
// test.ts
import { handler } from './handler';

const testEvent = {
  arguments: {
    id: 'test-id'
  },
  identity: {
    sub: 'user-123',
    groups: ['admin']
  }
};

handler(testEvent)
  .then(result => console.log('Result:', result))
  .catch(error => console.error('Error:', error));
```

### CloudWatch Logs:

```typescript
export const handler = async (event: any) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('User ID:', event.identity?.sub);
  console.log('Groups:', event.identity?.groups);
  
  const result = await performOperation(event);
  
  console.log('Result:', JSON.stringify(result, null, 2));
  
  return result;
};
```

### Debugging Tips:

1. **Use console.log liberally** - Logs appear in CloudWatch
2. **Log the entire event** - Understand what data you receive
3. **Log before errors** - Know where failures occur
4. **Use structured logging** - JSON format for easy parsing
5. **Test locally first** - Faster iteration

---

## Best Practices

### 1. Keep Functions Small and Focused

```typescript
// ✅ Good - Single responsibility
export const handler = async (event: any) => {
  return await approveClubAssociation(event);
};

// ❌ Bad - Multiple responsibilities
export const handler = async (event: any) => {
  if (event.action === 'approve') {
    // approve logic
  } else if (event.action === 'reject') {
    // reject logic
  } else if (event.action === 'list') {
    // list logic
  }
};
```

### 2. Validate Input Early

```typescript
export const handler = async (event: any) => {
  // Validate first
  const { id, action } = event.arguments;
  
  if (!id) throw new ValidationError('Missing id');
  if (!action) throw new ValidationError('Missing action');
  
  // Then proceed
  return await performAction(id, action);
};
```

### 3. Use TypeScript Types

```typescript
interface ApproveAssociationInput {
  associationId: string;
  approved: boolean;
}

interface ApproveAssociationOutput {
  success: boolean;
  association: any;
}

export const handler = async (
  event: { arguments: ApproveAssociationInput; identity: any }
): Promise<ApproveAssociationOutput> => {
  // Type-safe implementation
};
```

### 4. Cache Table Names

```typescript
let cachedTableNames: Record<string, string> = {};

async function getTableName(model: string): Promise<string> {
  if (cachedTableNames[model]) {
    return cachedTableNames[model];
  }
  
  const tableName = await findTableName(model);
  cachedTableNames[model] = tableName;
  
  return tableName;
}
```

### 5. Handle Pagination

```typescript
async function getAllItems(tableName: string) {
  const items: any[] = [];
  let lastEvaluatedKey: any = undefined;
  
  do {
    const command = new ScanCommand({
      TableName: tableName,
      ExclusiveStartKey: lastEvaluatedKey
    });
    
    const result = await docClient.send(command);
    items.push(...(result.Items || []));
    lastEvaluatedKey = result.LastEvaluatedKey;
    
  } while (lastEvaluatedKey);
  
  return items;
}
```

### 6. Use Environment Variables

```typescript
// ✅ Good
const tableName = process.env.CLUB_TABLE_NAME;

// ❌ Bad
const tableName = 'Club-dev-12345';
```

### 7. Implement Proper Error Handling

```typescript
try {
  const result = await operation();
  return { success: true, data: result };
} catch (error) {
  console.error('Operation failed:', error);
  
  if (error instanceof UnauthorizedError) {
    throw error; // Let GraphQL handle it
  }
  
  throw new Error('Internal server error');
}
```

---

## Examples

### Example 1: Get Stats (From Your Project)

```typescript
import { DynamoDBClient, ScanCommand, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { CognitoIdentityProviderClient, ListUsersCommand } from "@aws-sdk/client-cognito-identity-provider";

const dynamoClient = new DynamoDBClient({});
const cognitoClient = new CognitoIdentityProviderClient({});

let cachedTableNames: { chapterTable?: string; eventTable?: string } = {};

async function findTableNames() {
  if (cachedTableNames.chapterTable && cachedTableNames.eventTable) {
    return cachedTableNames;
  }

  const listTablesCommand = new ListTablesCommand({});
  const tablesResult = await dynamoClient.send(listTablesCommand);
  const tables = tablesResult.TableNames || [];

  const chapterTable = tables.find((name: string) => name.includes('ClubChapter'));
  const eventTable = tables.find((name: string) => name.includes('Event'));

  if (!chapterTable || !eventTable) {
    throw new Error(`Could not find required tables`);
  }

  cachedTableNames = { chapterTable, eventTable };
  return cachedTableNames;
}

export const handler = async () => {
  const userPoolId = process.env.USER_POOL_ID;

  if (!userPoolId) {
    throw new Error("Missing USER_POOL_ID environment variable");
  }

  const { chapterTable, eventTable } = await findTableNames();

  // Count chapters
  const chapterResult = await dynamoClient.send(new ScanCommand({
    TableName: chapterTable,
    Select: "COUNT",
  }));

  // Count events
  const eventResult = await dynamoClient.send(new ScanCommand({
    TableName: eventTable,
    Select: "COUNT",
  }));

  // Count users with pagination
  let memberCount = 0;
  let paginationToken: string | undefined = undefined;
  
  do {
    const userResult = await cognitoClient.send(new ListUsersCommand({
      UserPoolId: userPoolId,
      Limit: 60,
      PaginationToken: paginationToken,
    }));
    
    memberCount += userResult.Users?.length || 0;
    paginationToken = userResult.PaginationToken;
  } while (paginationToken);

  return {
    chapters: chapterResult.Count || 0,
    events: eventResult.Count || 0,
    members: memberCount,
    projects: 1337,
  };
};
```

### Example 2: Approve Club Association

```typescript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface ApproveInput {
  associationId: string;
}

export const handler = async (event: any) => {
  const { associationId } = event.arguments as ApproveInput;
  const userId = event.identity?.sub;
  const userGroups = event.identity?.groups || [];

  if (!userId) {
    throw new Error('Unauthorized: User not authenticated');
  }

  // Get association
  const associationTable = process.env.CLUB_ASSOCIATION_TABLE_NAME;
  const association = await docClient.send(new GetCommand({
    TableName: associationTable,
    Key: { id: associationId }
  }));

  if (!association.Item) {
    throw new Error('Association not found');
  }

  // Check authorization
  const canApprove = await checkApprovalPermission(
    association.Item.clubId,
    userId,
    userGroups
  );

  if (!canApprove) {
    throw new Error('Unauthorized: Cannot approve this association');
  }

  // Update association
  await docClient.send(new UpdateCommand({
    TableName: associationTable,
    Key: { id: associationId },
    UpdateExpression: 'SET approved = :approved',
    ExpressionAttributeValues: {
      ':approved': true
    }
  }));

  return {
    success: true,
    associationId
  };
};

async function checkApprovalPermission(
  clubId: string,
  userId: string,
  userGroups: string[]
): Promise<boolean> {
  // Admin or approver can always approve
  if (userGroups.includes('admin') || userGroups.includes('approvers')) {
    return true;
  }

  // Check if user owns the club
  const clubTable = process.env.CLUB_TABLE_NAME;
  const club = await docClient.send(new GetCommand({
    TableName: clubTable,
    Key: { id: clubId }
  }));

  if (!club.Item) return false;

  return club.Item.owners?.includes(userId) || false;
}
```

### Example 3: List Pending Associations

```typescript
export const handler = async (event: any) => {
  const userId = event.identity?.sub;
  const userGroups = event.identity?.groups || [];

  if (!userId) {
    throw new Error('Unauthorized');
  }

  const associationTable = process.env.CLUB_ASSOCIATION_TABLE_NAME;
  
  // Get all pending associations
  const result = await docClient.send(new ScanCommand({
    TableName: associationTable,
    FilterExpression: 'approved = :approved',
    ExpressionAttributeValues: {
      ':approved': false
    }
  }));

  const associations = result.Items || [];

  // Filter based on permissions
  const visibleAssociations = await filterVisibleAssociations(
    associations,
    userId,
    userGroups
  );

  return visibleAssociations;
};

async function filterVisibleAssociations(
  associations: any[],
  userId: string,
  userGroups: string[]
) {
  // Admin/approvers see all
  if (userGroups.includes('admin') || userGroups.includes('approvers')) {
    return associations;
  }

  // Filter to only associations where user is owner of club or association
  const visible = [];
  
  for (const assoc of associations) {
    // Check if user created the association
    if (assoc.owner === userId) {
      visible.push(assoc);
      continue;
    }

    // Check if user owns the club
    const isClubOwner = await checkClubOwnership(assoc.clubId, userId);
    if (isClubOwner) {
      visible.push(assoc);
    }
  }

  return visible;
}
```

---

## Summary

Lambda functions provide the flexibility and power needed for complex operations in AWS Amplify Gen 2:

- ✅ Use for complex business logic
- ✅ Use for cross-table authorization
- ✅ Use for external integrations
- ✅ Each function has its own dependencies
- ✅ Full programming capabilities
- ✅ Proper error handling is critical
- ✅ Test thoroughly before deployment

**Key Takeaway**: Lambda functions complement VTL resolvers. Use VTL for simple operations, Lambda for everything else.

---

## Additional Resources

- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [Amplify Gen 2 Functions](https://docs.amplify.aws/react/build-a-backend/functions/)
- [DynamoDB Document Client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-lib-dynamodb/)

---

**End of Guide**
