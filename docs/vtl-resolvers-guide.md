# VTL Resolvers Guide

## Table of Contents
1. [What are VTL Resolvers?](#what-are-vtl-resolvers)
2. [Why Use VTL Resolvers?](#why-use-vtl-resolvers)
3. [VTL vs Lambda Functions](#vtl-vs-lambda-functions)
4. [VTL Resolver Structure](#vtl-resolver-structure)
5. [Common VTL Operations](#common-vtl-operations)
6. [DynamoDB Operations](#dynamodb-operations)
7. [Filtering and Conditions](#filtering-and-conditions)
8. [Working with Context](#working-with-context)
9. [Error Handling](#error-handling)
10. [Best Practices](#best-practices)
11. [Examples](#examples)

---

## What are VTL Resolvers?

**VTL (Velocity Template Language) Resolvers** are server-side templates used in AWS AppSync to transform GraphQL requests and responses. They act as the bridge between your GraphQL API and your data sources (like DynamoDB).

### Key Concepts:

- **Request Mapping**: Transforms the GraphQL request into a format your data source understands
- **Response Mapping**: Transforms the data source response back into GraphQL format
- **No Cold Starts**: VTL executes directly in AppSync without Lambda overhead
- **Declarative**: Define what you want, not how to do it

---

## Why Use VTL Resolvers?

### Advantages:

1. **Performance**: No Lambda cold starts, faster execution
2. **Cost**: No Lambda invocation charges
3. **Simplicity**: Perfect for straightforward data operations
4. **Built-in**: Native AppSync feature, no additional infrastructure
5. **Security**: Runs in AWS's secure environment

### When to Use VTL:

- ✅ Simple CRUD operations
- ✅ Basic filtering and sorting
- ✅ Array membership checks
- ✅ Geographic bounds filtering
- ✅ Field-level transformations

### When NOT to Use VTL:

- ❌ Complex business logic
- ❌ External API calls
- ❌ Multi-table joins
- ❌ Heavy data transformations
- ❌ Conditional logic with many branches

---

## VTL vs Lambda Functions

| Feature | VTL Resolver | Lambda Function |
|---------|-------------|-----------------|
| **Performance** | Faster (no cold start) | Slower (cold start) |
| **Cost** | Lower (no Lambda charges) | Higher (Lambda invocations) |
| **Complexity** | Simple operations only | Any complexity |
| **External APIs** | Not possible | Fully supported |
| **Learning Curve** | Moderate | Easier (standard code) |
| **Debugging** | Limited | Full debugging tools |
| **Best For** | Data filtering, simple queries | Business logic, integrations |

---

## VTL Resolver Structure

In AWS Amplify Gen 2, VTL resolvers are written as JavaScript/TypeScript files that export two functions:

```javascript
// amplify/data/resolvers/myResolver.js

/**
 * Request function - transforms GraphQL request to DynamoDB operation
 * @param {Object} ctx - Context object containing request data
 * @returns {Object} DynamoDB operation configuration
 */
export function request(ctx) {
  return {
    operation: 'Scan', // or 'Query', 'GetItem', 'PutItem', etc.
    // ... operation-specific parameters
  };
}

/**
 * Response function - transforms DynamoDB response to GraphQL format
 * @param {Object} ctx - Context object containing response data
 * @returns {any} Transformed data for GraphQL response
 */
export function response(ctx) {
  return ctx.result.items; // or ctx.result for single items
}
```

### Context Object (`ctx`):

The context object contains:
- `ctx.args` - GraphQL query arguments
- `ctx.identity` - User identity information (sub, groups, etc.)
- `ctx.source` - Parent object in nested queries
- `ctx.result` - Data source response (in response function)
- `ctx.error` - Error information if operation failed

---

## Common VTL Operations

### 1. Scan Operation (List All)

```javascript
export function request(ctx) {
  return {
    operation: 'Scan',
  };
}

export function response(ctx) {
  return ctx.result.items;
}
```

### 2. Query Operation (With Key)

```javascript
export function request(ctx) {
  return {
    operation: 'Query',
    query: {
      expression: 'clubId = :clubId',
      expressionValues: {
        ':clubId': { S: ctx.args.clubId }
      }
    }
  };
}

export function response(ctx) {
  return ctx.result.items;
}
```

### 3. GetItem Operation (Single Item)

```javascript
export function request(ctx) {
  return {
    operation: 'GetItem',
    key: {
      id: { S: ctx.args.id }
    }
  };
}

export function response(ctx) {
  return ctx.result;
}
```

### 4. PutItem Operation (Create/Update)

```javascript
export function request(ctx) {
  return {
    operation: 'PutItem',
    key: {
      id: { S: ctx.args.id }
    },
    attributeValues: {
      name: { S: ctx.args.name },
      description: { S: ctx.args.description }
    }
  };
}

export function response(ctx) {
  return ctx.result;
}
```

---

## DynamoDB Operations

### Available Operations:

1. **Scan** - Read all items (with optional filter)
2. **Query** - Read items by key (more efficient than Scan)
3. **GetItem** - Read single item by primary key
4. **PutItem** - Create or replace item
5. **UpdateItem** - Update specific attributes
6. **DeleteItem** - Delete item by key
7. **BatchGetItem** - Get multiple items
8. **BatchWriteItem** - Write multiple items

### DynamoDB Data Types:

- `S` - String
- `N` - Number
- `BOOL` - Boolean
- `L` - List
- `M` - Map
- `SS` - String Set
- `NS` - Number Set

---

## Filtering and Conditions

### Basic Filter

```javascript
export function request(ctx) {
  return {
    operation: 'Scan',
    filter: {
      expression: 'approved = :approved',
      expressionValues: {
        ':approved': { BOOL: true }
      }
    }
  };
}
```

### Multiple Conditions (AND)

```javascript
export function request(ctx) {
  return {
    operation: 'Scan',
    filter: {
      expression: 'approved = :approved AND #type = :type',
      expressionNames: {
        '#type': 'type' // Use expressionNames for reserved words
      },
      expressionValues: {
        ':approved': { BOOL: true },
        ':type': { S: 'MOTORCYCLE_CLUB' }
      }
    }
  };
}
```

### Array Contains Check

```javascript
export function request(ctx) {
  const userId = ctx.identity.sub;
  
  return {
    operation: 'Scan',
    filter: {
      expression: 'contains(#owners, :userId)',
      expressionNames: {
        '#owners': 'owners'
      },
      expressionValues: {
        ':userId': { S: userId }
      }
    }
  };
}
```

### Geographic Bounds Filter

```javascript
export function request(ctx) {
  return {
    operation: 'Scan',
    filter: {
      expression: 'latitude BETWEEN :minLat AND :maxLat AND longitude BETWEEN :minLng AND :maxLng',
      expressionValues: {
        ':minLat': { N: ctx.args.minLat.toString() },
        ':maxLat': { N: ctx.args.maxLat.toString() },
        ':minLng': { N: ctx.args.minLng.toString() },
        ':maxLng': { N: ctx.args.maxLng.toString() }
      }
    }
  };
}
```

### OR Conditions

```javascript
export function request(ctx) {
  return {
    operation: 'Scan',
    filter: {
      expression: '#type = :type1 OR #type = :type2',
      expressionNames: {
        '#type': 'type'
      },
      expressionValues: {
        ':type1': { S: 'MOTORCYCLE_CLUB' },
        ':type2': { S: 'RIDING_CLUB' }
      }
    }
  };
}
```

---

## Working with Context

### Accessing User Identity

```javascript
export function request(ctx) {
  const userId = ctx.identity.sub;
  const userGroups = ctx.identity.groups || [];
  const isAdmin = userGroups.includes('admin');
  
  // Use identity information in your logic
  return {
    operation: 'Scan',
    filter: {
      expression: 'contains(owners, :userId)',
      expressionValues: {
        ':userId': { S: userId }
      }
    }
  };
}
```

### Using Query Arguments

```javascript
export function request(ctx) {
  const { id, name, approved } = ctx.args;
  
  return {
    operation: 'GetItem',
    key: {
      id: { S: id }
    }
  };
}
```

### Conditional Logic in Response

```javascript
export function response(ctx) {
  const item = ctx.result;
  const userId = ctx.identity.sub;
  const isAdmin = ctx.identity.groups?.includes('admin');
  
  // Only return if approved, or if user is owner/admin
  if (item.approved) {
    return item;
  }
  
  if (isAdmin || item.owners?.includes(userId)) {
    return item;
  }
  
  return null;
}
```

---

## Error Handling

### Checking for Errors

```javascript
export function response(ctx) {
  if (ctx.error) {
    console.error('DynamoDB error:', ctx.error);
    return null;
  }
  
  return ctx.result.items;
}
```

### Returning Custom Errors

```javascript
export function response(ctx) {
  const item = ctx.result;
  
  if (!item) {
    throw new Error('Item not found');
  }
  
  if (!item.approved) {
    throw new Error('Item not approved');
  }
  
  return item;
}
```

### Handling Missing Data

```javascript
export function response(ctx) {
  const items = ctx.result.items || [];
  
  // Filter out null/undefined items
  return items.filter(item => item !== null && item !== undefined);
}
```

---

## Best Practices

### 1. Use Expression Names for Reserved Words

DynamoDB has reserved words (like `type`, `name`, `status`). Use expression names:

```javascript
filter: {
  expression: '#type = :type',
  expressionNames: {
    '#type': 'type'
  },
  expressionValues: {
    ':type': { S: 'MOTORCYCLE_CLUB' }
  }
}
```

### 2. Always Specify Data Types

```javascript
// ✅ Good
expressionValues: {
  ':approved': { BOOL: true },
  ':count': { N: '5' }
}

// ❌ Bad
expressionValues: {
  ':approved': true,
  ':count': 5
}
```

### 3. Handle Null/Undefined Values

```javascript
export function response(ctx) {
  const items = ctx.result.items || [];
  return items.filter(item => item !== null);
}
```

### 4. Use Pagination for Large Datasets

```javascript
export function request(ctx) {
  return {
    operation: 'Scan',
    limit: 100,
    nextToken: ctx.args.nextToken
  };
}

export function response(ctx) {
  return {
    items: ctx.result.items,
    nextToken: ctx.result.nextToken
  };
}
```

### 5. Keep Logic Simple

If your resolver needs complex logic, use a Lambda function instead.

### 6. Test with Different User Contexts

Test your resolvers with:
- Guest users (no identity)
- Authenticated users
- Admin users
- Resource owners

---

## Examples

### Example 1: List Approved Clubs

```javascript
// amplify/data/resolvers/listPublicClubs.js
export function request(ctx) {
  return {
    operation: 'Scan',
    filter: {
      expression: 'approved = :approved',
      expressionValues: {
        ':approved': { BOOL: true }
      }
    }
  };
}

export function response(ctx) {
  return ctx.result.items;
}
```

### Example 2: List User's Clubs

```javascript
// amplify/data/resolvers/listMyClubs.js
export function request(ctx) {
  const userId = ctx.identity.sub;
  
  return {
    operation: 'Scan',
    filter: {
      expression: 'contains(#owners, :userId)',
      expressionNames: {
        '#owners': 'owners'
      },
      expressionValues: {
        ':userId': { S: userId }
      }
    }
  };
}

export function response(ctx) {
  return ctx.result.items;
}
```

### Example 3: Get Approved Club by ID

```javascript
// amplify/data/resolvers/getPublicClub.js
export function request(ctx) {
  return {
    operation: 'GetItem',
    key: {
      id: { S: ctx.args.id }
    }
  };
}

export function response(ctx) {
  const item = ctx.result;
  
  // Only return if approved
  if (item && item.approved === true) {
    return item;
  }
  
  return null;
}
```

### Example 4: List Clubs by Type

```javascript
// amplify/data/resolvers/listClubsByType.js
export function request(ctx) {
  const clubType = ctx.args.type;
  
  return {
    operation: 'Scan',
    filter: {
      expression: 'approved = :approved AND #type = :type',
      expressionNames: {
        '#type': 'type'
      },
      expressionValues: {
        ':approved': { BOOL: true },
        ':type': { S: clubType }
      }
    }
  };
}

export function response(ctx) {
  return ctx.result.items;
}
```

### Example 5: List Chapters in Geographic Bounds

```javascript
// amplify/data/resolvers/listChaptersInBounds.js
export function request(ctx) {
  const { minLat, maxLat, minLng, maxLng } = ctx.args;
  
  return {
    operation: 'Scan',
    filter: {
      expression: 'approved = :approved AND latitude BETWEEN :minLat AND :maxLat AND longitude BETWEEN :minLng AND :maxLng',
      expressionValues: {
        ':approved': { BOOL: true },
        ':minLat': { N: minLat.toString() },
        ':maxLat': { N: maxLat.toString() },
        ':minLng': { N: minLng.toString() },
        ':maxLng': { N: maxLng.toString() }
      }
    }
  };
}

export function response(ctx) {
  return ctx.result.items;
}
```

### Example 6: Admin - List Unapproved Items

```javascript
// amplify/data/resolvers/listUnapprovedClubs.js
export function request(ctx) {
  return {
    operation: 'Scan',
    filter: {
      expression: 'approved = :approved',
      expressionValues: {
        ':approved': { BOOL: false }
      }
    }
  };
}

export function response(ctx) {
  return ctx.result.items;
}
```

---

## Integration with Amplify Gen 2

### Defining Custom Queries with VTL Resolvers

```typescript
// amplify/data/resource.ts
const schema = a.schema({
  Club: a.model({
    // ... model definition
  }),

  // Custom query using VTL resolver
  listPublicClubs: a
    .query()
    .returns(a.ref('Club').array())
    .handler(a.handler.custom({
      dataSource: 'ClubTable',
      entry: './resolvers/listPublicClubs.js'
    }))
    .authorization((allow) => [
      allow.guest(),
      allow.authenticated()
    ]),
});
```

### Using Custom Queries in Frontend

```typescript
// Frontend code
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/../amplify/data/resource';

const client = generateClient<Schema>();

// Use custom query
const { data: clubs } = await client.queries.listPublicClubs();
```

---

## Debugging Tips

### 1. Check CloudWatch Logs

VTL resolver logs appear in CloudWatch under your AppSync API logs.

### 2. Use Console Logging

```javascript
export function response(ctx) {
  console.log('Result:', JSON.stringify(ctx.result));
  return ctx.result.items;
}
```

### 3. Test in AppSync Console

Use the AWS AppSync console to test your resolvers with different inputs.

### 4. Validate Expression Syntax

Common mistakes:
- Missing expression names for reserved words
- Incorrect data type specifications
- Typos in expression values

---

## Summary

VTL resolvers are powerful tools for creating efficient, cost-effective GraphQL APIs with AWS AppSync. They're perfect for:

- ✅ Simple data filtering
- ✅ Authorization-based queries
- ✅ Geographic filtering
- ✅ Array membership checks
- ✅ Basic CRUD operations

For complex business logic, external integrations, or heavy data transformations, use Lambda functions instead.

**Key Takeaway**: Use VTL for simple, performance-critical operations. Use Lambda for everything else.
