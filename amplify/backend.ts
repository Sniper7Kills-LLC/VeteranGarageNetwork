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
