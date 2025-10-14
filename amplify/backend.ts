import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { getStats } from './functions/getStats/resource';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
export const backend = defineBackend({
  auth,
  data,
  storage,
  getStats,
});

// Add USER_POOL_ID environment variable to the Lambda function
backend.getStats.addEnvironment('USER_POOL_ID', backend.auth.resources.userPool.userPoolId);

// Grant the getStats function access to DynamoDB and Cognito
const getStatsPermissions = new PolicyStatement({
  effect: Effect.ALLOW,
  actions: [
    'dynamodb:ListTables',
    'dynamodb:Scan',
    'dynamodb:Query',
    'cognito-idp:ListUsers',
  ],
  resources: [
    '*', // DynamoDB tables
    backend.auth.resources.userPool.userPoolArn, // Cognito
  ],
});

backend.getStats.resources.lambda.addToRolePolicy(getStatsPermissions);

// Grant authenticated and unauthenticated identity pool roles permission to invoke the Lambda
// Note: We grant permission to invoke any Lambda in the account to avoid circular dependencies
// The actual authorization is handled by the AppSync resolver and the Lambda function's logic
const lambdaInvokePolicy = new PolicyStatement({
  effect: Effect.ALLOW,
  actions: ['lambda:InvokeFunction'],
  resources: ['*'], // Using wildcard to avoid circular dependency between auth and data stacks
});

backend.auth.resources.authenticatedUserIamRole.addToPrincipalPolicy(lambdaInvokePolicy);
backend.auth.resources.unauthenticatedUserIamRole.addToPrincipalPolicy(lambdaInvokePolicy);
